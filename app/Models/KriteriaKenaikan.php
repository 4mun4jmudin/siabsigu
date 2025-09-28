<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KriteriaKenaikan extends Model
{
    protected $table = 'tbl_kriteria_kenaikan';
    protected $primaryKey = 'id_kriteria';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false; // tabel ini tidak punya created_at/updated_at

    protected $fillable = [
        'tingkat',
        'nilai_min_akhir',
        'maks_tidak_tuntas',
        'min_rata_rata',
        'min_kehadiran_persen',
        'remedial_diperbolehkan',
        'berlaku_mulai_ta',
        'catatan',
    ];

    protected $casts = [
        'nilai_min_akhir'       => 'float',
        'maks_tidak_tuntas'     => 'int',
        'min_rata_rata'         => 'float',
        'min_kehadiran_persen'  => 'float',
        'remedial_diperbolehkan'=> 'boolean',
    ];
}
