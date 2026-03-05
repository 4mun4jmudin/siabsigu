<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\SuratIzin;
use App\Models\Pengaturan;
use Illuminate\Support\Str;

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
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => function () use ($request) {
                return array_merge((new Ziggy)->toArray(), [
                    'location' => $request->url(),
                ]);
            },
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'status'  => fn () => $request->session()->get('status'),
                '_ts'     => fn () => microtime(true), // Timestamp unik untuk trigger toast di React
            ],
            // Data Pengaturan Global (Logo, Nama Sekolah, dll)
            'pengaturan' => fn () => Pengaturan::first(),
            
            // Mode Admin (Full / Absensi Only) - disimpan di session
            'adminMode' => fn () => $request->session()->get('admin_mode', 'full'),

            // Statistik Global untuk Navbar/Sidebar (Notifikasi)
            'globalStats' => function () use ($request) {
                // Hanya hitung jika user login dan levelnya Admin
                if (!$request->user() || $request->user()->level !== 'Admin') {
                    return [
                        'unreadSurat' => 0,
                        'notifications' => [],
                    ];
                }

                return [
                    // Hitung jumlah surat 'Diajukan'
                    'unreadSurat' => SuratIzin::where('status_pengajuan', 'Diajukan')->count(),

                    // Ambil 5 data surat terbaru untuk dropdown notifikasi
                    'notifications' => SuratIzin::with('siswa')
                        ->where('status_pengajuan', 'Diajukan')
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function ($surat) {
                            return [
                                'id' => $surat->id_surat,
                                'data' => [
                                    'message' => $surat->siswa->nama_lengkap ?? 'Siswa',
                                    'description' => $surat->jenis_izin . ' - ' . Str::limit($surat->keterangan, 30),
                                ],
                                'created_at_human' => $surat->created_at->diffForHumans(),
                                'type' => 'surat_izin'
                            ];
                        }),
                ];
            },
        ]);
    }
}