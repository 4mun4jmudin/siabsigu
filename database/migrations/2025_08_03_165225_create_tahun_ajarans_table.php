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
       Schema::create('tbl_tahun_ajaran', function (Blueprint $table) {
        $table->string('id_tahun_ajaran', 20)->primary();
        $table->string('tahun_ajaran', 10);
        $table->enum('semester', ['Ganjil', 'Genap']);
        $table->enum('status', ['Aktif', 'Tidak Aktif']);
        $table->timestamps();
        $table->softDeletes();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_tahun_ajaran');
    }
};
