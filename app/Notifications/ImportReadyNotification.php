<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class ImportReadyNotification extends Notification
{
    use Queueable;

    protected $entityName;
    protected $successCount;
    protected $failedCount;
    protected $errors;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(string $entityName, int $successCount, int $failedCount, array $errors = [])
    {
        $this->entityName = $entityName;
        $this->successCount = $successCount;
        $this->failedCount = $failedCount;
        // Hanya ambil 10 error pertama agar tak penuh payload notif
        $this->errors = array_slice($errors, 0, 10); 
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database']; // Atau ['database', 'broadcast'] jika punya frontend websocket
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toDatabase($notifiable)
    {
        $message = "Proses import {$this->entityName} selesai.";
        $description = "Berhasil: {$this->successCount}, Gagal: {$this->failedCount}.";
        
        if ($this->failedCount > 0) {
            $description .= " Silakan periksa log atau email untuk detail baris yang gagal.";
        }

        return [
            'type'        => 'import_ready',
            'message'     => $message,
            'description' => $description,
            'errors'      => $this->errors,
            'time'        => now()->toDateTimeString(),
        ];
    }
}
