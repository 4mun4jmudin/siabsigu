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
// use App\Models\TahunAjaran; // tidak dipakai
use App\Exports\LaporanAbsensiExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class LaporanController extends Controller
{
    /**
     * Halaman utama laporan & analitik.
     */
    public function index(Request $request)
    {
        $request->validate([
            'periode'  => 'nullable|in:bulanan,mingguan,harian',
            'bulan'    => 'nullable|string',
            'id_kelas' => 'nullable|string',
        ]);

        // Kelas options (lengkap + item "Semua Kelas")
        $kelasOptions = Kelas::orderBy('tingkat')
            ->get()
            ->map(function ($k) {
                $nama = trim(($k->tingkat ?? '') . ' ' . ($k->jurusan ?? ''));
                if ($nama === '') $nama = $k->id_kelas;
                return [
                    'id_kelas'     => $k->id_kelas,
                    'nama_lengkap' => $nama,
                    'label'        => $nama,
                    'value'        => $k->id_kelas,
                ];
            })
            ->values()
            ->all();

        array_unshift($kelasOptions, [
            'id_kelas'     => 'semua',
            'nama_lengkap' => 'Semua Kelas',
            'label'        => 'Semua Kelas',
            'value'        => 'semua',
        ]);

        // Kumpulkan data untuk dashboard laporan
        $data = [
            'stats'             => $this->queryStatistikUtama($request),
            'trenKehadiran'     => $this->queryTrenKehadiran($request),   // trend 6 bulan
            'kehadiranMingguan' => $this->queryKehadiranMingguan($request),// trend mingguan bulan berjalan
            'distribusiStatus'  => $this->queryDistribusiStatus($request),
            'laporanPerKelas'   => $this->queryLaporanPerKelas($request),
            'laporanGuru'       => $this->queryLaporanGuru($request),
            'heatmapData'       => $this->queryHeatmapData($request),
        ];

        $data['analitik'] = $this->generateAnalitik($data);

        return Inertia::render('admin/Laporan/Index', [
            'data'         => $data,
            'filters'      => $request->only(['periode', 'bulan', 'id_kelas']),
            'kelasOptions' => $kelasOptions,
        ]);
    }

    /**
     * Heatmap harian (% hadir per tanggal) untuk kelas terpilih (atau kelas pertama jika "semua").
     * Output: [{date: 'Y-m-d', count: 0..100}, ...]
     */
    private function queryHeatmapData(Request $request)
    {
        $id_kelas = $request->input('id_kelas', 'semua');
        if ($id_kelas === 'semua') {
            $kelas = Kelas::orderBy('tingkat')->first();
            if (!$kelas) return []; // kalau belum ada kelas sama sekali
            $id_kelas = $kelas->id_kelas;
        }

        $bulanInput    = $request->input('bulan');
        $selectedMonth = $this->safeParseMonth($bulanInput, 'Y-m');

        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth   = $selectedMonth->copy()->endOfMonth();

        $totalSiswaDiKelas = Siswa::where('id_kelas', $id_kelas)
            ->where('status', 'Aktif')
            ->count();

        if ($totalSiswaDiKelas === 0) return [];

        $rekapHarian = AbsensiSiswa::where('status_kehadiran', 'Hadir')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->whereHas('siswa', fn($q) => $q->where('id_kelas', $id_kelas))
            ->groupBy('tanggal')
            ->select('tanggal', DB::raw('COUNT(*) as total_hadir'))
            ->get();

        return $rekapHarian->map(function ($row) use ($totalSiswaDiKelas) {
            $persen = ($row->total_hadir / max(1, $totalSiswaDiKelas)) * 100;
            return [
                'date'  => Carbon::parse($row->tanggal)->toDateString(),
                'count' => round($persen),
            ];
        })->all();
    }

    /**
     * Parse aman untuk filter bulan.
     */
    private function safeParseMonth($value, $defaultFormat = 'Y-m')
    {
        if (is_null($value) || $value === '' || (is_string($value) && strtolower($value) === 'null')) {
            return Carbon::createFromFormat($defaultFormat, Carbon::now()->format($defaultFormat));
        }

        if (is_string($value) && preg_match('/^\d{4}-\d{2}$/', $value)) {
            try {
                return Carbon::createFromFormat($defaultFormat, $value);
            } catch (\Throwable $e) {
                // lanjut ke parse umum
            }
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return Carbon::createFromFormat($defaultFormat, Carbon::now()->format($defaultFormat));
        }
    }

    // =====================================================================
    // Query blok
    // =====================================================================

    private function queryStatistikUtama(Request $request)
    {
        $today         = Carbon::today();
        $selectedMonth = $this->safeParseMonth($request->input('bulan', $today->format('Y-m')));
        $startOfMonth  = $selectedMonth->copy()->startOfMonth();
        $endOfMonth    = $selectedMonth->copy()->endOfMonth();

        $startOfPrevMonth = $selectedMonth->copy()->subMonthNoOverflow()->startOfMonth();
        $endOfPrevMonth   = $selectedMonth->copy()->subMonthNoOverflow()->endOfMonth();

        $totalSiswa = Siswa::where('status', 'Aktif')->count();
        $totalGuru  = Guru::where('status', 'Aktif')->count();

        $siswaHadirHariIni = AbsensiSiswa::whereDate('tanggal', $today)
            ->where('status_kehadiran', 'Hadir')->count();

        $guruHadirHariIni = AbsensiGuru::whereDate('tanggal', $today)
            ->where('status_kehadiran', 'Hadir')->count();

        $avgSiswaBulanIni  = $this->calculateAverageAttendance('tbl_absensi_siswa', $startOfMonth, $endOfMonth, $totalSiswa);
        $avgSiswaBulanLalu = $this->calculateAverageAttendance('tbl_absensi_siswa', $startOfPrevMonth, $endOfPrevMonth, $totalSiswa);
        $perubahanSiswa    = $avgSiswaBulanIni - $avgSiswaBulanLalu;

        $avgGuruBulanIni   = $this->calculateAverageAttendance('tbl_absensi_guru', $startOfMonth, $endOfMonth, $totalGuru);
        $avgGuruBulanLalu  = $this->calculateAverageAttendance('tbl_absensi_guru', $startOfPrevMonth, $endOfPrevMonth, $totalGuru);
        $perubahanGuru     = $avgGuruBulanIni - $avgGuruBulanLalu;

        return [
            'rataRataKehadiranSiswa' => [
                'percentage' => round($avgSiswaBulanIni, 1),
                'change'     => sprintf('%+.1f%%', $perubahanSiswa),
                'status'     => $perubahanSiswa >= 0 ? 'naik' : 'turun',
            ],
            'rataRataKehadiranGuru' => [
                'percentage' => round($avgGuruBulanIni, 1),
                'change'     => sprintf('%+.1f%%', $perubahanGuru),
                'status'     => $perubahanGuru >= 0 ? 'naik' : 'turun',
            ],
            'siswaHadirHariIni' => ['count' => $siswaHadirHariIni, 'total' => $totalSiswa],
            'guruHadirHariIni'  => ['count' => $guruHadirHariIni,  'total' => $totalGuru],
        ];
    }

    private function calculateAverageAttendance($table, Carbon $startDate, Carbon $endDate, int $totalPopulation)
    {
        if ($totalPopulation <= 0) return 0.0;

        // hitung hari kerja (Senin–Jumat) dalam bulan (inklusif)
        $workdays = $startDate->diffInWeekdays($endDate) + 1;
        if ($workdays <= 0) return 0.0;

        $totalHadir = DB::table($table)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->count();

        return ($totalHadir / ($totalPopulation * $workdays)) * 100;
    }

    /**
     * Tren kehadiran 6 bulan terakhir (%).
     */
    private function queryTrenKehadiran(Request $request)
    {
        $endDate   = Carbon::now()->endOfMonth();
        $startDate = Carbon::now()->subMonths(5)->startOfMonth();

        $fmt = "DATE_FORMAT(tanggal, '%Y-%m')";

        $kehadiranSiswa = AbsensiSiswa::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("$fmt as bulan, COUNT(*) as total")
            ->groupBy(DB::raw($fmt))
            ->pluck('total', 'bulan');

        $kehadiranGuru = AbsensiGuru::whereBetween('tanggal', [$startDate, $endDate])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("$fmt as bulan, COUNT(*) as total")
            ->groupBy(DB::raw($fmt))
            ->pluck('total', 'bulan');

        $totalSiswa = Siswa::where('status', 'Aktif')->count() ?: 1;
        $totalGuru  = Guru::where('status', 'Aktif')->count() ?: 1;

        $tren = [];
        for ($i = 0; $i < 6; $i++) {
            $date       = $startDate->copy()->addMonths($i);
            $bulanKey   = $date->format('Y-m');
            $bulanLabel = $date->translatedFormat('M');

            $workdays = $date->diffInWeekdays($date->copy()->endOfMonth()) + 1;

            $persenSiswa = ($kehadiranSiswa->get($bulanKey, 0) / ($totalSiswa * max(1, $workdays))) * 100;
            $persenGuru  = ($kehadiranGuru->get($bulanKey, 0)  / ($totalGuru  * max(1, $workdays))) * 100;

            $tren[] = [
                'bulan' => $bulanLabel,
                'siswa' => round($persenSiswa, 1),
                'guru'  => round($persenGuru, 1),
            ];
        }

        return $tren;
    }

    /**
     * Distribusi status absensi siswa untuk bulan terpilih.
     */
    private function queryDistribusiStatus(Request $request)
    {
        $selectedMonth = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth  = $selectedMonth->copy()->startOfMonth();
        $endOfMonth    = $selectedMonth->copy()->endOfMonth();
        $id_kelas      = $request->input('id_kelas');

        $base = AbsensiSiswa::query()
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->when($id_kelas && $id_kelas !== 'semua', function ($q) use ($id_kelas) {
                $q->whereHas('siswa', fn($sq) => $sq->where('id_kelas', $id_kelas));
            });

        return [
            'hadir' => (clone $base)->where('status_kehadiran', 'Hadir')->count(),
            'sakit' => (clone $base)->where('status_kehadiran', 'Sakit')->count(),
            'izin'  => (clone $base)->where('status_kehadiran', 'Izin')->count(),
            'alfa'  => (clone $base)->where('status_kehadiran', 'Alfa')->count(),
        ];
    }

    /**
     * Rekap per kelas (persentase komposisi status) bulan terpilih.
     */
    private function queryLaporanPerKelas(Request $request)
    {
        $selectedMonth = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth  = $selectedMonth->copy()->startOfMonth();
        $endOfMonth    = $selectedMonth->copy()->endOfMonth();

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
            $namaKelas = trim(($kelas->tingkat ?? '') . ' ' . ($kelas->jurusan ?? ''));
            if ($namaKelas === '') $namaKelas = $kelas->id_kelas;

            $absensiKelas  = $rekapAbsensi->get($kelas->id_kelas, collect())->keyBy('status_kehadiran');
            $totalAbsensi  = $absensiKelas->sum('total');

            if ($totalAbsensi === 0) {
                return [
                    'namaKelas'  => $namaKelas,
                    'waliKelas'  => $kelas->waliKelas->nama_lengkap ?? '-',
                    'persentase' => ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alfa' => 0],
                    'status'     => 'Data Kosong',
                ];
            }

            $hadir = (int) ($absensiKelas->get('Hadir')['total'] ?? 0);
            $sakit = (int) ($absensiKelas->get('Sakit')['total'] ?? 0);
            $izin  = (int) ($absensiKelas->get('Izin')['total']  ?? 0);
            $alfa  = (int) ($absensiKelas->get('Alfa')['total']  ?? 0);

            $persen = [
                'hadir' => round(($hadir / $totalAbsensi) * 100),
                'sakit' => round(($sakit / $totalAbsensi) * 100),
                'izin'  => round(($izin  / $totalAbsensi) * 100),
                'alfa'  => round(($alfa  / $totalAbsensi) * 100),
            ];

            $status = $persen['hadir'] >= 95
                ? 'Sangat Baik'
                : ($persen['hadir'] >= 90
                    ? 'Baik'
                    : ($persen['hadir'] >= 85 ? 'Cukup' : 'Perlu Perhatian'));

            return [
                'namaKelas'  => $namaKelas,
                'waliKelas'  => $kelas->waliKelas->nama_lengkap ?? '-',
                'persentase' => $persen,
                'status'     => $status,
            ];
        })->all();
    }

    /**
     * Rekap per guru bulan terpilih.
     */
    private function queryLaporanGuru(Request $request)
    {
        $selectedMonth   = $this->safeParseMonth($request->input('bulan', Carbon::now()->format('Y-m')));
        $startOfMonth    = $selectedMonth->copy()->startOfMonth();
        $endOfMonth      = $selectedMonth->copy()->endOfMonth();
        $totalHariKerja  = $startOfMonth->diffInWeekdays($endOfMonth) + 1;

        $rekapGuru = Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Sakit'),
                'absensi as izin'  => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Izin'),
                'absensi as alfa'  => fn($q) => $q->whereBetween('tanggal', [$startOfMonth, $endOfMonth])->where('status_kehadiran', 'Alfa'),
            ])
            ->get();

        return $rekapGuru->map(function ($guru) use ($totalHariKerja) {
            $persentase = $totalHariKerja > 0 ? ($guru->hadir / $totalHariKerja) * 100 : 0;
            $status = $persentase >= 98 ? 'Sangat Baik' : ($persentase >= 95 ? 'Baik' : 'Cukup');

            return [
                'namaGuru'             => $guru->nama_lengkap,
                'totalHariKerja'       => $totalHariKerja,
                'hadir'                => (int) $guru->hadir,
                'sakit'                => (int) $guru->sakit,
                'izin'                 => (int) $guru->izin,
                'alfa'                 => (int) $guru->alfa,
                'persentaseKehadiran'  => round($persentase, 1),
                'status'               => $status,
            ];
        })->all();
    }

    private function generateAnalitik(array $data)
    {
        $pencapaian  = [];
        $rekomendasi = [];
        $stats       = $data['stats'];

        if (($stats['rataRataKehadiranSiswa']['percentage'] ?? 0) > 90) {
            $pencapaian[] = [
                'text'  => "Rata-rata kehadiran siswa mencapai {$stats['rataRataKehadiranSiswa']['percentage']}% (target: 90%)",
                'color' => 'green',
            ];
        }
        if (($stats['rataRataKehadiranGuru']['percentage'] ?? 0) > 95) {
            $pencapaian[] = [
                'text'  => "Rata-rata kehadiran guru mencapai {$stats['rataRataKehadiranGuru']['percentage']}% (target: 95%)",
                'color' => 'green',
            ];
        }
        if (($stats['rataRataKehadiranSiswa']['status'] ?? 'turun') === 'naik') {
            $pencapaian[] = [
                'text'  => "Trend kehadiran meningkat {$stats['rataRataKehadiranSiswa']['change']} dari bulan sebelumnya",
                'color' => 'green',
            ];
        }

        $kelasPerluPerhatian = collect($data['laporanPerKelas'] ?? [])->where('status', 'Perlu Perhatian')->first();
        if ($kelasPerluPerhatian) {
            $rekomendasi[] = [
                'text'  => "Perhatian khusus untuk kelas {$kelasPerluPerhatian['namaKelas']} ({$kelasPerluPerhatian['persentase']['hadir']}%)",
                'color' => 'yellow',
            ];
        } else {
            $rekomendasi[] = [
                'text'  => "Semua kelas menunjukkan tingkat kehadiran yang baik bulan ini.",
                'color' => 'green',
            ];
        }

        $rekomendasi[] = ['text' => 'Implementasi reward untuk kelas dengan kehadiran terbaik', 'color' => 'blue'];
        $rekomendasi[] = ['text' => 'Follow-up siswa dengan ketidakhadiran tinggi', 'color' => 'purple'];

        return ['pencapaian' => $pencapaian, 'rekomendasi' => $rekomendasi];
    }

    // =====================================================================
    // Export (PDF / Excel)
    // =====================================================================

    public function exportPdf(Request $request)
    {
        $data    = $this->getAllReportData($request);
        $filters = $this->getReportFilters($request);

        $pdf = Pdf::loadView('exports.laporan_absensi', compact('data', 'filters'));
        return $pdf->download('laporan-absensi-' . Carbon::now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $data    = $this->getAllReportData($request);
        $filters = $this->getReportFilters($request);

        return Excel::download(new LaporanAbsensiExport($data, $filters), 'laporan-absensi-' . Carbon::now()->format('Y-m-d') . '.xlsx');
    }

    private function getAllReportData(Request $request)
    {
        return [
            'stats'           => $this->queryStatistikUtama($request),
            'laporanPerKelas' => $this->queryLaporanPerKelas($request),
            'laporanGuru'     => $this->queryLaporanGuru($request),
        ];
    }

    private function getReportFilters(Request $request)
    {
        $filters = $request->only(['bulan', 'id_kelas']);

        if (empty($filters['bulan']) || (is_string($filters['bulan']) && strtolower($filters['bulan']) === 'null')) {
            $filters['bulan'] = Carbon::now()->format('Y-m');
        }

        if (!empty($filters['id_kelas']) && $filters['id_kelas'] !== 'semua') {
            $k = Kelas::find($filters['id_kelas']);
            $nama = $k ? trim(($k->tingkat ?? '') . ' ' . ($k->jurusan ?? '')) : $filters['id_kelas'];
            $filters['nama_kelas'] = $nama !== '' ? $nama : $filters['id_kelas'];
        } else {
            $filters['nama_kelas'] = 'Semua Kelas';
        }

        return $filters;
    }

    /**
     * Tren kehadiran mingguan (%) untuk bulan terpilih.
     * Output: { labels: [], siswaData: [], guruData: [] }
     */
    private function queryKehadiranMingguan(Request $request)
    {
        $bulanInput    = $request->input('bulan');
        $selectedMonth = $this->safeParseMonth($bulanInput, 'Y-m');

        $startOfMonth = $selectedMonth->copy()->startOfMonth();
        $endOfMonth   = $selectedMonth->copy()->endOfMonth();

        $totalSiswa = Siswa::where('status', 'Aktif')->count() ?: 1;
        $totalGuru  = Guru::where('status', 'Aktif')->count() ?: 1;

        // pakai WEEK(..., 1) => minggu mulai Senin
        $absensiSiswa = AbsensiSiswa::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("WEEK(tanggal, 1) as minggu, COUNT(*) as total")
            ->groupBy(DB::raw("WEEK(tanggal, 1)"))
            ->pluck('total', 'minggu');

        $absensiGuru = AbsensiGuru::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->where('status_kehadiran', 'Hadir')
            ->selectRaw("WEEK(tanggal, 1) as minggu, COUNT(*) as total")
            ->groupBy(DB::raw("WEEK(tanggal, 1)"))
            ->pluck('total', 'minggu');

        // hitung daftar minggu dan jumlah hari kerja per minggu itu (Mon..Sun -> hanya weekdays)
        $weeks = [];
        $d = $startOfMonth->copy();
        while ($d->lte($endOfMonth)) {
            $weekNumber = $d->weekOfYear;
            if (!isset($weeks[$weekNumber])) {
                $startOfWeek = $d->copy()->startOfWeek(Carbon::MONDAY);
                $endOfWeek   = $d->copy()->endOfWeek(Carbon::SUNDAY);
                $weeks[$weekNumber] = [
                    'label'    => 'Minggu ' . $d->weekOfMonth,
                    'workdays' => $startOfWeek->diffInWeekdays($endOfWeek) + 1,
                ];
            }
            $d->addDay();
        }

        $labels    = [];
        $siswaData = [];
        $guruData  = [];

        foreach ($weeks as $weekNum => $info) {
            $labels[] = $info['label'];

            $hadirSiswa = (int) ($absensiSiswa->get($weekNum, 0));
            $persenSis  = ($hadirSiswa / ($totalSiswa * max(1, $info['workdays']))) * 100;
            $siswaData[] = round($persenSis, 1);

            $hadirGuru = (int) ($absensiGuru->get($weekNum, 0));
            $persenGru = ($hadirGuru / ($totalGuru * max(1, $info['workdays']))) * 100;
            $guruData[] = round($persenGru, 1);
        }

        return [
            'labels'    => $labels,
            'siswaData' => $siswaData,
            'guruData'  => $guruData,
        ];
    }

    /**
     * Detail harian siswa untuk tanggal & kelas terpilih (JSON).
     */
    public function getDetailHarian(Request $request)
    {
        $request->validate([
            'date'     => 'required|date_format:Y-m-d',
            'id_kelas' => 'required|string',
        ]);

        $tanggal  = $request->date;
        $id_kelas = $request->id_kelas;

        // Ambil semua siswa aktif (kelas tertentu atau semua)
        $qSiswa = Siswa::query()->where('status', 'Aktif');
        if ($id_kelas !== 'semua') {
            $qSiswa->where('id_kelas', $id_kelas);
        }

        $semuaSiswa = $qSiswa->select('id_siswa', 'nama_lengkap', 'nis')->get()->keyBy('id_siswa');

        // Absensi tanggal tsb untuk siswa-siswa tadi
        $absensiMasuk = AbsensiSiswa::whereDate('tanggal', $tanggal)
            ->whereIn('id_siswa', $semuaSiswa->keys())
            ->get()
            ->keyBy('id_siswa');

        // Gabungkan
        $detail = $semuaSiswa->map(function ($s) use ($absensiMasuk) {
            $absen = $absensiMasuk->get($s->id_siswa);
            $jamMasuk = ($absen && $absen->jam_masuk) ? Carbon::parse($absen->jam_masuk)->format('H:i') : '-';

            return [
                'nama'       => $s->nama_lengkap,
                'nis'        => $s->nis,
                'status'     => $absen ? $absen->status_kehadiran : 'Alfa',
                'jam_masuk'  => $jamMasuk,
                'keterangan' => $absen?->keterangan ?? '-',
            ];
        })->values();

        return response()->json($detail);
    }
}
