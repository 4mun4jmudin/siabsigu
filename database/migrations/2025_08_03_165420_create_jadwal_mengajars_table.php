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
        Schema::create('tbl_jadwal_mengajar', function (Blueprint $table) {
            $table->string('id_jadwal', 20)->primary();

            $table->string('id_tahun_ajaran', 20);
            $table->foreign('id_tahun_ajaran')->references('id_tahun_ajaran')->on('tbl_tahun_ajaran');

            $table->string('id_guru', 20);
            $table->foreign('id_guru')->references('id_guru')->on('tbl_guru');

            $table->string('id_kelas', 20);
            $table->foreign('id_kelas')->references('id_kelas')->on('tbl_kelas');

            $table->string('id_mapel', 20);
            $table->foreign('id_mapel')->references('id_mapel')->on('tbl_mata_pelajaran');

            $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jadwal_mengajars');
    }
};
