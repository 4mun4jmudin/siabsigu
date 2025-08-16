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
        $request->validate([
            'id_tahun_ajaran' => 'nullable|string|exists:tbl_tahun_ajaran,id_tahun_ajaran',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'tanggal' => 'nullable|date',
            'search' => 'nullable|string',
            'show_all' => 'nullable|boolean',
        ]);

        try {
            $tahunAjaranOptions = TahunAjaran::orderBy('tahun_ajaran', 'desc')->get();
            $kelasOptions = Kelas::with('waliKelas:id_guru,nama_lengkap')->orderBy('tingkat')->get();

            $activeTahunAjaranId = $request->input('id_tahun_ajaran')
                ?? ($tahunAjaranOptions->firstWhere('status', 'Aktif')->id_tahun_ajaran ?? $tahunAjaranOptions->first()->id_tahun_ajaran ?? null);

            $activeKelasId = $request->input('id_kelas', $kelasOptions->first()->id_kelas ?? null);
            $activeTanggal = Carbon::parse($request->input('tanggal', now()));
            $showAll = filter_var($request->input('show_all', false), FILTER_VALIDATE_BOOLEAN);

            $siswaQuery = Siswa::query()
                ->when($activeKelasId, fn($q) => $q->where('id_kelas', $activeKelasId))
                ->when(!$showAll, fn($q) => $q->where('status', 'Aktif'))
                ->when($request->input('search'), function ($query, $search) {
                    $query->where(function($q) use ($search) {
                        $q->where('nama_lengkap', 'like', "%{$search}%")
                          ->orWhere('nis', 'like', "%{$search}%");
                    });
                })
                ->orderBy('nama_lengkap');

            $siswaDiKelas = $siswaQuery->get();
            $siswaIds = $siswaDiKelas->pluck('id_siswa')->filter()->values()->all();

            $absensiSudahAda = collect();
            $izinAktif = collect();

            if (!empty($siswaIds)) {
                $absensiSudahAda = AbsensiSiswa::whereIn('id_siswa', $siswaIds)
                    ->whereDate('tanggal', $activeTanggal->toDateString())
                    ->get()
                    ->keyBy('id_siswa');

                $izinAktif = SuratIzin::whereIn('id_siswa', $siswaIds)
                    ->where('status_pengajuan', 'Disetujui')
                    ->whereDate('tanggal_mulai_izin', '<=', $activeTanggal->toDateString())
                    ->whereDate('tanggal_selesai_izin', '>=', $activeTanggal->toDateString())
                    ->get()
                    ->keyBy('id_siswa');
            }

            // Ambil jam masuk sekolah dari pengaturan (string 'HH:MM' atau 'HH:MM:SS')
            $jamMasukSekolah = Cache::remember('jam_masuk_sekolah', now()->addHour(), function () {
                $p = Pengaturan::find('jam_masuk');
                return optional($p)->value ?? '07:15';
            });

            $stats = [
                'total' => $siswaDiKelas->count(),
                'hadir' => 0,
                'sakit' => 0,
                'izin'  => 0,
                'alfa'  => 0,
                'terlambat' => 0,
            ];

            $siswaWithAbsensi = $siswaDiKelas->map(function ($siswa) use ($absensiSudahAda, $izinAktif, $jamMasukSekolah, &$stats) {
                $absen = $absensiSudahAda->get($siswa->id_siswa);
                $izin = $izinAktif->get($siswa->id_siswa);

                $siswa->absensi = $absen;
                $siswa->izin_terkait = $izin;

                $absenStatus = $absen ? ($absen->status_kehadiran ?? null) : null;
                $izinStatus = $izin ? ($izin->jenis_izin ?? null) : null;
                $statusFinal = $absenStatus ?? $izinStatus;
                $siswa->status_final = $statusFinal;

                // Statistik kehadiran
                if ($statusFinal) {
                    $k = strtolower($statusFinal);
                    if (array_key_exists($k, $stats)) $stats[$k] += 1;
                }

                // Hitung keterlambatan (on-the-fly) dan tentukan label waktu_status
                $keterlambatanMinutes = 0;
                $waktuStatus = '-';

                if ($absen && $absenStatus === 'Hadir' && !empty($absen->jam_masuk)) {
                    try {
                        $jamMasukAbsensi = Carbon::parse($absen->jam_masuk);
                        $jamMasukRef = Carbon::parse($jamMasukSekolah);

                        $diff = $jamMasukAbsensi->diffInMinutes($jamMasukRef, false); // bisa negatif
                        if ($diff > 0) {
                            $keterlambatanMinutes = $diff;
                            $waktuStatus = 'Terlambat ' . $keterlambatanMinutes . ' mnt';
                            $stats['terlambat'] += 1;
                        } else {
                            // <= 0 => tepat waktu atau lebih awal
                            $keterlambatanMinutes = 0;
                            $waktuStatus = 'Tepat Waktu';
                        }
                    } catch (\Exception $e) {
                        Log::warning('Gagal parse jam_masuk untuk siswa ' . $siswa->id_siswa . ': ' . $e->getMessage());
                        $keterlambatanMinutes = 0;
                        $waktuStatus = '-';
                    }
                } else {
                    // Jika tidak Hadir (Sakit/Izin/Alfa) atau belum input jam, beri keterangan sesuai kondisi
                    if ($statusFinal === 'Sakit' || $statusFinal === 'Izin') {
                        $waktuStatus = '-';
                    } elseif ($statusFinal === 'Alfa' || !$statusFinal) {
                        $waktuStatus = '-';
                    } elseif ($statusFinal === 'Hadir' && empty($absen->jam_masuk)) {
                        // Hadir tapi jam_masuk belum diisi — beri tanda belum diinput
                        $waktuStatus = 'Belum Diinput';
                    }
                }

                // Sertakan hasil ke objek siswa (untuk frontend)
                $siswa->keterlambatan_menit = (int) $keterlambatanMinutes;
                $siswa->waktu_status = $waktuStatus;

                return $siswa;
            });

            $stats['belum_diinput'] = $stats['total'] - ($stats['hadir'] + $stats['sakit'] + $stats['izin'] + $stats['alfa']);

            return Inertia::render('admin/AbsensiSiswa/Index', [
                'tahunAjaranOptions' => $tahunAjaranOptions,
                'kelasOptions' => $kelasOptions,
                'siswaWithAbsensi' => $siswaWithAbsensi,
                'stats' => $stats,
                'filters' => [
                    'id_tahun_ajaran' => $activeTahunAjaranId,
                    'id_kelas' => $activeKelasId,
                    'tanggal' => $activeTanggal->toDateString(),
                    'search' => $request->input('search') ?? '',
                    'show_all' => $showAll,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('AbsensiSiswaController@index error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return back()->with('error', 'Terjadi kesalahan saat memuat data absensi. Cek log untuk detail.');
        }
    }

    public function storeMassal(Request $request)
{
    $jamMasuk = Pengaturan::where('key', 'jam_masuk')->value('value'); // ex: 07:30
    $jamPulang = Pengaturan::where('key', 'jam_pulang')->value('value'); // ex: 15:00

    foreach ($request->absensi as $data) {
        $waktuMasuk = isset($data['waktu_masuk']) ? Carbon::parse($data['waktu_masuk']) : null;
        $waktuPulang = isset($data['waktu_pulang']) ? Carbon::parse($data['waktu_pulang']) : null;

        $statusMasuk = null;
        $ketMasuk = null;
        $statusPulang = null;
        $ketPulang = null;

        // ==================== LOGIKA MASUK ====================
        if ($waktuMasuk) {
            $batasMasuk = Carbon::createFromFormat('H:i', $jamMasuk);

            if ($waktuMasuk->greaterThan($batasMasuk)) {
                $menitTerlambat = $batasMasuk->diffInMinutes($waktuMasuk);
                $statusMasuk = 'Terlambat';
                $ketMasuk = "Terlambat {$menitTerlambat} menit";
            } else {
                $statusMasuk = 'Tepat Waktu';
                $ketMasuk = 'Masuk Tepat Waktu';
            }
        }

        // ==================== LOGIKA PULANG ====================
        if ($waktuPulang) {
            $batasPulang = Carbon::createFromFormat('H:i', $jamPulang);

            if ($waktuPulang->lessThan($batasPulang)) {
                $menitCepat = $waktuPulang->diffInMinutes($batasPulang);
                $statusPulang = 'Pulang Cepat';
                $ketPulang = "Pulang {$menitCepat} menit lebih awal";
            } elseif ($waktuPulang->greaterThan($batasPulang)) {
                $menitTerlambatPulang = $batasPulang->diffInMinutes($waktuPulang);
                $statusPulang = 'Terlambat Pulang';
                $ketPulang = "Terlambat pulang {$menitTerlambatPulang} menit";
            } else {
                $statusPulang = 'Tepat Waktu';
                $ketPulang = 'Pulang Tepat Waktu';
            }
        }

        // ==================== SIMPAN DB ====================
        AbsensiSiswa::updateOrCreate(
            [
                'id_siswa' => $data['id_siswa'],
                'tanggal' => $data['tanggal'],
            ],
            [
                'waktu_masuk'   => $waktuMasuk,
                'status_masuk'  => $statusMasuk,
                'ket_masuk'     => $ketMasuk,
                'waktu_pulang'  => $waktuPulang,
                'status_pulang' => $statusPulang,
                'ket_pulang'    => $ketPulang,
            ]
        );
    }

    return back()->with('success', 'Absensi berhasil disimpan.');
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
