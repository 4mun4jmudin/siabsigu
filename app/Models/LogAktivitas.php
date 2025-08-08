<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'tbl_log_aktivitas';
    protected $primaryKey = 'id_log';

    /**
     * Memberitahu Laravel bahwa nama kolom 'created_at' di tabel ini sebenarnya adalah 'waktu'.
     * Ini akan secara otomatis memperbaiki semua fungsi seperti latest().
     */
    const CREATED_AT = 'waktu';

    /**
     * Memberitahu Laravel bahwa di tabel ini tidak ada kolom 'updated_at'.
     */
    const UPDATED_AT = null;


    protected $fillable = [
        'id_pengguna',
        'waktu',
        'aksi',
        'keterangan'
    ];

    public function pengguna()
    {
        return $this->belongsTo(User::class, 'id_pengguna');
    }
}