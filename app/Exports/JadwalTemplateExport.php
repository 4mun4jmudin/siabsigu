<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class JadwalTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        // contoh baris kosong (user akan mengisi)
        return [
            // optional example: ['Senin','08:00','09:30','KLS-001','1987654321','MAPEL-01']
        ];
    }

    public function headings(): array
    {
        return [
            'Hari',         // Senin, Selasa, ...
            'Jam Mulai',    // format HH:mm
            'Jam Selesai',  // format HH:mm
            'Kode Kelas',   // id_kelas (atau kode kelas sesuai DB)
            'NIP Guru',     // nip guru (lebih aman daripada id)
            'Kode Mapel'    // id_mapel (atau kode mapel)
        ];
    }
}
