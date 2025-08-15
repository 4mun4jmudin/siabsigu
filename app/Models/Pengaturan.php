<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    use HasFactory;

    protected $table = 'tbl_pengaturan';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];
}
