<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Menampilkan halaman login utama (untuk Admin & Guru).
     */
    public function create(): \Inertia\Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Menangani permintaan otentikasi untuk Admin & Guru.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('username', 'password');

        // Coba login sebagai Admin atau Guru
        if (Auth::attempt($credentials, $request->boolean('remember'))) {

            $user = Auth::user();
            $level = strtolower($user->level);

            // Jika yang berhasil login adalah Siswa, tolak dia
            if ($level === 'siswa') {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                throw ValidationException::withMessages([
                    'username' => 'Akun siswa hanya dapat login melalui halaman login siswa.',
                ]);
            }

            // Jika Admin atau Guru, lanjutkan
            $request->session()->regenerate();

            $mode = $request->input('mode', 'absensi'); // 'absensi' | 'full'
            $mode = in_array($mode, ['absensi', 'full'], true) ? $mode : 'absensi';

            if ($level === 'admin') {
                // simpan pilihan mode di session
                $request->session()->put('admin_mode', $mode);
                return redirect()->intended(route('admin.dashboard'));
            }

            if ($level === 'guru') {
                // guru tidak pakai admin_mode
                $request->session()->forget('admin_mode');
                return redirect()->intended(route('guru.dashboard'));
            }

            // Fallback jika ada level lain (misal: Orang Tua)
            return redirect('/dashboard');
        }

        // Jika username & password tidak cocok sama sekali
        throw ValidationException::withMessages([
            'username' => 'Kredensial yang Anda masukkan tidak cocok dengan data kami.',
        ]);
    }

    /**
     * Menghancurkan sesi otentikasi (logout).
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
