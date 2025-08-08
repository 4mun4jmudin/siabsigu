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
        Schema::create('tbl_orang_tua_wali', function (Blueprint $table) {
            $table->string('id_wali', 20)->primary();

            $table->string('id_siswa', 20);
            $table->foreign('id_siswa')->references('id_siswa')->on('tbl_siswa')->onDelete('cascade');

            $table->unsignedBigInteger('id_pengguna')->unique()->nullable();
            $table->foreign('id_pengguna')->references('id_pengguna')->on('tbl_pengguna')->onDelete('set null');

            $table->enum('hubungan', ['Ayah', 'Ibu', 'Wali']);
            $table->string('nama_lengkap', 100);
            $table->string('nik', 16)->unique()->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('pendidikan_terakhir', ['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'])->nullable();
            $table->string('pekerjaan', 50)->nullable();
            $table->enum('penghasilan_bulanan', ['< 1 Juta', '1 - 3 Juta', '3 - 5 Juta', '5 - 10 Juta', '> 10 Juta', 'Tidak Berpenghasilan'])->nullable();
            $table->string('no_telepon_wa', 20);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orang_tua_walis');
    }
};
