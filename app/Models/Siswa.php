<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Siswa extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_siswa';
    protected $primaryKey = 'id_siswa';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_siswa',
        'nis',
        'nisn',
        'id_kelas',
        'nama_lengkap',
        'nama_panggilan',
        'foto_profil',
        'nik',
        'nomor_kk',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'agama',
        'alamat_lengkap',
        'status',
        'sidik_jari_template',
        'barcode_id',
        'id_pengguna',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['is_data_lengkap'];

    /**
     * Accessor untuk memeriksa kelengkapan data siswa.
     *
     * @return \Illuminate\Database\Eloquent\Casts\Attribute
     */
    protected function isDataLengkap(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                // Tentukan field mana saja yang wajib diisi
                $requiredFields = [
                    'nisn',
                    'nik',
                    'nomor_kk',
                    'tempat_lahir',
                    'tanggal_lahir',
                    'alamat_lengkap',
                ];

                foreach ($requiredFields as $field) {
                    // Jika ada satu saja field yang kosong, kembalikan false
                    if (empty($attributes[$field])) {
                        return false;
                    }
                }

                // Jika semua field terisi, kembalikan true
                return true;
            }
        );
    }

    /**
     * Relasi ke model Kelas.
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }
    public function orangTuaWali()
    {
        return $this->hasMany(OrangTuaWali::class, 'id_siswa', 'id_siswa');
    }
    public function absensi()
    {
        return $this->hasMany(AbsensiSiswa::class, 'id_siswa', 'id_siswa');
    }

    public function pengguna()
    {
        return $this->belongsTo(User::class, 'id_pengguna', 'id_pengguna');
    }
}
