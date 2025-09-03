<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_absensi_siswa_mapel', function (Blueprint $table) {
            // primary key custom string (mirip style project Anda)
            $table->string('id_absensi_mapel', 40)->primary();

            // referensi ke jadwal mengajar (jadwal per mapel)
            $table->string('id_jadwal', 20);
            $table->string('id_siswa', 20);

            // tanggal dan jam (untuk keperluan pencarian & laporan)
            $table->date('tanggal');
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();

            // status & metode
            $table->enum('status_kehadiran', ['Hadir','Sakit','Izin','Alfa','Tugas','Digantikan'])->default('Hadir');
            $table->enum('metode_absen', ['Sidik Jari','Barcode','Manual','QR','Geolocation'])->default('Manual');

            // optional: guru pengganti (jika status Digantikan)
            $table->string('id_guru_pengganti', 20)->nullable();

            // info tambahan
            $table->text('keterangan')->nullable();

            // user yg men-input (biasanya guru)
            $table->unsignedBigInteger('id_penginput_manual')->nullable();

            // audit
            $table->timestamps();
            $table->softDeletes();

            // Index untuk performa & constraint
            $table->index(['id_jadwal', 'tanggal'], 'idx_abs_mapel_jadwal_tanggal');
            $table->index(['id_siswa', 'tanggal'], 'idx_abs_mapel_siswa_tanggal');

            // hindari double entry: satu siswa untuk satu jadwal pada tanggal yg sama
            $table->unique(['id_jadwal', 'id_siswa', 'tanggal'], 'unique_jadwal_siswa_tanggal');

            // FK (jika tabel target ada). Sesuaikan nama tabel & kolom di DB Anda.
            $table->foreign('id_jadwal')->references('id_jadwal')->on('tbl_jadwal_mengajar')->onDelete('cascade');
            $table->foreign('id_siswa')->references('id_siswa')->on('tbl_siswa')->onDelete('cascade');
            $table->foreign('id_guru_pengganti')->references('id_guru')->on('tbl_guru')->onDelete('set null');
            $table->foreign('id_penginput_manual')->references('id_pengguna')->on('tbl_pengguna')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_absensi_siswa_mapel', function (Blueprint $table) {
            // drop foreign keys first (safety)
            $table->dropForeign(['id_jadwal']);
            $table->dropForeign(['id_siswa']);
            $table->dropForeign(['id_guru_pengganti']);
            $table->dropForeign(['id_penginput_manual']);
        });

        Schema::dropIfExists('tbl_absensi_siswa_mapel');
    }
};
