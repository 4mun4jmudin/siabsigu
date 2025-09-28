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
use App\Http\Controllers\OrangTua\NotificationController as OrangTuaNotificationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\AbsensiSiswaMapelController as AdminAbsensiSiswaMapelController;

// Tambahan untuk modul Penilaian
use App\Http\Controllers\Auth\PenilaianLoginController;
use App\Http\Controllers\Admin\PenilaianController;
use App\Http\Controllers\Admin\PenilaianDashboardController;

use App\Http\Controllers\Admin\BobotNilaiMapelController;
use App\Http\Controllers\Admin\KriteriaKenaikanController;
use App\Http\Controllers\Admin\KeputusanKenaikanController;
use App\Http\Controllers\Admin\RaporController;
use App\Http\Controllers\Admin\AnalitikNilaiController;
use App\Http\Controllers\Admin\RemedialController;
use App\Http\Controllers\Admin\PenilaianNilaiController;
use App\Http\Controllers\Admin\SuratIzinController;



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
Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Login Khusus Admin Penilaian
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login/penilaian', [PenilaianLoginController::class, 'create'])->name('login.penilaian');
    Route::post('/login/penilaian', [PenilaianLoginController::class, 'store'])->name('login.penilaian.store');
});
Route::post('/logout/penilaian', [PenilaianLoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout.penilaian');

/*
|--------------------------------------------------------------------------
| Grup untuk semua rute yang memerlukan autentikasi
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {

    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/mark-all', [NotificationController::class, 'markAllRead'])->name('notifications.markAll');

    // Rute Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |--------------------------------------------------------------------------
    | PANEL SISWA
    |--------------------------------------------------------------------------
    */
    Route::prefix('siswa')->name('siswa.')->middleware('check.level:Siswa')->group(function () {
        Route::get('/dashboard', [SiswaAbsensiController::class, 'index'])->name('dashboard');
        Route::post('/absensi', [SiswaAbsensiController::class, 'store'])->name('absensi.store');
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL ORANG TUA
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'check.level:Orang Tua'])->prefix('orangtua')->name('orangtua.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/profile', [OrangTuaProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [OrangTuaProfileController::class, 'update'])->name('profile.update');
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
        Route::get('/jadwal', [App\Http\Controllers\OrangTua\JadwalController::class, 'index'])->name('jadwal.index');
        Route::get('/pengumuman', [App\Http\Controllers\OrangTua\PengumumanController::class, 'index'])->name('pengumuman.index');
        Route::get('/pengumuman/{pengumuman}', [App\Http\Controllers\OrangTua\PengumumanController::class, 'show'])->name('pengumuman.show');
        Route::get('/notifications', [OrangTuaNotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/mark-as-read', [OrangTuaNotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
        Route::post('/notifications/mark-all-as-read', [OrangTuaNotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL GURU
    |--------------------------------------------------------------------------
    */
    Route::prefix('guru')->name('guru.')->middleware('check.level:Guru')->group(function () {
        Route::get('/dashboard', [GuruDashboardController::class, 'index'])->name('dashboard');

        Route::get('/absensi-mapel', [AbsensiSiswaMapelController::class, 'index'])->name('absensi-mapel.index');
        Route::get('/absensi-mapel/{id_jadwal}', [AbsensiSiswaMapelController::class, 'show'])->name('absensi-mapel.show');
        Route::post('/absensi-mapel', [AbsensiSiswaMapelController::class, 'store'])->name('absensi-mapel.store');

        Route::get('/absensi-harian', [AbsensiHarianController::class, 'index'])->name('absensi-harian.index');
        Route::post('/absensi-harian', [AbsensiHarianController::class, 'store'])->name('absensi-harian.store');
        Route::post('absensi-harian/izin', [AbsensiHarianController::class, 'submitIzin'])->name('absensi-harian.izin');

        Route::resource('/jadwal', App\Http\Controllers\Guru\JadwalController::class);
        Route::get('/jadwal/export/ical', [JadwalController::class, 'exportIcal'])->name('jadwal.export.ical');

        Route::get('/siswa', [App\Http\Controllers\Guru\SiswaController::class, 'index'])->name('siswa.index');
        Route::get('/siswa/{siswa}', [App\Http\Controllers\Guru\SiswaController::class, 'show'])->name('siswa.show');

        Route::get('/laporan', [App\Http\Controllers\Guru\LaporanController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/export-excel', [App\Http\Controllers\Guru\LaporanController::class, 'exportExcel'])->name('laporan.exportExcel');
        Route::get('/laporan/preview-pdf', [App\Http\Controllers\Guru\LaporanController::class, 'previewPdf'])->name('laporan.previewPdf');

        Route::resource('/jurnal', App\Http\Controllers\Guru\JurnalMengajarController::class);
        Route::post('/jurnal/quick-entry', [App\Http\Controllers\Guru\JurnalMengajarController::class, 'storeQuickEntry'])->name('jurnal.quick_entry');
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL ADMIN
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->middleware('check.level:Admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::post('/mode', function (\Illuminate\Http\Request $request) {
            $request->validate(['mode' => 'required|in:absensi,full']);
            $request->session()->put('admin_mode', $request->input('mode'));
            return back()->with('success', 'Mode diperbarui ke: ' . ucfirst($request->input('mode')));
        })->name('mode.update');

        // tambahkan route untuk Surat Izin href={route("admin.surat-izin.create")}
        Route::get('/surat-izin/create', [SuratIzinController::class, 'create'])->name('surat-izin.create');
        // tambahkan route untuk Surat Izin href={route("admin.surat-izin.store")}
        Route::post('/surat-izin', [SuratIzinController::class, 'store'])->name('surat-izin.store');

        Route::get('/surat-izin',                 [SuratIzinController::class, 'index'])->name('surat-izin.index');
        Route::post('/surat-izin/{surat}/approve', [SuratIzinController::class, 'approve'])->name('surat-izin.approve');
        Route::post('/surat-izin/{surat}/reject', [SuratIzinController::class, 'reject'])->name('surat-izin.reject');

        // Opsional:
        Route::post('/surat-izin/{surat}/resync', [SuratIzinController::class, 'resync'])->name('surat-izin.resync');
        Route::post('/surat-izin/{surat}/unsync', [SuratIzinController::class, 'unsync'])->name('surat-izin.unsync');


        // Manajemen Data Master
        Route::resource('guru', GuruController::class);
        Route::resource('siswa', SiswaController::class);
        Route::resource('kelas', KelasController::class);
        Route::resource('mata-pelajaran', MataPelajaranController::class);
        Route::resource('orang-tua-wali', OrangTuaWaliController::class);
        Route::post('orang-tua-wali/{orangTuaWali}/reset-password', [OrangTuaWaliController::class, 'resetPassword'])->name('orang-tua-wali.reset-password');
        Route::resource('pengumuman', App\Http\Controllers\Admin\PengumumanController::class);

        // Fitur tambahan
        Route::post('siswa/{siswa}/keamanan', [SiswaController::class, 'updateKeamanan'])->name('siswa.update.keamanan');
        Route::post('siswa/generate-accounts', [SiswaController::class, 'generateMissingAccounts'])->name('siswa.generate-accounts');
        Route::post('guru/{guru}/register-fingerprint', [GuruController::class, 'registerFingerprint'])->name('guru.register-fingerprint');
        Route::post('guru/{guru}/generate-barcode', [GuruController::class, 'generateBarcode'])->name('guru.generate-barcode');

        // Absensi
        Route::resource('absensi-guru', AbsensiGuruController::class)->only(['index', 'store', 'show']);
        Route::get('absensi-guru/export-excel', [AbsensiGuruController::class, 'exportExcel'])->name('absensi-guru.export-excel');
        Route::get('absensi-guru/export-pdf', [AbsensiGuruController::class, 'exportPdf'])->name('absensi-guru.export-pdf');

        Route::resource('absensi-siswa', AbsensiSiswaController::class)->only(['index']);
        Route::post('absensi-siswa/store-massal', [AbsensiSiswaController::class, 'storeMassal'])->name('absensi-siswa.store.massal');
        Route::post('absensi-siswa/store-manual', [AbsensiSiswaController::class, 'storeManual'])->name('absensi-siswa.storeManual');
        Route::get('absensi-siswa/export/excel', [AbsensiSiswaController::class, 'exportExcel'])->name('absensi-siswa.export.excel');
        Route::get('absensi-siswa/export/pdf', [AbsensiSiswaController::class, 'exportPdf'])->name('absensi-siswa.export.pdf');

        Route::prefix('absensi-siswa-bulanan')->name('absensi-siswa.bulanan.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'monthly'])->name('index');
            Route::get('/export/excel', [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'exportMonthlyExcel'])->name('export.excel');
            Route::get('/export/pdf',   [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'exportMonthlyPdf'])->name('export.pdf');
        });

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

        // Absensi Siswa Mapel
        Route::prefix('absensi-siswa-mapel')->name('absensi-siswa-mapel.')->group(function () {
            Route::get('/', [AdminAbsensiSiswaMapelController::class, 'index'])->name('index');
            Route::post('/', [AdminAbsensiSiswaMapelController::class, 'store'])->name('store');
            Route::get('/manage', [AdminAbsensiSiswaMapelController::class, 'manage'])->name('manage');
            Route::post('/import', [AdminAbsensiSiswaMapelController::class, 'import'])->name('import');
            Route::get('/export', [AdminAbsensiSiswaMapelController::class, 'export'])->name('export');
            Route::get('/export-pdf', [AdminAbsensiSiswaMapelController::class, 'exportPdf'])->name('export.pdf');
            Route::get('/export-excel', [AdminAbsensiSiswaMapelController::class, 'exportExcel'])->name('export.excel');
            Route::post('/bulk-update', [AdminAbsensiSiswaMapelController::class, 'bulkUpdate'])->name('bulk_update');
            Route::post('/lock', [AdminAbsensiSiswaMapelController::class, 'lock'])->name('lock');
            Route::post('/unlock', [AdminAbsensiSiswaMapelController::class, 'unlock'])->name('unlock');
        });

        // 🆕 Modul Penilaian (Admin Only)
        Route::prefix('penilaian')->name('penilaian.')->group(function () {

            //tambahkan route untuk dashboard penilaian
            Route::get('/dashboard', [PenilaianDashboardController::class, 'index'])->name('dashboard');

            // Route::get('/', [PenilaianController::class, 'index'])->name('index');
            // Route::post('/', [PenilaianController::class, 'store'])->name('store');
            // Route::post('/{penilaian}/detail', [PenilaianController::class, 'storeDetail'])->name('detail.store');
            // Route::post('/recompute', [PenilaianController::class, 'recompute'])->name('recompute');
            // Route::get('/dashboard', [PenilaianController::class, 'dashboard'])->name('dashboard');
            //=======================================================================================
            Route::get('/nilai', [PenilaianNilaiController::class, 'index'])
                ->name('nilai.index');

            // Daftar Nilai Kelas/Mapel  → render ke Pages/admin/Penilaian/Nilai/Index.jsx
            Route::get('/penilaian', [PenilaianNilaiController::class, 'index'])
                ->name('penilaian.index');

            // Detail 1 header penilaian → render ke Pages/admin/Penilaian/Nilai/Detail.jsx
            Route::get('/nilai/{id_penilaian}', [PenilaianNilaiController::class, 'showDetail'])
                ->name('nilai.detail.show');

            // Tambah 1 komponen detail pada header
            Route::post('/nilai/{id_penilaian}/detail', [PenilaianNilaiController::class, 'storeDetail'])
                ->name('nilai.detail.store');




            // ====== API JSON untuk widget dashboard ======
            Route::get('/api/summary',          [PenilaianDashboardController::class, 'apiSummary'])->name('api.summary');
            Route::get('/api/distribution',     [PenilaianDashboardController::class, 'apiDistribution'])->name('api.distribution');
            Route::get('/api/trend',            [PenilaianDashboardController::class, 'apiTrend'])->name('api.trend');
            Route::get('/api/mapel-leaderboard', [PenilaianDashboardController::class, 'apiMapelLeaderboard'])->name('api.mapelLeaderboard');
            Route::get('/api/kelas-leaderboard', [PenilaianDashboardController::class, 'apiKelasLeaderboard'])->name('api.kelasLeaderboard');
            Route::get('/api/tuntas-breakdown', [PenilaianDashboardController::class, 'apiTuntasBreakdown'])->name('api.tuntasBreakdown');
            Route::get('/api/remedial-queue',   [PenilaianDashboardController::class, 'apiRemedialQueue'])->name('api.remedialQueue');
        });

        // =================== PENGATURAN BOBOT NILAI ===================
        Route::prefix('penilaian/bobot')->name('penilaian.bobot.')->group(function () {
            Route::get('/', [BobotNilaiMapelController::class, 'index'])->name('index');
            Route::post('/', [BobotNilaiMapelController::class, 'store'])->name('store');
            Route::put('/{id}', [BobotNilaiMapelController::class, 'update'])->name('update');
            Route::delete('/{id}', [BobotNilaiMapelController::class, 'destroy'])->name('destroy');
        });

        // =================== ANALITIK NILAI (JSON utk chart) ===================
        Route::prefix('penilaian/analitik')->name('penilaian.analitik.')->group(function () {
            Route::get('/ringkas', [AnalitikNilaiController::class, 'summary'])->name('summary');
            Route::get('/distribusi', [AnalitikNilaiController::class, 'distribution'])->name('distribution');
            Route::get('/tren', [AnalitikNilaiController::class, 'trend'])->name('trend');
            Route::get('/leaderboard-mapel', [AnalitikNilaiController::class, 'mapelLeaderboard'])->name('mapelLeaderboard');
            Route::get('/leaderboard-kelas', [AnalitikNilaiController::class, 'kelasLeaderboard'])->name('kelasLeaderboard');
            Route::get('/tuntas-breakdown', [AnalitikNilaiController::class, 'tuntasBreakdown'])->name('tuntasBreakdown');
        });

        // =================== KRITERIA & KEPUTUSAN KENAIKAN ===================
        Route::prefix('kenaikan')->name('kenaikan.')->group(function () {
            Route::get('/kriteria', [KriteriaKenaikanController::class, 'index'])->name('kriteria.index');
            Route::post('/kriteria', [KriteriaKenaikanController::class, 'store'])->name('kriteria.store');
            Route::put('/kriteria/{id}', [KriteriaKenaikanController::class, 'update'])->name('kriteria.update');
            Route::delete('/kriteria/{id}', [KriteriaKenaikanController::class, 'destroy'])->name('kriteria.destroy');

            Route::get('/keputusan', [KeputusanKenaikanController::class, 'index'])->name('keputusan.index');
            Route::post('/keputusan', [KeputusanKenaikanController::class, 'store'])->name('keputusan.store');
            Route::put('/keputusan/{id}', [KeputusanKenaikanController::class, 'update'])->name('keputusan.update');
            Route::delete('/keputusan/{id}', [KeputusanKenaikanController::class, 'destroy'])->name('keputusan.destroy');
        });

        // =================== RAPOR & REKAP ===================
        Route::prefix('rapor')->name('rapor.')->group(function () {
            Route::get('/', [RaporController::class, 'index'])->name('index'); // rekap kelas/mapel
            Route::post('/recompute', [RaporController::class, 'recompute'])->name('recompute');
            Route::get('/siswa/{id_siswa}', [RaporController::class, 'showSiswa'])->name('siswa.show');
            Route::get('/export/excel', [RaporController::class, 'exportExcel'])->name('export.excel'); // optional implementasi
            Route::get('/export/pdf', [RaporController::class, 'exportPdf'])->name('export.pdf');       // optional implementasi
        });

        // =================== REMEDIAL ===================
        Route::prefix('remedial')->name('remedial.')->group(function () {
            Route::get('/', [RemedialController::class, 'index'])->name('index');
            Route::post('/', [RemedialController::class, 'store'])->name('store');
            Route::put('/{id_remedial}', [RemedialController::class, 'update'])->name('update');
            Route::delete('/{id_remedial}', [RemedialController::class, 'destroy'])->name('destroy');
        });

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
