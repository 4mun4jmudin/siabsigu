<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenilaianDetail extends Model
{
    protected $table = 'tbl_penilaian_detail';
    protected $primaryKey = 'id_detail';
    public $incrementing = true;

    protected $fillable = [
        'id_penilaian','komponen','deskripsi','tanggal','nilai','bobot',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'nilai'   => 'decimal:2',
        'bobot'   => 'decimal:2',
    ];

    public function penilaian(){ return $this->belongsTo(PenilaianMapel::class,'id_penilaian','id_penilaian'); }
}
