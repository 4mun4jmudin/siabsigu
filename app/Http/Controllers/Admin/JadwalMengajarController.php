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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
// use App\Models\MataPelajaran;
use App\Exports\JadwalTemplateExport; // Import baru
use App\Imports\JadwalMengajarImport;
use Maatwebsite\Excel\Concerns\WithValidation;
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
            ->when($tahunAjaranAktif, fn($q) => $q->where('id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran))
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

        // Hitung total menit dulu, lalu konversi ke jam bulat (integer)
        $totalMinutes = 0;
        foreach ($jadwal as $j) {
            $mulai = Carbon::parse($j->jam_mulai);
            $selesai = Carbon::parse($j->jam_selesai);
            if ($mulai->lte($selesai)) {
                $totalMinutes += $mulai->diffInMinutes($selesai);
            } else {
                // Jika jam selesai lebih kecil (tidak biasa), abaikan atau tangani sesuai kebijakan
            }
        }
        // ubah ke jam, bulatkan ke integer (dibulatkan normal)
        $totalJam = (int) round($totalMinutes / 60);

        $stats = [
            'total_jadwal' => $jadwal->count(),
            'total_jam_per_minggu' => $totalJam,
            'jumlah_mapel' => $jadwal->unique('id_mapel')->count(),
            'jumlah_guru' => $jadwal->unique('id_guru')->count(),
        ];

        // Kumpulkan slot waktu unik, normalisasi ke format H:i:s untuk perbandingan
        $timeSlots = [];
        foreach ($jadwal as $j) {
            // Pastikan parsing aman dan konsisten
            try {
                $startFormatted = Carbon::parse($j->jam_mulai)->format('H:i:s');
                $endFormatted = Carbon::parse($j->jam_selesai)->format('H:i:s');
            } catch (\Exception $e) {
                // Jika gagal parse, skip slot ini
                continue;
            }

            $slotKey = $startFormatted . ' - ' . $endFormatted;
            if (!in_array($slotKey, $timeSlots)) {
                $timeSlots[] = $slotKey;
            }
        }

        // Urutkan slot berdasarkan waktu mulai
        usort($timeSlots, function ($a, $b) {
            [$aStart] = explode(' - ', $a);
            [$bStart] = explode(' - ', $b);
            return strcmp($aStart, $bStart);
        });

        // Bangun grid: tampilkan waktu dalam H:i - H:i (tanpa detik) untuk UI
        $scheduleGrid = [];
        foreach ($timeSlots as $slot) {
            list($start, $end) = explode(' - ', $slot);
            // format untuk tampilan
            $displayStart = Carbon::createFromFormat('H:i:s', $start)->format('H:i');
            $displayEnd = Carbon::createFromFormat('H:i:s', $end)->format('H:i');

            $row = ['time' => $displayStart . ' - ' . $displayEnd];

            foreach (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as $day) {
                // Gunakan whereTime agar perbandingan berdasar waktu (bukan string exact)
                $found = $jadwal->where('hari', $day)
                    ->first(function ($item) use ($start, $end) {
                        // item jam may be 'H:i' or 'H:i:s' -> normalisasi
                        try {
                            $itemStart = Carbon::parse($item->jam_mulai)->format('H:i:s');
                            $itemEnd = Carbon::parse($item->jam_selesai)->format('H:i:s');
                        } catch (\Exception $e) {
                            return false;
                        }
                        return $itemStart === $start && $itemEnd === $end;
                    });

                // Jika tidak ditemukan dengan exact compare di atas, coba whereTime fallback pada collection
                if (!$found) {
                    $found = $jadwal->where('hari', $day)
                        ->first(function ($item) use ($start, $end) {
                            try {
                                $itemStart = Carbon::parse($item->jam_mulai)->format('H:i:s');
                                $itemEnd = Carbon::parse($item->jam_selesai)->format('H:i:s');
                            } catch (\Exception $e) {
                                return false;
                            }
                            return $itemStart === $start && $itemEnd === $end;
                        });
                }

                $row[$day] = $found ?: null;
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
            throw ValidationException::withMessages([
                'id_kelas' => 'Jadwal bentrok! Sudah ada pelajaran lain di kelas ini pada jam tersebut.',
            ]);
        }

        // Cek konflik untuk guru yang sama
        $guruConflict = (clone $query)->where('id_guru', $data['id_guru'])->first();
        if ($guruConflict) {
            throw ValidationException::withMessages([
                'id_guru' => 'Jadwal bentrok! Guru ini sudah memiliki jadwal lain pada jam tersebut.',
            ]);
        }
    }

    public function show(JadwalMengajar $jadwalMengajar)
    {
        $jadwalMengajar->load([
            'guru' => function ($query) {
                $query->with('pengguna:id_pengguna,username,email');
            },
            'kelas' => function ($query) {
                $query->with('waliKelas:id_guru,nama_lengkap');
            },
            'mapel',
            'tahunAjaran'
        ]);

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

        $englishDay = $start->format('l');
        $dayMap = [
            'Monday'    => 'Senin',
            'Tuesday'   => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday'  => 'Kamis',
            'Friday'    => 'Jumat',
            'Saturday'  => 'Sabtu',
            'Sunday'    => 'Minggu',
        ];
        $indonesianDay = $dayMap[$englishDay] ?? $englishDay;

        $newData = [
            'id_guru' => $jadwalMengajar->id_guru,
            'id_kelas' => $jadwalMengajar->id_kelas,
            'hari' => $indonesianDay,
            'jam_mulai' => $start->format('H:i:s'),
            'jam_selesai' => $end->format('H:i:s'),
        ];

        $this->validateConflict($newData, $jadwalMengajar->id_jadwal);

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
        $filters['id_tahun_ajaran'] = $tahunAjaranAktif->id_tahun_ajaran ?? null;

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
            ->when($tahunAjaranAktif, fn($q) => $q->where('id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran))
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

    public function importExcel(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:5120', // max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $file = $request->file('file');

        $import = new JadwalMengajarImport();

        try {
            Excel::import($import, $file);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Ini akan menangkap kegagalan yang tidak bisa ditangani oleh kode kustom
            $failures = $e->failures();
            return response()->json(['error' => 'Validasi file gagal', 'failures' => $failures], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memproses file: ' . $e->getMessage()], 500);
        }

        $failures = $import->getFailures(); // Ambil laporan kegagalan dari kelas impor

        if (count($failures) > 0) {
            return response()->json([
                'message' => 'Impor selesai dengan beberapa kegagalan.',
                'failures' => $failures,
            ], 200);
        }

        return response()->json(['message' => 'Semua data berhasil diimpor!']);
    }

    // public function downloadTemplate()
    // {
    //     $spreadsheet = new Spreadsheet();
    //     $sheet = $spreadsheet->getActiveSheet();
    //     $sheet->setTitle('Template Jadwal');

    //     $headers = ["Hari", "Jam Mulai", "Jam Selesai", "Kode Kelas", "NIP Guru", "Kode Mapel"];
    //     $sheet->fromArray([$headers], null, 'A1');

    //     $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
    //     $fileName = 'template_jadwal.xlsx';
    //     $path = storage_path("app/public/{$fileName}");
    //     $writer->save($path);

    //     return response()->download($path)->deleteFileAfterSend(true);
    // }

    // ✅ 2. Upload Excel → parsing → preview
    public function previewImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        $preview = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            if ($index === 0) continue; // skip header

            [$hari, $jam_mulai, $jam_selesai, $kode_kelas, $nip, $kode_mapel] = $row;

            $kelas = Kelas::where('id_kelas', $kode_kelas)->first();
            $guru  = Guru::where('nip', $nip)->first();
            $mapel = MataPelajaran::where('id_mapel', $kode_mapel)->first();

            $status = "OK";

            if (!$kelas) $status = "Kelas tidak ditemukan";
            if (!$guru) $status = "Guru tidak ditemukan";
            if (!$mapel) $status = "Mapel tidak ditemukan";
            if (strtotime($jam_mulai) >= strtotime($jam_selesai)) $status = "Jam tidak valid";

            $preview[] = [
                'hari'        => $hari,
                'jam_mulai'   => $jam_mulai,
                'jam_selesai' => $jam_selesai,
                'kelas'       => $kelas?->nama_lengkap ?? $kode_kelas,
                'guru'        => $guru?->nama_lengkap ?? $nip,
                'mapel'       => $mapel?->nama_mapel ?? $kode_mapel,
                'id_kelas'    => $kelas?->id_kelas,
                'id_guru'     => $guru?->id_guru,
                'id_mapel'    => $mapel?->id_mapel,
                'status'      => $status,
            ];

            if ($status !== "OK") {
                $errors[] = "Baris " . ($index + 1) . ": $status";
            }
        }

        return Inertia::render('Admin/JadwalMengajar/ImportPreview', [
            'preview' => $preview,
            'errors'  => $errors,
        ]);
    }

    // ✅ 3. Konfirmasi import
    public function confirmImport(Request $request)
    {
        $data = $request->input('data', []);
        $success = 0;
        $failed = [];

        DB::beginTransaction();
        try {
            foreach ($data as $row) {
                if ($row['status'] !== "OK") {
                    $failed[] = $row;
                    continue;
                }

                JadwalMengajar::create([
                    'id_jadwal'       => 'JDW-' . now()->format('ymdHis') . rand(10, 99),
                    'id_tahun_ajaran' => TahunAjaran::where('status', 'Aktif')->value('id_tahun_ajaran'),
                    'id_kelas'        => $row['id_kelas'],
                    'id_guru'         => $row['id_guru'],
                    'id_mapel'        => $row['id_mapel'],
                    'hari'            => $row['hari'],
                    'jam_mulai'       => $row['jam_mulai'],
                    'jam_selesai'     => $row['jam_selesai'],
                ]);

                $success++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['import' => $e->getMessage()]);
        }

        return redirect()->route('admin.jadwal-mengajar.index')
            ->with('message', "Import selesai: {$success} berhasil, " . count($failed) . " gagal.");
    }

    public function downloadTemplate()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Jadwal');

        // Header
        $headers = ["Hari", "Jam Mulai", "Jam Selesai", "id_kelas", "NIP", "id_mapel"];
        $sheet->fromArray([$headers], null, 'A1');

        // Contoh baris isi
        $example = ["Senin", "08:00", "09:00", "KLS-001", "1987654321", "MAP-01"];
        $sheet->fromArray([$example], null, 'A2');

        // Info tambahan (note) di bawahnya
        $sheet->setCellValue('A4', 'Catatan:');
        $sheet->setCellValue('A5', '- Hari: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu');
        $sheet->setCellValue('A6', '- Format jam: HH:mm (contoh: 07:30)');
        $sheet->setCellValue('A7', '- id_kelas: ambil dari tabel kelas (kolom id_kelas)');
        $sheet->setCellValue('A8', '- NIP: NIP guru sesuai database');
        $sheet->setCellValue('A9', '- id_mapel: ambil dari tabel mata pelajaran (kolom id_mapel)');

        // Lebarkan kolom otomatis
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $fileName = 'template_jadwal.xlsx';
        $path = storage_path("app/public/{$fileName}");
        $writer->save($path);

        return response()->download($path)->deleteFileAfterSend(true);
    }
}
