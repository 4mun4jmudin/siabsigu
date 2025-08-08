<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // --- 1. Statistik Utama ---
        $totalGuru = Guru::where('status', 'Aktif')->count();
        $totalSiswa = Siswa::where('status', 'Aktif')->count();
        $totalMapel = MataPelajaran::count();
        
        // Mengatur locale Carbon ke bahasa Indonesia untuk nama hari
        Carbon::setLocale('id');
        $namaHariIni = Carbon::now()->translatedFormat('l'); // Hasilnya 'Senin', 'Selasa', dst.
        $totalJadwalHariIni = JadwalMengajar::where('hari', $namaHariIni)->count();

        // --- 2. Ringkasan Kehadiran Hari Ini ---
        $kehadiranGuruHariIni = AbsensiGuru::whereDate('tanggal', today())->get();
        $guruHadir = $kehadiranGuruHariIni->where('status_kehadiran', 'Hadir')->count();
        $guruTidakHadir = $kehadiranGuruHariIni->count() - $guruHadir;

        $kehadiranSiswaHariIni = AbsensiSiswa::whereDate('tanggal', today())->get();
        $siswaHadir = $kehadiranSiswaHariIni->where('status_kehadiran', 'Hadir')->count();
        $siswaTidakHadir = $kehadiranSiswaHariIni->count() - $siswaHadir;

        // --- 4. Aktivitas Terbaru ---
        // Mengambil 5 log aktivitas terakhir, diurutkan berdasarkan kolom 'waktu'
        $latestActivities = LogAktivitas::with('pengguna')->latest('waktu')->take(5)->get();

        // --- 5. Pengumuman ---
        // Mengambil 3 pengumuman terakhir
        $announcements = Pengumuman::latest('tanggal_terbit')->take(3)->get();


        // Mengirim semua data yang sudah diolah ke komponen React
        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'totalGuru' => $totalGuru,
                'totalSiswa' => $totalSiswa,
                'totalMapel' => $totalMapel,
                'totalJadwal' => $totalJadwalHariIni,
                'kehadiranGuru' => [
                    'hadir' => $guruHadir,
                    'tidakHadir' => $guruTidakHadir,
                ],
                'kehadiranSiswa' => [
                    'hadir' => $siswaHadir,
                    'tidakHadir' => $siswaTidakHadir,
                ],
            ],
            'latestActivities' => $latestActivities,
            'announcements' => $announcements,
        ]);
    }
}