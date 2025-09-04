<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AbsenPulangTerlaluDiniNotification extends Notification
{
    use Queueable;

    protected $guruName;
    protected $jadwalJamSelesai;
    protected $waktuAttempt;

    public function __construct($guruName, $jadwalJamSelesai, $waktuAttempt)
    {
        $this->guruName = $guruName;
        $this->jadwalJamSelesai = $jadwalJamSelesai;
        $this->waktuAttempt = $waktuAttempt;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => 'Pulang Ditekan sebelum Waktu',
            'message' => "Guru {$this->guruName} menekan Absen Pulang sebelum waktu jadwal ({$this->jadwalJamSelesai}). Percobaan pada: {$this->waktuAttempt}.",
            'guru' => $this->guruName,
            'jadwal_pulang' => $this->jadwalJamSelesai,
            'attempt_at' => $this->waktuAttempt,
        ];
    }
}
