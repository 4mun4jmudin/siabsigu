<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

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
        'alasan_tidak_mengajar',
        'id_penginput_manual',
        'id_editor',
        'terakhir_diedit_pada',
    ];

    // perbaiki Call to undefined method App\Models\JurnalMengajar::jadwal()
    public function jadwal()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal', 'id_jadwal');
    }

    // Relasi ke jadwal mengajar
    public function jadwalMengajar()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal', 'id_jadwal')->withDefault();
    }

    // Relasi ke guru pengganti (jika ada)
    public function guruPengganti()
    {
        return $this->belongsTo(Guru::class, 'id_guru_pengganti', 'id_guru');
    }

    // Relasi ke pengguna yang menginput manual
    public function penginputManual()
    {
        return $this->belongsTo(User::class, 'id_penginput_manual', 'id_pengguna');
    }
}