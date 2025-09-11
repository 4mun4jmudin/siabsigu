<?php

namespace App\Http\Controllers\OrangTua;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswa;
use App\Models\AbsensiSiswaMapel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AbsensiController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $orangTua = $user->orangTuaWali;

        if (!$orangTua || !$orangTua->id_siswa) {
            return Inertia::render('OrangTua/Absensi/Index', ['siswa' => null]);
        }

        $siswa = $orangTua->siswa()->with('kelas')->first();

        // --- Filter untuk Kalender ---
        $year = $request->input('tahun', Carbon::now()->year);
        $month = $request->input('bulan', Carbon::now()->month);
        $date = Carbon::createFromDate($year, $month, 1);
        $startDate = $date->copy()->startOfMonth();
        $endDate = $date->copy()->endOfMonth();

        // 1. Data absensi harian untuk kalender
        $absensiHarianCalendar = AbsensiSiswa::where('id_siswa', $siswa->id_siswa)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->tanggal)->format('Y-m-d');
            });

        // 2. Data absensi mapel untuk detail kalender
        $absensiMapelCalendar = AbsensiSiswaMapel::where('id_siswa', $siswa->id_siswa)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->with(['jadwal.mapel', 'jadwal.guru'])
            ->orderBy('jam_mulai', 'asc')
            ->get()
            ->groupBy(function ($item) {
                return Carbon::parse($item->tanggal)->format('Y-m-d');
            });

        // --- Query baru untuk tab "Riwayat Kehadiran" ---
        $riwayatQuery = AbsensiSiswa::query()
            ->where('id_siswa', $siswa->id_siswa)
            ->orderBy('tanggal', 'desc');

        // Terapkan filter tanggal jika ada
        if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $riwayatQuery->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai]);
        }
        
        // Terapkan filter status jika ada
        if ($request->filled('status') && $request->status !== 'Semua') {
            if ($request->status === 'Terlambat') {
                $riwayatQuery->where('menit_keterlambatan', '>', 0);
            } else {
                $riwayatQuery->where('status_kehadiran', $request->status);
            }
        }

        $riwayatKehadiran = $riwayatQuery->paginate(15)->withQueryString();

        return Inertia::render('OrangTua/Absensi/Index', [
            'siswa' => $siswa,
            'absensiHarian' => $absensiHarianCalendar,
            'absensiMapel' => $absensiMapelCalendar,
            'riwayatKehadiran' => $riwayatKehadiran,
            'filters' => $request->only(['bulan', 'tahun', 'status', 'tanggal_mulai', 'tanggal_selesai']) + [
                'bulan' => (int)$month,
                'tahun' => (int)$year,
            ]
        ]);
    }
}