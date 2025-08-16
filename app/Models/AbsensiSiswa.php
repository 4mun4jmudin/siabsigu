<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbsensiSiswa extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_absensi_siswa';
    protected $primaryKey = 'id_absensi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_absensi',
        'id_siswa',
        'tanggal',
        'jam_masuk',
        'jam_pulang',
        'menit_keterlambatan',
        'status_kehadiran',
        'metode_absen',
        'keterangan',
        'id_penginput_manual'
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }
    public function penginputManual()
    {
        return $this->belongsTo(User::class, 'id_penginput_manual');
    }
}
