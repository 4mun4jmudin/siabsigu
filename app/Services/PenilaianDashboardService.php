<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class PenilaianDashboardService
{
    /**
     * Filter helper → array [id_tahun_ajaran, semester, id_kelas?, id_mapel?]
     */
    private function baseWhere(array $f)
    {
        $w = [
            ['pm.id_tahun_ajaran', '=', $f['id_tahun_ajaran']],
            ['pm.semester', '=', $f['semester']],
        ];
        if (!empty($f['id_kelas'])) {
            $w[] = ['pm.id_kelas', '=', $f['id_kelas']];
        }
        if (!empty($f['id_mapel'])) {
            $w[] = ['pm.id_mapel', '=', $f['id_mapel']];
        }
        return $w;
    }

    public function summary(array $f): array
    {
        // total siswa (distinct)
        $qBase = DB::table('tbl_penilaian_mapel as pm')->where($this->baseWhere($f));
        $totalHeaders = (clone $qBase)->count(); // header penilaian (baris)
        $totalSiswa   = (clone $qBase)->distinct('pm.id_siswa')->count('pm.id_siswa');

        // nilai rata, median, stddev, tuntas rate
        $agg = (clone $qBase)
            ->selectRaw('AVG(pm.nilai_akhir) as avg_nilai')
            ->selectRaw('SUM(CASE WHEN pm.tuntas = 1 THEN 1 ELSE 0 END) as jml_tuntas')
            ->selectRaw('COUNT(*) as jml_baris')
            ->first();

        $avg = $agg->avg_nilai ? round($agg->avg_nilai, 2) : null;
        $passRate = ($agg->jml_baris ?? 0) > 0 ? round(($agg->jml_tuntas / $agg->jml_baris) * 100, 2) : 0;

        // median (via subquery sederhana)
        $median = $this->median($f);

        // stddev (MySQL: STDDEV_SAMP)
        $stddev = (clone $qBase)->selectRaw('STDDEV_SAMP(pm.nilai_akhir) as sd')->value('sd');
        $stddev = $stddev !== null ? round($stddev, 2) : null;

        // progress completion: berapa header yang sudah punya detail?
        $withDetail = (clone $qBase)
            ->join('tbl_penilaian_detail as pd', 'pd.id_penilaian', '=', 'pm.id_penilaian')
            ->distinct('pm.id_penilaian')
            ->count('pm.id_penilaian');
        $completion = $totalHeaders > 0 ? round(($withDetail / $totalHeaders) * 100, 2) : 0;

        return [
            'total_siswa'     => $totalSiswa,
            'total_header'    => $totalHeaders,
            'completion_pct'  => $completion,
            'avg_nilai'       => $avg,
            'median'          => $median,
            'stddev'          => $stddev,
            'pass_rate_pct'   => $passRate,
        ];
    }

    private function median(array $f): ?float
    {
        $q = DB::table('tbl_penilaian_mapel as pm')
            ->where($this->baseWhere($f))
            ->whereNotNull('pm.nilai_akhir')
            ->orderBy('pm.nilai_akhir');

        $count = (clone $q)->count();
        if ($count === 0) return null;

        $offset = (int) floor(($count - 1) / 2);
        $vals = (clone $q)->skip($offset)->take(($count % 2 === 0) ? 2 : 1)->pluck('pm.nilai_akhir')->all();

        $median = ($count % 2 === 0) ? ( ($vals[0] + $vals[1]) / 2 ) : $vals[0];
        return round((float)$median, 2);
    }

    public function distribution(array $f, array $bins = [0,60,70,80,90,101]): array
    {
        // bikin bucket [0–59],[60–69],[70–79],[80–89],[90–100]
        $q = DB::table('tbl_penilaian_mapel as pm')->where($this->baseWhere($f));

        $counts = [];
        for ($i=0; $i < count($bins)-1; $i++) {
            $lo = $bins[$i]; $hi = $bins[$i+1]-0.00001; // include upper bound
            $label = $bins[$i] . '-' . ($bins[$i+1]-1);
            $c = (clone $q)->whereBetween('pm.nilai_akhir', [$lo, $hi])->count();
            $counts[] = ['range' => $label, 'count' => $c];
        }
        return $counts;
    }

    public function trend(array $f): array
    {
        // Tren bulanan berdasarkan updated_at header (fallback kalau tidak ada tanggal detail)
        $q = DB::table('tbl_penilaian_mapel as pm')->where($this->baseWhere($f))
            ->whereNotNull('pm.updated_at')
            ->selectRaw("DATE_FORMAT(pm.updated_at, '%Y-%m') as ym")
            ->selectRaw('AVG(pm.nilai_akhir) as avg_nilai')
            ->selectRaw('SUM(CASE WHEN pm.tuntas=1 THEN 1 ELSE 0 END) as jml_tuntas')
            ->selectRaw('COUNT(*) as jml')
            ->groupBy('ym')
            ->orderBy('ym');

        return $q->get()->map(function($r){
            $pass = $r->jml > 0 ? round(($r->jml_tuntas / $r->jml) * 100, 2) : 0;
            return [
                'period' => $r->ym,
                'avg_nilai' => $r->avg_nilai ? round($r->avg_nilai, 2) : null,
                'pass_rate_pct' => $pass,
            ];
        })->toArray();
    }

    public function mapelLeaderboard(array $f, int $limit = 10): array
    {
        $q = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_mata_pelajaran as m', 'm.id_mapel','=','pm.id_mapel')
            ->where($this->baseWhere($f))
            ->select('pm.id_mapel','m.nama_mapel')
            ->selectRaw('AVG(pm.nilai_akhir) as avg_nilai')
            ->selectRaw('SUM(CASE WHEN pm.tuntas=1 THEN 1 ELSE 0 END)/COUNT(*)*100 as pass_rate_pct')
            ->groupBy('pm.id_mapel','m.nama_mapel')
            ->orderByDesc('avg_nilai')
            ->limit($limit);

        return $q->get()->map(fn($r)=>[
            'id_mapel' => $r->id_mapel,
            'nama_mapel' => $r->nama_mapel,
            'avg_nilai' => $r->avg_nilai ? round($r->avg_nilai, 2) : null,
            'pass_rate_pct' => $r->pass_rate_pct ? round($r->pass_rate_pct, 2) : 0,
        ])->toArray();
    }

    public function kelasLeaderboard(array $f, int $limit = 10): array
    {
        $q = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_kelas as k', 'k.id_kelas','=','pm.id_kelas')
            ->where($this->baseWhere($f))
            ->select('pm.id_kelas','k.id_kelas as nama_kelas')
            ->selectRaw('AVG(pm.nilai_akhir) as avg_nilai')
            ->selectRaw('SUM(CASE WHEN pm.tuntas=1 THEN 1 ELSE 0 END)/COUNT(*)*100 as pass_rate_pct')
            ->groupBy('pm.id_kelas','k.id_kelas')
            ->orderByDesc('avg_nilai')
            ->limit($limit);

        return $q->get()->map(fn($r)=>[
            'id_kelas' => $r->id_kelas,
            'nama_kelas' => $r->nama_kelas,
            'avg_nilai' => $r->avg_nilai ? round($r->avg_nilai, 2) : null,
            'pass_rate_pct' => $r->pass_rate_pct ? round($r->pass_rate_pct, 2) : 0,
        ])->toArray();
    }

    public function tuntasBreakdown(array $f): array
    {
        $q = DB::table('tbl_penilaian_mapel as pm')->where($this->baseWhere($f))
            ->selectRaw('pm.predikat, COUNT(*) as jumlah')
            ->groupBy('pm.predikat');

        $byPredikat = $q->pluck('jumlah','predikat')->toArray();

        $tuntas = DB::table('tbl_penilaian_mapel as pm')->where($this->baseWhere($f))
            ->selectRaw('SUM(CASE WHEN pm.tuntas=1 THEN 1 ELSE 0 END) as tuntas')
            ->selectRaw('SUM(CASE WHEN pm.tuntas=0 THEN 1 ELSE 0 END) as tidak')
            ->first();

        return [
            'predikat' => $byPredikat,
            'tuntas'   => [
                'ya' => (int)($tuntas->tuntas ?? 0),
                'tidak' => (int)($tuntas->tidak ?? 0),
            ],
        ];
    }

    public function remedialQueue(array $f, int $limit = 15): array
    {
        // Ambil siswa dengan nilai akhir terendah (belum tuntas) + info KKM
        $q = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_siswa as s','s.id_siswa','=','pm.id_siswa')
            ->join('tbl_mata_pelajaran as m','m.id_mapel','=','pm.id_mapel')
            ->where($this->baseWhere($f))
            ->where('pm.tuntas','=',0)
            ->select('pm.id_penilaian','pm.id_siswa','s.nama_lengkap','pm.id_mapel','m.nama_mapel','pm.nilai_akhir','m.kkm')
            ->orderBy('pm.nilai_akhir','asc')
            ->limit($limit);

        return $q->get()->map(fn($r)=>[
            'id_penilaian' => $r->id_penilaian,
            'id_siswa'     => $r->id_siswa,
            'nama_siswa'   => $r->nama_lengkap,
            'id_mapel'     => $r->id_mapel,
            'nama_mapel'   => $r->nama_mapel,
            'nilai_akhir'  => $r->nilai_akhir ? round($r->nilai_akhir,2) : null,
            'kkm'          => $r->kkm,
            'gap'          => ($r->kkm !== null && $r->nilai_akhir !== null) ? round($r->kkm - $r->nilai_akhir, 2) : null,
        ])->toArray();
    }
}
