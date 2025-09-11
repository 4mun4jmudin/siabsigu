<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbsensiSiswaMapel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_absensi_siswa_mapel';
    protected $primaryKey = 'id_absensi_mapel';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_absensi_mapel',
        'id_jadwal',
        'id_siswa',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'status_kehadiran',
        'metode_absen',
        'id_guru_pengganti',
        'keterangan',
        'id_penginput_manual',
    ];

    // -----------------------
    // Relasi
    // -----------------------
    public function jadwalMengajar()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal');
    }

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function guruPengganti()
    {
        return $this->belongsTo(Guru::class, 'id_guru_pengganti');
    }

    public function penginputManual()
    {
        return $this->belongsTo(User::class, 'id_penginput_manual');
    }

    // -----------------------
    // Helper / accessor
    // -----------------------

    /**
     * Hitung menit keterlambatan relatif terhadap jam mulai jadwal.
     * Mengembalikan integer menit (>=0) atau null jika jam_mulai/jadwal tidak tersedia.
     */
    public function getMenitKeterlambatanAttribute()
    {
        if (!$this->jam_mulai) return null;

        $jamMulai = \Carbon\Carbon::createFromFormat('H:i:s', $this->jam_mulai ?? $this->jadwalMulai());
        $jamMasuk = \Carbon\Carbon::createFromFormat('H:i:s', $this->jam_mulai);
        return $jamMasuk->greaterThan($jamMulai) ? $jamMasuk->diffInMinutes($jamMulai) : 0;
    }

    /**
     * Jika ingin mendapatkan jam mulai default dari jadwal (bila tidak diisi di absensi).
     */
    public function jadwalMulai()
    {
        return $this->jadwalMengajar?->jam_mulai;
    }

    public function jadwal()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal', 'id_jadwal');
    }
}
