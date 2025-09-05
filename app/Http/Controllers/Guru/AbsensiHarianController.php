<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Pengaturan;
use App\Models\JadwalMengajar;
use App\Models\User;
use App\Notifications\SakitIzinSubmittedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;
use Throwable;

class AbsensiHarianController extends Controller
{
    /**
     * Tampilkan halaman absensi harian guru (Inertia).
     */
    public function index(Request $request)
    {
        // Periksa apakah fitur absensi manual untuk guru diizinkan
        $check = $this->checkAbsensiManualEnabled();
        if ($check instanceof RedirectResponse || $check instanceof JsonResponse) {
            return $check;
        }

        $user = Auth::user();
        $guru = $user?->guru;
        if (!$guru) {
            abort(403, 'Akses ditolak.');
        }

        // Ambil filter dari query
        $filter = $request->query('filter', 'day'); // day|week|month
        $dateStr = $request->query('date', Carbon::today()->toDateString());

        try {
            $baseDate = Carbon::parse($dateStr);
        } catch (Throwable $e) {
            $baseDate = Carbon::today();
        }

        $today = Carbon::today();
        $now = Carbon::now();

        $pengaturan = Pengaturan::first();

        // Hit jadwal hari ini untuk guru
        $hariIniNama = $this->hariIndonesia((int) $today->dayOfWeek);
        $jadwalsHariIni = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->where('hari', $hariIniNama)
            ->orderBy('jam_mulai', 'asc')
            ->get();

        // Tentukan jadwal yang "dipakai" (sedang berlangsung) atau jadwal terakhir
        $jadwalDipakai = null;
        if ($jadwalsHariIni->isNotEmpty()) {
            foreach ($jadwalsHariIni as $j) {
                // Carbon::parse dapat membaca 'HH:mm' atau 'HH:mm:ss'
                try {
                    $jamMulai = Carbon::parse($j->jam_mulai)->setDate($today->year, $today->month, $today->day);
                    $jamSelesai = Carbon::parse($j->jam_selesai)->setDate($today->year, $today->month, $today->day);
                } catch (Throwable $e) {
                    // skip jadwal bila format waktu tidak valid
                    continue;
                }

                // kalau sekarang antara jamMulai..jamSelesai => pakai jadwal ini
                if ($now->between($jamMulai, $jamSelesai)) {
                    $jadwalDipakai = $j;
                    break;
                }
            }

            if (!$jadwalDipakai) {
                // pakai jadwal yang paling akhir (jam_selesai terbesar)
                $jadwalDipakai = $jadwalsHariIni->sortByDesc(function ($x) {
                    return Carbon::parse($x->jam_selesai)->format('H:i:s');
                })->first();
            }
        }

        // Ambil absensi hari ini jika ada
        $absensiHariIni = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        // apakah boleh absen pulang (sudah lewat jam pulang jadwal dipakai dan jam_pulang belum tercatat)
        $canPulang = false;
        if ($absensiHariIni && is_null($absensiHariIni->jam_pulang) && $jadwalDipakai) {
            try {
                $jamSelesai = Carbon::parse($jadwalDipakai->jam_selesai)->setDate($today->year, $today->month, $today->day);
                $canPulang = $now->greaterThanOrEqualTo($jamSelesai);
            } catch (Throwable $e) {
                $canPulang = false;
            }
        }

        // Range untuk riwayat berdasarkan filter
        if ($filter === 'week') {
            $start = (clone $baseDate)->startOfWeek(Carbon::MONDAY);
            $end = (clone $baseDate)->endOfWeek(Carbon::SUNDAY);
        } elseif ($filter === 'month') {
            $start = (clone $baseDate)->startOfMonth();
            $end = (clone $baseDate)->endOfMonth();
        } else {
            $start = (clone $baseDate)->startOfDay();
            $end = (clone $baseDate)->endOfDay();
        }

        // Safety: batasi range maksimal 366 hari
        if ($end->diffInDays($start) > 366) {
            $end = (clone $start)->addDays(366);
        }

        // Build history: iterasi setiap hari dan ambil data absensi / apakah ada jadwal
        $history = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $d = $cursor->copy();
            $hariNama = $this->hariIndonesia((int) $d->dayOfWeek);

            $hasSchedule = JadwalMengajar::where('id_guru', $guru->id_guru)
                ->where('hari', $hariNama)
                ->exists();

            $abs = AbsensiGuru::where('id_guru', $guru->id_guru)
                ->whereDate('tanggal', $d->toDateString())
                ->first();

            if ($abs) {
                $status = $abs->status_kehadiran;
                $metode = $abs->metode_absen;
                $jamMasuk = $abs->jam_masuk ? substr($abs->jam_masuk, 0, 5) : null;
                $jamPulang = $abs->jam_pulang ? substr($abs->jam_pulang, 0, 5) : null;
                $menitTerlambat = $abs->menit_keterlambatan;
                $keterangan = $abs->keterangan;
            } else {
                if (!$hasSchedule) {
                    $status = 'Tidak Ada Jadwal';
                } else {
                    if ($d->lt($today)) {
                        $status = 'Alfa';
                    } elseif ($d->isSameDay($today)) {
                        $status = 'Belum Absen';
                    } else {
                        $status = 'Belum Absen';
                    }
                }
                $metode = null;
                $jamMasuk = null;
                $jamPulang = null;
                $menitTerlambat = null;
                $keterangan = null;
            }

            $history[] = [
                'tanggal' => $d->toDateString(),
                'hari' => $hariNama,
                'has_schedule' => (bool) $hasSchedule,
                'status' => $status,
                'metode' => $metode,
                'jam_masuk' => $jamMasuk,
                'jam_pulang' => $jamPulang,
                'menit_keterlambatan' => $menitTerlambat,
                'keterangan' => $keterangan,
            ];

            $cursor->addDay();
        }

        // Render Inertia
        return Inertia::render('Guru/AbsensiHarian/Index', [
            'absensiHariIni' => $absensiHariIni,
            'jadwalHariIni' => $jadwalDipakai,
            'canPulang' => $canPulang,
            'history' => $history,
            'login_manual_enabled' => $pengaturan ? (bool) $pengaturan->login_manual_enabled : true,
            'filter' => $filter,
            'filter_date' => $baseDate->toDateString(),
            // share minimal data pengaturan agar frontend bisa menon-aktifkan elemen
            'pengaturan' => $pengaturan ? [
                'absensi_manual_guru_enabled' => (bool) $pengaturan->absensi_manual_guru_enabled,
            ] : ['absensi_manual_guru_enabled' => true],
        ]);
    }

    /**
     * Ajukan sakit / izin (dari guru).
     */
    public function submitIzin(Request $request)
    {
        // check feature enabled
        $check = $this->checkAbsensiManualEnabled();
        if ($check instanceof RedirectResponse || $check instanceof JsonResponse) {
            return $check;
        }

        $user = Auth::user();
        $guru = $user?->guru;
        if (!$guru) {
            return redirect()->back()->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'status' => 'required|in:Sakit,Izin',
            'keterangan' => 'required|string|max:1000',
            'tanggal' => 'nullable|date',
        ]);

        $tanggal = $validated['tanggal'] ?? Carbon::today()->toDateString();
        $status = $validated['status'];
        $keterangan = $validated['keterangan'];

        DB::beginTransaction();
        try {
            // Lock row (jika ada) untuk hindari race condition
            $absensi = AbsensiGuru::where('id_guru', $guru->id_guru)
                ->whereDate('tanggal', $tanggal)
                ->lockForUpdate()
                ->first();

            if ($absensi) {
                $absensi->update([
                    'status_kehadiran' => $status,
                    'keterangan' => $keterangan,
                    'metode_absen' => 'Manual',
                    'id_penginput_manual' => $user->id_pengguna,
                    'updated_at' => now(),
                ]);
            } else {
                AbsensiGuru::create([
                    'id_absensi' => 'AG-' . now()->format('ymdHis') . '-' . $guru->id_guru,
                    'id_guru' => $guru->id_guru,
                    'tanggal' => $tanggal,
                    'jam_masuk' => null,
                    'jam_pulang' => null,
                    'status_kehadiran' => $status,
                    'metode_absen' => 'Manual',
                    'keterangan' => $keterangan,
                    'id_penginput_manual' => $user->id_pengguna,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Notify all admins
            try {
                $admins = User::where('level', 'Admin')->get();
                if ($admins->isNotEmpty()) {
                    Notification::send($admins, new SakitIzinSubmittedNotification($guru->nama_lengkap, $status, $tanggal, $keterangan));
                }
            } catch (Throwable $notifEx) {
                Log::warning('Gagal mengirim notifikasi Sakit/Izin: ' . $notifEx->getMessage());
            }

            // Log aktivitas
            DB::table('tbl_log_aktivitas')->insert([
                'id_pengguna' => $user->id_pengguna,
                'aksi' => "Pengajuan {$status} (Manual)",
                'keterangan' => "Guru {$guru->nama_lengkap} mengajukan {$status} untuk {$tanggal}: {$keterangan}",
                'waktu' => now(),
            ]);

            DB::commit();
            return redirect()->back()->with('success', "Pengajuan {$status} berhasil dikirim.");
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('submitIzin error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengirim pengajuan.');
        }
    }

    /**
     * Simpan aksi absensi (masuk / pulang).
     */
    public function store(Request $request)
    {
        // check feature enabled
        $check = $this->checkAbsensiManualEnabled();
        if ($check instanceof RedirectResponse || $check instanceof JsonResponse) {
            return $check;
        }

        $user = Auth::user();
        $guru = $user?->guru;
        if (!$guru) {
            return redirect()->back()->with('error', 'Akses ditolak.');
        }

        $today = Carbon::today();
        $now = Carbon::now();

        // ambil absensi hari ini bila ada
        $absensi = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today->toDateString())
            ->first();

        $pengaturan = Pengaturan::first();
        // jam masuk default jika tidak ada pengaturan
        $jamMasukSekolah = null;
        if ($pengaturan && $pengaturan->jam_masuk_guru) {
            try {
                $jamMasukSekolah = Carbon::parse($pengaturan->jam_masuk_guru);
            } catch (Throwable $e) {
                $jamMasukSekolah = null;
            }
        }

        // cari jadwal terakhir hari ini (untuk cek waktu pulang)
        $hariNama = $this->hariIndonesia((int) $today->dayOfWeek);
        $jadwalTerakhir = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->where('hari', $hariNama)
            ->orderBy('jam_selesai', 'desc')
            ->first();

        DB::beginTransaction();
        try {
            if ($absensi) {
                // Aksi: absen pulang
                if (is_null($absensi->jam_pulang)) {
                    // cek waktu pulang minimal jika ada jadwalTerakhir
                    if ($jadwalTerakhir) {
                        try {
                            $jamPulangHarusnya = Carbon::parse($jadwalTerakhir->jam_selesai)->setDate($today->year, $today->month, $today->day);
                            if ($now->lessThan($jamPulangHarusnya)) {
                                DB::rollBack();
                                return redirect()->back()->with('error', 'Belum waktunya absen pulang.');
                            }
                        } catch (Throwable $e) {
                            // jika parse gagal, biarkan proceed
                        }
                    }

                    $absensi->update([
                        'jam_pulang' => $now->toTimeString(),
                        'updated_at' => now(),
                    ]);

                    // log aktivitas
                    DB::table('tbl_log_aktivitas')->insert([
                        'id_pengguna' => $user->id_pengguna,
                        'aksi' => "Absen Pulang",
                        'keterangan' => "Guru {$guru->nama_lengkap} absen pulang pada {$now->toDateTimeString()}",
                        'waktu' => now(),
                    ]);

                    DB::commit();
                    return redirect()->back()->with('success', 'Anda berhasil absen pulang.');
                }

                // sudah punya jam pulang
                DB::rollBack();
                return redirect()->back()->with('info', 'Anda sudah menyelesaikan absensi hari ini.');
            } else {
                // Aksi: absen masuk
                $menitKeterlambatan = 0;
                if ($jamMasukSekolah) {
                    $jamMasukSekolah = $jamMasukSekolah->setDate($today->year, $today->month, $today->day);
                    if ($now->greaterThan($jamMasukSekolah)) {
                        $menitKeterlambatan = $now->diffInMinutes($jamMasukSekolah);
                    }
                }

                AbsensiGuru::create([
                    'id_absensi' => 'AG-' . $now->format('ymdHis') . '-' . $guru->id_guru,
                    'id_guru' => $guru->id_guru,
                    'tanggal' => $today->toDateString(),
                    'jam_masuk' => $now->toTimeString(),
                    'jam_pulang' => null,
                    'status_kehadiran' => 'Hadir',
                    'metode_absen' => 'Manual',
                    'id_penginput_manual' => $user->id_pengguna,
                    'menit_keterlambatan' => $menitKeterlambatan,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // log aktivitas
                DB::table('tbl_log_aktivitas')->insert([
                    'id_pengguna' => $user->id_pengguna,
                    'aksi' => "Absen Masuk",
                    'keterangan' => "Guru {$guru->nama_lengkap} absen masuk pada {$now->toDateTimeString()}",
                    'waktu' => now(),
                ]);

                DB::commit();
                return redirect()->back()->with('success', 'Anda berhasil absen masuk.');
            }
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('AbsensiHarianController@store error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses absensi. Silakan coba lagi atau hubungi admin.');
        }
    }

    /**
     * Middleware-style check apakah fitur absensi manual aktif.
     * Jika tidak aktif, kembalikan RedirectResponse atau JsonResponse sesuai jenis request.
     */
    private function checkAbsensiManualEnabled()
    {
        $peng = Pengaturan::first();
        if (!$peng || !$peng->absensi_manual_guru_enabled) {
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Halaman absensi dinonaktifkan oleh administrator.'], 403);
            }
            // Redirect ke dashboard guru dengan pesan error
            return redirect()->route('guru.dashboard')->with('error', 'Halaman absensi dinonaktifkan oleh administrator.');
        }
        return null;
    }

    /**
     * Helper: konversi dayOfWeek Carbon (0..6) ke nama hari Indonesia.
     */
    private function hariIndonesia(int $dayOfWeek): string
    {
        $map = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];
        return $map[$dayOfWeek] ?? 'Senin';
    }
}
