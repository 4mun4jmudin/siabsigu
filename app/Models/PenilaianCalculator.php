<?php

namespace App\Services;

use App\Models\BobotNilaiMapel;
use App\Models\PenilaianMapel;
use App\Models\MataPelajaran;

class PenilaianCalculator
{
    public function compute(PenilaianMapel $pen): PenilaianMapel
    {
        // Ambil bobot default
        $bobot = BobotNilaiMapel::where([
            'id_mapel'        => $pen->id_mapel,
            'id_tahun_ajaran' => $pen->id_tahun_ajaran,
            'semester'        => $pen->semester,
        ])->first();

        $w = [
            'Tugas'   => $bobot->bobot_tugas   ?? 0,
            'UH'      => $bobot->bobot_uh      ?? 0,
            'PTS'     => $bobot->bobot_pts     ?? 0,
            'PAS'     => $bobot->bobot_pas     ?? 0,
            'Praktik' => $bobot->bobot_praktik ?? 0,
            'Proyek'  => $bobot->bobot_proyek  ?? 0,
        ];
        $sumW = array_sum($w) ?: 100;

        // Rata per komponen (menghormati bobot detail jika ada)
        $details = $pen->details()->get()->groupBy('komponen');
        $avg = [];
        foreach ($w as $komp => $wb) {
            $rows = $details->get($komp, collect());
            if ($rows->isEmpty()) { $avg[$komp] = null; continue; }

            $hasWeight = $rows->contains(fn($r)=>!is_null($r->bobot));
            if ($hasWeight) {
                $num=0; $den=0;
                foreach ($rows as $r) { $b = (float)($r->bobot ?? 0); $num += ((float)$r->nilai) * $b; $den += $b; }
                $avg[$komp] = $den > 0 ? $num / $den : null;
            } else {
                $avg[$komp] = (float)$rows->avg('nilai');
            }
        }

        // Kombinasi bobot
        $total = 0;
        foreach ($w as $komp=>$wb) {
            if ($avg[$komp] !== null) $total += $avg[$komp] * ($wb / $sumW);
        }
        $pen->nilai_akhir = round($total, 2);

        // Predikat + Tuntas v1
        $pen->predikat = $this->predikat($pen->nilai_akhir);
        $kkm = MataPelajaran::where('id_mapel', $pen->id_mapel)->value('kkm') ?? 75;
        $pen->tuntas = $pen->nilai_akhir >= $kkm;
        $pen->save();

        return $pen;
    }

    private function predikat(float $n): string
    {
        if ($n >= 90) return 'A';
        if ($n >= 80) return 'B';
        if ($n >= 70) return 'C';
        return 'D';
    }
}
