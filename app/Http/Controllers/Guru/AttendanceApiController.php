<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceApiController extends Controller
{
    private function guardGuru()
    {
        $user = Auth::user();
        $guru = $user?->guru;
        abort_unless($guru, 403, 'Akses ditolak (bukan guru).');
        return $guru;
    }

    private function monthRange(?string $ym = null): array
    {
        $base = $ym ? Carbon::createFromFormat('Y-m', $ym) : Carbon::now();
        return [
            $base->copy()->startOfMonth()->startOfDay(),
            $base->copy()->endOfMonth()->endOfDay(),
        ];
    }

    private function kelasDiampu(string $id_guru)
    {
        return DB::table('tbl_jadwal_mengajar')
            ->where('id_guru', $id_guru)
            ->pluck('id_kelas')
            ->unique()
            ->values();
    }

    public function kehadiranCounts(Request $request)
    {
        $guru = $this->guardGuru();
        [$start, $end] = $this->monthRange($request->input('bulan'));

        $row = DB::table('tbl_absensi_guru')
            ->where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->selectRaw("
                SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN status_kehadiran='Sakit' THEN 1 ELSE 0 END) AS sakit,
                SUM(CASE WHEN status_kehadiran='Izin'  THEN 1 ELSE 0 END) AS izin,
                SUM(CASE WHEN status_kehadiran='Alfa'  THEN 1 ELSE 0 END) AS alfa,
                SUM(CASE WHEN COALESCE(menit_keterlambatan,0) > 0 THEN 1 ELSE 0 END) AS late_days,
                SUM(COALESCE(menit_keterlambatan,0)) AS late_minutes
            ")
            ->first();

        return response()->json([
            'month' => $start->format('Y-m'),
            'hadir' => (int) ($row->hadir ?? 0),
            'sakit' => (int) ($row->sakit ?? 0),
            'izin'  => (int) ($row->izin  ?? 0),
            'alfa'  => (int) ($row->alfa  ?? 0),
            'late'  => [
                'days'    => (int) ($row->late_days ?? 0),
                'minutes' => (int) ($row->late_minutes ?? 0),
            ],
        ]);
    }

    public function classesAttendanceSummary(Request $request)
    {
        $guru = $this->guardGuru();
        [$start, $end] = $this->monthRange($request->input('bulan'));
        $kelasIds = $this->kelasDiampu($guru->id_guru);
        if ($kelasIds->isEmpty()) return response()->json([]);

        // Rekap status per kelas di bulan tsb
        $rekap = DB::table('tbl_absensi_siswa AS a')
            ->join('tbl_siswa AS s', 'a.id_siswa', '=', 's.id_siswa')
            ->whereBetween('a.tanggal', [$start, $end])
            ->whereIn('s.id_kelas', $kelasIds)
            ->select('s.id_kelas', 'a.status_kehadiran', DB::raw('COUNT(*) AS total'))
            ->groupBy('s.id_kelas', 'a.status_kehadiran')
            ->get()
            ->groupBy('id_kelas');

        // Nama kelas
        $kelasMap = DB::table('tbl_kelas')
            ->whereIn('id_kelas', $kelasIds)
            ->get()
            ->keyBy('id_kelas')
            ->map(function ($k) {
                $nama = trim(($k->tingkat ?? '').' '.($k->jurusan ?? ''));
                return $nama !== '' ? $nama : $k->id_kelas;
            });

        $out = [];
        foreach ($kelasIds as $id_kelas) {
            $row = $rekap->get($id_kelas, collect())->keyBy('status_kehadiran');
            $hadir = (int)($row->get('Hadir')->total ?? 0);
            $izin  = (int)($row->get('Izin')->total  ?? 0);
            $sakit = (int)($row->get('Sakit')->total ?? 0);
            $alfa  = (int)($row->get('Alfa')->total  ?? 0);
            $total = max(1, $hadir + $izin + $sakit + $alfa);

            $pct = round(($hadir / $total) * 100, 1);

            $status = $pct >= 90 ? 'green' : ($pct >= 75 ? 'yellow' : 'red');

            $out[] = [
                'kelas'            => $kelasMap[$id_kelas] ?? $id_kelas,
                'id_kelas'         => $id_kelas,
                'avg_presence_pct' => $pct,
                'present'          => $hadir,
                'izin'             => $izin,
                'sakit'            => $sakit,
                'alfa'             => $alfa,
                'status_color'     => $status,
            ];
        }

        return response()->json($out);
    }

    public function scheduleToday(Request $request)
    {
        $guru = $this->guardGuru();
        Carbon::setLocale('id');
        $today = Carbon::today();
        $hari  = $today->translatedFormat('l'); // Senin..Minggu

        $jadwal = DB::table('tbl_jadwal_mengajar AS j')
            ->leftJoin('tbl_kelas AS k', 'j.id_kelas', '=', 'k.id_kelas')
            ->leftJoin('tbl_mata_pelajaran AS m', 'j.id_mapel', '=', 'm.id_mapel')
            ->where('j.id_guru', $guru->id_guru)
            ->where('j.hari', $hari)
            ->orderBy('j.jam_mulai')
            ->get([
                'j.id_jadwal', 'j.jam_mulai', 'j.jam_selesai',
                'j.id_kelas', 'k.tingkat', 'k.jurusan',
                'm.nama_mapel'
            ]);

        // total siswa per kelas
        $kelasIds = $jadwal->pluck('id_kelas')->unique()->filter();
        $siswaCount = DB::table('tbl_siswa')
            ->whereIn('id_kelas', $kelasIds)
            ->where('status', 'Aktif')
            ->select('id_kelas', DB::raw('COUNT(*) as total'))
            ->groupBy('id_kelas')
            ->pluck('total', 'id_kelas');

        // progress absen per jadwal (absensi mapel)
        $progress = DB::table('tbl_absensi_siswa_mapel')
            ->whereIn('id_jadwal', $jadwal->pluck('id_jadwal'))
            ->whereDate('tanggal', $today)
            ->select('id_jadwal',
                     DB::raw("SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir"),
                     DB::raw("COUNT(*) AS total"))
            ->groupBy('id_jadwal')
            ->get()
            ->keyBy('id_jadwal');

        // status absen guru hari ini
        $absenGuru = DB::table('tbl_absensi_guru')
            ->where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today)
            ->first();

        $data = $jadwal->map(function ($j) use ($siswaCount, $progress) {
            $kelasLabel = trim(($j->tingkat ?? '').' '.($j->jurusan ?? '')) ?: $j->id_kelas;
            $prog = $progress->get($j->id_jadwal);
            $hadir = (int) ($prog->hadir ?? 0);
            $totalInput = (int) ($prog->total ?? 0);
            $totalSiswa = (int) ($siswaCount[$j->id_kelas] ?? 0);
            $hasRecords = $totalInput > 0;
            $ringkas = $totalSiswa > 0 ? "{$hadir}/{$totalSiswa}" : ($hasRecords ? (string)$hadir : '-');

            return [
                'id_jadwal'          => $j->id_jadwal,
                'waktu'              => substr($j->jam_mulai, 0, 5),
                'mapel'              => $j->nama_mapel ?? '-',
                'kelas'              => $kelasLabel,
                'status_absen_siswa' => $ringkas,
                'has_records'        => $hasRecords,
            ];
        });

        return response()->json([
            'tanggal'      => $today->toDateString(),
            'status_guru'  => $absenGuru->status_kehadiran ?? 'Belum Absen',
            'jadwal'       => $data,
        ]);
    }

    public function attendanceHistoryRecent(Request $request)
    {
        $guru = $this->guardGuru();
        $days = max(1, (int) $request->input('days', 7));
        $today = Carbon::today();

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $today->copy()->subDays($i);
            $hari = $d->translatedFormat('l');

            // status guru
            $g = DB::table('tbl_absensi_guru')
                ->where('id_guru', $guru->id_guru)
                ->whereDate('tanggal', $d)
                ->value('status_kehadiran');

            // kelas yang seharusnya diajar hari tsb
            $kelasIds = DB::table('tbl_jadwal_mengajar')
                ->where('id_guru', $guru->id_guru)
                ->where('hari', $hari)
                ->pluck('id_kelas');

            $ringkasan = ['hadir'=>0,'izin'=>0,'sakit'=>0,'alfa'=>0];
            if ($kelasIds->isNotEmpty()) {
                $agg = DB::table('tbl_absensi_siswa_mapel')
                    ->whereIn('id_jadwal', function ($q) use ($guru, $hari) {
                        $q->select('id_jadwal')
                          ->from('tbl_jadwal_mengajar')
                          ->where('id_guru', $guru->id_guru)
                          ->where('hari', $hari);
                    })
                    ->whereDate('tanggal', $d)
                    ->selectRaw("
                        SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir,
                        SUM(CASE WHEN status_kehadiran='Izin'  THEN 1 ELSE 0 END) AS izin,
                        SUM(CASE WHEN status_kehadiran='Sakit' THEN 1 ELSE 0 END) AS sakit,
                        SUM(CASE WHEN status_kehadiran='Alfa'  THEN 1 ELSE 0 END) AS alfa
                    ")
                    ->first();

                $ringkasan = [
                    'hadir' => (int) ($agg->hadir ?? 0),
                    'izin'  => (int) ($agg->izin  ?? 0),
                    'sakit' => (int) ($agg->sakit ?? 0),
                    'alfa'  => (int) ($agg->alfa  ?? 0),
                ];
            }

            $out[] = [
                'tanggal'      => $d->toDateString(),
                'status_guru'  => $g ?? '-',
                'ringkasan_siswa' => $ringkasan,
            ];
        }

        return response()->json(array_reverse($out));
    }

    public function attendanceTrend(Request $request)
    {
        $guru = $this->guardGuru();
        // tren 6 bulan terakhir (persen hadir terhadap hari kerja)
        $end = Carbon::now()->endOfMonth();
        $start = Carbon::now()->subMonths(5)->startOfMonth();

        $byMonth = DB::table('tbl_absensi_guru')
            ->where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as ym,
                         SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir")
            ->groupBy(DB::raw("DATE_FORMAT(tanggal, '%Y-%m')"))
            ->pluck('hadir', 'ym');

        $series = [];
        for ($i=0; $i<6; $i++) {
            $dt = $start->copy()->addMonths($i);
            $ym = $dt->format('Y-m');
            $workdays = $dt->diffInWeekdays($dt->copy()->endOfMonth()) + 1;
            $pct = $workdays > 0 ? round(($byMonth->get($ym, 0) / $workdays) * 100, 1) : 0;
            $series[] = ['period' => $dt->translatedFormat('M Y'), 'presence_pct' => $pct];
        }
        return response()->json($series);
    }

    public function classesAttendanceByClass(Request $request)
    {
        // Reuse summary, but return (kelas, avg_presence_pct) saja
        $data = $this->classesAttendanceSummary($request)->getData(true);
        $res = array_map(fn($r) => [
            'kelas' => $r['kelas'],
            'avg_presence_pct' => $r['avg_presence_pct']
        ], $data);
        return response()->json($res);
    }

    public function studentsTopPresent(Request $request)
    {
        $guru = $this->guardGuru();
        [$start, $end] = $this->monthRange($request->input('bulan'));
        $kelasIds = $this->kelasDiampu($guru->id_guru);
        if ($kelasIds->isEmpty()) return response()->json([]);

        $rows = DB::table('tbl_absensi_siswa AS a')
            ->join('tbl_siswa AS s', 'a.id_siswa', '=', 's.id_siswa')
            ->whereBetween('a.tanggal', [$start, $end])
            ->whereIn('s.id_kelas', $kelasIds)
            ->select('s.id_siswa', 's.nama_lengkap',
                DB::raw("SUM(CASE WHEN a.status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir"),
                DB::raw("COUNT(*) AS total"))
            ->groupBy('s.id_siswa', 's.nama_lengkap')
            ->havingRaw('total > 0')
            ->orderByRaw('hadir/total DESC')
            ->limit(max(1, (int)$request->input('top', 5)))
            ->get();

        return response()->json($rows->map(function($r){
            return [
                'id_siswa' => $r->id_siswa,
                'nama'     => $r->nama_lengkap,
                'presence_pct' => round(($r->hadir / $r->total) * 100, 1),
            ];
        }));
    }

    public function studentsBottomPresent(Request $request)
    {
        $guru = $this->guardGuru();
        [$start, $end] = $this->monthRange($request->input('bulan'));
        $kelasIds = $this->kelasDiampu($guru->id_guru);
        if ($kelasIds->isEmpty()) return response()->json([]);

        $rows = DB::table('tbl_absensi_siswa AS a')
            ->join('tbl_siswa AS s', 'a.id_siswa', '=', 's.id_siswa')
            ->whereBetween('a.tanggal', [$start, $end])
            ->whereIn('s.id_kelas', $kelasIds)
            ->select('s.id_siswa', 's.nama_lengkap',
                DB::raw("SUM(CASE WHEN a.status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir"),
                DB::raw("COUNT(*) AS total"))
            ->groupBy('s.id_siswa', 's.nama_lengkap')
            ->havingRaw('total > 0')
            ->orderByRaw('hadir/total ASC')
            ->limit(max(1, (int)$request->input('bottom', 5)))
            ->get();

        return response()->json($rows->map(function($r){
            return [
                'id_siswa' => $r->id_siswa,
                'nama'     => $r->nama_lengkap,
                'presence_pct' => round(($r->hadir / $r->total) * 100, 1),
            ];
        }));
    }

    public function attendanceCalendar(Request $request)
    {
        $guru = $this->guardGuru();
        [$start, $end] = $this->monthRange($request->input('bulan'));

        // Persentase hadir harian siswa di kelas yang diampu (gabungan semua kelas)
        $kelasIds = $this->kelasDiampu($guru->id_guru);
        if ($kelasIds->isEmpty()) return response()->json([]);

        // total siswa aktif (semua kelas yang diampu)
        $totalSiswa = DB::table('tbl_siswa')
            ->whereIn('id_kelas', $kelasIds)
            ->where('status', 'Aktif')
            ->count();
        if ($totalSiswa === 0) return response()->json([]);

        $harian = DB::table('tbl_absensi_siswa')
            ->join('tbl_siswa','tbl_absensi_siswa.id_siswa','=','tbl_siswa.id_siswa')
            ->whereBetween('tbl_absensi_siswa.tanggal', [$start, $end])
            ->whereIn('tbl_siswa.id_kelas', $kelasIds)
            ->select('tbl_absensi_siswa.tanggal',
                     DB::raw("SUM(CASE WHEN tbl_absensi_siswa.status_kehadiran='Hadir' THEN 1 ELSE 0 END) AS hadir"))
            ->groupBy('tbl_absensi_siswa.tanggal')
            ->get();

        $out = $harian->map(function($r) use ($totalSiswa){
            // skala kasar: persen hadir kelas gabungan terhadap total siswa (anggap 1 hari kerja)
            $pct = round(($r->hadir / $totalSiswa) * 100);
            return ['date' => Carbon::parse($r->tanggal)->toDateString(), 'count' => max(0, min(100, $pct))];
        });

        return response()->json($out);
    }

    public function notifications(Request $request)
    {
        $guru = $this->guardGuru();
        $today = Carbon::today();
        $hari  = $today->translatedFormat('l');

        $belumCheckin = ! DB::table('tbl_absensi_guru')
            ->where('id_guru', $guru->id_guru)
            ->whereDate('tanggal', $today)
            ->exists();

        $jadwalIds = DB::table('tbl_jadwal_mengajar')
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hari)
            ->pluck('id_jadwal');

        $kelasBelumDiabsen = false;
        if ($jadwalIds->isNotEmpty()) {
            $adaRecord = DB::table('tbl_absensi_siswa_mapel')
                ->whereIn('id_jadwal', $jadwalIds)
                ->whereDate('tanggal', $today)
                ->exists();
            $kelasBelumDiabsen = !$adaRecord;
        }

        $items = [];
        if ($kelasBelumDiabsen) {
            $items[] = ['id' => 'kelas_belum_diabsen', 'severity' => 'high', 'message' => 'Ada kelas hari ini yang belum diabsen'];
        }
        if ($belumCheckin) {
            $items[] = ['id' => 'guru_belum_checkin', 'severity' => 'medium', 'message' => 'Anda belum absen masuk hari ini'];
        }

        return response()->json($items);
    }

    public function exportMonthly(Request $request)
    {
        // endpoint ini cukup mengembalikan URL export existing (pakai controller laporan)
        $format = $request->query('format', 'pdf');
        $bulan  = $request->query('bulan', Carbon::now()->format('Y-m'));

        $url = $format === 'xlsx'
            ? route('admin.laporan.export.excel', ['bulan' => $bulan])
            : route('admin.laporan.export.pdf',   ['bulan' => $bulan]);

        return response()->json(['url' => $url]);
    }
}
