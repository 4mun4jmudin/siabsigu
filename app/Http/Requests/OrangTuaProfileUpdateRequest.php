<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class OrangTuaProfileUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            // 'nullable' berarti boleh kosong, tapi jika diisi harus string
            'nama_lengkap' => 'nullable|string|max:100',
            'no_telepon_wa' => 'nullable|string|max:20',
            'pekerjaan' => 'nullable|string|max:50',
            'pendidikan_terakhir' => 'nullable|string|max:50',
            // 'file_foto' boleh kosong, tapi jika diisi harus gambar
            'file_foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Maks 2MB
        ];
    }
}