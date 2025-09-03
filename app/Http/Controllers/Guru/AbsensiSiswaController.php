<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\JadwalMengajar;
use App\Models\Siswa;
use App\Models\AbsensiSiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AbsensiSiswaController extends Controller
{
    /**
     * Menampilkan daftar jadwal mengajar guru pada hari ini untuk pemilihan kelas.
     */
    public function index()
    {
        $guru = Auth::user()->guru;
        Carbon::setLocale('id');
        $hariIni = Carbon::now()->translatedFormat('l');

        $jadwalHariIni = JadwalMengajar::with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai', 'asc')
            ->get();

        return Inertia::render('Guru/AbsensiSiswa/Index', [
            'jadwalHariIni' => $jadwalHariIni,
        ]);
    }

    /**
     * Menampilkan halaman untuk mengisi absensi siswa untuk jadwal tertentu.
     */
    public function show(JadwalMengajar $jadwal)
    {
        // Pastikan guru yang login adalah guru yang mengajar sesuai jadwal
        // if ($jadwal->id_guru != Auth::user()->guru->id_guru) {
        //     abort(403, 'Anda tidak memiliki akses ke jadwal ini.');
        // }
        
        // Load relasi kelas beserta siswanya
        $jadwal->load('kelas.siswa');

        // Ambil data absensi yang sudah ada untuk jadwal dan tanggal ini
        $absensiHariIni = AbsensiSiswa::where('id_jadwal', $jadwal->id_jadwal)
            ->whereDate('tanggal', Carbon::today())
            ->get()
            ->keyBy('id_siswa'); // Gunakan id_siswa sebagai key untuk kemudahan akses di frontend

        return Inertia::render('Guru/AbsensiSiswa/Show', [
            'jadwal' => $jadwal,
            'siswaList' => $jadwal->kelas->siswa,
            'absensiHariIni' => $absensiHariIni,
        ]);
    }

    /**
     * Menyimpan data absensi siswa.
     */
    public function store(Request $request, JadwalMengajar $jadwal)
    {
        // Validasi
        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.id_siswa' => 'required|exists:tbl_siswa,id_siswa',
            'absensi.*.status' => 'required|in:Hadir,Sakit,Izin,Alfa',
            'absensi.*.keterangan' => 'nullable|string|max:255',
        ]);

        $absensiData = $request->input('absensi');
        $tanggal = Carbon::today();

        foreach ($absensiData as $data) {
            AbsensiSiswa::updateOrCreate(
                [
                    'id_jadwal' => $jadwal->id_jadwal,
                    'id_siswa' => $data['id_siswa'],
                    'tanggal' => $tanggal,
                ],
                [
                    'status' => $data['status'],
                    'keterangan' => $data['keterangan'] ?? null,
                    'id_guru' => $jadwal->id_guru,
                ]
            );
        }

        return redirect()->route('guru.absensi-siswa.index')->with('success', 'Absensi berhasil disimpan.');
    }
}