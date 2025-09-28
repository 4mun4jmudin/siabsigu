<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BobotNilaiMapel;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BobotNilaiMapelController extends Controller
{
    public function index(Request $r)
    {
        $items = BobotNilaiMapel::with(['mapel:id_mapel,nama_mapel','tahunAjaran:id_tahun_ajaran,tahun_ajaran'])
            ->orderBy('id_mapel')->orderBy('id_tahun_ajaran')->orderBy('semester')
            ->paginate(30);

        $mapel = MataPelajaran::orderBy('nama_mapel')->get(['id_mapel','nama_mapel']);
        $ta    = TahunAjaran::orderByDesc('status')->orderBy('tahun_ajaran')->get(['id_tahun_ajaran','tahun_ajaran']);

        return Inertia::render('admin/Penilaian/Bobot/Index', [
            'items' => $items,
            'options' => [
                'mapel' => $mapel,
                'tahunAjaran' => $ta,
                'semester' => [['value'=>'Ganjil','label'=>'Ganjil'],['value'=>'Genap','label'=>'Genap']],
            ],
        ]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'id_mapel'        => 'required|string',
            'id_tahun_ajaran' => 'required|string',
            'semester'        => 'required|in:Ganjil,Genap',
            'bobot_tugas'     => 'nullable|numeric|min:0|max:100',
            'bobot_uh'        => 'nullable|numeric|min:0|max:100',
            'bobot_pts'       => 'nullable|numeric|min:0|max:100',
            'bobot_pas'       => 'nullable|numeric|min:0|max:100',
            'bobot_praktik'   => 'nullable|numeric|min:0|max:100',
            'bobot_proyek'    => 'nullable|numeric|min:0|max:100',
        ]);

        // Pastikan unik kombinasi (id_mapel, id_tahun_ajaran, semester)
        $row = BobotNilaiMapel::updateOrCreate(
            [
                'id_mapel'        => $data['id_mapel'],
                'id_tahun_ajaran' => $data['id_tahun_ajaran'],
                'semester'        => $data['semester'],
            ],
            $data
        );

        return back()->with('success','Bobot tersimpan.');
    }

    public function update(Request $r, $id)
    {
        $data = $r->validate([
            'bobot_tugas'   => 'nullable|numeric|min:0|max:100',
            'bobot_uh'      => 'nullable|numeric|min:0|max:100',
            'bobot_pts'     => 'nullable|numeric|min:0|max:100',
            'bobot_pas'     => 'nullable|numeric|min:0|max:100',
            'bobot_praktik' => 'nullable|numeric|min:0|max:100',
            'bobot_proyek'  => 'nullable|numeric|min:0|max:100',
        ]);

        $row = BobotNilaiMapel::findOrFail($id);
        $row->update($data);

        return back()->with('success','Bobot diperbarui.');
    }

    public function destroy($id)
    {
        BobotNilaiMapel::findOrFail($id)->delete();
        return back()->with('success','Bobot dihapus.');
    }
}
