<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenilaianMapel extends Model
{
    protected $table = 'tbl_penilaian_mapel';
    protected $primaryKey = 'id_penilaian';
    public $incrementing = true;

    protected $fillable = [
        'id_siswa','id_kelas','id_mapel','id_tahun_ajaran','semester',
        'nilai_akhir','predikat','tuntas','catatan',
    ];

    protected $casts = [
        'nilai_akhir' => 'decimal:2',
        'tuntas'      => 'boolean',
    ];

    public function siswa(){ return $this->belongsTo(Siswa::class,'id_siswa','id_siswa'); }
    public function kelas(){ return $this->belongsTo(Kelas::class,'id_kelas','id_kelas'); }
    public function mapel(){ return $this->belongsTo(MataPelajaran::class,'id_mapel','id_mapel'); }
    public function tahunAjaran(){ return $this->belongsTo(TahunAjaran::class,'id_tahun_ajaran','id_tahun_ajaran'); }
    public function details(){ return $this->hasMany(PenilaianDetail::class,'id_penilaian','id_penilaian'); }
    public function remedials(){ return $this->hasMany(Remedial::class,'id_penilaian','id_penilaian'); }
}
