<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SakitIzinSubmittedNotification extends Notification
{
    use Queueable;

    protected $guruName;
    protected $status;
    protected $tanggal;
    protected $keterangan;

    public function __construct($guruName, $status, $tanggal, $keterangan)
    {
        $this->guruName = $guruName;
        $this->status = $status;
        $this->tanggal = $tanggal;
        $this->keterangan = $keterangan;
    }

    public function via($notifiable) { return ['database']; }

    public function toDatabase($notifiable)
    {
        return [
            'title' => "Pengajuan {$this->status} dari Guru",
            'message' => "Guru {$this->guruName} mengajukan {$this->status} tanggal {$this->tanggal}. Keterangan: {$this->keterangan}",
            'guru' => $this->guruName,
            'status' => $this->status,
            'tanggal' => $this->tanggal,
            'keterangan' => $this->keterangan,
        ];
    }
}
