<?php

namespace App\Listeners;

use Spatie\Backup\Events\BackupWasSuccessful;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Pengaturan;

class SendBackupToEmail implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(BackupWasSuccessful $event): void
    {
        try {
            $pengaturan = Pengaturan::find(1);

            if (!$pengaturan || !$pengaturan->notification_email_enabled || empty($pengaturan->email_administrator)) {
                Log::info("Pengiriman backup via email dibatalkan (pengaturan tidak aktif atau email admin kosong).");
                return;
            }

            // Ambil destinasi terbaru
            $destination = $event->backupDestination;
            $newestBackup = $destination->newestBackup();

            if (!$newestBackup) {
                Log::warning("Tidak ada file backup terbaru untuk dikirim.");
                return;
            }

            $backupPath = $newestBackup->path();
            $backupDisk = $destination->disk();
            $fileFullPath = $backupDisk->path($backupPath);

            $adminEmail = $pengaturan->email_administrator;

            // Kirim email dengan attachment
            Mail::raw('Terlampir adalah file backup database harian terbaru sistem ('.basename($fileFullPath).').', function ($message) use ($adminEmail, $fileFullPath) {
                $message->to($adminEmail)
                    ->subject('Backup Otomatis Database Sistem Sisab')
                    ->attach($fileFullPath);
            });

            Log::info("Backup berhasil dikirim ke email: " . $adminEmail);
        } catch (\Exception $e) {
            Log::error("Gagal mengirim backup via email: " . $e->getMessage());
        }
    }
}
