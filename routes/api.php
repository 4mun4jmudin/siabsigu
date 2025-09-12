<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SiswaAuthController;
use App\Http\Controllers\Api\SiswaDashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Di sini Anda dapat mendaftarkan rute API untuk aplikasi Anda. Rute-rute
| ini dimuat oleh RouteServiceProvider dan semuanya akan
| ditugaskan ke grup middleware "api".
|
*/

// == RUTE PUBLIK ==
// Rute ini bisa diakses tanpa perlu login/token (misalnya untuk login).
Route::post('/siswa/login', [SiswaAuthController::class, 'login']);


// == RUTE TERPROTEKSI ==
// Semua rute di dalam grup ini wajib menggunakan token autentikasi (Sanctum).
Route::middleware('auth:sanctum')->group(function () {
    
    // Rute default untuk mendapatkan informasi user yang sedang login
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Rute khusus untuk data siswa
    Route::prefix('siswa')->group(function () {
        
        // Mendapatkan data detail siswa yang terautentikasi
        // GET /api/siswa/user
        Route::get('/user', [SiswaAuthController::class, 'user']);
        
        // Proses logout dan menghapus token
        // POST /api/siswa/logout
        Route::post('/logout', [SiswaAuthController::class, 'logout']);
        
        // Mendapatkan data untuk dashboard siswa
        // GET /api/siswa/dashboard
        Route::get('/dashboard', [SiswaDashboardController::class, 'index']);

        // Menyimpan data absensi (masuk/pulang)
        // POST /api/siswa/absensi
        Route::post('/absensi', [SiswaDashboardController::class, 'storeAbsensi']);

        // Mengambil riwayat absensi siswa
        // GET /api/siswa/absensi/riwayat
        Route::get('/absensi/riwayat', [SiswaDashboardController::class, 'riwayatAbsensi']);
    });
});