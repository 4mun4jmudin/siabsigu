<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Perintah untuk MENAMBAHKAN kolom baru
        Schema::table('tbl_absensi_siswa', function (Blueprint $table) {
            // Kolom akan ditambahkan setelah kolom 'jam_pulang'
            $table->integer('menit_keterlambatan')->nullable()->default(0)->after('jam_pulang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Perintah untuk MENGHAPUS kolom jika migrasi di-rollback
        Schema::table('tbl_absensi_siswa', function (Blueprint $table) {
            $table->dropColumn('menit_keterlambatan');
        });
    }
};