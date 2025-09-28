<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\TahunAjaran;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class AbsensiGuruController extends Controller
{
    /**
     * Menampilkan halaman utama manajemen absensi guru.
     */
    public function index(Request $request)
    {
        $filters = $request->all('tab','search','tanggal','bulan','tahun','id_tahun_ajaran');

        $filters['tab']      = $filters['tab']      ?? 'harian';
        $filters['tanggal']  = $filters['tanggal']  ?? now()->toDateString();
        $filters['bulan']    = $filters['bulan']    ?? now()->month;
        $filters['tahun']    = $filters['tahun']    ?? now()->year;

        $tahunAjaranOptions = TahunAjaran::orderBy('tahun_ajaran', 'desc')->get();

        return Inertia::render('admin/AbsensiGuru/Index', [
            'filters'            => $filters,
            'tahunAjaranOptions' => $tahunAjaranOptions,
            'absensiData'        => fn () => $this->getAbsensiHarian($filters),
            'stats'              => fn () => $this->getStatsHarian($filters),
            'guruBelumAbsen'     => fn () => $this->getGuruBelumAbsen($filters),
            'riwayatAbsensi'     => fn () => $this->getRiwayatAbsensi($filters),
            'laporanBulanan'     => fn () => $this->getLaporanBulanan($filters),
            'laporanSemesteran'  => fn () => $this->getLaporanSemesteran($filters),
            'chartData'          => fn () => $this->getChartData(),
        ]);
    }

    /**
     * Halaman detail riwayat per guru.
     */
    public function show(Request $request, Guru $guru)
    {
        $request->validate([
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2000',
        ]);

        $bulan = (int) $request->input('bulan', now()->month);
        $tahun = (int) $request->input('tahun', now()->year);

        $absensiHistory = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->orderBy('tanggal', 'desc')
            ->paginate(10)
            ->withQueryString();

        $rekapStatistik = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->selectRaw("
                SUM(CASE WHEN status_kehadiran = 'Hadir' THEN 1 ELSE 0 END)  AS hadir,
                SUM(CASE WHEN status_kehadiran = 'Sakit' THEN 1 ELSE 0 END)  AS sakit,
                SUM(CASE WHEN status_kehadiran = 'Izin'  THEN 1 ELSE 0 END)  AS izin,
                SUM(CASE WHEN status_kehadiran = 'Alfa'  THEN 1 ELSE 0 END)  AS alfa,
                SUM(CASE WHEN status_kehadiran = 'Dinas Luar' THEN 1 ELSE 0 END) AS dinas_luar,
                AVG(CASE WHEN status_kehadiran='Hadir' THEN COALESCE(menit_keterlambatan,0) END) AS rata_rata_telat
            ")
            ->first();

        return Inertia::render('admin/AbsensiGuru/Show', [
            'guru'           => $guru,
            'absensiHistory' => $absensiHistory,
            'rekapStatistik' => $rekapStatistik,
            'filters'        => ['bulan' => $bulan, 'tahun' => $tahun],
        ]);
    }

    // ====================== Private Data Builders ======================

    /**
     * Chart 7 hari terakhir (termasuk Dinas Luar).
     */
    private function getChartData()
    {
        $endDate   = Carbon::today();
        $startDate = Carbon::today()->subDays(6);

        $rows = AbsensiGuru::whereBetween('tanggal', [$startDate->toDateString(), $endDate->toDateString()])
            ->groupBy('tanggal')
            ->select(
                'tanggal',
                DB::raw("SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END)      AS hadir"),
                DB::raw("SUM(CASE WHEN status_kehadiran='Sakit' THEN 1 ELSE 0 END)      AS sakit"),
                DB::raw("SUM(CASE WHEN status_kehadiran='Izin' THEN 1 ELSE 0 END)       AS izin"),
                DB::raw("SUM(CASE WHEN status_kehadiran='Alfa' THEN 1 ELSE 0 END)       AS alfa"),
                DB::raw("SUM(CASE WHEN status_kehadiran='Dinas Luar' THEN 1 ELSE 0 END) AS dinas_luar")
            )
            ->orderBy('tanggal','asc')
            ->get();

        $labels     = [];
        $hadir      = [];
        $sakit      = [];
        $izin       = [];
        $alfa       = [];
        $dinasLuar  = [];

        for ($d = $startDate->copy(); $d <= $endDate; $d->addDay()) {
            $labels[] = $d->translatedFormat('d M');
            $rec = $rows->firstWhere('tanggal', $d->toDateString());
            $hadir[]     = $rec?->hadir      ?? 0;
            $sakit[]     = $rec?->sakit      ?? 0;
            $izin[]      = $rec?->izin       ?? 0;
            $alfa[]      = $rec?->alfa       ?? 0;
            $dinasLuar[] = $rec?->dinas_luar ?? 0;
        }

        return [
            'labels'   => $labels,
            'datasets' => [
                ['label' => 'Hadir',       'data' => $hadir,     'backgroundColor' => '#22c55e'],
                ['label' => 'Sakit',       'data' => $sakit,     'backgroundColor' => '#eab308'],
                ['label' => 'Izin',        'data' => $izin,      'backgroundColor' => '#3b82f6'],
                ['label' => 'Alfa',        'data' => $alfa,      'backgroundColor' => '#ef4444'],
                ['label' => 'Dinas Luar',  'data' => $dinasLuar, 'backgroundColor' => '#a855f7'],
            ],
        ];
    }

    private function getAbsensiHarian(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;

        return AbsensiGuru::with('guru')
            ->whereDate('tanggal', $filters['tanggal'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->whereHas('guru', fn($g) =>
                    $g->where('nama_lengkap', 'like', "%{$s}%")
                      ->orWhere('nip', 'like', "%{$s}%")
                );
            })
            ->get();
    }

    private function getStatsHarian(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;

        $absensi = $this->getAbsensiHarian($filters);

        return [
            'total_guru' => Guru::where('status','Aktif')->count(),
            'hadir'      => $absensi->where('status_kehadiran','Hadir')->count(),
            'izin'       => $absensi->where('status_kehadiran','Izin')->count(),
            'sakit'      => $absensi->where('status_kehadiran','Sakit')->count(),
            'alfa'       => $absensi->where('status_kehadiran','Alfa')->count(),
        ];
    }

    private function getGuruBelumAbsen(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;

        $sudahAbsenIds = AbsensiGuru::whereDate('tanggal', $filters['tanggal'])->pluck('id_guru');
        return Guru::where('status','Aktif')
            ->whereNotIn('id_guru', $sudahAbsenIds)
            ->get(['id_guru','nama_lengkap','nip']);
    }

    private function getRiwayatAbsensi(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'riwayat') return null;

        return AbsensiGuru::with('guru')
            ->whereBetween('tanggal', [now()->subDays(30)->toDateString(), now()->toDateString()])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->whereHas('guru', fn($g) =>
                    $g->where('nama_lengkap', 'like', "%{$s}%")
                      ->orWhere('nip', 'like', "%{$s}%")
                );
            })
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * Rekap bulanan per GURU:
     * - hadir, sakit, izin, alfa, dinas_luar
     * - persen_hadir (hadir / total status)
     * - rata_telat (AVG menit_keterlambatan untuk status Hadir)
     */
    private function getLaporanBulanan(array $filters)
    {
        if (empty($filters['bulan']) || empty($filters['tahun'])) return collect();

        $bulan = (int) $filters['bulan'];
        $tahun = (int) $filters['tahun'];

        // Ambil guru aktif + hitung masing2 status
        $gurus = Guru::where('status','Aktif')
            ->withCount([
                'absensi as hadir'       => fn($q) => $q->whereMonth('tanggal',$bulan)->whereYear('tanggal',$tahun)->where('status_kehadiran','Hadir'),
                'absensi as sakit'       => fn($q) => $q->whereMonth('tanggal',$bulan)->whereYear('tanggal',$tahun)->where('status_kehadiran','Sakit'),
                'absensi as izin'        => fn($q) => $q->whereMonth('tanggal',$bulan)->whereYear('tanggal',$tahun)->where('status_kehadiran','Izin'),
                'absensi as alfa'        => fn($q) => $q->whereMonth('tanggal',$bulan)->whereYear('tanggal',$tahun)->where('status_kehadiran','Alfa'),
                'absensi as dinas_luar'  => fn($q) => $q->whereMonth('tanggal',$bulan)->whereYear('tanggal',$tahun)->where('status_kehadiran','Dinas Luar'),
            ])
            ->get();

        // Rata telat per guru (hanya Hadir)
        $avgTelat = AbsensiGuru::select('id_guru', DB::raw("AVG(CASE WHEN status_kehadiran='Hadir' THEN COALESCE(menit_keterlambatan,0) END) AS avg_telat"))
            ->whereMonth('tanggal',$bulan)
            ->whereYear('tanggal',$tahun)
            ->groupBy('id_guru')
            ->pluck('avg_telat','id_guru');

        return $gurus->map(function($g) use ($avgTelat) {
            $total = (int)$g->hadir + (int)$g->sakit + (int)$g->izin + (int)$g->alfa + (int)$g->dinas_luar;
            $g->persen_hadir = $total > 0 ? round(($g->hadir / $total) * 100) : 0;
            $g->rata_telat   = round((float)($avgTelat[$g->id_guru] ?? 0));
            return $g;
        });
    }

    /**
     * Rekap semesteran per GURU – sama seperti bulanan tapi range tanggal dari TahunAjaran.
     */
    private function getLaporanSemesteran(array $filters)
    {
        if (empty($filters['id_tahun_ajaran'])) return collect();

        $ta = TahunAjaran::find($filters['id_tahun_ajaran']);
        if (!$ta) return collect();

        $tahunMulai = (int) explode('/', $ta->tahun_ajaran)[0];

        if ($ta->semester === 'Ganjil') {
            $start = Carbon::create($tahunMulai, 7, 1)->startOfMonth();
            $end   = Carbon::create($tahunMulai, 12, 31)->endOfMonth();
        } else {
            $start = Carbon::create($tahunMulai + 1, 1, 1)->startOfMonth();
            $end   = Carbon::create($tahunMulai + 1, 6, 30)->endOfMonth();
        }

        $gurus = Guru::where('status','Aktif')
            ->withCount([
                'absensi as hadir'      => fn($q) => $q->whereBetween('tanggal', [$start, $end])->where('status_kehadiran','Hadir'),
                'absensi as sakit'      => fn($q) => $q->whereBetween('tanggal', [$start, $end])->where('status_kehadiran','Sakit'),
                'absensi as izin'       => fn($q) => $q->whereBetween('tanggal', [$start, $end])->where('status_kehadiran','Izin'),
                'absensi as alfa'       => fn($q) => $q->whereBetween('tanggal', [$start, $end])->where('status_kehadiran','Alfa'),
                'absensi as dinas_luar' => fn($q) => $q->whereBetween('tanggal', [$start, $end])->where('status_kehadiran','Dinas Luar'),
            ])
            ->get();

        $avgTelat = AbsensiGuru::select('id_guru', DB::raw("AVG(CASE WHEN status_kehadiran='Hadir' THEN COALESCE(menit_keterlambatan,0) END) AS avg_telat"))
            ->whereBetween('tanggal', [$start, $end])
            ->groupBy('id_guru')
            ->pluck('avg_telat','id_guru');

        return $gurus->map(function($g) use ($avgTelat) {
            $total = (int)$g->hadir + (int)$g->sakit + (int)$g->izin + (int)$g->alfa + (int)$g->dinas_luar;
            $g->persen_hadir = $total > 0 ? round(($g->hadir / $total) * 100) : 0;
            $g->rata_telat   = round((float)($avgTelat[$g->id_guru] ?? 0));
            return $g;
        });
    }

    // =========================== Actions ===========================

    /**
     * Simpan / update absensi manual harian guru.
     * - Hitung keterlambatan pakai Pengaturan::jam_masuk_guru (fallback '07:30').
     */
    public function store(Request $request)
    {
        $request->validate([
            'tanggal'          => 'required|date',
            'id_guru'          => 'required|exists:tbl_guru,id_guru',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa,Dinas Luar',
            'jam_masuk'        => 'nullable|required_if:status_kehadiran,Hadir|date_format:H:i',
            'jam_pulang'       => 'nullable|date_format:H:i|after_or_equal:jam_masuk',
            'keterangan'       => 'nullable|string|max:255',
        ]);

        $jamRefString = optional(Pengaturan::first())->jam_masuk_guru ?: '07:30';
        $menitTelat   = null;

        if ($request->status_kehadiran === 'Hadir' && $request->jam_masuk) {
            try {
                $ref   = Carbon::parse($jamRefString);
                $masuk = Carbon::parse($request->jam_masuk);
                $diff  = $ref->diffInMinutes($masuk, false);
                $menitTelat = $diff > 0 ? $diff : 0;
            } catch (\Throwable $e) {
                $menitTelat = 0;
            }
        }

        AbsensiGuru::updateOrCreate(
            ['id_guru' => $request->id_guru, 'tanggal' => $request->tanggal],
            [
                'id_absensi'          => 'AG-' . Carbon::parse($request->tanggal)->format('ymd') . '-' . $request->id_guru,
                'status_kehadiran'    => $request->status_kehadiran,
                'jam_masuk'           => $request->status_kehadiran === 'Hadir' ? $request->jam_masuk  : null,
                'jam_pulang'          => $request->status_kehadiran === 'Hadir' ? $request->jam_pulang : null,
                'keterangan'          => $request->keterangan,
                'metode_absen'        => 'Manual',
                'id_penginput_manual' => Auth::id(),
                'menit_keterlambatan' => $menitTelat,
            ]
        );

        return back()->with('success', 'Absensi manual berhasil disimpan.');
    }

    /**
     * Ekspor Excel untuk rekap bulanan/semester (PDF biarkan yang kamu punya).
     */
    public function exportExcel(Request $request)
    {
        $tab = $request->get('tab'); // opsional, dari UI tidak selalu dikirim

        // Tentukan sumber data sesuai parameter
        if ($request->has(['bulan','tahun'])) {
            $rows = $this->getLaporanBulanan($request->all());
            $periode = sprintf('%02d-%d', (int)$request->get('bulan'), (int)$request->get('tahun'));
            $filename = "laporan_absensi_guru_bulanan_{$periode}.xlsx";
        } elseif ($request->has('id_tahun_ajaran')) {
            $rows = $this->getLaporanSemesteran($request->all());
            $ta   = TahunAjaran::find($request->get('id_tahun_ajaran'));
            $periode = $ta ? ($ta->tahun_ajaran . '_' . $ta->semester) : 'semester';
            $filename = "laporan_absensi_guru_semester_{$periode}.xlsx";
        } else {
            return back()->with('error', 'Pilih periode (bulan/tahun atau tahun ajaran) terlebih dahulu.');
        }

        // Mapping data → array untuk Excel
        $arrayRows = $rows->map(function($g) {
            return [
                'Nama Guru'        => $g->nama_lengkap,
                'Hadir'            => (int) $g->hadir,
                'Sakit'            => (int) $g->sakit,
                'Izin'             => (int) $g->izin,
                'Alfa'             => (int) $g->alfa,
                'Dinas Luar'       => (int) $g->dinas_luar,
                'Kehadiran (%)'    => (int) $g->persen_hadir,
                'Rata Telat (mnt)' => (int) $g->rata_telat,
            ];
        })->toArray();

        // Ekspor cepat tanpa class terpisah
        return Excel::download(
            new class($arrayRows) implements \Maatwebsite\Excel\Concerns\FromArray, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
                public function __construct(private array $rows) {}
                public function array(): array { return array_values($this->rows); }
                public function headings(): array { return array_keys($this->rows[0] ?? [
                    'Nama Guru','Hadir','Sakit','Izin','Alfa','Dinas Luar','Kehadiran (%)','Rata Telat (mnt)'
                ]); }
            },
            $filename
        );
    }

    /**
     * Ekspor PDF – biarkan versi kamu (tidak diubah di patch ini).
     */
    public function exportPdf(Request $request)
    {
        // ← gunakan implementasi PDF kamu sendiri yang sudah ada
        // (metode ini sengaja tidak diubah di patch)
        $data = collect();
        $title = 'Laporan Absensi Guru';
        $fileName = 'laporan_absensi_guru_' . now()->format('Ymd_His') . '.pdf';

        if ($request->has('bulan') && $request->has('tahun')) {
            $data = $this->getLaporanBulanan($request->all());
            $bulan = Carbon::create()->month((int)$request->get('bulan'))->translatedFormat('F');
            $title = "BULAN " . strtoupper($bulan) . " TAHUN " . $request->get('tahun');
        } elseif ($request->has('id_tahun_ajaran')) {
            $data = $this->getLaporanSemesteran($request->all());
            $tahunAjaran = TahunAjaran::find($request->id_tahun_ajaran);
            if ($tahunAjaran) {
                $title = "SEMESTER " . strtoupper($tahunAjaran->semester) . " TAHUN AJARAN " . $tahunAjaran->tahun_ajaran;
            } else {
                return redirect()->back()->with('error', 'Tahun ajaran yang dipilih tidak valid.');
            }
        }

        if ($data->isEmpty()) {
            return redirect()->back()->with('error', 'Tidak ada data untuk diekspor pada periode yang dipilih.');
        }

        $totals = [
            'hadir'      => $data->sum('hadir'),
            'sakit'      => $data->sum('sakit'),
            'izin'       => $data->sum('izin'),
            'alfa'       => $data->sum('alfa'),
            'dinas_luar' => $data->sum('dinas_luar'),
        ];

        $pdf = Pdf::loadView('exports.laporan_absensi_guru_pdf', [
            'data'   => $data,
            'title'  => $title,
            'totals' => $totals,
        ])->setPaper('a4','landscape');

        return $pdf->download($fileName);
    }
}
