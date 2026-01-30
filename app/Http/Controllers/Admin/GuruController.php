<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\User;
use App\Models\Kelas;
use App\Models\JadwalMengajar;
use App\Models\AbsensiGuru;
use App\Models\JurnalMengajar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GuruController extends Controller
{
    /**
     * Menampilkan daftar guru beserta statistik dan pencarian.
     */
    public function index(Request $request)
    {
        $stats = [
            'total' => Guru::count(),
            'aktif' => Guru::where('status', 'Aktif')->count(),
            'waliKelas' => Kelas::whereNotNull('id_wali_kelas')->distinct()->count('id_wali_kelas'),
            'sidikJari' => Guru::whereNotNull('sidik_jari_template')->count(),
        ];

        $gurus = Guru::with(['pengguna', 'kelasWali'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('id_guru', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // Tambahkan URL foto helper (opsional, jika frontend butuh path lengkap)
        $gurus->through(function ($guru) {
            $guru->foto_url = $guru->foto_profil ? asset('storage/' . $guru->foto_profil) : null;
            return $guru;
        });

        return Inertia::render('admin/Guru/Index', [
            'gurus' => $gurus,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Menampilkan halaman detail seorang guru dengan data untuk tab.
     */
    public function show(Guru $guru)
    {
        $guru->load(['pengguna', 'kelasWali']);

        // Data Tab Jadwal
        $jadwalMengajar = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->with(['kelas', 'mataPelajaran', 'tahunAjaran'])
            ->get()
            ->groupBy('hari');

        // Data Tab Riwayat Absen
        $riwayatAbsensi = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->latest('tanggal')
            ->take(15)
            ->get();

        // Data Tab Jurnal
        $jurnalMengajar = JurnalMengajar::whereHas('jadwalMengajar', function ($query) use ($guru) {
            $query->where('id_guru', $guru->id_guru);
        })
            ->with(['jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran'])
            ->latest('tanggal')
            ->take(15)
            ->get();

        return Inertia::render('admin/Guru/Show', [
            'guru' => $guru,
            'jadwalMengajar' => $jadwalMengajar,
            'riwayatAbsensi' => $riwayatAbsensi,
            'jurnalMengajar' => $jurnalMengajar,
        ]);
    }

    /**
     * Menampilkan form untuk menambah data guru baru.
     */
    public function create()
    {
        // Tidak perlu mengambil list user lagi karena user akan dibuat otomatis
        return Inertia::render('admin/Guru/Create');
    }

    /**
     * Menyimpan data guru baru ke dalam database + Auto Create User.
     */
    public function store(Request $request)
    {
        // Validasi Input Guru
        $validated = $request->validate([
            'id_guru' => 'required|string|max:20|unique:tbl_guru',
            'nama_lengkap' => 'required|string|max:100',
            'nip' => 'nullable|string|max:30|unique:tbl_guru',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'status' => 'required|in:Aktif,Tidak Aktif,Pensiun',
            'foto_profil' => 'nullable|image|max:2048',
            'barcode_id' => 'nullable|string|max:100|unique:tbl_guru',
            'sidik_jari_template' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $validated) {
            // 1. GENERATE USERNAME OTOMATIS
            // Format: guru#[nama_tanpa_spasi_lowercase]
            $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $validated['nama_lengkap']));
            $baseUsername = 'guru#' . $cleanName;
            
            // Cek keunikan username, jika ada tambah random string
            $username = $baseUsername;
            if (User::where('username', $username)->exists()) {
                $username = $baseUsername . Str::lower(Str::random(3));
            }

            // 2. BUAT AKUN USER
            $user = User::create([
                'nama_lengkap' => $validated['nama_lengkap'],
                'username'     => $username,
                'password'     => Hash::make('alhawari#cibiuk'), // Default Password
                'level'        => 'Guru',
            ]);

            // 3. HUBUNGKAN ID PENGGUNA KE DATA GURU
            $validated['id_pengguna'] = $user->id_pengguna;

            // 4. UPLOAD FOTO (Jika ada)
            if ($request->hasFile('foto_profil')) {
                $path = $request->file('foto_profil')->store('foto_profil_guru', 'public');
                $validated['foto_profil'] = $path;
            }

            // 5. SIMPAN DATA GURU
            Guru::create($validated);
        });

        return to_route('admin.guru.index')->with('success', 'Data Guru berhasil ditambahkan. Akun login telah dibuat otomatis.');
    }

    /**
     * Menampilkan form untuk mengedit data guru.
     */
    public function edit(Guru $guru)
    {
        return Inertia::render('admin/Guru/Edit', [
            'guru' => $guru->load('pengguna'),
        ]);
    }

    /**
     * Memperbarui data guru di dalam database.
     */
    public function update(Request $request, Guru $guru)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:100',
            'nip' => ['nullable', 'string', 'max:30', Rule::unique('tbl_guru')->ignore($guru->id_guru, 'id_guru')],
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'status' => 'required|in:Aktif,Tidak Aktif,Pensiun',
            'barcode_id' => ['nullable', 'string', 'max:100', Rule::unique('tbl_guru')->ignore($guru->id_guru, 'id_guru')],
            'sidik_jari_template' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $guru, $validated) {
            // Handle Update Foto
            if ($request->hasFile('foto_profil')) {
                $request->validate(['foto_profil' => 'nullable|image|max:2048']);

                // Hapus foto lama jika ada
                if ($guru->foto_profil && Storage::disk('public')->exists($guru->foto_profil)) {
                    Storage::disk('public')->delete($guru->foto_profil);
                }
                
                $path = $request->file('foto_profil')->store('foto_profil_guru', 'public');
                $validated['foto_profil'] = $path;
            }

            // Update Data Guru
            $guru->update($validated);

            // Sinkronisasi Nama Lengkap ke Tabel User
            if ($guru->pengguna) {
                $guru->pengguna->update([
                    'nama_lengkap' => $validated['nama_lengkap']
                ]);
            }
        });

        return to_route('admin.guru.index')->with('success', 'Data Guru berhasil diperbarui.');
    }

    /**
     * Menghapus data guru beserta akun user dan fotonya.
     */
    public function destroy(Guru $guru)
    {
        DB::transaction(function () use ($guru) {
            // 1. Hapus Foto Fisik
            if ($guru->foto_profil && Storage::disk('public')->exists($guru->foto_profil)) {
                Storage::disk('public')->delete($guru->foto_profil);
            }

            // 2. Ambil Referensi User
            $user = $guru->pengguna;

            // 3. Hapus Data Guru
            $guru->delete();

            // 4. Hapus Akun User (Hanya jika levelnya Guru untuk keamanan)
            if ($user && $user->level === 'Guru') {
                $user->delete();
            }
        });

        return to_route('admin.guru.index')->with('success', 'Data Guru dan akun terkait berhasil dihapus.');
    }

    /*
    |--------------------------------------------------------------------------
    | FITUR RESET PASSWORD (KHUSUS ADMIN)
    |--------------------------------------------------------------------------
    */

    /**
     * Menampilkan halaman khusus reset password guru.
     */
    public function resetPasswordIndex(Request $request)
    {
        $gurus = Guru::with('pengguna')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('id_guru', 'like', "%{$search}%");
            })
            ->whereNotNull('id_pengguna') // Hanya guru yang punya akun
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Guru/ResetPassword', [
            'gurus' => $gurus,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Memproses reset password ke default.
     * Default: Username = guru#[nama], Password = alhawari#cibiuk
     */
    public function resetPasswordStore(Guru $guru)
    {
        if (!$guru->pengguna) {
            return back()->with('error', 'Guru ini tidak memiliki akun pengguna yang terhubung.');
        }

        try {
            // Generate Username Default Baru
            $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $guru->nama_lengkap));
            $newUsername = 'guru#' . $cleanName;

            // Pastikan username unik (kecuali milik user ini sendiri)
            $exists = User::where('username', $newUsername)
                ->where('id_pengguna', '!=', $guru->id_pengguna)
                ->exists();
            
            if ($exists) {
                $newUsername = $newUsername . Str::lower(Str::random(3));
            }

            // Update User
            $guru->pengguna->update([
                'username' => $newUsername,
                'password' => Hash::make('alhawari#cibiuk'),
            ]);

            return back()->with('success', "Akun berhasil direset. Username: {$newUsername}, Password: alhawari#cibiuk");

        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal mereset password: ' . $e->getMessage());
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FITUR TAMBAHAN (API / AJAX)
    |--------------------------------------------------------------------------
    */

    /**
     * Menyimpan template sidik jari dari mesin fingerprint.
     */
    public function registerFingerprint(Request $request, Guru $guru)
    {
        $request->validate(['sidik_jari_template' => 'required|string']);
        
        $guru->update([
            'sidik_jari_template' => $request->sidik_jari_template
        ]);

        return back()->with('success', 'Sidik jari berhasil diregistrasi.');
    }

    /**
     * Generate ulang Barcode ID secara acak.
     */
    public function generateBarcode(Request $request, Guru $guru)
    {
        // Format: GURU-[ID]-[RANDOM]
        $newBarcodeId = 'GURU-' . $guru->id_guru . '-' . strtoupper(Str::random(6));
        
        $guru->update([
            'barcode_id' => $newBarcodeId
        ]);

        return back()->with('success', 'Barcode ID baru berhasil dibuat.');
    }
}