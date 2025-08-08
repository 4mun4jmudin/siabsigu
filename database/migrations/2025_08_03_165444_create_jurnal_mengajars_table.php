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
        Schema::dropIfExists('jurnal_mengajars');
    }
};
