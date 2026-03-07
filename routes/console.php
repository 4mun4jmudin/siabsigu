<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Pengaturan;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwal Backup Otomatis
try {
    $pengaturan = Pengaturan::find(1);
    
    if ($pengaturan && $pengaturan->backup_auto_enabled && $pengaturan->backup_time) {
        // Ambil jam dan menit dari backup_time ("HH:ii")
        $timeParts = explode(':', $pengaturan->backup_time);
        
        if (count($timeParts) == 2) {
            $formattedTime = current($timeParts) . ':' . end($timeParts);
            
            // Jadwalkan spatie-laravel-backup
            Schedule::command('backup:run --only-db')
                ->dailyAt($formattedTime)
                ->withoutOverlapping()
                ->appendOutputTo(storage_path('logs/backup-schedule.log'));
                
            // Jadwalkan pembersihan (retention)
            Schedule::command('backup:clean')
                ->dailyAt($formattedTime)
                ->withoutOverlapping()
                ->appendOutputTo(storage_path('logs/backup-clean.log'));
        }
    }
} catch (\Exception $e) {
    // Abaikan jika database belum siap saat di-boot
    Log::warning("Gagal memuat jadwal backup dari database: " . $e->getMessage());
}
