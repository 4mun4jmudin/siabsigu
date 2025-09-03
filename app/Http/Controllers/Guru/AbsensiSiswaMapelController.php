<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswaMapel;
use App\Models\JadwalMengajar;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;

class AbsensiSiswaMapelController extends Controller
{
    /**
     * Menampilkan halaman untuk memilih jadwal absensi.
     * Ini adalah halaman tujuan dari menu navigasi.
     */
    public function index()
    {
        $guru = Auth::user()->guru;
        if (!$guru) {
            abort(403, 'Akses ditolak. Akun Anda tidak terdaftar sebagai guru.');
        }

        // Mengambil jadwal mengajar untuk hari ini
        Carbon::setLocale('id');
        $hariIni = Carbon::now()->translatedFormat('l');

        $jadwalHariIni = JadwalMengajar::with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai', 'asc')
            ->get();
        
        // Render halaman pemilihan jadwal
        return Inertia::render('Guru/Absensi/SelectJadwal', [
            'jadwalHariIni' => $jadwalHariIni,
        ]);
    }

    /**
     * Tampilkan halaman absensi untuk jadwal yang dipilih, lengkap dengan filter.
     */
    public function show(Request $request, $id_jadwal)
    {
        $user = Auth::user();
        $guru = $user->guru;
        if (!$guru) {
            abort(403, 'Akses ditolak - bukan guru.');
        }

        $jadwal = JadwalMengajar::with(['kelas', 'mataPelajaran'])->find($id_jadwal);
        if (!$jadwal || $jadwal->id_guru !== $guru->id_guru) {
            abort(403, 'Anda tidak memiliki izin untuk absensi pada jadwal ini.');
        }
        
        // Query dasar untuk siswa di kelas tersebut
        $query = Siswa::where('id_kelas', $jadwal->id_kelas)
            ->where('status', 'Aktif');

        // Terapkan filter pencarian nama jika ada
        if ($request->filled('search')) {
            $query->where('nama_lengkap', 'like', '%' . $request->input('search') . '%');
        }
        
        $siswaList = $query->orderBy('nama_lengkap')->get();

        // Ambil data absensi yang sudah ada untuk hari ini
        $today = today()->toDateString();
        $absensiHariIni = AbsensiSiswaMapel::where('id_jadwal', $jadwal->id_jadwal)
            ->whereDate('tanggal', $today)
            ->get()
            ->keyBy('id_siswa');

        return Inertia::render('Guru/Absensi/Index', [
            'jadwal' => $jadwal,
            'siswaList' => $siswaList,
            'absensiHariIni' => $absensiHariIni,
            'today' => $today,
            // Kirim kembali nilai filter agar bisa ditampilkan di form
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Simpan data absensi.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru;

        $validator = Validator::make($request->all(), [
            'id_jadwal' => 'required|string|exists:tbl_jadwal_mengajar,id_jadwal',
            'tanggal' => 'required|date',
            'entries' => 'required|array',
            'entries.*.id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            'entries.*.status_kehadiran' => 'nullable|string|in:Hadir,Sakit,Izin,Alfa', // Boleh kosong
            'entries.*.keterangan' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();
        $id_jadwal = $validated['id_jadwal'];
        $tanggal = $validated['tanggal'];
        $entries = $validated['entries'];

        $jadwal = JadwalMengajar::find($id_jadwal);
        if ($jadwal->id_guru !== $guru->id_guru) {
            return redirect()->back()->with('error', 'Anda tidak berwenang menyimpan absensi untuk jadwal ini.');
        }

        DB::beginTransaction();
        try {
            foreach ($entries as $row) {
                 // Lewati dan jangan simpan siswa yang statusnya belum diisi (kosong/null)
                if (empty($row['status_kehadiran'])) {
                    continue;
                }

                $id_absensi_mapel = 'AM-' . Carbon::parse($tanggal)->format('ymd') . '-' . $id_jadwal . '-' . $row['id_siswa'];

                AbsensiSiswaMapel::updateOrCreate(
                    [
                        'id_jadwal' => $id_jadwal,
                        'id_siswa'  => $row['id_siswa'],
                        'tanggal'   => $tanggal,
                    ],
                    [
                        'id_absensi_mapel'    => $id_absensi_mapel,
                        'jam_mulai'           => $jadwal->jam_mulai, // Otomatis dari jadwal
                        'jam_selesai'         => $jadwal->jam_selesai, // Otomatis dari jadwal
                        'status_kehadiran'    => $row['status_kehadiran'],
                        'keterangan'          => $row['keterangan'] ?? null,
                        'metode_absen'        => 'Manual',
                        'id_penginput_manual' => $user->id_pengguna,
                    ]
                );
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            // Baris ini bisa diaktifkan saat development untuk melihat error asli
            // return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage()); 
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan data absensi. Silakan coba lagi.');
        }
        return redirect()->back()->with('success', 'Absensi siswa berhasil disimpan.');
    }
}