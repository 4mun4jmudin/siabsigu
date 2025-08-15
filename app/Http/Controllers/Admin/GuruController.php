<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\User;
use App\Models\Kelas;
use App\Models\JadwalMengajar;
use App\Models\AbsensiGuru;
use App\Models\JurnalMengajar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str; // <-- 1. Impor Str helper untuk membuat string random
use Inertia\Inertia;

class GuruController extends Controller
{
    /**
     * Menampilkan halaman daftar guru beserta statistik dan pencarian.
     */
    public function index(Request $request)
    {
        $stats = [
            'total' => Guru::count(),
            'aktif' => Guru::where('status', 'Aktif')->count(),
            'waliKelas' => Kelas::whereNotNull('id_wali_kelas')->distinct()->count('id_wali_kelas'),
            'sidikJari' => Guru::whereNotNull('sidik_jari_template')->count(),
        ];

        $gurus = Guru::with(['pengguna', 'kelasWali'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                      ->orWhere('nip', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Guru/Index', [
            'gurus' => $gurus,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Menampilkan halaman detail seorang guru dengan data untuk tab.
     */
    public function show(Guru $guru)
    {
        $guru->load(['pengguna', 'kelasWali']);

        $jadwalMengajar = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran', 'tahunAjaran'])
            ->get()
            ->groupBy('hari');

        $riwayatAbsensi = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->latest('tanggal')
            ->take(15)
            ->get();
            
        $jurnalMengajar = JurnalMengajar::whereHas('jadwalMengajar', function ($query) use ($guru) {
                $query->where('id_guru', $guru->id_guru);
            })
            ->with(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran'])
            ->latest('tanggal')
            ->take(15)
            ->get();

        return Inertia::render('admin/Guru/Show', [
            'guru' => $guru,
            'jadwalMengajar' => $jadwalMengajar,
            'riwayatAbsensi' => $riwayatAbsensi,
            'jurnalMengajar' => $jurnalMengajar,
        ]);
    }

    /**
     * Menampilkan form untuk menambah data guru baru.
     */
    public function create()
    {
        $users = User::where('level', 'Guru')->whereDoesntHave('guru')->get();
        return Inertia::render('admin/Guru/Create', [
            'users' => $users,
        ]);
    }

    /**
     * Menyimpan data guru baru ke dalam database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_guru' => 'required|string|max:20|unique:tbl_guru',
            'nama_lengkap' => 'required|string|max:100',
            'nip' => 'nullable|string|max:30|unique:tbl_guru',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'status' => 'required|in:Aktif,Tidak Aktif,Pensiun',
            'id_pengguna' => 'nullable|exists:tbl_pengguna,id_pengguna|unique:tbl_guru,id_pengguna',
            'foto_profil' => 'nullable|image|max:2048',
            'barcode_id' => 'nullable|string|max:100|unique:tbl_guru',
            'sidik_jari_template' => 'nullable|string',
        ]);

        if ($request->hasFile('foto_profil')) {
            $path = $request->file('foto_profil')->store('foto_profil_guru', 'public');
            $validated['foto_profil'] = $path;
        }

        Guru::create($validated);
        // Menggunakan 'success' agar sesuai dengan ToastNotification di frontend
        return to_route('admin.guru.index')->with('success', 'Data Guru berhasil ditambahkan.');
    }

    /**
     * Menampilkan form untuk mengedit data guru.
     */
    public function edit(Guru $guru)
    {
        $users = User::where('level', 'Guru')
            ->where(function ($query) use ($guru) {
                $query->whereDoesntHave('guru')
                      ->orWhere('id_pengguna', $guru->id_pengguna);
            })->get();
            
        return Inertia::render('admin/Guru/Edit', [
            'guru' => $guru->load('pengguna'),
            'users' => $users,
        ]);
    }

    /**
     * Memperbarui data guru di dalam database.
     */
    public function update(Request $request, Guru $guru)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:100',
            'nip' => ['nullable', 'string', 'max:30', Rule::unique('tbl_guru')->ignore($guru->id_guru, 'id_guru')],
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'status' => 'required|in:Aktif,Tidak Aktif,Pensiun',
            'id_pengguna' => ['nullable', 'exists:tbl_pengguna,id_pengguna', Rule::unique('tbl_guru', 'id_pengguna')->ignore($guru->id_guru, 'id_guru')],
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_guru')->ignore($guru->id_guru, 'id_guru')],
            'sidik_jari_template' => 'nullable|string',
        ]);

        if ($request->hasFile('foto_profil')) {
            $request->validate(['foto_profil' => 'nullable|image|max:2048']);
            
            if ($guru->foto_profil) {
                Storage::disk('public')->delete($guru->foto_profil);
            }
            $path = $request->file('foto_profil')->store('foto_profil_guru', 'public');
            $validated['foto_profil'] = $path;
        }

        $guru->update($validated);
        
        return to_route('admin.guru.index')->with('success', 'Data Guru berhasil diperbarui.');
    }

    /**
     * Menghapus data guru dari database.
     */
    public function destroy(Guru $guru)
    {
        if ($guru->foto_profil) {
            Storage::disk('public')->delete($guru->foto_profil);
        }
        
        $guru->delete();
        
        return to_route('admin.guru.index')->with('success', 'Data Guru berhasil dihapus.');
    }

    // --- 2. METHOD BARU UNTUK REGISTRASI SIDIK JARI ---
    /**
     * Menyimpan data template sidik jari untuk guru yang spesifik.
     */
    public function registerFingerprint(Request $request, Guru $guru)
    {
        $request->validate([
            'sidik_jari_template' => 'required|string',
        ]);

        $guru->update([
            'sidik_jari_template' => $request->sidik_jari_template,
        ]);

        return back()->with('success', 'Sidik jari untuk ' . $guru->nama_lengkap . ' berhasil diregistrasi.');
    }

    // --- 3. METHOD BARU UNTUK MEMBUAT/RESET BARCODE ---
    /**
     * Membuat atau mereset Barcode ID untuk seorang guru.
     */
    public function generateBarcode(Request $request, Guru $guru)
    {
        // Buat ID unik. Format: GURU-[ID GURU]-[6 KARAKTER RANDOM]
        $newBarcodeId = 'GURU-' . $guru->id_guru . '-' . strtoupper(Str::random(6));

        $guru->update([
            'barcode_id' => $newBarcodeId,
        ]);

        return back()->with('success', 'Barcode ID baru (' . $newBarcodeId . ') untuk ' . $guru->nama_lengkap . ' berhasil dibuat.');
    }
}
