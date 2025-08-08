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
        Schema::create('tbl_absensi_guru', function (Blueprint $table) {
            $table->string('id_absensi', 30)->primary();

            $table->string('id_guru', 20);
            $table->foreign('id_guru')->references('id_guru')->on('tbl_guru');

            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_pulang')->nullable();
            $table->enum('status_kehadiran', ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dinas Luar']);
            $table->enum('metode_absen', ['Sidik Jari', 'Barcode', 'Manual']);
            $table->text('keterangan')->nullable();

            $table->unsignedBigInteger('id_penginput_manual')->nullable();
            $table->foreign('id_penginput_manual')->references('id_pengguna')->on('tbl_pengguna');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensi_gurus');
    }
};
