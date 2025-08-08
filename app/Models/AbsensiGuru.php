<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbsensiGuru extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_absensi_guru';
    protected $primaryKey = 'id_absensi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_absensi',
        'id_guru',
        'tanggal',
        'jam_masuk',
        'jam_pulang',
        'status_kehadiran',
        'metode_absen',
        'keterangan',
        'id_penginput_manual'
    ];

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'id_guru');
    }
    public function penginputManual()
    {
        return $this->belongsTo(User::class, 'id_penginput_manual');
    }
}
