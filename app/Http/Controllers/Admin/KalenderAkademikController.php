<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KalenderAkademik;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class KalenderAkademikController extends Controller
{
    /**
     * Tampilkan daftar hari libur di Kalender Akademik
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $kalender = KalenderAkademik::query()
            ->when($search, function ($q, $search) {
                $q->where('keterangan', 'like', "%{$search}%")
                  ->orWhere('jenis_libur', 'like', "%{$search}%");
            })
            ->orderBy('tanggal_mulai', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/KalenderAkademik/Index', [
            'kalender' => $kalender,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Simpan hari libur baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'required|string|max:255',
            'jenis_libur' => ['required', Rule::in(['Nasional', 'Sekolah', 'Lainnya'])],
        ]);

        $id_kalender = 'KLD-' . Carbon::now()->format('ym') . '-' . rand(100, 999);

        KalenderAkademik::create([
            'id_kalender' => $id_kalender,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'keterangan' => $request->keterangan,
            'jenis_libur' => $request->jenis_libur,
        ]);

        return redirect()->back()->with('success', 'Hari libur berhasil ditambahkan.');
    }

    /**
     * Update hari libur
     */
    public function update(Request $request, $id)
    {
        $kalender = KalenderAkademik::findOrFail($id);

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'required|string|max:255',
            'jenis_libur' => ['required', Rule::in(['Nasional', 'Sekolah', 'Lainnya'])],
        ]);

        $kalender->update([
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'keterangan' => $request->keterangan,
            'jenis_libur' => $request->jenis_libur,
        ]);

        return redirect()->back()->with('success', 'Hari libur berhasil diperbarui.');
    }

    /**
     * Hapus hari libur
     */
    public function destroy($id)
    {
        $kalender = KalenderAkademik::findOrFail($id);
        $kalender->delete();

        return redirect()->back()->with('success', 'Hari libur berhasil dihapus.');
    }
}
