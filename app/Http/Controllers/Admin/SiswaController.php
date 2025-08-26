<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\OrangTuaWali; 
use App\Models\AbsensiSiswa; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str; // <-- Import Str
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiswaController extends Controller
{
    // ... (method index & show tidak berubah) ...
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


    public function create()
    {
        return Inertia::render('admin/Siswa/Create', [
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

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
            // -- TAMBAHKAN VALIDASI --
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => 'nullable|string|max:100|unique:tbl_siswa,barcode_id',
            // ------------------------
        ]);

        if ($request->hasFile('foto_profil')) {
            $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
            $validated['foto_profil'] = $path;
        }

        Siswa::create($validated);
        return to_route('admin.siswa.index')->with('message', 'Data Siswa berhasil ditambahkan.');
    }

    
    public function edit(Siswa $siswa)
    {
        return Inertia::render('admin/Siswa/Edit', [
            'siswa' => $siswa,
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    
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
             // -- TAMBAHKAN VALIDASI --
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            // ------------------------
        ]);

        if ($request->hasFile('foto_profil')) {
            if ($siswa->foto_profil) {
                Storage::disk('public')->delete($siswa->foto_profil);
            }
            $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
            $validated['foto_profil'] = $path;
        }

        $siswa->update($validated);
        return to_route('admin.siswa.index')->with('message', 'Data Siswa berhasil diperbarui.');
    }

    /**
     * =================================================================
     * METHOD BARU UNTUK SIDIK JARI & BARCODE
     * =================================================================
     */
    public function updateKeamanan(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa', 'barcode_id')->ignore($siswa->id_siswa, 'id_siswa')],
        ]);

        // Generate barcode_id jika kosong tapi diminta generate
        if ($request->input('generate_barcode') && empty($validated['barcode_id'])) {
            $validated['barcode_id'] = 'SISWA-' . Str::upper(Str::random(10));
        }

        $siswa->update($validated);
        
        // Redirect kembali ke halaman show dengan pesan sukses
        return redirect()->route('admin.siswa.show', $siswa->id_siswa)
                         ->with('message', 'Data keamanan (Sidik Jari & Barcode) berhasil diperbarui.');
    }


    public function destroy(Siswa $siswa)
    {
        if ($siswa->foto_profil) {
            Storage::disk('public')->delete($siswa->foto_profil);
        }
        $siswa->delete();
        return to_route('admin.siswa.index')->with('message', 'Data Siswa berhasil dihapus.');
    }
}