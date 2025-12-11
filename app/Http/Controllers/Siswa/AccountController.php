<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    /**
     * Tampilkan halaman manajemen akun siswa.
     */
    public function edit()
    {
        $user  = Auth::user();
        $siswa = $user->siswa()->with('kelas')->first();

        if (!$siswa) {
            abort(404, 'Data siswa tidak ditemukan.');
        }

        return Inertia::render('Siswa/Akun/Edit', [
            'user'  => $user,
            'siswa' => $siswa,
        ]);
    }

    /**
     * Perbarui data profil siswa dan pengguna.
     */
    public function updateProfile(Request $request)
    {
        $user  = Auth::user();
        $siswa = $user->siswa;

        if (!$siswa) {
            abort(404, 'Data siswa tidak ditemukan.');
        }

        // Validasi input
        $validated = $request->validate([
            'nama_lengkap'    => ['required','string','max:100'],
            'nama_panggilan'  => ['nullable','string','max:30'],
            'tempat_lahir'    => ['nullable','string','max:50'],
            'tanggal_lahir'   => ['nullable','date'],
            'alamat_lengkap'  => ['nullable','string'],
            'foto_profil'     => ['nullable','image','max:2048'],
            'username'        => [
                'required','string','max:50',
                Rule::unique('tbl_pengguna','username')->ignore($user->id_pengguna,'id_pengguna'),
            ],
        ]);

        // Update data siswa
        $siswa->nama_lengkap    = $validated['nama_lengkap'];
        $siswa->nama_panggilan  = $validated['nama_panggilan'] ?? $siswa->nama_panggilan;
        $siswa->tempat_lahir    = $validated['tempat_lahir'] ?? $siswa->tempat_lahir;
        $siswa->tanggal_lahir   = $validated['tanggal_lahir'] ?? $siswa->tanggal_lahir;
        $siswa->alamat_lengkap  = $validated['alamat_lengkap'] ?? $siswa->alamat_lengkap;

        // Jika ada foto baru, hapus foto lama lalu simpan foto baru
        if ($request->hasFile('foto_profil')) {
            if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
                Storage::disk('public')->delete($siswa->foto_profil);
            }
            $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
            $siswa->foto_profil = $path;
        }

        $siswa->save();

        // Update data pengguna (username dan nama lengkap)
        $user->nama_lengkap = $validated['nama_lengkap'];
        $user->username     = $validated['username'];
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Perbarui kata sandi akun siswa.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'current_password' => ['required','current_password'],
            'password'         => ['required','confirmed','min:8'],
        ]);

        $user->password = Hash::make($request->input('password'));
        $user->save();

        return back()->with('success', 'Kata sandi berhasil diperbarui.');
    }
}
