<?php

namespace App\Jobs;

use App\Models\JadwalMengajar;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Notifications\ImportReadyNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ImportJadwalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600;

    protected $userId;
    protected $data;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($userId, array $data)
    {
        $this->userId = $userId;
        $this->data = $data;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $success = 0;
        $failedCount = 0;
        $errors = [];
        
        $idTahunAjaran = TahunAjaran::where('status', 'Aktif')->value('id_tahun_ajaran');

        DB::beginTransaction();
        try {
            foreach ($this->data as $index => $row) {
                if (!isset($row['status']) || $row['status'] !== "OK") {
                    $failedCount++;
                    continue;
                }

                // Add uniqueness constraint to ID Jadwal Generation
                $idJadwal = 'JDW-' . now()->format('ymdHis') . rand(100, 999) . $index;

                JadwalMengajar::create([
                    'id_jadwal'       => $idJadwal,
                    'id_tahun_ajaran' => $idTahunAjaran,
                    'id_kelas'        => $row['id_kelas'],
                    'id_guru'         => $row['id_guru'],
                    'id_mapel'        => $row['id_mapel'],
                    'hari'            => $row['hari'],
                    'jam_mulai'       => $row['jam_mulai'],
                    'jam_selesai'     => $row['jam_selesai'],
                ]);
                $success++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $failedCount += (count($this->data) - $success);
            $errors[] = substr($e->getMessage(), 0, 200);
        }

        $user = User::where('id_pengguna', $this->userId)->first();
        if ($user) {
            $user->notify(new ImportReadyNotification('Jadwal Mengajar', $success, $failedCount, $errors));
        }
    }
}
