<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Events\AfterSheet;

use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class LaporanAbsensiExport implements FromArray, WithEvents, ShouldAutoSize
{
    protected array $data;
    protected array $filters;

    // header row indexes (diisi di constructor)
    protected int $guruHeaderRow = 0;
    protected int $guruLastRow = 0;
    protected int $kelasHeaderRow = 0;
    protected int $kelasLastRow = 0;

    public function __construct(array $data, array $filters = [])
    {
        $this->data = $data;
        $this->filters = $filters;
    }

    /**
     * Membangun array 2D untuk sheet Excel.
     *
     * @return array
     */
    public function array(): array
    {
        $rows = [];

        // Judul & filter
        $rows[] = ['LAPORAN ABSENSI']; // row 1
        $rows[] = ['Bulan: ' . ($this->filters['bulan'] ?? '-') . '    |    Kelas: ' . ($this->filters['nama_kelas'] ?? 'Semua Kelas')]; // row 2
        $rows[] = []; // row 3

        // Statistik utama
        $rows[] = ['STATISTIK UTAMA']; // row 4
        $rows[] = ['Rata-rata Kehadiran Siswa', isset($this->data['stats']['rataRataKehadiranSiswa']['percentage']) ? $this->data['stats']['rataRataKehadiranSiswa']['percentage'] . '%' : '-'];
        $rows[] = ['Rata-rata Kehadiran Guru', isset($this->data['stats']['rataRataKehadiranGuru']['percentage']) ? $this->data['stats']['rataRataKehadiranGuru']['percentage'] . '%' : '-'];
        $rows[] = []; // spacer

        // Header & data guru
        $this->guruHeaderRow = count($rows) + 1;
        $rows[] = ['Nama Guru', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Persentase'];
        if (!empty($this->data['laporanGuru'])) {
            foreach ($this->data['laporanGuru'] as $g) {
                $rows[] = [
                    $g['namaGuru'] ?? '-',
                    $g['hadir'] ?? 0,
                    $g['sakit'] ?? 0,
                    $g['izin'] ?? 0,
                    $g['alfa'] ?? 0,
                    (isset($g['persentaseKehadiran']) ? $g['persentaseKehadiran'] . '%' : '-')
                ];
            }
        } else {
            $rows[] = ['-', '-', '-', '-', '-', '-'];
        }
        $this->guruLastRow = count($rows);

        $rows[] = []; // spacer

        // Header & data per kelas
        $this->kelasHeaderRow = count($rows) + 1;
        $rows[] = ['Kelas', 'Wali Kelas', 'Hadir %', 'Sakit %', 'Izin %', 'Alfa %'];
        if (!empty($this->data['laporanPerKelas'])) {
            foreach ($this->data['laporanPerKelas'] as $k) {
                $rows[] = [
                    $k['namaKelas'] ?? '-',
                    $k['waliKelas'] ?? ($k['waliKelas'] ?? '-'),
                    ($k['persentase']['hadir'] ?? 0) . '%',
                    ($k['persentase']['sakit'] ?? 0) . '%',
                    ($k['persentase']['izin'] ?? 0) . '%',
                    ($k['persentase']['alfa'] ?? 0) . '%',
                ];
            }
        } else {
            $rows[] = ['-', '-', '-', '-', '-', '-'];
        }
        $this->kelasLastRow = count($rows);

        // catatan: sheet tunggal, kolom A-F dipakai
        return $rows;
    }

    /**
     * Register events untuk styling (merge title, style header, border, freeze pane).
     *
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // lebar kolom auto (ShouldAutoSize akan bantu, ini tambahan)
                // Merge untuk judul & filter
                $sheet->mergeCells('A1:F1');
                $sheet->mergeCells('A2:F2');

                // style judul
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // style label STATISTIK UTAMA
                $sheet->mergeCells('A4:F4');
                $sheet->getStyle('A4')->getFont()->setBold(true);

                // style header tabel guru
                $gStart = $this->guruHeaderRow;
                $gEnd = $this->guruLastRow;
                $sheet->getStyle("A{$gStart}:F{$gStart}")->getFont()->setBold(true);
                $sheet->getStyle("A{$gStart}:F{$gStart}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$gStart}:F{$gStart}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEFEFEF');

                // style header tabel kelas
                $kStart = $this->kelasHeaderRow;
                $kEnd = $this->kelasLastRow;
                $sheet->getStyle("A{$kStart}:F{$kStart}")->getFont()->setBold(true);
                $sheet->getStyle("A{$kStart}:F{$kStart}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$kStart}:F{$kStart}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFEFEFEF');

                // Border untuk blok guru (header + data)
                $sheet->getStyle("A{$gStart}:F{$gEnd}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFBDBDBD'],
                        ],
                    ],
                ]);

                // Border untuk blok kelas (header + data)
                $sheet->getStyle("A{$kStart}:F{$kEnd}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFBDBDBD'],
                        ],
                    ],
                ]);

                // Alignment: kolom angka rata kanan, nama rata kiri
                $sheet->getStyle("B{$gStart}:F{$gEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("B{$kStart}:F{$kEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Wrap text untuk kolom nama (A)
                $sheet->getStyle("A{$gStart}:A{$gEnd}")->getAlignment()->setWrapText(true);
                $sheet->getStyle("A{$kStart}:A{$kEnd}")->getAlignment()->setWrapText(true);

                // Freeze pane agar header guru tetap di atas saat scroll
                $freezeRow = $gStart + 1; // baris pertama data guru
                $sheet->freezePane('A' . $freezeRow);

                // Optional: set outline/auto filter untuk masing tabel
                $sheet->setAutoFilter("A{$gStart}:F{$gEnd}");
                $sheet->setAutoFilter("A{$kStart}:F{$kEnd}");

                // Sedikit spacing/column width hint (ShouldAutoSize akan bantu, tapi ini jaga-jaga)
                $sheet->getColumnDimension('A')->setWidth(30);
                $sheet->getColumnDimension('B')->setWidth(12);
                $sheet->getColumnDimension('C')->setWidth(12);
                $sheet->getColumnDimension('D')->setWidth(12);
                $sheet->getColumnDimension('E')->setWidth(12);
                $sheet->getColumnDimension('F')->setWidth(14);
            },
        ];
    }
}
