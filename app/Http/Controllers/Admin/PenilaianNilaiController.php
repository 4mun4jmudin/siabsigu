<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PenilaianNilaiController extends Controller
{
    /** LIST nilai kelas/mapel */
    public function index(Request $r)
    {
        $id_tahun_ajaran = $r->string('id_tahun_ajaran')->toString();
        $semester        = $r->string('semester')->toString();
        $id_kelas        = $r->string('id_kelas')->toString();
        $id_mapel        = $r->string('id_mapel')->toString();

        $optsTa = DB::table('tbl_tahun_ajaran')
            ->select('id_tahun_ajaran','tahun_ajaran','status')
            ->orderByDesc('status')->orderBy('tahun_ajaran')
            ->get()
            ->map(fn($x)=>['value'=>$x->id_tahun_ajaran,'label'=>$x->tahun_ajaran]);

        $optsSemester = collect([
            ['value'=>'Ganjil','label'=>'Ganjil'],
            ['value'=>'Genap','label'=>'Genap'],
        ]);

        $optsKelas = DB::table('tbl_kelas')->select('id_kelas')
            ->orderBy('id_kelas')->get()
            ->map(fn($x)=>['value'=>$x->id_kelas,'label'=>$x->id_kelas]);

        $optsMapel = DB::table('tbl_mata_pelajaran')->select('id_mapel','nama_mapel')
            ->orderBy('nama_mapel')->get()
            ->map(fn($x)=>['value'=>$x->id_mapel,'label'=>$x->nama_mapel]);

        $q = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_siswa as s','s.id_siswa','=','pm.id_siswa')
            ->join('tbl_mata_pelajaran as m','m.id_mapel','=','pm.id_mapel')
            ->select(
                'pm.id_penilaian','pm.id_siswa','pm.id_kelas','pm.id_mapel',
                'pm.id_tahun_ajaran','pm.semester','pm.nilai_akhir','pm.predikat','pm.tuntas',
                's.nis','s.nama_lengkap as nama_siswa','m.nama_mapel'
            );

        if ($id_tahun_ajaran !== '') $q->where('pm.id_tahun_ajaran',$id_tahun_ajaran);
        if ($semester !== '')        $q->where('pm.semester',$semester);
        if ($id_kelas !== '')        $q->where('pm.id_kelas',$id_kelas);
        if ($id_mapel !== '')        $q->where('pm.id_mapel',$id_mapel);

        $list = $q->orderBy('s.nama_lengkap')->limit(500)->get();

        // NOTICE: path lowercase "admin" + folder Penilaian/Nilai
        return Inertia::render('admin/Penilaian/Nilai/Index', [
            'options' => [
                'ta'       => $optsTa,
                'semester' => $optsSemester,
                'kelas'    => $optsKelas,
                'mapel'    => $optsMapel,
            ],
            'list' => $list,
        ]);
    }

    /** DETAIL untuk 1 header penilaian */
    public function showDetail($id_penilaian)
    {
        $h = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_siswa as s','s.id_siswa','=','pm.id_siswa')
            ->join('tbl_mata_pelajaran as m','m.id_mapel','=','pm.id_mapel')
            ->select(
                'pm.id_penilaian','pm.id_siswa','pm.id_kelas','pm.id_mapel',
                'pm.id_tahun_ajaran','pm.semester','pm.nilai_akhir','pm.predikat','pm.tuntas',
                's.nama_lengkap as nama_siswa','m.nama_mapel'
            )
            ->where('pm.id_penilaian', $id_penilaian)->first();

        if (!$h) abort(404);

        $details = DB::table('tbl_penilaian_detail')
            ->where('id_penilaian',$id_penilaian)
            ->orderBy('tanggal')->orderBy('id_detail')->get();

        return Inertia::render('admin/Penilaian/Nilai/Detail', [
            'header'=>$h, 'details'=>$details,
        ]);
    }

    /** SIMPAN satu baris detail */
    public function storeDetail(Request $r, $id_penilaian)
    {
        $header = DB::table('tbl_penilaian_mapel')->where('id_penilaian',$id_penilaian)->first();
        if (!$header) return back()->with('error','Header penilaian tidak ditemukan.');

        $data = $r->validate([
            'komponen'  => 'required|in:Tugas,UH,PTS,PAS,Praktik,Proyek',
            'deskripsi' => 'nullable|string|max:100',
            'tanggal'   => 'nullable|date',
            'nilai'     => 'required|numeric|min:0|max:100',
            'bobot'     => 'nullable|numeric|min:0|max:100',
        ]);

        DB::table('tbl_penilaian_detail')->insert([
            'id_penilaian'=>$id_penilaian,
            'komponen'=>$data['komponen'],
            'deskripsi'=>$data['deskripsi']??null,
            'tanggal'=>$data['tanggal']??null,
            'nilai'=>$data['nilai'],
            'bobot'=>$data['bobot']??null,
            'created_at'=>now(),'updated_at'=>now(),
        ]);

        $this->recalculateHeader($header);

        return back()->with('success','Detail nilai ditambahkan.');
    }

    /** Re-calc nilai akhir (versi ringkas) */
    protected function recalculateHeader(object $header): void
    {
        $details = DB::table('tbl_penilaian_detail')
            ->where('id_penilaian',$header->id_penilaian)->get()->groupBy('komponen');

        $bobot = DB::table('tbl_bobot_nilai_mapel')
            ->where('id_mapel',$header->id_mapel)
            ->where('id_tahun_ajaran',$header->id_tahun_ajaran)
            ->where('semester',$header->semester)->first();

        $def = [
            'Tugas'   => (float)($bobot->bobot_tugas ?? 0),
            'UH'      => (float)($bobot->bobot_uh ?? 0),
            'PTS'     => (float)($bobot->bobot_pts ?? 0),
            'PAS'     => (float)($bobot->bobot_pas ?? 0),
            'Praktik' => (float)($bobot->bobot_praktik ?? 0),
            'Proyek'  => (float)($bobot->bobot_proyek ?? 0),
        ];

        $sumWeighted = 0.0; $sumBobot = 0.0;

        foreach ($def as $komp=>$B) {
            if (!$details->has($komp) || $details[$komp]->isEmpty()) continue;

            $rows = $details[$komp];
            $hasLocal = $rows->contains(fn($d)=>!is_null($d->bobot));

            if ($hasLocal) {
                $wSum=0;$wTot=0;
                foreach ($rows as $d) {
                    $w = is_null($d->bobot)?0:(float)$d->bobot;
                    if ($w<=0) continue;
                    $wSum += (float)$d->nilai * $w;
                    $wTot += $w;
                }
                if ($wTot>0 && $B>0){ $sumWeighted += ($wSum/$wTot)*$B; $sumBobot += $B; }
            } else {
                $avg = $rows->avg(fn($d)=>(float)$d->nilai);
                if ($B>0){ $sumWeighted += $avg*$B; $sumBobot += $B; }
            }
        }

        $nilaiAkhir = $sumBobot>0 ? ($sumWeighted/$sumBobot) : null;
        $kkm = (float)(DB::table('tbl_mata_pelajaran')->where('id_mapel',$header->id_mapel)->value('kkm') ?? 0);

        $pred = null; $tuntas = null;
        if (!is_null($nilaiAkhir)) {
            $pred = $nilaiAkhir>=90?'A':($nilaiAkhir>=80?'B':($nilaiAkhir>=70?'C':'D'));
            $tuntas = $nilaiAkhir >= $kkm;
        }

        DB::table('tbl_penilaian_mapel')->where('id_penilaian',$header->id_penilaian)->update([
            'nilai_akhir'=> is_null($nilaiAkhir)?null:round($nilaiAkhir,2),
            'predikat'   => $pred,
            'tuntas'     => is_null($tuntas)?null:($tuntas?1:0),
            'updated_at' => now(),
        ]);
    }
}
