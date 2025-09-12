<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Nama tabel yang terhubung dengan model.
     *
     * @var string
     */
    protected $table = 'tbl_pengguna';

    /**
     * Primary key untuk model.
     *
     * @var string
     */
    protected $primaryKey = 'id_pengguna';


    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_lengkap',
        'username',
        'email',
        'password',
        'level',
    ];

    /**
     * Atribut yang harus disembunyikan saat serialisasi.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atribut yang harus di-cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relasi: Satu Pengguna bisa jadi satu Guru
    public function guru()
    {
        return $this->hasOne(Guru::class, 'id_pengguna', 'id_pengguna');
    }

    // Tambahkan di dalam class User
    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'id_pengguna', 'id_pengguna');
    }

    public function orangTuaWali()
    {
        // UBAH DARI hasMany MENJADI hasOne
        return $this->hasOne(OrangTuaWali::class, 'id_pengguna', 'id_pengguna');
    }
}
