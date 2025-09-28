<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\AbsensiSiswa;
use App\Models\Pengaturan;
use App\Models\LogAktivitas;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Exports\AbsensiSiswaExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class AbsensiSiswaController extends Controller
{
    /* ============================================================
     * ------------------------  HARIAN  ---------------------------
     * ============================================================
     */

    public function index(Request $request)
    {
        $filters = $request->validate([
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'tanggal'  => 'nullable|date',
            'search'   => 'nullable|string',
        ]);

        $activeKelasId = $filters['id_kelas'] ?? Kelas::orderBy('tingkat')->first()?->id_kelas;
        $activeTanggal = Carbon::parse($filters['tanggal'] ?? now());
        $searchTerm    = $filters['search'] ?? '';

        $siswaDiKelas = Siswa::query()
            ->where('status', 'Aktif')
            ->when($activeKelasId, fn ($q) => $q->where('id_kelas', $activeKelasId))
            ->when($searchTerm, fn ($q) => $q->where(fn ($sq) =>
                $sq->where('nama_lengkap', 'like', "%{$searchTerm}%")
                   ->orWhere('nis', 'like', "%{$searchTerm}%")
            ))
            ->orderBy('nama_lengkap')
            ->get();

        $absensiSudahAda = AbsensiSiswa::whereIn('id_siswa', $siswaDiKelas->pluck('id_siswa'))
            ->whereDate('tanggal', $activeTanggal)
            ->get()
            ->keyBy('id_siswa');

        $jamMasukSekolah = Cache::remember('jam_masuk_siswa', now()->addHour(), function () {
            $pengaturan = Pengaturan::first();
            return $pengaturan->jam_masuk_siswa ?? '07:30:00';
        });

        $siswaWithAbsensi = $siswaDiKelas->map(function ($siswa) use ($absensiSudahAda, $jamMasukSekolah) {
            $absen = $absensiSudahAda->get($siswa->id_siswa);
            $siswa->absensi = $absen;

            if ($absen && $absen->status_kehadiran === 'Hadir' && $absen->jam_masuk) {
                try {
                    $jamMasukSiswa = Carbon::parse($absen->jam_masuk);
                    $batasMasuk    = Carbon::parse($jamMasukSekolah);
                    $selisihMenit  = $batasMasuk->diffInMinutes($jamMasukSiswa, false);
                    $absen->menit_keterlambatan = $selisihMenit > 0 ? $selisihMenit : 0;
                } catch (\Exception $e) {
                    Log::error("Gagal parse waktu untuk siswa {$siswa->id_siswa}: " . $e->getMessage());
                    $absen->menit_keterlambatan = 0;
                }
            }
            return $siswa;
        });

        $stats = [
            'total'         => $siswaWithAbsensi->count(),
            'hadir'         => $absensiSudahAda->where('status_kehadiran', 'Hadir')->count(),
            'sakit'         => $absensiSudahAda->where('status_kehadiran', 'Sakit')->count(),
            'izin'          => $absensiSudahAda->where('status_kehadiran', 'Izin')->count(),
            'alfa'          => $absensiSudahAda->where('status_kehadiran', 'Alfa')->count(),
            'terlambat'     => $siswaWithAbsensi->filter(fn ($s) => ($s->absensi->menit_keterlambatan ?? 0) > 0)->count(),
        ];
        $stats['belum_diinput'] = $stats['total'] - ($stats['hadir'] + $stats['sakit'] + $stats['izin'] + $stats['alfa']);

        return Inertia::render('admin/AbsensiSiswa/Index', [
            'kelasOptions'     => fn () => Kelas::orderBy('tingkat')->get(),
            'siswaWithAbsensi' => $siswaWithAbsensi,
            'stats'            => $stats,
            'filters'          => [
                'id_kelas' => $activeKelasId,
                'tanggal'  => $activeTanggal->toDateString(),
                'search'   => $searchTerm,
            ],
        ]);
    }

    public function storeManual(Request $request)
    {
        $validated = $request->validate([
            'id_siswa'         => 'required|string|exists:tbl_siswa,id_siswa',
            'tanggal'          => 'required|date',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa',
            'jam_masuk'        => 'nullable|date_format:H:i',
            'jam_pulang'       => 'nullable|date_format:H:i',
            'keterangan'       => 'nullable|string',
        ]);

        $menitKeterlambatan = null;

        if ($validated['status_kehadiran'] === 'Hadir' && !empty($validated['jam_masuk'])) {
            $jamMasukSekolahString = Pengaturan::first()->jam_masuk_siswa ?? '07:30:00';
            $jamMasukSekolah = Carbon::parse($jamMasukSekolahString);
            $jamAbsenSiswa   = Carbon::parse($validated['jam_masuk']);
            $selisihMenit    = $jamMasukSekolah->diffInMinutes($jamAbsenSiswa, false);
            $menitKeterlambatan = $selisihMenit > 0 ? $selisihMenit : 0;
        }

        AbsensiSiswa::updateOrCreate(
            [
                'id_siswa' => $validated['id_siswa'],
                'tanggal'  => $validated['tanggal'],
            ],
            [
                'id_absensi'          => 'AS-' . Carbon::parse($validated['tanggal'])->format('ymd') . '-' . $validated['id_siswa'],
                'status_kehadiran'    => $validated['status_kehadiran'],
                'jam_masuk'           => $validated['jam_masuk'],
                'jam_pulang'          => $validated['jam_pulang'],
                'menit_keterlambatan' => $menitKeterlambatan,
                'keterangan'          => $validated['keterangan'],
                'metode_absen'        => 'Manual',
                'id_penginput_manual' => Auth::id(),
            ]
        );

        return back()->with('success', 'Absensi siswa berhasil diperbarui.');
    }

    public function storeMassal(Request $request)
    {
        $validated = $request->validate([
            'tanggal'                 => 'required|date',
            'id_kelas'                => 'required|string|exists:tbl_kelas,id_kelas',
            'absensi'                 => 'required|array',
            'absensi.*.id_siswa'      => 'required|string|exists:tbl_siswa,id_siswa',
            'absensi.*.status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa',
        ]);

        $tanggalAbsen = Carbon::parse($validated['tanggal'])->toDateString();
        $adminId      = Auth::id();

        foreach ($validated['absensi'] as $data) {
            $absensi   = AbsensiSiswa::where('tanggal', $tanggalAbsen)
                ->where('id_siswa', $data['id_siswa'])
                ->first();

            $newStatus = $data['status_kehadiran'];

            if ($absensi) {
                $absensi->status_kehadiran    = $newStatus;
                $absensi->id_penginput_manual = $adminId;

                if ($newStatus !== 'Hadir') {
                    $absensi->jam_masuk           = null;
                    $absensi->menit_keterlambatan = 0;
                }

                $absensi->save();
            } else {
                AbsensiSiswa::create([
                    'id_absensi'          => 'AS-' . Carbon::parse($tanggalAbsen)->format('ymd') . '-' . $data['id_siswa'],
                    'id_siswa'            => $data['id_siswa'],
                    'tanggal'             => $tanggalAbsen,
                    'status_kehadiran'    => $newStatus,
                    'metode_absen'        => 'Manual',
                    'id_penginput_manual' => $adminId,
                    'jam_masuk'           => null,
                    'menit_keterlambatan' => 0,
                ]);
            }
        }

        return back()->with('success', 'Absensi massal berhasil diperbarui.');
    }

    public function updateIndividual(Request $request)
    {
        $validated = $request->validate([
            'tanggal'           => 'required|date',
            'id_siswa'          => 'required|string|exists:tbl_siswa,id_siswa',
            'status_kehadiran'  => 'required|string|in:Hadir,Sakit,Izin,Alfa',
            'jam_masuk'         => 'nullable|required_if:status_kehadiran,Hadir|date_format:H:i',
            'jam_pulang'        => 'nullable|date_format:H:i|after_or_equal:jam_masuk',
            'keterangan'        => 'nullable|string|max:255',
        ]);

        $tanggal = Carbon::parse($validated['tanggal'])->toDateString();
        $siswa   = Siswa::find($validated['id_siswa']);

        $absensi = AbsensiSiswa::firstOrNew([
            'id_siswa' => $validated['id_siswa'],
            'tanggal'  => $tanggal,
        ]);

        $statusLama = $absensi->exists ? $absensi->status_kehadiran : 'Belum Diinput';

        if (!$absensi->exists) {
            $absensi->id_absensi = 'AS-' . Carbon::parse($tanggal)->format('ymd') . '-' . $validated['id_siswa'];
        }

        $absensi->status_kehadiran    = $validated['status_kehadiran'];
        $absensi->keterangan          = $validated['keterangan'] ?? null;
        $absensi->metode_absen        = 'Manual';
        $absensi->id_penginput_manual = Auth::id();

        if ($validated['status_kehadiran'] === 'Hadir') {
            $absensi->jam_masuk  = $validated['jam_masuk'] ?? null;
            $absensi->jam_pulang = $validated['jam_pulang'] ?? null;

            $jamRef = Pengaturan::first()->jam_masuk_siswa ?? '07:30';
            if (!empty($absensi->jam_masuk)) {
                try {
                    $ref   = Carbon::parse($jamRef);
                    $masuk = Carbon::parse($absensi->jam_masuk);
                    $diff  = $ref->diffInMinutes($masuk, false);
                    $absensi->menit_keterlambatan = $diff > 0 ? $diff : 0;
                } catch (\Throwable $e) {
                    $absensi->menit_keterlambatan = 0;
                }
            } else {
                $absensi->menit_keterlambatan = 0;
            }
        } else {
            $absensi->jam_masuk           = null;
            $absensi->jam_pulang          = null;
            $absensi->menit_keterlambatan = 0;
        }

        $absensi->save();

        LogAktivitas::create([
            'id_pengguna' => Auth::id(),
            'aksi'        => 'Edit Absensi Individual',
            'keterangan'  => 'Admin (' . optional(Auth::user())->nama_lengkap . ') mengubah absensi '
                . optional($siswa)->nama_lengkap . ' ' . $tanggal . '. '
                . 'Status: ' . $statusLama . ' → ' . $absensi->status_kehadiran,
        ]);

        return back()->with('success', 'Absensi untuk siswa ' . optional($siswa)->nama_lengkap . ' berhasil diperbarui.');
    }

    public function exportExcel(Request $request)
    {
        $filters = $request->validate([
            'id_kelas' => 'nullable|string',
            'tanggal'  => 'required|date',
            'search'   => 'nullable|string',
        ]);

        $namaKelas = 'Semua-Kelas';
        if (!empty($filters['id_kelas'])) {
            $k = Kelas::find($filters['id_kelas']);
            $namaKelas = trim(($k->tingkat ?? '') . ' ' . ($k->jurusan ?? '')) ?: ($k->nama_kelas ?? 'Kelas');
        }
        $tanggal = Carbon::parse($filters['tanggal'])->format('d-m-Y');
        $fileName = "absensi-siswa-{$namaKelas}-{$tanggal}.xlsx";

        return Excel::download(new AbsensiSiswaExport($filters), $fileName);
    }

    public function exportPdf(Request $request)
    {
        $filters = $request->validate([
            'id_kelas' => 'required|string|exists:tbl_kelas,id_kelas',
            'tanggal'  => 'required|date',
            'search'   => 'nullable|string',
        ]);

        $data = Siswa::query()
            ->with(['absensi' => fn ($q) => $q->whereDate('tanggal', $filters['tanggal'])])
            ->where('id_kelas', $filters['id_kelas'])
            ->when($filters['search'], fn ($q, $s) => $q->where(fn ($sq) =>
                $sq->where('nama_lengkap', 'like', "%{$s}%")
                   ->orWhere('nis', 'like', "%{$s}%")
            ))
            ->orderBy('nama_lengkap')
            ->get();

        $kelas     = Kelas::find($filters['id_kelas']);
        $namaKelas = trim(($kelas->tingkat ?? '') . ' ' . ($kelas->jurusan ?? '')) ?: ($kelas->nama_kelas ?? 'Kelas');
        $tanggal   = Carbon::parse($filters['tanggal'])->toDateString();
        $fileName  = "absensi-siswa-{$namaKelas}-" . Carbon::parse($tanggal)->format('d-m-Y') . ".pdf";

        $pdf = Pdf::loadView('pdf.absensi_siswa_pdf', [
            'dataSiswa' => $data,
            'namaKelas' => $namaKelas,
            'tanggal'   => $tanggal,
        ]);

        return $pdf->download($fileName);
    }

    /* ============================================================
     * ------------------------  BULANAN  --------------------------
     * ============================================================
     */

    /** Hitung jumlah hari sekolah (Sen–Jum) antara $start..$end (inklusif). */
    private function countSchoolDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->endOfDay()) as $d) {
            // ISO: 6=Sabtu, 7=Minggu
            if (!in_array($d->dayOfWeekIso, [6, 7])) {
                $days++;
            }
        }
        return $days;
    }

    /** Ambil data rekap bulanan + ringkasan, sudah termasuk expected_total & persen_hadir akurat. */
    private function buildMonthlyRows(string $month, ?string $idKelas = null): array
    {
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endOfMonth = (clone $start)->endOfMonth();
        // bulan berjalan dibatasi sampai hari ini
        $end = $start->isSameMonth(now()) ? now() : $endOfMonth;

        $workdays = $this->countSchoolDays($start, $end);

        $rows = DB::table('tbl_kelas as k')
            ->leftJoin('tbl_siswa as s', function ($join) {
                $join->on('s.id_kelas', '=', 'k.id_kelas')
                     ->where('s.status', '=', 'Aktif');
            })
            ->leftJoin('tbl_absensi_siswa as a', function ($join) use ($start, $end) {
                $join->on('a.id_siswa', '=', 's.id_siswa')
                     ->whereBetween('a.tanggal', [$start->toDateString(), $end->toDateString()]);
            })
            ->when($idKelas, fn ($q) => $q->where('k.id_kelas', $idKelas))
            ->groupBy('k.id_kelas', 'k.tingkat', 'k.jurusan')
            ->orderBy('k.tingkat')
            ->selectRaw("
                k.id_kelas,
                CONCAT(k.tingkat, ' ', COALESCE(k.jurusan,'')) as nama_kelas,
                COUNT(DISTINCT s.id_siswa) as siswa_aktif,
                SUM(CASE WHEN a.status_kehadiran = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN a.status_kehadiran = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN a.status_kehadiran = 'Izin'  THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN a.status_kehadiran = 'Alfa'  THEN 1 ELSE 0 END) as alfa,
                AVG(CASE WHEN a.status_kehadiran='Hadir' THEN COALESCE(a.menit_keterlambatan,0) END) as rata_telat
            ")
            ->get()
            ->map(function ($r) use ($workdays) {
                $r->siswa_aktif   = (int)$r->siswa_aktif;
                $r->hadir         = (int)$r->hadir;
                $r->sakit         = (int)$r->sakit;
                $r->izin          = (int)$r->izin;
                $r->alfa          = (int)$r->alfa;
                $r->rata_telat    = is_null($r->rata_telat) ? 0 : round($r->rata_telat);

                $expected         = $r->siswa_aktif * $workdays; // total kesempatan absen
                $recorded         = $r->hadir + $r->sakit + $r->izin + $r->alfa;
                $belum            = max($expected - $recorded, 0);
                $persen           = $expected > 0 ? min(100, round(($r->hadir / $expected) * 100)) : 0;

                $r->expected_total = $expected;
                $r->belum_diinput  = $belum;
                $r->persen_hadir   = $persen;

                return $r;
            });

        // Ringkasan (untuk kartu di atas)
        $summary = [
            'hadir'         => $rows->sum('hadir'),
            'sakit'         => $rows->sum('sakit'),
            'izin'          => $rows->sum('izin'),
            'alfa'          => $rows->sum('alfa'),
            'expected'      => $rows->sum('expected_total'),
            'belum_diinput' => $rows->sum('belum_diinput'),
            'persen_hadir'  => (function ($rows) {
                $exp = $rows->sum('expected_total');
                $had = $rows->sum('hadir');
                return $exp > 0 ? min(100, round(($had / $exp) * 100)) : 0;
            })($rows),
        ];

        return [
            'rows'     => $rows,
            'summary'  => $summary,
            'workdays' => $workdays,
            'range'    => [$start->toDateString(), $end->toDateString()],
        ];
    }

    public function monthly(Request $request)
    {
        $request->validate([
            'month'    => 'nullable|date_format:Y-m',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
        ]);

        $month   = $request->input('month', now()->format('Y-m'));
        $idKelas = $request->input('id_kelas');

        $built = $this->buildMonthlyRows($month, $idKelas);

        return Inertia::render('admin/AbsensiSiswa/Monthly', [
            'filters'      => ['month' => $month, 'id_kelas' => $idKelas],
            'kelasOptions' => fn () => Kelas::orderBy('tingkat')->get(['id_kelas', 'tingkat', 'jurusan']),
            'rows'         => $built['rows'],
            'summary'      => $built['summary'],
            'meta'         => [
                'workdays' => $built['workdays'],
                'range'    => $built['range'],
            ],
            'featureMode'  => session('feature_mode', 'full'),
        ]);
    }

    public function exportMonthlyExcel(Request $request)
    {
        $request->validate([
            'month'    => 'required|date_format:Y-m',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
        ]);

        $month   = $request->input('month');
        $idKelas = $request->input('id_kelas');

        $built = $this->buildMonthlyRows($month, $idKelas);
        $rows  = $built['rows']->map(function ($r) {
            return [
                'nama_kelas'    => $r->nama_kelas,
                'siswa_aktif'   => $r->siswa_aktif,
                'hadir'         => $r->hadir,
                'sakit'         => $r->sakit,
                'izin'          => $r->izin,
                'alfa'          => $r->alfa,
                'belum_diinput' => $r->belum_diinput,
                'kehadiran_%'   => $r->persen_hadir,
                'rata_telat'    => $r->rata_telat,
            ];
        });

        $kelasLabel = $idKelas
            ? (Kelas::find($idKelas)?->tingkat . ' ' . (Kelas::find($idKelas)?->jurusan ?? ''))
            : 'Semua-Kelas';

        return Excel::download(
            new class($rows) implements \Maatwebsite\Excel\Concerns\FromArray, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
                public function __construct(public $rows) {}
                public function array(): array
                {
                    return $this->rows->map(fn ($r) => [
                        $r['nama_kelas'],
                        $r['siswa_aktif'],
                        $r['hadir'],
                        $r['sakit'],
                        $r['izin'],
                        $r['alfa'],
                        $r['belum_diinput'],
                        $r['kehadiran_%'],
                        $r['rata_telat'],
                    ])->toArray();
                }
                public function headings(): array
                {
                    return ['Kelas', 'Siswa Aktif', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Belum Diinput', 'Kehadiran (%)', 'Rata Telat (menit)'];
                }
            },
            "rekap-absensi-siswa-{$kelasLabel}-{$month}.xlsx"
        );
    }

    public function exportMonthlyPdf(Request $request)
    {
        $request->validate([
            'month'    => 'required|date_format:Y-m',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
        ]);

        $month   = $request->input('month');
        $idKelas = $request->input('id_kelas');

        $built = $this->buildMonthlyRows($month, $idKelas);

        $kelasLabel = $idKelas
            ? (Kelas::find($idKelas)?->tingkat . ' ' . (Kelas::find($idKelas)?->jurusan ?? ''))
            : 'Semua Kelas';

        $pdf = Pdf::loadView('pdf.absensi_siswa_bulanan', [
            'rows'    => $built['rows'],
            'month'   => $month,
            'kelas'   => $kelasLabel,
            'workdays'=> $built['workdays'],
            'range'   => $built['range'],
            'summary' => $built['summary'],
        ])->setPaper('a4', 'portrait');

        return $pdf->download("rekap-absensi-siswa-{$month}.pdf");
    }
}
