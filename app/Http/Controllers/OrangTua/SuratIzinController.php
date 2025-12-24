<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Models\SuratIzin;
use App\Models\OrangTuaWali;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SuratIzinController extends Controller
{
    /**
     * Ambil id_pengguna secara konsisten (karena kamu pakai custom table tbl_pengguna).
     */
    private function resolveUserIdPengguna(): ?int
    {
        $user = Auth::user();
        return $user->id_pengguna ?? (is_numeric(Auth::id()) ? (int) Auth::id() : null);
    }

    /**
     * Ambil id_siswa dari akun orang tua atau 403.
     */
    private function getSiswaIdOrFail(): string
    {
        $idPengguna = $this->resolveUserIdPengguna();

        $wali = OrangTuaWali::query()
            ->where('id_pengguna', $idPengguna)
            ->first();

        abort_unless($wali, 403, 'Akun orang tua belum terhubung dengan siswa.');

        return $wali->id_siswa;
    }

    public function index(Request $request)
    {
        $idPengguna = $this->resolveUserIdPengguna();

        $wali = OrangTuaWali::query()
            ->where('id_pengguna', $idPengguna)
            ->first();

        if (!$wali) {
            return Inertia::render('OrangTua/SuratIzin/Index', [
                'siswa' => null,
                'izin' => null,
                'filters' => $request->only(['status', 'jenis']),
            ]);
        }

        $siswa = Siswa::query()
            ->with('kelas')
            ->where('id_siswa', $wali->id_siswa)
            ->first();

        $q = SuratIzin::query()
            ->where('id_siswa', $wali->id_siswa)
            ->orderByDesc('tanggal_pengajuan');

        if ($request->filled('status') && $request->status !== 'Semua') {
            $q->where('status_pengajuan', $request->status);
        }
        if ($request->filled('jenis') && $request->jenis !== 'Semua') {
            $q->where('jenis_izin', $request->jenis);
        }

        $izin = $q->paginate(10)
            ->withQueryString()
            ->through(function ($row) {
                $canCancel = $row->status_pengajuan === 'Diajukan';

                return [
                    'id_surat' => $row->id_surat,
                    'tanggal_pengajuan' => optional($row->tanggal_pengajuan)->format('Y-m-d H:i'),
                    'tanggal_mulai_izin' => optional($row->tanggal_mulai_izin)->format('Y-m-d'),
                    'tanggal_selesai_izin' => optional($row->tanggal_selesai_izin)->format('Y-m-d'),
                    'jenis_izin' => $row->jenis_izin,
                    'keterangan' => $row->keterangan,
                    'status_pengajuan' => $row->status_pengajuan,

                    'file_lampiran' => $row->file_lampiran,
                    // ✅ untuk tombol "View"
                    'view_url' => $row->file_lampiran ? route('orangtua.surat-izin.view', $row->id_surat) : null,
                    // optional: masih disediakan kalau suatu saat butuh
                    'download_url' => $row->file_lampiran ? route('orangtua.surat-izin.download', $row->id_surat) : null,

                    // ✅ untuk tombol cancel di UI
                    'can_cancel' => $canCancel,
                ];
            });

        return Inertia::render('OrangTua/SuratIzin/Index', [
            'siswa' => $siswa,
            'izin' => $izin,
            'filters' => $request->only(['status', 'jenis']),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $idPengguna = $this->resolveUserIdPengguna();

        $wali = OrangTuaWali::query()
            ->where('id_pengguna', $idPengguna)
            ->first();

        if (!$wali) {
            return back()->with('error', 'Akun orang tua belum terhubung dengan siswa.');
        }

        $validated = $request->validate([
            'jenis_izin' => ['required', Rule::in(['Sakit', 'Izin'])],
            'tanggal_mulai_izin' => ['required', 'date'],
            'tanggal_selesai_izin' => ['required', 'date', 'after_or_equal:tanggal_mulai_izin'],
            'keterangan' => ['required', 'string', 'min:5'],
            'file_lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ], [
            'file_lampiran.mimes' => 'Lampiran harus PDF/JPG/PNG.',
            'file_lampiran.max' => 'Lampiran maksimal 2MB.',
        ]);

        $lampiranPath = null;
        if ($request->hasFile('file_lampiran')) {
            $lampiranPath = $request->file('file_lampiran')->store('surat_izin', 'public');
        }

        $surat = SuratIzin::create([
            'id_siswa' => $wali->id_siswa,
            'tanggal_pengajuan' => Carbon::now(),
            'tanggal_mulai_izin' => $validated['tanggal_mulai_izin'],
            'tanggal_selesai_izin' => $validated['tanggal_selesai_izin'],
            'jenis_izin' => $validated['jenis_izin'],
            'keterangan' => $validated['keterangan'],
            'file_lampiran' => $lampiranPath,
            'status_pengajuan' => 'Diajukan',
            'id_penyetuju' => null,
            'tanggal_persetujuan' => null,
        ]);

        // log aktivitas (opsional)
        try {
            DB::table('tbl_log_aktivitas')->insert([
                'id_pengguna' => $idPengguna,
                'waktu' => Carbon::now(),
                'aksi' => 'Orang Tua mengajukan surat izin',
                'keterangan' => "ID Surat: {$surat->id_surat} | {$surat->jenis_izin} | {$surat->tanggal_mulai_izin} s/d {$surat->tanggal_selesai_izin}",
            ]);
        } catch (\Throwable $e) {
            // sengaja diabaikan biar UX tidak rusak
        }

        return back()->with('success', 'Pengajuan izin berhasil dikirim. Semoga cepat di-ACC (bukan ACC motor 😄).');
    }

    /**
     * ✅ CANCEL: hanya untuk status "Diajukan"
     * Menghapus lampiran + soft delete surat.
     */
    public function cancel(Request $request, SuratIzin $surat)
    {
        $idSiswa = $this->getSiswaIdOrFail();
        $idPengguna = $this->resolveUserIdPengguna();

        abort_if($surat->id_siswa !== $idSiswa, 403, 'Anda tidak berhak membatalkan surat ini.');

        if ($surat->status_pengajuan !== 'Diajukan') {
            return back()->with('error', 'Pengajuan tidak bisa dibatalkan karena sudah diproses.');
        }

        DB::transaction(function () use ($surat, $idPengguna) {
            // hapus lampiran
            if ($surat->file_lampiran && Storage::disk('public')->exists($surat->file_lampiran)) {
                Storage::disk('public')->delete($surat->file_lampiran);
            }

            // delete surat (soft delete jika model pakai SoftDeletes)
            $surat->delete();

            // log aktivitas (opsional)
            try {
                DB::table('tbl_log_aktivitas')->insert([
                    'id_pengguna' => $idPengguna,
                    'waktu' => Carbon::now(),
                    'aksi' => 'Orang Tua membatalkan surat izin',
                    'keterangan' => "ID Surat: {$surat->id_surat} dibatalkan",
                ]);
            } catch (\Throwable $e) {
            }
        });

        return back()->with('success', 'Pengajuan berhasil dibatalkan.');
    }

    /**
     * ✅ VIEW: tampilkan lampiran langsung (inline) untuk modal preview.
     * Cocok untuk PDF dan gambar.
     */
    public function view($id_surat)
    {
        $idSiswa = $this->getSiswaIdOrFail();

        $surat = SuratIzin::query()
            ->where('id_surat', $id_surat)
            ->where('id_siswa', $idSiswa)
            ->firstOrFail();

        if (!$surat->file_lampiran) {
            abort(404, 'Lampiran tidak tersedia.');
        }

        if (!Storage::disk('public')->exists($surat->file_lampiran)) {
            abort(404, 'File lampiran tidak ditemukan di storage.');
        }

        $path = Storage::disk('public')->path($surat->file_lampiran);
        $mime = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $path) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($surat->file_lampiran) . '"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * (optional) DOWNLOAD: masih dipertahankan kalau kamu butuh.
     */
    public function download($id_surat)
    {
        $idSiswa = $this->getSiswaIdOrFail();

        $surat = SuratIzin::query()
            ->where('id_surat', $id_surat)
            ->where('id_siswa', $idSiswa)
            ->firstOrFail();

        if (!$surat->file_lampiran) {
            return back()->with('error', 'Lampiran tidak tersedia.');
        }

        if (!Storage::disk('public')->exists($surat->file_lampiran)) {
            return back()->with('error', 'File lampiran tidak ditemukan di storage.');
        }

        return response()->download(Storage::disk('public')->path($surat->file_lampiran));
    }
}
