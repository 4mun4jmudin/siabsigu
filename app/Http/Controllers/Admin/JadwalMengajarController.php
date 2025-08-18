<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JadwalMengajar;
use Illuminate\Http\Request;
use App\Models\Kelas;
use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\JadwalMengajarExport;
use Barryvdh\DomPDF\Facade\Pdf;
// use Illuminate\Support\Facades\Validator;

use Carbon\Carbon;
use Illuminate\Validation\Rule;

class JadwalMengajarController extends Controller
{
    /**
     * Menampilkan halaman utama jadwal mengajar.
     */
    public function index(Request $request)
    {

        $filters = $request->validate([
            'filter_by' => 'nullable|in:kelas,guru',
            'kelas_id' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'guru_id' => 'nullable|string|exists:tbl_guru,id_guru',
        ]);

        $filterBy = $request->input('filter_by', 'kelas');
        $selectedKelasId = $request->input('kelas_id', Kelas::orderBy('tingkat')->first()?->id_kelas);
        $selectedGuruId = $request->input('guru_id');

        $currentFilters = [
            'filter_by' => $filterBy,
            'kelas_id' => $selectedKelasId,
            'guru_id' => $selectedGuruId,
        ];

        $tahunAjaranAktif = TahunAjaran::where('status', 'Aktif')->first();

        $query = JadwalMengajar::query()
            ->with(['guru:id_guru,nama_lengkap', 'kelas:id_kelas,tingkat,jurusan', 'mapel:id_mapel,nama_mapel'])
            ->where('id_tahun_ajaran', $tahunAjaranAktif?->id_tahun_ajaran)
            ->orderBy('jam_mulai');

        // Terapkan filter berdasarkan pilihan
        if ($filterBy === 'kelas' && $selectedKelasId) {
            $query->where('id_kelas', $selectedKelasId);
        } elseif ($filterBy === 'guru' && $selectedGuruId) {
            $query->where('id_guru', $selectedGuruId);
        } else {
            // Jika filter guru dipilih tapi ID guru kosong, jangan tampilkan apa-apa
            if ($filterBy === 'guru') $query->where('id_guru', 0);
        }

        $jadwal = $query->get();
        $jadwalByDay = $jadwal->groupBy('hari');

        $totalJam = 0;
        foreach ($jadwal as $j) {
            $mulai = Carbon::parse($j->jam_mulai);
            $selesai = Carbon::parse($j->jam_selesai);
            // Hitung selisih jam, bulatkan ke 2 desimal
            $totalJam += round($mulai->diffInMinutes($selesai) / 60, 2);
        }

        $stats = [
            'total_jadwal' => $jadwal->count(),
            'total_jam_per_minggu' => (int) round($totalJam),
            'jumlah_mapel' => $jadwal->unique('id_mapel')->count(),
            'jumlah_guru' => $jadwal->unique('id_guru')->count(),
        ];

        $timeSlots = [];
        foreach ($jadwal as $j) {
            $slotStart = Carbon::parse($j->jam_mulai)->format('H:i');
            $slotEnd = Carbon::parse($j->jam_selesai)->format('H:i');
            $slot = $slotStart . ' - ' . $slotEnd;
            if (!in_array($slot, $timeSlots)) {
                $timeSlots[] = $slot;
            }
        }       
        
        usort($timeSlots, function($a, $b) {
            list($aStart,) = explode(' - ', $a);
            list($bStart,) = explode(' - ', $b);
            return strtotime($aStart) <=> strtotime($bStart);
        });

        $scheduleGrid = [];
        foreach ($timeSlots as $slot) {
            $row = ['time' => $slot];
            list($start, $end) = explode(' - ', $slot);
            foreach (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as $day) {
                $row[$day] = $jadwal->where('hari', $day)
                    ->where('jam_mulai', $start)
                    ->where('jam_selesai', $end)
                    ->first();
            }
            $scheduleGrid[] = $row;
        }

        return Inertia::render('admin/JadwalMengajar/Index', [
            'kelasOptions' => fn() => Kelas::orderBy('tingkat')->get(),
            'guruOptions' => fn() => Guru::where('status', 'Aktif')->orderBy('nama_lengkap')->get(),
            'mapelOptions' => fn() => MataPelajaran::orderBy('nama_mapel')->get(),
            'jadwalByDay' => $jadwalByDay,
            'scheduleGrid' => $scheduleGrid,
            'tahunAjaranAktif' => $tahunAjaranAktif,
            'stats' => $stats,
            // 'filters' => $currentFilters,
            'filters' => [
                'filter_by' => $filterBy,
                'kelas_id' => $selectedKelasId,
                'guru_id' => $selectedGuruId,
            ]
        ]);
    }

    /**
     * Menyimpan jadwal mengajar baru ke database dengan validasi konflik.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_tahun_ajaran' => 'required|string|exists:tbl_tahun_ajaran,id_tahun_ajaran',
            'id_kelas' => 'required|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'required|string|exists:tbl_mata_pelajaran,id_mapel',
            'id_guru' => 'required|string|exists:tbl_guru,id_guru',
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        // =============================================================
        // PANGGIL VALIDASI KONFLIK DI SINI
        // =============================================================
        $this->validateConflict($validated);

        $id_jadwal = 'JDW-' . now()->format('ymdHis') . rand(10, 99);
        $dataToCreate = array_merge(['id_jadwal' => $id_jadwal], $validated);
        JadwalMengajar::create($dataToCreate);

        return back()->with('success', 'Jadwal mengajar berhasil ditambahkan.');
    }
    /**
     * Memperbarui data jadwal mengajar yang sudah ada.
     */
    public function update(Request $request, JadwalMengajar $jadwalMengajar)
    {
        $validated = $request->validate([
            'id_tahun_ajaran' => 'required|string|exists:tbl_tahun_ajaran,id_tahun_ajaran',
            'id_kelas' => 'required|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'required|string|exists:tbl_mata_pelajaran,id_mapel',
            'id_guru' => 'required|string|exists:tbl_guru,id_guru',
            'hari' => 'required|string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
        ]);

        // =============================================================
        // PANGGIL VALIDASI KONFLIK DI SINI
        // =============================================================
        $this->validateConflict($validated, $jadwalMengajar->id_jadwal);

        $jadwalMengajar->update($validated);

        return back()->with('success', 'Jadwal mengajar berhasil diperbarui.');
    }

    /**
     * Menghapus data jadwal mengajar dari database.
     */
    public function destroy(JadwalMengajar $jadwalMengajar)
    {
        $jadwalMengajar->delete();
        return back()->with('success', 'Jadwal mengajar berhasil dihapus.');
    }

    /**
     * Fungsi helper untuk validasi jadwal yang bentrok.
     */
    private function validateConflict($data, $ignoreId = null)
    {
        $query = JadwalMengajar::where('hari', $data['hari'])
            ->where(function ($q) use ($data) {
                $q->where(function ($sq) use ($data) {
                    $sq->where('jam_mulai', '<', $data['jam_selesai'])
                        ->where('jam_selesai', '>', $data['jam_mulai']);
                });
            });

        if ($ignoreId) {
            $query->where('id_jadwal', '!=', $ignoreId);
        }

        // Cek konflik di kelas yang sama
        $kelasConflict = (clone $query)->where('id_kelas', $data['id_kelas'])->first();
        if ($kelasConflict) {
            // Gunakan ValidationException untuk mengirim pesan error yang rapi
            throw ValidationException::withMessages([
                'id_kelas' => 'Jadwal bentrok! Sudah ada pelajaran lain di kelas ini pada jam tersebut.',
            ]);
        }

        // Cek konflik untuk guru yang sama
        $guruConflict = (clone $query)->where('id_guru', $data['id_guru'])->first();
        if ($guruConflict) {
            // Gunakan ValidationException untuk mengirim pesan error yang rapi
            throw ValidationException::withMessages([
                'id_guru' => 'Jadwal bentrok! Guru ini sudah memiliki jadwal lain pada jam tersebut.',
            ]);
        }
    }
    public function show(JadwalMengajar $jadwalMengajar)
    {
        // Eager load semua relasi yang dibutuhkan untuk modal detail
        $jadwalMengajar->load([
            'guru' => function ($query) {
                // Memuat relasi dari guru ke pengguna untuk melihat username/email jika ada
                $query->with('pengguna:id_pengguna,username,email');
            },
            'kelas' => function ($query) {
                // Memuat relasi dari kelas ke wali kelasnya
                $query->with('waliKelas:id_guru,nama_lengkap');
            },
            'mapel', // Memuat detail mata pelajaran
            'tahunAjaran' // Memuat detail tahun ajaran
        ]);

        // Mengembalikan data sebagai respons JSON yang akan diambil oleh frontend
        return response()->json($jadwalMengajar);
    }
    public function updateTime(Request $request, JadwalMengajar $jadwalMengajar)
    {
        $validated = $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after:start',
        ]);

        $start = Carbon::parse($validated['start']);
        $end = Carbon::parse($validated['end']);

        // Terjemahkan nama hari dari Inggris ke Indonesia
        $englishDay = $start->format('l');
        $dayMap = [
            'Monday'    => 'Senin', 'Tuesday'   => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday'  => 'Kamis', 'Friday'    => 'Jumat',  'Saturday'  => 'Sabtu',
            'Sunday'    => 'Minggu',
        ];
        $indonesianDay = $dayMap[$englishDay] ?? $englishDay;

        // Siapkan data baru untuk divalidasi konfliknya
        $newData = [
            'id_guru' => $jadwalMengajar->id_guru,
            'id_kelas' => $jadwalMengajar->id_kelas,
            'hari' => $indonesianDay,
            'jam_mulai' => $start->format('H:i:s'),
            'jam_selesai' => $end->format('H:i:s'),
        ];
        
        // Gunakan kembali fungsi validasi konflik
        $this->validateConflict($newData, $jadwalMengajar->id_jadwal);

        // Jika tidak ada konflik, perbarui data
        $jadwalMengajar->update([
            'hari' => $newData['hari'],
            'jam_mulai' => $newData['jam_mulai'],
            'jam_selesai' => $newData['jam_selesai'],
        ]);

        return back()->with('success', 'Jadwal berhasil digeser.');
    }

    public function exportExcel(Request $request)
    {
        $filters = $request->validate([
            'filter_by' => 'required|in:kelas,guru',
            'kelas_id' => 'nullable|string',
            'guru_id' => 'nullable|string',
        ]);
        
        $tahunAjaranAktif = TahunAjaran::where('status', 'Aktif')->first();
        $filters['id_tahun_ajaran'] = $tahunAjaranAktif->id_tahun_ajaran;

        $fileName = 'jadwal-mengajar.xlsx';
        return Excel::download(new JadwalMengajarExport($filters), $fileName);
    }

    public function exportPdf(Request $request)
    {
        $filters = $request->validate([
            'filter_by' => 'required|in:kelas,guru',
            'kelas_id' => 'nullable|string',
            'guru_id' => 'nullable|string',
        ]);

        $tahunAjaranAktif = TahunAjaran::where('status', 'Aktif')->first();
        
        $query = JadwalMengajar::query()
            ->with(['guru', 'kelas', 'mapel'])
            ->where('id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran)
            ->orderBy('jam_mulai');
        
        $title = 'Jadwal Mengajar';
        if ($filters['filter_by'] === 'kelas' && !empty($filters['kelas_id'])) {
            $query->where('id_kelas', $filters['kelas_id']);
            $kelas = Kelas::find($filters['kelas_id']);
            $title = 'Jadwal Pelajaran Kelas: ' . ($kelas ? $kelas->nama_lengkap : '');
        } elseif ($filters['filter_by'] === 'guru' && !empty($filters['guru_id'])) {
            $query->where('id_guru', $filters['guru_id']);
            $guru = Guru::find($filters['guru_id']);
            $title = 'Jadwal Mengajar Guru: ' . ($guru ? $guru->nama_lengkap : '');
        }

        $jadwal = $query->get();
        $jadwalGrouped = $jadwal->groupBy('hari');

        $pdf = Pdf::loadView('pdf.jadwal_mengajar_pdf', [
            'jadwalGrouped' => $jadwalGrouped,
            'title' => $title,
            'tahunAjaran' => $tahunAjaranAktif,
        ]);

        return $pdf->download('jadwal-mengajar.pdf');
    }
}
