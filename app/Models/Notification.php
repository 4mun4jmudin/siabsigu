<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Notification extends Model
{
    // Tabel custom 'notifications'
    protected $table = 'notifications';

    // Primary key bukan auto-increment, bertipe string (CHAR(36))
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    // Jangan otomatis-cast timestamps kalau tidak perlu (kita tetap gunakan created_at)
    public $timestamps = true;

    protected $casts = [
        'data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    protected $fillable = [
        'id',
        'type',
        'notifiable_type',
        'notifiable_id',
        'data',
        'read_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Tandai notifikasi ini terbaca.
     * @return bool
     */
    public function markAsRead(): bool
    {
        if ($this->read_at) {
            return true;
        }
        $this->read_at = Carbon::now();
        return $this->save();
    }
}
