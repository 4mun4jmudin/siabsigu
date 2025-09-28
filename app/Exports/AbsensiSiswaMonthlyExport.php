<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Kelas;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class AbsensiSiswaMonthlyExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected string $month;
    protected ?string $idKelas;

    public function __construct(string $month, ?string $idKelas = null)
    {
        $this->month = $month;
        $this->idKelas = $idKelas;
    }

    public function collection()
    {
        $start = Carbon::createFromFormat('Y-m', $this->month)->startOfMonth();
        $end   = (clone $start)->endOfMonth();

        $rows = DB::table('tbl_absensi_siswa as a')
            ->join('tbl_siswa as s', 's.id_siswa', '=', 'a.id_siswa')
            ->join('tbl_kelas as k', 'k.id_kelas', '=', 's.id_kelas')
            ->whereBetween('a.tanggal', [$start->toDateString(), $end->toDateString()])
            ->when($this->idKelas, fn($q) => $q->where('k.id_kelas', $this->idKelas))
            ->groupBy('k.id_kelas', 'k.tingkat', 'k.jurusan')
            ->orderBy('k.tingkat')
            ->selectRaw("
                k.id_kelas,
                CONCAT(k.tingkat, ' ', COALESCE(k.jurusan,'')) as nama_kelas,
                SUM(a.status_kehadiran = 'Hadir') as hadir,
                SUM(a.status_kehadiran = 'Sakit') as sakit,
                SUM(a.status_kehadiran = 'Izin')  as izin,
                SUM(a.status_kehadiran = 'Alfa')  as alfa,
                AVG(CASE WHEN a.status_kehadiran='Hadir' THEN COALESCE(a.menit_keterlambatan,0) END) as rata_telat
            ")
            ->get()
            ->map(function ($r) {
                $total = (int)$r->hadir + (int)$r->sakit + (int)$r->izin + (int)$r->alfa;
                $r->persen_hadir = $total > 0 ? round(($r->hadir / $total) * 100) : 0;
                $r->rata_telat   = is_null($r->rata_telat) ? 0 : round($r->rata_telat);
                return $r;
            });

        return new Collection($rows);
    }

    public function headings(): array
    {
        return ['Kelas', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Kehadiran (%)', 'Rata Telat (menit)'];
    }

    public function map($row): array
    {
        return [
            $row->nama_kelas,
            (int)$row->hadir,
            (int)$row->sakit,
            (int)$row->izin,
            (int)$row->alfa,
            (int)$row->persen_hadir,
            (int)$row->rata_telat,
        ];
    }

    public function title(): string
    {
        $namaKls = $this->idKelas ? (Kelas::find($this->idKelas)?->tingkat . ' ' . (Kelas::find($this->idKelas)?->jurusan ?? '')) : 'Semua Kelas';
        return "Rekap {$namaKls} {$this->month}";
    }
}
