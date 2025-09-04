<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Pengaturan;
use App\Models\JadwalMengajar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use App\Models\User;
use App\Notifications\SakitIzinSubmittedNotification;


class AbsensiHarianController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru;

        if (!$guru) {
            abort(403, 'Akses ditolak.');
        }

        // Ambil filter dari query: filter=day|week|month, date=YYYY-MM-DD
        $filter = $request->query('filter', 'day'); // default day
        $dateStr = $request->query('date', Carbon::today()->toDateString());

        try {
            $baseDate = Carbon::parse($dateStr);
        } catch (\Throwable $e) {
            $baseDate = Carbon::today();
        }

        // untuk tampilan header
        $today = Carbon::today();
        $now = Carbon::now();

        // pengaturan & jadwal hari ini (seperti sebelumnya, untuk tombol absen)
        $pengaturan = Pengaturan::first();
        $hariIni = $this->hariIndonesia($today->dayOfWeek);

        $jadwalsHariIni = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai', 'asc')
            ->get();

        $jadwalDipakai = null;
        if ($jadwalsHariIni->isNotEmpty()) {
            foreach ($jadwalsHariIni as $j) {
                $jamMulai = Carbon::createFromFormat('H:i:s', $j->jam_mulai)->setDate($today->year, $today->month, $today->day);
                $jamSelesai = Carbon::createFromFormat('H:i:s', $j->jam_selesai)->setDate($today->year, $today->month, $today->day);
                if ($now->between($jamMulai, $jamSelesai)) {
                    $jadwalDipakai = $j;
                    break;
                }
            }
            if (!$jadwalDipakai) {
                $jadwalDipakai = $jadwalsHariIni->sortByDesc('jam_selesai')->first();
            }
        }

        $absensiHariIni = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today)
            ->first();

        // apakah boleh pulang sekarang (untuk hari ini)
        $canPulang = false;
        if ($absensiHariIni && is_null($absensiHariIni->jam_pulang) && $jadwalDipakai) {
            $jamSelesai = Carbon::createFromFormat('H:i:s', $jadwalDipakai->jam_selesai)
                ->setDate($today->year, $today->month, $today->day);
            $canPulang = $now->greaterThanOrEqualTo($jamSelesai);
        }

        // tentukan range berdasarkan filter
        if ($filter === 'week') {
            // minggu dimulai Senin
            $start = (clone $baseDate)->startOfWeek(Carbon::MONDAY);
            $end = (clone $baseDate)->endOfWeek(Carbon::SUNDAY);
        } elseif ($filter === 'month') {
            $start = (clone $baseDate)->startOfMonth();
            $end = (clone $baseDate)->endOfMonth();
        } else {
            // default 'day'
            $start = (clone $baseDate)->startOfDay();
            $end = (clone $baseDate)->endOfDay();
        }

        // Batasi range maksimal (safety): jika range > 366 hari, potong ke 366
        if ($end->diffInDays($start) > 366) {
            $end = (clone $start)->addDays(366);
        }

        // Build history: semua hari antara start..end (inklusif)
        $history = [];
        $periodDays = $start->copy();
        while ($periodDays->lte($end)) {
            $d = $periodDays->copy();
            $hariindo = $this->hariIndonesia($d->dayOfWeek);

            // cek apakah guru punya jadwal hari itu
            $hasSchedule = JadwalMengajar::where('id_guru', $guru->id_guru)
                ->where('hari', $hariindo)
                ->exists();

            // ambil absensi jika ada
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
                // tidak ada record absensi
                if (!$hasSchedule) {
                    // tidak wajib absen
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
                'hari' => $hariindo,
                'has_schedule' => (bool)$hasSchedule,
                'status' => $status,
                'metode' => $metode,
                'jam_masuk' => $jamMasuk,
                'jam_pulang' => $jamPulang,
                'menit_keterlambatan' => $menitTerlambat,
                'keterangan' => $keterangan,
            ];

            $periodDays->addDay();
        }

        // return ke Inertia
        return Inertia::render('Guru/AbsensiHarian/Index', [
            'absensiHariIni' => $absensiHariIni,
            'jadwalHariIni' => $jadwalDipakai,
            'canPulang' => $canPulang,
            'history' => $history,
            'login_manual_enabled' => $pengaturan ? (bool)$pengaturan->login_manual_enabled : true,
            // kirim juga filter saat ini agar front-end sync
            'filter' => $filter,
            'filter_date' => $baseDate->toDateString(),
        ]);
    }

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
    public function submitIzin(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru;
        if (!$guru) {
            return redirect()->back()->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'status' => 'required|in:Sakit,Izin',
            'keterangan' => 'required|string|max:1000',
            'tanggal' => 'nullable|date',
        ]);

        $tanggal = $validated['tanggal'] ?? today()->toDateString();
        $status = $validated['status'];
        $keterangan = $validated['keterangan'];

        DB::beginTransaction();
        try {
            $absensi = AbsensiGuru::where('id_guru', $guru->id_guru)
                ->whereDate('tanggal', $tanggal)
                ->lockForUpdate()
                ->first();

            if ($absensi) {
                // update status & keterangan (jika sudah ada record)
                $absensi->update([
                    'status_kehadiran' => $status,
                    'keterangan' => $keterangan,
                    'metode_absen' => 'Manual',
                    'id_penginput_manual' => $user->id_pengguna,
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
                ]);
            }

            // notify admins about Sakit/Izin
            $admins = User::where('level', 'Admin')->get(); // Assuming User model exists and has 'level' column
            \Illuminate\Support\Facades\Notification::send($admins, new SakitIzinSubmittedNotification($guru->nama_lengkap, $status, $tanggal, $keterangan));

            // juga catat log aktivitas
            DB::table('tbl_log_aktivitas')->insert([
                'id_pengguna' => $user->id_pengguna,
                'aksi' => "Pengajuan {$status} (Manual)",
                'keterangan' => "Guru {$guru->nama_lengkap} mengajukan {$status} untuk {$tanggal}: {$keterangan}",
                'waktu' => now(),
            ]);

            DB::commit();
            return redirect()->back()->with('success', "Pengajuan {$status} berhasil dikirim.");
        } catch (\Throwable $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('submitIzin error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengirim pengajuan.');
        }
    }
    public function store(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru;
        if (!$guru) {
            return redirect()->back()->with('error', 'Akses ditolak.');
        }

        $today = today();
        $now = Carbon::now();

        $absensi = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today)
            ->first();

        $pengaturan = Pengaturan::first();
        $jamMasukSekolah = Carbon::parse($pengaturan->jam_masuk_guru ?? '07:15:00');
        
        // Cek jadwal terakhir untuk jam pulang
        $hariIni = $this->hariIndonesia($today->dayOfWeek);
        $jadwalTerakhir = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_selesai', 'desc')
            ->first();

        if ($absensi) {
            // Aksi untuk ABSEN PULANG
            if (is_null($absensi->jam_pulang)) {
                if ($jadwalTerakhir) {
                    $jamPulangHarusnya = Carbon::createFromTimeString($jadwalTerakhir->jam_selesai);
                    if ($now->lessThan($jamPulangHarusnya)) {
                        return redirect()->back()->with('error', 'Belum waktunya absen pulang.');
                    }
                }
                
                $absensi->update(['jam_pulang' => $now->toTimeString()]);
                return redirect()->back()->with('success', 'Anda berhasil absen pulang.');
            } else {
                return redirect()->back()->with('info', 'Anda sudah menyelesaikan absensi hari ini.');
            }
        } else {
            // Aksi untuk ABSEN MASUK
            $menitKeterlambatan = $now->greaterThan($jamMasukSekolah) ? $now->diffInMinutes($jamMasukSekolah) : 0;

            AbsensiGuru::create([
                'id_absensi' => 'AG-' . $now->format('ymdHis') . '-' . $guru->id_guru,
                'id_guru' => $guru->id_guru,
                'tanggal' => $today->toDateString(),
                'jam_masuk' => $now->toTimeString(),
                'status_kehadiran' => 'Hadir',
                'metode_absen' => 'Manual',
                'id_penginput_manual' => $user->id_pengguna,
                'menit_keterlambatan' => $menitKeterlambatan,
            ]);

            return redirect()->back()->with('success', 'Anda berhasil absen masuk.');
        }
    }

}
