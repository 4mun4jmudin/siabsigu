<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class SiswaLoginController extends Controller
{
    /**
     * Menampilkan halaman login untuk siswa.
     */
    public function create()
    {
        return Inertia::render('Auth/SiswaLogin');
    }

    /**
     * Menangani permintaan otentikasi dari siswa.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Kunci utama: Tambahkan 'level' => 'Siswa' saat otentikasi
        $credentials = [
            'username' => $request->username,
            'password' => $request->password,
            'level' => 'Siswa', // Memastikan hanya user dengan level 'Siswa' yang bisa login
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('siswa.dashboard'));
        }

        // Jika otentikasi gagal
        throw ValidationException::withMessages([
            'username' => 'NIS atau password yang Anda masukkan salah.',
        ]);
    }
}