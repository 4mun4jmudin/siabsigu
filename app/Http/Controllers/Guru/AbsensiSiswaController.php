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
        // Load relasi kelas beserta siswanya
        $jadwal->load('kelas.siswa');

        // Ambil data absensi yang sudah ada untuk kelas dan tanggal ini
        $siswaIds = $jadwal->kelas->siswa->pluck('id_siswa');
        $absensiHariIni = AbsensiSiswa::whereIn('id_siswa', $siswaIds)
            ->whereDate('tanggal', Carbon::today())
            ->get()
            ->keyBy('id_siswa');

        return Inertia::render('Guru/AbsensiSiswa/Show', [
            'jadwal' => $jadwal,
            'siswaList' => $jadwal->kelas->siswa,
            'absensiHariIni' => $absensiHariIni,
        ]);
    }

    /**
     * Menyimpan data absensi siswa (bulk upsert — 1 query).
     */
    public function store(Request $request, JadwalMengajar $jadwal)
    {
        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.id_siswa' => 'required|exists:tbl_siswa,id_siswa',
            'absensi.*.status_kehadiran' => 'required|in:Hadir,Sakit,Izin,Alfa',
            'absensi.*.keterangan' => 'nullable|string|max:255',
        ]);

        $tanggal     = Carbon::today()->toDateString();
        $tanggalCode = Carbon::today()->format('ymd');
        $guruUserId  = Auth::id();

        // Build array untuk bulk upsert — 1 query untuk semua siswa
        $rows = collect($request->input('absensi'))->map(fn ($data) => [
            'id_absensi'          => 'AS-' . $tanggalCode . '-' . $data['id_siswa'],
            'id_siswa'            => $data['id_siswa'],
            'tanggal'             => $tanggal,
            'status_kehadiran'    => $data['status_kehadiran'],
            'keterangan'          => $data['keterangan'] ?? null,
            'metode_absen'        => 'Manual',
            'id_penginput_manual' => $guruUserId,
            'menit_keterlambatan' => 0,
        ])->all();

        AbsensiSiswa::upsert(
            $rows,
            ['id_siswa', 'tanggal'],
            ['status_kehadiran', 'keterangan', 'id_penginput_manual']
        );

        return redirect()->route('guru.absensi-siswa.index')->with('success', 'Absensi berhasil disimpan.');
    }
}
