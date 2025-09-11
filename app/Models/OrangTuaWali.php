<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class OrangTuaWali extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_orang_tua_wali';
    protected $primaryKey = 'id_wali';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_wali',
        'id_siswa',
        'id_pengguna',
        'hubungan',
        'nama_lengkap',
        'nik',
        'tanggal_lahir',
        'pendidikan_terakhir',
        'pekerjaan',
        'penghasilan_bulanan',
        'no_telepon_wa',
        'foto_profil',
    ];

    // 4. Tambahkan appends untuk foto_url
    protected $appends = ['foto_url'];

    // 5. Tambahkan accessor untuk foto_url
    protected function fotoUrl(): Attribute
    {
        return Attribute::make(
            get: fn($value, $attributes) =>
            $attributes['foto_profil']
                ? Storage::url($attributes['foto_profil'])
                : null
        );
    }

    // Relasi: Ortu/Wali ini milik satu Siswa
    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    // Relasi: Ortu/Wali ini memiliki satu akun Pengguna
    public function pengguna()
    {
        return $this->belongsTo(User::class, 'id_pengguna', 'id_pengguna');
    }
}
