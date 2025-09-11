<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PengumumanController extends Controller
{
    public function index()
    {
        $pengumuman = Pengumuman::whereIn('target_level', ['Semua', 'Orang Tua'])
            ->with('pembuat') // Eager load relasi pembuat (user)
            ->latest('tanggal_terbit') // Urutkan dari yang terbaru
            ->paginate(10);

        return Inertia::render('OrangTua/Pengumuman/Index', [
            'pengumuman' => $pengumuman,
        ]);
    }

    public function show(Pengumuman $pengumuman)
    {
        // Pastikan orang tua hanya bisa melihat pengumuman yang sesuai target
        if (!in_array($pengumuman->target_level, ['Semua', 'Orang Tua'])) {
            abort(403);
        }
        
        $pengumuman->load('pembuat');

        return Inertia::render('OrangTua/Pengumuman/Show', [
            'pengumuman' => $pengumuman,
        ]);
    }
}