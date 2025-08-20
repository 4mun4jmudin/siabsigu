<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LaporanSiswaSheetExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data);
    }

    public function headings(): array
    {
        return [
            'Nama Kelas',
            'Wali Kelas',
            '% Hadir',
            '% Sakit',
            '% Izin',
            '% Alfa',
            'Status',
        ];
    }

    public function map($row): array
    {
        return [
            $row['namaKelas'],
            $row['waliKelas'],
            $row['persentase']['hadir'],
            $row['persentase']['sakit'],
            $row['persentase']['izin'],
            $row['persentase']['alfa'],
            $row['status'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Membuat baris pertama (header) menjadi tebal (bold)
            1 => ['font' => ['bold' => true]],
        ];
    }
}