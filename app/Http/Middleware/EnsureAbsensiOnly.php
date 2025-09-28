<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAbsensiOnly
{
    public function handle(Request $request, Closure $next)
    {
        // Hanya berlaku untuk admin & saat session mode=absensi
        $user = $request->user();
        if (!$user || strtoupper($user->level) !== 'ADMIN') {
            return $next($request);
        }

        if (session('admin_mode', 'absensi') !== 'absensi') {
            return $next($request);
        }

        // Daftar rute yang BOLEH diakses saat mode "absensi"
        $allowed = [
            'admin.dashboard',
            'admin.absensi-guru.*',
            'admin.absensi-siswa.*',
            'admin.absensi-siswa-mapel.*',
            // endpoint untuk ganti mode tetap boleh
            'admin.mode.update',
        ];

        foreach ($allowed as $pat) {
            if ($request->routeIs($pat)) {
                return $next($request);
            }
        }

        return redirect()
            ->route('admin.dashboard')
            ->with('error', 'Fitur non-absensi disembunyikan pada Mode Absensi. Ubah ke Full untuk mengakses.');
    }
}
