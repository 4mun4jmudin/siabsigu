<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\JadwalMengajar;
use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Menampilkan halaman dasbor untuk guru.
     */
    public function index()
    {
        $user = Auth::user();
        $guru = $user->guru;

        // Pastikan pengguna adalah seorang guru
        if (!$guru) {
            Auth::logout();
            return redirect('/login')->with('error', 'Akses ditolak. Akun Anda tidak terdaftar sebagai guru.');
        }

        // --- Mengambil Data untuk Dasbor ---

        // 1. Jadwal Mengajar Hari Ini
        // Menggunakan Carbon untuk mendapatkan nama hari dalam Bahasa Indonesia
        Carbon::setLocale('id');
        $hariIni = Carbon::now()->translatedFormat('l'); // Hasilnya 'Senin', 'Selasa', dst.

        $jadwalHariIni = JadwalMengajar::with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai', 'asc')
            ->get();

        // 2. Statistik Cepat Guru (Contoh)
        $stats = [
            'total_kelas' => JadwalMengajar::where('id_guru', $guru->id_guru)->distinct('id_kelas')->count(),
            'total_mapel' => JadwalMengajar::where('id_guru', $guru->id_guru)->distinct('id_mapel')->count(),
            // Anda bisa menambahkan logika untuk menghitung total jam/minggu jika ada kolom JP di jadwal
            'total_jam_seminggu' => 0, // Placeholder
        ];

        // 3. Pengumuman (ambil 3 terbaru yang ditujukan untuk Guru atau Semua)
        $pengumuman = Pengumuman::whereIn('target_level', ['Guru', 'Semua'])
            ->latest('tanggal_terbit')
            ->take(3)
            ->get();

        // 4. Render halaman Inertia dan kirim data sebagai props
        return Inertia::render('Guru/Dashboard', [
            'guru' => $guru,
            'jadwalHariIni' => $jadwalHariIni,
            'stats' => $stats,
            'pengumuman' => $pengumuman,
        ]);
    }
}