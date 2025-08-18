<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Admin\KelasController;
use App\Http\Controllers\Admin\MataPelajaranController;
use App\Http\Controllers\Admin\OrangTuaWaliController;
use App\Http\Controllers\Admin\AbsensiGuruController;
use App\Http\Controllers\Admin\PengaturanController;
use App\Http\Controllers\Admin\AbsensiSiswaController;
use App\Http\Controllers\Admin\JadwalMengajarController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Rute Halaman Utama
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Rute Dasbor Pengguna Biasa
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Grup untuk semua rute yang memerlukan autentikasi
Route::middleware('auth')->group(function () {

    // Rute Profil Pengguna
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // =========================================================================
    // GRUP UTAMA UNTUK SEMUA FITUR PANEL ADMIN
    // ->prefix('admin') membuat URL diawali dengan /admin/...
    // ->name('admin.') membuat nama rute diawali dengan admin...
    // =========================================================================
    Route::prefix('admin')->name('admin.')->group(function () {

        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Manajemen Data Master (CRUD)
        Route::resource('guru', GuruController::class);
        Route::resource('siswa', SiswaController::class);
        Route::resource('kelas', KelasController::class);
        Route::resource('mata-pelajaran', MataPelajaranController::class);
        Route::resource('orang-tua-wali', OrangTuaWaliController::class);

        Route::post('orang-tua-wali/{orangTuaWali}/reset-password', [OrangTuaWaliController::class, 'resetPassword'])->name('orang-tua-wali.reset-password');
        Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('pengaturan.index');
        Route::put('/pengaturan', [PengaturanController::class, 'update'])->name('pengaturan.update');
        Route::post('guru/{guru}/register-fingerprint', [GuruController::class, 'registerFingerprint'])->name('guru.register-fingerprint');
        Route::post('guru/{guru}/generate-barcode', [GuruController::class, 'generateBarcode'])->name('guru.generate-barcode');
        Route::resource('jadwal-mengajar', JadwalMengajarController::class); // Rute ini sudah ada
        Route::get('jadwal-mengajar/export-excel', [JadwalMengajarController::class, 'exportExcel'])->name('jadwal-mengajar.export-excel');
        Route::get('jadwal-mengajar/export-pdf', [JadwalMengajarController::class, 'exportPdf'])->name('jadwal-mengajar.export-pdf');


        // --- Grup Khusus untuk Absensi Guru ---
        Route::prefix('absensi-guru')->name('absensi-guru.')->group(function () {
            Route::get('/', [AbsensiGuruController::class, 'index'])->name('index');
            Route::post('/', [AbsensiGuruController::class, 'store'])->name('store');
            Route::get('/{guru}', [AbsensiGuruController::class, 'show'])->name('show');
            // Rute Ekspor yang Baru
            Route::get('/export-excel', [AbsensiGuruController::class, 'exportExcel'])->name('export-excel');
            Route::get('/export-pdf', [AbsensiGuruController::class, 'exportPdf'])->name('export-pdf');
        });
        Route::prefix('absensi-siswa')->name('absensi-siswa.')->group(function () {
            // Rute untuk menampilkan halaman utama
            Route::get('/', [AbsensiSiswaController::class, 'index'])->name('index');

            // Rute untuk menyimpan data absensi massal dari modal
            Route::post('/store-massal', [AbsensiSiswaController::class, 'storeMassal'])->name('store.massal');
            Route::post('/update-individual', [AbsensiSiswaController::class, 'updateIndividual'])->name('update.individual');
            Route::post('/store-manual', [AbsensiSiswaController::class, 'storeManual'])->name('storeManual');
            Route::get('/export/excel', [AbsensiSiswaController::class, 'exportExcel'])->name('export.excel');
            Route::get('/export/pdf', [AbsensiSiswaController::class, 'exportPdf'])->name('export.pdf');
        });

        Route::resource('jadwal-mengajar', JadwalMengajarController::class);

        // =============================================================
        // TAMBAHKAN RUTE BARU DI SINI UNTUK MENANGANI DRAG & DROP
        // =============================================================
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-time', [JadwalMengajarController::class, 'updateTime'])->name('jadwal-mengajar.updateTime');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-time', [JadwalMengajarController::class, 'updateTime'])->name('jadwal-mengajar.updateTime');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-kelas', [JadwalMengajarController::class, 'updateKelas'])->name('jadwal-mengajar.updateKelas');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-guru', [JadwalMengajarController::class, 'updateGuru'])->name('jadwal-mengajar.updateGuru');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-mapel', [JadwalMengajarController::class, 'updateMapel'])->name('jadwal-mengajar.updateMapel');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-hari', [JadwalMengajarController::class, 'updateHari'])->name('jadwal-mengajar.updateHari');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-jam', [JadwalMengajarController::class, 'updateJam'])->name('jadwal-mengajar.updateJam');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-jam   -mulai', [JadwalMengajarController::class, 'updateJamMulai'])->name('jadwal-mengajar.updateJamMulai');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-jam-selesai', [JadwalMengajarController::class, 'updateJamSelesai'])->name('jadwal-mengajar.updateJamSelesai');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-tahun-ajaran', [JadwalMengajarController::class, 'updateTahunAjaran'])->name('jadwal-mengajar.updateTahunAjaran');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-id', [JadwalMengajarController::class, 'updateId'])->name('jadwal-mengajar.updateId');
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update', [JadwalMengajarController::class, 'update'])->name('jadwal-mengajar.update');
        Route::get('jadwal-mengajar/export/excel', [JadwalMengajarController::class, 'exportExcel'])->name('jadwal-mengajar.export.excel');
        Route::get('jadwal-mengajar/export/pdf', [JadwalMengajarController::class, 'exportPdf'])->name('jadwal-mengajar.export.pdf');
        // Download template impor
        Route::get('jadwal-mengajar/import/template', [JadwalMengajarController::class, 'downloadTemplate'])->name('jadwal-mengajar.import.template');

        // Endpoint impor (POST)
        Route::post('jadwal-mengajar/import', [JadwalMengajarController::class, 'importExcel'])->name('jadwal-mengajar.import');
        Route::get('template', [JadwalMengajarController::class, 'downloadTemplate'])->name('template');
        Route::post('import/preview', [JadwalMengajarController::class, 'previewImport'])->name('import.preview');
        Route::post('import/confirm', [JadwalMengajarController::class, 'confirmImport'])->name('import.confirm');
    });
});

require __DIR__ . '/auth.php';
