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
        Schema::create('tbl_log_aktivitas', function (Blueprint $table) {
            // BIGINT AUTO_INCREMENT PRIMARY KEY
            $table->id('id_log');

            $table->unsignedBigInteger('id_pengguna')->nullable();
            $table->foreign('id_pengguna')->references('id_pengguna')->on('tbl_pengguna');

            // Menggunakan timestamp() dengan useCurrent() untuk DEFAULT CURRENT_TIMESTAMP
            $table->timestamp('waktu')->useCurrent();

            $table->string('aksi');
            $table->text('keterangan')->nullable();

            // Log aktivitas biasanya tidak memerlukan updated_at
            // $table->timestamps(); kita hilangkan agar hanya ada created_at (dari waktu)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_aktivitas');
    }
};
