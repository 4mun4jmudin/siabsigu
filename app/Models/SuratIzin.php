<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SuratIzin extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_surat_izin';
    protected $primaryKey = 'id_surat'; // Auto-increment

    protected $fillable = [
        'id_siswa',
        'tanggal_pengajuan',
        'tanggal_mulai_izin',
        'tanggal_selesai_izin',
        'jenis_izin',
        'keterangan',
        'file_lampiran',
        'status_pengajuan',
        'id_penyetuju',
        'tanggal_persetujuan'
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }
    public function penyetuju()
    {
        return $this->belongsTo(User::class, 'id_penyetuju');
    }
}
