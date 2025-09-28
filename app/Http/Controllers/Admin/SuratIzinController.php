<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SuratIzin;
use App\Models\AbsensiSiswa;
use App\Models\Siswa;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class SuratIzinController extends Controller
{
    /**
     * Daftar surat izin + filter sederhana.
     * GET admin/surat-izin
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => 'nullable|in:Diajukan,Disetujui,Ditolak',
            'q'      => 'nullable|string',
            'dari'   => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);

        $query = SuratIzin::with([
                // sertakan foto_profil agar accessor siswa tidak error
                'siswa:id_siswa,nis,nama_lengkap,foto_profil',
                'penyetuju:id_pengguna,nama_lengkap',
            ])
            ->when($filters['status'] ?? null, fn ($q, $st) => $q->where('status_pengajuan', $st))
            ->when($filters['q'] ?? null, function ($q, $s) {
                $q->whereHas('siswa', function ($sq) use ($s) {
                    $sq->where('nama_lengkap', 'like', "%{$s}%")
                       ->orWhere('nis', 'like', "%{$s}%");
                });
            })
            ->when(($filters['dari'] ?? null) && ($filters['sampai'] ?? null), function ($q) use ($filters) {
                $q->whereBetween('tanggal_pengajuan', [$filters['dari'], $filters['sampai']]);
            })
            ->latest('tanggal_pengajuan');

        $surat = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/SuratIzin/Index', [
            'filters' => [
                'status' => $filters['status'] ?? null,
                'q'      => $filters['q'] ?? null,
                'dari'   => $filters['dari'] ?? null,
                'sampai' => $filters['sampai'] ?? null,
            ],
            'surat' => $surat,
        ]);
    }

    /**
     * Form pengajuan surat versi admin.
     * GET admin/surat-izin/create
     */
    public function create()
    {
        // daftar siswa aktif untuk select (sertakan foto_profil agar aman dipakai di UI)
        $siswa = Siswa::where('status', 'Aktif')
            ->select('id_siswa', 'nis', 'nama_lengkap', 'foto_profil')
            ->orderBy('nama_lengkap')
            ->get();

        return Inertia::render('admin/SuratIzin/Create', [
            'siswa' => $siswa,
            'defaults' => [
                'tanggal_mulai_izin' => now()->toDateString(),
                'tanggal_selesai_izin' => now()->toDateString(),
                'jenis_izin' => 'Izin',
                'langsung_setujui' => false, // centang ini bila mau auto approve + sync
            ],
        ]);
    }

    /**
     * Simpan pengajuan surat (oleh admin).
     * POST admin/surat-izin
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_siswa'             => 'required|exists:tbl_siswa,id_siswa',
            'tanggal_mulai_izin'   => 'required|date',
            'tanggal_selesai_izin' => 'required|date|after_or_equal:tanggal_mulai_izin',
            'jenis_izin'           => 'required|in:Sakit,Izin',
            'keterangan'           => 'required|string',
            'file_lampiran'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'langsung_setujui'     => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $lampiranPath = null;
            if ($request->hasFile('file_lampiran')) {
                $lampiranPath = $request->file('file_lampiran')->store('surat-izin', 'public');
            }

            $langsung = (bool) ($validated['langsung_setujui'] ?? false);

            $surat = SuratIzin::create([
                'id_siswa'            => $validated['id_siswa'],
                'tanggal_pengajuan'   => now(), // datetime
                'tanggal_mulai_izin'  => $validated['tanggal_mulai_izin'],
                'tanggal_selesai_izin'=> $validated['tanggal_selesai_izin'],
                'jenis_izin'          => $validated['jenis_izin'], // Sakit / Izin
                'keterangan'          => $validated['keterangan'],
                'file_lampiran'       => $lampiranPath ? Storage::url($lampiranPath) : null,
                'status_pengajuan'    => $langsung ? 'Disetujui' : 'Diajukan',
                'id_penyetuju'        => $langsung ? (Auth::user()?->id_pengguna) : null,
                'tanggal_persetujuan' => $langsung ? now() : null,
            ]);

            LogAktivitas::create([
                'id_pengguna' => Auth::user()?->id_pengguna,
                'aksi'        => 'Buat Surat Izin (Admin)',
                'keterangan'  => 'Surat #' . $surat->id_surat . ' dibuat oleh admin' . ($langsung ? ' & langsung disetujui' : ''),
            ]);

            // Jika admin pilih langsung setujui, sinkronkan ke absensi
            if ($langsung) {
                $this->syncAbsensiDariSurat($surat);
            }

            DB::commit();

            return redirect()
                ->route('admin.surat-izin.index')
                ->with('success', $langsung
                    ? 'Surat dibuat & disetujui. Absensi sudah tersinkron.'
                    : 'Surat dibuat. Silakan approve untuk sinkron ke absensi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->with('error', 'Gagal menyimpan surat. ' . $e->getMessage());
        }
    }

    /**
     * Approve 1 surat izin & auto-sync ke tbl_absensi_siswa untuk setiap tanggal dalam rentang.
     * POST admin/surat-izin/{surat}/approve
     */
    public function approve(Request $request, SuratIzin $surat)
    {
        if ($surat->status_pengajuan === 'Disetujui') {
            return back()->with('status', 'Surat sudah disetujui sebelumnya.');
        }

        DB::beginTransaction();
        try {
            $surat->update([
                'status_pengajuan'     => 'Disetujui',
                'id_penyetuju'         => Auth::user()?->id_pengguna,
                'tanggal_persetujuan'  => now(),
            ]);

            $this->syncAbsensiDariSurat($surat);

            LogAktivitas::create([
                'id_pengguna' => Auth::user()?->id_pengguna,
                'aksi'        => 'Approve Surat Izin',
                'keterangan'  => 'Surat #' . $surat->id_surat . ' (' . ($surat->siswa?->nama_lengkap ?? '-') . ') disetujui.',
            ]);

            DB::commit();
            return back()->with('success', 'Surat izin disetujui & absensi tersinkron.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->with('error', 'Gagal menyetujui surat. ' . $e->getMessage());
        }
    }

    /**
     * Reject 1 surat izin (tanpa menyentuh data absensi).
     * POST admin/surat-izin/{surat}/reject
     */
    public function reject(Request $request, SuratIzin $surat)
    {
        if ($surat->status_pengajuan === 'Disetujui') {
            return back()->with('error', 'Surat sudah Disetujui. Gunakan fitur pembatalan sinkron (unsync) bila perlu.');
        }

        $surat->update([
            'status_pengajuan'     => 'Ditolak',
            'id_penyetuju'         => Auth::user()?->id_pengguna,
            'tanggal_persetujuan'  => now(),
        ]);

        LogAktivitas::create([
            'id_pengguna' => Auth::user()?->id_pengguna,
            'aksi'        => 'Reject Surat Izin',
            'keterangan'  => 'Surat #' . $surat->id_surat . ' ditolak.',
        ]);

        return back()->with('success', 'Surat izin ditolak.');
    }

    /**
     * (Opsional) Paksa re-sinkron absensi dari surat (misal setelah perbaikan data absensi manual).
     * POST admin/surat-izin/{surat}/resync
     */
    public function resync(Request $request, SuratIzin $surat)
    {
        if ($surat->status_pengajuan !== 'Disetujui') {
            return back()->with('error', 'Hanya surat berstatus Disetujui yang dapat di-resync.');
        }

        DB::beginTransaction();
        try {
            $this->syncAbsensiDariSurat($surat, overwrite: false);
            DB::commit();

            return back()->with('success', 'Absensi berhasil di-resync dari surat.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->with('error', 'Gagal resync. ' . $e->getMessage());
        }
    }

    /**
     * (Opsional) Batalkan efek sinkronisasi dari surat pada tanggal rentang (tidak menghapus surat).
     * POST admin/surat-izin/{surat}/unsync
     */
    public function unsync(Request $request, SuratIzin $surat)
    {
        if ($surat->status_pengajuan !== 'Disetujui') {
            return back()->with('error', 'Hanya surat Disetujui yang bisa di-unsync.');
        }

        DB::beginTransaction();
        try {
            $dates = $this->dateRange($surat->tanggal_mulai_izin, $surat->tanggal_selesai_izin);
            foreach ($dates as $tgl) {
                $abs = AbsensiSiswa::where('id_siswa', $surat->id_siswa)
                    ->whereDate('tanggal', $tgl)
                    ->first();

                if (!$abs) {
                    continue;
                }

                $marker = "SuratIzin#{$surat->id_surat}";
                if ($abs->keterangan && str_contains($abs->keterangan, $marker)) {
                    // kembali ke Alfa agar jejak ada
                    $abs->update([
                        'status_kehadiran'     => 'Alfa',
                        'jam_masuk'            => null,
                        'jam_pulang'           => null,
                        'menit_keterlambatan'  => 0,
                        'keterangan'           => "Revert dari {$marker}",
                        'id_penginput_manual'  => Auth::user()?->id_pengguna,
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', 'Sinkronisasi absensi dari surat dibatalkan.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->with('error', 'Gagal unsync. ' . $e->getMessage());
        }
    }

    /* ============================ Helpers ============================ */

    /**
     * Sinkronkan absensi dari 1 surat izin.
     *
     * @param  \App\Models\SuratIzin  $surat
     * @param  bool $overwrite  true: timpa semua non-Hadir; false: hanya buat/update jika belum ada atau status Alfa
     */
    private function syncAbsensiDariSurat(SuratIzin $surat, bool $overwrite = true): void
    {
        $idSiswa     = $surat->id_siswa;
        $statusAbsen = $surat->jenis_izin; // 'Sakit' atau 'Izin'
        $approverId  = Auth::user()?->id_pengguna;
        $marker      = "SuratIzin#{$surat->id_surat}";
        $dates       = $this->dateRange($surat->tanggal_mulai_izin, $surat->tanggal_selesai_izin);

        foreach ($dates as $tgl) {
            $tglStr = Carbon::parse($tgl)->toDateString();

            $abs = AbsensiSiswa::where('id_siswa', $idSiswa)
                ->whereDate('tanggal', $tglStr)
                ->first();

            if ($abs) {
                // Jangan timpa 'Hadir'
                if ($abs->status_kehadiran === 'Hadir') {
                    continue;
                }
                // Jika overwrite=false, hanya ubah jika Alfa
                if (!$overwrite && $abs->status_kehadiran !== 'Alfa') {
                    continue;
                }

                $abs->update([
                    'status_kehadiran'     => $statusAbsen,
                    'jam_masuk'            => null,
                    'jam_pulang'           => null,
                    'menit_keterlambatan'  => 0,
                    'keterangan'           => trim(($abs->keterangan ? $abs->keterangan . ' | ' : '') . $marker),
                    'metode_absen'         => 'Manual',
                    'id_penginput_manual'  => $approverId,
                ]);
            } else {
                AbsensiSiswa::create([
                    'id_absensi'           => 'AS-' . Carbon::parse($tglStr)->format('ymd') . '-' . $idSiswa,
                    'id_siswa'             => $idSiswa,
                    'tanggal'              => $tglStr,
                    'jam_masuk'            => null,
                    'jam_pulang'           => null,
                    'menit_keterlambatan'  => 0,
                    'status_kehadiran'     => $statusAbsen,
                    'metode_absen'         => 'Manual',
                    'keterangan'           => $marker,
                    'id_penginput_manual'  => $approverId,
                ]);
            }
        }
    }

    /**
     * Array tanggal harian inklusif [start..end].
     * @return array<string> Y-m-d
     */
    private function dateRange($startDate, $endDate): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end   = Carbon::parse($endDate)->startOfDay();

        $dates = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dates[] = $d->toDateString();
        }
        return $dates;
    }
}
