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
        // ✅ FIX: Check if user is authenticated
        if (!Auth::check()) {
            return redirect('login')
                ->with('error', 'Harap login terlebih dahulu.');
        }

        $user = Auth::user();
        $userLevel = strtolower($user->level ?? '');

        // Check apakah level pengguna ada dalam daftar level yang diizinkan
        foreach ($levels as $level) {
            if ($userLevel === strtolower($level)) {
                return $next($request); // ✅ Izinkan akses
            }
        }

        // ✅ FIX: Improved error handling & routing
        // Jika tidak diizinkan, arahkan ke dashboard masing-masing dengan pesan error
        $routeMap = [
            'admin'    => 'admin.dashboard',
            'guru'     => 'guru.dashboard',
            'siswa'    => 'siswa.dashboard',
            'orang tua'=> 'orangtua.dashboard',
        ];

        $redirectRoute = $routeMap[$userLevel] ?? '/';
        $errorMessage = 'Anda tidak memiliki akses ke halaman ini.';

        return redirect()
            ->route($redirectRoute)
            ->with('error', $errorMessage);
    }
}
