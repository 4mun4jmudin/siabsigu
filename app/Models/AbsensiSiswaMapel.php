<?php

namespace App\Models;

use Carbon\Carbon;
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

        // NEW columns
        'is_overridden',
        'source_status',     // 'daily' | 'manual'
        'derived_at',
        'overridden_by',
        'overridden_at',
        'menit_terlambat_mapel',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_overridden' => 'boolean',
        'derived_at' => 'datetime',
        'overridden_at' => 'datetime',
        'menit_terlambat_mapel' => 'integer',
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
    public function getMenitKeterlambatanAttribute()
    {
        $jadwalMulai = $this->jadwalMulai();
        if (!$jadwalMulai || !$this->jam_mulai) return null;

        try {
            $scheduled = Carbon::createFromFormat('H:i:s', $jadwalMulai);
        } catch (\Throwable $e) {
            try { $scheduled = Carbon::createFromFormat('H:i', substr($jadwalMulai, 0, 5)); }
            catch (\Throwable $e2) { return null; }
        }

        try {
            $actual = Carbon::createFromFormat('H:i:s', $this->jam_mulai);
        } catch (\Throwable $e) {
            try { $actual = Carbon::createFromFormat('H:i', substr($this->jam_mulai, 0, 5)); }
            catch (\Throwable $e2) { return null; }
        }

        return $actual->greaterThan($scheduled) ? $actual->diffInMinutes($scheduled) : 0;
    }

    public function jadwalMulai()
    {
        if ($this->relationLoaded('jadwalMengajar') && $this->jadwalMengajar) {
            return $this->jadwalMengajar->jam_mulai;
        }
        if ($this->relationLoaded('jadwal') && $this->jadwal) {
            return $this->jadwal->jam_mulai;
        }
        if ($this->jadwalMengajar) return $this->jadwalMengajar->jam_mulai;
        if ($this->jadwal) return $this->jadwal->jam_mulai;
        return null;
    }

    public function jadwal()
    {
        return $this->belongsTo(JadwalMengajar::class, 'id_jadwal', 'id_jadwal');
    }
}
