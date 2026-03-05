<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ExportReadyNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $fileName,
        public string $filePath,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title'     => 'Export Selesai',
            'message'   => "File \"{$this->fileName}\" siap diunduh.",
            'file_name' => $this->fileName,
            'file_path' => $this->filePath,
            'download_url' => route('admin.export.download', ['file' => $this->fileName]),
        ];
    }
}
