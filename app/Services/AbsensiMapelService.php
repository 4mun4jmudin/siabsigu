<?php

namespace App\Services;

use App\Models\AbsensiSiswa;
use App\Models\AbsensiSiswaMapel;
use App\Models\JadwalMengajar;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AbsensiMapelService
{
    /**
     * Prefill dari Absensi Harian:
     * - Buat/Update record per-mapel untuk setiap siswa kelas pada tanggal tsb
     * - Hanya sync baris yang TIDAK di-override (is_overridden = 0)
     * - Set source_status = 'daily', derived_at = now()
     * - Jam mengikuti jadwal
     */
    public function prefillFromDaily(string $tanggal, JadwalMengajar $jadwal): array
    {
        $tanggal = Carbon::parse($tanggal)->toDateString();

        // roster siswa
        $siswaList = Siswa::where('id_kelas', $jadwal->id_kelas)
            ->where('status', 'Aktif')
            ->get(['id_siswa']);

        if ($siswaList->isEmpty()) {
            return ['created' => 0, 'updated' => 0];
        }

        $siswaIds = $siswaList->pluck('id_siswa')->all();

        // ambil absensi harian siswa (map id_siswa => status_kehadiran harian)
        $harianMap = AbsensiSiswa::whereIn('id_siswa', $siswaIds)
            ->whereDate('tanggal', $tanggal)
            ->get(['id_siswa', 'status_kehadiran'])
            ->keyBy('id_siswa');

        // ambil record mapel existing untuk jadwal + tanggal ini
        $existingMapel = AbsensiSiswaMapel::where('id_jadwal', $jadwal->id_jadwal)
            ->whereDate('tanggal', $tanggal)
            ->get()
            ->keyBy('id_siswa');

        $created = 0;
        $updated = 0;

        DB::beginTransaction();
        try {
            foreach ($siswaIds as $id_siswa) {
                $daily = $harianMap->get($id_siswa)?->status_kehadiran;
                $defaultStatus = $this->mapDailyToMapel($daily);

                $current = $existingMapel->get($id_siswa);

                // generate primary key
                $id_absensi_mapel = 'AM-' . Carbon::parse($tanggal)->format('ymd') . '-' . $jadwal->id_jadwal . '-' . $id_siswa;

                if ($current) {
                    // sync HANYA jika belum di-override
                    if (!$current->is_overridden) {
                        $current->update([
                            'status_kehadiran' => $defaultStatus,
                            'jam_mulai'        => $jadwal->jam_mulai,
                            'jam_selesai'      => $jadwal->jam_selesai,
                            'source_status'    => 'daily',
                            'derived_at'       => now(),
                        ]);
                        $updated++;
                    }
                } else {
                    AbsensiSiswaMapel::create([
                        'id_absensi_mapel' => $id_absensi_mapel,
                        'id_jadwal'        => $jadwal->id_jadwal,
                        'id_siswa'         => $id_siswa,
                        'tanggal'          => $tanggal,
                        'jam_mulai'        => $jadwal->jam_mulai,
                        'jam_selesai'      => $jadwal->jam_selesai,
                        'status_kehadiran' => $defaultStatus,
                        // 'metode_absen'     => 'Sync', // penanda diisi otomatis
                        'is_overridden'    => 0,
                        'source_status'    => 'daily',
                        'derived_at'       => now(),
                    ]);
                    $created++;
                }
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * Map status harian → default status per mapel
     */
    public function mapDailyToMapel(?string $harian): string
    {
        $harian = $harian ? trim($harian) : null;
        return match ($harian) {
            'Hadir'         => 'Hadir',
            'Izin'          => 'Izin',
            'Sakit'         => 'Sakit',
            'Alfa'          => 'Alfa',
            'Tugas', 'DL', 'Dinas Luar' => 'Tugas_Mapel', // opsional: mapping DL/Tugas
            default         => 'Belum Absen',
        };
    }

    /**
     * Menandai override (manual).
     * - Jika status baru sama dengan default harian → hapus override (is_overridden=0, source_status='daily')
     * - Jika status baru beda → set override (is_overridden=1, source_status='manual', overridden_by, overridden_at)
     */
    public function overrideStatus(
        AbsensiSiswaMapel $row,
        string $statusBaru,
        ?string $harianStatus,
        string $overriddenByUserId,
        ?int $menitTelatMapel = null,
        ?string $keterangan = null
    ): void {
        $default = $this->mapDailyToMapel($harianStatus);
        $isOverride = ($statusBaru !== $default);

        $payload = [
            'status_kehadiran'     => $statusBaru,
            'keterangan'           => $keterangan,
            'menit_terlambat_mapel'=> $menitTelatMapel,
        ];

        if ($isOverride) {
            $payload += [
                'is_overridden'  => 1,
                'source_status'  => 'manual',
                'overridden_by'  => $overriddenByUserId,
                'overridden_at'  => now(),
            ];
        } else {
            // kembali mengikuti harian
            $payload += [
                'is_overridden'  => 0,
                'source_status'  => 'daily',
                'overridden_by'  => null,
                'overridden_at'  => null,
            ];
        }

        $row->update($payload);
    }

    
}
