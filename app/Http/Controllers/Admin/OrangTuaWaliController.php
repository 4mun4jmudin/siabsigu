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
    // ... [Method index, create, store, show, edit, update biarkan seperti semula] ...
    // Agar file tidak kepanjangan, saya tulis ulang method INDEX sampai UPDATE sama persis, 
    // FOKUS PERUBAHAN ada di method resetPasswordIndex dan resetPasswordStore di bawah.

    public function index(Request $request)
    {
        // ... (Kode Index kamu yg lama tetap dipakai)
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

    public function create()
    {
        $siswaOptions = Siswa::whereDoesntHave('orangTuaWali')->where('status', 'Aktif')->get();
        return Inertia::render('admin/OrangTuaWali/Create', ['siswaOptions' => $siswaOptions]);
    }

    public function store(Request $request)
    {
        // ... (Logic store kamu yg lama)
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
        return to_route('admin.orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil ditambahkan.');
    }

    public function show(OrangTuaWali $orangTuaWali)
    {
        $orangTuaWali->load(['siswa.kelas', 'pengguna']);
        $absensiSiswa = AbsensiSiswa::where('id_siswa', $orangTuaWali->id_siswa)
            ->latest('tanggal')
            ->take(5)
            ->get();
        return Inertia::render('admin/OrangTuaWali/Show', ['wali' => $orangTuaWali, 'absensiSiswa' => $absensiSiswa]);
    }

    public function edit(OrangTuaWali $orangTuaWali)
    {
        $orangTuaWali->load('pengguna');
        $siswaOptions = Siswa::where('status', 'Aktif')
            ->where(function ($query) use ($orangTuaWali) {
                $query->whereDoesntHave('orangTuaWali')->orWhere('id_siswa', $orangTuaWali->id_siswa);
            })->get();
        return Inertia::render('admin/OrangTuaWali/Edit', ['wali' => $orangTuaWali, 'siswaOptions' => $siswaOptions]);
    }

    public function update(Request $request, OrangTuaWali $orangTuaWali)
    {
        // ... (Logic update kamu yg lama)
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
        return to_route('admin.orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil diperbarui.');
    }

    public function destroy(OrangTuaWali $orangTuaWali)
    {
        // ... (Logic destroy kamu yg lama)
        DB::transaction(function () use ($orangTuaWali) {
            $user = $orangTuaWali->pengguna;
            $orangTuaWali->delete();
            if ($user) { $user->delete(); }
        });
        return to_route('admin.orang-tua-wali.index')->with('success', 'Data Orang Tua/Wali berhasil dihapus.');
    }

    /**
     * [BARU] Menampilkan halaman khusus Reset Password Orang Tua.
     */
    public function resetPasswordIndex(Request $request)
    {
        $walis = OrangTuaWali::with(['siswa', 'pengguna'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('nama_lengkap', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhereHas('siswa', function ($q) use ($search) {
                        $q->where('nama_lengkap', 'like', "%{$search}%");
                    });
            })
            // Hanya tampilkan yang punya akun untuk direset
            ->whereNotNull('id_pengguna')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/OrangTuaWali/ResetPassword', [
            'walis' => $walis,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * [MODIFIKASI] Reset password default: Username=NIK, Pass="alhawari#cibiuk"
     */
    public function resetPasswordStore(OrangTuaWali $orangTuaWali)
    {
        try {
            if (!$orangTuaWali->pengguna) {
                return back()->with('error', 'Wali ini belum memiliki akun pengguna.');
            }

            if (empty($orangTuaWali->nik)) {
                return back()->with('error', 'Gagal reset: NIK Orang Tua kosong. Harap lengkapi data NIK terlebih dahulu.');
            }

            // Pastikan NIK unik di tabel pengguna jika username diubah
            // Kecuali username dia sendiri yang sudah NIK
            $existingUser = User::where('username', $orangTuaWali->nik)
                ->where('id_pengguna', '!=', $orangTuaWali->id_pengguna)
                ->first();
            
            if ($existingUser) {
                return back()->with('error', 'Gagal reset: NIK ini sudah digunakan sebagai username oleh akun lain.');
            }

            // Update user: Username jadi NIK, Password jadi default
            $orangTuaWali->pengguna->update([
                'username' => $orangTuaWali->nik,
                'password' => Hash::make('alhawari#cibiuk'),
            ]);

            return back()->with('success', "Akun Wali {$orangTuaWali->nama_lengkap} berhasil direset. Username: {$orangTuaWali->nik}, Password: alhawari#cibiuk");

        } catch (\Throwable $e) {
            return back()->with('error', 'Terjadi kesalahan saat mereset password: ' . $e->getMessage());
        }
    }
}