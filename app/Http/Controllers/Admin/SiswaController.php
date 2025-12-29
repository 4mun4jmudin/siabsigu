<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\OrangTuaWali;
use App\Models\AbsensiSiswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class SiswaController extends Controller
{
    /**
     * Menampilkan halaman daftar siswa dengan filter dan paginasi.
     */
    public function index(Request $request)
    {
        $kelasOptions = Kelas::orderBy('tingkat')->get();

        $siswas = Siswa::with('kelas')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%");
            })
            ->when($request->input('kelas'), function ($query, $kelasId) {
                $query->where('id_kelas', $kelasId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // ✅ Tambahkan foto_url untuk setiap siswa
        $siswas->through(function ($s) {
            $s->foto_url = null;
            if ($s->foto_profil && Storage::disk('public')->exists($s->foto_profil)) {
                $s->foto_url = url('/storage-public/' . ltrim($s->foto_profil, '/'));
            }
            return $s;
        });

        return Inertia::render('admin/Siswa/Index', [
            'siswas' => $siswas,
            'kelasOptions' => $kelasOptions,
            'filters' => $request->only(['search', 'kelas']),
        ]);
    }

    /**
     * Menampilkan form untuk membuat data siswa baru.
     */
    public function create()
    {
        return Inertia::render('admin/Siswa/Create', [
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Menyimpan data siswa baru beserta akun pengguna yang terhubung secara otomatis.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_siswa' => 'required|string|max:20|unique:tbl_siswa',
            'nis' => 'required|string|max:30|unique:tbl_siswa|unique:tbl_pengguna,username',
            'nisn' => 'required|string|max:20|unique:tbl_siswa',
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|max:2048',
            'nik' => 'required|string|max:16|unique:tbl_siswa',
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => 'nullable|string|max:100|unique:tbl_siswa,barcode_id',
        ]);

        try {
            DB::transaction(function () use ($request, $validated) {
                $user = User::create([
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'username' => $validated['nis'],
                    'password' => Hash::make($validated['nis']),
                    'level' => 'Siswa',
                ]);

                $validated['id_pengguna'] = $user->id_pengguna;

                if ($request->hasFile('foto_profil')) {
                    $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
                    $validated['foto_profil'] = $path;
                }

                Siswa::create($validated);
            });

            return to_route('admin.siswa.index')
                ->with('success', 'Data Siswa berhasil ditambahkan beserta akun loginnya.');
        } catch (\Throwable $e) {
            Log::error('STORE SISWA ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->with('error', 'Gagal menambahkan siswa. Coba lagi.')
                ->withInput();
        }
    }

    /**
     * Menampilkan halaman detail untuk seorang siswa.
     */
    public function show(Siswa $siswa)
    {
        $siswa->load('kelas.waliKelas');

        $orangTuaWali = OrangTuaWali::where('id_siswa', $siswa->id_siswa)->get();

        $riwayatAbsensi = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->latest('tanggal')
            ->take(30)
            ->get();

        $fotoUrl = null;
        if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
            $fotoUrl = url('/storage-public/' . ltrim($siswa->foto_profil, '/'));
        }

        return Inertia::render('admin/Siswa/Show', [
            'siswa' => array_merge($siswa->toArray(), [
                'foto_url' => $fotoUrl,
            ]),
            'orangTuaWali' => $orangTuaWali,
            'riwayatAbsensi' => $riwayatAbsensi,
        ]);
    }

    /**
     * Menampilkan form untuk mengedit data siswa.
     */
    public function edit(Siswa $siswa)
    {
        return Inertia::render('admin/Siswa/Edit', [
            'siswa' => $siswa,
            'kelasOptions' => Kelas::orderBy('tingkat')->get(),
        ]);
    }

    /**
     * Memperbarui data siswa di database.
     */
    public function update(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'nis' => ['required', 'string', 'max:30', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nisn' => ['required', 'string', 'max:20', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'id_kelas' => 'required|exists:tbl_kelas,id_kelas',
            'nama_lengkap' => 'required|string|max:100',
            'nama_panggilan' => 'nullable|string|max:30',
            'foto_profil' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'nik' => ['required', 'string', 'max:16', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
            'nomor_kk' => 'required|string|max:16',
            'tempat_lahir' => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'agama' => 'required|string',
            'alamat_lengkap' => 'required|string',
            'status' => 'required|in:Aktif,Lulus,Pindah,Drop Out',
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa')->ignore($siswa->id_siswa, 'id_siswa')],
        ]);

        try {
            DB::transaction(function () use ($request, $siswa, $validated) {
                Log::info('=== UPDATE SISWA START ===', [
                    'siswa_id' => $siswa->id_siswa,
                    'has_file' => $request->hasFile('foto_profil'),
                    'request_files' => array_keys($request->allFiles()),
                    'request_input_keys' => array_keys($request->all()),
                ]);

                if ($request->hasFile('foto_profil')) {
                    $file = $request->file('foto_profil');

                    if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
                        Storage::disk('public')->delete($siswa->foto_profil);
                    }

                    $timestamp = now()->timestamp;
                    $filename = "siswa_{$siswa->id_siswa}_{$timestamp}." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('foto_profil_siswa', $filename, 'public');

                    $validated['foto_profil'] = $path;
                }

                $siswa->update($validated);

                if ($siswa->pengguna) {
                    $siswa->pengguna->update([
                        'nama_lengkap' => $validated['nama_lengkap'],
                        'username' => $validated['nis'],
                    ]);
                }

                Log::info('=== UPDATE SISWA END ===');
            });

            return to_route('admin.siswa.index')
                ->with('success', 'Data Siswa berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('UPDATE SISWA ERROR', [
                'siswa_id' => $siswa->id_siswa,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->with('error', 'Gagal memperbarui data siswa. Periksa input & coba lagi.')
                ->withInput();
        }
    }

    /**
     * Memperbarui data keamanan (barcode & sidik jari) untuk siswa.
     */
    public function updateKeamanan(Request $request, Siswa $siswa)
    {
        $validated = $request->validate([
            'sidik_jari_template' => 'nullable|string',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_siswa', 'barcode_id')->ignore($siswa->id_siswa, 'id_siswa')],
        ]);

        try {
            if ($request->input('generate_barcode') && empty($validated['barcode_id'])) {
                $validated['barcode_id'] = 'SISWA-' . Str::upper(Str::random(10));
            }

            $siswa->update($validated);

            return redirect()->route('admin.siswa.show', $siswa->id_siswa)
                ->with('success', 'Data keamanan berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('UPDATE KEAMANAN SISWA ERROR', [
                'siswa_id' => $siswa->id_siswa,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Gagal memperbarui data keamanan. Coba lagi.');
        }
    }

    /**
     * Membuat akun pengguna secara massal untuk siswa yang belum memilikinya.
     */
    public function generateMissingAccounts()
    {
        try {
            $studentsToProcess = Siswa::where('status', 'Aktif')
                ->whereNull('id_pengguna')
                ->get();

            $createdCount = 0;
            $failedCount = 0;

            foreach ($studentsToProcess as $siswa) {
                DB::transaction(function () use ($siswa, &$createdCount, &$failedCount) {
                    $userExists = User::where('username', $siswa->nis)->exists();

                    if ($userExists) {
                        $failedCount++;
                        return;
                    }

                    $user = User::create([
                        'nama_lengkap' => $siswa->nama_lengkap,
                        'username' => $siswa->nis,
                        'password' => Hash::make($siswa->nis),
                        'level' => 'Siswa',
                    ]);

                    $siswa->id_pengguna = $user->id_pengguna;
                    $siswa->save();

                    $createdCount++;
                });
            }

            if ($createdCount === 0 && $failedCount === 0) {
                return back()->with('success', 'Semua siswa aktif sudah memiliki akun.');
            }

            $message = "Proses selesai. Berhasil membuat {$createdCount} akun baru.";
            if ($failedCount > 0) {
                $message .= " Gagal membuat {$failedCount} akun karena NIS sudah terdaftar sebagai username.";
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('GENERATE ACCOUNT ERROR', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal membuat akun massal. Coba lagi.');
        }
    }

    /**
     * Menghapus data siswa dan akun pengguna yang terhubung.
     */
    public function destroy(Siswa $siswa)
    {
        try {
            DB::transaction(function () use ($siswa) {
                if ($siswa->foto_profil) {
                    Storage::disk('public')->delete($siswa->foto_profil);
                }

                if ($siswa->pengguna) {
                    $siswa->pengguna->delete();
                }

                $siswa->delete();
            });

            return redirect()->back(303)
                ->with('success', 'Data Siswa berhasil ditambahkan beserta akun loginnya.');
        } catch (\Throwable $e) {
            Log::error('STORE SISWA ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan siswa. Coba lagi.')
                ->withInput();
        }
    }
}
