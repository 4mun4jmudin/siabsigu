<?php

namespace App\Http\Middleware;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tightenco\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Ambil pengaturan sekali saja (biar hemat query).
        // firstOrCreate supaya aman kalau tabel kosong.
        $pengaturan = Pengaturan::query()->first() ?? Pengaturan::query()->firstOrCreate(['id' => 1]);

        // Bentuk data "app" yang ringan, cocok buat layout (sidebar/topbar)
        // (nggak perlu kirim semua kolom pengaturan ke frontend).
        $app = [
            'nama_sekolah' => $pengaturan->nama_sekolah ?? 'Sekolah',
            'logo_url' => $pengaturan->logo_url ?? null,
            'alamat_sekolah' => $pengaturan->alamat_sekolah ?? null,
            'tahun_ajaran_aktif' => $pengaturan->tahun_ajaran_aktif ?? null,
            'semester_aktif' => $pengaturan->semester_aktif ?? null,
        ];

        return array_merge(parent::share($request), [
            // Ziggy routes (opsional tapi umum dipakai di Inertia + React)
            // 'ziggy' => fn () => array_merge((new Ziggy)->toArray(), [
            //     'location' => $request->url(),
            // ]),

            'auth' => [
                'user' => $request->user(),
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],

            /**
             * Pengaturan full (kalau halaman tertentu butuh banyak field).
             * Kalau mau super hemat, bisa hapus ini dan cukup pakai 'app'.
             */
            'pengaturan' => $pengaturan,

            /**
             * Data global untuk layout UI (yang kamu pakai di GuruLayout.jsx: usePage().props.app)
             */
            'app' => $app,

            /**
             * Mode admin (contoh switch tab absensi/nilai, dll)
             */
            'adminMode' => fn () => ($request->user() && strtoupper($request->user()->level) === 'ADMIN')
                ? ($request->session()->get('admin_mode', 'absensi'))
                : null,
        ]);
    }
}
