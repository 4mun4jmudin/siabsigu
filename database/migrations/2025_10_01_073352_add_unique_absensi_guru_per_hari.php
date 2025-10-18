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
        Schema::table('tbl_absensi_guru', function (Blueprint $table) {
            $table->unique(['id_guru', 'tanggal'], 'uq_absensi_guru_per_hari');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_absensi_guru', function (Blueprint $table) {
             $table->dropUnique('uq_absensi_guru_per_hari');
        });
    }
};
