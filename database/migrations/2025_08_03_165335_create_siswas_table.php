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
        Schema::create('tbl_siswa', function (Blueprint $table) {
            $table->string('id_siswa', 20)->primary();
            $table->string('nis', 30)->unique();
            $table->string('nisn', 20)->unique();

            $table->string('id_kelas', 20);
            $table->foreign('id_kelas')->references('id_kelas')->on('tbl_kelas');

            $table->string('nama_lengkap', 100);
            $table->string('nama_panggilan', 30)->nullable();
            // $table->string('foto_profil')->default('default_siswa.png');
            $table->string('foto_profil')->nullable()->default('default_siswa.png');
            $table->string('nik', 16)->unique();
            $table->string('nomor_kk', 16);
            $table->string('tempat_lahir', 50);
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->enum('agama', ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']);
            $table->text('alamat_lengkap');
            $table->text('sidik_jari_template')->nullable();
            $table->string('barcode_id', 100)->unique()->nullable();
            $table->enum('status', ['Aktif', 'Lulus', 'Pindah', 'Drop Out']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('siswas');
    }
};
