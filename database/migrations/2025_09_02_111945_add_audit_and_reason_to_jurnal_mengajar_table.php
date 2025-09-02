<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_jurnal_mengajar', function (Blueprint $table) {
            // Kolom untuk melacak pengeditan
            $table->unsignedBigInteger('id_editor')->nullable()->after('id_penginput_manual');
            $table->timestamp('terakhir_diedit_pada')->nullable()->after('id_editor');
            
            // Kolom untuk kasus guru berhalangan (izin, dll.)
            $table->string('alasan_tidak_mengajar')->nullable()->after('materi_pembahasan');

            // Foreign key untuk editor
            $table->foreign('id_editor')->references('id_pengguna')->on('tbl_pengguna')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_jurnal_mengajar', function (Blueprint $table) {
            $table->dropForeign(['id_editor']);
            $table->dropColumn(['id_editor', 'terakhir_diedit_pada', 'alasan_tidak_mengajar']);
        });
    }
};