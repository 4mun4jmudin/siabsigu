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
        Schema::table('tbl_siswa', function (Blueprint $table) {
            // Mengubah tipe kolom menjadi unsignedBigInteger agar cocok
            $table->unsignedBigInteger('id_pengguna')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_siswa', function (Blueprint $table) {
            // Mengembalikan ke tipe semula jika migrasi di-rollback
            $table->string('id_pengguna', 20)->nullable()->change();
        });
    }
};