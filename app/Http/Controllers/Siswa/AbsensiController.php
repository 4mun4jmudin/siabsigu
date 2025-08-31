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
     * Halaman ini akan menampilkan status absensi siswa untuk hari ini.
     *
     * @param Request $request
     * @return Response|RedirectResponse
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = Auth::user();
        $siswa = $user->siswa; // Mengambil data siswa yang terhubung dengan akun user

        // Pengecekan krusial: Jika akun pengguna tidak terhubung ke profil siswa,
        // paksa logout untuk mencegah error dan menjaga keamanan.
        if (!$siswa) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login/siswa')->with('error', 'Akun Anda tidak terhubung dengan data siswa. Harap hubungi administrator.');
        }

        // Cari data absensi siswa untuk hari ini
        $absensiHariIni = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', today())
            ->first();

        $riwayatAbsensi = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->latest('tanggal') // Urutkan dari yang terbaru
            ->take(30) // Ambil 30 data terakhir untuk rekap 30 hari
            ->get();

        // Kirimkan batas waktu absensi ke frontend
        $pengaturan = Pengaturan::first();
        $batasWaktuAbsen = $pengaturan->batas_waktu_absen_siswa ?? '24:40:00';

        // Render halaman frontend 'Siswa/Dashboard' dengan data yang diperlukan
        return Inertia::render('Siswa/Dashboard', [
            'siswa' => $siswa->load('kelas'), // Kirim data siswa beserta relasi kelasnya
            'absensiHariIni' => $absensiHariIni,
            'riwayatAbsensi' => $riwayatAbsensi,
            'batasWaktuAbsen' => $batasWaktuAbsen,
        ]);
    }

    /**
     * Menyimpan data absensi masuk yang dikirim oleh siswa.
     * Metode ini hanya akan memproses absensi jika siswa belum absen hari ini.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'latitude' => ['required', 'regex:/^-?\d+(\.\d+)?$/'],
            'longitude' => ['required', 'regex:/^-?\d+(\.\d+)?$/'],
        ], [
            'latitude.required' => 'Lokasi (latitude) tidak ditemukan. Izinkan akses lokasi di browser.',
            'longitude.required' => 'Lokasi (longitude) tidak ditemukan. Izinkan akses lokasi di browser.',
        ]);

        $user = Auth::user();
        $siswa = $user->siswa;
        if (!$siswa) {
            return back()->with('error', 'Profil siswa tidak ditemukan. Tidak dapat merekam absensi.');
        }

        // Ambil pengaturan (jam masuk, batas waktu, lokasi sekolah & radius)
        $pengaturan = Pengaturan::first();
        $batasWaktuAbsenStr = $pengaturan->batas_waktu_absen_siswa ?? '13:00:00';
        $jamMasukStr = $pengaturan->jam_masuk_siswa ?? '07:00:00';

        // Konversi ke Carbon dengan timezone aplikasi (pastikan config/app.php timezone sudah benar)
        $today = Carbon::now(config('app.timezone'));
        $batasWaktuAbsen = Carbon::parse($batasWaktuAbsenStr, config('app.timezone'))->setDate($today->year, $today->month, $today->day);
        $jamMasukSekolah = Carbon::parse($jamMasukStr, config('app.timezone'))->setDate($today->year, $today->month, $today->day);
        $jamAbsen = Carbon::now(config('app.timezone'));

        // Cek apakah sudah melewati batas waktu absen
        if ($jamAbsen->greaterThan($batasWaktuAbsen)) {
            return back()->with('error', 'Waktu absensi sudah berakhir. Silakan lapor ke guru piket.');
        }

        // Cegah absen ganda
        $sudahAbsen = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereDate('tanggal', $today->toDateString())
            ->exists();

        if ($sudahAbsen) {
            return back()->with('error', 'Anda sudah melakukan absensi hari ini.');
        }

        // Ambil lokasi sekolah dari pengaturan (boleh null)
        $schoolLat = $pengaturan->lokasi_sekolah_latitude ?? null;
        $schoolLng = $pengaturan->lokasi_sekolah_longitude ?? null;
        $allowedRadius = (int) ($pengaturan->radius_absen_meters ?? 200); // default 200 meter

        $userLat = (float) $request->input('latitude');
        $userLng = (float) $request->input('longitude');

        // helper: hitung jarak (meter) menggunakan rumus Haversine
        $haversine = function ($lat1, $lon1, $lat2, $lon2) {
            $earthRadius = 6371000; // meters
            $dLat = deg2rad($lat2 - $lat1);
            $dLon = deg2rad($lon2 - $lon1);
            $a = sin($dLat / 2) * sin($dLat / 2) +
                cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
                sin($dLon / 2) * sin($dLon / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            return $earthRadius * $c;
        };

        if ($schoolLat !== null && $schoolLng !== null) {
            $distance = $haversine($schoolLat, $schoolLng, $userLat, $userLng); // meters

            if ($distance > $allowedRadius) {
                $distanceRounded = round($distance);
                return back()->with('error', "Anda berada di luar area absensi sekolah (jarak: {$distanceRounded} m). Pastikan berada di lokasi sekolah untuk absen.");
            }
        }
        // jika lokasi sekolah belum diset, kita lanjutkan — admin harus mengkonfigurasi pengaturan lokasi.

        // Hitung keterlambatan
        $menitKeterlambatan = 0;
        if ($jamAbsen->greaterThan($jamMasukSekolah)) {
            $menitKeterlambatan = $jamAbsen->diffInMinutes($jamMasukSekolah);
        }

        // Simpan record absensi
        AbsensiSiswa::create([
            'id_absensi' => 'AS-' . $today->format('ymd') . '-' . $siswa->id_siswa,
            'id_siswa' => $siswa->id_siswa,
            'tanggal' => $today->toDateString(),
            'jam_masuk' => $jamAbsen->format('H:i:s'),
            'status_kehadiran' => 'Hadir',
            'menit_keterlambatan' => $menitKeterlambatan,
            'metode_absen' => 'Geo',
            'latitude' => (string) $userLat,
            'longitude' => (string) $userLng,
        ]);

        return back()->with('success', 'Absensi masuk berhasil terekam!');
    }
}
