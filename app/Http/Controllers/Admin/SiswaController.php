<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\OrangTuaWali; // <-- Tambahkan model ini
use App\Models\AbsensiSiswa; // <-- Tambahkan model ini
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiswaController extends Controller
{
    /**
     * Menampilkan halaman daftar siswa dengan filter dan statistik.
     */
    public function index(Request $request)
    {
        // Ambil semua kelas untuk dropdown filter
        $kelasOptions = Kelas::orderBy('tingkat')->get();

        // Query utama untuk mengambil data siswa
        $siswas = Siswa::with('kelas') // Eager load relasi kelas
            ->when($request->input('search'), function ($query, $search) {
                // Filter berdasarkan pencarian nama atau NIS
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            })
            ->when($request->input('kelas'), function ($query, $kelasId) {
                // Filter berdasarkan kelas yang dipilih
                $query->where('id_kelas', $kelasId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Siswa/Index', [
            'siswas' => $siswas,
            'kelasOptions' => $kelasOptions,
            'filters' => $request->only(['search', 'kelas']),
        ]);
    }

    /**
     * Menampilkan halaman detail seorang siswa.
     */
    // public function show(Siswa $siswa)
    // {
    //     // Eager load relasi kelas untuk ditampilkan di halaman detail
    //     $siswa->load('kelas');
    //     return Inertia::render('admin/Siswa/Show', [
    //         'siswa' => $siswa,
    //     ]);
    // }

    public function show(Siswa $siswa)
    {
        // Eager load relasi utama
        $siswa->load('kelas.waliKelas');

        // Ambil data untuk tab "Orang Tua/Wali"
        $orangTuaWali = OrangTuaWali::where('id_siswa', $siswa->id_siswa)->get();

        // Ambil data untuk tab "Riwayat Absensi" (contoh: 30 data terakhir)
        $riwayatAbsensi = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->latest('tanggal')
            ->take(30)
            ->get();

        return Inertia::render('admin/Siswa/Show', [
            'siswa' => $siswa,
            'orangTuaWali' => $orangTuaWali,
            'riwayatAbsensi' => $riwayatAbsensi,
        ]);
    }

    /**
     * Menampilkan form untuk menambah data siswa baru.
     */
    public function create()
    {
        return Inertia::render('admin/Siswa/Create', [
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Menyimpan data siswa baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_siswa' => 'required|string|max:20|unique:tbl_siswa',
            'nis' => 'required|string|max:30|unique:tbl_siswa',
            'nisn' => 'required|string|max:20|unique:tbl_siswa',
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|max:2048',
            'nik' => 'required|string|max:16|unique:tbl_siswa',
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
        ]);

        if ($request->hasFile('foto_profil')) {
            $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
            $validated['foto_profil'] = $path;
        }

        Siswa::create($validated);
        return to_route('siswa.index')->with('message', 'Data Siswa berhasil ditambahkan.');
    }

    /**
     * Menampilkan form untuk mengedit data siswa.
     */
    public function edit(Siswa $siswa)
    {
        return Inertia::render('admin/Siswa/Edit', [
            'siswa' => $siswa,
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Memperbarui data siswa di database.
     */
    public function update(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:30', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nisn' => ['required', 'string', 'max:20', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|max:2048',
            'nik' => ['required', 'string', 'max:16', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
        ]);

        if ($request->hasFile('foto_profil')) {
            if ($siswa->foto_profil) {
                Storage::disk('public')->delete($siswa->foto_profil);
            }
            $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
            $validated['foto_profil'] = $path;
        }

        $siswa->update($validated);
        return to_route('siswa.index')->with('message', 'Data Siswa berhasil diperbarui.');
    }

    /**
     * Menghapus data siswa dari database.
     */
    public function destroy(Siswa $siswa)
    {
        if ($siswa->foto_profil) {
            Storage::disk('public')->delete($siswa->foto_profil);
        }
        $siswa->delete();
        return to_route('siswa.index')->with('message', 'Data Siswa berhasil dihapus.');
    }
}
