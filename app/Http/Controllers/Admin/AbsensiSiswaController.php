<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TahunAjaran;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\AbsensiSiswa;
use App\Models\SuratIzin;
use App\Models\Pengaturan;
use App\Models\LogAktivitas;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;


class AbsensiSiswaController extends Controller
{
    public function index(Request $request)
    {
        // Validasi request filter
        $filters = $request->validate([
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'tanggal' => 'nullable|date',
            'search' => 'nullable|string',
        ]);

        // Inisialisasi filter dengan nilai default jika tidak ada
        $activeKelasId = $filters['id_kelas'] ?? Kelas::orderBy('tingkat')->first()?->id_kelas;
        $activeTanggal = Carbon::parse($filters['tanggal'] ?? now());
        $searchTerm = $filters['search'] ?? '';

        // Query siswa berdasarkan kelas dan pencarian
        $siswaDiKelas = Siswa::query()
            ->where('status', 'Aktif')
            ->when($activeKelasId, fn ($q) => $q->where('id_kelas', $activeKelasId))
            ->when($searchTerm, fn ($q) => $q->where(fn($sq) => $sq->where('nama_lengkap', 'like', "%{$searchTerm}%")->orWhere('nis', 'like', "%{$searchTerm}%")))
            ->orderBy('nama_lengkap')
            ->get();
        
        // Ambil data absensi untuk siswa di kelas tersebut pada tanggal yang dipilih
        $absensiSudahAda = AbsensiSiswa::whereIn('id_siswa', $siswaDiKelas->pluck('id_siswa'))
            ->whereDate('tanggal', $activeTanggal)
            ->get()
            ->keyBy('id_siswa');

        // Ambil pengaturan jam masuk sekolah
        $jamMasukSekolah = Pengaturan::where('key', 'jam_masuk')->value('value') ?? '07:30:00';

        // Proses data siswa dan absensinya untuk ditampilkan
        $siswaWithAbsensi = $siswaDiKelas->map(function ($siswa) use ($absensiSudahAda, $jamMasukSekolah) {
            $absen = $absensiSudahAda->get($siswa->id_siswa);
            $siswa->absensi = $absen; // Lampirkan data absensi ke objek siswa

            // Hitung keterlambatan jika siswa hadir dan jam masuk terisi
            if ($absen && $absen->status_kehadiran === 'Hadir' && $absen->jam_masuk) {
                try {
                    $jamMasukSiswa = Carbon::parse($absen->jam_masuk);
                    $batasMasuk = Carbon::parse($jamMasukSekolah);
                    
                    // =============================================================
                    // INI ADALAH PERBAIKAN UTAMA PADA LOGIKA TAMPILAN
                    // =============================================================
                    $selisihMenit = $batasMasuk->diffInMinutes($jamMasukSiswa, false);

                    $absen->menit_keterlambatan = $selisihMenit > 0 ? $selisihMenit : 0;
                } catch (\Exception $e) {
                    Log::error("Gagal parse waktu untuk siswa {$siswa->id_siswa}: " . $e->getMessage());
                    $absen->menit_keterlambatan = 0;
                }
            }
            return $siswa;
        });

        // Hitung statistik untuk ditampilkan di kartu atas
        $stats = [
            'total' => $siswaWithAbsensi->count(),
            'hadir' => $absensiSudahAda->where('status_kehadiran', 'Hadir')->count(),
            'sakit' => $absensiSudahAda->where('status_kehadiran', 'Sakit')->count(),
            'izin' => $absensiSudahAda->where('status_kehadiran', 'Izin')->count(),
            'alfa' => $absensiSudahAda->where('status_kehadiran', 'Alfa')->count(),
            'terlambat' => $siswaWithAbsensi->filter(fn($s) => ($s->absensi->menit_keterlambatan ?? 0) > 0)->count(),
        ];
        $stats['belum_diinput'] = $stats['total'] - ($stats['hadir'] + $stats['sakit'] + $stats['izin'] + $stats['alfa']);

        return Inertia::render('admin/AbsensiSiswa/Index', [
            'kelasOptions' => fn () => Kelas::orderBy('tingkat')->get(),
            'siswaWithAbsensi' => $siswaWithAbsensi,
            'stats' => $stats,
            'filters' => [
                'id_kelas' => $activeKelasId,
                'tanggal' => $activeTanggal->toDateString(),
                'search' => $searchTerm,
            ],
        ]);
    }

    public function storeManual(Request $request)
    {
        $validated = $request->validate([
            'id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            'tanggal' => 'required|date',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa',
            'jam_masuk' => 'nullable|date_format:H:i',
            'jam_pulang' => 'nullable|date_format:H:i',
            'keterangan' => 'nullable|string',
        ]);

        $menitKeterlambatan = null;

        if ($validated['status_kehadiran'] === 'Hadir' && !empty($validated['jam_masuk'])) {
            // =============================================================
            // PERUBAIKAN UTAMA ADA DI SINI
            // Menggunakan 'jam_masuk' agar sesuai dengan key di tabel pengaturan Anda.
            // =============================================================
            $jamMasukSekolahString = Pengaturan::where('key', 'jam_masuk')->value('value') ?? '07:30:00';

            $jamMasukSekolah = Carbon::parse($jamMasukSekolahString);
            $jamAbsenSiswa = Carbon::parse($validated['jam_masuk']);

            $selisihMenit = $jamMasukSekolah->diffInMinutes($jamAbsenSiswa, false);

            $menitKeterlambatan = $selisihMenit > 0 ? $selisihMenit : 0;
        }
        
        AbsensiSiswa::updateOrCreate(
            [
                'id_siswa' => $validated['id_siswa'],
                'tanggal' => $validated['tanggal'],
            ],
            [
                'id_absensi' => 'AS-' . Carbon::parse($validated['tanggal'])->format('ymd') . '-' . $validated['id_siswa'],
                'status_kehadiran' => $validated['status_kehadiran'],
                'jam_masuk' => $validated['jam_masuk'],
                'jam_pulang' => $validated['jam_pulang'],
                'menit_keterlambatan' => $menitKeterlambatan, // <-- Data ini sekarang akan tersimpan
                'keterangan' => $validated['keterangan'],
                'metode_absen' => 'Manual',
                'id_penginput_manual' => Auth::id(),
            ]
        );

        return back()->with('success', 'Absensi siswa berhasil diperbarui.');
    }

     public function storeMassal(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'id_kelas' => 'required|string|exists:tbl_kelas,id_kelas',
            'absensi' => 'required|array',
            'absensi.*.id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            'absensi.*.status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa',
        ]);

        $tanggalAbsen = Carbon::parse($validated['tanggal'])->toDateString();
        $adminId = Auth::id();

        foreach ($validated['absensi'] as $data) {
            // Cari data absensi yang mungkin sudah ada
            $absensi = AbsensiSiswa::where('tanggal', $tanggalAbsen)
                ->where('id_siswa', $data['id_siswa'])
                ->first();

            $newStatus = $data['status_kehadiran'];

            if ($absensi) {
                // JIKA DATA SUDAH ADA, UPDATE SECARA HATI-HATI
                $absensi->status_kehadiran = $newStatus;
                $absensi->id_penginput_manual = $adminId; // Perbarui siapa yang terakhir mengubah

                // Jika status diubah menjadi TIDAK HADIR, maka reset data waktu.
                // Ini logis karena siswa yang sakit/izin/alfa tidak mungkin terlambat.
                if ($newStatus !== 'Hadir') {
                    $absensi->jam_masuk = null;
                    $absensi->menit_keterlambatan = 0;
                }
                
                // Jika statusnya 'Hadir', kita TIDAK mengubah jam_masuk atau menit_keterlambatan.
                // Ini akan menjaga data waktu yang sudah diinput manual.
                
                $absensi->save();

            } else {
                // JIKA DATA BELUM ADA, BUAT BARU
                AbsensiSiswa::create([
                    'id_absensi' => 'AS-' . Carbon::parse($tanggalAbsen)->format('ymd') . '-' . $data['id_siswa'],
                    'id_siswa' => $data['id_siswa'],
                    'tanggal' => $tanggalAbsen,
                    'status_kehadiran' => $newStatus,
                    'metode_absen' => 'Manual',
                    'id_penginput_manual' => $adminId,
                    'jam_masuk' => null,
                    'menit_keterlambatan' => 0,
                ]);
            }
        }

        return back()->with('success', 'Absensi massal berhasil diperbarui.');
    }
    public function updateIndividual(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa',
            'jam_masuk' => 'nullable|required_if:status_kehadiran,Hadir|date_format:H:i,H:i:s',
            'jam_pulang' => 'nullable|date_format:H:i,H:i:s|after_or_equal:jam_masuk',
            'keterangan' => 'nullable|string|max:255',
        ]);

        $tanggal = Carbon::parse($validated['tanggal']);
        $siswa = Siswa::find($validated['id_siswa']);

        try {
            $absensi = AbsensiSiswa::firstOrNew([
                'id_siswa' => $validated['id_siswa'],
                'tanggal' => $tanggal->toDateString(),
            ]);

            $statusLama = $absensi->exists ? $absensi->status_kehadiran : 'Belum Diinput';

            $absensi->status_kehadiran = $validated['status_kehadiran'];
            $absensi->keterangan = $validated['keterangan'] ?? null;
            $absensi->metode_absen = 'Manual';
            $absensi->id_penginput_manual = Auth::id();

            if (!$absensi->exists) {
                $absensi->id_absensi = 'AS-' . $tanggal->format('ymd') . '-' . $validated['id_siswa'];
            }

            if ($validated['status_kehadiran'] === 'Hadir') {
                $absensi->jam_masuk = $validated['jam_masuk'];
                $absensi->jam_pulang = $validated['jam_pulang'];
            } else {
                $absensi->jam_masuk = null;
                $absensi->jam_pulang = null;
            }

            $absensi->save();

            // Hitung keterlambatan berdasarkan jam masuk dari pengaturan
            if (!empty($absensi->jam_masuk)) {
                $jamMasukSekolah = Cache::remember('jam_masuk_sekolah', now()->addHour(), function () {
                    $p = Pengaturan::find('jam_masuk');
                    return optional($p)->value ?? '07:15';
                });

                try {
                    $jamMasukAbsensi = Carbon::parse($absensi->jam_masuk);
                    $jamMasukRef = Carbon::parse($jamMasukSekolah);
                    $diff = $jamMasukAbsensi->diffInMinutes($jamMasukRef, false);
                    $keterlambatan = $diff > 0 ? $diff : 0;

                    if (Schema::hasColumn('tbl_absensi_siswa', 'keterlambatan_menit')) {
                        $absensi->keterlambatan_menit = $keterlambatan;
                        $absensi->save();
                    }
                } catch (\Exception $e) {
                    Log::warning('Gagal hitung keterlambatan pada updateIndividual: ' . $e->getMessage());
                }
            } else {
                if (Schema::hasColumn('tbl_absensi_siswa', 'keterlambatan_menit')) {
                    $absensi->keterlambatan_menit = null;
                    $absensi->save();
                }
            }

            $keteranganLog = 'Admin (' . optional(Auth::user())->nama_lengkap . ') mengubah absensi siswa ' . optional($siswa)->nama_lengkap . ' pada ' . $tanggal->format('d-m-Y') . '. ';
            if ($statusLama !== $absensi->status_kehadiran) {
                $keteranganLog .= 'Status diubah dari ' . $statusLama . ' menjadi ' . $absensi->status_kehadiran . '. ';
            }

            LogAktivitas::create([
                'id_pengguna' => Auth::id(),
                'aksi' => 'Edit Absensi Individual',
                'keterangan' => $keteranganLog,
            ]);
        } catch (\Throwable $e) {
            Log::error('updateIndividual error: ' . $e->getMessage());
            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }

        return back()->with('success', 'Absensi untuk siswa ' . optional($siswa)->nama_lengkap . ' berhasil diperbarui.');
    }
}
