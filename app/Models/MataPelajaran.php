<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataPelajaran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_mata_pelajaran';
    protected $primaryKey = 'id_mapel';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_mapel',
        'nama_mapel',
    ];
}
