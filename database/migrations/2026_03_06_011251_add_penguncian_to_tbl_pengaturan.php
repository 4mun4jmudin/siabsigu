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
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            $table->boolean('is_kunci_absensi')->default(false)->after('semester_aktif');
            $table->boolean('is_kunci_jurnal')->default(false)->after('is_kunci_absensi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            $table->dropColumn(['is_kunci_absensi', 'is_kunci_jurnal']);
        });
    }
};
