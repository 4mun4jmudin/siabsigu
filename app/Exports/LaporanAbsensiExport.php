<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class LaporanAbsensiExport implements FromView, ShouldAutoSize
{
    protected $data;
    protected $filters;

    public function __construct(array $data, array $filters)
    {
        $this->data = $data;
        $this->filters = $filters;
    }

    public function view(): View
    {
        // 👇👇 UBAH BAGIAN INI: Arahkan ke view yang baru untuk Excel 👇👇
        return view('exports.laporan_absensi_excel', [
            'data' => $this->data,
            'filters' => $this->filters,
        ]);
    }
}