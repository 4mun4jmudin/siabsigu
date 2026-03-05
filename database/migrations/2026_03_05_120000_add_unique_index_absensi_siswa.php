<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah unique index pada (id_siswa, tanggal) agar upsert() bisa bekerja.
     */
    public function up(): void
    {
        Schema::table('tbl_absensi_siswa', function (Blueprint $table) {
            $table->unique(['id_siswa', 'tanggal'], 'absensi_siswa_unik');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_absensi_siswa', function (Blueprint $table) {
            $table->dropUnique('absensi_siswa_unik');
        });
    }
};
