<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pengumuman extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tbl_pengumuman';
    protected $primaryKey = 'id_pengumuman'; // Auto-increment, jadi tidak perlu properti lain

    protected $fillable = [
        'judul',
        'isi',
        'tanggal_terbit',
        'id_pembuat',
        'target_level'
    ];

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'id_pembuat');
    }
}
