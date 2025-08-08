<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TahunAjaran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_tahun_ajaran';
    protected $primaryKey = 'id_tahun_ajaran';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_tahun_ajaran',
        'tahun_ajaran',
        'semester',
        'status',
    ];
}
