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
use App\Http\Controllers\Admin\JurnalMengajarController;
use App\Http\Controllers\Admin\LaporanController;
use App\Http\Controllers\Siswa\AbsensiController as SiswaAbsensiController;
use App\Http\Controllers\Auth\SiswaLoginController;
use App\Http\Controllers\Guru\DashboardController as GuruDashboardController;
use App\Http\Controllers\Guru\AbsensiSiswaController as GuruAbsensiSiswaController;
use App\Http\Controllers\Guru\AbsensiSiswaMapelController;
use App\Http\Controllers\Guru\AbsensiHarianController;
use App\Http\Controllers\Guru\JadwalController;
use App\Http\Controllers\OrangTua\DashboardController;
use App\Http\Controllers\OrangTua\ProfileController as OrangTuaProfileController;
use App\Http\Controllers\OrangTua\AbsensiController;

// use App\Http\Controllers\Guru\SiswaController;


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
// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');



// Grup untuk semua rute yang memerlukan autentikasi
Route::middleware('auth')->group(function () {

    // Rute Profil (berlaku untuk semua level)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |--------------------------------------------------------------------------
    | PANEL SISWA (Hanya bisa diakses oleh Siswa)
    |--------------------------------------------------------------------------
    */
    Route::prefix('siswa')->name('siswa.')->middleware('check.level:Siswa')->group(function () {
        Route::get('/dashboard', [SiswaAbsensiController::class, 'index'])->name('dashboard');
        Route::post('/absensi', [SiswaAbsensiController::class, 'store'])->name('absensi.store');
    });

    Route::middleware(['auth', 'check.level:Orang Tua'])->prefix('orangtua')->name('orangtua.')->group(function () {
        // Route::get('/dashboard', function () {return Inertia::render('OrangTua/Dashboard');
        // })->name('dashboard');
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/profile', [OrangTuaProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [OrangTuaProfileController::class, 'update'])->name('profile.update');
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
        Route::get('/jadwal', [App\Http\Controllers\OrangTua\JadwalController::class, 'index'])->name('jadwal.index');
        Route::get('/pengumuman', [App\Http\Controllers\OrangTua\PengumumanController::class, 'index'])->name('pengumuman.index');
        Route::get('/pengumuman/{pengumuman}', [App\Http\Controllers\OrangTua\PengumumanController::class, 'show'])->name('pengumuman.show');

        // Nanti kita bisa tambahkan rute lain di sini
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL GURU (Hanya bisa diakses oleh Guru)
    |--------------------------------------------------------------------------
    */

    Route::prefix('guru')->name('guru.')->middleware('check.level:Guru')->group(function () {
        Route::get('/dashboard', [GuruDashboardController::class, 'index'])->name('dashboard');

        // --- RUTE BARU UNTUK ABSENSI MAPEL ---
        // ------------------------------------
        Route::get('/absensi-mapel', [AbsensiSiswaMapelController::class, 'index'])->name('absensi-mapel.index'); // Halaman pilih jadwal
        Route::get('/absensi-mapel/{id_jadwal}', [AbsensiSiswaMapelController::class, 'show'])->name('absensi-mapel.show'); // Halaman absensi
        Route::post('/absensi-mapel', [AbsensiSiswaMapelController::class, 'store'])->name('absensi-mapel.store'); // Proses simpan

        Route::get('/absensi-harian', [AbsensiHarianController::class, 'index'])->name('absensi-harian.index');
        Route::post('/absensi-harian', [AbsensiHarianController::class, 'store'])->name('absensi-harian.store');

        Route::post('absensi-harian/izin', [\App\Http\Controllers\Guru\AbsensiHarianController::class, 'submitIzin'])->name('absensi-harian.izin');

        // jadwal panel guru
        Route::resource('/jadwal', App\Http\Controllers\Guru\JadwalController::class);
        Route::get('/jadwal', [App\Http\Controllers\Guru\JadwalController::class, 'index'])->name('jadwal.index');

        Route::get('/jadwal/export/ical', [JadwalController::class, 'exportIcal'])->name('jadwal.export.ical');

        Route::get('/siswa', [App\Http\Controllers\Guru\SiswaController::class, 'index'])->name('siswa.index');
        Route::get('/siswa/{siswa}', [App\Http\Controllers\Guru\SiswaController::class, 'show'])->name('siswa.show');

        Route::get('/laporan', [App\Http\Controllers\Guru\LaporanController::class, 'index'])->name('laporan.index');
        // Route::get('/laporan/export', [LaporanController::class, 'export'])->name('laporan.export');
        Route::get('/laporan/export-excel', [App\Http\Controllers\Guru\LaporanController::class, 'exportExcel'])->name('laporan.exportExcel');
        Route::get('/laporan/preview-pdf', [App\Http\Controllers\Guru\LaporanController::class, 'previewPdf'])->name('laporan.previewPdf');



        Route::resource('/jurnal', App\Http\Controllers\Guru\JurnalMengajarController::class);
        Route::post('/jurnal/quick-entry', [App\Http\Controllers\Guru\JurnalMengajarController::class, 'storeQuickEntry'])->name('jurnal.quick_entry');
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL ADMIN (Hanya bisa diakses oleh Admin)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->middleware('check.level:Admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Manajemen Data Master
        Route::resource('guru', GuruController::class);
        Route::resource('siswa', SiswaController::class);
        Route::resource('kelas', KelasController::class);
        Route::resource('mata-pelajaran', MataPelajaranController::class);
        Route::resource('orang-tua-wali', OrangTuaWaliController::class);
        Route::post('orang-tua-wali/{orangTuaWali}/reset-password', [OrangTuaWaliController::class, 'resetPassword'])->name('orang-tua-wali.reset-password');

        // Fitur Tambahan Master
        Route::post('siswa/{siswa}/keamanan', [SiswaController::class, 'updateKeamanan'])->name('siswa.update.keamanan');
        Route::post('siswa/generate-accounts', [SiswaController::class, 'generateMissingAccounts'])->name('siswa.generate-accounts');
        Route::post('guru/{guru}/register-fingerprint', [GuruController::class, 'registerFingerprint'])->name('guru.register-fingerprint');
        Route::post('guru/{guru}/generate-barcode', [GuruController::class, 'generateBarcode'])->name('guru.generate-barcode');

        // Manajemen Absensi
        Route::resource('absensi-guru', AbsensiGuruController::class)->only(['index', 'store', 'show']);
        Route::get('absensi-guru/export-excel', [AbsensiGuruController::class, 'exportExcel'])->name('absensi-guru.export-excel');
        Route::get('absensi-guru/export-pdf', [AbsensiGuruController::class, 'exportPdf'])->name('absensi-guru.export-pdf');

        Route::resource('absensi-siswa', AbsensiSiswaController::class)->only(['index']);
        Route::post('absensi-siswa/store-massal', [AbsensiSiswaController::class, 'storeMassal'])->name('absensi-siswa.store.massal');
        Route::post('absensi-siswa/store-manual', [AbsensiSiswaController::class, 'storeManual'])->name('absensi-siswa.storeManual');
        Route::get('absensi-siswa/export/excel', [AbsensiSiswaController::class, 'exportExcel'])->name('absensi-siswa.export.excel');
        Route::get('absensi-siswa/export/pdf', [AbsensiSiswaController::class, 'exportPdf'])->name('absensi-siswa.export.pdf');

        // Jadwal & Jurnal
        Route::resource('jadwal-mengajar', JadwalMengajarController::class);
        Route::patch('jadwal-mengajar/{jadwalMengajar}/update-time', [JadwalMengajarController::class, 'updateTime'])->name('jadwal-mengajar.updateTime');
        Route::get('jadwal-mengajar/export/excel', [JadwalMengajarController::class, 'exportExcel'])->name('jadwal-mengajar.export.excel');
        Route::get('jadwal-mengajar/export/pdf', [JadwalMengajarController::class, 'exportPdf'])->name('jadwal-mengajar.export.pdf');
        Route::get('jadwal-mengajar/import/template', [JadwalMengajarController::class, 'downloadTemplate'])->name('jadwal-mengajar.import.template');
        Route::post('jadwal-mengajar/import', [JadwalMengajarController::class, 'importExcel'])->name('jadwal-mengajar.import');
        Route::post('jadwal-mengajar/import/preview', [JadwalMengajarController::class, 'previewImport'])->name('jadwal-mengajar.import.preview');
        Route::post('jadwal-mengajar/import/confirm', [JadwalMengajarController::class, 'confirmImport'])->name('jadwal-mengajar.import.confirm');

        Route::resource('jurnal-mengajar', JurnalMengajarController::class);
        Route::get('jurnal-mengajar/find-pengganti', [JurnalMengajarController::class, 'findGuruPengganti'])->name('jurnal-mengajar.find-pengganti');
        Route::get('jurnal-mengajar/export/excel', [JurnalMengajarController::class, 'exportExcel'])->name('jurnal-mengajar.export.excel');
        Route::get('jurnal-mengajar/export/pdf', [JurnalMengajarController::class, 'exportPdf'])->name('jurnal-mengajar.export.pdf');

        // Laporan & Pengaturan
        Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/export-pdf', [LaporanController::class, 'exportPdf'])->name('laporan.export.pdf');
        Route::get('/laporan/export-excel', [LaporanController::class, 'exportExcel'])->name('laporan.export.excel');
        Route::get('/laporan/detail-harian', [LaporanController::class, 'getDetailHarian'])->name('laporan.detailHarian');

        Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('pengaturan.index');
        Route::post('/pengaturan/umum', [PengaturanController::class, 'updateGeneral'])->name('pengaturan.update-general');
        Route::put('/pengaturan/absensi', [PengaturanController::class, 'updateAbsensi'])->name('pengaturan.update-absensi');
        Route::put('/pengaturan/pengguna', [PengaturanController::class, 'updateUsers'])->name('pengaturan.update-users');
        Route::put('/pengaturan/sistem', [PengaturanController::class, 'updateSystem'])->name('pengaturan.update-system');
        Route::put('/pengaturan/backup', [PengaturanController::class, 'updateBackup'])->name('pengaturan.update-backup');

        // Maintenance
        Route::prefix('maintenance')->name('maintenance.')->group(function () {
            Route::post('clear-cache', [PengaturanController::class, 'clearCache'])->name('clear-cache');
            Route::post('optimize-database', [PengaturanController::class, 'optimizeDatabase'])->name('optimize-database');
            Route::get('backups', [PengaturanController::class, 'listBackups'])->name('backups');
            Route::post('backup-manual', [PengaturanController::class, 'manualBackup'])->name('backup-manual');
            Route::post('restore', [PengaturanController::class, 'restoreDatabase'])->name('restore');
        });
    });
});

Route::get('login/siswa', [SiswaLoginController::class, 'create'])->name('login.siswa');
Route::post('login/siswa', [SiswaLoginController::class, 'store'])->name('login.siswa.store');

require __DIR__ . '/auth.php';
