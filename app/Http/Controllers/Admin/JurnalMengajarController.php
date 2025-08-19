<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JurnalMengajar;
use App\Models\JadwalMengajar;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\JurnalMengajarExport;
use Barryvdh\DomPDF\Facade\Pdf;

class JurnalMengajarController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->all(
            'search',
            'tanggal_mulai',
            'tanggal_selesai',
            'id_guru',
            'id_kelas'
        );

        $jurnals = JurnalMengajar::query()
            ->with([
                'jadwalMengajar' => function ($query) {
                    $query->with([
                        'guru' => fn($q) => $q->select('id_guru', 'nama_lengkap'),
                        'kelas' => fn($q) => $q->select('id_kelas', 'tingkat', 'jurusan'),
                        'mataPelajaran' => fn($q) => $q->select('id_mapel', 'nama_mapel'),
                        'mapel' => fn($q) => $q->select('id_mapel', 'nama_mapel'),
                    ]);
                },
                'guruPengganti' => fn($q) => $q->select('id_guru', 'nama_lengkap'),
                'penginputManual' => fn($q) => $q->select('id_pengguna', 'nama_lengkap'),
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('jadwalMengajar.guru', fn($q) => $q->where('nama_lengkap', 'like', "%{$search}%"))
                        ->orWhereHas('jadwalMengajar.kelas', fn($q) => $q->where('tingkat', 'like', "%{$search}%")->orWhere('jurusan', 'like', "%{$search}%"))
                        ->orWhere('materi_pembahasan', 'like', "%{$search}%");
                });
            })
            ->when($filters['tanggal_mulai'] ?? null, fn($query, $date) => $query->whereDate('tanggal', '>=', $date))
            ->when($filters['tanggal_selesai'] ?? null, fn($query, $date) => $query->whereDate('tanggal', '<=', $date))
            ->when($filters['id_guru'] ?? null, fn($query, $guruId) => $query->whereHas('jadwalMengajar', fn($q) => $q->where('id_guru', $guruId)))
            ->when($filters['id_kelas'] ?? null, fn($query, $kelasId) => $query->whereHas('jadwalMengajar', fn($q) => $q->where('id_kelas', $kelasId)))
            ->latest('tanggal')
            ->get();

        $stats = [
            'total_jurnal' => JurnalMengajar::count(),
            'mengajar' => JurnalMengajar::where('status_mengajar', 'Mengajar')->count(),
            'digantikan' => JurnalMengajar::where('status_mengajar', 'Digantikan')->count(),
            'kosong' => JurnalMengajar::where('status_mengajar', 'Kosong')->count(),
        ];

        return Inertia::render('admin/JurnalMengajar/Index', [
            'jurnals' => $jurnals,
            'stats' => $stats,
            'filters' => $filters,
            'guruOptions' => Guru::orderBy('nama_lengkap')->get(['id_guru', 'nama_lengkap']),
            'kelasOptions' => Kelas::orderBy('tingkat')->get(['id_kelas', 'tingkat', 'jurusan']),
        ]);
    }
    
    // --- PERBAIKAN: Menambahkan metode show() ---
    public function show(JurnalMengajar $jurnalMengajar)
    {
        $jurnalMengajar->load([
            'jadwalMengajar' => function ($query) {
                $query->with([
                    'guru' => fn($q) => $q->select('id_guru', 'nama_lengkap'),
                    'kelas' => fn($q) => $q->select('id_kelas', 'tingkat', 'jurusan'),
                    'mataPelajaran' => fn($q) => $q->select('id_mapel', 'nama_mapel'),
                    'mapel' => fn($q) => $q->select('id_mapel', 'nama_mapel'),
                ]);
            },
            'guruPengganti' => fn($q) => $q->select('id_guru', 'nama_lengkap'),
            'penginputManual' => fn($q) => $q->select('id_pengguna', 'nama_lengkap'),
        ]);

        return Inertia::render('admin/JurnalMengajar/Show', [
            'jurnal' => $jurnalMengajar,
        ]);
    }
    
    public function create(Request $request)
    {
        $jadwalOptions = JadwalMengajar::with(['guru', 'kelas', 'mataPelajaran', 'mapel'])->get();
        $guruOptions = Guru::orderBy('nama_lengkap')->get();

        return Inertia::render('admin/JurnalMengajar/Create', [
            'jadwalOptions' => $jadwalOptions,
            'guruOptions' => $guruOptions,
            'jadwalId' => $request->query('id_jadwal'),
        ]);
    }

    public function edit(JurnalMengajar $jurnalMengajar)
    {
        $jurnalMengajar->load(['jadwalMengajar.guru', 'jadwalMengajar.kelas', 'jadwalMengajar.mataPelajaran', 'jadwalMengajar.mapel']);
        $jadwalOptions = JadwalMengajar::with(['guru', 'kelas', 'mataPelajaran', 'mapel'])->get();
        $guruOptions = Guru::orderBy('nama_lengkap')->get();

        return Inertia::render('admin/JurnalMengajar/Edit', [
            'jurnal' => $jurnalMengajar,
            'jadwalOptions' => $jadwalOptions,
            'guruOptions' => $guruOptions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_jadwal' => 'required|string|exists:tbl_jadwal_mengajar,id_jadwal',
            'tanggal' => 'required|date',
            'jam_masuk_kelas' => 'nullable|date_format:H:i',
            'jam_keluar_kelas' => 'nullable|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Digantikan', 'Kosong'])],
            'id_guru_pengganti' => 'nullable|required_if:status_mengajar,Digantikan|exists:tbl_guru,id_guru',
            'materi_pembahasan' => 'nullable|string',
        ]);

        $id_jurnal = 'JRN-' . now()->format('ymdHis') . rand(10, 99);
        JurnalMengajar::create(array_merge($validated, [
            'id_jurnal' => $id_jurnal,
            'id_penginput_manual' => Auth::id(),
        ]));

        return to_route('admin.jurnal-mengajar.index')->with('success', 'Jurnal mengajar berhasil ditambahkan.');
    }



    public function update(Request $request, JurnalMengajar $jurnalMengajar)
    {
        $validated = $request->validate([
            'id_jadwal' => 'required|string|exists:tbl_jadwal_mengajar,id_jadwal',
            'tanggal' => 'required|date',
            'jam_masuk_kelas' => 'nullable|date_format:H:i',
            'jam_keluar_kelas' => 'nullable|date_format:H:i|after:jam_masuk_kelas',
            'status_mengajar' => ['required', 'string', Rule::in(['Mengajar', 'Tugas', 'Digantikan', 'Kosong'])],
            'id_guru_pengganti' => 'nullable|required_if:status_mengajar,Digantikan|exists:tbl_guru,id_guru',
            'materi_pembahasan' => 'nullable|string',
        ]);

        $jurnalMengajar->update($validated);

        return to_route('admin.jurnal-mengajar.index')->with('success', 'Jurnal mengajar berhasil diperbarui.');
    }

    public function destroy(JurnalMengajar $jurnalMengajar)
    {
        $jurnalMengajar->delete();
        return back()->with('success', 'Jurnal mengajar berhasil dihapus.');
    }

    public function findGuruPengganti(Request $request): JsonResponse
    {
        $request->validate([
            'id_jadwal' => 'required|string|exists:tbl_jadwal_mengajar,id_jadwal',
        ]);

        $jadwalAsli = JadwalMengajar::find($request->id_jadwal);
        if (!$jadwalAsli) {
            return response()->json(['error' => 'Jadwal mengajar tidak ditemukan.'], 404);
        }

        $hari = $jadwalAsli->hari;
        $jamMulai = $jadwalAsli->jam_mulai;
        $jamSelesai = $jadwalAsli->jam_selesai;

        $guruBentrokIds = JadwalMengajar::where('hari', $hari)
            ->where(function ($query) use ($jamMulai, $jamSelesai) {
                $query->where('jam_mulai', '<', $jamSelesai)
                    ->where('jam_selesai', '>', $jamMulai);
            })
            ->pluck('id_guru')
            ->unique()
            ->toArray();

        $guruTersedia = Guru::where('status', 'Aktif')
            ->whereNotIn('id_guru', $guruBentrokIds)
            ->where('id_guru', '!=', $jadwalAsli->id_guru)
            ->orderBy('nama_lengkap')
            ->get(['id_guru', 'nip', 'nama_lengkap']);

        return response()->json(['guru_tersedia' => $guruTersedia]);
    }

    public function exportExcel(Request $request)
    {
        $filters = $request->all(
            'search',
            'tanggal_mulai',
            'tanggal_selesai',
            'id_guru',
            'id_kelas'
        );
        $fileName = 'jurnal-mengajar-' . Carbon::now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new JurnalMengajarExport($filters), $fileName);
    }

    public function exportPdf(Request $request)
    {
        $filters = $request->all(
            'search',
            'tanggal_mulai',
            'tanggal_selesai',
            'id_guru',
            'id_kelas'
        );

        $query = JurnalMengajar::query()
            ->with([
                'jadwalMengajar.guru',
                'jadwalMengajar.kelas',
                'jadwalMengajar.mataPelajaran',
                'jadwalMengajar.mapel',
                'guruPengganti'
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('jadwalMengajar.guru', fn($q) => $q->where('nama_lengkap', 'like', "%{$search}%"))
                    ->orWhereHas('jadwalMengajar.kelas', fn($q) => $q->where('tingkat', 'like', "%{$search}%")->orWhere('jurusan', 'like', "%{$search}%"))
                    ->orWhere('materi_pembahasan', 'like', "%{$search}%");
            })
            ->when($filters['tanggal_mulai'] ?? null, fn($query, $date) => $query->whereDate('tanggal', '>=', $date))
            ->when($filters['tanggal_selesai'] ?? null, fn($query, $date) => $query->whereDate('tanggal', '<=', $date))
            ->when($filters['id_guru'] ?? null, fn($query, $guruId) => $query->whereHas('jadwalMengajar', fn($q) => $q->where('id_guru', $guruId)))
            ->when($filters['id_kelas'] ?? null, fn($query, $kelasId) => $query->whereHas('jadwalMengajar', fn($q) => $q->where('id_kelas', $kelasId)))
            ->latest('tanggal');

        $jurnals = $query->get();

        $data = [
            'jurnals' => $jurnals,
            'filters' => $filters,
            'school' => [
                'name' => config('app.name', 'SMKS IT AL-HAWARI'),
                'address' => 'SMKS IT AL-HAWARI terletak di KP. CURUG RT/RW 02/06 DESA CIPAREUAN, Cipareuan, Kec. Cibiuk, Kab. Garut, Jawa Barat.',
                'phone' => '085871071738',
            ],
        ];

        $pdf = Pdf::loadView('pdf.jurnal_mengajar_pdf_v2', $data)
            ->setPaper('a4', 'landscape');

        return $pdf->download('jurnal-mengajar-' . now()->format('Y-m-d') . '.pdf');
    }
}