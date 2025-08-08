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
        Schema::create('tbl_surat_izin', function (Blueprint $table) {
            // INT AUTO_INCREMENT PRIMARY KEY
            $table->id('id_surat');

            $table->string('id_siswa', 20);
            $table->foreign('id_siswa')->references('id_siswa')->on('tbl_siswa');

            $table->dateTime('tanggal_pengajuan');
            $table->date('tanggal_mulai_izin');
            $table->date('tanggal_selesai_izin');
            $table->enum('jenis_izin', ['Sakit', 'Izin']);
            $table->text('keterangan');
            $table->string('file_lampiran')->nullable();
            $table->enum('status_pengajuan', ['Diajukan', 'Disetujui', 'Ditolak']);

            $table->unsignedBigInteger('id_penyetuju')->nullable();
            $table->foreign('id_penyetuju')->references('id_pengguna')->on('tbl_pengguna');

            $table->dateTime('tanggal_persetujuan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_izins');
    }
};
