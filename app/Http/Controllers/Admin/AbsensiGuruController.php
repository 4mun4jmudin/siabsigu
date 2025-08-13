<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AbsensiGuruController extends Controller
{
    /**
     * Menampilkan halaman dasbor absensi guru dengan data dinamis per tab.
     */
    public function index(Request $request)
    {
        // Validasi semua kemungkinan parameter filter dari semua tab
        $request->validate([
            'tab' => 'nullable|string|in:harian,riwayat,laporan_bulanan,laporan_semester',
            'tanggal' => 'nullable|date',
            'search' => 'nullable|string',
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2000',
            'id_tahun_ajaran' => 'nullable|string|exists:tbl_tahun_ajaran,id_tahun_ajaran',
        ]);

        $activeTab = $request->input('tab', 'harian');
        
        // Inisialisasi semua props dengan nilai default untuk mencegah error di frontend
        $props = [
            'absensiData' => collect(),
            'stats' => null,
            'guruBelumAbsen' => collect(),
            'riwayatAbsensi' => null,
            'laporanBulanan' => collect(),
            'laporanSemester' => collect(),
            'tahunAjaranOptions' => TahunAjaran::latest()->get(),
        ];

        // Memanggil method yang sesuai untuk mengambil data berdasarkan tab aktif
        if ($activeTab === 'harian') {
            $this->prepareDataHarian($request, $props);
        } elseif ($activeTab === 'riwayat') {
            $this->prepareDataRiwayat($request, $props);
        } elseif ($activeTab === 'laporan_bulanan') {
            $this->prepareDataLaporanBulanan($request, $props);
        } elseif ($activeTab === 'laporan_semester') {
            $this->prepareDataLaporanSemester($request, $props);
        }
        
        // Menambahkan semua parameter filter ke props untuk dikirim ke frontend
        $props['filters'] = $request->all();
        // Menetapkan nilai default untuk filter jika tidak ada di request
        if (empty($props['filters']['tanggal'])) $props['filters']['tanggal'] = now()->toDateString();
        if (empty($props['filters']['bulan'])) $props['filters']['bulan'] = now()->month;
        if (empty($props['filters']['tahun'])) $props['filters']['tahun'] = now()->year;
        $props['filters']['tab'] = $activeTab;

        return Inertia::render('admin/AbsensiGuru/Index', $props);
    }

    /**
     * Menyiapkan data untuk tab "Absensi Hari Ini".
     */
    private function prepareDataHarian(Request $request, array &$props)
    {
        $tanggal = $request->input('tanggal') ? Carbon::parse($request->input('tanggal')) : Carbon::today();
        
        $absensiData = AbsensiGuru::with('guru')
            ->whereDate('tanggal', $tanggal->toDateString())
            ->when($request->input('search'), function ($query, $search) {
                $query->whereHas('guru', function ($q) use ($search) {
                    $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%");
                });
            })
            ->get();

        $props['stats'] = [
            'total_guru' => Guru::where('status', 'Aktif')->count(),
            'hadir' => $absensiData->where('status_kehadiran', 'Hadir')->count(),
            'izin' => $absensiData->where('status_kehadiran', 'Izin')->count(),
            'sakit' => $absensiData->where('status_kehadiran', 'Sakit')->count(),
            'alfa' => $absensiData->where('status_kehadiran', 'Alfa')->count(),
        ];
        
        $guruSudahAbsenIds = $absensiData->pluck('id_guru');
        $props['guruBelumAbsen'] = Guru::where('status', 'Aktif')->whereNotIn('id_guru', $guruSudahAbsenIds)->get(['id_guru', 'nama_lengkap', 'nip']);
        $props['absensiData'] = $absensiData;
    }

    /**
     * Menyiapkan data untuk tab "Riwayat Absensi" (30 hari terakhir).
     */
    private function prepareDataRiwayat(Request $request, array &$props)
    {
        $props['riwayatAbsensi'] = AbsensiGuru::with('guru')
            ->whereBetween('tanggal', [now()->subDays(30), now()])
            ->when($request->input('search'), function ($query, $search) {
                $query->whereHas('guru', function ($q) use ($search) {
                    $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nip', 'like', "%{$search}%");
                });
            })
            ->latest('tanggal')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * Menyiapkan data untuk tab "Laporan Bulanan".
     */
    private function prepareDataLaporanBulanan(Request $request, array &$props)
    {
        $bulan = $request->input('bulan', now()->month);
        $tahun = $request->input('tahun', now()->year);

        $props['laporanBulanan'] = Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->where('status_kehadiran', 'Alfa'),
            ])
            ->get();
    }

    /**
     * Menyiapkan data untuk tab "Laporan Semester".
     */
    private function prepareDataLaporanSemester(Request $request, array &$props)
    {
        $tahunAjaranAktif = TahunAjaran::where('status', 'Aktif')->first();
        $idTahunAjaran = $request->input('id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran ?? null);

        if (!$idTahunAjaran) {
            return; // Tidak melakukan query jika tidak ada tahun ajaran terpilih
        }

        $selectedTahunAjaran = TahunAjaran::find($idTahunAjaran);
        $tahun = explode('/', $selectedTahunAjaran->tahun_ajaran)[0];
        
        if ($selectedTahunAjaran->semester === 'Ganjil') {
            $startDate = Carbon::create($tahun, 7, 1)->startOfMonth(); // 1 Juli
            $endDate = Carbon::create($tahun, 12, 31)->endOfMonth(); // 31 Desember
        } else { // Genap
            $tahun++; // Tahun ajaran berikutnya
            $startDate = Carbon::create($tahun, 1, 1)->startOfMonth(); // 1 Januari
            $endDate = Carbon::create($tahun, 6, 30)->endOfMonth(); // 30 Juni
        }

        $props['laporanSemester'] = Guru::where('status', 'Aktif')
            ->withCount([
                'absensi as hadir' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Hadir'),
                'absensi as sakit' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Sakit'),
                'absensi as izin' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Izin'),
                'absensi as alfa' => fn($q) => $q->whereBetween('tanggal', [$startDate, $endDate])->where('status_kehadiran', 'Alfa'),
            ])
            ->get();
    }

    /**
     * Menyimpan atau memperbarui data absensi manual dari modal.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'id_guru' => 'required|exists:tbl_guru,id_guru',
            'status_kehadiran' => 'required|string|in:Hadir,Sakit,Izin,Alfa,Dinas Luar',
            'jam_masuk' => 'nullable|required_if:status_kehadiran,Hadir|date_format:H:i',
            'jam_pulang' => 'nullable|date_format:H:i|after_or_equal:jam_masuk',
            'keterangan' => 'nullable|string|max:255',
        ]);

        AbsensiGuru::updateOrCreate(
            [
                'id_guru' => $request->id_guru,
                'tanggal' => $request->tanggal,
            ],
            [
                'id_absensi' => 'AG-' . Carbon::parse($request->tanggal)->format('ymd') . '-' . $request->id_guru,
                'status_kehadiran' => $request->status_kehadiran,
                'jam_masuk' => $request->status_kehadiran === 'Hadir' ? $request->jam_masuk : null,
                'jam_pulang' => $request->status_kehadiran === 'Hadir' ? $request->jam_pulang : null,
                'keterangan' => $request->keterangan,
                'metode_absen' => 'Manual',
                'id_penginput_manual' => Auth::id(),
            ]
        );

        return back()->with('success', 'Absensi manual berhasil disimpan.');
    }
}
