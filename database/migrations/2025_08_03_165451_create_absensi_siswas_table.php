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

            // Status kehadiran tetap sama
            $table->enum('status_kehadiran', ['Hadir', 'Sakit', 'Izin', 'Alfa']);

            // Tambahkan metode Geolocation/GPS agar valid dengan absensi berbasis lokasi
            $table->enum('metode_absen', ['Sidik Jari', 'Barcode', 'Manual', 'Geolocation'])->default('Manual');

            // Kolom koordinat untuk menyimpan lokasi absensi
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
        // Pastikan nama tabel sesuai dengan yang dibuat di up()
        Schema::dropIfExists('tbl_absensi_siswa');
    }
};  
