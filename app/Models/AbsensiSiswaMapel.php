<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

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
     * Mengembalikan integer menit (>=0) atau null jika tidak tersedia.
     */
    public function getMenitKeterlambatanAttribute()
    {
        // jadwal mulai (string 'HH:ii:ss' atau null)
        $jadwalMulai = $this->jadwalMulai();
        if (!$jadwalMulai) {
            return null;
        }

        // actual jam masuk (waktu yg dicatat di record absensi)
        if (!$this->jam_mulai) {
            return null; // tidak bisa hitung jika tidak ada waktu absen
        }

        try {
            $scheduled = Carbon::createFromFormat('H:i:s', $jadwalMulai);
        } catch (\Throwable $e) {
            // jika format tidak cocok, coba potong 5 char (HH:ii)
            try {
                $scheduled = Carbon::createFromFormat('H:i', substr($jadwalMulai, 0, 5));
            } catch (\Throwable $e2) {
                return null;
            }
        }

        try {
            $actual = Carbon::createFromFormat('H:i:s', $this->jam_mulai);
        } catch (\Throwable $e) {
            try {
                $actual = Carbon::createFromFormat('H:i', substr($this->jam_mulai, 0, 5));
            } catch (\Throwable $e2) {
                return null;
            }
        }

        if ($actual->greaterThan($scheduled)) {
            return $actual->diffInMinutes($scheduled);
        }

        return 0;
    }

    /**
     * Jika ingin mendapatkan jam mulai default dari jadwal (bila tidak diisi di absensi).
     * Mengembalikan string 'HH:ii:ss' atau null.
     */
    public function jadwalMulai()
    {
        // beberapa model jadwal bisa menamai relasi berbeda.
        if ($this->relationLoaded('jadwalMengajar') && $this->jadwalMengajar) {
            return $this->jadwalMengajar->jam_mulai;
        }
        if ($this->relationLoaded('jadwal') && $this->jadwal) {
            return $this->jadwal->jam_mulai;
        }
        // fallback: coba lazy-load
        if ($this->jadwalMengajar) {
            return $this->jadwalMengajar->jam_mulai;
        }
        if ($this->jadwal) {
            return $this->jadwal->jam_mulai;
        }
        return null;
    }

    public function jadwal()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal', 'id_jadwal');
    }
}
