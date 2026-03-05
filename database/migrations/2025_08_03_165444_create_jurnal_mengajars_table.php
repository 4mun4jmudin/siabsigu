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
        Schema::create('tbl_jurnal_mengajar', function (Blueprint $table) {
            $table->string('id_jurnal', 30)->primary();

            $table->string('id_jadwal', 20);
            $table->foreign('id_jadwal')->references('id_jadwal')->on('tbl_jadwal_mengajar');

            $table->date('tanggal');
            $table->time('jam_masuk_kelas')->nullable();
            $table->time('jam_keluar_kelas')->nullable();
            $table->enum('status_mengajar', ['Mengajar', 'Tugas', 'Digantikan', 'Kosong']);

            $table->string('id_guru_pengganti', 20)->nullable();
            $table->foreign('id_guru_pengganti')->references('id_guru')->on('tbl_guru');

            $table->text('materi_pembahasan')->nullable();
            
            // PERBAIKAN: Menambahkan kolom 'alasan_tidak_mengajar'
            $table->string('alasan_tidak_mengajar')->nullable();

            $table->unsignedBigInteger('id_penginput_manual')->nullable();
            $table->foreign('id_penginput_manual')->references('id_pengguna')->on('tbl_pengguna');

            // PERBAIKAN: Menambahkan kolom 'id_editor' beserta relasi foreign key-nya
            $table->unsignedBigInteger('id_editor')->nullable();
            $table->foreign('id_editor')->references('id_pengguna')->on('tbl_pengguna')->onDelete('set null');

            // PERBAIKAN: Menambahkan kolom 'terakhir_diedit_pada'
            $table->timestamp('terakhir_diedit_pada')->nullable();

            $table->timestamps();
            $table->softDeletes();
            
            // PERBAIKAN: Menambahkan Unique Key gabungan id_jadwal dan tanggal
            $table->unique(['id_jadwal', 'tanggal'], 'unique_jadwal_tanggal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PERBAIKAN: Ubah 'jurnal_mengajars' menjadi 'tbl_jurnal_mengajar'
        Schema::dropIfExists('tbl_jurnal_mengajar');
    }
};