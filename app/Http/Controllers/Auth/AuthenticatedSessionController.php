<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
// Hapus 'use App\Providers\RouteServiceProvider;' karena sudah tidak digunakan
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();
        $level = strtolower($user->level); // Ambil level dan ubah ke huruf kecil

        // Gunakan switch untuk penanganan yang lebih bersih
        switch ($level) {
            case 'admin':
                return redirect()->route('admin.dashboard');

            case 'siswa':
                return redirect()->route('siswa.dashboard');

            case 'guru':
                // Nanti akan kita arahkan ke dasbor guru
                // Untuk sekarang, kita arahkan ke dasbor umum dulu
                return redirect()->route('dashboard'); // Ubah ke guru.dashboard jika sudah dibuat

            case 'orang tua':
                // Nanti akan kita arahkan ke dasbor orang tua
                return redirect()->route('dashboard');

            default:
                // Fallback untuk level yang tidak dikenali
                return redirect()->intended('/dashboard');
        }
    }
    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
