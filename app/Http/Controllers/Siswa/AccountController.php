<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Helper untuk ambil user & siswa yang sedang login.
     */
    protected function getCurrentUserAndSiswa(): array
    {
        $user = Auth::user();

        $siswa = $user->siswa()->with('kelas')->first();

        if (! $siswa) {
            abort(404, 'Data siswa tidak ditemukan.');
        }

        return [$user, $siswa];
    }

    /**
     * Halaman utama manajemen akun siswa (data profil + password).
     */
    public function edit()
    {
        [$user, $siswa] = $this->getCurrentUserAndSiswa();

        return Inertia::render('Siswa/Account/Edit', [
            'user'  => $user,
            'siswa' => $siswa,
        ]);
    }

    /**
     * Update data profil (tanpa foto & password).
     */
    public function updateProfile(Request $request)
    {
        [$user, $siswa] = $this->getCurrentUserAndSiswa();

        $validated = $request->validate([
            'nama_lengkap'    => ['required', 'string', 'max:100'],
            'nama_panggilan'  => ['nullable', 'string', 'max:30'],
            'tempat_lahir'    => ['nullable', 'string', 'max:50'],
            'tanggal_lahir'   => ['nullable', 'date'],
            'alamat_lengkap'  => ['nullable', 'string'],
            'username'        => [
                'required',
                'string',
                'max:50',
                Rule::unique('tbl_pengguna', 'username')->ignore($user->id_pengguna, 'id_pengguna'),
            ],
        ]);

        // Update data siswa
        $siswa->nama_lengkap    = $validated['nama_lengkap'];
        $siswa->nama_panggilan  = $validated['nama_panggilan'] ?? $siswa->nama_panggilan;
        $siswa->tempat_lahir    = $validated['tempat_lahir'] ?? $siswa->tempat_lahir;
        $siswa->tanggal_lahir   = $validated['tanggal_lahir'] ?? $siswa->tanggal_lahir;
        $siswa->alamat_lengkap  = $validated['alamat_lengkap'] ?? $siswa->alamat_lengkap;
        $siswa->save();

        // Update juga data user (tbl_pengguna)
        $user->nama_lengkap = $validated['nama_lengkap'];
        $user->username     = $validated['username'];
        $user->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Halaman khusus untuk ubah foto profil.
     */
    public function editPhoto()
    {
        [$user, $siswa] = $this->getCurrentUserAndSiswa();

        return Inertia::render('Siswa/Account/EditPhoto', [
            'user'  => $user,
            'siswa' => $siswa,
        ]);
    }

    /**
     * Proses upload / update foto profil.
     */
    public function updatePhoto(Request $request)
    {
        [$user, $siswa] = $this->getCurrentUserAndSiswa();

        $request->validate([
            'foto_profil' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp,gif',
                'max:2048',
            ],
        ]);

        // Hapus foto lama jika ada
        if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
            Storage::disk('public')->delete($siswa->foto_profil);
        }

        $file = $request->file('foto_profil');
        $extension = $file->getClientOriginalExtension();

        // Nama file unik: siswa_[ID]_TIMESTAMP_RANDOM.ext
        $filename = 'siswa_' . $siswa->id_siswa . '_' . time() . '_' . uniqid() . '.' . $extension;

        // Simpan ke disk public, folder foto_profil_siswa
        $path = $file->storeAs('foto_profil_siswa', $filename, 'public');

        // Simpan path ke kolom foto_profil di tbl_siswa
        $siswa->foto_profil = $path;
        $siswa->save();

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    /**
     * Update password siswa.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', 'min:8'],
        ]);

        $user->password = Hash::make($request->input('password'));
        $user->save();

        return back()->with('success', 'Kata sandi berhasil diperbarui.');
    }
}
