<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserLevel
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$levels): Response
    {
        if (!Auth::check()) {
            return redirect('login');
        }

        $user = Auth::user();
        $userLevel = strtolower($user->level);

        // Cek apakah level pengguna ada dalam daftar level yang diizinkan
        foreach ($levels as $level) {
            if ($userLevel == strtolower($level)) {
                return $next($request); // Izinkan akses
            }
        }

        // --- INI BAGIAN YANG DIPERBAIKI ---
        // Jika tidak diizinkan, arahkan kembali ke dasbor masing-masing
        $message = 'Anda tidak memiliki hak akses ke halaman tersebut.';

        switch ($userLevel) {
            case 'admin':
                return redirect()->route('admin.dashboard')->with('error', $message);
            case 'guru':
                return redirect()->route('guru.dashboard')->with('error', $message);
            case 'siswa':
                return redirect()->route('siswa.dashboard')->with('error', $message);
            default:
                // Fallback jika ada peran lain, logout untuk keamanan
                Auth::logout();
                return redirect('/')->with('error', 'Level pengguna tidak dikenali.');
        }
    }
}