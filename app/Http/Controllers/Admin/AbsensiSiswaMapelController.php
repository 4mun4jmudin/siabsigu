<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbsensiSiswaMapel;
use App\Models\Guru;
use App\Models\JadwalMengajar;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
// use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class AbsensiSiswaMapelController extends Controller
{
    public function index(Request $request)
    {
        $selectedDate = $request->input('tanggal', Carbon::now()->format('Y-m-d'));
        $selectedJadwal = $request->input('id_jadwal');
        $selectedKelas = $request->input('id_kelas');
        $selectedGuru = $request->input('id_guru');

        // Ambil absensi yang ada untuk tanggal (filter jadwal jika ada)
        $query = AbsensiSiswaMapel::with(['siswa.kelas', 'jadwal', 'jadwal.guru', 'jadwal.mataPelajaran'])
            ->where('tanggal', $selectedDate);

        if ($selectedJadwal) $query->where('id_jadwal', $selectedJadwal);

        if ($selectedKelas) {
            $query->whereHas('siswa', function ($q) use ($selectedKelas) {
                $q->where('id_kelas', $selectedKelas);
            });
        }

        if ($selectedGuru) {
            $query->whereHas('jadwal', function ($q) use ($selectedGuru) {
                $q->where('id_guru', $selectedGuru);
            });
        }

        $existingAbsensi = $query->get();

        /**
         * Jika id_jadwal diberikan -> prioritas menampilkan semua siswa di kelas jadwal tersebut
         * Jika id_kelas diberikan (tapi tidak id_jadwal) -> tampilkan semua siswa di kelas
         * Jika tidak ada filter kelas/jadwal -> tampilkan hanya absensi existing
         */
        $students = collect();

        if ($selectedJadwal) {
            $jad = JadwalMengajar::with(['kelas.siswa'])->find($selectedJadwal);
            if ($jad && $jad->kelas) {
                $students = $jad->kelas->siswa; // collection siswa
            }
        } elseif ($selectedKelas) {
            $kelas = Kelas::with(['siswa'])->find($selectedKelas);
            if ($kelas) $students = $kelas->siswa;
        }

        // Build merged list: for each student (if we have students list) find existing attendance else placeholder.
        $absensiToSend = collect();

        if ($students->isNotEmpty()) {
            // map existing by id_siswa for O(1) lookup
            $mapExist = $existingAbsensi->keyBy('id_siswa');

            foreach ($students as $st) {
                if (isset($mapExist[$st->id_siswa])) {
                    $a = $mapExist[$st->id_siswa];
                    $absensiToSend->push($a);
                } else {
                    // placeholder: belum ada record untuk siswa ini pada tanggal terpilih
                    $absensiToSend->push((object)[
                        'id_absensi_mapel' => null,
                        'id_jadwal' => $selectedJadwal ?? null,
                        'id_siswa' => $st->id_siswa,
                        'nis' => $st->nis ?? '',
                        'siswa' => $st, // keep siswa info for frontend
                        'tanggal' => $selectedDate,
                        'status_kehadiran' => 'Belum Absen',
                        'jam_mulai' => null,
                        'jam_selesai' => null,
                        'metode_absen' => 'Manual',
                        'keterangan' => '',
                        'id_penginput_manual' => null,
                        'updated_at' => null,
                    ]);
                }
            }
        } else {
            // tidak ada daftar siswa (tidak memilih jadwal/kelas) -> kirim apa yang ada
            $absensiToSend = $existingAbsensi;
        }

        // buat opsi jadwal sesuai hari dari tanggal yg dipilih
        $hari = Carbon::parse($selectedDate)->locale('id')->isoFormat('dddd');
        $jadwals = JadwalMengajar::with(['kelas', 'mataPelajaran', 'guru'])
            ->where('hari', $hari)
            ->get();

        $jadwalOptions = $jadwals->map(function ($j) {
            $kelasLabel = $j->kelas ? ($j->kelas->tingkat . ' ' . ($j->kelas->jurusan ?? '')) : '';
            $mapelName = $j->mataPelajaran?->nama_mapel ?? '-';
            return [
                'value' => $j->id_jadwal,
                'label' => "{$j->hari}, {$j->jam_mulai}-{$j->jam_selesai} | {$mapelName} ({$kelasLabel})"
            ];
        })->values();

        $kelasOptions = Kelas::orderBy('tingkat')->orderBy('jurusan')->get()->map(function ($k) {
            return ['value' => $k->id_kelas, 'label' => trim(($k->tingkat ?? '') . ' ' . ($k->jurusan ?? ''))];
        })->values();

        $guruOptions = Guru::orderBy('nama_lengkap')->get()->map(function ($g) {
            return ['value' => $g->id_guru, 'label' => $g->nama_lengkap];
        })->values();

        // build pertemuan summary (sama seperti sebelumnya)
        $pertemuan = null;
        if ($selectedJadwal) {
            $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($selectedJadwal);
            if ($jad) {
                $pertemuan = [
                    'id_jadwal' => $jad->id_jadwal,
                    'mapel_name' => $jad->mataPelajaran?->nama_mapel,
                    'kelas_name' => trim(($jad->kelas?->tingkat ?? '') . ' ' . ($jad->kelas?->jurusan ?? '')),
                    'guru_name' => $jad->guru?->nama_lengkap,
                    'jam_mulai' => $jad->jam_mulai,
                    'jam_selesai' => $jad->jam_selesai,
                    'tanggal' => $selectedDate,
                    'total_siswa' => $jad->kelas ? ($jad->kelas->siswa()->count() ?? null) : null,
                    'locked' => false,
                ];
            }
        }

        // counts derived from $absensiToSend (treat 'Belum Absen' as special, not counted in hadir/izin/etc)
        $countsCollection = $absensiToSend->groupBy('status_kehadiran')->map->count();
        $summary = [
            'hadir' => $countsCollection->get('Hadir', 0),
            'izin' => $countsCollection->get('Izin', 0),
            'sakit' => $countsCollection->get('Sakit', 0),
            'alfa' => $countsCollection->get('Alfa', 0),
            'digantikan' => $countsCollection->get('Digantikan', 0),
            'tugas' => $countsCollection->get('Tugas', 0),
            'belum_absen' => $countsCollection->get('Belum Absen', 0),
            'total' => $absensiToSend->count(),
        ];

        $routes = [
            'store' => route('admin.absensi-siswa-mapel.store'),
            'import' => route('admin.absensi-siswa-mapel.import'),
            'export' => route('admin.absensi-siswa-mapel.export'),
            'lock' => route('admin.absensi-siswa-mapel.lock'),
        ];

        return Inertia::render('admin/AbsensiSiswaMapel/Index', [
            'absensi' => $absensiToSend->values(),
            'pertemuan' => $pertemuan,
            'jadwalOptions' => $jadwalOptions,
            'kelasOptions' => $kelasOptions,
            'guruOptions' => $guruOptions,
            'summary' => $summary,
            'filters' => [
                'tanggal' => $selectedDate,
                'id_jadwal' => $selectedJadwal,
                'id_kelas' => $selectedKelas,
                'id_guru' => $selectedGuru
            ],
            'canEdit' => (Auth::user()?->level === 'Admin' || Auth::user()?->level === 'Guru'),
            'routes' => $routes,
        ]);
    }


    public function store(Request $request)
    {
        $payload = $request->validate([
            'id_jadwal' => 'nullable|string|exists:tbl_jadwal_mengajar,id_jadwal',
            'tanggal' => 'required|date',
            'absensi' => 'required|array',
            'absensi.*.id_siswa' => 'required|string|exists:tbl_siswa,id_siswa',
            // Izinkan "Belum Absen" agar tidak mental, tapi kita skip saat proses
            'absensi.*.status_kehadiran' => 'required|in:Hadir,Sakit,Izin,Alfa,Tugas,Digantikan,Belum Absen',
            'absensi.*.keterangan' => 'nullable|string|max:500',
            'absensi.*.id_absensi_mapel' => 'nullable|string',
            'absensi.*.jam_mulai'   => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'absensi.*.jam_selesai' => ['nullable', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
        ]);

        $idJadwalFromPayload = $payload['id_jadwal'] ?? null;
        $tanggal = $payload['tanggal'];

        DB::beginTransaction();
        try {
            foreach ($payload['absensi'] as $item) {
                // Skip yg masih "Belum Absen" (tidak create/update)
                if (($item['status_kehadiran'] ?? '') === 'Belum Absen') {
                    continue;
                }

                // Pastikan ada target jadwal
                $targetJadwal = $idJadwalFromPayload;

                if (empty($targetJadwal) && !empty($item['id_absensi_mapel'])) {
                    $existing = AbsensiSiswaMapel::where('id_absensi_mapel', $item['id_absensi_mapel'])->first();
                    if ($existing) {
                        $targetJadwal = $existing->id_jadwal;
                    }
                }

                if (empty($targetJadwal)) {
                    throw new \Exception("Tidak dapat menyimpan absensi untuk siswa {$item['id_siswa']}: pilih Jadwal/Mapel terlebih dahulu.");
                }

                // kunci pencari
                $existsKey = !empty($item['id_absensi_mapel'])
                    ? ['id_absensi_mapel' => $item['id_absensi_mapel']]
                    : ['id_jadwal' => $targetJadwal, 'id_siswa' => $item['id_siswa'], 'tanggal' => $tanggal];

                // normalisasi waktu (H:i -> H:i:s) supaya aman ke kolom TIME
                $jm = $item['jam_mulai'] ?? null;
                $js = $item['jam_selesai'] ?? null;
                $jm = $jm ? ($jm . (strlen($jm) === 5 ? ':00' : '')) : null;
                $js = $js ? ($js . (strlen($js) === 5 ? ':00' : '')) : null;

                AbsensiSiswaMapel::updateOrCreate(
                    $existsKey,
                    [
                        'id_absensi_mapel' => $item['id_absensi_mapel'] ?? (string) Str::uuid(),
                        'id_jadwal' => $targetJadwal,
                        'id_siswa' => $item['id_siswa'],
                        'tanggal' => $tanggal,
                        'status_kehadiran' => $item['status_kehadiran'],
                        'keterangan' => $item['keterangan'] ?? null,
                        'metode_absen' => $item['metode_absen'] ?? 'Manual',
                        'jam_mulai' => $jm,
                        'jam_selesai' => $js,
                        'id_guru_pengganti' => $item['id_guru_pengganti'] ?? null,
                        'id_penginput_manual' => Auth::user()?->id_pengguna ?? Auth::id(),
                    ]
                );

                DB::table('tbl_log_aktivitas')->insert([
                    'id_pengguna' => Auth::user()?->id_pengguna ?? Auth::id(),
                    'aksi' => "Update absensi siswa ({$item['id_siswa']})",
                    'keterangan' => "Perubahan status => {$item['status_kehadiran']} pada jadwal {$targetJadwal} tanggal {$tanggal}",
                    'waktu' => now(),
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Absensi berhasil disimpan.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan absensi: ' . $e->getMessage());
        }
    }


    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'status' => 'nullable|in:Hadir,Sakit,Izin,Alfa,Tugas,Digantikan',
            'keterangan' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->ids as $id) {
                $a = AbsensiSiswaMapel::where('id_absensi_mapel', $id)->first();
                if (!$a) continue;
                if ($request->filled('status')) $a->status_kehadiran = $request->status;
                if ($request->filled('keterangan')) $a->keterangan = $request->keterangan;
                $a->save();
            }
            DB::commit();
            return redirect()->back()->with('success', 'Bulk update berhasil.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Bulk update gagal: ' . $e->getMessage());
        }
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        $row = 0;
        $errors = [];
        DB::beginTransaction();
        try {
            while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
                $row++;
                if ($row === 1) continue;
                $idSiswa = $data[0] ?? null;
                $status = $data[1] ?? null;
                if (!$idSiswa || !$status) {
                    $errors[] = "Baris $row: data tidak lengkap";
                    continue;
                }
                AbsensiSiswaMapel::updateOrCreate(
                    ['id_jadwal' => $request->id_jadwal, 'id_siswa' => $idSiswa, 'tanggal' => $request->tanggal],
                    [
                        'id_absensi_mapel' => (string) Str::uuid(),
                        'status_kehadiran' => $status,
                        'metode_absen' => 'Manual',
                        'id_penginput_manual' => Auth::user()?->id_pengguna ?? Auth::id(),
                    ]
                );
            }
            DB::commit();
            return redirect()->back()->with('success', 'Import selesai. ' . (count($errors) ? 'Ada beberapa baris bermasalah.' : ''));
        } catch (\Throwable $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Import gagal: ' . $e->getMessage());
        } finally {
            if (is_resource($handle)) fclose($handle);
        }
    }

    public function export(Request $request)
    {
        // Accept type from query string or POST input
        $tanggal = $request->query('tanggal', $request->input('tanggal', null));
        $idJadwal = $request->query('id_jadwal', $request->input('id_jadwal', null));
        $type = strtolower($request->query('type', $request->input('type', 'csv')));
        $monthly = filter_var($request->query('monthly', $request->input('monthly', false)), FILTER_VALIDATE_BOOLEAN);

        if (empty($tanggal)) {
            return redirect()->back()->with('error', 'Parameter tanggal diperlukan untuk ekspor.');
        }

        // Normalize tanggal
        try {
            $dt = Carbon::parse($tanggal);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Format tanggal tidak valid.');
        }

        // CSV export (per-hari / filtered by jadwal optional)
        if ($type === 'csv') {
            $query = AbsensiSiswaMapel::with('siswa.kelas')->where('tanggal', $dt->format('Y-m-d'));
            if ($idJadwal) $query->where('id_jadwal', $idJadwal);
            $rows = $query->get();

            $filename = "absensi_{$dt->format('Ymd')}" . ($idJadwal ? "_{$idJadwal}" : '') . ".csv";

            $callback = function () use ($rows) {
                // prevent accidental extra output
                if (ob_get_level()) ob_end_clean();
                $handle = fopen('php://output', 'w');
                fputcsv($handle, ['NIS', 'Nama', 'Kelas', 'Status', 'Keterangan', 'Jam Masuk', 'Jam Pulang', 'Penginput', 'Terakhir Diubah']);
                foreach ($rows as $r) {
                    fputcsv($handle, [
                        $r->siswa->nis ?? '',
                        $r->siswa->nama_lengkap ?? '',
                        $r->siswa->kelas?->tingkat ? ($r->siswa->kelas->tingkat . ' ' . ($r->siswa->kelas->jurusan ?? '')) : ($r->siswa->kelas->nama_lengkap ?? ''),
                        $r->status_kehadiran,
                        $r->keterangan,
                        $r->jam_mulai,
                        $r->jam_selesai,
                        $r->id_penginput_manual,
                        $r->updated_at,
                    ]);
                }
                fclose($handle);
            };

            return response()->streamDownload($callback, $filename, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Pragma' => 'no-cache',
            ]);
        }

        // PDF export
        if ($type === 'pdf') {
            // monthly report
            if ($monthly) {
                if (empty($idJadwal)) {
                    return redirect()->back()->with('error', 'Untuk ekspor PDF bulanan, parameter id_jadwal (jadwal/mapel) diperlukan.');
                }

                $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($idJadwal);
                if (!$jad) {
                    return redirect()->back()->with('error', 'Jadwal tidak ditemukan untuk id_jadwal: ' . $idJadwal);
                }

                $month = $dt->month;
                $year = $dt->year;
                $lastDay = Carbon::createFromDate($year, $month, 1)->daysInMonth;

                // ambil attendance untuk jadwal dan bulan tersebut
                $attRows = AbsensiSiswaMapel::where('id_jadwal', $idJadwal)
                    ->whereYear('tanggal', $year)
                    ->whereMonth('tanggal', $month)
                    ->get()
                    ->groupBy('id_siswa');

                // ambil daftar siswa dari kelas jadwal, ordered
                $students = $jad->kelas?->siswa()->orderBy('nama_lengkap')->get() ?? collect();

                $rowsForPdf = [];
                foreach ($students as $st) {
                    $map = [];
                    for ($d = 1; $d <= $lastDay; $d++) $map[$d] = '';
                    $group = $attRows->get($st->id_siswa) ?? collect();
                    foreach ($group as $r) {
                        $day = Carbon::parse($r->tanggal)->day;
                        $map[$day] = $r->status_kehadiran ?? '';
                    }
                    $rowsForPdf[] = [
                        'nis' => $st->nis,
                        'nama' => $st->nama_lengkap,
                        'kelas' => $jad->kelas?->tingkat . ' ' . ($jad->kelas?->jurusan ?? ''),
                        'days' => $map,
                    ];
                }

                try {
                    $pdf = Pdf::loadView('admin.absensi.pdf_monthly', [
                        'jadwal' => $jad,
                        'tanggal' => $dt,
                        'rows' => $rowsForPdf,
                        'lastDay' => $lastDay,
                    ])->setPaper('a4', 'landscape');

                    $filename = "absensi_bulanan_{$jad->id_jadwal}_{$year}_{$month}.pdf";
                    return $pdf->download($filename);
                } catch (\Throwable $e) {
                    // don't expose stacktrace in production; return friendly message
                    return redirect()->back()->with('error', 'Gagal membuat PDF: ' . $e->getMessage());
                }
            }

            // per-pertemuan (single date)
            $query = AbsensiSiswaMapel::with('siswa.kelas')->where('tanggal', $dt->format('Y-m-d'));
            if ($idJadwal) $query->where('id_jadwal', $idJadwal);
            $rows = $query->get();

            $pertemuan = null;
            if ($idJadwal) {
                $jad = JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($idJadwal);
                if ($jad) {
                    $pertemuan = [
                        'mapel_name' => $jad->mataPelajaran?->nama_mapel,
                        'kelas_name' => trim(($jad->kelas?->tingkat ?? '') . ' ' . ($jad->kelas?->jurusan ?? '')),
                        'guru_name' => $jad->guru?->nama_lengkap,
                        'jam_mulai' => $jad->jam_mulai,
                        'jam_selesai' => $jad->jam_selesai,
                    ];
                }
            }

            try {
                $pdf = Pdf::loadView('admin.absensi.pdf_pertemuan', [
                    'rows' => $rows,
                    'tanggal' => $dt->format('Y-m-d'),
                    'pertemuan' => $pertemuan,
                ])->setPaper('a4', 'portrait');

                $filename = "absensi_{$dt->format('Ymd')}" . ($idJadwal ? "_{$idJadwal}" : '') . ".pdf";
                return $pdf->download($filename);
            } catch (\Throwable $e) {
                return redirect()->back()->with('error', 'Gagal membuat PDF: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('error', 'Tipe ekspor tidak dikenali atau parameter kurang.');
    }

  
    public function exportExcel(Request $request)
    {
        $tanggal  = $request->input('tanggal');
        $idJadwal = $request->input('id_jadwal');
        $monthly  = filter_var($request->input('monthly', false), FILTER_VALIDATE_BOOLEAN);

        if (empty($tanggal)) {
            return redirect()->back()->with('error', 'Parameter tanggal diperlukan untuk ekspor Excel.');
        }

        try {
            $dt = \Carbon\Carbon::parse($tanggal);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Format tanggal tidak valid.');
        }

        if ($monthly) {
            // ===== EXCEL BULANAN (grid 1..31) =====
            if (empty($idJadwal)) {
                return redirect()->back()->with('error', 'Untuk ekspor Excel bulanan, parameter id_jadwal diperlukan.');
            }

            $jad = \App\Models\JadwalMengajar::with(['kelas', 'guru', 'mataPelajaran'])->find($idJadwal);
            if (!$jad) return redirect()->back()->with('error', 'Jadwal tidak ditemukan.');

            $month   = $dt->month;
            $year    = $dt->year;
            $lastDay = \Carbon\Carbon::createFromDate($year, $month, 1)->daysInMonth;

            // ambil absensi bulan tsb
            $attRows = \App\Models\AbsensiSiswaMapel::where('id_jadwal', $idJadwal)
                ->whereYear('tanggal', $year)
                ->whereMonth('tanggal', $month)
                ->get()
                ->groupBy('id_siswa');

            // daftar siswa di kelas jadwal
            $students = $jad->kelas?->siswa()->orderBy('nama_lengkap')->get() ?? collect();

            // ===== Spreadsheet build =====
            $ss = new Spreadsheet();
            $sheet = $ss->getActiveSheet();

            // kolom: No (A) | NIS (B) | NAMA (C) | day 1..N | JUMLAH H S I A T D
            $colNo   = 1; // A
            $colNis  = 2; // B
            $colNama = 3; // C
            $firstDayCol = 4; // D
            $lastDayCol  = $firstDayCol + $lastDay - 1;

            $colH = $lastDayCol + 1;
            $colS = $lastDayCol + 2;
            $colI = $lastDayCol + 3;
            $colA = $lastDayCol + 4;
            $colT = $lastDayCol + 5;
            $colDg = $lastDayCol + 6;

            $endColIdx = $colDg;
            $endCol = Coordinate::stringFromColumnIndex($endColIdx);

            // ===== Header judul =====
            $sheet->mergeCells("A1:{$endCol}1");
            $sheet->setCellValue("A1", "DAFTAR HADIR SISWA");
            $sheet->getStyle("A1")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A1")->getFont()->setBold(true)->setSize(14);

            $sheet->mergeCells("A2:{$endCol}2");
            $info = "MATA PELAJARAN: " . ($jad->mataPelajaran?->nama_mapel ?? '-')
                . "    KELAS: " . trim(($jad->kelas?->tingkat ?? '') . ' ' . ($jad->kelas?->jurusan ?? ''))
                . "    BULAN: " . strtoupper($dt->translatedFormat('F Y'));
            $sheet->setCellValue("A2", $info);
            $sheet->getStyle("A2")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // ===== Header tabel (2 baris) =====
            $r1 = 4; // row header atas
            $r2 = 5; // row header bawah

            // Merge NO/NIS/NAMA
            $sheet->mergeCellsByColumnAndRow($colNo,  $r1, $colNo,  $r2);
            $sheet->mergeCellsByColumnAndRow($colNis, $r1, $colNis, $r2);
            $sheet->mergeCellsByColumnAndRow($colNama, $r1, $colNama, $r2);

            // Label kolom kiri
            $sheet->setCellValueByColumnAndRow($colNo,  $r2, 'NO');
            $sheet->setCellValueByColumnAndRow($colNis, $r2, 'NIS');
            $sheet->setCellValueByColumnAndRow($colNama, $r2, 'NAMA');

            // BULAN : (di atas kolom hari)
            $sheet->mergeCellsByColumnAndRow($firstDayCol, $r1, $lastDayCol, $r1);
            $sheet->setCellValueByColumnAndRow($firstDayCol, $r1, 'BULAN :');

            // JUMLAH (di atas kolom total)
            $sheet->mergeCellsByColumnAndRow($colH, $r1, $colDg, $r1);
            $sheet->setCellValueByColumnAndRow($colH, $r1, 'JUMLAH');

            // Nomor hari (1..lastDay)
            for ($d = 1; $d <= $lastDay; $d++) {
                $sheet->setCellValueByColumnAndRow($firstDayCol + $d - 1, $r2, $d);
            }

            // Subheader jumlah
            $sheet->setCellValueByColumnAndRow($colH, $r2, 'H');
            $sheet->setCellValueByColumnAndRow($colS, $r2, 'S');
            $sheet->setCellValueByColumnAndRow($colI, $r2, 'I');
            $sheet->setCellValueByColumnAndRow($colA, $r2, 'A');
            $sheet->setCellValueByColumnAndRow($colT, $r2, 'T');
            $sheet->setCellValueByColumnAndRow($colDg, $r2, 'D');

            // Styling header
            $sheet->getStyle("A{$r1}:{$endCol}{$r2}")
                ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("A{$r1}:{$endCol}{$r2}")
                ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getRowDimension($r1)->setRowHeight(22);
            $sheet->getRowDimension($r2)->setRowHeight(22);
            $sheet->getStyle("A{$r1}:{$endCol}{$r2}")->getFont()->setBold(true);

            // Lebar kolom
            $sheet->getColumnDimension('A')->setWidth(5);   // NO
            $sheet->getColumnDimension('B')->setWidth(12);  // NIS
            $sheet->getColumnDimension('C')->setWidth(32);  // NAMA
            for ($ci = $firstDayCol; $ci <= $lastDayCol; $ci++) {
                $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($ci))->setWidth(3.2);
            }
            foreach ([$colH, $colS, $colI, $colA, $colT, $colDg] as $ci) {
                $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($ci))->setWidth(4.2);
            }

            // Freeze pane
            $sheet->freezePane(Coordinate::stringFromColumnIndex($firstDayCol) . ($r2 + 1));

            // ===== Data rows =====
            $row = $r2 + 1;
            $no  = 1;

            foreach ($students as $st) {
                $sheet->setCellValueByColumnAndRow($colNo,  $row, $no++);
                $sheet->setCellValueByColumnAndRow($colNis, $row, $st->nis);
                $sheet->setCellValueByColumnAndRow($colNama, $row, $st->nama_lengkap);

                // inisialisasi map hari & counter
                $map = array_fill(1, $lastDay, '');
                $cnt = ['H' => 0, 'S' => 0, 'I' => 0, 'A' => 0, 'T' => 0, 'D' => 0];

                $rows = $attRows->get($st->id_siswa) ?? collect();
                foreach ($rows as $r) {
                    $day  = \Carbon\Carbon::parse($r->tanggal)->day;
                    $code = match ($r->status_kehadiran) {
                        'Hadir'       => 'H',
                        'Sakit'       => 'S',
                        'Izin'        => 'I',
                        'Alfa'        => 'A',
                        'Tugas'       => 'T',
                        'Digantikan'  => 'D',
                        default       => '',
                    };
                    $map[$day] = $code;
                    if ($code && isset($cnt[$code])) $cnt[$code]++;
                }

                // tulis kolom hari
                for ($d = 1; $d <= $lastDay; $d++) {
                    $sheet->setCellValueByColumnAndRow($firstDayCol + $d - 1, $row, $map[$d]);
                }

                // tulis jumlah
                $sheet->setCellValueByColumnAndRow($colH, $row, $cnt['H']);
                $sheet->setCellValueByColumnAndRow($colS, $row, $cnt['S']);
                $sheet->setCellValueByColumnAndRow($colI, $row, $cnt['I']);
                $sheet->setCellValueByColumnAndRow($colA, $row, $cnt['A']);
                $sheet->setCellValueByColumnAndRow($colT, $row, $cnt['T']);
                $sheet->setCellValueByColumnAndRow($colDg, $row, $cnt['D']);

                // border + alignment baris data
                $sheet->getStyle("A{$row}:{$endCol}{$row}")
                    ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle(
                    Coordinate::stringFromColumnIndex($firstDayCol) . $row . ":" .
                        Coordinate::stringFromColumnIndex($endColIdx) . $row
                )->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                $row++;
            }

            // ===== Output =====
            $filename = "absensi_bulanan_{$jad->id_jadwal}_{$year}_{$month}.xlsx";
            $writer = new Xlsx($ss);
            ob_start();
            $writer->save('php://output');
            $excelOutput = ob_get_clean();

            return response($excelOutput, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment;filename=\"{$filename}\"",
                'Cache-Control'       => 'max-age=0',
            ]);
        }

        // ====== FALLBACK: export harian (kode lamamu disini, tetap dipakai) ======
        $query = \App\Models\AbsensiSiswaMapel::with('siswa.kelas')->whereDate('tanggal', $dt->format('Y-m-d'));
        if ($idJadwal) $query->where('id_jadwal', $idJadwal);
        $rows = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $header = ['NIS', 'Nama', 'Kelas', 'Status', 'Keterangan', 'Jam Masuk', 'Jam Pulang', 'Penginput', 'Terakhir Diubah'];
        foreach ($header as $col => $h) $sheet->setCellValueByColumnAndRow($col + 1, 1, $h);
        $i = 2;
        foreach ($rows as $r) {
            $sheet->setCellValueByColumnAndRow(1, $i, $r->siswa->nis ?? '');
            $sheet->setCellValueByColumnAndRow(2, $i, $r->siswa->nama_lengkap ?? '');
            $sheet->setCellValueByColumnAndRow(3, $i, $r->siswa->kelas?->tingkat . ' ' . ($r->siswa->kelas?->jurusan ?? ''));
            $sheet->setCellValueByColumnAndRow(4, $i, $r->status_kehadiran);
            $sheet->setCellValueByColumnAndRow(5, $i, $r->keterangan);
            $sheet->setCellValueByColumnAndRow(6, $i, $r->jam_mulai);
            $sheet->setCellValueByColumnAndRow(7, $i, $r->jam_selesai);
            $sheet->setCellValueByColumnAndRow(8, $i, $r->id_penginput_manual);
            $sheet->setCellValueByColumnAndRow(9, $i, $r->updated_at);
            $i++;
        }

        $filename = "absensi_{$dt->format('Ymd')}" . ($idJadwal ? "_{$idJadwal}" : '') . ".xlsx";
        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $excelOutput = ob_get_clean();

        return response($excelOutput, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment;filename=\"{$filename}\"",
            'Cache-Control'       => 'max-age=0',
        ]);
    }


    public function lock(Request $request)
    {
        $request->validate(['id_jadwal' => 'required|string', 'tanggal' => 'required|date']);

        DB::table('tbl_log_aktivitas')->insert([
            'id_pengguna' => Auth::user()?->id_pengguna ?? Auth::id(),
            'aksi' => 'Lock absensi',
            'keterangan' => "Kunci absensi jadwal {$request->id_jadwal} tanggal {$request->tanggal}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', 'Absensi dikunci (placeholder). Implementasi lock perlu penyesuaian DB.');
    }
}
