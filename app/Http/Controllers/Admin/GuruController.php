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
use Inertia\Inertia;

class GuruController extends Controller
{
    /**
     * Menampilkan halaman daftar guru beserta statistik dan pencarian.
     */
    public function index(Request $request)
    {
        // Menghitung statistik untuk kartu di bagian atas
        $stats = [
            'total' => Guru::count(),
            'aktif' => Guru::where('status', 'Aktif')->count(),
            'waliKelas' => Kelas::whereNotNull('id_wali_kelas')->distinct()->count('id_wali_kelas'),
            'sidikJari' => Guru::whereNotNull('sidik_jari_template')->count(),
        ];

        // Query untuk mengambil daftar guru dengan pencarian dan paginasi
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
        // Eager load relasi utama
        $guru->load(['pengguna', 'kelasWali']);

        // Ambil data untuk tab "Jadwal Mengajar"
        $jadwalMengajar = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran', 'tahunAjaran'])
            ->get()
            ->groupBy('hari'); // Kelompokkan berdasarkan hari

        // Ambil data untuk tab "Riwayat Absensi" (contoh: 15 data terakhir)
        $riwayatAbsensi = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->latest('tanggal')
            ->take(15)
            ->get();
            
        // Ambil data untuk tab "Jurnal Mengajar" (contoh: 15 data terakhir)
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
        // Ambil user dengan level 'Guru' yang belum terhubung ke data guru manapun
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
        return to_route('admin.guru.index')->with('message', 'Data Guru berhasil ditambahkan.');
    }

    /**
     * Menampilkan form untuk mengedit data guru.
     */
    public function edit(Guru $guru)
    {
        // Ambil user yang belum terpakai ATAU user yang sedang dipakai oleh guru ini
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

        // Handle file upload secara terpisah untuk update
        if ($request->hasFile('foto_profil')) {
            $request->validate(['foto_profil' => 'nullable|image|max:2048']);
            
            // Hapus foto lama jika ada
            if ($guru->foto_profil) {
                Storage::disk('public')->delete($guru->foto_profil);
            }
            // Simpan foto baru
            $path = $request->file('foto_profil')->store('foto_profil_guru', 'public');
            $validated['foto_profil'] = $path;
        }

        $guru->update($validated);
        
        return to_route('admin.guru.index')->with('message', 'Data Guru berhasil diperbarui.');
    }

    /**
     * Menghapus data guru dari database.
     */
    public function destroy(Guru $guru)
    {
        // Hapus foto dari storage jika ada
        if ($guru->foto_profil) {
            Storage::disk('public')->delete($guru->foto_profil);
        }
        
        $guru->delete();
        
        return to_route('admin.guru.index')->with('message', 'Data Guru berhasil dihapus.');
    }
}
