<?php

namespace App\Http\Controllers;

use App\Models\AbsensiSiswa;
use App\Models\Guru;
use App\Models\Pengaturan;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class DashboardRedirectController extends Controller
{
    /**
     * Menampilkan halaman landing page (Welcome).
     */
    public function welcome()
    {
        // 1. Ambil Data Statistik Real
        $siswaAktif = Siswa::where('status', 'Aktif')->count();
        $guruAktif  = Guru::where('status', 'Aktif')->count();

        // 2. Hitung Persentase Kehadiran (Rata-rata 30 hari terakhir)
        $totalAbsensi = AbsensiSiswa::where('tanggal', '>=', Carbon::now()->subDays(30))->count();
        $totalHadir   = AbsensiSiswa::where('tanggal', '>=', Carbon::now()->subDays(30))
            ->where('status_kehadiran', 'Hadir')
            ->count();

        $persentase = $totalAbsensi > 0 ? ($totalHadir / $totalAbsensi) * 100 : 0;

        // 3. Ambil Pengaturan Sekolah (Logo & Nama)
        $pengaturan = Pengaturan::first();

        return Inertia::render('Welcome', [
            'canLogin'       => Route::has('login'),
            'canRegister'    => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion'     => PHP_VERSION,
            'landingStats'   => [
                'siswa'     => $siswaAktif,
                'guru'      => $guruAktif,
                'kehadiran' => round($persentase, 1),
            ],
            'schoolData'     => [
                'nama' => $pengaturan->nama_sekolah ?? 'SMK IT ALHAWARI',
                'logo' => $pengaturan->logo_url,
            ]
        ]);
    }

    /**
     * Redirect ke dashboard masing-masing role setelah login.
     */
    public function redirect()
    {
        $level = Auth::user()?->level ?? null;

        return match ($level) {
            'Admin', 'Kepala Sekolah' => redirect()->route('admin.dashboard'),
            'Guru'                   => redirect()->route('guru.dashboard'),
            'Siswa'                  => redirect()->route('siswa.dashboard'),
            'Orang Tua'              => redirect()->route('orangtua.dashboard'),
            default                  => abort(403),
        };
    }
}
