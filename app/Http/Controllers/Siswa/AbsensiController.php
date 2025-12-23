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
     * Menampilkan halaman dasbor dan absensi untuk siswa yang sedang login.
     * Fitur:
     * - Status absensi hari ini
     * - Riwayat absensi dengan filter (all / week / month / year)
     * - Meneruskan pengaturan admin (jam masuk/pulang, lokasi, radius, batas terlambat)
     *
     * @param Request $request
     * @return Response|RedirectResponse
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user  = Auth::user();
        $siswa = $user->siswa; // Mengambil data siswa yang terhubung dengan akun user

        // Jika akun pengguna tidak terhubung ke profil siswa → paksa logout
        if (!$siswa) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login/siswa')->with('error', 'Akun Anda tidak terhubung dengan data siswa. Harap hubungi administrator.');
        }

        $tz    = config('app.timezone');
        $today = Carbon::today($tz);
        $now   = Carbon::now($tz);

        // Cari data absensi siswa untuk hari ini
        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        // Ambil pengaturan global
        $pengaturan = Pengaturan::first();

        // Default batas waktu absen harus format waktu valid
        $batasWaktuAbsen = $pengaturan?->batas_waktu_absen_siswa ?? '13:00:00';

        // ==== Filter Riwayat: all / week / month / year ====
        $filter = $request->input('filter', 'all');
        $year   = (int) $request->input('year', (int) $now->year);
        $month  = (int) $request->input('month', (int) $now->month);

        $riwayatQuery = AbsensiSiswa::where('id_siswa', $siswa->id_siswa);

        switch ($filter) {
            case 'week':
                // 7 hari terakhir (hari ini + 6 hari ke belakang)
                $end   = $today->copy();
                $start = $today->copy()->subDays(6);
                $riwayatQuery->whereBetween('tanggal', [
                    $start->toDateString(),
                    $end->toDateString(),
                ]);
                $riwayatQuery->orderBy('tanggal', 'desc');
                break;

            case 'month':
                // Bulan & tahun tertentu
                $riwayatQuery
                    ->whereYear('tanggal', $year)
                    ->whereMonth('tanggal', $month)
                    ->orderBy('tanggal', 'desc');
                break;

            case 'year':
                // Satu tahun penuh
                $riwayatQuery
                    ->whereYear('tanggal', $year)
                    ->orderBy('tanggal', 'desc');
                break;

            case 'all':
            default:
                // Default: 30 data terbaru
                $riwayatQuery
                    ->orderBy('tanggal', 'desc')
                    ->take(30);
                break;
        }

        $riwayatAbsensi = $riwayatQuery->get();

        // Siapkan pengaturan yang dikirim ke frontend (hanya field relevan)
        $pengaturanForFrontend = $pengaturan ? [
            'jam_masuk_siswa'          => $pengaturan->jam_masuk_siswa,
            'jam_pulang_siswa'         => $pengaturan->jam_pulang_siswa,
            'batas_waktu_absen_siswa'  => $pengaturan->batas_waktu_absen_siswa,
            'batas_terlambat_siswa'    => $pengaturan->batas_terlambat_siswa,
            'lokasi_sekolah_latitude'  => $pengaturan->lokasi_sekolah_latitude,
            'lokasi_sekolah_longitude' => $pengaturan->lokasi_sekolah_longitude,
            'radius_absen_meters'      => $pengaturan->radius_absen_meters,
        ] : null;

        // Render halaman frontend 'Siswa/Dashboard' dengan data yang diperlukan
        return Inertia::render('Siswa/Dashboard', [
            'siswa'           => $siswa->load('kelas'), // Kirim data siswa beserta relasi kelasnya
            'absensiHariIni'  => $absensiHariIni,
            'riwayatAbsensi'  => $riwayatAbsensi,
            'batasWaktuAbsen' => $batasWaktuAbsen,
            // 'pengaturan'      => $pengaturanForFrontend,
            'pengaturanAbsensi' => $pengaturanForFrontend,

            // info filter (opsional, bisa dipakai buat sync state di frontend)
            'activeFilter'    => $filter,
            'filterYear'      => $year,
            'filterMonth'     => $month,
        ]);
    }

    /**
     * Menyimpan data absensi masuk / pulang.
     * Mode:
     * - mode = "masuk"  → absensi masuk (cek batas waktu & geofence)
     * - mode = "pulang" → absensi pulang (cek sudah masuk, belum pulang, dan jam_pulang_siswa)
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'latitude'  => ['required', 'regex:/^-?\d+(\.\d+)?$/'],
            'longitude' => ['required', 'regex:/^-?\d+(\.\d+)?$/'],
            'mode'      => ['nullable', 'in:masuk,pulang'],
        ], [
            'latitude.required'  => 'Lokasi (latitude) tidak ditemukan. Izinkan akses lokasi di browser.',
            'longitude.required' => 'Lokasi (longitude) tidak ditemukan. Izinkan akses lokasi di browser.',
            'mode.in'            => 'Mode absensi tidak valid.',
        ]);

        $user  = Auth::user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return back()->with('error', 'Profil siswa tidak ditemukan. Tidak dapat merekam absensi.');
        }

        $mode = $request->input('mode', 'masuk'); // default: masuk

        $tz    = config('app.timezone');
        $today = Carbon::today($tz);
        $now   = Carbon::now($tz);

        // Ambil pengaturan (jam masuk, pulang, batas waktu, lokasi sekolah & radius)
        $pengaturan         = Pengaturan::first();
        $batasWaktuAbsenStr = $pengaturan?->batas_waktu_absen_siswa ?? '13:00:00'; // default valid
        $jamMasukStr        = $pengaturan?->jam_masuk_siswa ?? '07:00:00';
        $jamPulangStr       = $pengaturan?->jam_pulang_siswa ?? '15:00:00';
        $toleransiTelat     = (int) ($pengaturan?->batas_terlambat_siswa ?? 0); // kalau mau dipakai nanti

        // Konversi ke Carbon dengan tanggal hari ini
        $batasWaktuAbsen = Carbon::parse($batasWaktuAbsenStr, $tz)
            ->setDate($today->year, $today->month, $today->day);
        $jamMasukSekolah = Carbon::parse($jamMasukStr, $tz)
            ->setDate($today->year, $today->month, $today->day);
        $jamPulangSekolah = Carbon::parse($jamPulangStr, $tz)
            ->setDate($today->year, $today->month, $today->day);

        // Ambil record absensi hari ini (jika ada)
        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        // Ambil lokasi sekolah dari pengaturan (boleh null)
        $schoolLat     = $pengaturan?->lokasi_sekolah_latitude ?? null;
        $schoolLng     = $pengaturan?->lokasi_sekolah_longitude ?? null;
        $allowedRadius = (int) ($pengaturan?->radius_absen_meters ?? 200); // default 200 meter

        $userLat = (float) $request->input('latitude');
        $userLng = (float) $request->input('longitude');

        // helper: hitung jarak (meter) menggunakan rumus Haversine
        $haversine = function ($lat1, $lon1, $lat2, $lon2) {
            $earthRadius = 6371000; // meters
            $dLat        = deg2rad($lat2 - $lat1);
            $dLon        = deg2rad($lon2 - $lon1);
            $a           = sin($dLat / 2) * sin($dLat / 2)
                + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
                * sin($dLon / 2) * sin($dLon / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            return $earthRadius * $c;
        };

        // Validasi geofence untuk semua mode (masuk & pulang)
        if ($schoolLat !== null && $schoolLng !== null) {
            $distance = $haversine($schoolLat, $schoolLng, $userLat, $userLng); // meters

            if ($distance > $allowedRadius) {
                $distanceRounded = round($distance);
                return back()->with('error', "Anda berada di luar area absensi sekolah (jarak: {$distanceRounded} m). Pastikan berada di lokasi sekolah untuk absen.");
            }
        }
        // jika lokasi sekolah belum diset, kita lanjutkan — admin harus mengkonfigurasi pengaturan lokasi.

        // ================== MODE ABSEN MASUK ==================
        if ($mode === 'masuk') {
            // Cek apakah sudah melewati batas waktu absen
            if ($now->greaterThan($batasWaktuAbsen)) {
                return back()->with('error', 'Waktu absensi sudah berakhir. Silakan lapor ke guru piket.');
            }

            // Cegah absen ganda (kalau sudah ada record hari ini)
            if ($absensiHariIni) {
                return back()->with('error', 'Anda sudah melakukan absensi hari ini.');
            }

            // Hitung keterlambatan
            $menitKeterlambatan = 0;
            if ($now->greaterThan($jamMasukSekolah)) {
                $menitKeterlambatan = $now->diffInMinutes($jamMasukSekolah);
            }

            $metode = 'Manual';
            if ($request->filled('latitude') && $request->filled('longitude')) {
                $metode = 'GPS'; // standar satu kata
            }

            // Simpan record absensi masuk
            AbsensiSiswa::create([
                'id_absensi'          => 'AS-' . $today->format('ymd') . '-' . $siswa->id_siswa,
                'id_siswa'            => $siswa->id_siswa,
                'tanggal'             => $today->toDateString(),
                'jam_masuk'           => $now->format('H:i:s'),
                'jam_pulang'          => null,
                'status_kehadiran'    => 'Hadir',
                'menit_keterlambatan' => $menitKeterlambatan,
                'metode_absen'        => $metode,
                'latitude'            => (string) $userLat,
                'longitude'           => (string) $userLng,
            ]);

            return back()->with('success', 'Absensi masuk berhasil terekam!');
        }

        // ================== MODE ABSEN PULANG ==================

        // Pastikan sudah ada absensi masuk hari ini
        if (!$absensiHariIni) {
            return back()->with('error', 'Anda belum melakukan absensi masuk hari ini. Tidak dapat absen pulang.');
        }

        // Cegah jika jam pulang sudah terisi
        if ($absensiHariIni->jam_pulang) {
            return back()->with('error', 'Anda sudah melakukan absensi pulang hari ini.');
        }

        // Validasi jam pulang: tidak boleh sebelum jam_pulang_siswa
        if ($now->lessThan($jamPulangSekolah)) {
            return back()->with('error', 'Belum waktu absensi pulang. Tunggu sampai jam pulang yang ditentukan oleh sekolah.');
        }

        // Update jam pulang
        $absensiHariIni->update([
            'jam_pulang' => $now->format('H:i:s'),
            // kalau nanti ingin simpan koordinat pulang terpisah,
            // bisa tambahkan kolom baru di tabel (misal: latitude_pulang, longitude_pulang)
        ]);

        return back()->with('success', 'Absensi pulang berhasil terekam!');
    }
}
