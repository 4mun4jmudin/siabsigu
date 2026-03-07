<?php

namespace App\Jobs;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Kelas;
use App\Notifications\ImportReadyNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ImportSiswaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 3600;

    protected $userId;
    protected $dataRows;
    protected $mappings;
    protected $timezone;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($userId, array $dataRows, array $mappings, $timezone = 'Asia/Jakarta')
    {
        $this->userId = $userId;
        $this->dataRows = $dataRows; // Array yang sudah di-parse dari Excel/CSV, max 1000-2000 row agar tidak payload too large (jika lebih, baiknya logic baca file ditaruh di dalam job ini)
        $this->mappings = $mappings;
        $this->timezone = $timezone;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $success = 0;
        $failed = 0;
        $errors = [];
        $rowNumber = 1; // Mulai dari baris data pertama (tanpa header)

        // Cache kelas untuk mengurangi load database query di dalam loop
        $kelasCache = Kelas::all()->mapWithKeys(function ($k) {
            $keyExact = strtoupper($k->tingkat . ' ' . $k->jurusan);
            $keyJurusan = strtoupper($k->jurusan);
            return [
                $keyExact => $k->id_kelas,
                $keyJurusan => $k->id_kelas, // fallback
                $k->tingkat . '|' . $k->jurusan => $k->id_kelas 
            ];
        })->toArray();

        foreach ($this->dataRows as $data) {
            $rowNumber++;

            // Abaikan baris kosong
            if (empty(array_filter($data, function($val) { return !is_null($val) && $val !== ''; }))) {
                continue;
            }

            try {
                $getVal = fn($key) => isset($this->mappings[$key]) && isset($data[$this->mappings[$key]]) ? trim((string)$data[$this->mappings[$key]]) : null;

                $nis = $getVal('nis');
                $nama = $getVal('nama_lengkap');
                $kelasRaw = $getVal('kelas');

                if (!$nis || !$nama) {
                    throw new \Exception("NIS atau Nama kosong.");
                }

                if (Siswa::where('nis', $nis)->exists()) {
                    throw new \Exception("NIS $nis sudah terdaftar.");
                }

                $idKelas = null;
                if ($kelasRaw) {
                    $kelasSearch = strtoupper(trim($kelasRaw));
                    if (isset($kelasCache[$kelasSearch])) {
                        $idKelas = $kelasCache[$kelasSearch];
                    } else {
                        // Fallback search
                        $parts = explode(' ', $kelasSearch, 2);
                        if (count($parts) == 2) {
                            foreach ($kelasCache as $key => $val) {
                                if (str_starts_with($key, $parts[0] . '|') && str_contains($key, $parts[1])) {
                                    $idKelas = $val;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!$idKelas) {
                    throw new \Exception("Kelas '$kelasRaw' tidak ditemukan di database.");
                }

                $jkRaw = strtoupper($getVal('jenis_kelamin'));
                $jk = ($jkRaw === 'P' || $jkRaw === 'PEREMPUAN') ? 'Perempuan' : 'Laki-laki';

                $tglLahir = now($this->timezone);
                $tglRaw = $getVal('tanggal_lahir');
                if ($tglRaw) {
                    try {
                        if (is_numeric($tglRaw)) {
                            $tglLahir = Date::excelToDateTimeObject($tglRaw);
                        } else {
                            $tglLahir = Carbon::parse($tglRaw);
                        }
                    } catch (\Exception $e) {}
                }

                $idSiswaBaru = Str::random(20);

                DB::transaction(function () use ($idSiswaBaru, $nis, $getVal, $nama, $idKelas, $jk, $tglLahir) {
                    Siswa::create([
                        'id_siswa' => $idSiswaBaru, 
                        'nis' => $nis,
                        'nisn' => $getVal('nisn') ?? '-',
                        'nama_lengkap' => $nama,
                        'id_kelas' => $idKelas,
                        'jenis_kelamin' => $jk,
                        'tempat_lahir' => $getVal('tempat_lahir') ?? '-',
                        'tanggal_lahir' => $tglLahir,
                        'nik' => $getVal('nik') ?? null,
                        'nomor_kk' => $getVal('nomor_kk') ?? '-',
                        'agama' => $getVal('agama') ?? 'Islam',
                        'alamat_lengkap' => $getVal('alamat_lengkap') ?? '-',
                        'status' => 'Aktif'
                    ]);

                    if (!User::where('username', $nis)->exists()) {
                        User::create([
                            'nama_lengkap' => $nama,
                            'username' => $nis,
                            'password' => Hash::make($nis),
                            'level' => 'Siswa',
                        ]);
                    }
                });

                $success++;
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "Baris $rowNumber: " . $e->getMessage();
            }
        }

        // Kirim notifikasi
        $user = User::where('id_pengguna', $this->userId)->first();
        if ($user) {
            $user->notify(new ImportReadyNotification('Data Siswa', $success, $failed, $errors));
        }
    }
}
