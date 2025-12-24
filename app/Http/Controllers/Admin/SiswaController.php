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

        DB::transaction(function () use ($request, $validated) {
            // 1. Buat akun User baru untuk siswa
            $user = User::create([
                'nama_lengkap' => $validated['nama_lengkap'],
                'username' => $validated['nis'], // Username WAJIB menggunakan NIS
                'password' => Hash::make($validated['nis']), // Password default WAJIB NIS
                'level' => 'Siswa',
            ]);

            // 2. Tambahkan id_pengguna ke data siswa yang akan disimpan
            $validated['id_pengguna'] = $user->id_pengguna;

            if ($request->hasFile('foto_profil')) {
                $path = $request->file('foto_profil')->store('foto_profil_siswa', 'public');
                $validated['foto_profil'] = $path;
            }

            // 3. Buat data siswa
            Siswa::create($validated);
        });

        return to_route('admin.siswa.index')->with('message', 'Data Siswa berhasil ditambahkan beserta akun loginnya.');

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

        return Inertia::render('admin/Siswa/Show', [
            'siswa' => $siswa,
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
            'foto_profil' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',  // IMPROVED: Tambah mimes
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

        DB::transaction(function () use ($request, $siswa, $validated) {
            // DEBUG LOGGING
            Log::info('=== UPDATE SISWA START ===', [
                'siswa_id' => $siswa->id_siswa,
                'has_file' => $request->hasFile('foto_profil'),
                'request_files' => array_keys($request->allFiles()),
                'request_input_keys' => array_keys($request->all()),
            ]);

            // PROSES FOTO PROFIL
            if ($request->hasFile('foto_profil')) {
                try {
                    $file = $request->file('foto_profil');

                    Log::info('File details', [
                        'original_name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'is_valid' => $file->isValid(),
                    ]);

                    // Hapus foto lama jika ada
                    if ($siswa->foto_profil && Storage::disk('public')->exists($siswa->foto_profil)) {
                        Storage::disk('public')->delete($siswa->foto_profil);
                        Log::info('Old photo deleted', ['path' => $siswa->foto_profil]);
                    }

                    // Simpan foto baru dengan naming yang konsisten
                    $timestamp = now()->timestamp;
                    $filename = "siswa_{$siswa->id_siswa}_{$timestamp}." . $file->getClientOriginalExtension();
                    $path = $file->storeAs('foto_profil_siswa', $filename, 'public');

                    Log::info('New photo saved', [
                        'filename' => $filename,
                        'path' => $path,
                        'full_url' => asset("storage/{$path}"),
                    ]);

                    $validated['foto_profil'] = $path;

                } catch (\Exception $e) {
                    Log::error('File upload error', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    throw new \Exception('Gagal mengupload foto: ' . $e->getMessage());
                }
            } else {
                Log::info('No file uploaded, keeping existing photo');
            }

            // UPDATE DATA SISWA
            try {
                $siswa->update($validated);
                Log::info('Siswa data updated successfully', [
                    'siswa_id' => $siswa->id_siswa,
                    'foto_profil_in_db' => $siswa->foto_profil,
                ]);
            } catch (\Exception $e) {
                Log::error('Database update error', [
                    'error' => $e->getMessage(),
                    'siswa_id' => $siswa->id_siswa,
                ]);
                throw $e;
            }

            // SINKRONKAN USER DATA
            if ($siswa->pengguna) {
                $siswa->pengguna->update([
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'username' => $validated['nis'],
                ]);
                Log::info('User data synced');
            }

            Log::info('=== UPDATE SISWA END ===');
        });

        return to_route('admin.siswa.index')->with('message', 'Data Siswa berhasil diperbarui.');
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

        if ($request->input('generate_barcode') && empty($validated['barcode_id'])) {
            $validated['barcode_id'] = 'SISWA-' . Str::upper(Str::random(10));
        }

        $siswa->update($validated);

        return redirect()->route('admin.siswa.show', $siswa->id_siswa)
            ->with('message', 'Data keamanan berhasil diperbarui.');
    }

    /**
     * Membuat akun pengguna secara massal untuk siswa yang belum memilikinya.
     */
    public function generateMissingAccounts()
    {
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
            return back()->with('message', 'Semua siswa aktif sudah memiliki akun.');
        }

        $message = "Proses selesai. Berhasil membuat {$createdCount} akun baru.";
        if ($failedCount > 0) {
            $message .= " Gagal membuat {$failedCount} akun karena NIS sudah terdaftar sebagai username.";
        }

        return back()->with('message', $message);
    }

    /**
     * Menghapus data siswa dan akun pengguna yang terhubung.
     */
    public function destroy(Siswa $siswa)
    {
        DB::transaction(function () use ($siswa) {
            if ($siswa->foto_profil) {
                Storage::disk('public')->delete($siswa->foto_profil);
            }

            if ($siswa->pengguna) {
                $siswa->pengguna->delete();
            }

            $siswa->delete();
        });

        return to_route('admin.siswa.index')->with('message', 'Data Siswa dan akun loginnya berhasil dihapus.');
    }
}