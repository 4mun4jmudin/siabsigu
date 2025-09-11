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
        Schema::table('tbl_orang_tua_wali', function (Blueprint $table) {
            // Tambahkan kolom 'foto_profil' setelah kolom 'no_telepon_wa'
            $table->string('foto_profil')->nullable()->after('no_telepon_wa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_orang_tua_wali', function (Blueprint $table) {
            // Hapus kolom jika migrasi di-rollback
            $table->dropColumn('foto_profil');
        });
    }
};