<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\AbsensiSiswa;
use App\Models\AbsensiGuru;
use App\Models\TahunAjaran;
use App\Exports\LaporanAbsensiExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;



class LaporanController extends Controller
{
    /**
     * Menampilkan halaman utama laporan dan analitik.
     */
    public function index(Request $request)
    {
        // Validasi filter (opsional)
        $request->validate([
            'periode' => 'nullable|in:bulanan,mingguan,harian',
            'bulan' => 'nullable|string',
            'id_kelas' => 'nullable|string',
        ]);

        // Ambil daftar kelas untuk dropdown filter di frontend
        $kelasOptions = Kelas::orderBy('tingkat')->get()->map(fn($kelas) => [
            'id_kelas' => $kelas->id_kelas,
            'nama_lengkap' => $kelas->nama_lengkap,
        ]);

        // Kumpulkan semua data
        $data = [
            'stats' => $this->queryStatistikUtama($request),
            'trenKehadiran' => $this->queryTrenKehadiran($request),
            'distribusiStatus' => $this->queryDistribusiStatus($request),
            'laporanPerKelas' => $this->queryLaporanPerKelas($request),
            'laporanGuru' => $this->queryLaporanGuru($request),
            'heatmapData' => $this->queryHeatmapData($request),
        ];

        $data['analitik'] = $this->generateAnalitik($data);

        return Inertia::render('admin/Laporan/Index', [
            'data' => $data,
            'filters' => $request->all(['periode', 'bulan', 'id_kelas']),
            'kelasOptions' => $kelasOptions,
        ]);
    }

    // ===========================
    // Helper: safe parse untuk bulan
    // ===========================
    /**
     * Mengembalikan Carbon instance berdasarkan input bulan.
     * Jika input null/''/'null' atau gagal di-parse, akan fallback ke now() (format Y-m).
     *
     * @param mixed $value
     * @param string $defaultFormat
     * @return \Carbon\Carbon
     */

    private function queryHeatmapData(Request $request)
    {
        // Default ke 'semua' jika tidak ada id_kelas, atau ambil dari filter
        $id_kelas = $request->input('id_kelas', 'semua');
        if ($id_kelas === 'semua') {
            // Jika 'Semua Kelas', ambil kelas pertama sebagai default
            $kelas = Kelas::orderBy('tingkat')->first();
            if (!$kelas) return []; // Jika tidak ada kelas sama sekali
            $id_kelas = $kelas->id_kelas;
        }

        $bulanInput = $request->input('bulan');
        $selectedMonth = Carbon::parse($bulanInput ?: now()->format('Y-m'));

        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();

        // Ambil total siswa aktif di kelas yang dipilih
        $totalSiswaDiKelas = Siswa::where('id_kelas', $id_kelas)->where('status', 'Aktif')->count();
        if ($totalSiswaDiKelas === 0) {
            return []; // Tidak perlu proses jika tidak ada siswa
        }

        // Ambil rekap kehadiran harian untuk kelas tersebut
        $rekapHarian = AbsensiSiswa::where('status_kehadiran', 'Hadir')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->whereHas('siswa', fn($q) => $q->where('id_kelas', $id_kelas))
            ->groupBy('tanggal')
            ->select('tanggal', DB::raw('COUNT(*) as total_hadir'))
            ->get();

        // Format data agar sesuai dengan yang dibutuhkan komponen heatmap
        return $rekapHarian->map(function ($item) use ($totalSiswaDiKelas) {
            return [
                'date' => $item->tanggal,
                'count' => round(($item->total_hadir / $totalSiswaDiKelas) * 100)
            ];
        });
    }
    private function safeParseMonth($value, $defaultFormat = 'Y-m')
    {
        // jika null, empty, atau string 'null' -> kembalikan sekarang (format Y-m)
        if (is_null($value) || $value === '' || (is_string($value) && strtolower($value) === 'null')) {
            return Carbon::createFromFormat($defaultFormat, Carbon::now()->format($defaultFormat));
        }

        // jika value terlihat seperti Y-m, gunakan createFromFormat
        if (is_string($value) && preg_match('/^\d{4}-\d{2}$/', $value)) {
            try {
                return Carbon::createFromFormat($defaultFormat, $value);
            } catch (\Exception $e) {
                // lanjut ke parse umum
            }
        }

        // coba parse umum, fallback ke now()
        try {
            return Carbon::parse($value);
        } catch (\Exception $e) {
            return Carbon::createFromFormat($defaultFormat, Carbon::now()->format($defaultFormat));
        }
    }

    // =========================================================================
    // PRIVATE QUERY / LOGIC METHODS
    // =========================================================================

    private function queryStatistikUtama(Request $request)
    {
        $today = Carbon::today();
        $selectedMonth = $this->safeParseMonth($request->input('bulan', $today->format('Y-m')));
        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();
        $startOfPrevMonth = $selectedMonth->copy()->subMonthNoOverflow()->startOfMonth();
        $endOfPrevMonth = $selectedMonth->copy()->subMonthNoOverflow()->endOfMonth();

        $totalSiswa = Siswa::where('status', 'Aktif')->count();
        $totalGuru = Guru::where('status', 'Aktif')->count();

        $siswaHadirHariIni = AbsensiSiswa::whereDate('tanggal', $today)->where('status_kehadiran', 'Hadir')->count();
        $guruHadirHariIni = AbsensiGuru::whereDate('tanggal', $today)->where('status_kehadiran', 'Hadir')->count();

        $avgSiswaBulanIni = $this->calculateAverageAttendance('tbl_absensi_siswa', $startOfMonth, $endOfMonth, $totalSiswa);
        $avgSiswaBulanLalu = $this->calculateAverageAttendance('tbl_absensi_siswa', $startOfPrevMonth, $endOfPrevMonth, $totalSiswa);
        $perubahanSiswa = $avgSiswaBulanIni - $avgSiswaBulanLalu;

        $avgGuruBulanIni = $this->calculateAverageAttendance('tbl_absensi_guru', $startOfMonth, $endOfMonth, $totalGuru);
        $avgGuruBulanLalu = $this->calculateAverageAttendance('tbl_absensi_guru', $startOfPrevMonth, $endOfPrevMonth, $totalGuru);
        $perubahanGuru = $avgGuruBulanIni - $avgGuruBulanLalu;

        return [
            'rataRataKehadiranSiswa' => [
                'percentage' => round($avgSiswaBulanIni, 1),
                'change' => sprintf('%+.1f%%', $perubahanSiswa),
                'status' => $perubahanSiswa >= 0 ? 'naik' : 'turun',
            ],
            'rataRataKehadiranGuru' => [
                'percentage' => round($avgGuruBulanIni, 1),
                'change' => sprintf('%+.1f%%', $perubahanGuru),
                'status' => $perubahanGuru >= 0 ? 'naik' : 'turun',
            ],
            'siswaHadirHariIni' => ['count' => $siswaHadirHariIni, 'total' => $totalSiswa],
            'guruHadirHariIni' => ['count' => $guruHadirHariIni, 'total' => $totalGuru],
        ];
    }

    private function calculateAverageAttendance($table, $startDate, $endDate, $totalPopulation)
    {
        if ($totalPopulation == 0) return 0;

        // perhitungan hari kerja (weekday count)
        $workdays = $startDate->diffInWeekdays($endDate) + 1;
        if ($workdays == 0) return 0;

        $totalHadir = DB::table($table)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->count();

        return ($totalHadir / ($totalPopulation * $workdays)) * 100;
    }

    /**
     * Tren kehadiran 6 bulan terakhir.
     */
    private function queryTrenKehadiran(Request $request)
    {
        // gunakan sekarang sebagai acuan akhir
        $endDate = Carbon::now()->endOfMonth();
        $startDate = Carbon::now()->subMonths(5)->startOfMonth();

        // Grouping berdasarkan format YYYY-MM, gunakan DB::raw untuk memastikan konsistensi
        $formatExpr = "DATE_FORMAT(tanggal, '%Y-%m')";

        $kehadiranSiswa = AbsensiSiswa::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("$formatExpr as bulan, COUNT(*) as total")
            ->groupBy(DB::raw($formatExpr))
            ->pluck('total', 'bulan');

        $kehadiranGuru = AbsensiGuru::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("$formatExpr as bulan, COUNT(*) as total")
            ->groupBy(DB::raw($formatExpr))
            ->pluck('total', 'bulan');

        $totalSiswa = Siswa::where('status', 'Aktif')->count() ?: 1;
        $totalGuru = Guru::where('status', 'Aktif')->count() ?: 1;

        $tren = [];
        for ($i = 0; $i < 6; $i++) {
            $date = $startDate->copy()->addMonths($i);
            $bulanKey = $date->format('Y-m');
            $bulanLabel = $date->translatedFormat('M');

            $workdays = $date->diffInWeekdays($date->copy()->endOfMonth()) + 1;

            $persenSiswa = ($kehadiranSiswa->get($bulanKey, 0) / ($totalSiswa * max(1, $workdays))) * 100;
            $persenGuru = ($kehadiranGuru->get($bulanKey, 0) / ($totalGuru * max(1, $workdays))) * 100;

            $tren[] = [
                'bulan' => $bulanLabel,
                'siswa' => round($persenSiswa, 1),
                'guru' => round($persenGuru, 1),
            ];
        }

        return $tren;
    }

    private function queryDistribusiStatus(Request $request)
    {
        $selectedMonth = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();
        $id_kelas = $request->input('id_kelas');

        $query = AbsensiSiswa::query()
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->when($id_kelas && $id_kelas !== 'semua', function ($q) use ($id_kelas) {
                $q->whereHas('siswa', fn($sq) => $sq->where('id_kelas', $id_kelas));
            });

        return [
            'hadir' => (clone $query)->where('status_kehadiran', 'Hadir')->count(),
            'sakit' => (clone $query)->where('status_kehadiran', 'Sakit')->count(),
            'izin'  => (clone $query)->where('status_kehadiran', 'Izin')->count(),
            'alfa'  => (clone $query)->where('status_kehadiran', 'Alfa')->count(),
        ];
    }

    private function queryLaporanPerKelas(Request $request)
    {
        $selectedMonth = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();

        $kelasList = Kelas::withCount(['siswa' => fn($q) => $q->where('status', 'Aktif')])
            ->with('waliKelas:id_guru,nama_lengkap')
            ->having('siswa_count', '>', 0)
            ->get();

        $rekapAbsensi = AbsensiSiswa::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->join('tbl_siswa', 'tbl_absensi_siswa.id_siswa', '=', 'tbl_siswa.id_siswa')
            ->groupBy('tbl_siswa.id_kelas', 'tbl_absensi_siswa.status_kehadiran')
            ->select('tbl_siswa.id_kelas', 'tbl_absensi_siswa.status_kehadiran', DB::raw('COUNT(*) as total'))
            ->get()
            ->groupBy('id_kelas');

        return $kelasList->map(function ($kelas) use ($rekapAbsensi) {
            $absensiKelas = $rekapAbsensi->get($kelas->id_kelas, collect())->keyBy('status_kehadiran');
            $totalAbsensi = $absensiKelas->sum('total');

            if ($totalAbsensi === 0) {
                return [
                    'namaKelas' => $kelas->nama_lengkap,
                    'waliKelas' => $kelas->waliKelas->nama_lengkap ?? '-',
                    'persentase' => ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alfa' => 0],
                    'status' => 'Data Kosong'
                ];
            }

            $hadir = $absensiKelas->get('Hadir')['total'] ?? 0;
            $sakit = $absensiKelas->get('Sakit')['total'] ?? 0;
            $izin  = $absensiKelas->get('Izin')['total'] ?? 0;
            $alfa  = $absensiKelas->get('Alfa')['total'] ?? 0;

            $persentase = [
                'hadir' => round(($hadir / $totalAbsensi) * 100),
                'sakit' => round(($sakit / $totalAbsensi) * 100),
                'izin'  => round(($izin / $totalAbsensi) * 100),
                'alfa'  => round(($alfa / $totalAbsensi) * 100),
            ];

            $status = $persentase['hadir'] >= 95 ? 'Sangat Baik' : ($persentase['hadir'] >= 90 ? 'Baik' : ($persentase['hadir'] >= 85 ? 'Cukup' : 'Perlu Perhatian'));

            return [
                'namaKelas' => $kelas->nama_lengkap,
                'waliKelas' => $kelas->waliKelas->nama_lengkap ?? '-',
                'persentase' => $persentase,
                'status' => $status
            ];
        })->all();
    }

    private function queryLaporanGuru(Request $request)
    {
        $selectedMonth = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();

        $totalHariKerja = $startOfMonth->diffInWeekdays($endOfMonth) + 1;

        $rekapGuru = Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Sakit'),
                'absensi as izin'  => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Izin'),
                'absensi as alfa'  => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Alfa'),
            ])->get();

        return $rekapGuru->map(function ($guru) use ($totalHariKerja) {
            $persentaseKehadiran = $totalHariKerja > 0 ? ($guru->hadir / $totalHariKerja) * 100 : 0;
            $status = $persentaseKehadiran >= 98 ? 'Sangat Baik' : ($persentaseKehadiran >= 95 ? 'Baik' : 'Cukup');

            return [
                'namaGuru' => $guru->nama_lengkap,
                'totalHariKerja' => $totalHariKerja,
                'hadir' => $guru->hadir,
                'sakit' => $guru->sakit,
                'izin' => $guru->izin,
                'alfa' => $guru->alfa,
                'persentaseKehadiran' => round($persentaseKehadiran, 1),
                'status' => $status,
            ];
        })->all();
    }

    private function generateAnalitik(array $data)
    {
        $pencapaian = [];
        $rekomendasi = [];
        $stats = $data['stats'];

        if ($stats['rataRataKehadiranSiswa']['percentage'] > 90) {
            $pencapaian[] = ['text' => "Rata-rata kehadiran siswa mencapai {$stats['rataRataKehadiranSiswa']['percentage']}% (target: 90%)", 'color' => 'green'];
        }
        if ($stats['rataRataKehadiranGuru']['percentage'] > 95) {
            $pencapaian[] = ['text' => "Rata-rata kehadiran guru mencapai {$stats['rataRataKehadiranGuru']['percentage']}% (target: 95%)", 'color' => 'green'];
        }
        if ($stats['rataRataKehadiranSiswa']['status'] === 'naik') {
            $pencapaian[] = ['text' => "Trend kehadiran meningkat {$stats['rataRataKehadiranSiswa']['change']} dari bulan sebelumnya", 'color' => 'green'];
        }

        $kelasPerluPerhatian = collect($data['laporanPerKelas'])->where('status', 'Perlu Perhatian')->first();
        if ($kelasPerluPerhatian) {
            $rekomendasi[] = ['text' => "Perhatian khusus untuk kelas {$kelasPerluPerhatian['namaKelas']} ({$kelasPerluPerhatian['persentase']['hadir']}%)", 'color' => 'yellow'];
        } else {
            $rekomendasi[] = ['text' => "Semua kelas menunjukkan tingkat kehadiran yang baik bulan ini.", 'color' => 'green'];
        }

        $rekomendasi[] = ['text' => "Implementasi sistem reward untuk kelas dengan kehadiran terbaik", 'color' => 'blue'];
        $rekomendasi[] = ['text' => "Follow up siswa dengan tingkat absensi tinggi", 'color' => 'purple'];

        return ['pencapaian' => $pencapaian, 'rekomendasi' => $rekomendasi];
    }

    // ===========================
    // Export (PDF / Excel)
    // ===========================
    public function exportPdf(Request $request)
    {
        $data = $this->getAllReportData($request);
        $filters = $this->getReportFilters($request);

        $pdf = Pdf::loadView('exports.laporan_absensi', compact('data', 'filters'));

        return $pdf->download('laporan-absensi-' . Carbon::now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $data = $this->getAllReportData($request);
        $filters = $this->getReportFilters($request);

        return Excel::download(new LaporanAbsensiExport($data, $filters), 'laporan-absensi-' . Carbon::now()->format('Y-m-d') . '.xlsx');
    }

    // Helper utk data laporan agar tidak duplikasi
    private function getAllReportData(Request $request)
    {
        return [
            'stats' => $this->queryStatistikUtama($request),
            'laporanPerKelas' => $this->queryLaporanPerKelas($request),
            'laporanGuru' => $this->queryLaporanGuru($request),
        ];
    }

    // Helper utk format filter laporan
    private function getReportFilters(Request $request)
    {
        $filters = $request->all(['bulan', 'id_kelas']);
        if (empty($filters['bulan']) || (is_string($filters['bulan']) && strtolower($filters['bulan']) === 'null')) {
            $filters['bulan'] = Carbon::now()->format('Y-m');
        }

        if (!empty($filters['id_kelas']) && $filters['id_kelas'] !== 'semua') {
            $filters['nama_kelas'] = Kelas::find($filters['id_kelas'])->nama_lengkap ?? $filters['id_kelas'];
        }

        return $filters;
    }

    private function queryKehadiranMingguan(Request $request)
    {
        $bulanInput = $request->input('bulan');
        $selectedMonth = Carbon::parse($bulanInput ?: now()->format('Y-m'));

        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth = $selectedMonth->copy()->endOfMonth();

        $totalSiswa = Siswa::where('status', 'Aktif')->count() ?: 1;
        $totalGuru = Guru::where('status', 'Aktif')->count() ?: 1;

        // Ambil data absensi siswa dan guru untuk bulan yang dipilih
        $absensiSiswa = AbsensiSiswa::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("WEEK(tanggal, 1) as minggu, COUNT(*) as total")
            ->groupBy('minggu')
            ->pluck('total', 'minggu');

        $absensiGuru = AbsensiGuru::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->where('status_kehadiran', 'Hadir')
            ->groupBy('minggu')
            ->selectRaw("WEEK(tanggal, 1) as minggu, COUNT(*) as total")
            ->pluck('total', 'minggu');

        $weeks = [];
        $date = $startOfMonth->copy();
        while ($date->lte($endOfMonth)) {
            $weekNumber = $date->weekOfYear;
            if (!isset($weeks[$weekNumber])) {
                $startOfWeek = $date->copy()->startOfWeek(Carbon::MONDAY);
                $endOfWeek = $date->copy()->endOfWeek(Carbon::SUNDAY);
                $weeks[$weekNumber] = [
                    'label' => 'Minggu ' . ($date->weekOfMonth),
                    'workdays' => $startOfWeek->diffInWeekdays($endOfWeek)
                ];
            }
            $date->addDay();
        }

        $labels = [];
        $siswaData = [];
        $guruData = [];

        foreach ($weeks as $weekNum => $weekInfo) {
            $labels[] = $weekInfo['label'];

            $hadirSiswaMingguan = $absensiSiswa->get($weekNum, 0);
            $persenSiswa = ($hadirSiswaMingguan / ($totalSiswa * $weekInfo['workdays'])) * 100;
            $siswaData[] = round($persenSiswa, 1);

            $hadirGuruMingguan = $absensiGuru->get($weekNum, 0);
            $persenGuru = ($hadirGuruMingguan / ($totalGuru * $weekInfo['workdays'])) * 100;
            $guruData[] = round($persenGuru, 1);
        }

        return [
            'labels' => $labels,
            'siswaData' => $siswaData,
            'guruData' => $guruData,
        ];
    }

    public function getDetailHarian(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'id_kelas' => 'required|string',
        ]);

        $tanggal = $request->date;
        $id_kelas = $request->id_kelas;

        // Ambil semua siswa di kelas tersebut
        $querySiswa = Siswa::query()->where('status', 'Aktif');
        if ($id_kelas !== 'semua') {
            $querySiswa->where('id_kelas', $id_kelas);
        }
        $semuaSiswa = $querySiswa->select('id_siswa', 'nama_lengkap', 'nis')->get()->keyBy('id_siswa');
        
        // Ambil data absensi yang sudah ada pada tanggal tersebut
        $absensiMasuk = AbsensiSiswa::whereDate('tanggal', $tanggal)
            ->whereIn('id_siswa', $semuaSiswa->keys())
            ->get()->keyBy('id_siswa');
            
        // Gabungkan data untuk mendapatkan daftar lengkap
        $detailAbsensi = $semuaSiswa->map(function ($siswa) use ($absensiMasuk) {
            $absen = $absensiMasuk->get($siswa->id_siswa);
            return [
                'nama' => $siswa->nama_lengkap,
                'nis' => $siswa->nis,
                'status' => $absen ? $absen->status_kehadiran : 'Alfa', // Default Alfa jika tidak ada record
                'jam_masuk' => $absen ? Carbon::parse($absen->jam_masuk)->format('H:i') : '-',
                'keterangan' => $absen->keterangan ?? '-',
            ];
        })->values(); // Mengubah collection menjadi array
        
        return response()->json($detailAbsensi);
    }
}
