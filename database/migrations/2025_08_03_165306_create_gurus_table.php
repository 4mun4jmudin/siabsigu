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
        Schema::create('tbl_guru', function (Blueprint $table) {
            $table->string('id_guru', 20)->primary();
            $table->string('nip', 30)->unique()->nullable();
            $table->string('nama_lengkap', 100);
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('foto_profil')->default('default_guru.png');
            $table->text('sidik_jari_template')->nullable();
            $table->string('barcode_id', 100)->unique()->nullable();

            // Foreign Key ke tbl_pengguna
            $table->unsignedBigInteger('id_pengguna')->unique()->nullable();
            $table->foreign('id_pengguna')->references('id_pengguna')->on('tbl_pengguna')->onDelete('set null');

            $table->enum('status', ['Aktif', 'Tidak Aktif', 'Pensiun']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gurus');
    }
};
