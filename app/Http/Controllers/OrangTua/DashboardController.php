<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use App\Models\JadwalMengajar;
use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $orangTua = $user->orangTuaWali;

        if (!$orangTua || !$orangTua->id_siswa) {
            return Inertia::render('OrangTua/Dashboard', ['siswa' => null]);
        }

        $siswa = $orangTua->siswa()->with('kelas')->first();

        // 1. Ambil Jadwal Pelajaran Hari Ini
        $hariIni = Carbon::now()->isoFormat('dddd');
        $jadwalHariIni = JadwalMengajar::where('id_kelas', $siswa->id_kelas)
            ->where('hari', $hariIni)
            ->with(['mapel', 'guru'])
            ->orderBy('jam_mulai', 'asc')
            ->get();

        // 2. Ambil absensi hari ini
        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', Carbon::today())
            ->first();

        // 3. Ambil riwayat absensi 5 hari terakhir
        $riwayatAbsensi = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        // 4. Hitung statistik dan persentase kehadiran 30 hari terakhir
        $absensi30Hari = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->where('tanggal', '>=', now()->subDays(30))
            ->get();
        
        $totalHari = $absensi30Hari->count();
        $totalHadir = $absensi30Hari->where('status_kehadiran', 'Hadir')->count();
        $persentaseKehadiran = $totalHari > 0 ? round(($totalHadir / $totalHari) * 100) : 0;
        
        $summary = [
            'hadir' => $totalHadir,
            'sakit' => $absensi30Hari->where('status_kehadiran', 'Sakit')->count(),
            'izin' => $absensi30Hari->where('status_kehadiran', 'Izin')->count(),
            'alfa' => $absensi30Hari->where('status_kehadiran', 'Alfa')->count(),
        ];

        // 5. Ambil 3 pengumuman terbaru
        $pengumuman = Pengumuman::whereIn('target_level', ['Orang Tua', 'Semua'])
            ->orderBy('tanggal_terbit', 'desc')
            ->limit(3)
            ->get();

        // --- AWAL KODE BARU ---
        // 6. Siapkan data untuk grafik tren kehadiran mingguan
        $trenKehadiran = $this->generateWeeklyAttendanceTrend($siswa->id_siswa);
        // --- AKHIR KODE BARU ---

        return Inertia::render('OrangTua/Dashboard', [
            'siswa' => $siswa,
            'absensiHariIni' => $absensiHariIni,
            'riwayatAbsensi' => $riwayatAbsensi,
            'absensiSummary' => $summary,
            'persentaseKehadiran' => $persentaseKehadiran,
            'pengumuman' => $pengumuman,
            'jadwalHariIni' => $jadwalHariIni,
            'trenKehadiran' => $trenKehadiran, // Kirim data grafik ke frontend
        ]);
    }

    /**
     * Helper untuk menghasilkan data tren kehadiran per minggu (4 minggu terakhir).
     */
    private function generateWeeklyAttendanceTrend($id_siswa)
    {
        $endDate = Carbon::now()->endOfDay();
        $startDate = Carbon::now()->subWeeks(4)->startOfDay();

        $absensi = AbsensiSiswa::where('id_siswa', $id_siswa)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->select('tanggal', 'status_kehadiran')
            ->get();

        $weeklyData = [];

        for ($i = 0; $i < 4; $i++) {
            $weekStartDate = $startDate->copy()->addWeeks($i);
            $weekEndDate = $weekStartDate->copy()->endOfWeek();

            $hadirCount = $absensi->where('status_kehadiran', 'Hadir')
                                ->whereBetween('tanggal', [$weekStartDate, $weekEndDate])
                                ->count();
            
            $alfaCount = $absensi->where('status_kehadiran', 'Alfa')
                                ->whereBetween('tanggal', [$weekStartDate, $weekEndDate])
                                ->count();

            $weeklyData[] = [
                'label' => 'Minggu ' . ($i + 1),
                'hadir' => $hadirCount,
                'alfa' => $alfaCount,
            ];
        }

        return $weeklyData;
    }
}