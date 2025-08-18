<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class JadwalMengajar extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_jadwal_mengajar';
    protected $primaryKey = 'id_jadwal';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_jadwal',
        'id_tahun_ajaran',
        'id_guru',
        'id_kelas',
        'id_mapel',
        'hari',
        'jam_mulai',
        'jam_selesai'
    ];

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran');
    }
    public function guru()
    {
        return $this->belongsTo(Guru::class, 'id_guru');
    }
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'id_kelas');
    }
    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel');
    }
    public function mapel()
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel');
    }

    protected $casts = [
        // jika mau parse sebagai time, Laravel tidak punya "time" cast khusus — gunakan accessor jika butuh format
    ];
    public function getJamMulaiFormattedAttribute()
    {
        return Carbon::parse($this->jam_mulai)->format('H:i');
    }
}
