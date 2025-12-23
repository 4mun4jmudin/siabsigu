<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use App\Models\TahunAjaran;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class PengaturanController extends Controller
{
    /**
     * Menampilkan halaman pengaturan.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
        $tahun_ajaran = TahunAjaran::get();

        $total_siswa = Siswa::count();
        $total_guru = Guru::count();

        return Inertia::render('admin/Pengaturan/Index', [
            'pengaturan' => $pengaturan,
            'tahun_ajaran' => $tahun_ajaran,
            'stats' => [
                'total_siswa' => $total_siswa,
                'total_guru' => $total_guru,
            ],
            'status' => session('status'),
            'error' => session('error'),
        ]);
    }

    /**
     * Memperbarui pengaturan tab Umum.
     */
    public function updateGeneral(Request $request)
    {
        $request->validate([
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'kepala_sekolah' => 'nullable|string|max:255',
            'tahun_ajaran_aktif' => 'nullable|string|max:255',
            'semester_aktif' => 'nullable|string|max:255',
            'logo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        try {
            DB::beginTransaction();
            $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
            $dataToUpdate = $request->except(['_method', 'logo']);

            // if ($request->hasFile('logo')) {
            //     if ($pengaturan->logo_url) {
            //         $oldPath = str_replace('/storage/', 'public/', $pengaturan->logo_url);
            //         Storage::delete($oldPath);
            //     }
            //     $path = $request->file('logo')->store('logos', 'public');
            //     $dataToUpdate['logo_url'] = Storage::url($path);
            // }

            if ($request->hasFile('logo')) {
                // hapus file lama (lebih aman pakai disk public + path relatif)
                if ($pengaturan->logo_url) {
                    $old = $pengaturan->logo_url;

                    // case 1: dulu tersimpan /storage/logos/xxx.png
                    if (str_starts_with($old, '/storage/')) {
                        $relative = str_replace('/storage/', '', $old); // logos/xxx.png
                        Storage::disk('public')->delete($relative);
                    }

                    // case 2: kalau nanti tersimpan /storage-public/logos/xxx.png
                    if (str_contains($old, '/storage-public/')) {
                        $relative = urldecode(\Illuminate\Support\Str::after($old, '/storage-public/'));
                        Storage::disk('public')->delete($relative);
                    }
                }

                $path = $request->file('logo')->store('logos', 'public'); // logos/xxx.png

                // ✅ pakai route custom kamu
                $dataToUpdate['logo_url'] = route('storage.public', ['path' => $path]);
            }

            $pengaturan->update($dataToUpdate);

            LogAktivitas::create([
                'id_pengguna' => Auth::user()->id_pengguna,
                'aksi' => 'Memperbarui Pengaturan Umum',
                'keterangan' => json_encode($dataToUpdate),
            ]);
            DB::commit();
            return redirect()->back()->with('status', 'Pengaturan Umum berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal memperbarui pengaturan umum: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal memperbarui pengaturan umum. Silakan coba lagi.');
        }
    }

    /**
     * Memperbarui pengaturan tab Absensi.
     */
    public function updateAbsensi(Request $request)
    {
        $request->validate([
            'jam_masuk_siswa' => 'nullable|date_format:H:i',
            'jam_pulang_siswa' => 'nullable|date_format:H:i|after:jam_masuk_siswa',
            'jam_masuk_guru' => 'nullable|date_format:H:i',
            'jam_pulang_guru' => 'nullable|date_format:H:i|after:jam_masuk_guru',
            'batas_terlambat_siswa' => 'nullable|integer|min:0',
            'batas_terlambat_guru' => 'nullable|integer|min:0',
            'login_barcode_enabled' => 'nullable|boolean',
            'login_fingerprint_enabled' => 'nullable|boolean',
            'login_manual_enabled' => 'nullable|boolean',
            'absensi_manual_guru_enabled' => 'required|boolean',
            'lokasi_sekolah_latitude' => ['nullable', 'regex:/^[-]?(([0-8]?[0-9])\.(\d+))|(90(\.0+)?)$/'],
            'lokasi_sekolah_longitude' => ['nullable', 'regex:/^[-]?((((1[0-7][0-9])|([0-9]?[0-9]))\.(\d+))|180(\.0+)?)$/'],
            'radius_absen_meters' => 'nullable|integer|min:10',
        ]);

        DB::beginTransaction();
        $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
        $pengaturan->update($request->except('_method'));

        LogAktivitas::create([
            'id_pengguna' => Auth::user()->id_pengguna,
            'aksi' => 'Memperbarui Pengaturan Absensi',
            'keterangan' => json_encode($request->except('_method')),
        ]);
        DB::commit();
        return redirect()->back()->with('status', 'Pengaturan Absensi berhasil diperbarui.');
    }

    /**
     * Memperbarui pengaturan tab Pengguna.
     */
    public function updateUsers(Request $request)
    {
        $request->validate([
            'password_min_length' => 'nullable|integer|min:6',
            'password_require_upper' => 'nullable|boolean',
            'password_require_number' => 'nullable|boolean',
            'password_require_special' => 'nullable|boolean',
            'password_expiry_days' => 'nullable|integer|min:1',
            'auto_create_user' => 'nullable|boolean',
        ]);

        try {

            DB::beginTransaction();
            $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
            $pengaturan->update($request->except('_method'));

            LogAktivitas::create([
                'id_pengguna' => Auth::user()->id_pengguna,
                'aksi' => 'Memperbarui Pengaturan Pengguna',
                'keterangan' => json_encode($request->except('_method')),
            ]);
            DB::commit();
            return redirect()->back()->with('status', 'Pengaturan Pengguna berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal memperbarui pengaturan absensi: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal memperbarui pengaturan pengguna. Silakan coba lagi.');
        }
    }

    /**
     * Memperbarui pengaturan tab Sistem.
     */
    public function updateSystem(Request $request)
    {
        $request->validate([
            'notification_email_enabled' => 'nullable|boolean',
            'email_administrator' => 'nullable|required_if:notification_email_enabled,true|email|max:255',
            'smtp_server' => 'nullable|required_if:notification_email_enabled,true|string|max:255',
        ]);

        DB::beginTransaction();
        $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
        $pengaturan->update($request->except('_method'));

        LogAktivitas::create([
            'id_pengguna' => Auth::user()->id_pengguna,
            'aksi' => 'Memperbarui Pengaturan Sistem',
            'keterangan' => json_encode($request->except('_method')),
        ]);
        DB::commit();
        return redirect()->back()->with('status', 'Pengaturan Sistem berhasil diperbarui.');
    }

    /**
     * Memperbarui pengaturan tab Backup.
     */
    public function updateBackup(Request $request)
    {
        $request->validate([
            'backup_auto_enabled' => 'nullable|boolean',
            'backup_time' => 'nullable|date_format:H:i',
            'backup_retention_days' => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();
        $pengaturan = Pengaturan::firstOrCreate(['id' => 1]);
        $pengaturan->update($request->except('_method'));

        LogAktivitas::create([
            'id_pengguna' => Auth::user()->id_pengguna,
            'aksi' => 'Memperbarui Pengaturan Backup',
            'keterangan' => json_encode($request->except('_method')),
        ]);
        DB::commit();
        return redirect()->back()->with('status', 'Pengaturan Backup berhasil diperbarui.');
    }

    public function listBackups()
    {
        try {
            $backupName = config('backup.backup.name');
            $diskName = config('backup.backup.destination.disks')[0];

            $disk = Storage::disk($diskName);
            $directory = $backupName;

            if (!$disk->exists($directory)) {
                return response()->json(['success' => true, 'backups' => []]);
            }

            $files = collect($disk->allFiles($directory))
                ->filter(fn($path) => Str::endsWith($path, '.zip'));

            $list = $files->map(function ($path) use ($disk) {
                $timestamp = $disk->lastModified($path);
                return [
                    'path' => $path,
                    'name' => basename($path),
                    'last_modified' => date('Y-m-d H:i:s', $timestamp),
                ];
            })
                ->sortByDesc('last_modified')
                ->values()
                ->all();

            return response()->json(['success' => true, 'backups' => $list]);
        } catch (\Exception $e) {
            Log::error('Gagal mengambil daftar backup: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil daftar backup.'], 500);
        }
    }



    /**
     * Membuat backup database secara manual.
     */
    public function manualBackup()
    {
        try {
            Artisan::call('backup:run', ['--only-db' => true]);
            $output = Artisan::output();

            $lastBackupTime = now()->toDateTimeString();

            Log::info('Backup manual berhasil: ' . $output);
            LogAktivitas::create([
                'id_pengguna' => Auth::id(),
                'aksi' => 'Membuat backup database manual',
                'keterangan' => $output ?: 'Backup manual dibuat pada ' . $lastBackupTime,
            ]);

            // Kembalikan JSON dengan timestamp & output (frontend pakai last_backup)
            return response()->json([
                'success' => true,
                'message' => 'Backup database berhasil dibuat.',
                'last_backup' => $lastBackupTime,
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal membuat backup manual: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membuat backup. Silakan periksa log.'], 500);
        }
    }



    /**
     * Memulihkan database dari backup.
     */
    public function restoreDatabase(Request $request)
    {
        $request->validate([
            'backup' => 'required|string',
        ]);

        $backup = $request->input('backup');

        try {
            // Jika menggunakan paket spatie/laravel-backup yang menyediakan command restore:
            // Artisan::call('backup:restore', ['--source' => $backup]); // contoh, sesuaikan dengan paket
            // Namun banyak aplikasi tidak punya restore via artisan; sering restore dilakukan manual (mysql import)
            //
            // **Contoh sederhana fallback**: jika backup adalah SQL dump di storage/app/backups/<file.sql>,
            // kamu bisa mengimportnya ke MySQL menggunakan proses `mysql` (butuh akses shell dan keamanan!)
            // Contoh (jangan gunakan tanpa memikirkan keamanan):
            //
            // $fullPath = storage_path('app/' . $backup);
            // $dbHost = config('database.connections.mysql.host');
            // $dbDatabase = config('database.connections.mysql.database');
            // $dbUsername = config('database.connections.mysql.username');
            // $dbPassword = config('database.connections.mysql.password');
            //
            // $command = sprintf('mysql -h%s -u%s -p%s %s < %s', escapeshellarg($dbHost), escapeshellarg($dbUsername), escapeshellarg($dbPassword), escapeshellarg($dbDatabase), escapeshellarg($fullPath));
            // exec($command, $output, $returnVar);
            // if ($returnVar !== 0) throw new \Exception('Restore command failed: ' . implode("\n", $output));
            //
            // Untuk keamanan dan portable code, di sini kita kembalikan 501 jika tidak ada implementasi restore otomatis.
            //

            // Jika kamu belum punya script restore otomatis, beri respon informatif
            LogAktivitas::create([
                'id_pengguna' => Auth::id(),
                'aksi' => 'Percobaan restore database',
                'keterangan' => "Permintaan restore untuk: {$backup}",
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Restore otomatis belum diimplementasikan di server. Silakan restore secara manual atau hubungi admin.',
            ], 501);
        } catch (\Exception $e) {
            Log::error('Gagal melakukan restore database: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal melakukan restore. ' . $e->getMessage()], 500);
        }
    }

    /**
     * Membersihkan cache aplikasi.
     */
    // di PengaturanController.php
    public function clearCache()
    {
        try {
            // pilihan: bersihkan beberapa cache terkait jika perlu
            Artisan::call('cache:clear');
            // optional: Artisan::call('config:clear'); Artisan::call('route:clear'); Artisan::call('view:clear');

            LogAktivitas::create([
                'id_pengguna' => Auth::id(), // lebih aman ketimbang Auth::user()->id_pengguna
                'aksi' => 'Membersihkan cache aplikasi',
                'keterangan' => 'Perintah cache:clear berhasil dijalankan.',
            ]);

            return response()->json(['success' => true, 'message' => 'Cache aplikasi berhasil dibersihkan.']);
        } catch (\Exception $e) {
            Log::error('Gagal membersihkan cache: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membersihkan cache. Silakan periksa log server.'], 500);
        }
    }


    /**
     * Mengoptimalkan database.
     */
    public function optimizeDatabase()
    {
        try {
            $driver = DB::getDriverName();
            $optimizedCount = 0;


            if ($driver === 'mysql') {
                // Ambil semua tabel dalam database saat ini
                $tables = DB::select('SHOW TABLES');
                foreach ($tables as $row) {
                    // kolom name bisa berbeda tergantung driver; array_values mengambil nilai pertama
                    $table = array_values((array) $row)[0];
                    // Jalankan OPTIMIZE TABLE
                    DB::statement("OPTIMIZE TABLE `{$table}`");
                    $optimizedCount++;
                }


                $message = "Optimisasi MySQL selesai. Jumlah tabel dioptimalkan: {$optimizedCount}.";
            } elseif ($driver === 'pgsql') {
                // VACUUM (tanpa FULL agar tidak mengunci tabel terlalu lama)
                DB::statement('VACUUM');
                $message = 'VACUUM dijalankan pada PostgreSQL database.';
            } else {
                // Fallback: jalankan perintah optimize artisan (tidak selalu melakukan optimasi DB)
                Artisan::call('optimize');
                $message = "Perintah artisan optimize dijalankan (fallback untuk driver: {$driver}).";
            }


            LogAktivitas::create([
                'id_pengguna' => Auth::id(),
                'aksi' => 'Mengoptimalkan database',
                'keterangan' => $message,
            ]);


            return response()->json(['success' => true, 'message' => $message, 'driver' => $driver]);
        } catch (\Exception $e) {
            Log::error('Gagal mengoptimalkan database: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengoptimalkan database. ' . $e->getMessage()], 500);
        }
    }
}
