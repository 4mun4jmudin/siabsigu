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
        Schema::table('tbl_mata_pelajaran', function (Blueprint $table) {
            // Menambahkan kolom kategori setelah nama_mapel
            $table->string('kategori', 50)->nullable()->after('nama_mapel');
            // Menambahkan kolom KKM (Kriteria Ketuntasan Minimal)
            $table->integer('kkm')->nullable()->after('kategori');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_mata_pelajaran', function (Blueprint $table) {
            $table->dropColumn('kategori');
            $table->dropColumn('kkm');
        });
    }
};
