<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogAktivitasController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = LogAktivitas::with('pengguna')->latest('waktu');

        // Apply search filter if provided
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('aksi', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%")
                  ->orWhereHas('pengguna', function ($q2) use ($search) {
                      $q2->where('nama_lengkap', 'like', "%{$search}%")
                         ->orWhere('username', 'like', "%{$search}%");
                  });
            });
        }

        // Apply date filter if provided (opsional)
        if ($request->has('date') && $request->date != '') {
             $query->whereDate('waktu', $request->date);
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/LogAktivitas/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'date']),
        ]);
    }
}
