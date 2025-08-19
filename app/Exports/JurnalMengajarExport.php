<?php

namespace App\Exports;

use App\Models\JurnalMengajar;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class JurnalMengajarExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return JurnalMengajar::with(['jadwal.guru', 'jadwal.kelas', 'jadwal.mataPelajaran', 'guruPengganti'])->get();
    }

    public function map($jurnal): array
    {
        return [
            $jurnal->tanggal,
            $jurnal->jadwal->kelas->nama_kelas ?? '-',
            $jurnal->jadwal->mataPelajaran->nama_mapel ?? '-',
            $jurnal->jadwal->guru->nama ?? '-',
            $jurnal->jam_masuk_kelas . ' - ' . $jurnal->jam_keluar_kelas,
            $jurnal->status_mengajar,
            $jurnal->guruPengganti->nama ?? '-',
            $jurnal->materi_pembahasan,
        ];
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'Kelas',
            'Mata Pelajaran',
            'Guru Pengajar',
            'Waktu',
            'Status',
            'Guru Pengganti',
            'Keterangan',
        ];
    }
}
