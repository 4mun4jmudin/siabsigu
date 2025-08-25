<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Pengaturan extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terkait dengan model.
     *
     * @var string
     */
    protected $table = 'tbl_pengaturan';

    /**
     * Atribut yang dapat diisi.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_sekolah',
        'alamat_sekolah',
        'kepala_sekolah',
        'tahun_ajaran_aktif',
        'semester_aktif',
        'logo_url',
        'jam_masuk_siswa',
        'jam_pulang_siswa',
        'jam_masuk_guru',
        'jam_pulang_guru',
        'batas_terlambat_siswa',
        'batas_terlambat_guru',
        'login_barcode_enabled',
        'login_fingerprint_enabled',
        'login_manual_enabled',
        'password_min_length',
        'password_require_upper',
        'password_expiry_days',
        'auto_create_user',
        'backup_auto_enabled',
        'backup_time',
        'backup_retention_days',
        
    ];

    /**
     * Atribut yang harus diubah ke tipe data tertentu.
     *
     * @var array
     */
    protected $casts = [
        'login_barcode_enabled' => 'boolean',
        'login_fingerprint_enabled' => 'boolean',
        'login_manual_enabled' => 'boolean',
        'password_require_upper' => 'boolean',
        'auto_create_user' => 'boolean',
        'backup_auto_enabled' => 'boolean',
    ];
}