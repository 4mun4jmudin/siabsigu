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
        Schema::create('tbl_mata_pelajaran', function (Blueprint $table) {
            $table->string('id_mapel', 20)->primary();
            $table->string('nama_mapel', 100)->unique();
            
            // PERBAIKAN: Menambahkan 4 kolom yang terlewat
            $table->string('kategori', 50)->nullable();
            $table->integer('kkm')->nullable();
            $table->enum('status', ['Aktif', 'Tidak Aktif'])->default('Aktif');
            $table->integer('jumlah_jp')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PERBAIKAN: Ubah 'mata_pelajarans' menjadi 'tbl_mata_pelajaran'
        Schema::dropIfExists('tbl_mata_pelajaran');
    }
};