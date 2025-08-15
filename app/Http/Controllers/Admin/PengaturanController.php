<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pengaturan;
use Inertia\Inertia;

class PengaturanController extends Controller
{
    /**
     * Menampilkan halaman pengaturan.
     */
    public function index()
    {
        // Ambil semua pengaturan dari database dan ubah menjadi format yang mudah diakses
        $pengaturan = Pengaturan::all()->pluck('value', 'key');

        return Inertia::render('admin/Pengaturan/Index', [
            'pengaturan' => $pengaturan
        ]);
    }

    /**
     * Menyimpan perubahan pengaturan.
     */
    public function update(Request $request)
    {
        $request->validate([
            'jam_masuk' => 'required|date_format:H:i',
            'jam_pulang' => 'required|date_format:H:i|after:jam_masuk',
        ]);

        // Gunakan updateOrCreate untuk memperbarui atau membuat pengaturan jika belum ada
        Pengaturan::updateOrCreate(
            ['key' => 'jam_masuk'],
            ['value' => $request->jam_masuk]
        );

        Pengaturan::updateOrCreate(
            ['key' => 'jam_pulang'],
            ['value' => $request->jam_pulang]
        );

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }
}
