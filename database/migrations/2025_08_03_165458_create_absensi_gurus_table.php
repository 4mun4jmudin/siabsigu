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
            
            // PERBAIKAN: Menambahkan kolom menit_keterlambatan
            $table->integer('menit_keterlambatan')->nullable();

            $table->enum('status_kehadiran', ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dinas Luar']);
            $table->enum('metode_absen', ['Sidik Jari', 'Barcode', 'Manual']);
            $table->text('keterangan')->nullable();

            $table->unsignedBigInteger('id_penginput_manual')->nullable();
            $table->foreign('id_penginput_manual')->references('id_pengguna')->on('tbl_pengguna');

            $table->timestamps();
            $table->softDeletes();

            // PERBAIKAN: Menambahkan Unique Key untuk mencegah absen ganda di hari yang sama
            $table->unique(['id_guru', 'tanggal'], 'uq_absen_guru_tanggal');
            
            // PERBAIKAN: Menambahkan Index untuk mempercepat pencarian data
            $table->index('tanggal', 'idx_abs_guru_tanggal');
            $table->index(['status_kehadiran', 'tanggal'], 'idx_abs_guru_status_tgl');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PERBAIKAN: Ubah 'absensi_gurus' menjadi 'tbl_absensi_guru'
        Schema::dropIfExists('tbl_absensi_guru');
    }
};