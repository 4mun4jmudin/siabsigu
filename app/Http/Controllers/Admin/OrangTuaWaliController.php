<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrangTuaWali;
use App\Models\Siswa;
use App\Models\User;
use App\Models\AbsensiSiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Illuminate\Support\Str;

class OrangTuaWaliController extends Controller
{
    /**
     * Menampilkan halaman daftar orang tua/wali dengan statistik.
     */
    public function index(Request $request)
    {
        $stats = [
            'total' => OrangTuaWali::count(),
            'ayah' => OrangTuaWali::where('hubungan', 'Ayah')->count(),
            'ibu' => OrangTuaWali::where('hubungan', 'Ibu')->count(),
            'wali' => OrangTuaWali::where('hubungan', 'Wali')->count(),
        ];

        $waliList = OrangTuaWali::with(['siswa.kelas', 'pengguna'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('no_telepon_wa', 'like', "%{$search}%")
                    ->orWhereHas('siswa', function ($q) use ($search) {
                        $q->where('nama_lengkap', 'like', "%{$search}%");
                    });
            })
            ->when($request->input('hubungan'), function ($query, $hubungan) {
                $query->where('hubungan', $hubungan);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/OrangTuaWali/Index', [
            'waliList' => $waliList,
            'stats' => $stats,
            'filters' => $request->only(['search', 'hubungan']),
        ]);
    }

    /**
     * Menampilkan form untuk menambah data orang tua/wali baru.
     */
    public function create()
    {
        $siswaOptions = Siswa::whereDoesntHave('orangTuaWali')->where('status', 'Aktif')->get();

        return Inertia::render('admin/OrangTuaWali/Create', [
            'siswaOptions' => $siswaOptions,
        ]);
    }

    /**
     * Menyimpan data orang tua/wali baru beserta akun penggunanya.
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_siswa' => 'required|exists:tbl_siswa,id_siswa|unique:tbl_orang_tua_wali,id_siswa',
            'nama_lengkap' => 'required|string|max:100',
            'hubungan' => 'required|string|in:Ayah,Ibu,Wali',
            'no_telepon_wa' => 'required|string|max:20',
            'nik' => 'nullable|string|size:16|unique:tbl_orang_tua_wali,nik',
            'tanggal_lahir' => 'nullable|date',
            'pendidikan_terakhir' => 'nullable|string',
            'pekerjaan' => 'nullable|string|max:50',
            'penghasilan_bulanan' => 'nullable|string',
            'username' => 'required|string|max:50|unique:tbl_pengguna,username',
            'email' => 'nullable|string|email|max:255|unique:tbl_pengguna,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'nama_lengkap' => $request->nama_lengkap,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'level' => 'Orang Tua',
            ]);

            OrangTuaWali::create([
                'id_wali' => 'W' . time(),
                'id_siswa' => $request->id_siswa,
                'id_pengguna' => $user->id_pengguna,
                'nama_lengkap' => $request->nama_lengkap,
                'hubungan' => $request->hubungan,
                'nik' => $request->nik,
                'tanggal_lahir' => $request->tanggal_lahir,
                'pendidikan_terakhir' => $request->pendidikan_terakhir,
                'pekerjaan' => $request->pekerjaan,
                'penghasilan_bulanan' => $request->penghasilan_bulanan,
                'no_telepon_wa' => $request->no_telepon_wa,
            ]);
        });

        return to_route('orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil ditambahkan.');
    }

    /**
     * Menampilkan halaman detail lengkap untuk satu orang tua/wali.
     */
    public function show(OrangTuaWali $orangTuaWali)
    {
        $orangTuaWali->load(['siswa.kelas', 'pengguna']);
        $absensiSiswa = AbsensiSiswa::where('id_siswa', $orangTuaWali->id_siswa)
            ->latest('tanggal')
            ->take(5)
            ->get();

        return Inertia::render('admin/OrangTuaWali/Show', [
            'wali' => $orangTuaWali,
            'absensiSiswa' => $absensiSiswa,
        ]);
    }

    /**
     * Menampilkan form untuk mengedit data orang tua/wali.
     */
    public function edit(OrangTuaWali $orangTuaWali)
    {
        $orangTuaWali->load('pengguna');
        $siswaOptions = Siswa::where('status', 'Aktif')
            ->where(function ($query) use ($orangTuaWali) {
                $query->whereDoesntHave('orangTuaWali')
                      ->orWhere('id_siswa', $orangTuaWali->id_siswa);
            })->get();

        return Inertia::render('admin/OrangTuaWali/Edit', [
            'wali' => $orangTuaWali,
            'siswaOptions' => $siswaOptions,
        ]);
    }

    /**
     * Memperbarui data orang tua/wali di database.
     */
    public function update(Request $request, OrangTuaWali $orangTuaWali)
    {
        $user = $orangTuaWali->pengguna;
        $userId = $user ? $user->id_pengguna : null;

        $request->validate([
            'id_siswa' => ['required', 'exists:tbl_siswa,id_siswa', Rule::unique('tbl_orang_tua_wali')->ignore($orangTuaWali->id_wali, 'id_wali')],
            'nama_lengkap' => 'required|string|max:100',
            'hubungan' => 'required|string|in:Ayah,Ibu,Wali',
            'no_telepon_wa' => 'required|string|max:20',
            'nik' => ['nullable', 'string', 'size:16', Rule::unique('tbl_orang_tua_wali')->ignore($orangTuaWali->id_wali, 'id_wali')],
            'tanggal_lahir' => 'nullable|date',
            'pendidikan_terakhir' => 'nullable|string',
            'pekerjaan' => 'nullable|string|max:50',
            'penghasilan_bulanan' => 'nullable|string',
            'username' => ['required', 'string', 'max:50', Rule::unique('tbl_pengguna')->ignore($userId, 'id_pengguna')],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('tbl_pengguna')->ignore($userId, 'id_pengguna')],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        DB::transaction(function () use ($request, $orangTuaWali, $user) {
            $orangTuaWali->update($request->except(['username', 'email', 'password', 'password_confirmation']));

            if ($user) {
                $user->nama_lengkap = $request->nama_lengkap;
                $user->username = $request->username;
                $user->email = $request->email;
                if ($request->filled('password')) {
                    $user->password = Hash::make($request->password);
                }
                $user->save();
            } else {
                $newUser = User::create([
                    'nama_lengkap' => $request->nama_lengkap,
                    'username' => $request->username,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'level' => 'Orang Tua',
                ]);
                $orangTuaWali->id_pengguna = $newUser->id_pengguna;
                $orangTuaWali->save();
            }
        });

        return to_route('orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil diperbarui.');
    }

    /**
     * Mereset password untuk akun orang tua/wali.
     */
    public function resetPassword(Request $request, OrangTuaWali $orangTuaWali)
    {
        $user = $orangTuaWali->pengguna;

        if (!$user) {
            return back()->with('error', 'Wali ini tidak memiliki akun login untuk direset.');
        }

        // Generate password acak baru (8 karakter)
        $newPassword = Str::random(8);

        // Update password pengguna
        $user->password = Hash::make($newPassword);
        $user->save();

        // Kirim password baru ke frontend melalui flash session agar bisa ditampilkan di modal
        return back()->with([
            'success' => 'Password berhasil direset!',
            'new_password' => $newPassword
        ]);
    }

    /**
     * Menghapus data orang tua/wali beserta akun penggunanya.
     */
    public function destroy(OrangTuaWali $orangTuaWali)
    {
        DB::transaction(function () use ($orangTuaWali) {
            $user = $orangTuaWali->pengguna;
            
            $orangTuaWali->delete();

            if ($user) {
                $user->delete();
            }
        });

        return to_route('orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil dihapus.');
    }
}
