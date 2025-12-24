<?php

namespace App\Http\Middleware;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $pengaturan = Pengaturan::query()->first() ?? Pengaturan::query()->firstOrCreate(['id' => 1]);

        $logoRaw =
            $pengaturan->logo_url
            ?? $pengaturan->logo_sekolah
            ?? $pengaturan->logo
            ?? $pengaturan->icon
            ?? null;

        $logoUrl = null;
        if ($logoRaw) {
            if (preg_match('/^https?:\/\//i', $logoRaw)) {
                $logoUrl = $logoRaw;
            } else {
                $logoUrl = asset('storage/' . ltrim($logoRaw, '/'));
            }
        }

        $app = [
            'nama_sekolah' => $pengaturan->nama_sekolah ?? 'Sekolah',
            'logo_url' => $logoUrl,
            'alamat_sekolah' => $pengaturan->alamat_sekolah ?? null,
            'tahun_ajaran_aktif' => $pengaturan->tahun_ajaran_aktif ?? null,
            'semester_aktif' => $pengaturan->semester_aktif ?? null,
        ];

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],

            // ✅ WAJIB: flash top-level closure (stabil)
            'flash' => fn () => [
                'success' => $request->session()->pull('success'),
                'error'   => $request->session()->pull('error'),
            ],

            'pengaturan' => $pengaturan,
            'app' => $app,

            'adminMode' => fn () => ($request->user() && strtoupper($request->user()->level) === 'ADMIN')
                ? ($request->session()->get('admin_mode', 'absensi'))
                : null,
        ]);
    }
}
