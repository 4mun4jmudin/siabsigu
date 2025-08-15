<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // Import DB Facade untuk query chart
use Inertia\Inertia;
use Carbon\Carbon;
use App\Exports\AbsensiGuruExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class AbsensiGuruController extends Controller
{
    // =========================================================================
    // FITUR BARU: Pengaturan Jam Kerja
    // Definisikan jam masuk sekolah di sini. Anda bisa memindahkannya ke database
    // atau file konfigurasi di masa depan untuk fleksibilitas.
    // =========================================================================
    private const JAM_MASUK_SEKOLAH = '07:30:00';

    /**
     * Menampilkan halaman utama manajemen absensi guru.
     */
    public function index(Request $request)
    {
        $filters = $request->all(
            'tab', 'search', 'tanggal', 'bulan', 'tahun', 'id_tahun_ajaran'
        );

        $filters['tab'] = $filters['tab'] ?? 'harian';
        $filters['tanggal'] = $filters['tanggal'] ?? now()->toDateString();
        $filters['bulan'] = $filters['bulan'] ?? now()->month;
        $filters['tahun'] = $filters['tahun'] ?? now()->year;
        
        $tahunAjaranOptions = TahunAjaran::orderBy('tahun_ajaran', 'desc')->get();

        return Inertia::render('admin/AbsensiGuru/Index', [
            'filters' => $filters,
            'tahunAjaranOptions' => $tahunAjaranOptions,
            'absensiData' => fn () => $this->getAbsensiHarian($filters),
            'stats' => fn () => $this->getStatsHarian($filters),
            'guruBelumAbsen' => fn () => $this->getGuruBelumAbsen($filters),
            'riwayatAbsensi' => fn () => $this->getRiwayatAbsensi($filters),
            'laporanBulanan' => fn () => $this->getLaporanBulanan($filters),
            'laporanSemesteran' => fn () => $this->getLaporanSemesteran($filters),
            // FITUR BARU: Mengirim data untuk chart ke frontend
            'chartData' => fn() => $this->getChartData(),
        ]);
    }

    // =========================================================================
    // FITUR BARU: Halaman Detail Riwayat Absensi per Guru
    // Method ini akan menangani halaman detail untuk satu guru.
    // =========================================================================
    public function show(Request $request, Guru $guru)
    {
        // Validasi filter bulan dan tahun untuk halaman detail
        $request->validate([
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2000',
        ]);

        $bulan = $request->input('bulan', now()->month);
        $tahun = $request->input('tahun', now()->year);

        // Ambil data absensi untuk guru yang spesifik, dengan paginasi
        $absensiHistory = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->orderBy('tanggal', 'desc')
            ->paginate(10)
            ->withQueryString();
        
        // Ambil rekapitulasi statistik untuk guru ini pada bulan/tahun yang dipilih
        $rekapStatistik = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->selectRaw("
                SUM(CASE WHEN status_kehadiran = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status_kehadiran = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status_kehadiran = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status_kehadiran = 'Alfa' THEN 1 ELSE 0 END) as alfa,
                AVG(menit_keterlambatan) as rata_rata_telat
            ")->first();

        // Render komponen React baru untuk halaman detail (Anda perlu membuat file ini)
        return Inertia::render('admin/AbsensiGuru/Show', [
            'guru' => $guru,
            'absensiHistory' => $absensiHistory,
            'rekapStatistik' => $rekapStatistik,
            'filters' => ['bulan' => $bulan, 'tahun' => $tahun]
        ]);
    }


    // --- Kumpulan Private Method untuk Mengambil Data ---

    // =========================================================================
    // FITUR BARU: Visualisasi Data dengan Grafik
    // Method ini mengambil data rekap absensi 7 hari terakhir untuk ditampilkan di chart.
    // =========================================================================
    private function getChartData()
    {
        $endDate = Carbon::today();
        $startDate = Carbon::today()->subDays(6);

        $data = AbsensiGuru::whereBetween('tanggal', [$startDate, $endDate])
            ->groupBy('tanggal')
            ->select(
                'tanggal',
                DB::raw("SUM(CASE WHEN status_kehadiran = 'Hadir' THEN 1 ELSE 0 END) as hadir"),
                DB::raw("SUM(CASE WHEN status_kehadiran = 'Sakit' THEN 1 ELSE 0 END) as sakit"),
                DB::raw("SUM(CASE WHEN status_kehadiran = 'Izin' THEN 1 ELSE 0 END) as izin"),
                DB::raw("SUM(CASE WHEN status_kehadiran = 'Alfa' THEN 1 ELSE 0 END) as alfa")
            )
            ->orderBy('tanggal', 'asc')
            ->get();

        // Format data agar mudah digunakan oleh library chart di frontend
        $labels = [];
        $hadirData = [];
        $sakitData = [];
        $izinData = [];
        $alfaData = [];

        // Loop untuk setiap hari dalam 7 hari terakhir untuk memastikan semua tanggal ada
        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $labels[] = $date->translatedFormat('d M'); // Format tanggal (e.g., 15 Agu)
            $record = $data->firstWhere('tanggal', $date->toDateString());

            $hadirData[] = $record ? $record->hadir : 0;
            $sakitData[] = $record ? $record->sakit : 0;
            $izinData[] = $record ? $record->izin : 0;
            $alfaData[] = $record ? $record->alfa : 0;
        }

        return [
            'labels' => $labels,
            'datasets' => [
                ['label' => 'Hadir', 'data' => $hadirData, 'backgroundColor' => '#22c55e'],
                ['label' => 'Sakit', 'data' => $sakitData, 'backgroundColor' => '#eab308'],
                ['label' => 'Izin', 'data' => $izinData, 'backgroundColor' => '#3b82f6'],
                ['label' => 'Alfa', 'data' => $alfaData, 'backgroundColor' => '#ef4444'],
            ]
        ];
    }

    private function getAbsensiHarian(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;
        
        return AbsensiGuru::with('guru')
            ->whereDate('tanggal', $filters['tanggal'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('guru', fn ($q) => $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%"));
            })
            ->get();
    }

    private function getStatsHarian(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;

        $absensiData = $this->getAbsensiHarian($filters);
        return [
            'total_guru' => Guru::where('status', 'Aktif')->count(),
            'hadir' => $absensiData->where('status_kehadiran', 'Hadir')->count(),
            'izin' => $absensiData->where('status_kehadiran', 'Izin')->count(),
            'sakit' => $absensiData->where('status_kehadiran', 'Sakit')->count(),
            'alfa' => $absensiData->where('status_kehadiran', 'Alfa')->count(),
        ];
    }

    private function getGuruBelumAbsen(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'harian') return null;

        $guruSudahAbsenIds = AbsensiGuru::whereDate('tanggal', $filters['tanggal'])->pluck('id_guru');
        return Guru::where('status', 'Aktif')->whereNotIn('id_guru', $guruSudahAbsenIds)->get(['id_guru', 'nama_lengkap', 'nip']);
    }

    private function getRiwayatAbsensi(array $filters)
    {
        if (($filters['tab'] ?? 'harian') !== 'riwayat') return null;

        return AbsensiGuru::with('guru')
            ->whereBetween('tanggal', [now()->subDays(30), now()])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('guru', fn ($q) => $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%"));
            })
            ->latest('tanggal')->paginate(15)->withQueryString();
    }

    private function getLaporanBulanan(array $filters)
    {
        if (!($filters['bulan'] && $filters['tahun'])) return [];

        return Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereMonth('tanggal', $filters['bulan'])->whereYear('tanggal', $filters['tahun'])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereMonth('tanggal', $filters['bulan'])->whereYear('tanggal', $filters['tahun'])->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereMonth('tanggal', $filters['bulan'])->whereYear('tanggal', $filters['tahun'])->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereMonth('tanggal', $filters['bulan'])->whereYear('tanggal', $filters['tahun'])->where('status_kehadiran', 'Alfa'),
            ])->get();
    }

    private function getLaporanSemesteran(array $filters)
    {
        if (empty($filters['id_tahun_ajaran'])) return [];
        
        $tahunAjaran = TahunAjaran::find($filters['id_tahun_ajaran']);
        if (!$tahunAjaran) return [];

        $tahun = explode('/', $tahunAjaran->tahun_ajaran)[0];

        if ($tahunAjaran->semester === 'Ganjil') {
            $startDate = Carbon::create($tahun, 7, 1)->startOfMonth();
            $endDate = Carbon::create($tahun, 12, 31)->endOfMonth();
        } else { // Genap
            $tahun++;
            $startDate = Carbon::create($tahun, 1, 1)->startOfMonth();
            $endDate = Carbon::create($tahun, 6, 30)->endOfMonth();
        }

        return Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Alfa'),
            ])->get();
    }
    
    /**
     * Menyimpan data absensi manual baru atau memperbarui yang sudah ada.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'id_guru' => 'required|exists:tbl_guru,id_guru',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa,Dinas Luar',
            'jam_masuk' => 'nullable|required_if:status_kehadiran,Hadir|date_format:H:i',
            'jam_pulang' => 'nullable|date_format:H:i|after_or_equal:jam_masuk',
            'keterangan' => 'nullable|string|max:255',
        ]);

        // =========================================================================
        // FITUR BARU: Deteksi Keterlambatan
        // =========================================================================
        $menitKeterlambatan = null;
        if ($request->status_kehadiran === 'Hadir' && $request->jam_masuk) {
            $jamMasukSekolah = Carbon::parse(self::JAM_MASUK_SEKOLAH);
            $jamAbsen = Carbon::parse($request->jam_masuk);

            // Hitung selisih dalam menit. Jika jam absen lebih besar, hasilnya positif (terlambat).
            $selisihMenit = $jamMasukSekolah->diffInMinutes($jamAbsen, false);

            // Jika selisih positif, berarti terlambat. Jika tidak, anggap 0 (tepat waktu).
            $menitKeterlambatan = $selisihMenit > 0 ? $selisihMenit : 0;
        }

        AbsensiGuru::updateOrCreate(
            [ 'id_guru' => $request->id_guru, 'tanggal' => $request->tanggal ],
            [
                'id_absensi' => 'AG-' . Carbon::parse($request->tanggal)->format('ymd') . '-' . $request->id_guru,
                'status_kehadiran' => $request->status_kehadiran,
                'jam_masuk' => $request->status_kehadiran === 'Hadir' ? $request->jam_masuk : null,
                'jam_pulang' => $request->status_kehadiran === 'Hadir' ? $request->jam_pulang : null,
                'keterangan' => $request->keterangan,
                'metode_absen' => 'Manual',
                'id_penginput_manual' => Auth::id(),
                'menit_keterlambatan' => $menitKeterlambatan, // Simpan data keterlambatan
            ]
        );

        return back()->with('success', 'Absensi manual berhasil disimpan.');
    }

    // --- Metode untuk Ekspor Laporan ---

    public function exportExcel(Request $request)
    {
        $fileName = 'laporan_absensi_guru_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new AbsensiGuruExport($request), $fileName);
    }

    public function exportPdf(Request $request)
    {
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
            'hadir' => $data->sum('hadir'),
            'sakit' => $data->sum('sakit'),
            'izin'  => $data->sum('izin'),
            'alfa'  => $data->sum('alfa'),
        ];

        $pdf = PDF::loadView('exports.laporan_absensi_guru_pdf', [
            'data'   => $data,
            'title'  => $title,
            'totals' => $totals,
        ]);
        
        $pdf->setPaper('a4', 'landscape');
        return $pdf->download($fileName);
    }
    // public function registerFingerprint(Request $request, Guru $guru)
    // {
    //     $request->validate([
    //         'sidik_jari_template' => 'required|string',
    //     ]);

    //     $guru->update([
    //         'sidik_jari_template' => $request->sidik_jari_template,
    //     ]);

    //     // Mengembalikan ke halaman index dengan pesan sukses
    //     return redirect()->route('admin.guru.index')->with('success', 'Sidik jari untuk guru ' . $guru->nama_lengkap . ' berhasil diregistrasi.');
    // }
}
