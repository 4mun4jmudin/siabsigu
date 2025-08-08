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
        Schema::create('tbl_pengumuman', function (Blueprint $table) {
            // INT AUTO_INCREMENT PRIMARY KEY
            $table->id('id_pengumuman');

            $table->string('judul');
            $table->text('isi');
            $table->dateTime('tanggal_terbit');

            $table->unsignedBigInteger('id_pembuat');
            $table->foreign('id_pembuat')->references('id_pengguna')->on('tbl_pengguna');

            $table->enum('target_level', ['Semua', 'Guru', 'Siswa', 'Orang Tua']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengumumen');
    }
};
