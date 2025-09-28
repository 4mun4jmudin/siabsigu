<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KriteriaKenaikan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KriteriaKenaikanController extends Controller
{
    public function index()
    {
        $items = KriteriaKenaikan::orderBy('tingkat')->paginate(20);
        return Inertia::render('admin/Kenaikan/KriteriaIndex', ['items'=>$items]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'tingkat'               => 'nullable|string|max:10',
            'nilai_min_akhir'       => 'required|numeric|min:0|max:100',
            'maks_tidak_tuntas'     => 'required|integer|min:0|max:99',
            'min_rata_rata'         => 'nullable|numeric|min:0|max:100',
            'min_kehadiran_persen'  => 'nullable|numeric|min:0|max:100',
            'remedial_diperbolehkan'=> 'required|boolean',
            'berlaku_mulai_ta'      => 'nullable|string|max:20',
            'catatan'               => 'nullable|string|max:255',
        ]);
        KriteriaKenaikan::create($data);
        return back()->with('success','Kriteria ditambahkan.');
    }

    public function update(Request $r, $id)
    {
        $data = $r->validate([
            'tingkat'               => 'nullable|string|max:10',
            'nilai_min_akhir'       => 'required|numeric|min:0|max:100',
            'maks_tidak_tuntas'     => 'required|integer|min:0|max:99',
            'min_rata_rata'         => 'nullable|numeric|min:0|max:100',
            'min_kehadiran_persen'  => 'nullable|numeric|min:0|max:100',
            'remedial_diperbolehkan'=> 'required|boolean',
            'berlaku_mulai_ta'      => 'nullable|string|max:20',
            'catatan'               => 'nullable|string|max:255',
        ]);
        KriteriaKenaikan::findOrFail($id)->update($data);
        return back()->with('success','Kriteria diperbarui.');
    }

    public function destroy($id)
    {
        KriteriaKenaikan::findOrFail($id)->delete();
        return back()->with('success','Kriteria dihapus.');
    }
}
