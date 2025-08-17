<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Kelas extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_kelas';
    protected $primaryKey = 'id_kelas';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_kelas',
        'tingkat',
        'jurusan',
        'id_wali_kelas',
    ];

    // Relasi: Satu Kelas memiliki satu Wali Kelas (Guru)
    // =============================================================
    // TAMBAHKAN PROPERTI BARU INI
    // =============================================================
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['nama_lengkap'];


    // Relasi: Satu Kelas memiliki satu Wali Kelas (Guru)
    public function waliKelas()
    {
        return $this->belongsTo(Guru::class, 'id_wali_kelas', 'id_guru');
    }

    // Relasi: Satu Kelas memiliki banyak Siswa
    public function siswa()
    {
        return $this->hasMany(Siswa::class, 'id_kelas', 'id_kelas');
    }

    protected function namaLengkap(): Attribute
    {
        return Attribute::make(
            get: fn () => trim($this->tingkat . ' ' . $this->jurusan)
        );
    }
}
