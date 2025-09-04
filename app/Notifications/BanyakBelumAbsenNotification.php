<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BanyakBelumAbsenNotification extends Notification
{
    use Queueable;

    protected $count;
    protected $tanggal;

    public function __construct($count, $tanggal)
    {
        $this->count = $count;
        $this->tanggal = $tanggal;
    }

    public function via($notifiable) { return ['database']; }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Banyak Guru Belum Absen',
            'message' => "Ada {$this->count} guru yang belum absen pada tanggal {$this->tanggal}. Mohon ditindaklanjuti.",
            'count' => $this->count,
            'tanggal' => $this->tanggal,
        ];
    }
}
