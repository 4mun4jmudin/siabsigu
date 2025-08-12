<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataPelajaran extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nama tabel yang terhubung dengan model.
     *
     * @var string
     */
    protected $table = 'tbl_mata_pelajaran';

    /**
     * Primary key untuk model ini.
     *
     * @var string
     */
    protected $primaryKey = 'id_mapel';

    /**
     * Menunjukkan bahwa primary key bukan auto-incrementing integer.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Tipe data dari primary key.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Atribut yang dapat diisi secara massal (mass assignable).
     *
     * @var array
     */
    protected $fillable = [
        'id_mapel',
        'nama_mapel',
        'kategori', // Tambahkan ini
        'kkm',
        'status',      // <-- Tambahkan ini
        'jumlah_jp',
    ];

    /**
     * Mendefinisikan relasi one-to-many ke JadwalMengajar.
     * Satu mata pelajaran bisa ada di banyak jadwal.
     */
    public function jadwalMengajar()
    {
        return $this->hasMany(JadwalMengajar::class, 'id_mapel', 'id_mapel');
    }
}
