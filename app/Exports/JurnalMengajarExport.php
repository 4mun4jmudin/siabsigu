<?php

namespace App\Exports;

use App\Models\JurnalMengajar;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class JurnalMengajarExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithEvents, WithTitle
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $filters = $this->filters;

        $query = JurnalMengajar::query()
            ->with([
                'jadwalMengajar.guru',
                'jadwalMengajar.kelas',
                'jadwalMengajar.mataPelajaran',
                'jadwalMengajar.mapel',
                'guruPengganti',
            ])
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->whereHas('jadwalMengajar.guru', fn($q2) => $q2->where('nama_lengkap', 'like', "%{$search}%"))
                       ->orWhereHas('jadwalMengajar.kelas', fn($q2) => $q2->where('tingkat', 'like', "%{$search}%")->orWhere('jurusan', 'like', "%{$search}%"))
                       ->orWhere('materi_pembahasan', 'like', "%{$search}%");
                });
            })
            ->when($filters['tanggal_mulai'] ?? null, fn($q, $date) => $q->whereDate('tanggal', '>=', $date))
            ->when($filters['tanggal_selesai'] ?? null, fn($q, $date) => $q->whereDate('tanggal', '<=', $date))
            ->when($filters['id_guru'] ?? null, fn($q, $gid) => $q->whereHas('jadwalMengajar', fn($qq) => $qq->where('id_guru', $gid)))
            ->when($filters['id_kelas'] ?? null, fn($q, $kid) => $q->whereHas('jadwalMengajar', fn($qq) => $qq->where('id_kelas', $kid)))
            ->orderBy('tanggal', 'desc');

        return $query;
    }

    public function headings(): array
    {
        return [
            'ID Jurnal',
            'Tanggal',
            'Hari',
            'Jam Masuk',
            'Jam Keluar',
            'Kelas',
            'Mata Pelajaran',
            'Guru Pengajar',
            'Status',
            'Guru Pengganti',
            'Materi Pembahasan',
        ];
    }

    /**
     * Format waktu jam (menerima string '08:00:00', '08:00', Carbon, dsb.)
     */
    protected function formatTime($value)
    {
        if ($value === null || $value === '') {
            return '-';
        }

        try {
            // Jika sudah string dengan colon, ambil 5 char pertama (HH:MM)
            if (is_string($value) && strpos($value, ':') !== false) {
                // contoh "08:00:00" => "08:00"
                return substr($value, 0, 5);
            }

            // Jika Carbon atau bisa di-parse
            if ($value instanceof Carbon) {
                return $value->format('H:i');
            }

            return Carbon::parse($value)->format('H:i');
        } catch (\Exception $e) {
            // fallback: kembalikan as-is (potong jika panjang)
            $v = (string) $value;
            return strlen($v) > 5 ? substr($v, 0, 5) : $v;
        }
    }

    public function map($jurnal): array
    {
        $jadwal = $jurnal->jadwalMengajar ?? null;

        $kelasText = '-';
        if ($jadwal && $jadwal->kelas) {
            $kelasText = trim(($jadwal->kelas->tingkat ?? '-') . ' ' . ($jadwal->kelas->jurusan ?? ''));
        }

        $mapel = '-';
        if ($jadwal) {
            $mapel = $jadwal->mapel->nama_mapel ?? $jadwal->mataPelajaran->nama_mapel ?? '-';
        }

        $guruPengajar = $jadwal->guru->nama_lengkap ?? '-';
        $guruPengganti = $jurnal->guruPengganti->nama_lengkap ?? '-';

        // Tanggal: aman jika datang sebagai string / Carbon / null
        $tanggal = $jurnal->tanggal ? Carbon::parse($jurnal->tanggal)->format('Y-m-d') : '-';

        return [
            $jurnal->id_jurnal,
            $tanggal,
            $jadwal->hari ?? '-',
            $this->formatTime($jurnal->jam_masuk_kelas),
            $this->formatTime($jurnal->jam_keluar_kelas),
            $kelasText,
            $mapel,
            $guruPengajar,
            $jurnal->status_mengajar ?? '-',
            $guruPengganti,
            $jurnal->materi_pembahasan ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Jurnal Mengajar';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // 1) Sisipkan 2 baris di atas agar ada ruang untuk judul + info filter
                $sheet->insertNewRowBefore(1, 2);

                // 2) Judul
                $sheet->setCellValue('A1', 'LAPORAN JURNAL MENGAJAR');
                $sheet->mergeCells('A1:K1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                // 3) Filter info (baris 2)
                $filterText = 'Periode: ' . ($this->filters['tanggal_mulai'] ?? 'Semua') . ' s/d ' . ($this->filters['tanggal_selesai'] ?? 'Semua');
                if (!empty($this->filters['id_guru'])) {
                    $guru = \App\Models\Guru::find($this->filters['id_guru']);
                    $filterText .= ' | Guru: ' . ($guru->nama_lengkap ?? 'Tidak Ditemukan');
                }
                if (!empty($this->filters['id_kelas'])) {
                    $kelas = \App\Models\Kelas::find($this->filters['id_kelas']);
                    $filterText .= ' | Kelas: ' . ($kelas->tingkat ?? '') . ' ' . ($kelas->jurusan ?? '');
                }
                $sheet->setCellValue('A2', $filterText);
                $sheet->mergeCells('A2:K2');
                $sheet->getStyle('A2')->getFont()->setSize(11);
                $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                // 4) Header tabel berada di baris 3 sekarang (karena kita sisipkan 2 baris di atas)
                $headerRow = 3;
                $headerRange = 'A' . $headerRow . ':K' . $headerRow;

                // Styling header
                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FF2563EB'] // biru
                    ],
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                        'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Auto filter dan freeze pane (freeze di bawah header)
                $sheet->setAutoFilter($headerRange);
                $sheet->freezePane('A' . ($headerRow + 1));

                // 5) Styling data range: tentukan last row
                $highestRow = $sheet->getHighestRow();
                $dataRange = 'A' . $headerRow . ':K' . $highestRow;

                // Garis tepi tipis untuk seluruh tabel (header + data)
                $sheet->getStyle($dataRange)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['argb' => 'FF9CA3AF'],
                        ],
                    ],
                ]);

                // Perataan kolom tertentu
                // Center untuk Tanggal, Hari, Jam Masuk, Jam Keluar, Status
                $sheet->getStyle('B' . ($headerRow + 1) . ':E' . $highestRow)
                      ->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                // Kolom Materi (K) wrap text dan beri lebar lebih besar
                $sheet->getStyle('K' . ($headerRow + 1) . ':K' . $highestRow)
                      ->getAlignment()->setWrapText(true);

                // Minimal kolom lebar (jika ShouldAutoSize tidak cukup)
                $sheet->getColumnDimension('A')->setWidth(18); // ID Jurnal
                $sheet->getColumnDimension('B')->setWidth(12); // Tanggal
                $sheet->getColumnDimension('C')->setWidth(12); // Hari
                $sheet->getColumnDimension('D')->setWidth(12); // Jam Masuk
                $sheet->getColumnDimension('E')->setWidth(12); // Jam Keluar
                $sheet->getColumnDimension('F')->setWidth(14); // Kelas
                $sheet->getColumnDimension('G')->setWidth(22); // Mata Pelajaran
                $sheet->getColumnDimension('H')->setWidth(22); // Guru Pengajar
                $sheet->getColumnDimension('I')->setWidth(12); // Status
                $sheet->getColumnDimension('J')->setWidth(22); // Guru Pengganti
                $sheet->getColumnDimension('K')->setWidth(60); // Materi

                // 6) Heading row height & wrap
                $sheet->getRowDimension($headerRow)->setRowHeight(22);
                $sheet->getStyle($headerRange)->getAlignment()->setWrapText(true);

                // 7) Footer (opsional): tambahkan catatan kecil di bawah tabel
                $footerRow = $highestRow + 2;
                $sheet->setCellValue('A' . $footerRow, 'Dicetak: ' . Carbon::now()->format('Y-m-d H:i:s'));
                $sheet->mergeCells('A' . $footerRow . ':K' . $footerRow);
                $sheet->getStyle('A' . $footerRow)->getFont()->setItalic(true)->setSize(10);
            },
        ];
    }
}
