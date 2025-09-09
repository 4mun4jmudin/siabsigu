<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\JadwalMengajar;
use App\Models\JurnalMengajar;
use App\Models\Pengaturan;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class JadwalController extends Controller
{
    /**
     * Menampilkan halaman jadwal guru (index).
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru ?? null;
        if (!$guru) {
            abort(403, 'Akses ditolak. Anda bukan guru.');
        }

        // Info tanggal / hari
        Carbon::setLocale('id');
        $today = Carbon::today();
        $hariIniLabel = $today->translatedFormat('l');
        $tanggalHariIni = $today->translatedFormat('d F Y');

        // Ambil tahun ajaran aktif (dari tabel pengaturan atau tabel tahun ajaran)
        $pengaturan = Pengaturan::first();
        $tahunAjaran = $pengaturan && $pengaturan->tahun_ajaran_aktif ? $pengaturan->tahun_ajaran_aktif : (TahunAjaran::where('status', 'Aktif')->value('tahun_ajaran') ?? null);
        $semester = $pengaturan->semester_aktif ?? null;

        // Ambil semua jadwal guru (minimal include relasi yang dibutuhkan)
        $allJadwals = JadwalMengajar::with(['kelas', 'mataPelajaran'])
            ->where('id_guru', $guru->id_guru)
            ->get();

        // Group jadwal per hari name (Senin..Minggu)
        $hariUrutan = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
        $jadwalsByDay = [];
        foreach ($hariUrutan as $hari) $jadwalsByDay[$hari] = [];

        foreach ($allJadwals as $j) {
            $mapel = $j->mataPelajaran ?? null;
            $kelas = $j->kelas ?? null;
            // normalize rel names to frontend expected keys
            $jadwalsByDay[$j->hari][] = [
                'id_jadwal' => $j->id_jadwal,
                'jam_mulai' => $j->jam_mulai,
                'jam_selesai' => $j->jam_selesai,
                'mapel' => [
                    'id_mapel' => $mapel?->id_mapel,
                    'nama_mapel' => $mapel?->nama_mapel,
                ],
                'kelas' => [
                    'id_kelas' => $kelas?->id_kelas,
                    'tingkat' => $kelas?->tingkat,
                    'jurusan' => $kelas?->jurusan,
                    // optional nama_kelas
                    'nama_kelas' => ($kelas?->tingkat ? $kelas->tingkat . ' ' . ($kelas->jurusan ?? '') : null),
                ],
            ];
        }

        // Jadwal hari ini (urut berdasarkan jam_mulai)
        $jadwalHariIniCollection = $allJadwals->where('hari', $hariIniLabel)->sortBy('jam_mulai')->values();
        $jadwalHariIni = $jadwalHariIniCollection->map(function($j) {
            return [
                'id_jadwal' => $j->id_jadwal,
                'jam_mulai' => $j->jam_mulai,
                'jam_selesai' => $j->jam_selesai,
                'mata_pelajaran' => $j->mataPelajaran?->nama_mapel ?? null,
                'kelas' => $j->kelas?->tingkat . ' ' . ($j->kelas?->jurusan ?? ''),
            ];
        })->all();

        // Ambil jurnal untuk hari ini (banyak operasi baca -> efisien ambil berdasarkan id_jadwal)
        $jadwalIdsHariIni = $jadwalHariIniCollection->pluck('id_jadwal')->toArray();
        $jurnalsHariIniRaw = JurnalMengajar::whereIn('id_jadwal', $jadwalIdsHariIni)
            ->whereDate('tanggal', $today->toDateString())
            ->get(['id_jurnal','id_jadwal','status_mengajar','materi_pembahasan']);

        // Build map id_jadwal => jurnal
        $jurnalHariIniMap = [];
        foreach ($jurnalsHariIniRaw as $jr) {
            $jurnalHariIniMap[$jr->id_jadwal] = [
                'id_jurnal' => $jr->id_jurnal,
                'status_mengajar' => $jr->status_mengajar,
                'materi_pembahasan' => $jr->materi_pembahasan,
            ];
        }

        // Info ringkasan
        $info = [
            'tahunAjaran' => $tahunAjaran,
            'semester' => $semester,
            'tanggalHariIni' => $tanggalHariIni,
        ];

        // Kirim ke Inertia
        return Inertia::render('Guru/Jadwal/Index', [
            'guru' => $guru,
            'jadwals' => $jadwalsByDay,
            'jadwalHariIni' => $jadwalHariIni,
            'jurnalHariIni' => $jurnalHariIniMap,
            'info' => $info,
        ]);
    }

    /**
     * Export iCal sederhana untuk jadwal guru (membuat event untuk 14 hari ke depan).
     * Tambahkan route yang memanggil method ini untuk menghasilkan file .ics
     */
    public function exportIcal(Request $request)
    {
        $user = Auth::user();
        $guru = $user->guru ?? null;
        if (!$guru) {
            abort(403, 'Akses ditolak.');
        }

        $start = Carbon::today();
        $end = (clone $start)->addDays(14);

        // ambil jadwal guru lengkap
        $jadwals = JadwalMengajar::with(['mataPelajaran', 'kelas'])
            ->where('id_guru', $guru->id_guru)
            ->get();

        $lines = [];
        $lines[] = 'BEGIN:VCALENDAR';
        $lines[] = 'VERSION:2.0';
        $lines[] = 'PRODID:-//YourSchool//Jadwal//EN';

        // iterate dates from start..end
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $hariLabel = $d->translatedFormat('l'); // Senin, Selasa, etc
            foreach ($jadwals->where('hari', $hariLabel) as $j) {
                $dtStart = Carbon::createFromFormat('Y-m-d H:i:s', $d->toDateString() . ' ' . ($j->jam_mulai ?? '00:00:00'))->format('Ymd\THis');
                $dtEnd = Carbon::createFromFormat('Y-m-d H:i:s', $d->toDateString() . ' ' . ($j->jam_selesai ?? '00:00:00'))->format('Ymd\THis');
                $summary = ($j->mataPelajaran?->nama_mapel ?? 'Mata Pelajaran') . ' — ' . ($j->kelas?->tingkat . ' ' . ($j->kelas?->jurusan ?? ''));
                $uid = "jadwal-{$j->id_jadwal}-{$d->toDateString()}@yourapp.local";

                $lines[] = 'BEGIN:VEVENT';
                $lines[] = "UID:{$uid}";
                $lines[] = "DTSTAMP:" . Carbon::now()->format('Ymd\THis\Z');
                $lines[] = "DTSTART;TZID=UTC:{$dtStart}";
                $lines[] = "DTEND;TZID=UTC:{$dtEnd}";
                $lines[] = 'SUMMARY:' . $this->escapeIcsText($summary);
                $lines[] = 'DESCRIPTION:' . $this->escapeIcsText("Guru: {$guru->nama_lengkap}");
                $lines[] = 'END:VEVENT';
            }
        }

        $lines[] = 'END:VCALENDAR';
        $content = implode("\r\n", $lines);

        $filename = 'jadwal-guru-' . Str::slug($guru->nama_lengkap) . '-' . date('Ymd') . '.ics';

        return response($content, 200)
            ->header('Content-Type', 'text/calendar; charset=utf-8')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    private function escapeIcsText($text)
    {
        // escape characters per RFC5545
        return str_replace(["\\", "\n", ";", ","], ["\\\\", "\\n", "\\;", "\\,"], $text);
    }
}
