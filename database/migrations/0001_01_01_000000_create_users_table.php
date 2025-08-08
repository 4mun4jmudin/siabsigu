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
         Schema::create('tbl_pengguna', function (Blueprint $table) {
            // Kita akan gunakan ID auto-increment integer dari Laravel agar lebih mudah.
            // Jika Anda benar-benar harus menggunakan VARCHAR, lihat catatan di bawah.
            $table->id('id_pengguna'); // Menggunakan BIGINT AUTO_INCREMENT
            $table->string('nama_lengkap', 100);

            // Ganti 'name' menjadi 'username' dan pastikan unik
            $table->string('username', 50)->unique();

            // Kolom 'email' bawaan Laravel, bisa Anda hapus jika tidak perlu
            // atau buat nullable. Kita buat nullable saja untuk sekarang.
            $table->string('email')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();

            // Kolom 'password' sudah sesuai
            $table->string('password'); // VARCHAR(255)

            // Tambahkan kolom 'level' Anda
            $table->enum('level', ['Admin', 'Guru', 'Kepala Sekolah', 'Orang Tua']);

            $table->rememberToken();
            $table->timestamps(); // Membuat created_at dan updated_at
            $table->softDeletes(); // Membuat deleted_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
