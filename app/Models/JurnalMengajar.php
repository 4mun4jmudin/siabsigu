<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JurnalMengajar extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_jurnal_mengajar';
    protected $primaryKey = 'id_jurnal';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_jurnal',
        'id_jadwal',
        'tanggal',
        'jam_masuk_kelas',
        'jam_keluar_kelas',
        'status_mengajar',
        'id_guru_pengganti',
        'materi_pembahasan',
        'id_penginput_manual'
    ];

    public function jadwalMengajar()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal');
    }
    public function guruPengganti()
    {
        return $this->belongsTo(Guru::class, 'id_guru_pengganti');
    }
    public function penginputManual()
    {
        return $this->belongsTo(User::class, 'id_penginput_manual');
    }
}
