<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('tbl_absensi_guru', function (Blueprint $table) {
            $table->integer('menit_keterlambatan')->nullable()->after('id_penginput_manual');
        });
    }


    public function down(): void
    {
        Schema::table('tbl_absensi_guru', function (Blueprint $table) {
        });
    }
};
