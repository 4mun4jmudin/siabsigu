<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JadwalMengajar;
use App\Models\Kelas;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use App\Models\OrangTuaWali;

class SiswaController extends Controller
{
    /**
     * Menampilkan halaman daftar siswa yang diajar oleh guru.
     */
    public function index(Request $request)
    {
        $guru = Auth::user()->guru;

        if (!$guru) {
            abort(403, 'Akses Ditolak. Akun Anda tidak terhubung dengan data guru.');
        }

        // 1. Ambil ID kelas unik yang diajar oleh guru ini dari jadwal
        $kelasIds = JadwalMengajar::where('id_guru', $guru->id_guru)
                                  ->distinct()
                                  ->pluck('id_kelas');

        // 2. Ambil data kelas tersebut untuk filter dropdown di frontend
        $kelasFilterOptions = Kelas::whereIn('id_kelas', $kelasIds)
                                    ->orderBy('tingkat')
                                    ->orderBy('jurusan')
                                    ->get(['id_kelas', 'tingkat', 'jurusan']);

        // 3. Query dasar untuk mengambil data siswa dengan relasi ke kelas
        $siswaQuery = Siswa::with('kelas')
                           ->whereIn('id_kelas', $kelasIds);

        // 4. Terapkan filter berdasarkan input dari pengguna
        if ($request->filled('kelas')) {
            $siswaQuery->where('id_kelas', $request->kelas);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $siswaQuery->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        // 5. Ambil hasil akhir dengan pagination, dan sertakan query string filter
        $siswas = $siswaQuery->orderBy('nama_lengkap')->paginate(20)->withQueryString();

        // 6. Render halaman Inertia dengan props yang dibutuhkan
        return Inertia::render('Guru/Siswa/Index', [
            'siswas' => $siswas,
            'kelasFilterOptions' => $kelasFilterOptions,
            'filters' => $request->only(['kelas', 'search']),
        ]);
    }

    public function show(Request $request, Siswa $siswa)
    {
        $guru = Auth::user()->guru;

        // Keamanan: Pastikan guru ini memang mengajar siswa tersebut.
        $isMengajar = JadwalMengajar::where('id_guru', $guru->id_guru)
                                    ->where('id_kelas', $siswa->id_kelas)
                                    ->exists();

        if (!$isMengajar) {
            abort(403, 'Anda tidak memiliki akses untuk melihat detail siswa ini.');
        }

        // Load relasi yang dibutuhkan
        $siswa->load('kelas');

        // Ambil data orang tua/wali
        $orangTuaWali = OrangTuaWali::where('id_siswa', $siswa->id_siswa)->get();

        // Ambil ringkasan absensi (contoh: untuk 30 hari terakhir)
        $absensiSummary = DB::table('tbl_absensi_siswa')
            ->where('id_siswa', $siswa->id_siswa)
            ->where('tanggal', '>=', now()->subDays(30))
            ->select('status_kehadiran', DB::raw('count(*) as total'))
            ->groupBy('status_kehadiran')
            ->get()
            ->pluck('total', 'status_kehadiran');

        return Inertia::render('Guru/Siswa/Show', [
            'siswa' => $siswa,
            'orangTuaWali' => $orangTuaWali,
            'absensiSummary' => [
                'hadir' => $absensiSummary->get('Hadir', 0),
                'sakit' => $absensiSummary->get('Sakit', 0),
                'izin' => $absensiSummary->get('Izin', 0),
                'alfa' => $absensiSummary->get('Alfa', 0),
            ],
        ]);
    }
}