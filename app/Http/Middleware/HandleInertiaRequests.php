<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Pengaturan;

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
    public function version(Request $request): string|null
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
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            // Tambahkan ini untuk membagikan data pengaturan
            'pengaturan' => Pengaturan::firstOrCreate(['id' => 1]),
            
            'adminMode' => fn() => ($request->user() && strtoupper($request->user()->level) === 'ADMIN')
                ? ($request->session()->get('admin_mode', 'absensi'))
                : null,
        ]);
    }
}
