<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use App\Models\Pengaturan;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AbsensiController extends Controller
{
    /**
     * Menampilkan halaman dasbor dan absensi siswa.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user  = Auth::user();
        $siswa = $user->siswa;

        if (!$siswa) {
            Auth::logout();
            $request->session()->invalidate();
            return redirect('/login/siswa')->with('error', 'Akun tidak terhubung dengan data siswa.');
        }

        $tz    = config('app.timezone');
        $today = Carbon::today($tz);
        $now   = Carbon::now($tz);

        // 1. Ambil Pengaturan
        $pengaturan = Pengaturan::first();

        // Default jam jika belum diatur admin
        $jamMasukStr  = $pengaturan?->jam_masuk_siswa ?? '07:00:00';
        $jamPulangStr = $pengaturan?->jam_pulang_siswa ?? '15:00:00';

        // Batas waktu akhir absen masuk kita samakan dengan jam pulang sekolah
        $batasWaktuAbsen = $jamPulangStr;

        // Ambil data absensi hari ini
        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        // Filter Riwayat
        $filter = $request->input('filter', 'all');
        $year   = (int) $request->input('year', $now->year);
        $month  = (int) $request->input('month', $now->month);

        $riwayatQuery = AbsensiSiswa::where('id_siswa', $siswa->id_siswa);

        switch ($filter) {
            case 'week':
                $riwayatQuery->whereBetween('tanggal', [Carbon::today()->subDays(6), Carbon::today()]);
                break;
            case 'month':
                $riwayatQuery->whereYear('tanggal', $year)->whereMonth('tanggal', $month);
                break;
            case 'year':
                $riwayatQuery->whereYear('tanggal', $year);
                break;
            default: 
                $riwayatQuery->take(30);
                break;
        }
        
        $riwayatAbsensi = $riwayatQuery->orderBy('tanggal', 'desc')->get();

        $pengaturanForFrontend = [
            'jam_masuk_siswa'          => $jamMasukStr,
            'jam_pulang_siswa'         => $jamPulangStr,
            'batas_waktu_absen_siswa'  => $batasWaktuAbsen,
            'lokasi_sekolah_latitude'  => $pengaturan?->lokasi_sekolah_latitude,
            'lokasi_sekolah_longitude' => $pengaturan?->lokasi_sekolah_longitude,
            'radius_absen_meters'      => $pengaturan?->radius_absen_meters ?? 200,
        ];

        return Inertia::render('Siswa/Dashboard', [
            'siswa'             => $siswa->load('kelas'),
            'absensiHariIni'    => $absensiHariIni,
            'riwayatAbsensi'    => $riwayatAbsensi,
            'batasWaktuAbsen'   => $batasWaktuAbsen,
            'pengaturan'        => $pengaturanForFrontend,
            'activeFilter'      => $filter,
        ]);
    }

    /**
     * Menyimpan data absensi (Masuk & Pulang).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'latitude'  => ['required', 'string'],
            'longitude' => ['required', 'string'],
            'mode'      => ['nullable', 'in:masuk,pulang'],
        ], [
            'latitude.required'  => 'Lokasi tidak terdeteksi. Izinkan akses GPS.',
            'longitude.required' => 'Lokasi tidak terdeteksi. Izinkan akses GPS.',
        ]);

        $user  = Auth::user();
        $siswa = $user->siswa;
        
        if (!$siswa) {
            return back()->with('error', 'Data siswa tidak ditemukan.');
        }

        $tz    = config('app.timezone');
        $today = Carbon::today($tz);
        $now   = Carbon::now($tz);

        $mode = $request->input('mode', 'masuk');

        // --- 1. AMBIL PENGATURAN & KONVERSI WAKTU ---
        $pengaturan = Pengaturan::first();
        
        $jamMasukStr  = $pengaturan?->jam_masuk_siswa ?? '07:00:00';
        $jamPulangStr = $pengaturan?->jam_pulang_siswa ?? '15:00:00';
        
        $jamMasukConfig  = Carbon::createFromTimeString($jamMasukStr, $tz);
        $jamPulangConfig = Carbon::createFromTimeString($jamPulangStr, $tz);

        // --- 2. CEK GEOFENCE (LOKASI) ---
        $schoolLat = $pengaturan?->lokasi_sekolah_latitude;
        $schoolLng = $pengaturan?->lokasi_sekolah_longitude;
        $radius    = (int) ($pengaturan?->radius_absen_meters ?? 200);

        if ($schoolLat && $schoolLng) {
            $jarak = $this->calculateDistance($schoolLat, $schoolLng, $request->latitude, $request->longitude);
            
            if ($jarak > $radius) {
                return back()->with('error', "Anda berada di luar jangkauan sekolah. Jarak: {$jarak}m (Max: {$radius}m).");
            }
        }

        $absensiExisting = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        // ==========================================
        // LOGIKA ABSEN MASUK
        // ==========================================
        if ($mode === 'masuk') {
            if ($absensiExisting) {
                return back()->with('error', 'Anda sudah melakukan absen masuk hari ini.');
            }

            // ATURAN 1: Tidak boleh absen masuk jika sudah lewat jam pulang (sekolah bubar)
            if ($now->greaterThan($jamPulangConfig)) {
                return back()->with('error', 'Waktu sekolah telah usai. Tidak bisa absen masuk.');
            }

            // ATURAN 2: Batas Awal Absensi (15 menit sebelum jam masuk)
            $waktuBolehAbsen = $jamMasukConfig->copy()->subMinutes(15);
            
            if ($now->lessThan($waktuBolehAbsen)) {
                return back()->with('error', 'Absensi belum dibuka. Silakan tunggu hingga pukul ' . $waktuBolehAbsen->format('H:i') . ' (15 menit sebelum jam masuk).');
            }

            // Hitung Keterlambatan
            $menitTerlambat = 0;
            if ($now->greaterThan($jamMasukConfig)) {
                $menitTerlambat = (int) $now->diffInMinutes($jamMasukConfig);
            }

            AbsensiSiswa::create([
                'id_absensi'          => 'AS-' . $today->format('ymd') . '-' . $siswa->id_siswa,
                'id_siswa'            => $siswa->id_siswa,
                'tanggal'             => $today->toDateString(),
                'jam_masuk'           => $now->format('H:i:s'),
                'jam_pulang'          => null,
                'status_kehadiran'    => 'Hadir',
                'menit_keterlambatan' => $menitTerlambat,
                'metode_absen'        => 'GPS',
                'latitude'            => $request->latitude,
                'longitude'           => $request->longitude,
            ]);

            return back()->with('success', 'Berhasil Absen Masuk!');
        }

        // ==========================================
        // LOGIKA ABSEN PULANG
        // ==========================================
        if ($mode === 'pulang') {
            if (!$absensiExisting) {
                return back()->with('error', 'Anda belum absen masuk. Silakan absen masuk dulu.');
            }

            if ($absensiExisting->jam_pulang) {
                return back()->with('error', 'Anda sudah melakukan absen pulang hari ini.');
            }

            // Opsional: Validasi jika ingin siswa hanya boleh pulang setelah jam pulang sekolah
            // if ($now->lessThan($jamPulangConfig)) {
            //     return back()->with('error', 'Belum waktunya pulang sekolah.');
            // }

            $absensiExisting->update([
                'jam_pulang' => $now->format('H:i:s'),
            ]);

            return back()->with('success', 'Berhasil Absen Pulang! Hati-hati di jalan.');
        }

        return back()->with('error', 'Mode absensi tidak valid.');
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return round($earthRadius * $c);
    }
}