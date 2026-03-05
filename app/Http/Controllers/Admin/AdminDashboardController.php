<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Routing\Controller as BaseController;
use App\Models\AbsensiGuru;
use App\Models\AbsensiSiswa;
use App\Models\Guru;
use App\Models\JadwalMengajar;
use App\Models\LogAktivitas;
use App\Models\MataPelajaran;
use App\Models\Pengumuman;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AdminDashboardController extends BaseController
{
    // ✅ FIX 2: Add constructor-level authorization check (Defence in Depth)
    public function __construct()
    {
        // Double-check authorization at controller level
        // This is a fallback in case middleware is bypassed
        $this->middleware(function ($request, $next) {
            if (!Auth::check() || Auth::user()->level !== 'Admin') {
                // Log unauthorized access attempt
                Log::warning('Unauthorized admin dashboard access attempt', [
                    'user_id' => Auth::id(),
                    'user_level' => Auth::user()?->level,
                    'ip_address' => $request->ip(),
                    'timestamp' => now(),
                ]);

                // Return 403 Forbidden with custom error page
                return response()->view('errors.403', [
                    'message' => 'Anda tidak memiliki akses ke dashboard admin.',
                ], Response::HTTP_FORBIDDEN);
            }
            return $next($request);
        });
    }

    public function index()
    {
        // Locale Indonesia untuk nama hari
        Carbon::setLocale('id');
        $today         = Carbon::today();
        $startOfMonth  = Carbon::now()->startOfMonth();
        $endOfMonth    = Carbon::now()->endOfDay();
        $hariNamaID    = Carbon::now()->translatedFormat('l'); // "Senin", "Selasa", ...

        // ===================== 1) Statistik dasar — CACHE 60 menit =====================
        $statsBasic = Cache::remember('dashboard:stats_basic', now()->addHour(), function () use ($hariNamaID) {
            return [
                'totalGuru'   => Guru::where('status', 'Aktif')->count(),
                'totalSiswa'  => Siswa::where('status', 'Aktif')->count(),
                'totalMapel'  => MataPelajaran::count(),
                'totalJadwal' => JadwalMengajar::where('hari', $hariNamaID)->count(),
            ];
        });

        // ===================== 2) Ringkasan Kehadiran Hari Ini — REAL-TIME =====================
        $kehadiranGuruHariIni   = AbsensiGuru::whereDate('tanggal', $today);
        $guruHadir              = (clone $kehadiranGuruHariIni)->where('status_kehadiran', 'Hadir')->count();
        $totalBarisGuru         = (clone $kehadiranGuruHariIni)->count();
        $guruTidakHadir         = max(0, $totalBarisGuru - $guruHadir);

        $kehadiranSiswaHariIni  = AbsensiSiswa::whereDate('tanggal', $today);
        $siswaHadir             = (clone $kehadiranSiswaHariIni)->where('status_kehadiran', 'Hadir')->count();
        $totalBarisSiswa        = (clone $kehadiranSiswaHariIni)->count();
        $siswaTidakHadir        = max(0, $totalBarisSiswa - $siswaHadir);

        // ===================== 3) Ringkasan Per Kelas =====================
        // Hari Ini — REAL-TIME
        $perKelasHariIni = DB::table('tbl_absensi_siswa as a')
            ->join('tbl_siswa as s', 's.id_siswa', '=', 'a.id_siswa')
            ->join('tbl_kelas as k', 'k.id_kelas', '=', 's.id_kelas')
            ->select(
                'k.id_kelas',
                'k.tingkat',
                'k.jurusan',
                DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) AS hadir'),
                DB::raw('SUM(CASE WHEN a.status_kehadiran <> "Hadir" THEN 1 ELSE 0 END) AS tidak_hadir'),
                DB::raw('AVG(COALESCE(a.menit_keterlambatan,0)) AS telat_menit')
            )
            ->whereDate('a.tanggal', $today)
            ->groupBy('k.id_kelas', 'k.tingkat', 'k.jurusan')
            ->orderBy('k.tingkat')
            ->get()
            ->map(function ($r) {
                return [
                    'kelas'       => trim(($r->tingkat ?? '') . ' ' . ($r->jurusan ?? '')) ?: $r->id_kelas,
                    'hadir'       => (int) $r->hadir,
                    'tidakHadir'  => (int) $r->tidak_hadir,
                    'telatMenit'  => round((float)$r->telat_menit),
                ];
            })
            ->values();

        // Bulan Ini — CACHE 15 menit
        $monthKey = $startOfMonth->format('Y-m');
        $perKelasBulanIni = Cache::remember("dashboard:kelas_bulan:{$monthKey}", now()->addMinutes(15), function () use ($startOfMonth, $endOfMonth) {
            return DB::table('tbl_absensi_siswa as a')
                ->join('tbl_siswa as s', 's.id_siswa', '=', 'a.id_siswa')
                ->join('tbl_kelas as k', 'k.id_kelas', '=', 's.id_kelas')
                ->select(
                    'k.id_kelas',
                    'k.tingkat',
                    'k.jurusan',
                    DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) AS hadir'),
                    DB::raw('SUM(CASE WHEN a.status_kehadiran <> "Hadir" THEN 1 ELSE 0 END) AS tidak_hadir'),
                    DB::raw('AVG(COALESCE(a.menit_keterlambatan,0)) AS telat_menit')
                )
                ->whereBetween('a.tanggal', [$startOfMonth, $endOfMonth])
                ->groupBy('k.id_kelas', 'k.tingkat', 'k.jurusan')
                ->orderBy('k.tingkat')
                ->get()
                ->map(function ($r) {
                    return [
                        'kelas'       => trim(($r->tingkat ?? '') . ' ' . ($r->jurusan ?? '')) ?: $r->id_kelas,
                        'hadir'       => (int) $r->hadir,
                        'tidakHadir'  => (int) $r->tidak_hadir,
                        'telatMenit'  => round((float)$r->telat_menit),
                    ];
                })
                ->values();
        });

        // ===================== 4) Ringkasan Per Guru =====================
        // Hari Ini — REAL-TIME
        $perGuruHariIni = DB::table('tbl_absensi_guru as a')
            ->join('tbl_guru as g', 'g.id_guru', '=', 'a.id_guru')
            ->select(
                'g.id_guru',
                'g.nama_lengkap',
                DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) AS hadir'),
                DB::raw('SUM(CASE WHEN a.status_kehadiran <> "Hadir" THEN 1 ELSE 0 END) AS tidak_hadir'),
                DB::raw('AVG(COALESCE(a.menit_keterlambatan,0)) AS telat_menit')
            )
            ->whereDate('a.tanggal', $today)
            ->groupBy('g.id_guru', 'g.nama_lengkap')
            ->orderBy('g.nama_lengkap')
            ->get()
            ->map(function ($r) {
                return [
                    'guru'       => $r->nama_lengkap,
                    'hadir'      => (int) $r->hadir,
                    'tidakHadir' => (int) $r->tidak_hadir,
                    'telatMenit' => round((float)$r->telat_menit),
                ];
            })
            ->values();

        // Bulan Ini — CACHE 15 menit
        $perGuruBulanIni = Cache::remember("dashboard:guru_bulan:{$monthKey}", now()->addMinutes(15), function () use ($startOfMonth, $endOfMonth) {
            return DB::table('tbl_absensi_guru as a')
                ->join('tbl_guru as g', 'g.id_guru', '=', 'a.id_guru')
                ->select(
                    'g.id_guru',
                    'g.nama_lengkap',
                    DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) AS hadir'),
                    DB::raw('SUM(CASE WHEN a.status_kehadiran <> "Hadir" THEN 1 ELSE 0 END) AS tidak_hadir'),
                    DB::raw('AVG(COALESCE(a.menit_keterlambatan,0)) AS telat_menit')
                )
                ->whereBetween('a.tanggal', [$startOfMonth, $endOfMonth])
                ->groupBy('g.id_guru', 'g.nama_lengkap')
                ->orderBy('g.nama_lengkap')
                ->get()
                ->map(function ($r) {
                    return [
                        'guru'       => $r->nama_lengkap,
                        'hadir'      => (int) $r->hadir,
                        'tidakHadir' => (int) $r->tidak_hadir,
                        'telatMenit' => round((float)$r->telat_menit),
                    ];
                })
                ->values();
        });

        // ===================== 5) Tren Mingguan — CACHE 30 menit =====================
        $buildWeeklyTrend = function (string $table) {
            $colTanggal = 'a.tanggal';
            $rows = DB::table($table . ' as a')
                ->select(
                    DB::raw("YEARWEEK($colTanggal, 3) as yw"),
                    DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) as hadir'),
                    DB::raw('COUNT(*) as total')
                )
                ->where($colTanggal, '>=', Carbon::now()->subWeeks(12)->startOfWeek())
                ->groupBy('yw')
                ->orderBy('yw')
                ->get();

            $trend = $rows->map(function ($r) {
                $total = max(1, (int)$r->total);
                $percent = round(((int)$r->hadir / $total) * 100);
                $label = 'W' . substr((string)$r->yw, -2);
                return ['label' => $label, 'value' => $percent];
            })->values();

            return $trend->take(-4)->values();
        };

        $trendSiswa = Cache::remember('dashboard:trend_siswa', now()->addMinutes(30), fn () => $buildWeeklyTrend('tbl_absensi_siswa'));
        $trendGuru  = Cache::remember('dashboard:trend_guru', now()->addMinutes(30), fn () => $buildWeeklyTrend('tbl_absensi_guru'));

        // ===================== 6) Sparkline 30 hari — CACHE 30 menit =====================
        $sparkLast30 = Cache::remember('dashboard:spark_30d', now()->addMinutes(30), function () {
            $dailyRows = DB::table('tbl_absensi_siswa as a')
                ->select(
                    DB::raw('DATE(a.tanggal) as d'),
                    DB::raw('SUM(CASE WHEN a.status_kehadiran = "Hadir" THEN 1 ELSE 0 END) as hadir'),
                    DB::raw('COUNT(*) as total')
                )
                ->where('a.tanggal', '>=', Carbon::now()->subDays(30)->startOfDay())
                ->groupBy('d')
                ->orderBy('d')
                ->get();

            return $dailyRows->map(function ($r) {
                $total = max(1, (int)$r->total);
                return (int) round(((int)$r->hadir / $total) * 100);
            })->values();
        });

        // ===================== 7) Aktivitas & Pengumuman — CACHE 5 menit =====================
        $latestActivities = Cache::remember('dashboard:activities', now()->addMinutes(5), function () {
            return LogAktivitas::with('pengguna')
                ->latest('waktu')
                ->take(5)
                ->get();
        });

        $announcements = Cache::remember('dashboard:announcements', now()->addMinutes(5), function () {
            return Pengumuman::latest('tanggal_terbit')
                ->take(5)
                ->get();
        });

        // ===================== 8) Mode admin (Absensi / Full) =====================
        $adminMode = session('admin_mode', 'full');

        return Inertia::render('admin/Dashboard', [
            'adminMode' => $adminMode,
            'stats' => [
                'totalGuru'   => $statsBasic['totalGuru'],
                'totalSiswa'  => $statsBasic['totalSiswa'],
                'totalMapel'  => $statsBasic['totalMapel'],
                'totalJadwal' => $statsBasic['totalJadwal'],
                'kehadiranGuru' => [
                    'hadir'       => $guruHadir,
                    'tidakHadir'  => $guruTidakHadir,
                ],
                'kehadiranSiswa' => [
                    'hadir'       => $siswaHadir,
                    'tidakHadir'  => $siswaTidakHadir,
                ],

                // Ringkasan tabel
                'perKelasHariIni'  => $perKelasHariIni,
                'perKelasBulanIni' => $perKelasBulanIni,
                'perGuruHariIni'   => $perGuruHariIni,
                'perGuruBulanIni'  => $perGuruBulanIni,

                // Tren & spark
                'trendSiswa'  => $trendSiswa,
                'trendGuru'   => $trendGuru,
                'sparkLast30' => $sparkLast30,
            ],
            'latestActivities' => $latestActivities,
            'announcements'    => $announcements,
        ]);
    }

    public function updateMode(Request $request)
    {
        $request->validate(['mode' => 'required|in:absensi,full']);
        $request->session()->put('admin_mode', $request->input('mode'));
        return back()->with('success', 'Mode diperbarui ke: ' . ucfirst($request->input('mode')));
    }
}
