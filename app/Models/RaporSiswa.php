<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\RaporSiswa
 *
 * @property int         $id_rapor
 * @property string      $id_siswa
 * @property string      $id_kelas
 * @property string      $id_tahun_ajaran
 * @property string      $semester        // 'Ganjil' | 'Genap'
 * @property float|null  $rata_rata
 * @property int|null    $peringkat_kelas
 * @property string|null $catatan_wali
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class RaporSiswa extends Model
{
    /** Nama tabel di DB */
    protected $table = 'tbl_rapor_siswa';

    /** Primary key & tipe */
    protected $primaryKey = 'id_rapor';
    public $incrementing = true;
    protected $keyType = 'int';

    /** Timestamps aktif (created_at, updated_at) */
    public $timestamps = true;

    /** Kolom yang boleh diisi mass-assignment */
    protected $fillable = [
        'id_siswa',
        'id_kelas',
        'id_tahun_ajaran',
        'semester',
        'rata_rata',
        'peringkat_kelas',
        'catatan_wali',
    ];

    /** Casting tipe data */
    protected $casts = [
        'rata_rata'       => 'float',
        'peringkat_kelas' => 'int',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
    ];

    /* =======================
     *        RELASI
     * ======================= */

    /** Satu rapor milik satu siswa */
    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa');
    }

    /** Satu rapor terkait satu kelas */
    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    /** Satu rapor terkait satu tahun ajaran */
    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }
}
