<?php

namespace App\Exports;

use App\Models\Siswa;
use App\Models\AbsensiSiswa;
use App\Models\Kelas;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Events\AfterSheet;

class AbsensiSiswaExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents

{
    protected $filters;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Siswa::query()
            ->with(['absensi' => function ($q) {
                $q->whereDate('tanggal', $this->filters['tanggal']);
            }])
            ->where('status', 'Aktif')
            ->orderBy('nama_lengkap');

        if (!empty($this->filters['id_kelas'])) {
            $query->where('id_kelas', $this->filters['id_kelas']);
        }

        if (!empty($this->filters['search'])) {
            $searchTerm = $this->filters['search'];
            $query->where(fn($q) => $q->where('nama_lengkap', 'like', "%{$searchTerm}%")->orWhere('nis', 'like', "%{$searchTerm}%"));
        }

        return $query;
    }

    public function headings(): array
    {
        $kelas = !empty($this->filters['id_kelas']) ? Kelas::find($this->filters['id_kelas']) : null;
        $tanggal = !empty($this->filters['tanggal']) ? Carbon::parse($this->filters['tanggal']) : null;

        return [
            // Baris 1: Judul Utama
            ['LAPORAN ABSENSI SISWA'],
            // Baris 2: Detail Kelas dan Tanggal
            ['Kelas: ' . ($kelas ? $kelas->nama_lengkap : 'Semua Kelas')],
            ['Tanggal: ' . ($tanggal ? $tanggal->translatedFormat('l, d F Y') : '-')],
            // Baris 3: Kosong sebagai pemisah
            [],
            // Baris 4: Header Tabel Sebenarnya
            [
                'NIS',
                'Nama Siswa',
                'Status Kehadiran',
                'Jam Masuk',
                'Keterlambatan (Menit)',
                'Keterangan',
            ]
        ];
    }

    public function map($siswa): array
    {
        $absensi = $siswa->absensi->first();
        $status = $absensi ? $absensi->status_kehadiran : 'Belum Diinput';

        if ($status === 'Hadir' && $absensi->menit_keterlambatan > 0) {
            $status = 'Terlambat';
        } elseif ($status === 'Hadir') {
            $status = 'Hadir';
        }

        return [
           $siswa->nis,
            $siswa->nama_lengkap,
            $status,
            $absensi ? ($absensi->jam_masuk ? Carbon::parse($absensi->jam_masuk)->format('H:i') : '-') : '-',
            $absensi ? ($absensi->menit_keterlambatan ?? 0) : 0,
            $absensi ? $absensi->keterangan : '',
        ];
    }
    public function styles(Worksheet $sheet): array
    {
        // Style untuk judul utama di baris 1
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

        // Style untuk detail di baris 2 dan 3
        $sheet->mergeCells('A2:F2');
        $sheet->getStyle('A2')->getFont()->setBold(true);
        $sheet->mergeCells('A3:F3');
        $sheet->getStyle('A3')->getFont()->setBold(true);

        // Style untuk header tabel di baris 5
        return [
            5 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFD3D3D3']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }

    /**
     * =============================================================
     * FUNGSI BARU UNTUK STYLING LANJUTAN (BORDER & HIGHLIGHT)
     * =============================================================
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                // Ambil objek sheet
                $sheet = $event->sheet->getDelegate();

                // Dapatkan baris terakhir yang berisi data
                $highestRow = $sheet->getHighestRow();

                // Definisikan range tabel (dari header sampai baris terakhir)
                $tableRange = 'A5:F' . $highestRow;
                
                // Tambahkan border ke seluruh tabel
                $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                // Lakukan perulangan untuk highlight baris yang terlambat
                for ($row = 6; $row <= $highestRow; $row++) {
                    // Ambil nilai dari kolom Status Kehadiran (kolom C)
                    $statusCell = 'C' . $row;
                    $statusValue = $sheet->getCell($statusCell)->getValue();

                    // Jika statusnya "Terlambat", warnai seluruh baris
                    if ($statusValue == 'Terlambat') {
                        $sheet->getStyle('A' . $row . ':F' . $row)
                              ->getFill()
                              ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                              ->getStartColor()->setARGB('FFFFFF00'); // Warna Kuning
                    }
                }
            },
        ];
    }
    
}
