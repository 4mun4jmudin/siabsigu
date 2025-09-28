<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratIzin extends Model
{
    use HasFactory;

    protected $table = 'tbl_surat_izin';
    protected $primaryKey = 'id_surat';

    protected $fillable = [
        'id_siswa',
        'tanggal_pengajuan',
        'tanggal_mulai_izin',
        'tanggal_selesai_izin',
        'jenis_izin',           // 'Sakit' | 'Izin'
        'keterangan',
        'file_lampiran',
        'status_pengajuan',     // 'Diajukan' | 'Disetujui' | 'Ditolak'
        'id_penyetuju',
        'tanggal_persetujuan',
    ];

    protected $casts = [
        'tanggal_pengajuan'     => 'datetime',
        'tanggal_mulai_izin'    => 'date',
        'tanggal_selesai_izin'  => 'date',
        'tanggal_persetujuan'   => 'datetime',
    ];

    // Relasi
    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function penyetuju()
    {
        return $this->belongsTo(User::class, 'id_penyetuju', 'id_pengguna');
    }
}
