<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RaporSiswa;
use App\Models\PenilaianMapel;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RaporController extends Controller
{
    public function index(Request $r)
    {
        $ta = TahunAjaran::orderByDesc('status')->orderBy('tahun_ajaran')->get(['id_tahun_ajaran','tahun_ajaran']);
        $kelas = Kelas::orderBy('id_kelas')->get(['id_kelas']);
        $filters = $r->only(['id_tahun_ajaran','semester','id_kelas']);

        $rows = [];
        if ($filters['id_tahun_ajaran'] && $filters['semester'] && $filters['id_kelas']) {
            $rows = PenilaianMapel::where([
                    'id_tahun_ajaran'=>$filters['id_tahun_ajaran'],
                    'semester'=>$filters['semester'],
                    'id_kelas'=>$filters['id_kelas']
                ])
                ->select('id_siswa', DB::raw('AVG(nilai_akhir) as rata'))
                ->groupBy('id_siswa')
                ->orderByDesc('rata')
                ->get()
                ->map(function($r,$i){
                    return ['id_siswa'=>$r->id_siswa,'rata'=>round((float)$r->rata,2),'peringkat'=>$i+1];
                })->toArray();
        }

        return Inertia::render('admin/Penilaian/RaporIndex', [
            'options'=>[
                'tahunAjaran'=>$ta,
                'semester'=>[['value'=>'Ganjil','label'=>'Ganjil'],['value'=>'Genap','label'=>'Genap']],
                'kelas'=>$kelas,
            ],
            'filters'=>$filters,
            'rekap'=>$rows,
        ]);
    }

    public function recompute(Request $r)
    {
        $data = $r->validate([
            'id_tahun_ajaran' => 'required|string',
            'semester'        => 'required|in:Ganjil,Genap',
            'id_kelas'        => 'required|string',
        ]);

        $agg = PenilaianMapel::where($data)
            ->select('id_siswa', DB::raw('AVG(nilai_akhir) as rata'))
            ->groupBy('id_siswa')->get();

        // simpan ke tbl_rapor_siswa
        $ranked = $agg->sortByDesc('rata')->values();
        foreach ($ranked as $i=>$row) {
            RaporSiswa::updateOrCreate(
                ['id_siswa'=>$row->id_siswa, 'id_tahun_ajaran'=>$data['id_tahun_ajaran'], 'semester'=>$data['semester']],
                ['id_kelas'=>$data['id_kelas'], 'rata_rata'=>round((float)$row->rata,2), 'peringkat_kelas'=>$i+1]
            );
        }

        return back()->with('success','Rapor dihitung ulang.');
    }

    public function showSiswa(string $id_siswa)
    {
        $rapor = RaporSiswa::where('id_siswa',$id_siswa)
            ->orderByDesc('created_at')->get();

        $detail = PenilaianMapel::where('id_siswa',$id_siswa)
            ->select('id_mapel','id_tahun_ajaran','semester','nilai_akhir','predikat','tuntas')
            ->orderBy('id_tahun_ajaran')->orderBy('semester')->get();

        return response()->json(['rapor'=>$rapor, 'detail'=>$detail]);
    }

    // Optional: implementasi export (stub)
    public function exportExcel(Request $r){ abort(501,'Belum diimplementasikan'); }
    public function exportPdf(Request $r){ abort(501,'Belum diimplementasikan'); }
}
