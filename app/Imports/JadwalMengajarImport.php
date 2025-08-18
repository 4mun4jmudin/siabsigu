<?php

namespace App\Imports;

use App\Models\JadwalMengajar;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class JadwalMengajarImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    private $tahunAjaranAktif;
    private $failures = [];
    private $importedCount = 0;

    public function __construct()
    {
        $this->tahunAjaranAktif = TahunAjaran::where('status', 'Aktif')->first();
    }

    public function collection(Collection $rows)
    {
        if (!$this->tahunAjaranAktif) {
            $this->failures[] = [
                'row' => 1,
                'errors' => ['Tidak ada tahun ajaran yang berstatus Aktif. Mohon atur di menu Pengaturan.'],
            ];
            return;
        }

        foreach ($rows as $index => $row) {
            $rowIndex = $index + 2;

            // --- Langkah Pembersihan dan Normalisasi Data ---
            $cleanedData = $this->cleanData($row->toArray());

            // Lakukan validasi data yang sudah dibersihkan
            $validator = Validator::make($cleanedData, [
                'hari' => ['required', 'string', Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])],
                'jam_mulai' => 'required|date_format:H:i',
                'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
                'id_kelas' => 'required|string|exists:tbl_kelas,id_kelas',
                'id_guru' => 'required|string|exists:tbl_guru,id_guru',
                'id_mapel' => 'required|string|exists:tbl_mata_pelajaran,id_mapel',
            ], [
                'id_kelas.exists' => 'Kode Kelas tidak ditemukan.',
                'id_guru.exists' => 'NIP Guru tidak ditemukan.',
                'id_mapel.exists' => 'Kode Mapel tidak ditemukan.',
            ]);

            if ($validator->fails()) {
                $this->failures[] = [
                    'row' => $rowIndex,
                    'errors' => $validator->errors()->all(),
                    'values' => $row->toArray(),
                ];
                continue;
            }

            try {
                JadwalMengajar::create([
                    'id_jadwal' => 'JDW-' . now()->format('ymdHis') . $rowIndex . rand(10, 99),
                    'id_tahun_ajaran' => $this->tahunAjaranAktif->id_tahun_ajaran,
                    'id_kelas' => $cleanedData['id_kelas'],
                    'id_guru' => $cleanedData['id_guru'],
                    'id_mapel' => $cleanedData['id_mapel'],
                    'hari' => $cleanedData['hari'],
                    'jam_mulai' => $cleanedData['jam_mulai'],
                    'jam_selesai' => $cleanedData['jam_selesai'],
                ]);
                $this->importedCount++;
            } catch (\Exception $e) {
                $this->failures[] = [
                    'row' => $rowIndex,
                    'errors' => ['Terjadi kesalahan saat menyimpan data: ' . $e->getMessage()],
                    'values' => $row->toArray(),
                ];
            }
        }
    }

    // Fungsi pembantu untuk membersihkan dan menormalisasi data
    // private function cleanData(array $row): array
    // {
    //     $cleaned = [];
    //     // Normalisasi format jam
    //     $cleaned['jam_mulai'] = $this->normalizeTime($row['jam_mulai'] ?? null);
    //     $cleaned['jam_selesai'] = $this->normalizeTime($row['jam_selesai'] ?? null);

    //     // Normalisasi kode/NIP (hapus spasi, pastikan string)
    //     $cleaned['hari'] = trim($row['hari'] ?? '');
    //     $cleaned['id_kelas'] = $this->findIdByCode(Kelas::class, 'id_kelas', 'kode_kelas', $row['kode_kelas'] ?? '');
    //     $cleaned['id_guru'] = $this->findIdByCode(Guru::class, 'id_guru', 'nip', $row['nip_guru'] ?? '');
    //     $cleaned['id_mapel'] = $this->findIdByCode(MataPelajaran::class, 'id_mapel', 'kode_mapel', $row['kode_mapel'] ?? '');

    //     return $cleaned;
    // }

    // Fungsi untuk menormalkan string waktu ke format H:i
    private function normalizeTime($timeStr): ?string
    {
        if (!$timeStr) return null;
        try {
            // Tangani berbagai format jam (misal: 8:00, 8.00, 8:00:00)
            if (is_numeric($timeStr)) {
                $timeStr = number_format($timeStr * 24, 2, ':', '');
            }
            $carbon = Carbon::parse($timeStr);
            return $carbon->format('H:i');
        } catch (\Exception $e) {
            return null; // Akan gagal validasi
        }
    }

    // Fungsi untuk mencari ID dari kode unik di tabel master
    private function findIdByCode($modelClass, $idColumn, $codeColumn, $code): ?string
    {
        $code = trim(strval($code));
        if (empty($code)) return null;

        // Perbaikan: Ubah nama kolom yang dicari agar sesuai dengan tabel
        if ($modelClass === Kelas::class) {
            $item = $modelClass::where('id_kelas', $code)->first();
        } elseif ($modelClass === Guru::class) {
            $item = $modelClass::where('nip', $code)->first();
        } elseif ($modelClass === MataPelajaran::class) {
            $item = $modelClass::where('id_mapel', $code)->first();
        }

        // Jika tidak ditemukan, kembalikan 'invalid' agar validasi 'exists' di atas gagal
        return $item ? $item->{$idColumn} : 'invalid';
    }

    // Tambahkan juga perbaikan pada metode cleanData
    private function cleanData(array $row): array
    {
        $cleaned = [];
        $cleaned['jam_mulai'] = $this->normalizeTime($row['jam_mulai'] ?? null);
        $cleaned['jam_selesai'] = $this->normalizeTime($row['jam_selesai'] ?? null);

        $cleaned['hari'] = trim($row['hari'] ?? '');

        // Perbaikan: Pastikan findIdByCode menerima nama kolom yang sesuai dari header Excel
        // Contoh: `Kode Kelas` di Excel harus dicari di `id_kelas` di DB
        $cleaned['id_kelas'] = $this->findIdByCode(Kelas::class, 'id_kelas', 'id_kelas', $row['kode_kelas'] ?? '');
        $cleaned['id_guru'] = $this->findIdByCode(Guru::class, 'id_guru', 'nip_guru', $row['nip_guru'] ?? '');
        $cleaned['id_mapel'] = $this->findIdByCode(MataPelajaran::class, 'id_mapel', 'kode_mapel', $row['kode_mapel'] ?? '');

        return $cleaned;
    }
    public function headingRow(): int
    {
        return 1;
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function getFailures(): array
    {
        return $this->failures;
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }
}
