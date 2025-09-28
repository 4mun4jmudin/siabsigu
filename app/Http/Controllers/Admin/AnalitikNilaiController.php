<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PenilaianDashboardService;
use Illuminate\Http\Request;

class AnalitikNilaiController extends Controller
{
    public function __construct(private PenilaianDashboardService $svc) {}

    private function filters(Request $r): array
    {
        return $r->validate([
            'id_tahun_ajaran' => 'required|string',
            'semester'        => 'required|in:Ganjil,Genap',
            'id_kelas'        => 'nullable|string',
            'id_mapel'        => 'nullable|string',
        ]);
    }

    public function summary(Request $r)
    {
        return response()->json($this->svc->summary($this->filters($r)));
    }

    public function distribution(Request $r)
    {
        return response()->json($this->svc->distribution($this->filters($r)));
    }

    public function trend(Request $r)
    {
        return response()->json($this->svc->trend($this->filters($r)));
    }

    public function mapelLeaderboard(Request $r)
    {
        $f = $this->filters($r);
        $limit = (int)$r->query('limit', 10);
        return response()->json($this->svc->mapelLeaderboard($f, $limit));
    }

    public function kelasLeaderboard(Request $r)
    {
        $f = $this->filters($r);
        $limit = (int)$r->query('limit', 10);
        return response()->json($this->svc->kelasLeaderboard($f, $limit));
    }

    public function tuntasBreakdown(Request $r)
    {
        return response()->json($this->svc->tuntasBreakdown($this->filters($r)));
    }
}
