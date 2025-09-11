<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OrangTuaLoginController extends Controller
{
    /**
     * Menampilkan halaman login untuk Orang Tua/Wali.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/OrangTuaLogin', [
            'status' => session('status'),
        ]);
    }

    /**
     * Menangani permintaan login yang masuk.
     */
    public function store(LoginRequest $request)
    {
        // Coba autentikasi seperti biasa
        $request->authenticate();

        $user = Auth::user();

        // PENTING: Cek apakah level pengguna adalah 'Orang Tua'
        if ($user->level !== 'Orang Tua') {
            // Jika bukan, logout dan kembalikan dengan error
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'username' => 'Akses ditolak. Akun ini bukan akun Orang Tua/Wali.',
            ]);
        }

        // Jika berhasil dan levelnya benar, regenerasi sesi
        $request->session()->regenerate();

        // Arahkan ke dashboard Orang Tua
        return redirect()->intended(route('orangtua.dashboard', absolute: false));
    }
}