<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Exports\LaporanAbsensiExport;
use App\Models\JadwalMengajar;
use App\Models\Siswa;
use App\Models\AbsensiSiswaMapel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf as PDF; // alias dari barryvdh/laravel-dompdf
// use PDF; // alias dari barryvdh/laravel-dompdf

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $guru = Auth::user()->guru;
        if (!$guru) abort(403);

        $jadwals = JadwalMengajar::with(['kelas', 'mapel'])
            ->where('id_guru', $guru->id_guru)
            ->get();

        $filterOptions = [
            'kelas' => $jadwals->map(fn($j) => $j->kelas)->unique('id_kelas')->sortBy('tingkat')->values(),
            'mapel' => $jadwals->map(fn($j) => $j->mapel)->unique('id_mapel')->sortBy('nama_mapel')->values(),
        ];

        $request->validate([
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'nullable|string|exists:tbl_mata_pelajaran,id_mapel',
        ]);

        $laporan = null;
        if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $laporan = $this->generateLaporanAbsensi($request, $guru->id_guru);
        }

        return Inertia::render('Guru/Laporan/Index', [
            'filterOptions' => $filterOptions,
            'laporanData' => $laporan,
            'filters' => $request->only(['tanggal_mulai', 'tanggal_selesai', 'id_kelas', 'id_mapel']),
        ]);
    }

    /**
     * CSV export (existing)
     */
    public function export(Request $request)
    {
        $guru = Auth::user()->guru;
        if (!$guru) abort(403);

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'nullable|string|exists:tbl_mata_pelajaran,id_mapel',
            'format' => 'nullable|in:csv',
        ]);

        $data = $this->generateLaporanAbsensi($request, $guru->id_guru);

        $exportData = [
            // Siswas & totalPertemuan tetap dikirim (dipakai juga oleh view lama)
            'siswas' => $data['siswas'] ?? [],
            'totalPertemuan' => $data['totalPertemuan'] ?? 0,
            // laporanGuru: jika tidak ada data guru, kirim array kosong
            'laporanGuru' => $data['laporanGuru'] ?? [],
            // laporanPerKelas: bisa Anda bangun dari $data, atau kosongkan
            'laporanPerKelas' => $data['laporanPerKelas'] ?? [],
        ];

        $filters = $request->only(['tanggal_mulai', 'tanggal_selesai', 'id_kelas', 'id_mapel']);
        $fileName = 'laporan_absensi_' . now()->format('Ymd_His') . '.csv';

        $response = new StreamedResponse(function () use ($data) {
            $out = fopen('php://output', 'w');
            // header
            fputcsv($out, ['No', 'ID Siswa', 'Nama Lengkap', 'NIS', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Total Pertemuan', 'Persentase Kehadiran (%)']);
            $no = 1;
            foreach ($data['siswas'] as $row) {
                fputcsv($out, [
                    $no++,
                    $row['id_siswa'],
                    $row['nama_lengkap'],
                    $row['nis'],
                    $row['hadir'],
                    $row['sakit'],
                    $row['izin'],
                    $row['alfa'],
                    $data['totalPertemuan'],
                    $row['persentase_kehadiran'],
                ]);
            }
            fclose($out);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        return $response;
    }

    /**
     * Export Excel (.xlsx) menggunakan Maatwebsite\Excel
     */
    public function exportExcel(Request $request)
    {
        $guru = Auth::user()->guru;
        if (!$guru) abort(403);

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'nullable|string|exists:tbl_mata_pelajaran,id_mapel',
        ]);

        $data = $this->generateLaporanAbsensi($request, $guru->id_guru);

        $fileName = 'laporan_absensi_' . now()->format('Ymd_His') . '.xlsx';

        // Prepare rows untuk Export class (array of arrays)
        $rows = [];
        $no = 1;
        foreach ($data['siswas'] as $row) {
            $rows[] = [
                'No' => $no++,
                'ID Siswa' => $row['id_siswa'],
                'Nama Lengkap' => $row['nama_lengkap'],
                'NIS' => $row['nis'],
                'Hadir' => $row['hadir'],
                'Sakit' => $row['sakit'],
                'Izin' => $row['izin'],
                'Alfa' => $row['alfa'],
                'Total Pertemuan' => $data['totalPertemuan'],
                'Persentase Kehadiran (%)' => $row['persentase_kehadiran'],
            ];
        }

        // Build filters array yang akan dipakai di view export (label-friendly)
        $filters = $request->only(['tanggal_mulai', 'tanggal_selesai', 'id_kelas', 'id_mapel']);
        // Optional: tambahkan nama_kelas / nama_mapel supaya template lebih user-friendly
        if (!empty($filters['id_kelas'])) {
            // jika Anda punya model Kelas
            try {
                $kelasModel = \App\Models\Kelas::where('id_kelas', $filters['id_kelas'])->first();
                $filters['nama_kelas'] = $kelasModel ? ($kelasModel->tingkat . ' ' . $kelasModel->jurusan) : null;
            } catch (\Throwable $e) {
                $filters['nama_kelas'] = null;
            }
        }
        if (!empty($filters['id_mapel'])) {
            try {
                $mapelModel = \App\Models\MataPelajaran::where('id_mapel', $filters['id_mapel'])->first();
                $filters['nama_mapel'] = $mapelModel ? $mapelModel->nama_mapel : null;
            } catch (\Throwable $e) {
                $filters['nama_mapel'] = null;
            }
        }

        // PENTING: kirim kedua argumen sesuai constructor export class
        return \Maatwebsite\Excel\Facades\Excel::download(
            new LaporanAbsensiExport($rows, $filters),
            $fileName
        );
    }

    /**
     * Preview PDF (stream) — render view -> dompdf -> stream
     */
    public function previewPdf(Request $request)
    {
        $guru = Auth::user()->guru;
        if (!$guru) abort(403);

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'id_kelas' => 'nullable|string|exists:tbl_kelas,id_kelas',
            'id_mapel' => 'nullable|string|exists:tbl_mata_pelajaran,id_mapel',
        ]);

        $laporan = $this->generateLaporanAbsensi($request, $guru->id_guru);
        $filters = $request->only(['tanggal_mulai', 'tanggal_selesai', 'id_kelas', 'id_mapel']);

        // Render blade view jadi PDF
        $pdf = PDF::loadView('guru.laporan.pdf', [
            'laporanData' => $laporan,
            'filters' => $filters,
            'guru' => $guru,
        ])->setPaper('a4', 'landscape');

        // Stream PDF (bisa di-open di tab baru)
        return $pdf->stream('laporan_absensi_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Core generator (sama seperti sebelumnya)
     */
    private function generateLaporanAbsensi(Request $request, $id_guru)
    {
        $start = $request->tanggal_mulai;
        $end = $request->tanggal_selesai;

        $jadwalQuery = JadwalMengajar::where('id_guru', $id_guru);
        if ($request->filled('id_kelas')) $jadwalQuery->where('id_kelas', $request->id_kelas);
        if ($request->filled('id_mapel')) $jadwalQuery->where('id_mapel', $request->id_mapel);

        $jadwalIds = $jadwalQuery->pluck('id_jadwal')->toArray();
        if (empty($jadwalIds)) return ['siswas' => collect([]), 'totalPertemuan' => 0];

        $totalPertemuan = DB::table('tbl_jurnal_mengajar')
            ->whereIn('id_jadwal', $jadwalIds)
            ->whereBetween('tanggal', [$start, $end])
            ->count();

        if ($totalPertemuan == 0) {
            $siswas = $request->filled('id_kelas')
                ? Siswa::where('id_kelas', $request->id_kelas)->orderBy('nama_lengkap')->get()
                : collect([]);
            $laporanSiswa = $siswas->map(fn($s) => [
                'id_siswa' => $s->id_siswa,
                'nama_lengkap' => $s->nama_lengkap,
                'nis' => $s->nis,
                'hadir' => 0,
                'sakit' => 0,
                'izin' => 0,
                'alfa' => 0,
                'persentase_kehadiran' => 0,
            ]);
            return ['siswas' => $laporanSiswa, 'totalPertemuan' => 0];
        }

        $absensi = AbsensiSiswaMapel::whereIn('id_jadwal', $jadwalIds)
            ->whereBetween('tanggal', [$start, $end])
            ->select('id_siswa', 'status_kehadiran', DB::raw('COUNT(*) as total'))
            ->groupBy('id_siswa', 'status_kehadiran')
            ->get();

        if ($request->filled('id_kelas')) {
            $siswas = Siswa::where('id_kelas', $request->id_kelas)->orderBy('nama_lengkap')->get();
        } else {
            $kelasIds = JadwalMengajar::whereIn('id_jadwal', $jadwalIds)->pluck('id_kelas')->unique()->toArray();
            $siswas = Siswa::whereIn('id_kelas', $kelasIds)->orderBy('nama_lengkap')->get();
        }

        $absensiMap = [];
        foreach ($absensi as $a) {
            $absensiMap[$a->id_siswa][$a->status_kehadiran] = intval($a->total);
        }

        $laporanSiswa = $siswas->map(function ($siswa) use ($absensiMap, $totalPertemuan) {
            $hadir = $absensiMap[$siswa->id_siswa]['Hadir'] ?? 0;
            $sakit = $absensiMap[$siswa->id_siswa]['Sakit'] ?? 0;
            $izin  = $absensiMap[$siswa->id_siswa]['Izin'] ?? 0;
            $alfa = max(0, $totalPertemuan - ($hadir + $sakit + $izin));
            $persentase = $totalPertemuan > 0 ? round(($hadir / $totalPertemuan) * 100) : 0;
            return [
                'id_siswa' => $siswa->id_siswa,
                'nama_lengkap' => $siswa->nama_lengkap,
                'nis' => $siswa->nis,
                'hadir' => $hadir,
                'sakit' => $sakit,
                'izin' => $izin,
                'alfa' => $alfa,
                'persentase_kehadiran' => $persentase,
            ];
        })->values();

        return ['siswas' => $laporanSiswa, 'totalPertemuan' => $totalPertemuan];
    }
}
