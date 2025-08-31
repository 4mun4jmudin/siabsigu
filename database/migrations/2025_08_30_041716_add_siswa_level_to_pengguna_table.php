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
        Schema::table('tbl_pengguna', function (Blueprint $table) {
            // Modify the enum column to add the new 'Siswa' level
            $table->enum('level', ['Admin', 'Guru', 'Kepala Sekolah', 'Orang Tua', 'Siswa'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_pengguna', function (Blueprint $table) {
            // Revert the enum column to its original state without 'Siswa'
            // Note: This might fail if there are existing users with the 'Siswa' level.
            $table->enum('level', ['Admin', 'Guru', 'Kepala Sekolah', 'Orang Tua'])->change();
        });
    }
};