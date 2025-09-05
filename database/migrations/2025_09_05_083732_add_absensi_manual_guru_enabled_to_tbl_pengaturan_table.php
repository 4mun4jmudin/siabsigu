<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            // Tambahkan kolom baru setelah login_manual_enabled (milik admin)
            $table->boolean('absensi_manual_guru_enabled')->default(true)->after('login_manual_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            $table->dropColumn('absensi_manual_guru_enabled');
        });
    }
};