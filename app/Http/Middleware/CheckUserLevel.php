<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserLevel
{
    public function handle(Request $request, Closure $next, ...$levels): Response
    {
        if (!Auth::check()) {
            return redirect('login');
        }

        $user = Auth::user();

        foreach ($levels as $level) {
            if ($user->level == $level) {
                // Jika level cocok, izinkan akses
                return $next($request);
            }
        }

        // Jika tidak cocok, redirect berdasarkan level pengguna saat ini
        if ($user->level === 'Admin') {
            return redirect()->route('admin.dashboard')->with('error', 'Anda tidak memiliki hak akses ke halaman siswa.');
        }

        // Default redirect jika ada peran lain
        return redirect('/dashboard')->with('error', 'Akses ditolak.');
    }
}