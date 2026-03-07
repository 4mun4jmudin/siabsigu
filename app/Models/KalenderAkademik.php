<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KalenderAkademik extends Model
{
    protected $table = 'tbl_kalender_akademik';
    protected $primaryKey = 'id_kalender';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_kalender',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
        'jenis_libur',
    ];

    /**
     * Cek apakah sebuah tanggal (Carbon) adalah hari libur di Kalender Akademik.
     */
    public static function isHoliday(\Carbon\Carbon $date): bool
    {
        return self::where('tanggal_mulai', '<=', $date->toDateString())
            ->where('tanggal_selesai', '>=', $date->toDateString())
            ->exists();
    }

    /**
     * Menghitung jumlah hari libur yang jatuh pada hari kerja (Senin-Jumat) dalam rentang tanggal.
     */
    public static function getWorkingDaysHolidayCount(\Carbon\Carbon $start, \Carbon\Carbon $end): int
    {
        $holidays = self::where(function ($q) use ($start, $end) {
                // Beririsan dengan rentang $start - $end
                $q->whereBetween('tanggal_mulai', [$start->toDateString(), $end->toDateString()])
                  ->orWhereBetween('tanggal_selesai', [$start->toDateString(), $end->toDateString()])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('tanggal_mulai', '<=', $start->toDateString())
                         ->where('tanggal_selesai', '>=', $end->toDateString());
                  });
            })->get();

        if ($holidays->isEmpty()) return 0;

        $holidayDates = [];
        foreach ($holidays as $h) {
            $hStart = \Carbon\Carbon::parse($h->tanggal_mulai)->max($start);
            $hEnd = \Carbon\Carbon::parse($h->tanggal_selesai)->min($end);

            $cursor = $hStart->copy();
            while ($cursor->lte($hEnd)) {
                if (!$cursor->isWeekend()) {
                    $holidayDates[$cursor->toDateString()] = true;
                }
                $cursor->addDay();
            }
        }

        return count($holidayDates);
    }
}
