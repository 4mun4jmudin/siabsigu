<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeputusanKenaikan extends Model
{
    protected $table = 'tbl_keputusan_kenaikan';
    protected $primaryKey = 'id_keputusan';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'id_siswa',
        'id_tahun_ajaran',
        'semester',
        'dari_kelas',
        'ke_kelas',
        'status',
        'alasan',
        'ditetapkan_oleh',
        'ditetapkan_pada',
    ];

    protected $casts = [
        'ditetapkan_pada' => 'datetime',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
    ];

    // ======= RELASI =======
    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    public function dariKelas()
    {
        return $this->belongsTo(Kelas::class, 'dari_kelas', 'id_kelas');
    }

    public function keKelas()
    {
        return $this->belongsTo(Kelas::class, 'ke_kelas', 'id_kelas');
    }

    public function penetap()
    {
        return $this->belongsTo(User::class, 'ditetapkan_oleh', 'id_pengguna');
    }
}
