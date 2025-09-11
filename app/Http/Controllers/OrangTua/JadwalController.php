<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Models\JadwalMengajar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JadwalController extends Controller
{
    public function index()
    {
        $orangTua = Auth::user()->orangTuaWali;

        // Pastikan orang tua terhubung dengan siswa
        if (!$orangTua || !$orangTua->siswa) {
            return Inertia::render('OrangTua/Jadwal/Index', [
                'jadwalPelajaran' => [],
                'siswa' => null,
            ]);
        }

        $siswa = $orangTua->siswa()->with('kelas')->first();

        // Ambil jadwal berdasarkan id_kelas siswa
        $jadwal = JadwalMengajar::where('id_kelas', $siswa->id_kelas)
            ->with(['mapel', 'guru'])
            ->orderBy('jam_mulai', 'asc')
            ->get()
            ->groupBy('hari'); // Kelompokkan berdasarkan hari

        return Inertia::render('OrangTua/Jadwal/Index', [
            'jadwalPelajaran' => $jadwal,
            'siswa' => $siswa,
        ]);
    }
}