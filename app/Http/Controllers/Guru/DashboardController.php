<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\AbsensiSiswa;
use App\Models\AbsensiSiswaMapel;
use App\Models\JadwalMengajar;
use App\Models\JurnalMengajar;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\Pengumuman;
use App\Models\SuratIzin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Halaman Dashboard Guru (Inertia)
     * - Tetap kompatibel dgn frontend lama
     * - Tambah properti konfigurasi untuk dashboard baru (opsional dipakai frontend)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru;

        if (!$guru) {
            Auth::logout();
            return redirect('/login')->with('error', 'Akses ditolak. Akun Anda tidak terdaftar sebagai guru.');
        }

        Carbon::setLocale('id');
        $today        = Carbon::today();
        $hariIni      = $today->translatedFormat('l'); // 'Senin', 'Selasa', ...
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth   = $today->copy()->endOfMonth();

        // Jadwal hari ini (untuk tampilan cepat di dashboard lama)
        $jadwalHariIni = JadwalMengajar::with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai', 'asc')
            ->get();

        // Rekap stat kehadiran pribadi (bulan ini)
        $rekap = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->selectRaw("
                SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status_kehadiran='Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status_kehadiran='Izin'  THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status_kehadiran='Alfa'  THEN 1 ELSE 0 END) as alfa,
                SUM(CASE WHEN status_kehadiran='Dinas Luar' THEN 1 ELSE 0 END) as dinas_luar,
                SUM(CASE WHEN COALESCE(menit_keterlambatan,0) > 0 THEN 1 ELSE 0 END) as late_days,
                SUM(COALESCE(menit_keterlambatan,0)) as late_minutes
            ")
            ->first();

        $workdaysMonth = $this->workdays($startOfMonth, $endOfMonth);
        $hadir  = (int) ($rekap->hadir ?? 0);
        $izin   = (int) ($rekap->izin ?? 0);
        $sakit  = (int) ($rekap->sakit ?? 0);
        $alfa   = (int) ($rekap->alfa ?? 0);
        $dinas  = (int) ($rekap->dinas_luar ?? 0);

        $kehadiranPersen = $workdaysMonth > 0 ? round(($hadir / $workdaysMonth) * 100, 1) : 0;

        // Total kelas, mapel, jam/minggu
        $jadwalSemua = JadwalMengajar::where('id_guru', $guru->id_guru)->get(['id_kelas','id_mapel','jam_mulai','jam_selesai']);
        $totalKelas  = $jadwalSemua->pluck('id_kelas')->unique()->count();
        $totalMapel  = $jadwalSemua->pluck('id_mapel')->unique()->count();
        $totalJamPerMinggu = $this->totalJamPerMinggu($jadwalSemua);

        // Status kehadiran hari ini
        $absenToday = AbsensiGuru::where('id_guru', $guru->id_guru)->whereDate('tanggal', $today)->first();
        $statusHariIni = $absenToday->status_kehadiran ?? 'Belum Absen';

        // Notifikasi ringkas
        $notifikasi = [
            'pengumuman'      => $this->getPengumumanPenting(),
            'peringatanTugas' => $this->getPeringatanTugas($guru->id_guru),
            'deadlineJurnal'  => $this->getDeadlineJurnal($guru->id_guru),
        ];

        // Bawa juga konfigurasi (jika frontend mau pakai skema widget JSON)
        $dashboardConfig = [
            'id'    => 'guru_absensi_v1',
            'title' => 'Dashboard Guru - Fokus Absensi',
        ];

        return Inertia::render('Guru/Dashboard', [
            'guru'            => $guru,
            'jadwalHariIni'   => $jadwalHariIni,
            'stats'           => [
                'kehadiran_bulan_ini' => [
                    'persen'      => $kehadiranPersen,
                    'hadir'       => $hadir,
                    'izin'        => $izin,
                    'sakit'       => $sakit,
                    'alfa'        => $alfa,
                    'dinas_luar'  => $dinas,
                    'late_days'   => (int) ($rekap->late_days ?? 0),
                    'late_minutes'=> (int) ($rekap->late_minutes ?? 0),
                    'workdays'    => $workdaysMonth,
                ],
                'total_kelas'        => $totalKelas,
                'total_mapel'        => $totalMapel,
                'total_jam_seminggu' => $totalJamPerMinggu,
                'status_hari_ini'    => $statusHariIni,
                'jadwal_hari_ini_count' => $jadwalHariIni->count(),
            ],
            'notifikasi'      => $notifikasi,
            'dashboardConfig' => $dashboardConfig,
        ]);
    }

    /* ============================================================
     |  API ENDPOINTS untuk widget-widget dashboard (JSON)
     |  Tambahkan route GET/POST sesuai komentar di bawah.
     * ============================================================*/

    // GET /api/guru/kehadiran_counts?period=month&month=YYYY-MM
    public function kehadiranCounts(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $period = $request->input('period', 'month');
        [$start, $end] = $this->resolvePeriodRange($period, $request);

        $rekap = AbsensiGuru::where('id_guru', $guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->selectRaw("
                SUM(CASE WHEN status_kehadiran='Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status_kehadiran='Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status_kehadiran='Izin'  THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status_kehadiran='Alfa'  THEN 1 ELSE 0 END) as alfa,
                SUM(CASE WHEN status_kehadiran='Dinas Luar' THEN 1 ELSE 0 END) as dinas_luar,
                SUM(CASE WHEN COALESCE(menit_keterlambatan,0) > 0 THEN 1 ELSE 0 END) as late_days,
                SUM(COALESCE(menit_keterlambatan,0)) as late_minutes
            ")
            ->first();

        $workdays = $this->workdays($start, $end);

        return response()->json([
            'period'        => $period,
            'range'         => [$start->toDateString(), $end->toDateString()],
            'workdays'      => $workdays,
            'hadir'         => (int) ($rekap->hadir ?? 0),
            'sakit'         => (int) ($rekap->sakit ?? 0),
            'izin'          => (int) ($rekap->izin ?? 0),
            'alfa'          => (int) ($rekap->alfa ?? 0),
            'dinas_luar'    => (int) ($rekap->dinas_luar ?? 0),
            'late'          => [
                'days'   => (int) ($rekap->late_days ?? 0),
                'minutes'=> (int) ($rekap->late_minutes ?? 0),
            ],
        ]);
    }

    // GET /api/guru/classes/attendance_summary?period=month&month=YYYY-MM
    public function classesAttendanceSummary(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        [$start, $end] = $this->resolvePeriodRange($request->input('period','month'), $request);
        $workdays = $this->workdays($start, $end);

        // kelas yang diampu
        $kelasIds = JadwalMengajar::where('id_guru', $guru->id_guru)
            ->pluck('id_kelas')->unique()->values();

        if ($kelasIds->isEmpty()) {
            return response()->json([]);
        }

        // jumlah siswa aktif per kelas
        $siswaPerKelas = Siswa::whereIn('id_kelas', $kelasIds)->where('status', 'Aktif')
            ->select('id_kelas', DB::raw('COUNT(*) as total'))
            ->groupBy('id_kelas')->pluck('total', 'id_kelas');

        // rekap status per kelas (bulan ini)
        $rekap = AbsensiSiswa::whereBetween('tanggal', [$start, $end])
            ->whereHas('siswa', fn($q) => $q->whereIn('id_kelas', $kelasIds)->where('status','Aktif'))
            ->join('tbl_siswa','tbl_absensi_siswa.id_siswa','=','tbl_siswa.id_siswa')
            ->groupBy('tbl_siswa.id_kelas','tbl_absensi_siswa.status_kehadiran')
            ->select('tbl_siswa.id_kelas','tbl_absensi_siswa.status_kehadiran', DB::raw('COUNT(*) as total'))
            ->get()
            ->groupBy('id_kelas');

        $rows = [];
        foreach ($kelasIds as $id_kelas) {
            $kelas = Kelas::find($id_kelas);
            $namaKelas = trim(($kelas->tingkat ?? '').' '.($kelas->jurusan ?? ''));

            $aktif = (int) ($siswaPerKelas[$id_kelas] ?? 0);
            $expected = $aktif * max(0, $workdays);

            $group = $rekap->get($id_kelas, collect())->keyBy('status_kehadiran');
            $hadir = (int) ($group->get('Hadir')['total'] ?? 0);
            $izin  = (int) ($group->get('Izin')['total']  ?? 0);
            $sakit = (int) ($group->get('Sakit')['total'] ?? 0);
            $alfaRecorded = (int) ($group->get('Alfa')['total'] ?? 0);

            // jika tidak semua alfa tercatat, hitung sisa sbg alfa
            $alfa = $expected > 0 ? max(0, $expected - ($hadir + $izin + $sakit)) : $alfaRecorded;

            $avgPct = ($expected > 0) ? round(($hadir / $expected) * 100, 1) : 0;

            $rows[] = [
                'kelas'            => $namaKelas ?: $id_kelas,
                'id_kelas'         => $id_kelas,
                'students'         => $aktif,
                'present'          => $hadir,
                'izin'             => $izin,
                'sakit'            => $sakit,
                'alfa'             => $alfa,
                'avg_presence_pct' => $avgPct,
            ];
        }

        return response()->json($rows);
    }

    // GET /api/guru/schedule/today
    public function scheduleToday(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        Carbon::setLocale('id');
        $today   = Carbon::today();
        $hariIni = $today->translatedFormat('l');

        $jadwal = JadwalMengajar::with(['kelas','mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai')->get();

        $rows = [];
        foreach ($jadwal as $j) {
            // ringkas status absensi siswa-mapel utk jadwal ini (hari ini)
            $absMapel = AbsensiSiswaMapel::where('id_jadwal', $j->id_jadwal)
                ->whereDate('tanggal', $today)->get();

            $kelasId = $j->id_kelas;
            $totalSiswa = Siswa::where('id_kelas', $kelasId)->where('status','Aktif')->count();

            $ringkas = [
                'hadir' => $absMapel->where('status_kehadiran','Hadir')->count(),
                'izin'  => $absMapel->where('status_kehadiran','Izin')->count(),
                'sakit' => $absMapel->where('status_kehadiran','Sakit')->count(),
                'alfa'  => $absMapel->where('status_kehadiran','Alfa')->count(),
            ];

            $rows[] = [
                'id_jadwal'        => $j->id_jadwal,
                'waktu'            => substr($j->jam_mulai,0,5).' - '.substr($j->jam_selesai,0,5),
                'mapel'            => $j->mataPelajaran->nama_mapel ?? '—',
                'kelas'            => trim(($j->kelas->tingkat ?? '').' '.($j->kelas->jurusan ?? '')),
                'status_absen_siswa'=> $ringkas,
                'total_siswa'      => $totalSiswa,
            ];
        }

        return response()->json($rows);
    }

    // GET /api/guru/attendance_history/recent?days=7
    public function attendanceHistoryRecent(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $days = max(1, (int) $request->input('days', 7));
        $out  = [];

        for ($i = $days; $i >= 1; $i--) {
            $d = Carbon::today()->subDays($i);
            $hari = $d->translatedFormat('l');

            $statusGuru = AbsensiGuru::where('id_guru', $guru->id_guru)
                ->whereDate('tanggal', $d)->value('status_kehadiran') ?? 'Belum Absen';

            // rekap siswa-mapel untuk semua jadwal yang seharusnya mengajar hari itu
            $jadwalIds = JadwalMengajar::where('id_guru',$guru->id_guru)->where('hari',$hari)->pluck('id_jadwal');
            $abs = AbsensiSiswaMapel::whereIn('id_jadwal', $jadwalIds)->whereDate('tanggal',$d)->get();

            $ringkas = [
                'hadir' => $abs->where('status_kehadiran','Hadir')->count(),
                'izin'  => $abs->where('status_kehadiran','Izin')->count(),
                'sakit' => $abs->where('status_kehadiran','Sakit')->count(),
                'alfa'  => $abs->where('status_kehadiran','Alfa')->count(),
            ];

            $out[] = [
                'tanggal'     => $d->toDateString(),
                'status_guru' => $statusGuru,
                'ringkasan_siswa' => $ringkas,
            ];
        }

        return response()->json($out);
    }

    // GET /api/guru/notifications?scope=guru_absensi
    public function notifications(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        Carbon::setLocale('id');
        $today = Carbon::today();
        $hari  = $today->translatedFormat('l');

        $items = [];

        // Kelas hari ini yang belum diabsen
        $jadwal = JadwalMengajar::where('id_guru',$guru->id_guru)->where('hari',$hari)->get();
        foreach ($jadwal as $j) {
            $exists = AbsensiSiswaMapel::where('id_jadwal',$j->id_jadwal)
                ->whereDate('tanggal',$today)->exists();
            if (!$exists) {
                $kelas = Kelas::find($j->id_kelas);
                $items[] = [
                    'rule'     => 'kelas_belum_diabsen',
                    'message'  => 'Ada kelas hari ini yang belum diabsen: '.trim(($kelas->tingkat ?? '').' '.($kelas->jurusan ?? '')),
                    'severity' => 'high',
                    'meta'     => ['id_jadwal'=>$j->id_jadwal],
                ];
            }
        }

        // Guru belum check-in
        $checkin = AbsensiGuru::where('id_guru',$guru->id_guru)->whereDate('tanggal',$today)->first();
        if (!$checkin) {
            $items[] = [
                'rule'     => 'guru_belum_checkin',
                'message'  => 'Anda belum absen masuk hari ini.',
                'severity' => 'medium',
            ];
        }

        // Tambah 3 pengumuman teratas sebagai info
        $pengumuman = Pengumuman::whereIn('target_level',['Guru','Semua'])
            ->latest('tanggal_terbit')->take(3)->get();
        foreach ($pengumuman as $p) {
            $items[] = [
                'rule'     => 'pengumuman',
                'message'  => $p->judul,
                'severity' => 'info',
                'meta'     => ['tanggal'=>$p->tanggal_terbit],
            ];
        }

        return response()->json($items);
    }

    // GET /api/guru/classes/attendance_by_class?period=month&month=YYYY-MM
    public function attendanceByClass(Request $request)
    {
        // gunakan summary yang sama, lalu pilih field x/y
        $rows = $this->classesAttendanceSummary($request)->getData(true);
        $chart = collect($rows)->map(fn($r)=>[
            'kelas' => $r['kelas'],
            'avg_presence_pct' => $r['avg_presence_pct'],
        ])->values();

        return response()->json($chart);
    }

    // GET /api/guru/attendance_trend?granularity=weekly|monthly&months=6
    public function attendanceTrend(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $granularity = $request->input('granularity','weekly'); // weekly default
        $months = max(1, (int) $request->input('months', 6));

        $end   = Carbon::now()->endOfMonth();
        $start = Carbon::now()->subMonths($months-1)->startOfMonth();
        $workdaysPerMonth = [];

        // persentase kehadiran guru (pribadi)
        $formatExpr = "DATE_FORMAT(tanggal, '%Y-%m')";
        $hadir = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal', [$start, $end])
            ->where('status_kehadiran','Hadir')
            ->selectRaw("$formatExpr as period, COUNT(*) as total")
            ->groupBy(DB::raw($formatExpr))
            ->pluck('total','period');

        // hitung workdays per bulan untuk denominator
        for ($i=0; $i<$months; $i++) {
            $d = $start->copy()->addMonths($i);
            $workdaysPerMonth[$d->format('Y-m')] = $this->workdays($d->copy()->startOfMonth(), $d->copy()->endOfMonth());
        }

        $series = [];
        foreach ($workdaysPerMonth as $key => $wd) {
            $pct = $wd > 0 ? round(($hadir->get($key,0) / $wd) * 100, 1) : 0;
            $series[] = [
                'period' => Carbon::createFromFormat('Y-m',$key)->translatedFormat('M Y'),
                'presence_pct' => $pct,
            ];
        }

        return response()->json($series);
    }

    // GET /api/guru/students/top_present?top=5   &  /api/guru/students/bottom_present?top=5
    public function studentsRanking(Request $request, string $type) // type: top|bottom
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        [$start, $end] = $this->resolvePeriodRange('month', $request);
        $kelasIds = JadwalMengajar::where('id_guru',$guru->id_guru)->pluck('id_kelas')->unique();
        if ($kelasIds->isEmpty()) return response()->json([]);

        $aktifIds = Siswa::whereIn('id_kelas',$kelasIds)->where('status','Aktif')->pluck('id_siswa');

        $hadir = AbsensiSiswa::whereBetween('tanggal',[$start,$end])
            ->whereIn('id_siswa',$aktifIds)
            ->where('status_kehadiran','Hadir')
            ->select('id_siswa', DB::raw('COUNT(*) as h'))
            ->groupBy('id_siswa')->pluck('h','id_siswa');

        $workdays = $this->workdays($start,$end);
        $rows = Siswa::whereIn('id_siswa',$aktifIds)->get(['id_siswa','nama_lengkap','nis'])->map(function($s) use ($hadir,$workdays){
            $pct = $workdays>0 ? round(($hadir->get($s->id_siswa,0) / $workdays) * 100, 1) : 0;
            return [
                'id_siswa' => $s->id_siswa,
                'nama'     => $s->nama_lengkap,
                'nis'      => $s->nis,
                'presence_pct' => $pct,
            ];
        });

        $top = max(1, (int) $request->input('top',5));
        $sorted = $type === 'bottom'
            ? $rows->sortBy('presence_pct')->values()->take($top)
            : $rows->sortByDesc('presence_pct')->values()->take($top);

        return response()->json($sorted->all());
    }

    // GET /api/guru/attendance_calendar?month=YYYY-MM
    public function attendanceCalendar(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $month = $request->input('month', Carbon::now()->format('Y-m'));
        $start = Carbon::createFromFormat('Y-m',$month)->startOfMonth();
        $end   = Carbon::createFromFormat('Y-m',$month)->endOfMonth();
        $workdays = $this->workdays($start,$end);

        $hadir = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal',[$start,$end])
            ->where('status_kehadiran','Hadir')
            ->select('tanggal', DB::raw('COUNT(*) as h'))
            ->groupBy('tanggal')->pluck('h','tanggal');

        // % hadir harian (0/100) untuk heatmap pribadi
        $data = [];
        for ($d=$start->copy(); $d->lte($end); $d->addDay()) {
            $isWorkday = $d->isWeekday(); // only weekdays count
            $pct = ($isWorkday && $hadir->has($d->toDateString())) ? 100 : 0;
            $data[] = ['date'=>$d->toDateString(), 'count'=>$pct];
        }

        return response()->json($data);
    }

    // GET /api/guru/leave_requests/pending
    public function pendingLeaveRequests(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        // tampilkan surat izin siswa di kelas yang diampu (status Diajukan) dalam 30 hari terakhir
        $kelasIds = JadwalMengajar::where('id_guru',$guru->id_guru)->pluck('id_kelas')->unique();
        if ($kelasIds->isEmpty()) return response()->json([]);

        $since = Carbon::today()->subDays(30);
        $rows = SuratIzin::with(['siswa:id_siswa,nis,nama_lengkap,id_kelas'])
            ->where('status_pengajuan','Diajukan')
            ->whereHas('siswa', fn($q)=>$q->whereIn('id_kelas',$kelasIds))
            ->where('tanggal_pengajuan','>=',$since)
            ->latest('tanggal_pengajuan')
            ->get()
            ->map(function($s){
                return [
                    'id_surat'   => $s->id_surat,
                    'nama_siswa' => $s->siswa->nama_lengkap ?? '-',
                    'nis'        => $s->siswa->nis ?? '-',
                    'jenis_izin' => $s->jenis_izin,
                    'mulai'      => $s->tanggal_mulai_izin,
                    'selesai'    => $s->tanggal_selesai_izin,
                    'diaju_pada' => $s->tanggal_pengajuan,
                ];
            });

        return response()->json($rows);
    }

    // GET /api/guru/insights
    public function insights(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        [$start,$end] = $this->resolvePeriodRange('month', $request);
        $workdays = $this->workdays($start,$end);

        $hadir = AbsensiGuru::where('id_guru',$guru->id_guru)
            ->whereBetween('tanggal',[$start,$end])
            ->where('status_kehadiran','Hadir')->count();

        $personalPct = $workdays>0 ? round(($hadir/$workdays)*100,1) : 0;

        // rata2 kelas yang diampu
        $kelasSummary = $this->classesAttendanceSummary($request)->getData(true);
        $avgKelas = count($kelasSummary)
            ? round(collect($kelasSummary)->avg('avg_presence_pct'),1)
            : 0;

        return response()->json([
            'presence_pct'           => $avgKelas,     // insight_presence_pct
            'personal_presence_pct'  => $personalPct,  // insight_personal_presence
        ]);
    }

    /* ============================================================
     |  QUICK ACTIONS (contoh endpoint)
     * ============================================================*/

    // POST /api/guru/attendance/checkin
    public function checkin(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $today = Carbon::today()->toDateString();
        $exists = AbsensiGuru::where('id_guru',$guru->id_guru)->whereDate('tanggal',$today)->exists();
        if ($exists) {
            return response()->json(['ok'=>true,'message'=>'Sudah tercatat hari ini.']);
        }

        AbsensiGuru::create([
            'id_absensi'        => 'AG-'.Carbon::now()->format('ymd').'-'.$guru->id_guru,
            'id_guru'           => $guru->id_guru,
            'tanggal'           => $today,
            'jam_masuk'         => Carbon::now()->format('H:i:s'),
            'status_kehadiran'  => 'Hadir',
            'metode_absen'      => 'Manual',
            'keterangan'        => 'Check-in via dashboard',
            'id_penginput_manual'=> Auth::id(),
            'menit_keterlambatan'=> 0,
        ]);

        return response()->json(['ok'=>true]);
    }

    // POST /api/guru/attendance/checkout
    public function checkout(Request $request)
    {
        $guru = Auth::user()->guru;
        abort_unless($guru, 403);

        $today = Carbon::today()->toDateString();
        $abs = AbsensiGuru::where('id_guru',$guru->id_guru)->whereDate('tanggal',$today)->first();
        if (!$abs) {
            return response()->json(['ok'=>false,'message'=>'Belum check-in.'], 422);
        }

        $abs->update([
            'jam_pulang' => Carbon::now()->format('H:i:s'),
            'keterangan' => trim(($abs->keterangan ? $abs->keterangan.' | ' : '').'Checkout via dashboard'),
        ]);

        return response()->json(['ok'=>true]);
    }

    /* ============================================================
     |  UTILITIES
     * ============================================================*/

    private function workdays(Carbon $start, Carbon $end): int
    {
        // weekday inklusif
        return $start->copy()->startOfDay()->diffInWeekdays($end->copy()->startOfDay()) + 1;
    }

    private function totalJamPerMinggu($jadwalCollection): float
    {
        $totalMenit = 0;
        foreach ($jadwalCollection as $j) {
            try {
                $mulai = Carbon::createFromFormat('H:i:s', $j->jam_mulai);
                $seles = Carbon::createFromFormat('H:i:s', $j->jam_selesai);
                $totalMenit += max(0, $mulai->diffInMinutes($seles));
            } catch (\Throwable $e) {}
        }
        return round($totalMenit / 60, 1);
    }

    private function resolvePeriodRange(string $period, Request $request): array
    {
        if ($period === 'month') {
            $month = $request->input('month', Carbon::now()->format('Y-m'));
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end   = Carbon::createFromFormat('Y-m', $month)->endOfMonth();
            return [$start, $end];
        }
        if ($period === 'last_month') {
            $start = Carbon::now()->subMonthNoOverflow()->startOfMonth();
            $end   = Carbon::now()->subMonthNoOverflow()->endOfMonth();
            return [$start, $end];
        }
        // custom: ?start=YYYY-MM-DD&end=YYYY-MM-DD
        $start = Carbon::parse($request->input('start', Carbon::today()->toDateString()))->startOfDay();
        $end   = Carbon::parse($request->input('end', Carbon::today()->toDateString()))->startOfDay();
        return [$start, $end];
    }

    /* ============================================================
     |  NOTIFIKASI RINGKAS (dipakai di index lama)
     * ============================================================*/
    private function getPengumumanPenting()
    {
        return Pengumuman::whereIn('target_level', ['Guru', 'Semua'])
            ->latest('tanggal_terbit')
            ->take(5)
            ->get(['id_pengumuman','judul','isi','tanggal_terbit','id_pembuat'])
            ->map(function ($p) {
                return [
                    'id'     => $p->id_pengumuman,
                    'tipe'   => 'Pengumuman',
                    'judul'  => $p->judul,
                    'pesan'  => mb_strimwidth(strip_tags($p->isi), 0, 140, '…', 'UTF-8'),
                    'waktu'  => Carbon::parse($p->tanggal_terbit)->diffForHumans(),
                ];
            })->all();
    }

    private function getPeringatanTugas(string $id_guru)
    {
        $mulai = Carbon::today()->subDays(7);
        $data = JurnalMengajar::with(['jadwal.kelas','jadwal.mataPelajaran'])
            ->whereHas('jadwal', fn($q) => $q->where('id_guru', $id_guru))
            ->whereBetween('tanggal', [$mulai, Carbon::today()])
            ->whereIn('status_mengajar', ['Tugas','Kosong'])
            ->latest('tanggal')
            ->limit(8)
            ->get();

        return $data->map(function ($j) {
            $kelas = $j->jadwal?->kelas;
            $mapel = $j->jadwal?->mataPelajaran;
            return [
                'id'    => $j->id_jurnal,
                'tipe'  => 'Peringatan',
                'judul' => $j->status_mengajar === 'Tugas' ? 'Memberi Tugas' : 'Kelas Kosong',
                'pesan' => ($mapel->nama_mapel ?? 'Mapel'). ' • ' . (($kelas?->tingkat.' '.$kelas?->jurusan) ?: 'Kelas'),
                'waktu' => Carbon::parse($j->tanggal)->isoFormat('DD MMM YYYY'),
            ];
        })->all();
    }

    private function getDeadlineJurnal(string $id_guru)
    {
        $items   = [];
        $limit   = 10;
        $hariMap = [];

        for ($i = 1; $i <= 7; $i++) {
            $d    = Carbon::today()->subDays($i);
            $hari = $d->translatedFormat('l');

            if (!isset($hariMap[$hari])) {
                $hariMap[$hari] = JadwalMengajar::with(['kelas','mataPelajaran'])
                    ->where('id_guru', $id_guru)
                    ->where('hari', $hari)
                    ->get();
            }

            foreach ($hariMap[$hari] as $jd) {
                $exists = JurnalMengajar::where('id_jadwal', $jd->id_jadwal)
                    ->whereDate('tanggal', $d)
                    ->exists();

                if (!$exists) {
                    $kelas = $jd->kelas;
                    $mapel = $jd->mataPelajaran;
                    $items[] = [
                        'id'    => $jd->id_jadwal.'-'.$d->toDateString(),
                        'tipe'  => 'Deadline',
                        'judul' => 'Jurnal Belum Diisi',
                        'pesan' => ($mapel->nama_mapel ?? 'Mapel') . ' • ' . (($kelas?->tingkat.' '.$kelas?->jurusan) ?: 'Kelas'),
                        'waktu' => $d->isoFormat('ddd, DD MMM YYYY'),
                    ];

                    if (count($items) >= $limit) break 2;
                }
            }
        }

        return $items;
    }
}
