<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            $table->string('lokasi_sekolah_latitude', 30)->nullable()->after('some_existing_column');
            $table->string('lokasi_sekolah_longitude', 30)->nullable()->after('lokasi_sekolah_latitude');
            $table->integer('radius_absen_meters')->default(200)->after('lokasi_sekolah_longitude');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_pengaturan', function (Blueprint $table) {
            $table->dropColumn(['lokasi_sekolah_latitude', 'lokasi_sekolah_longitude', 'radius_absen_meters']);
        });
    }
};
