<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrangTuaProfileUpdateRequest;
use App\Models\Pengaturan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show()
    {
        /** @var User $user */
        $user = Auth::user();

        $orangTua = $user->orangTuaWali;
        abort_unless($orangTua, 404, 'Data profil tidak ditemukan.');

        $siswa = $orangTua->siswa()->with('kelas')->first();

        $orangTuaArr = $orangTua->toArray();
        $fotoOrtuPath = $orangTua->foto_profil;

        $orangTuaArr['foto_url'] = ($fotoOrtuPath && Storage::disk('public')->exists($fotoOrtuPath))
            ? url('/storage-public/' . ltrim($fotoOrtuPath, '/'))
            : null;

        $siswaArr = $siswa?->toArray();
        $fotoSiswaPath =
            $siswa?->foto_profil
            ?? $siswa?->foto
            ?? $siswa?->foto_siswa
            ?? null;

        if ($siswaArr) {
            $siswaArr['foto_url'] = ($fotoSiswaPath && Storage::disk('public')->exists($fotoSiswaPath))
                ? url('/storage-public/' . ltrim($fotoSiswaPath, '/'))
                : null;
        }

        return Inertia::render('OrangTua/Profile/Show', [
            'orangTua' => $orangTuaArr,
            'siswa' => $siswaArr ?: null,
            'account' => [
                'username' => $user->username ?? null,
                'email' => $user->email ?? null,
            ],
        ]);
    }

    public function update(OrangTuaProfileUpdateRequest $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $orangTua = $user->orangTuaWali;
        abort_unless($orangTua, 404, 'Data profil tidak ditemukan.');

        $request->validated();

        $orangTua->nama_lengkap = $request->input('nama_lengkap');
        $orangTua->no_telepon_wa = $request->input('no_telepon_wa');
        $orangTua->pekerjaan = $request->input('pekerjaan');
        $orangTua->pendidikan_terakhir = $request->input('pendidikan_terakhir');

        if ($request->hasFile('file_foto')) {
            if ($orangTua->foto_profil && Storage::disk('public')->exists($orangTua->foto_profil)) {
                Storage::disk('public')->delete($orangTua->foto_profil);
            }

            $path = $request->file('file_foto')->store('profil_orangtua', 'public');
            $orangTua->foto_profil = $path;
        }

        $orangTua->save();

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updateAccount(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $table = $user->getTable();
        $pk = $user->getKeyName();
        $id = $user->getKey();

        $validator = Validator::make($request->all(), [
            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                Rule::unique($table, 'username')->ignore($id, $pk),
            ],
            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique($table, 'email')->ignore($id, $pk),
            ],
        ], [
            'username.required' => 'Username wajib diisi.',
            'username.min' => 'Username minimal 4 karakter.',
            'username.unique' => 'Username sudah dipakai.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah dipakai.',
        ]);

        if ($validator->fails()) {
            $first = $validator->errors()->first() ?: 'Gagal memperbarui akun.';
            return back()
                ->withErrors($validator)
                ->with('error', $first)
                ->withInput();
        }

        $validated = $validator->validated();

        $user->username = $validated['username'];
        $user->email = $validated['email'] ?? null;
        $user->save();

        return back()->with('success', 'Akun berhasil diperbarui.');
    }

    public function updatePassword(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $pengaturan = Pengaturan::query()->first();
        $minLen = (int)($pengaturan?->password_min_length ?? 8);
        if ($minLen < 8) $minLen = 8;

        $requireUpper = (int)($pengaturan?->password_require_upper ?? 0) === 1;

        $rules = [
            'current_password' => ['required', 'string'],
            'password' => array_values(array_filter([
                'required',
                'string',
                "min:$minLen",
                'confirmed',
                $requireUpper ? 'regex:/[A-Z]/' : null,
            ])),
        ];

        $messages = [
            'current_password.required' => 'Password lama wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => "Password minimal {$minLen} karakter.",
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.regex' => 'Password harus mengandung minimal 1 huruf kapital (A-Z).',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            $first = $validator->errors()->first() ?: 'Gagal mengubah password.';
            return back()
                ->withErrors($validator)
                ->with('error', $first)
                ->withInput();
        }

        $data = $validator->validated();

        if (!Hash::check($data['current_password'], $user->password)) {
            return back()
                ->withErrors(['current_password' => 'Password lama salah.'])
                ->with('error', 'Password lama salah.');
        }

        $user->password = $data['password'];
        $user->save();

        return back()->with('success', 'Password berhasil diubah.');
    }

    public function account()
    {
        return $this->show();
    }
}
