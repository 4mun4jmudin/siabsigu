<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LaporanGuruSheetExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    // Mengubah array menjadi Laravel Collection
    public function collection()
    {
        return collect($this->data);
    }

    // Mendefinisikan judul untuk setiap kolom
    public function headings(): array
    {
        return [
            'Nama Guru',
            'Total Hari Kerja',
            'Hadir',
            'Sakit',
            'Izin',
            'Alfa',
            'Persentase Kehadiran',
            'Status',
        ];
    }

    // Memetakan data dari collection ke kolom yang sesuai
    public function map($row): array
    {
        return [
            $row['namaGuru'],
            $row['totalHariKerja'],
            $row['hadir'],
            $row['sakit'],
            $row['izin'],
            $row['alfa'],
            $row['persentaseKehadiran'] . '%',
            $row['status'],
        ];
    }

    // Memberikan styling pada sheet
    public function styles(Worksheet $sheet)
    {
        return [
            // Membuat baris pertama (header) menjadi tebal (bold)
            1 => ['font' => ['bold' => true]],
        ];
    }
}