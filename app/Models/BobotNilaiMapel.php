<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BobotNilaiMapel extends Model
{
    protected $table = 'tbl_bobot_nilai_mapel';
    protected $primaryKey = 'id';
    public $incrementing = true;

    protected $fillable = [
        'id_mapel','id_tahun_ajaran','semester',
        'bobot_tugas','bobot_uh','bobot_pts','bobot_pas','bobot_praktik','bobot_proyek',
    ];

    protected $casts = [
        'bobot_tugas'   => 'decimal:2',
        'bobot_uh'      => 'decimal:2',
        'bobot_pts'     => 'decimal:2',
        'bobot_pas'     => 'decimal:2',
        'bobot_praktik' => 'decimal:2',
        'bobot_proyek'  => 'decimal:2',
    ];

    public function mapel(){ return $this->belongsTo(MataPelajaran::class,'id_mapel','id_mapel'); }
    public function tahunAjaran(){ return $this->belongsTo(TahunAjaran::class,'id_tahun_ajaran','id_tahun_ajaran'); }
}
