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
        Schema::table('tbl_absensi_siswa_mapel', function (Blueprint $table) {
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'is_overridden')) {
                $table->boolean('is_overridden')->default(false)->after('keterangan');
            }
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'source_status')) {
                $table->string('source_status', 20)->default('daily')->after('is_overridden'); // daily|manual
            }
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'derived_at')) {
                $table->dateTime('derived_at')->nullable()->after('source_status');
            }
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'overridden_by')) {
                $table->string('overridden_by', 50)->nullable()->after('derived_at');
            }
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'overridden_at')) {
                $table->dateTime('overridden_at')->nullable()->after('overridden_by');
            }
            if (!Schema::hasColumn('tbl_absensi_siswa_mapel', 'menit_terlambat_mapel')) {
                $table->integer('menit_terlambat_mapel')->nullable()->after('overridden_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_absensi_siswa_mapel', function (Blueprint $table) {
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'menit_terlambat_mapel')) $table->dropColumn('menit_terlambat_mapel');
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'overridden_at')) $table->dropColumn('overridden_at');
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'overridden_by')) $table->dropColumn('overridden_by');
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'derived_at')) $table->dropColumn('derived_at');
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'source_status')) $table->dropColumn('source_status');
            if (Schema::hasColumn('tbl_absensi_siswa_mapel', 'is_overridden')) $table->dropColumn('is_overridden');
        });
    }
};
