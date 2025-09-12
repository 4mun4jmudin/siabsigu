<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SiswaAuthController extends Controller
{
    /**
     * Menangani permintaan login dari siswa.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // 1. Validasi input: nis dan password wajib diisi.
        $request->validate([
            'nis' => 'required|string',
            'password' => 'required|string',
        ]);

        // 2. Cari pengguna berdasarkan username (yang berisi NIS) dan level 'Siswa'.
        $user = User::where('username', $request->nis)
                    ->where('level', 'Siswa')
                    ->first();

        // 3. Verifikasi pengguna dan password.
        // Jika user tidak ditemukan atau password salah, kirim pesan error.
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'nis' => ['NIS atau password yang Anda masukkan salah.'],
            ]);
        }

        // 4. Pastikan akun pengguna ini terhubung ke data siswa.
        // Ini penting untuk mencegah user tanpa profil siswa bisa login.
        $user->load('siswa.kelas'); // Eager load relasi siswa dan kelasnya.
        
        if (!$user->siswa) {
            return response()->json([
                'message' => 'Akun Anda tidak terhubung dengan data siswa. Harap hubungi administrator.'
            ], 403); // 403 Forbidden
        }

        // 5. Buat token API menggunakan Sanctum.
        $token = $user->createToken('siswa-auth-token')->plainTextToken;

        // 6. Kembalikan respons JSON yang berisi pesan sukses, data siswa, dan token.
        return response()->json([
            'message' => 'Login berhasil!',
            'user' => $user->siswa, // Mengirim data siswa yang sudah di-load dengan kelasnya.
            'token' => $token,
        ]);
    }

    /**
     * Mengambil data siswa yang sedang terautentikasi.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        // Auth::user() akan mengambil user berdasarkan token yang dikirim.
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Load relasi siswa dan kelasnya untuk memastikan data lengkap.
        $user->load('siswa.kelas');
        
        // Kembalikan data siswa dalam format JSON.
        return response()->json($user->siswa);
    }

    /**
     * Menangani permintaan logout dan menghapus token saat ini.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Menghapus token yang sedang digunakan untuk login.
        // Ini akan membuat token tersebut tidak valid lagi.
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Anda telah berhasil logout.']);
    }
}