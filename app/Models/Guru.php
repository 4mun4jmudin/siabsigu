<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guru extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_guru';
    protected $primaryKey = 'id_guru';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_guru',
        'nip',
        'nama_lengkap',
        'jenis_kelamin',
        'foto_profil',
        'sidik_jari_template',
        'barcode_id',
        'id_pengguna',
        'status',
    ];

    // Relasi: Satu Guru memiliki satu Akun Pengguna (User)
    public function pengguna()
    {
        return $this->belongsTo(User::class, 'id_pengguna', 'id_pengguna');
    }

    // Relasi: Satu Guru bisa menjadi wali satu kelas
    public function kelasWali()
    {
        return $this->hasMany(Kelas::class, 'id_wali_kelas', 'id_guru');
    }
    public function jadwalMengajar()
    {
        return $this->hasMany(JadwalMengajar::class, 'id_guru', 'id_guru');
    }
}
