<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrangTuaProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Menampilkan halaman profil orang tua dan siswa terkait.
     */
    public function show()
    {
        $user = Auth::user();
        $orangTua = $user->orangTuaWali;

        if (!$orangTua) {
            // Seharusnya tidak terjadi jika sudah login, tapi sebagai penjagaan
            abort(404, 'Data profil tidak ditemukan.');
        }

        // Ambil data siswa lengkap dengan relasi kelasnya
        $siswa = $orangTua->siswa()->with('kelas')->first();

        return Inertia::render('OrangTua/Profile/Show', [
            'orangTua' => $orangTua,
            'siswa' => $siswa,
        ]);
    }

    /**
     * Memperbarui profil orang tua yang sedang login.
     */
    public function update(OrangTuaProfileUpdateRequest $request)
    {
        // Ambil model OrangTuaWali yang terhubung dengan user yang login
        $orangTua = Auth::user()->orangTuaWali;

        // Ambil semua data yang sudah divalidasi
        $validatedData = $request->validated();

        // Update data teks (nama, telepon, dll) dari request
        // Kita gunakan $request->input() untuk mengambil data meskipun kosong
        $orangTua->nama_lengkap = $request->input('nama_lengkap');
        $orangTua->no_telepon_wa = $request->input('no_telepon_wa');
        $orangTua->pekerjaan = $request->input('pekerjaan');
        $orangTua->pendidikan_terakhir = $request->input('pendidikan_terakhir');

        // Logika untuk menangani unggahan file foto
        if ($request->hasFile('file_foto')) {
            // Hapus foto lama jika ada
            if ($orangTua->foto_profil && Storage::disk('public')->exists($orangTua->foto_profil)) {
                Storage::disk('public')->delete($orangTua->foto_profil);
            }
            // Simpan foto baru dan tetapkan path-nya ke model
            $path = $request->file('file_foto')->store('profil_orangtua', 'public');
            $orangTua->foto_profil = $path;
        }

        // Simpan semua perubahan (baik teks maupun foto)
        $orangTua->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }
}
