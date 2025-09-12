<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AbsensiSiswa;
use App\Models\Pengaturan;
use Carbon\Carbon;

class SiswaDashboardController extends Controller
{
    public function index()
    {
        $siswa = Auth::user()->siswa;
        $today = Carbon::today()->toDateString();

        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->where('tanggal', $today)
            ->first();

        $pengaturan = Pengaturan::first();

        return response()->json([
            'siswa' => $siswa,
            'absensi_hari_ini' => $absensiHariIni,
            'pengaturan_sekolah' => [
                'jam_masuk' => $pengaturan->jam_masuk_siswa,
                'jam_pulang' => $pengaturan->jam_pulang_siswa,
            ],
        ]);
    }

    public function storeAbsensi()
    {
        $siswa = Auth::user()->siswa;
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->where('tanggal', $today)
            ->first();

        // Logika sama seperti di AbsensiController web
        if ($absensiHariIni && $absensiHariIni->jam_pulang) {
            return response()->json(['message' => 'Anda sudah melakukan absensi pulang hari ini.'], 422);
        }

        if ($absensiHariIni) { // Absen Pulang
            $absensiHariIni->update(['jam_pulang' => $now->toTimeString()]);
            return response()->json(['message' => 'Absen pulang berhasil dicatat.']);
        } else { // Absen Masuk
            $pengaturan = Pengaturan::first();
            $jamMasukSekolah = Carbon::parse($pengaturan->jam_masuk_siswa);
            $menitKeterlambatan = $now->diffInMinutes($jamMasukSekolah, false) < 0 ? $now->diffInMinutes($jamMasukSekolah) : 0;

            AbsensiSiswa::create([
                'id_absensi' => 'AS-' . date('ymd') . '-' . uniqid(),
                'id_siswa' => $siswa->id_siswa,
                'tanggal' => $today,
                'jam_masuk' => $now->toTimeString(),
                'status_kehadiran' => 'Hadir',
                'metode_absen' => 'Manual', // Bisa diubah jadi 'Mobile'
                'menit_keterlambatan' => $menitKeterlambatan,
            ]);

            return response()->json(['message' => 'Absen masuk berhasil dicatat.']);
        }
    }

    public function riwayatAbsensi(Request $request)
    {
        $siswa = Auth::user()->siswa;
        
        $riwayat = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->orderBy('tanggal', 'desc')
            ->paginate(20);

        return response()->json($riwayat);
    }
}