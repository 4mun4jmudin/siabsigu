<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KeputusanKenaikan;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class KeputusanKenaikanController extends Controller
{
    public function index(Request $r)
    {
        $items = KeputusanKenaikan::with(['siswa:id_siswa,nama_lengkap', 'tahunAjaran:id_tahun_ajaran,tahun_ajaran', 'dariKelas:id_kelas', 'keKelas:id_kelas'])
            ->orderByDesc('ditetapkan_pada')->paginate(25);

        $ta = TahunAjaran::orderByDesc('status')->orderBy('tahun_ajaran')->get(['id_tahun_ajaran', 'tahun_ajaran']);
        $kelas = Kelas::orderBy('id_kelas')->get(['id_kelas']);

        return Inertia::render('admin/Kenaikan/KeputusanIndex', [
            'items' => $items,
            'options' => [
                'tahunAjaran' => $ta,
                'kelas' => $kelas,
                'status' => [['value' => 'Naik', 'label' => 'Naik'], ['value' => 'Tinggal', 'label' => 'Tinggal'], ['value' => 'Tunda', 'label' => 'Tunda']],
            ]
        ]);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'id_siswa'       => 'required|string',
            'id_tahun_ajaran' => 'required|string',
            'semester'       => 'required|in:Ganjil,Genap',
            'dari_kelas'     => 'required|string',
            'ke_kelas'       => 'nullable|string',
            'status'         => 'required|in:Naik,Tinggal,Tunda',
            'alasan'         => 'nullable|string',
        ]);
        $data['ditetapkan_oleh'] = Auth::id();
        $data['ditetapkan_pada'] = now();

        KeputusanKenaikan::updateOrCreate(
            ['id_siswa' => $data['id_siswa'], 'id_tahun_ajaran' => $data['id_tahun_ajaran'], 'semester' => $data['semester']],
            $data
        );
        return back()->with('success', 'Keputusan disimpan.');
    }

    public function update(Request $r, $id)
    {
        $data = $r->validate([
            'ke_kelas' => 'nullable|string',
            'status'   => 'required|in:Naik,Tinggal,Tunda',
            'alasan'   => 'nullable|string',
        ]);
        $row = KeputusanKenaikan::findOrFail($id);
        $data['ditetapkan_oleh'] = Auth::id();
        $data['ditetapkan_pada'] = now();
        $row->update($data);

        return back()->with('success', 'Keputusan diperbarui.');
    }

    public function destroy($id)
    {
        KeputusanKenaikan::findOrFail($id)->delete();
        return back()->with('success', 'Keputusan dihapus.');
    }
}
