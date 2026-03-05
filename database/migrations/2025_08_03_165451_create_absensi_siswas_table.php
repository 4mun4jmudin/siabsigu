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
        Schema::create('tbl_absensi_siswa', function (Blueprint $table) {
            $table->string('id_absensi', 30)->primary();

            $table->string('id_siswa', 20);
            $table->foreign('id_siswa')->references('id_siswa')->on('tbl_siswa');

            $table->date('tanggal');
            $table->time('jam_masuk')->nullable();
            $table->time('jam_pulang')->nullable();
            $table->integer('menit_keterlambatan')->nullable();

            $table->enum('status_kehadiran', ['Hadir', 'Sakit', 'Izin', 'Alfa']);

            // PERBAIKAN: Disesuaikan dengan SQL, ubah 'Geolocation' jadi 'GPS' dan hapus default('Manual')
            $table->enum('metode_absen', ['GPS', 'Sidik Jari', 'Barcode', 'Manual']);

            $table->string('latitude', 50)->nullable();
            $table->string('longitude', 50)->nullable();

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
        Schema::dropIfExists('tbl_absensi_siswa');
    }
};