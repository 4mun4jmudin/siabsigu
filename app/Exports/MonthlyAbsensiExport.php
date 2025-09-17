<?php

namespace App\Exports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MonthlyAbsensiExport implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $jadwal;
    protected $rows;
    protected $lastDay;
    protected $bulan;
    protected $tahun;

    public function __construct($jadwal, Collection $rows, int $lastDay, int $bulan, int $tahun)
    {
        $this->jadwal = $jadwal;
        $this->rows = $rows;
        $this->lastDay = $lastDay;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function array(): array
    {
        // Build header row: No, Nama, days..., H,S,I,A
        $header = ['No', 'Nama Siswa'];
        for ($d = 1; $d <= $this->lastDay; $d++) $header[] = (string)$d;
        $header = array_merge($header, ['H','S','I','A']);

        $data = [];
        foreach ($this->rows as $i => $r) {
            $row = [];
            $row[] = $i + 1;
            $row[] = $r['nama'] ?? '';
            // days
            $countH = $countS = $countI = $countA = 0;
            for ($d = 1; $d <= $this->lastDay; $d++) {
                $val = $r['days'][$d] ?? '';
                $short = '';
                if ($val !== null && $val !== '') {
                    $short = strtoupper(substr((string)$val,0,1));
                    if ($short === 'H') $countH++;
                    if ($short === 'S') $countS++;
                    if ($short === 'I') $countI++;
                    if ($short === 'A') $countA++;
                }
                $row[] = $short;
            }
            $row[] = $countH;
            $row[] = $countS;
            $row[] = $countI;
            $row[] = $countA;

            $data[] = $row;
        }

        // Prepend metadata rows (title) if you want; but FromArray will only output rows.
        // We'll return header + data
        return array_merge([$header], $data);
    }

    public function headings(): array
    {
        // This method will not be used because we already included header as first row
        return [];
    }

    public function title(): string
    {
        return 'Absensi ' . ($this->jadwal->mataPelajaran?->nama_mapel ?? 'Mapel');
    }

    public function styles(Worksheet $sheet)
    {
        // Example basic styling: bold header row (row 1)
        $sheet->getStyle('A1:Z1')->getFont()->setBold(true);
        return [];
    }
}
