<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswaMapel;
use App\Models\Guru;
use App\Models\JadwalMengajar;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class AbsensiSiswaMapelController extends Controller
{
    public function index(Request $request)
    {
        $selectedDate = $request->input('tanggal', Carbon::now()->format('Y-m-d'));
        $selectedJadwal = $request->input('id_jadwal');
        $selectedKelas = $request->input('id_kelas');
        $selectedGuru = $request->input('id_guru');

        // Ambil absensi yang ada untuk tanggal (filter jadwal jika ada)
        $query = AbsensiSiswaMapel::with(['siswa.kelas', 'jadwal', 'jadwal.guru', 'jadwal.mataPelajaran'])
            ->where('tanggal', $selectedDate);

        if ($selectedJadwal) $query->where('id_jadwal', $selectedJadwal);

        if ($selectedKelas) {
            $query->whereHas('siswa', function ($q) use ($selectedKelas) {
                $q->where('id_kelas', $selectedKelas);
            });
        }

        if ($selectedGuru) {
            $query->whereHas('jadwal', function ($q) use ($selectedGuru) {
                $q->where('id_guru', $selectedGuru);
            });
        }

        $existingAbsensi = $query->get();

        /**
         * Jika id_jadwal diberikan -> prioritas menampilkan semua siswa di kelas jadwal tersebut
         * Jika id_kelas diberikan (tapi tidak id_jadwal) -> tampilkan semua siswa di kelas
         * Jika tidak ada filter kelas/jadwal -> tampilkan hanya absensi existing
         */
        $students = collect();

        if ($selectedJadwal) {
            $jad = JadwalMengajar::with(['kelas.siswa'])->find($selectedJadwal);
            if ($jad && $jad->kelas) {
                $students = $jad->kelas->siswa; // collection siswa
            }
        } elseif ($selectedKelas) {
            $kelas = Kelas::with(['siswa'])->find($selectedKelas);
            if ($kelas) $students = $kelas->siswa;
        }

        // Build merged list: for each student (if we have students list) find existing attendance else placeholder.
        $absensiToSend = collect();

        if ($students->isNotEmpty()) {
            // map existing by id_siswa for O(1) lookup
            $mapExist = $existingAbsensi->keyBy('id_siswa');

            foreach ($students as $st) {
                if (isset($mapExist[$st->id_siswa])) {
                    $a = $mapExist[$st->id_siswa];
                    $absensiToSend->push($a);
                } else {
                    // placeholder: belum ada record untuk siswa ini pada tanggal terpilih
                    $absensiToSend->push((object)[
                        'id_absensi_mapel' => null,
                        'id_jadwal' => $selectedJadwal ?? null,
                        'id_siswa' => $st->id_siswa,
                        'nis' => $st->nis ?? '',
                        'siswa' => $st, // keep siswa info for frontend
                        'tanggal' => $selectedDate,
                        'status_kehadiran' => 'Belum Absen',
                        'jam_mulai' => null,
                        'jam_selesai' => null,
                        'metode_absen' => 'Manual',
                        'keterangan' => '',
                        'id_penginput_manual' => null,
                        'updated_at' => null,
                    ]);
                }
            }
        } else {
            // tidak ada daftar siswa (tidak memilih jadwal/kelas) -> kirim apa yang ada
            $absensiToSend = $existingAbsensi;
        }

        // buat opsi jadwal sesuai hari dari tanggal yg dipilih
        $hari = Carbon::parse($selectedDate)->locale('id')->isoFormat('dddd');
        $jadwals = JadwalMengajar::with(['kelas', 'mataPelajaran', 'guru'])
            ->where('hari', $hari)
            ->get();

        $jadwalOptions = $jadwals->map(function ($j) {
            $kelasLabel = $j->kelas ? ($j->kelas->tingkat . ' ' . ($j->kelas->jurusan ?? '')) : '';
            $mapelName = $j->mataPelajaran?->nama_mapel ?? '-';
            return [
                'value' => $j->id_jadwal,
                'label' => "{$j->hari}, {$j->jam_mulai}-{$j->jam_selesai} | {$mapelName} ({$kelasLabel})"
            ];
        })->values();

        $kelasOptions = Kelas::orderBy('tingkat')->orderBy('jurusan')->get()->map(function ($k) {
            return ['value' => $k->id_kelas, 'label' => trim(($k->tingkat ?? '') . ' ' . ($k->jurusan ?? ''))];
        })->values();

        $guruOptions = Guru::orderBy('nama_lengkap')->get()->map(function ($g) {
            return ['value' => $g->id_guru, 'label' => $g->nama_lengkap];
        })->values();

        // build pertemuan summary (sama seperti sebelumnya)
        $pertemuan = null;
        if ($selectedJadwal) {
            $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($selectedJadwal);
            if ($jad) {
                $pertemuan = [
                    'id_jadwal' => $jad->id_jadwal,
                    'mapel_name' => $jad->mataPelajaran?->nama_mapel,
                    'kelas_name' => trim(($jad->kelas?->tingkat ?? '') . ' ' . ($jad->kelas?->jurusan ?? '')),
                    'guru_name' => $jad->guru?->nama_lengkap,
                    'jam_mulai' => $jad->jam_mulai,
                    'jam_selesai' => $jad->jam_selesai,
                    'tanggal' => $selectedDate,
                    'total_siswa' => $jad->kelas ? ($jad->kelas->siswa()->count() ?? null) : null,
                    'locked' => false,
                ];
            }
        }

        // counts derived from $absensiToSend (treat 'Belum Absen' as special, not counted in hadir/izin/etc)
        $countsCollection = $absensiToSend->groupBy('status_kehadiran')->map->count();
        $summary = [
            'hadir' => $countsCollection->get('Hadir', 0),
            'izin' => $countsCollection->get('Izin', 0),
            'sakit' => $countsCollection->get('Sakit', 0),
            'alfa' => $countsCollection->get('Alfa', 0),
            'digantikan' => $countsCollection->get('Digantikan', 0),
            'tugas' => $countsCollection->get('Tugas', 0),
            'belum_absen' => $countsCollection->get('Belum Absen', 0),
            'total' => $absensiToSend->count(),
        ];

        $routes = [
            'store' => route('admin.absensi-siswa-mapel.store'),
            'import' => route('admin.absensi-siswa-mapel.import'),
            'export' => route('admin.absensi-siswa-mapel.export'),
            'lock' => route('admin.absensi-siswa-mapel.lock'),
        ];

        return Inertia::render('admin/AbsensiSiswaMapel/Index', [
            'absensi' => $absensiToSend->values(),
            'pertemuan' => $pertemuan,
            'jadwalOptions' => $jadwalOptions,
            'kelasOptions' => $kelasOptions,
            'guruOptions' => $guruOptions,
            'summary' => $summary,
            'filters' => [
                'tanggal' => $selectedDate,
                'id_jadwal' => $selectedJadwal,
                'id_kelas' => $selectedKelas,
                'id_guru' => $selectedGuru
            ],
            'canEdit' => (Auth::user()?->level === 'Admin' || Auth::user()?->level === 'Guru'),
            'routes' => $routes,
        ]);
    }


    public function store(Request $request)
    {
        $payload = $request->validate([
            'id_jadwal' => 'nullable|string|exists:tbl_jadwal_mengajar,id_jadwal',
            'tanggal' => 'required|date',
            'absensi' => 'required|array',
            'absensi.*.id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            'absensi.*.status_kehadiran' => 'required|in:Hadir,Sakit,Izin,Alfa,Tugas,Digantikan',
            'absensi.*.keterangan' => 'nullable|string|max:500',
            'absensi.*.id_absensi_mapel' => 'nullable|string',
        ]);

        $idJadwalFromPayload = $payload['id_jadwal'] ?? null;
        $tanggal = $payload['tanggal'];

        DB::beginTransaction();
        try {
            foreach ($payload['absensi'] as $item) {
                $targetJadwal = $idJadwalFromPayload;

                if (empty($targetJadwal) && !empty($item['id_absensi_mapel'])) {
                    $existing = AbsensiSiswaMapel::where('id_absensi_mapel', $item['id_absensi_mapel'])->first();
                    if ($existing) {
                        $targetJadwal = $existing->id_jadwal;
                    }
                }

                if (empty($targetJadwal)) {
                    throw new \Exception("Tidak dapat menyimpan absensi untuk siswa {$item['id_siswa']}: pilih Jadwal/Mapel terlebih dahulu.");
                }

                if (!empty($item['id_absensi_mapel'])) {
                    $existsKey = ['id_absensi_mapel' => $item['id_absensi_mapel']];
                } else {
                    $existsKey = [
                        'id_jadwal' => $targetJadwal,
                        'id_siswa' => $item['id_siswa'],
                        'tanggal' => $tanggal,
                    ];
                }

                AbsensiSiswaMapel::updateOrCreate(
                    $existsKey,
                    [
                        'id_absensi_mapel' => $item['id_absensi_mapel'] ?? (string) Str::uuid(),
                        'id_jadwal' => $targetJadwal,
                        'id_siswa' => $item['id_siswa'],
                        'tanggal' => $tanggal,
                        'status_kehadiran' => $item['status_kehadiran'],
                        'keterangan' => $item['keterangan'] ?? null,
                        'metode_absen' => $item['metode_absen'] ?? 'Manual',
                        'jam_mulai' => $item['jam_mulai'] ?? null,
                        'jam_selesai' => $item['jam_selesai'] ?? null,
                        'id_guru_pengganti' => $item['id_guru_pengganti'] ?? null,
                        'id_penginput_manual' => Auth::user()?->id_pengguna ?? Auth::id(),
                    ]
                );

                DB::table('tbl_log_aktivitas')->insert([
                    'id_pengguna' => Auth::user()?->id_pengguna ?? Auth::id(),
                    'aksi' => "Update absensi siswa ({$item['id_siswa']})",
                    'keterangan' => "Perubahan status => {$item['status_kehadiran']} pada jadwal {$targetJadwal} tanggal {$tanggal}",
                    'waktu' => now(),
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Absensi berhasil disimpan.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan absensi: ' . $e->getMessage());
        }
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'status' => 'nullable|in:Hadir,Sakit,Izin,Alfa,Tugas,Digantikan',
            'keterangan' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->ids as $id) {
                $a = AbsensiSiswaMapel::where('id_absensi_mapel', $id)->first();
                if (!$a) continue;
                if ($request->filled('status')) $a->status_kehadiran = $request->status;
                if ($request->filled('keterangan')) $a->keterangan = $request->keterangan;
                $a->save();
            }
            DB::commit();
            return redirect()->back()->with('success', 'Bulk update berhasil.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Bulk update gagal: ' . $e->getMessage());
        }
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        $row = 0;
        $errors = [];
        DB::beginTransaction();
        try {
            while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
                $row++;
                if ($row === 1) continue;
                $idSiswa = $data[0] ?? null;
                $status = $data[1] ?? null;
                if (!$idSiswa || !$status) {
                    $errors[] = "Baris $row: data tidak lengkap";
                    continue;
                }
                AbsensiSiswaMapel::updateOrCreate(
                    ['id_jadwal' => $request->id_jadwal, 'id_siswa' => $idSiswa, 'tanggal' => $request->tanggal],
                    [
                        'id_absensi_mapel' => (string) Str::uuid(),
                        'status_kehadiran' => $status,
                        'metode_absen' => 'Manual',
                        'id_penginput_manual' => Auth::user()?->id_pengguna ?? Auth::id(),
                    ]
                );
            }
            DB::commit();
            return redirect()->back()->with('success', 'Import selesai. ' . (count($errors) ? 'Ada beberapa baris bermasalah.' : ''));
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Import gagal: ' . $e->getMessage());
        } finally {
            if (is_resource($handle)) fclose($handle);
        }
    }

    public function export(Request $request)
    {
        // Accept type from query string or POST input
        $tanggal = $request->query('tanggal', $request->input('tanggal', null));
        $idJadwal = $request->query('id_jadwal', $request->input('id_jadwal', null));
        $type = strtolower($request->query('type', $request->input('type', 'csv')));
        $monthly = filter_var($request->query('monthly', $request->input('monthly', false)), FILTER_VALIDATE_BOOLEAN);

        if (empty($tanggal)) {
            return redirect()->back()->with('error', 'Parameter tanggal diperlukan untuk ekspor.');
        }

        // Normalize tanggal
        try {
            $dt = Carbon::parse($tanggal);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Format tanggal tidak valid.');
        }

        // CSV export (per-hari / filtered by jadwal optional)
        if ($type === 'csv') {
            $query = AbsensiSiswaMapel::with('siswa.kelas')->where('tanggal', $dt->format('Y-m-d'));
            if ($idJadwal) $query->where('id_jadwal', $idJadwal);
            $rows = $query->get();

            $filename = "absensi_{$dt->format('Ymd')}" . ($idJadwal ? "_{$idJadwal}" : '') . ".csv";

            $callback = function () use ($rows) {
                // prevent accidental extra output
                if (ob_get_level()) ob_end_clean();
                $handle = fopen('php://output', 'w');
                fputcsv($handle, ['NIS', 'Nama', 'Kelas', 'Status', 'Keterangan', 'Jam Masuk', 'Jam Pulang', 'Penginput', 'Terakhir Diubah']);
                foreach ($rows as $r) {
                    fputcsv($handle, [
                        $r->siswa->nis ?? '',
                        $r->siswa->nama_lengkap ?? '',
                        $r->siswa->kelas?->tingkat ? ($r->siswa->kelas->tingkat . ' ' . ($r->siswa->kelas->jurusan ?? '')) : ($r->siswa->kelas->nama_lengkap ?? ''),
                        $r->status_kehadiran,
                        $r->keterangan,
                        $r->jam_mulai,
                        $r->jam_selesai,
                        $r->id_penginput_manual,
                        $r->updated_at,
                    ]);
                }
                fclose($handle);
            };

            return response()->streamDownload($callback, $filename, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Pragma' => 'no-cache',
            ]);
        }

        // PDF export
        if ($type === 'pdf') {
            // monthly report
            if ($monthly) {
                if (empty($idJadwal)) {
                    return redirect()->back()->with('error', 'Untuk ekspor PDF bulanan, parameter id_jadwal (jadwal/mapel) diperlukan.');
                }

                $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($idJadwal);
                if (!$jad) {
                    return redirect()->back()->with('error', 'Jadwal tidak ditemukan untuk id_jadwal: ' . $idJadwal);
                }

                $month = $dt->month;
                $year = $dt->year;
                $lastDay = Carbon::createFromDate($year, $month, 1)->daysInMonth;

                // ambil attendance untuk jadwal dan bulan tersebut
                $attRows = AbsensiSiswaMapel::where('id_jadwal', $idJadwal)
                    ->whereYear('tanggal', $year)
                    ->whereMonth('tanggal', $month)
                    ->get()
                    ->groupBy('id_siswa');

                // ambil daftar siswa dari kelas jadwal, ordered
                $students = $jad->kelas?->siswa()->orderBy('nama_lengkap')->get() ?? collect();

                $rowsForPdf = [];
                foreach ($students as $st) {
                    $map = [];
                    for ($d = 1; $d <= $lastDay; $d++) $map[$d] = '';
                    $group = $attRows->get($st->id_siswa) ?? collect();
                    foreach ($group as $r) {
                        $day = Carbon::parse($r->tanggal)->day;
                        $map[$day] = $r->status_kehadiran ?? '';
                    }
                    $rowsForPdf[] = [
                        'nis' => $st->nis,
                        'nama' => $st->nama_lengkap,
                        'kelas' => $jad->kelas?->tingkat . ' ' . ($jad->kelas?->jurusan ?? ''),
                        'days' => $map,
                    ];
                }

                try {
                    $pdf = Pdf::loadView('admin.absensi.pdf_monthly', [
                        'jadwal' => $jad,
                        'tanggal' => $dt,
                        'rows' => $rowsForPdf,
                        'lastDay' => $lastDay,
                    ])->setPaper('a4', 'landscape');

                    $filename = "absensi_bulanan_{$jad->id_jadwal}_{$year}_{$month}.pdf";
                    return $pdf->download($filename);
                } catch (\Throwable $e) {
                    // don't expose stacktrace in production; return friendly message
                    return redirect()->back()->with('error', 'Gagal membuat PDF: ' . $e->getMessage());
                }
            }

            // per-pertemuan (single date)
            $query = AbsensiSiswaMapel::with('siswa.kelas')->where('tanggal', $dt->format('Y-m-d'));
            if ($idJadwal) $query->where('id_jadwal', $idJadwal);
            $rows = $query->get();

            $pertemuan = null;
            if ($idJadwal) {
                $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($idJadwal);
                if ($jad) {
                    $pertemuan = [
                        'mapel_name' => $jad->mataPelajaran?->nama_mapel,
                        'kelas_name' => trim(($jad->kelas?->tingkat ?? '') . ' ' . ($jad->kelas?->jurusan ?? '')),
                        'guru_name' => $jad->guru?->nama_lengkap,
                        'jam_mulai' => $jad->jam_mulai,
                        'jam_selesai' => $jad->jam_selesai,
                    ];
                }
            }

            try {
                $pdf = Pdf::loadView('admin.absensi.pdf_pertemuan', [
                    'rows' => $rows,
                    'tanggal' => $dt->format('Y-m-d'),
                    'pertemuan' => $pertemuan,
                ])->setPaper('a4', 'portrait');

                $filename = "absensi_{$dt->format('Ymd')}" . ($idJadwal ? "_{$idJadwal}" : '') . ".pdf";
                return $pdf->download($filename);
            } catch (\Throwable $e) {
                return redirect()->back()->with('error', 'Gagal membuat PDF: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('error', 'Tipe ekspor tidak dikenali atau parameter kurang.');
    }

    public function lock(Request $request)
    {
        $request->validate(['id_jadwal' => 'required|string', 'tanggal' => 'required|date']);

        DB::table('tbl_log_aktivitas')->insert([
            'id_pengguna' => Auth::user()?->id_pengguna ?? Auth::id(),
            'aksi' => 'Lock absensi',
            'keterangan' => "Kunci absensi jadwal {$request->id_jadwal} tanggal {$request->tanggal}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', 'Absensi dikunci (placeholder). Implementasi lock perlu penyesuaian DB.');
    }
}
