<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\JurnalMengajar;
use App\Models\JadwalMengajar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Models\AbsensiGuru;

class JurnalMengajarController extends Controller
{
    /**
     * Menampilkan daftar jurnal mengajar milik guru yang sedang login.
     */
    public function index(Request $request)
    {
        $guru = Auth::user()->guru;

        $jurnals = JurnalMengajar::whereHas('jadwalMengajar', function ($query) use ($guru) {
            $query->where('id_guru', $guru->id_guru);
        })
            ->with(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'guruPengganti'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('materi_pembahasan', 'like', "%{$search}%")
                    ->orWhereHas('jadwalMengajar.kelas', fn($q) => $q->where('tingkat', 'like', "%{$search}%")->orWhere('jurusan', 'like', "%{$search}%"));
            })
            ->latest('tanggal')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Guru/Jurnal/Index', [
            'jurnals' => $jurnals,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Menampilkan form untuk membuat jurnal mengajar baru.
     */
    public function create()
    {
        $guru = Auth::user()->guru;

        // Hanya tampilkan jadwal milik guru itu sendiri
        $jadwalOptions = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran'])
            ->get();

        $absensiHariIni = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', today())
            ->first();

        return Inertia::render('Guru/Jurnal/Create', [
            'jadwalOptions' => $jadwalOptions,
            'absensiHariIni' => $absensiHariIni,
        ]);
    }

    /**
     * Menyimpan jurnal mengajar baru.
     */
    public function store(Request $request)
    {
        $guru = Auth::user()->guru;
        $tanggal_jurnal = Carbon::parse($request->input('tanggal'));

        // 1. Validasi Batas Waktu Pengisian (Anti-Manipulasi Timestamp)
        // Batasan bisa diubah (misal: 7 hari) atau diambil dari tabel pengaturan
        if ($tanggal_jurnal->isPast() && $tanggal_jurnal->diffInDays(now()) > 3) {
            return back()->withErrors([
                'tanggal' => 'Pengisian jurnal tidak dapat dilakukan lebih dari 3 hari yang lalu.'
            ])->withInput();
        }

        // 2. Validasi Silang dengan Absensi (Anti-Kecurangan)
        $absensi_guru = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $tanggal_jurnal->toDateString())
            ->first();

        // Jika guru tercatat tidak hadir (Sakit, Izin, Alfa)
        if ($absensi_guru && in_array($absensi_guru->status_kehadiran, ['Sakit', 'Izin', 'Alfa'])) {
            // Dan dia mencoba mengisi jurnal seolah-olah mengajar
            if ($request->input('status_mengajar') === 'Mengajar') {
                return back()->withErrors([
                    'status_mengajar' => 'Tidak dapat mengisi jurnal "Mengajar" karena status kehadiran Anda pada tanggal ini adalah "'.$absensi_guru->status_kehadiran.'".'
                ])->withInput();
            }
        }

        // 3. Validasi Data Form
        $validated = $request->validate([
            'id_jadwal' => [
                'required',
                'string',
                Rule::exists('tbl_jadwal_mengajar', 'id_jadwal')->where('id_guru', $guru->id_guru),
            ],
            'tanggal' => 'required|date',
            'jam_masuk_kelas' => 'required|date_format:H:i',
            'jam_keluar_kelas' => 'required|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Kosong'])],
            'materi_pembahasan' => 'required|string|min:10', // Minimal 10 karakter
            'alasan_tidak_mengajar' => 'nullable|string|max:255',
        ]);

        $id_jurnal = 'JRN-' . now()->format('ymdHis') . rand(10, 99);
        
        JurnalMengajar::create(array_merge($validated, [
            'id_jurnal' => $id_jurnal,
            'id_penginput_manual' => Auth::id(),
        ]));

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal mengajar berhasil ditambahkan.');
    }

    /**
     * Menampilkan detail satu jurnal mengajar.
     *
     * @param  \App\Models\JurnalMengajar  $jurnal
     * @return \Inertia\Response
     */

    public function show(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        // Keamanan: Pastikan jurnal yang diakses adalah milik guru yang login
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            // ALIHKAN KEMBALI DENGAN PESAN ERROR, BUKAN ABORT
            return redirect()->route('guru.jurnal.index')->with('error', 'Anda tidak memiliki hak untuk melihat detail jurnal ini.');
        }

        // Load relasi yang dibutuhkan untuk ditampilkan di halaman detail
        $jurnal->load(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'guruPengganti']);

        return Inertia::render('Guru/Jurnal/Show', [
            'jurnal' => $jurnal,
        ]);
    }

    public function edit(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        // Keamanan: Pastikan jurnal ini milik guru yang sedang login
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            return redirect()->route('guru.jurnal.index')->with('error', 'Akses ditolak.');
        }

        $jurnal->load(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran']);

        // Ambil hanya jadwal milik guru ini untuk opsi di form
        $jadwalOptions = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran'])
            ->get();

        return Inertia::render('Guru/Jurnal/Edit', [
            'jurnal' => $jurnal,
            'jadwalOptions' => $jadwalOptions,
        ]);
    }

    /**
     * Memperbarui data jurnal mengajar di database.
     */
    public function update(Request $request, JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;
        $tanggal_jurnal = Carbon::parse($request->input('tanggal'));

        // Keamanan: Pastikan jurnal ini milik guru yang sedang login
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            abort(403, 'AKSES DITOLAK');
        }
        
        // Validasi Batas Waktu untuk Edit
        if ($tanggal_jurnal->isPast() && $tanggal_jurnal->diffInDays(now()) > 3) {
            return back()->withErrors([
                'tanggal' => 'Jurnal yang sudah lebih dari 3 hari tidak dapat diubah lagi.'
            ])->withInput();
        }

        $validated = $request->validate([
            'id_jadwal' => [
                'required',
                'string',
                Rule::exists('tbl_jadwal_mengajar', 'id_jadwal')->where('id_guru', $guru->id_guru),
            ],
            'tanggal' => 'required|date',
            'jam_masuk_kelas' => 'required|date_format:H:i',
            'jam_keluar_kelas' => 'required|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Kosong'])],
            'materi_pembahasan' => 'required|string|min:10',
            'alasan_tidak_mengajar' => 'nullable|string|max:255',
        ]);

        // Catat jejak digital sebelum update
        $jurnal->update(array_merge($validated, [
            'id_editor' => Auth::id(),
            'terakhir_diedit_pada' => now(),
        ]));

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal berhasil diperbarui.');
    }

    /**
     * Menghapus data jurnal mengajar dari database.
     */
    public function destroy(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        // Keamanan: Pastikan jurnal ini milik guru yang sedang login
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            abort(403);
        }

        $jurnal->delete();

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal berhasil dihapus.');
    }

    public function storeQuickEntry(Request $request)
    {
        $guru = Auth::user()->guru;

        $validated = $request->validate([
            'id_jadwal' => [
                'required',
                Rule::exists('tbl_jadwal_mengajar', 'id_jadwal')->where('id_guru', $guru->id_guru)
            ],
            'status_mengajar' => ['required', Rule::in(['Tugas', 'Kosong'])],
            'alasan' => 'required|string|max:255',
        ]);

        $jadwal = JadwalMengajar::find($validated['id_jadwal']);

        // Cek apakah jurnal untuk jadwal ini sudah ada
        $existingJurnal = JurnalMengajar::where('id_jadwal', $validated['id_jadwal'])
            ->whereDate('tanggal', today())
            ->first();

        if ($existingJurnal) {
            return back()->with('error', 'Jurnal untuk jadwal ini sudah diisi sebelumnya.');
        }

        JurnalMengajar::create([
            'id_jurnal' => 'JRN-' . now()->format('ymdHis') . rand(10, 99),
            'id_jadwal' => $validated['id_jadwal'],
            'tanggal' => today(),
            'jam_masuk_kelas' => $jadwal->jam_mulai,
            'jam_keluar_kelas' => $jadwal->jam_selesai,
            'status_mengajar' => $validated['status_mengajar'],
            'materi_pembahasan' => 'Kelas diberi ' . strtolower($validated['status_mengajar']) . ' karena guru berhalangan.',
            'alasan_tidak_mengajar' => $validated['alasan'],
            'id_penginput_manual' => Auth::id(),
        ]);

        return back()->with('success', 'Status kelas berhasil dicatat sebagai ' . $validated['status_mengajar']);
    }
}
