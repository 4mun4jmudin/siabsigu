<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\JurnalMengajar;
use App\Models\JadwalMengajar;
use App\Models\AbsensiGuru;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class JurnalMengajarController extends Controller
{
    /**
     * Tampilkan daftar jurnal milik guru yang login.
     */
    public function index(Request $request)
    {
        $guru = Auth::user()->guru;

        $jurnals = JurnalMengajar::whereHas('jadwalMengajar', function ($q) use ($guru) {
                $q->where('id_guru', $guru->id_guru);
            })
            ->with(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'guruPengganti'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('materi_pembahasan', 'like', "%{$search}%")
                      ->orWhereHas('jadwalMengajar.kelas', function ($q) use ($search) {
                          $q->where('tingkat', 'like', "%{$search}%")
                            ->orWhere('jurusan', 'like', "%{$search}%");
                      });
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
     * Tampilkan form create.
     */
    public function create()
    {
        $guru = Auth::user()->guru;

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
     * Simpan jurnal baru.
     */
    public function store(Request $request)
    {
        $guru = Auth::user()->guru;
        $tanggalInput = $request->input('tanggal');

        // Pastikan tanggal valid dulu
        try {
            $tanggal_jurnal = Carbon::parse($tanggalInput);
        } catch (\Exception $e) {
            return back()->withErrors(['tanggal' => 'Format tanggal tidak valid.'])->withInput();
        }

        // Cegah pengisian untuk tanggal yang akan datang
        if ($tanggal_jurnal->isFuture()) {
            return back()->withErrors(['tanggal' => 'Tidak dapat mengisi jurnal untuk tanggal yang akan datang.'])->withInput();
        }

        // 1) Batas waktu pengisian ke belakang (misal: tidak boleh lebih dari 3 hari)
        if ($tanggal_jurnal->isPast() && $tanggal_jurnal->diffInDays(now()) > 3) {
            return back()->withErrors([
                'tanggal' => 'Pengisian jurnal tidak dapat dilakukan lebih dari 3 hari yang lalu.'
            ])->withInput();
        }

        // 2) Cek absensi guru pada tanggal tersebut
        $absensi_guru = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $tanggal_jurnal->toDateString())
            ->first();

        if ($absensi_guru && in_array($absensi_guru->status_kehadiran, ['Sakit', 'Izin', 'Alfa']) && $request->input('status_mengajar') === 'Mengajar') {
            return back()->withErrors([
                'status_mengajar' => 'Tidak dapat mengisi jurnal "Mengajar" karena status kehadiran Anda pada tanggal ini adalah "' . $absensi_guru->status_kehadiran . '".'
            ])->withInput();
        }

        // 3) Validasi request (tambahkan rule before_or_equal:today)
        $validated = $request->validate([
            'id_jadwal' => [
                'required',
                'string',
                Rule::exists('tbl_jadwal_mengajar', 'id_jadwal')->where('id_guru', $guru->id_guru),
                // Unique rule agar id_jadwal + tanggal unik (abaikan soft deleted)
                Rule::unique('tbl_jurnal_mengajar')->where(function ($q) use ($request) {
                    return $q->where('tanggal', $request->tanggal)
                             ->whereNull('deleted_at');
                }),
            ],
            'tanggal' => 'required|date|before_or_equal:today',
            'jam_masuk_kelas' => 'required|date_format:H:i',
            'jam_keluar_kelas' => 'required|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Kosong', 'Digantikan'])],
            'id_guru_pengganti' => [
                Rule::requiredIf(fn() => $request->input('status_mengajar') === 'Digantikan'),
                'nullable',
                'string',
                Rule::exists('tbl_guru', 'id_guru'),
            ],
            'materi_pembahasan' => 'required|string|min:10',
            'alasan_tidak_mengajar' => 'nullable|string|max:255',
        ], [
            'id_jadwal.unique' => 'Jurnal untuk jadwal dan tanggal ini sudah pernah diisi sebelumnya.',
            'tanggal.before_or_equal' => 'Tanggal tidak boleh lebih dari hari ini.',
        ]);

        // Insert dengan TRANSAKSI + lockForUpdate untuk mencegah race condition
        DB::beginTransaction();
        try {
            // kunci baris yang relevan (cek eksistensi jurnal yang sama)
            $exists = JurnalMengajar::where('id_jadwal', $validated['id_jadwal'])
                ->whereDate('tanggal', $validated['tanggal'])
                ->whereNull('deleted_at')
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                DB::rollBack();
                return back()->withErrors(['id_jadwal' => 'Jurnal untuk jadwal dan tanggal ini sudah pernah diisi sebelumnya.'])->withInput();
            }

            $id_jurnal = 'JRN-' . now()->format('ymdHis') . rand(10, 99);

            JurnalMengajar::create(array_merge($validated, [
                'id_jurnal' => $id_jurnal,
                'id_penginput_manual' => Auth::id(),
            ]));

            DB::commit();
        } catch (QueryException $e) {
            DB::rollBack();

            // 1062 = duplicate entry (unique constraint)
            $errorCode = $e->errorInfo[1] ?? null;
            if ($errorCode == 1062) {
                return back()->withErrors(['id_jadwal' => 'Gagal menyimpan: jurnal untuk jadwal & tanggal tersebut sudah ada.'])->withInput();
            }

            // log error dan lempar lagi kalau bukan duplicate
            Log::error('Error menyimpan jurnal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error menyimpan jurnal: ' . $e->getMessage());
            throw $e;
        }

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal mengajar berhasil ditambahkan.');
    }

    /**
     * Menampilkan detail jurnal.
     */
    public function show(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        // Pastikan jurnal milik guru yang login
        if (! $jurnal->relationLoaded('jadwalMengajar')) {
            $jurnal->load('jadwalMengajar');
        }
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            return redirect()->route('guru.jurnal.index')->with('error', 'Anda tidak memiliki hak untuk melihat detail jurnal ini.');
        }

        $jurnal->load(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'guruPengganti']);

        return Inertia::render('Guru/Jurnal/Show', [
            'jurnal' => $jurnal,
        ]);
    }

    /**
     * Tampilkan form edit.
     */
    public function edit(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        if (! $jurnal->relationLoaded('jadwalMengajar')) {
            $jurnal->load('jadwalMengajar');
        }
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            return redirect()->route('guru.jurnal.index')->with('error', 'Akses ditolak.');
        }

        $jadwalOptions = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran'])
            ->get();

        $jurnal->load(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'guruPengganti']);

        return Inertia::render('Guru/Jurnal/Edit', [
            'jurnal' => $jurnal,
            'jadwalOptions' => $jadwalOptions,
        ]);
    }

    /**
     * Update jurnal.
     */
    public function update(Request $request, JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        if (! $jurnal->relationLoaded('jadwalMengajar')) {
            $jurnal->load('jadwalMengajar');
        }
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            abort(403, 'AKSES DITOLAK');
        }

        try {
            $tanggal_jurnal = Carbon::parse($request->input('tanggal'));
        } catch (\Exception $e) {
            return back()->withErrors(['tanggal' => 'Format tanggal tidak valid.'])->withInput();
        }

        // Cegah update menjadi tanggal yang akan datang
        if ($tanggal_jurnal->isFuture()) {
            return back()->withErrors(['tanggal' => 'Tidak dapat mengatur tanggal jurnal ke masa yang akan datang.'])->withInput();
        }

        // Batas waktu edit (misal: 3 hari)
        if ($tanggal_jurnal->isPast() && $tanggal_jurnal->diffInDays(now()) > 3) {
            return back()->withErrors(['tanggal' => 'Jurnal yang sudah lebih dari 3 hari tidak dapat diubah lagi.'])->withInput();
        }

        $validated = $request->validate([
            'id_jadwal' => [
                'required',
                'string',
                Rule::exists('tbl_jadwal_mengajar', 'id_jadwal')->where('id_guru', $guru->id_guru),
                // ignore current jurnal saat check unique
                Rule::unique('tbl_jurnal_mengajar')->where(function ($q) use ($request) {
                    return $q->where('tanggal', $request->tanggal)
                             ->whereNull('deleted_at');
                })->ignore($jurnal->id_jurnal, 'id_jurnal'),
            ],
            'tanggal' => 'required|date|before_or_equal:today',
            'jam_masuk_kelas' => 'required|date_format:H:i',
            'jam_keluar_kelas' => 'required|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Kosong', 'Digantikan'])],
            'id_guru_pengganti' => [
                Rule::requiredIf(fn() => $request->input('status_mengajar') === 'Digantikan'),
                'nullable',
                'string',
                Rule::exists('tbl_guru', 'id_guru'),
            ],
            'materi_pembahasan' => 'required|string|min:10',
            'alasan_tidak_mengajar' => 'nullable|string|max:255',
        ], [
            'id_jadwal.unique' => 'Jurnal untuk jadwal dan tanggal ini sudah pernah diisi sebelumnya.',
            'tanggal.before_or_equal' => 'Tanggal tidak boleh lebih dari hari ini.',
        ]);

        DB::beginTransaction();
        try {
            // lock existing potential conflict row
            $conflict = JurnalMengajar::where('id_jadwal', $validated['id_jadwal'])
                ->whereDate('tanggal', $validated['tanggal'])
                ->whereNull('deleted_at')
                ->lockForUpdate()
                ->first();

            // jika ada conflict dan bukan jurnal yang sedang diupdate -> stop
            if ($conflict && $conflict->id_jurnal !== $jurnal->id_jurnal) {
                DB::rollBack();
                return back()->withErrors(['id_jadwal' => 'Jurnal untuk jadwal dan tanggal ini sudah ada.'])->withInput();
            }

            $jurnal->update(array_merge($validated, [
                'id_editor' => Auth::id(),
                'terakhir_diedit_pada' => now(),
            ]));

            DB::commit();
        } catch (QueryException $e) {
            DB::rollBack();
            $errorCode = $e->errorInfo[1] ?? null;
            if ($errorCode == 1062) {
                return back()->withErrors(['id_jadwal' => 'Gagal menyimpan: jurnal untuk jadwal & tanggal tersebut sudah ada.'])->withInput();
            }
            Log::error('Error update jurnal: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error update jurnal: ' . $e->getMessage());
            throw $e;
        }

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal berhasil diperbarui.');
    }

    /**
     * Hapus jurnal (soft delete).
     */
    public function destroy(JurnalMengajar $jurnal)
    {
        $guru = Auth::user()->guru;

        if (! $jurnal->relationLoaded('jadwalMengajar')) {
            $jurnal->load('jadwalMengajar');
        }
        if ($jurnal->jadwalMengajar->id_guru !== $guru->id_guru) {
            abort(403);
        }

        $jurnal->delete();

        return redirect()->route('guru.jurnal.index')->with('success', 'Jurnal berhasil dihapus.');
    }

    /**
     * Buat entri cepat (quick entry) untuk status kelas (Tugas/Kosong).
     * (Quick entry menggunakan tanggal hari ini, jadi tidak perlu perubahan khusus.)
     */
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
        if (! $jadwal) {
            return back()->with('error', 'Jadwal tidak ditemukan.')->withInput();
        }

        DB::beginTransaction();
        try {
            $existingJurnal = JurnalMengajar::where('id_jadwal', $validated['id_jadwal'])
                ->whereDate('tanggal', today())
                ->whereNull('deleted_at')
                ->lockForUpdate()
                ->first();

            if ($existingJurnal) {
                DB::rollBack();
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

            DB::commit();
        } catch (QueryException $e) {
            DB::rollBack();
            $errorCode = $e->errorInfo[1] ?? null;
            if ($errorCode == 1062) {
                return back()->with('error', 'Gagal menyimpan: jurnal untuk jadwal & tanggal tersebut sudah ada.');
            }
            Log::error('Error storeQuickEntry: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error storeQuickEntry: ' . $e->getMessage());
            throw $e;
        }

        return back()->with('success', 'Status kelas berhasil dicatat sebagai ' . $validated['status_mengajar']);
    }
}
