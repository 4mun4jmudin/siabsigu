<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\JadwalMengajar;
use App\Models\AbsensiGuru;
use App\Models\AbsensiSiswa;
use App\Models\AbsensiSiswaMapel;
use App\Http\Controllers\Admin\LaporanController;

class DashboardDataController extends Controller
{
    private function monthRange(?string $ym = null): array
    {
        $base = $ym ? Carbon::createFromFormat('Y-m', $ym) : Carbon::now();
        $start = $base->copy()->startOfMonth();
        $end   = $base->copy()->endOfMonth();
        return [$start, $end];
    }

    private function meGuruOrAbort()
    {
        $user = Auth::user();
        $guru = $user?->guru;
        abort_unless($guru, 403, 'Hanya untuk Guru.');
        return $guru;
    }

    /** =========================
     *  WIDGET: Statistik Kehadiran Pribadi (Bulan)
     *  GET /api/guru/kehadiran_counts/month?bulan=YYYY-MM
     *  ========================= */
    public function personalMonthlyAttendance(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        [$start, $end] = $this->monthRange($request->input('bulan'));

        $rows = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->selectRaw("status_kehadiran, COUNT(*) as c, SUM(COALESCE(menit_keterlambatan,0)) as late_minutes")
            ->groupBy('status_kehadiran')
            ->get()
            ->keyBy('status_kehadiran');

        $lateCount = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->where('menit_keterlambatan', '>', 0)->count();

        return response()->json([
            'period' => $start->format('Y-m'),
            'hadir'  => (int)($rows['Hadir']->c ?? 0),
            'sakit'  => (int)($rows['Sakit']->c ?? 0),
            'izin'   => (int)($rows['Izin']->c ?? 0),
            'alfa'   => (int)($rows['Alfa']->c ?? 0),
            'late'   => [
                'count'   => (int)$lateCount,
                'minutes' => (int)array_sum([$rows['Hadir']->late_minutes ?? 0, $rows['Izin']->late_minutes ?? 0, $rows['Sakit']->late_minutes ?? 0, $rows['Alfa']->late_minutes ?? 0]),
            ],
        ]);
    }

    /** =========================
     *  WIDGET: Rekap Kehadiran Siswa (kelas diampu) – Bulanan
     *  GET /api/guru/classes/attendance_summary/month?bulan=YYYY-MM
     *  ========================= */
    public function classAttendanceSummary(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        [$start, $end] = $this->monthRange($request->input('bulan'));

        // kelas unik yang diampu (dari jadwal)
        $kelasIds = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->distinct()->pluck('id_kelas');

        if ($kelasIds->isEmpty()) return response()->json([]);

        // hitung rekap status per kelas (harian)
        $rekap = AbsensiSiswa::whereBetween('tanggal', [$start, $end])
            ->join('tbl_siswa', 'tbl_absensi_siswa.id_siswa', '=', 'tbl_siswa.id_siswa')
            ->whereIn('tbl_siswa.id_kelas', $kelasIds)
            ->groupBy('tbl_siswa.id_kelas','tbl_absensi_siswa.status_kehadiran')
            ->select('tbl_siswa.id_kelas', 'tbl_absensi_siswa.status_kehadiran', DB::raw('COUNT(*) as total'))
            ->get()
            ->groupBy('id_kelas');

        // meta kelas
        $kelasMeta = Kelas::whereIn('id_kelas', $kelasIds)->get()->keyBy('id_kelas');

        $out = [];
        foreach ($kelasIds as $id_kelas) {
            $g = $rekap->get($id_kelas, collect())->keyBy('status_kehadiran');
            $present = (int)($g['Hadir']->total ?? 0);
            $izin    = (int)($g['Izin']->total ?? 0);
            $sakit   = (int)($g['Sakit']->total ?? 0);
            $alfa    = (int)($g['Alfa']->total ?? 0);
            $denom   = max(1, $present + $izin + $sakit + $alfa);
            $pct     = round(($present / $denom) * 100);

            $km = $kelasMeta[$id_kelas] ?? null;
            $label = $km ? trim(($km->tingkat ?? '').' '.($km->jurusan ?? '')) : $id_kelas;

            $out[] = [
                'id_kelas' => $id_kelas,
                'kelas'    => $label ?: $id_kelas,
                'present'  => $present,
                'izin'     => $izin,
                'sakit'    => $sakit,
                'alfa'     => $alfa,
                'avg_presence_pct' => $pct,
            ];
        }

        return response()->json($out);
    }

    /** =========================
     *  WIDGET: Bar chart by kelas
     *  GET /api/guru/classes/attendance_by_class/month?bulan=YYYY-MM
     *  ========================= */
    public function attendanceByClassChart(Request $request)
    {
        $data = $this->classAttendanceSummary($request)->getData(true);
        // pastikan bentuk array
        return response()->json(array_values($data));
    }

    /** =========================
     *  WIDGET: Jadwal hari ini
     *  GET /api/guru/schedule/today
     *  ========================= */
    public function todaySchedule(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        Carbon::setLocale('id');
        $hari = Carbon::now()->translatedFormat('l'); // Senin..Minggu
        $today = Carbon::today()->toDateString();

        $jadwal = JadwalMengajar::with(['kelas','mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hari)
            ->orderBy('jam_mulai')->get()
            ->map(function($j) use ($today){
                $sudahDiabsen = AbsensiSiswaMapel::where('id_jadwal',$j->id_jadwal)->whereDate('tanggal',$today)->exists();
                return [
                    'id_jadwal' => $j->id_jadwal,
                    'mapel'     => $j->mataPelajaran?->nama_mapel,
                    'kelas'     => trim(($j->kelas?->tingkat ?? '').' '.($j->kelas?->jurusan ?? '')),
                    'jam_mulai' => $j->jam_mulai,
                    'jam_selesai'=> $j->jam_selesai,
                    'absen_status'=> $sudahDiabsen ? 'Sudah diabsen' : 'Belum diabsen',
                    'session_id' => $j->id_jadwal.'-'.$today,
                ];
            });

        return response()->json($jadwal);
    }

    /** =========================
     *  WIDGET: Riwayat 5–7 hari
     *  GET /api/guru/attendance_history/recent?days=7
     *  ========================= */
    public function attendanceHistoryRecent(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        $days = max(1, (int)$request->integer('days', 7));
        $start = Carbon::today()->subDays($days-1);
        $end   = Carbon::today();

        // status guru per hari
        $guruDaily = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal', [$start,$end])
            ->select('tanggal','status_kehadiran')->get()
            ->keyBy(fn($r)=>Carbon::parse($r->tanggal)->toDateString());

        // ringkasan siswa per hari dari absensi mapel (kelas yg diampu)
        $jadwalIds = JadwalMengajar::where('id_guru',$guru->id_guru)->pluck('id_jadwal');

        $siswaDaily = AbsensiSiswa::whereBetween('tanggal', [$start,$end])
            ->select('tanggal','status_kehadiran', DB::raw('COUNT(*) as c'))
            ->groupBy('tanggal','status_kehadiran')
            ->get()
            ->groupBy('tanggal');

        $out = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $ds = $d->toDateString();
            $g  = $guruDaily[$ds]->status_kehadiran ?? '-';
            $sg = $siswaDaily->get($ds, collect())->keyBy('status_kehadiran');

            $out[] = [
                'tanggal'      => $ds,
                'status_guru'  => $g,
                'ringkasan_siswa' => [
                    'hadir' => (int)($sg['Hadir']->c ?? 0),
                    'izin'  => (int)($sg['Izin']->c ?? 0),
                    'sakit' => (int)($sg['Sakit']->c ?? 0),
                    'alfa'  => (int)($sg['Alfa']->c ?? 0),
                ],
            ];
        }
        return response()->json($out);
    }

    /** =========================
     *  WIDGET: Notifications sederhana
     *  GET /api/guru/notifications?scope=guru_absensi
     *  ========================= */
    public function notifications(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        $today = Carbon::today()->toDateString();

        $jadwal = JadwalMengajar::where('id_guru',$guru->id_guru)
            ->where('hari', Carbon::now()->translatedFormat('l'))
            ->pluck('id_jadwal');

        $belum = [];
        foreach ($jadwal as $id) {
            $exists = AbsensiSiswaMapel::where('id_jadwal',$id)->whereDate('tanggal',$today)->exists();
            if (!$exists) $belum[] = $id;
        }

        $items = [];
        if (count($belum) > 0) {
            $items[] = [
                'id' => 'kelas_belum_diabsen',
                'message' => 'Ada kelas hari ini yang belum diabsen.',
                'severity'=> 'high',
                'data' => ['jadwal_ids' => $belum],
            ];
        }

        $sudahCheckin = AbsensiGuru::where('id_guru',$guru->id_guru)->whereDate('tanggal',$today)->exists();
        if (!$sudahCheckin) {
            $items[] = [
                'id' => 'guru_belum_checkin',
                'message' => 'Anda belum absen masuk hari ini.',
                'severity'=> 'medium',
            ];
        }

        return response()->json($items);
    }

    /** =========================
     *  Quick actions: checkin/checkout
     *  POST /api/guru/attendance/checkin
     *  POST /api/guru/attendance/checkout
     *  ========================= */
    public function checkin(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        $today = Carbon::today()->toDateString();

        $row = AbsensiGuru::firstOrNew([
            'id_absensi' => 'AG-'.Carbon::now()->format('ymd').'-'.$guru->id_guru,
        ]);

        $row->fill([
            'id_guru' => $guru->id_guru,
            'tanggal' => $today,
            'status_kehadiran' => 'Hadir',
            'metode_absen' => 'Manual',
        ]);
        if (!$row->jam_masuk) $row->jam_masuk = Carbon::now()->format('H:i:s');
        $row->save();

        return response()->json(['ok'=>true,'message'=>'Check-in tercatat.']);
    }

    public function checkout(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        $id = 'AG-'.Carbon::now()->format('ymd').'-'.$guru->id_guru;

        $row = AbsensiGuru::where('id_absensi',$id)->first();
        if (!$row) {
            return response()->json(['ok'=>false,'message'=>'Belum check-in.'], 422);
        }
        $row->jam_pulang = Carbon::now()->format('H:i:s');
        $row->save();

        return response()->json(['ok'=>true,'message'=>'Check-out tercatat.']);
    }

    /** =========================
     *  Optional: trend kehadiran guru (6 bulan)
     *  GET /api/guru/attendance_trend
     *  ========================= */
    public function attendanceTrend()
    {
        $guru = $this->meGuruOrAbort();
        $end = Carbon::now()->endOfMonth();
        $start = Carbon::now()->subMonths(5)->startOfMonth();

        $hadir = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal', [$start,$end])
            ->where('status_kehadiran','Hadir')
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as ym, COUNT(*) as c")
            ->groupBy(DB::raw("DATE_FORMAT(tanggal, '%Y-%m')"))
            ->pluck('c','ym');

        $out = [];
        for ($i=0;$i<6;$i++){
            $d = $start->copy()->addMonths($i);
            $ym = $d->format('Y-m');
            $out[] = [
                'period' => $d->translatedFormat('M Y'),
                'presence_pct' => (int)$hadir->get($ym, 0) // angka harian, frontend bisa normalkan %
            ];
        }
        return response()->json($out);
    }

    /** =========================
     *  Optional: heatmap kalender guru (Hadir=100, selainnya 0)
     *  GET /api/guru/attendance_calendar?bulan=YYYY-MM
     *  ========================= */
    public function attendanceCalendar(Request $request)
    {
        $guru = $this->meGuruOrAbort();
        [$start,$end] = $this->monthRange($request->input('bulan'));
        $rows = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal',[$start,$end])->get();

        $map = [];
        foreach ($rows as $r) {
            $map[$r->tanggal] = $r->status_kehadiran === 'Hadir' ? 100 : 0;
        }
        $out = [];
        for ($d=$start->copy(); $d->lte($end); $d->addDay()){
            $ds = $d->toDateString();
            $out[] = ['date'=>$ds, 'count'=>(int)($map[$ds] ?? 0)];
        }
        return response()->json($out);
    }

    /** =========================
     *  Optional: ranking siswa (top/bottom)
     *  GET /api/guru/students/top_present?bulan=YYYY-MM&limit=5
     *  GET /api/guru/students/bottom_present?bulan=YYYY-MM&limit=5
     *  ========================= */
    public function studentsRanking(Request $request, string $which)
    {
        $guru = $this->meGuruOrAbort();
        [$start,$end] = $this->monthRange($request->input('bulan'));
        $limit = max(1, (int)$request->integer('limit', 5));

        $kelasIds = JadwalMengajar::where('id_guru',$guru->id_guru)->distinct()->pluck('id_kelas');
        if ($kelasIds->isEmpty()) return response()->json([]);

        // present rate = Hadir / (Hadir+Izin+Sakit+Alfa)
        $base = AbsensiSiswa::whereBetween('tanggal',[$start,$end])
            ->join('tbl_siswa','tbl_absensi_siswa.id_siswa','=','tbl_siswa.id_siswa')
            ->whereIn('tbl_siswa.id_kelas', $kelasIds)
            ->select('tbl_siswa.id_siswa','tbl_siswa.nama_lengkap',
                DB::raw("SUM(status_kehadiran='Hadir') as h"),
                DB::raw("SUM(status_kehadiran='Izin') as i"),
                DB::raw("SUM(status_kehadiran='Sakit') as s"),
                DB::raw("SUM(status_kehadiran='Alfa')  as a"))
            ->groupBy('tbl_siswa.id_siswa','tbl_siswa.nama_lengkap');

        $rows = collect(DB::table(DB::raw("({$base->toSql()}) as t"))
            ->mergeBindings($base->getQuery())
            ->select('id_siswa','nama_lengkap',
                DB::raw("(h)/(NULLIF((h+i+s+a),0)) * 100 as pct"))
            ->orderBy('pct', $which === 'top' ? 'desc' : 'asc')
            ->limit($limit)
            ->get());

        return response()->json($rows);
    }

    /** =========================
     *  Ekspor cepat (proxy ke LaporanController)
     *  GET /api/guru/exports/monthly?format=pdf|xlsx&bulan=YYYY-MM
     *  ========================= */
    public function exportMonthly(Request $request, LaporanController $laporan)
    {
        $format = strtolower($request->query('format','pdf'));
        $bulan = $request->query('bulan', Carbon::now()->format('Y-m'));

        // Reuse LaporanController exporter (tanpa filter kelas supaya global)
        $req = Request::create('/dummy', 'GET', ['bulan'=>$bulan,'id_kelas'=>'semua']);
        if ($format === 'xlsx' || $format === 'xls' ) return $laporan->exportExcel($req);
        return $laporan->exportPdf($req);
    }
}
