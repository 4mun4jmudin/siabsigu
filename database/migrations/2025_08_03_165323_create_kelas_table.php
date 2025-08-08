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
        Schema::create('tbl_kelas', function (Blueprint $table) {
            $table->string('id_kelas', 20)->primary();
            $table->string('tingkat', 10)->nullable();
            $table->string('jurusan', 50)->nullable();

            // Foreign Key ke tbl_guru
            $table->string('id_wali_kelas', 20)->nullable();
            $table->foreign('id_wali_kelas')->references('id_guru')->on('tbl_guru')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};
