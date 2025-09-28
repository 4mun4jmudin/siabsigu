<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Remedial;
use App\Models\PenilaianMapel;
use App\Services\PenilaianCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RemedialController extends Controller
{
    public function index(Request $r)
    {
        $items = Remedial::with(['penilaian.siswa:id_siswa,nama_lengkap','penilaian.mapel:id_mapel,nama_mapel'])
            ->orderByDesc('tanggal')->paginate(30);

        return Inertia::render('admin/Penilaian/RemedialIndex', ['items'=>$items]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'id_penilaian'  => 'required|integer',
            'komponen'      => 'nullable|in:Tugas,UH,PTS,PAS,Praktik,Proyek',
            'nilai_awal'    => 'required|numeric|min:0|max:100',
            'nilai_remedial'=> 'required|numeric|min:0|max:100',
            'tanggal'       => 'nullable|date',
            'metode'        => 'nullable|string|max:50',
            'catatan'       => 'nullable|string|max:255',
        ]);

        $row = Remedial::create($data);

        // Recompute nilai akhir header terkait
        $pen = PenilaianMapel::findOrFail($data['id_penilaian']);
        (new PenilaianCalculator())->compute($pen);

        return back()->with('success','Remedial dicatat & nilai akhir dihitung ulang.');
    }

    public function update(Request $r, $id)
    {
        $data = $r->validate([
            'komponen'      => 'nullable|in:Tugas,UH,PTS,PAS,Praktik,Proyek',
            'nilai_awal'    => 'required|numeric|min:0|max:100',
            'nilai_remedial'=> 'required|numeric|min:0|max:100',
            'tanggal'       => 'nullable|date',
            'metode'        => 'nullable|string|max:50',
            'catatan'       => 'nullable|string|max:255',
        ]);

        $row = Remedial::findOrFail($id);
        $row->update($data);

        $pen = PenilaianMapel::findOrFail($row->id_penilaian);
        (new PenilaianCalculator())->compute($pen);

        return back()->with('success','Remedial diperbarui & nilai akhir dihitung ulang.');
    }

    public function destroy($id)
    {
        $row = Remedial::findOrFail($id);
        $penId = $row->id_penilaian;
        $row->delete();

        $pen = PenilaianMapel::findOrFail($penId);
        (new PenilaianCalculator())->compute($pen);

        return back()->with('success','Remedial dihapus & nilai akhir dihitung ulang.');
    }
}
