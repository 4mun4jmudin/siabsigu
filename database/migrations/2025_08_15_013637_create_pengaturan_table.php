<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_pengaturan', function (Blueprint $table) {
            $table->string('key')->primary(); // Nama pengaturan, e.g., 'jam_masuk'
            $table->string('value')->nullable(); // Nilai pengaturan, e.g., '07:30'
            $table->timestamps();
        });

        // Menambahkan nilai default untuk jam kerja
        DB::table('tbl_pengaturan')->insert([
            ['key' => 'jam_masuk', 'value' => '07:30', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'jam_pulang', 'value' => '15:00', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_pengaturan');
    }
};