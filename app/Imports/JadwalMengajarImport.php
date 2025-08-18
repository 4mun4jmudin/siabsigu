<?php

namespace App\Imports;

use App\Models\JadwalMengajar;
use Maatwebsite\Excel\Concerns\ToModel;

class JadwalMengajarImport implements ToModel
{
    /**
     * @var array
     */
    protected $report = [];

    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // contoh logika import
        // simpan data ke DB atau validasi
        $this->report[] = $row;

        return null; 
    }

    public function getReport()
    {
        return $this->report;
    }
    
}
