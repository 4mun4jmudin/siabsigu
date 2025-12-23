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

// Panel Guru
use App\Http\Controllers\Guru\DashboardController as GuruDashboardController;
use App\Http\Controllers\Guru\AbsensiSiswaController as GuruAbsensiSiswaController;
use App\Http\Controllers\Guru\AbsensiSiswaMapelController;
use App\Http\Controllers\Guru\AbsensiHarianController;
use App\Http\Controllers\Guru\JadwalController;
// use pindahkan ke sini untuk absesi siswa per mapel
use App\Http\Controllers\Guru\AbsensiSiswaMapelController as GuruAbsensiSiswaMapelController;

// Panel Orang Tua
use App\Http\Controllers\OrangTua\DashboardController;
use App\Http\Controllers\OrangTua\ProfileController as OrangTuaProfileController;
use App\Http\Controllers\OrangTua\AbsensiController;
use App\Http\Controllers\OrangTua\NotificationController as OrangTuaNotificationController;

// Notifikasi umum
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\AbsensiSiswaMapelController as AdminAbsensiSiswaMapelController;
use Illuminate\Http\Request;

// Modul Penilaian (Admin)
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

// Akun Siswa
// use App\Http\Controllers\Siswa\AccountController;
use App\Http\Controllers\Siswa\AccountController as SiswaAccountController;


use Illuminate\Support\Facades\Storage;

// ------------- PUBLIC STORAGE ROUTE (untuk foto profil, dll) -------------
Route::get('/storage-public/{path}', function (string $path) {
    // dari JS akan di-encode, jadi decode dulu
    $path = urldecode($path);

    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('storage.public');


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Halaman Utama
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// ✅ FIX 1: Smart dashboard redirect based on user level
// Mengubah dari hardcoded admin dashboard menjadi smart redirect
Route::middleware('auth')->get('/dashboard', function () {
    $user = auth()->user();
    if (!$user) {
        return redirect('/login');
    }
    
    return match(strtolower($user->level)) {
        'admin'    => redirect()->route('admin.dashboard'),
        'guru'     => redirect()->route('guru.dashboard'),
        'siswa'    => redirect()->route('siswa.dashboard'),
        'orang tua'=> redirect()->route('orangtua.dashboard'),
        default    => redirect('/')->with('error', 'Level pengguna tidak dikenali'),
    };
})->name('dashboard');

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
| Grup rute yang memerlukan autentikasi
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    // Notifikasi
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/mark-all', [NotificationController::class, 'markAllRead'])->name('notifications.markAll');

    // Profil
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

        Route::get('/akun', [SiswaAccountController::class, 'edit'])->name('akun.edit');
        Route::post('/akun/update-profile', [SiswaAccountController::class, 'updateProfile'])->name('akun.update-profile');

        Route::get('/akun/edit-foto', [SiswaAccountController::class, 'editPhoto'])->name('akun.edit-foto');
        Route::post('/akun/update-foto', [SiswaAccountController::class, 'updatePhoto'])->name('akun.update-foto');

        Route::post('/akun/update-password', [SiswaAccountController::class, 'updatePassword'])->name('akun.update-password');
    });


    /*
    |--------------------------------------------------------------------------
    | PANEL ORANG TUA
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'check.level:Orang Tua'])
        ->prefix('orangtua')->name('orangtua.')->group(function () {
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
        // Halaman
        Route::get('/dashboard', [GuruDashboardController::class, 'index'])->name('dashboard');

        Route::get('/absensi-mapel', [AbsensiSiswaMapelController::class, 'index'])->name('absensi-mapel.index');
        Route::get('/absensi-mapel/{id_jadwal}', [AbsensiSiswaMapelController::class, 'show'])->name('absensi-mapel.show');
        Route::post('/absensi-mapel', [AbsensiSiswaMapelController::class, 'store'])->name('absensi-mapel.store');

        Route::get('/absensi-harian', [AbsensiHarianController::class, 'index'])->name('absensi-harian.index');
        Route::post('/absensi-harian', [AbsensiHarianController::class, 'store'])->name('absensi-harian.store');
        Route::post('/absensi-harian/izin', [AbsensiHarianController::class, 'submitIzin'])->name('absensi-harian.izin');

        Route::resource('/jadwal', App\Http\Controllers\Guru\JadwalController::class);
        Route::get('/jadwal/export/ical', [JadwalController::class, 'exportIcal'])->name('jadwal.export.ical');

        Route::get('/siswa', [App\Http\Controllers\Guru\SiswaController::class, 'index'])->name('siswa.index');
        Route::get('/siswa/{siswa}', [App\Http\Controllers\Guru\SiswaController::class, 'show'])->name('siswa.show');

        Route::get('/laporan', [App\Http\Controllers\Guru\LaporanController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/export-excel', [App\Http\Controllers\Guru\LaporanController::class, 'exportExcel'])->name('laporan.exportExcel');
        Route::get('/laporan/preview-pdf', [App\Http\Controllers\Guru\LaporanController::class, 'previewPdf'])->name('laporan.previewPdf');

        Route::resource('/jurnal', App\Http\Controllers\Guru\JurnalMengajarController::class);
        Route::post('/jurnal/quick-entry', [App\Http\Controllers\Guru\JurnalMengajarController::class, 'storeQuickEntry'])->name('jurnal.quick_entry');


        Route::post('/{id_jadwal}/prefill', [GuruAbsensiSiswaMapelController::class, 'refreshPrefill'])->name('prefill');
        Route::get('/{id_jadwal}/export/meeting', [GuruAbsensiSiswaMapelController::class, 'exportMeeting'])->name('export.meeting');
        Route::get('/{id_jadwal}/export/monthly', [GuruAbsensiSiswaMapelController::class, 'exportMonthly'])->name('export.monthly');


        /*
        |----------------------------------------------------------------------
        |  API DASHBOARD GURU (widget data)
        |  Base URL: /guru/api/...
        |----------------------------------------------------------------------
        */
        Route::prefix('api')->name('api.')->group(function () {
            // Stat Kehadiran Pribadi
            Route::get('/kehadiran_counts', [GuruDashboardController::class, 'kehadiranCounts'])->name('kehadiran_counts');

            // Rekap Kehadiran Siswa (kelas diampu)
            Route::get('/classes/attendance_summary', [GuruDashboardController::class, 'classesAttendanceSummary'])->name('classes.attendance_summary');
            Route::get('/classes/attendance_by_class', [GuruDashboardController::class, 'attendanceByClass'])->name('classes.attendance_by_class');

            // Jadwal hari ini + ringkas absen siswa
            Route::get('/schedule/today', [GuruDashboardController::class, 'scheduleToday'])->name('schedule.today');

            // Riwayat singkat
            Route::get('/attendance_history/recent', [GuruDashboardController::class, 'attendanceHistoryRecent'])->name('attendance_history.recent');

            // Notifikasi / reminder
            Route::get('/notifications', [GuruDashboardController::class, 'notifications'])->name('notifications');

            // Tren kehadiran (opsional)
            Route::get('/attendance_trend', [GuruDashboardController::class, 'attendanceTrend'])->name('attendance_trend');

            // Calendar heatmap (opsional)
            Route::get('/attendance_calendar', [GuruDashboardController::class, 'attendanceCalendar'])->name('attendance_calendar');

            // Ranking siswa (opsional) — dua alias + 1 generic
            Route::get('/students/top_present', function (Request $r) {
                return app(GuruDashboardController::class)->studentsRanking($r, 'top');
            })->name('students.top_present');

            Route::get('/students/bottom_present', function (Request $r) {
                return app(GuruDashboardController::class)->studentsRanking($r, 'bottom');
            })->name('students.bottom_present');

            Route::get('/students/{type}', function (Request $r, string $type) {
                $type = $type === 'bottom' ? 'bottom' : 'top';
                return app(GuruDashboardController::class)->studentsRanking($r, $type);
            })->where('type', 'top|bottom')->name('students.ranking');

            // Pending leave/izin (opsional)
            Route::get('/leave_requests/pending', [GuruDashboardController::class, 'pendingLeaveRequests'])->name('leave_requests.pending');

            // Insights ringkas (opsional)
            Route::get('/insights', [GuruDashboardController::class, 'insights'])->name('insights');

            // Quick actions
            Route::post('/attendance/checkin', [GuruDashboardController::class, 'checkin'])->name('attendance.checkin');
            Route::post('/attendance/checkout', [GuruDashboardController::class, 'checkout'])->name('attendance.checkout');
        });

        // Route::post('/absensi-mapel/prefill', [\App\Http\Controllers\Guru\AbsensiSiswaMapelController::class, 'prefill'])->name('absensi-mapel.prefill');
    });

    /*
    |--------------------------------------------------------------------------
    | PANEL ADMIN
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->middleware('check.level:Admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::post('/mode', function (Request $request) {
            $request->validate(['mode' => 'required|in:absensi,full']);
            $request->session()->put('admin_mode', $request->input('mode'));
            return back()->with('success', 'Mode diperbarui ke: ' . ucfirst($request->input('mode')));
        })->name('mode.update');

        // Surat Izin
        Route::get('/surat-izin/create', [SuratIzinController::class, 'create'])->name('surat-izin.create');
        Route::post('/surat-izin', [SuratIzinController::class, 'store'])->name('surat-izin.store');
        Route::get('/surat-izin', [SuratIzinController::class, 'index'])->name('surat-izin.index');
        Route::post('/surat-izin/{surat}/approve', [SuratIzinController::class, 'approve'])->name('surat-izin.approve');
        Route::post('/surat-izin/{surat}/reject', [SuratIzinController::class, 'reject'])->name('surat-izin.reject');
        Route::post('/surat-izin/{surat}/resync', [SuratIzinController::class, 'resync'])->name('surat-izin.resync');
        Route::post('/surat-izin/{surat}/unsync', [SuratIzinController::class, 'unsync'])->name('surat-izin.unsync');

        // Master Data
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

        // Absensi Guru
        Route::resource('absensi-guru', AbsensiGuruController::class)->only(['index', 'store', 'show']);
        Route::get('absensi-guru/export-excel', [AbsensiGuruController::class, 'exportExcel'])->name('absensi-guru.export-excel');
        Route::get('absensi-guru/export-pdf', [AbsensiGuruController::class, 'exportPdf'])->name('absensi-guru.export-pdf');

        // Absensi Siswa (harian)
        Route::resource('absensi-siswa', AbsensiSiswaController::class)->only(['index']);
        Route::post('absensi-siswa/store-massal', [AbsensiSiswaController::class, 'storeMassal'])->name('absensi-siswa.store.massal');
        Route::post('absensi-siswa/store-manual', [AbsensiSiswaController::class, 'storeManual'])->name('absensi-siswa.storeManual');
        Route::get('absensi-siswa/export/excel', [AbsensiSiswaController::class, 'exportExcel'])->name('absensi-siswa.export.excel');
        Route::get('absensi-siswa/export/pdf', [AbsensiSiswaController::class, 'exportPdf'])->name('absensi-siswa.export.pdf');

        // Absensi Siswa Bulanan
        Route::prefix('absensi-siswa-bulanan')->name('absensi-siswa.bulanan.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'monthly'])->name('index');
            Route::get('/export/excel', [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'exportMonthlyExcel'])->name('export.excel');
            Route::get('/export/pdf', [\App\Http\Controllers\Admin\AbsensiSiswaController::class, 'exportMonthlyPdf'])->name('export.pdf');
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

        // Absensi Siswa per Mapel (Admin)
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

        /*
        |--------------------------------------------------------------------------
        | MODUL PENILAIAN (Admin Only)
        |--------------------------------------------------------------------------
        */
        Route::prefix('penilaian')->name('penilaian.')->group(function () {
            Route::get('/dashboard', [PenilaianDashboardController::class, 'index'])->name('dashboard');

            Route::get('/nilai', [PenilaianNilaiController::class, 'index'])->name('nilai.index');
            Route::get('/penilaian', [PenilaianNilaiController::class, 'index'])->name('penilaian.index');
            Route::get('/nilai/{id_penilaian}', [PenilaianNilaiController::class, 'showDetail'])->name('nilai.detail.show');
            Route::post('/nilai/{id_penilaian}/detail', [PenilaianNilaiController::class, 'storeDetail'])->name('nilai.detail.store');

            // API widget dashboard penilaian
            Route::get('/api/summary', [PenilaianDashboardController::class, 'apiSummary'])->name('api.summary');
            Route::get('/api/distribution', [PenilaianDashboardController::class, 'apiDistribution'])->name('api.distribution');
            Route::get('/api/trend', [PenilaianDashboardController::class, 'apiTrend'])->name('api.trend');
            Route::get('/api/mapel-leaderboard', [PenilaianDashboardController::class, 'apiMapelLeaderboard'])->name('api.mapelLeaderboard');
            Route::get('/api/kelas-leaderboard', [PenilaianDashboardController::class, 'apiKelasLeaderboard'])->name('api.kelasLeaderboard');
            Route::get('/api/tuntas-breakdown', [PenilaianDashboardController::class, 'apiTuntasBreakdown'])->name('api.tuntasBreakdown');
            Route::get('/api/remedial-queue', [PenilaianDashboardController::class, 'apiRemedialQueue'])->name('api.remedialQueue');
        });

        // Pengaturan Bobot Nilai
        Route::prefix('penilaian/bobot')->name('penilaian.bobot.')->group(function () {
            Route::get('/', [BobotNilaiMapelController::class, 'index'])->name('index');
            Route::post('/', [BobotNilaiMapelController::class, 'store'])->name('store');
            Route::put('/{id}', [BobotNilaiMapelController::class, 'update'])->name('update');
            Route::delete('/{id}', [BobotNilaiMapelController::class, 'destroy'])->name('destroy');
        });

        // Analitik Nilai (JSON)
        Route::prefix('penilaian/analitik')->name('penilaian.analitik.')->group(function () {
            Route::get('/ringkas', [AnalitikNilaiController::class, 'summary'])->name('summary');
            Route::get('/distribusi', [AnalitikNilaiController::class, 'distribution'])->name('distribution');
            Route::get('/tren', [AnalitikNilaiController::class, 'trend'])->name('trend');
            Route::get('/leaderboard-mapel', [AnalitikNilaiController::class, 'mapelLeaderboard'])->name('mapelLeaderboard');
            Route::get('/leaderboard-kelas', [AnalitikNilaiController::class, 'kelasLeaderboard'])->name('kelasLeaderboard');
            Route::get('/tuntas-breakdown', [AnalitikNilaiController::class, 'tuntasBreakdown'])->name('tuntasBreakdown');
        });

        // Kriteria & Keputusan Kenaikan
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

        // Rapor & Rekap
        Route::prefix('rapor')->name('rapor.')->group(function () {
            Route::get('/', [RaporController::class, 'index'])->name('index');
            Route::post('/recompute', [RaporController::class, 'recompute'])->name('recompute');
            Route::get('/siswa/{id_siswa}', [RaporController::class, 'showSiswa'])->name('siswa.show');
            Route::get('/export/excel', [RaporController::class, 'exportExcel'])->name('export.excel');
            Route::get('/export/pdf', [RaporController::class, 'exportPdf'])->name('export.pdf');
        });

        // Remedial
        Route::prefix('remedial')->name('remedial.')->group(function () {
            Route::get('/', [RemedialController::class, 'index'])->name('index');
            Route::post('/', [RemedialController::class, 'store'])->name('store');
            Route::put('/{id_remedial}', [RemedialController::class, 'update'])->name('update');
            Route::delete('/{id_remedial}', [RemedialController::class, 'destroy'])->name('destroy');
        });

        // Laporan (Umum)
        Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
        Route::get('/laporan/export-pdf', [LaporanController::class, 'exportPdf'])->name('laporan.export.pdf');
        Route::get('/laporan/export-excel', [LaporanController::class, 'exportExcel'])->name('laporan.export.excel');
        Route::get('/laporan/detail-harian', [LaporanController::class, 'getDetailHarian'])->name('laporan.detailHarian');

        // Pengaturan Sistem
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

// Login siswa
Route::get('login/siswa', [SiswaLoginController::class, 'create'])->name('login.siswa');
Route::post('login/siswa', [SiswaLoginController::class, 'store'])->name('login.siswa.store');

require __DIR__ . '/auth.php';
