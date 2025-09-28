<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PenilaianLoginController extends Controller
{
    public function create()
    {
        // Tampilkan halaman login khusus penilaian (Inertia)
        return Inertia::render('Auth/PenilaianLogin', [
            'title' => 'Login Admin Penilaian',
        ]);
    }

    public function store(Request $request)
    {
        // Validasi input
        $credentials = $request->validate([
            'username' => ['required','string'],
            'password' => ['required','string'],
        ], [], [
            'username' => 'Username',
            'password' => 'Kata sandi',
        ]);

        // Coba login pakai kolom username (bukan email)
        $remember = $request->boolean('remember');
        if (!Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']], $remember)) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password salah.',
            ])->redirectTo(route('login.penilaian'));
        }

        $request->session()->regenerate();

        // Hanya Admin yang boleh masuk modul Penilaian
        $user = Auth::user();
        if (!isset($user->level) || $user->level !== 'Admin') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'username' => 'Akses ditolak. Hanya akun dengan level Admin yang dapat mengakses portal Penilaian.',
            ])->redirectTo(route('login.penilaian'));
        }

        // ✅ Sukses → arahkan ke Dashboard Penilaian
        return redirect()->intended(route('admin.penilaian.dashboard'));
    }

    public function destroy(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Kembali ke form login penilaian
        return redirect()->route('login.penilaian')->with('status', 'Anda telah logout.');
    }
}
