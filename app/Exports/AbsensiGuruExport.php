<?php

namespace App\Exports;

use App\Models\Guru;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Carbon\Carbon;

class AbsensiGuruExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // Logika ini diambil dari controller untuk menjaga konsistensi
        $query = Guru::where('status', 'Aktif');

        if ($this->request->has('bulan') && $this->request->has('tahun')) {
            $bulan = $this->request->get('bulan');
            $tahun = $this->request->get('tahun');
            
            return $query->withCount([
                'absensi as hadir' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Alfa'),
            ])->get();

        } elseif ($this->request->has('semester') && $this->request->has('tahun_ajaran')) {
            // Logika untuk semester
            $tahunAjaranParts = explode('-', $this->request->get('tahun_ajaran'));
            $startYear = $tahunAjaranParts[0];
            
            if ($this->request->get('semester') === 'Ganjil') {
                $startDate = Carbon::create($startYear, 7, 1)->startOfMonth();
                $endDate = Carbon::create($startYear, 12, 31)->endOfMonth();
            } else { // Genap
                $endYear = $tahunAjaranParts[1];
                $startDate = Carbon::create($endYear, 1, 1)->startOfMonth();
                $endDate = Carbon::create($endYear, 6, 30)->endOfMonth();
            }

            return $query->withCount([
                'absensi as hadir' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Alfa'),
            ])->get();
        }

        return collect(); // Return koleksi kosong jika tidak ada filter
    }

    public function headings(): array
    {
        return [
            'NIP',
            'Nama Guru',
            'Hadir',
            'Sakit',
            'Izin',
            'Alfa',
        ];
    }

    public function map($guru): array
    {
        return [
            $guru->nip,
            $guru->nama_lengkap,
            $guru->hadir,
            $guru->sakit,
            $guru->izin,
            $guru->alfa,
        ];
    }
}
