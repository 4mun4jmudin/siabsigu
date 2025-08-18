<?php

namespace App\Exports;

use App\Models\JadwalMengajar;
use App\Models\Kelas;
use App\Models\Guru;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class JadwalMengajarExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents
{
    protected $filters;
    protected $title;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
        
        if ($filters['filter_by'] === 'guru' && $filters['guru_id']) {
            $guru = Guru::find($filters['guru_id']);
            $this->title = 'Jadwal Mengajar Guru: ' . ($guru ? $guru->nama_lengkap : 'Tidak Ditemukan');
        } else {
            $kelas = Kelas::find($filters['kelas_id']);
            $this->title = 'Jadwal Pelajaran Kelas: ' . ($kelas ? $kelas->nama_lengkap : 'Tidak Ditemukan');
        }
    }

    public function query()
    {
        $query = JadwalMengajar::query()
            ->with(['guru', 'kelas', 'mapel'])
            ->where('id_tahun_ajaran', $this->filters['id_tahun_ajaran'])
            ->orderBy('hari')
            ->orderBy('jam_mulai');

        if ($this->filters['filter_by'] === 'kelas' && !empty($this->filters['kelas_id'])) {
            $query->where('id_kelas', $this->filters['kelas_id']);
        }

        if ($this->filters['filter_by'] === 'guru' && !empty($this->filters['guru_id'])) {
            $query->where('id_guru', $this->filters['guru_id']);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            [$this->title],
            [],
            [
                'Hari',
                'Jam Mulai',
                'Jam Selesai',
                'Mata Pelajaran',
                'Guru Pengajar',
                'Kelas',
            ]
        ];
    }

    public function map($jadwal): array
    {
        return [
            $jadwal->hari,
            Carbon::parse($jadwal->jam_mulai)->format('H:i'),
            Carbon::parse($jadwal->jam_selesai)->format('H:i'),
            $jadwal->mapel->nama_mapel ?? 'N/A',
            $jadwal->guru->nama_lengkap ?? 'N/A',
            $jadwal->kelas->nama_lengkap ?? 'N/A',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');
        
        return [
            3 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFD3D3D3']],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();
                $tableRange = 'A3:F' . $highestRow;
                $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            },
        ];
    }
}