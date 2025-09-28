<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Remedial extends Model
{
    protected $table = 'tbl_remedial';
    protected $primaryKey = 'id_remedial';
    public $incrementing = true;

    protected $fillable = [
        'id_penilaian','komponen','nilai_awal','nilai_remedial','tanggal','metode','catatan',
    ];

    protected $casts = [
        'tanggal'       => 'date',
        'nilai_awal'    => 'decimal:2',
        'nilai_remedial'=> 'decimal:2',
    ];

    public function penilaian(){ return $this->belongsTo(PenilaianMapel::class,'id_penilaian','id_penilaian'); }
}
