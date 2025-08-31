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
        Schema::table('tbl_siswa', function (Blueprint $table) {
            // Tambahkan kolom id_pengguna setelah barcode_id
            $table->unsignedBigInteger('id_pengguna')->unique()->nullable()->after('barcode_id');

            // Buat foreign key constraint ke tabel pengguna
            $table->foreign('id_pengguna')
                ->references('id_pengguna')
                ->on('tbl_pengguna')
                ->onDelete('set null'); // Jika user dihapus, id_pengguna di siswa menjadi null
        });

        // Ubah tipe kolom 'level' untuk menambahkan 'Siswa'
        // DB::statement("ALTER TABLE tbl_pengguna MODIFY COLUMN level ENUM('Admin', 'Guru', 'Kepala Sekolah', 'Orang Tua', 'Siswa')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_siswa', function (Blueprint $table) {
            // Hapus foreign key terlebih dahulu
            $table->dropForeign(['id_pengguna']);
            // Hapus kolomnya
            $table->dropColumn('id_pengguna');
        });

     
    }
};