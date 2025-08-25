<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Jalankan migrasi.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tbl_pengaturan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_sekolah')->nullable();
            $table->string('alamat_sekolah')->nullable();
            $table->string('kepala_sekolah')->nullable();
            $table->string('tahun_ajaran_aktif')->nullable();
            $table->string('semester_aktif')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('jam_masuk_siswa')->nullable();
            $table->string('jam_pulang_siswa')->nullable();
            $table->string('jam_masuk_guru')->nullable();
            $table->string('jam_pulang_guru')->nullable();
            $table->integer('batas_terlambat_siswa')->default(0);
            $table->integer('batas_terlambat_guru')->default(0);
            $table->boolean('login_barcode_enabled')->default(true);
            $table->boolean('login_fingerprint_enabled')->default(false);
            $table->boolean('login_manual_enabled')->default(true);
            $table->integer('password_min_length')->default(8);
            $table->boolean('password_require_upper')->default(true);
            $table->integer('password_expiry_days')->default(90);
            $table->boolean('auto_create_user')->default(false);
            $table->boolean('backup_auto_enabled')->default(false);
            $table->string('backup_time')->nullable();
            $table->integer('backup_retention_days')->default(30);
            $table->timestamps();
        });

        // Masukkan data default setelah tabel dibuat
        DB::table('tbl_pengaturan')->insert([
            'nama_sekolah' => 'Nama Sekolah Anda',
            'alamat_sekolah' => 'Alamat Lengkap Sekolah',
            'kepala_sekolah' => 'Nama Kepala Sekolah',
            'tahun_ajaran_aktif' => '2025/2026',
            'semester_aktif' => 'Ganjil',
            'jam_masuk_siswa' => '07:00',
            'jam_pulang_siswa' => '15:00',
            'jam_masuk_guru' => '07:00',
            'jam_pulang_guru' => '15:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Mengembalikan migrasi.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tbl_pengaturan');
    }
};