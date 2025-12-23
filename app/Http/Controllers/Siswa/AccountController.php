<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AccountController extends Controller
{
    private function getSiswaFromUser(Request $request): Siswa
    {
        $user = $request->user();
        $idPengguna = $user->id_pengguna ?? $user->id ?? null;

        return Siswa::with('kelas')
            ->where('id_pengguna', $idPengguna)
            ->firstOrFail();
    }

    public function edit(Request $request)
    {
        $user = $request->user();
        $siswa = $this->getSiswaFromUser($request);

        return Inertia::render('Siswa/Account/Edit', [
            'user' => $user,
            'siswa' => $siswa,
        ]);
    }

    public function editPhoto(Request $request)
    {
        $user = $request->user();
        $siswa = $this->getSiswaFromUser($request);

        return Inertia::render('Siswa/Account/EditPhoto', [
            'user' => $user,
            'siswa' => $siswa,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $siswa = $this->getSiswaFromUser($request);

        $validated = $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nama_panggilan' => ['nullable', 'string', 'max:255'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat_lengkap' => ['nullable', 'string'],
            'username' => ['required', 'string', 'max:255'],
            'foto_profil' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ]);

        // update siswa fields
        $siswa->fill([
            'nama_lengkap' => $validated['nama_lengkap'],
            'nama_panggilan' => $validated['nama_panggilan'] ?? null,
            'tempat_lahir' => $validated['tempat_lahir'] ?? null,
            'tanggal_lahir' => $validated['tanggal_lahir'] ?? null,
            'alamat_lengkap' => $validated['alamat_lengkap'] ?? null,
        ]);

        // update username user
        $user->username = $validated['username'];
        $user->save();

        // handle foto (kalau ada)
        if ($request->hasFile('foto_profil')) {
            // hapus lama (kalau path valid)
            $old = $siswa->foto_profil;
            if ($old) {
                $old = ltrim($old, '/');
                $old = preg_replace('#^storage/#', '', $old);
                $old = preg_replace('#^public/#', '', $old);

                if (Storage::disk('public')->exists($old)) {
                    Storage::disk('public')->delete($old);
                }
            }

            // SIMPAN KE DISK public TANPA PREFIX "public/"
            $path = $request->file('foto_profil')->store('foto-profil/siswa', 'public');
            $siswa->foto_profil = $path;
        }

        $siswa->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updatePhoto(Request $request)
    {
        $siswa = $this->getSiswaFromUser($request);

        $request->validate([
            'foto_profil' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ]);

        // hapus foto lama
        $old = $siswa->foto_profil;
        if ($old) {
            $old = ltrim($old, '/');
            $old = preg_replace('#^storage/#', '', $old);
            $old = preg_replace('#^public/#', '', $old);

            if (Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
        }

        // simpan baru (nama random otomatis, URL berubah, cache aman)
        $path = $request->file('foto_profil')->store('foto-profil/siswa', 'public');
        $siswa->foto_profil = $path;
        $siswa->save();

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password saat ini salah.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return back()->with('success', 'Password berhasil diperbarui.');
    }
}
