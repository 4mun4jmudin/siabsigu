<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PenilaianController extends Controller
{
    /**
     * Halaman daftar nilai kelas/mapel (filterable).
     * Render: resources/js/Pages/Admin/Penilaian/Nilai/Index.jsx
     * Route name yang diharapkan FE: admin.penilaian.index
     */
    public function index(Request $r)
    {
        // ambil filter (semua opsional)
        $id_tahun_ajaran = $r->string('id_tahun_ajaran')->toString();
        $semester        = $r->string('semester')->toString();
        $id_kelas        = $r->string('id_kelas')->toString();
        $id_mapel        = $r->string('id_mapel')->toString();

        // options untuk filter
        $optsTa = DB::table('tbl_tahun_ajaran')
            ->select('id_tahun_ajaran', 'tahun_ajaran', 'status')
            ->orderByDesc('status')->orderBy('tahun_ajaran')
            ->get()
            ->map(fn ($x) => [
                'value' => $x->id_tahun_ajaran,
                'label' => $x->tahun_ajaran,
            ]);

        $optsSemester = collect([['value' => 'Ganjil', 'label' => 'Ganjil'], ['value' => 'Genap', 'label' => 'Genap']]);

        $optsKelas = DB::table('tbl_kelas')
            ->select('id_kelas')
            ->orderBy('id_kelas')
            ->get()
            ->map(fn ($x) => [
                'value' => $x->id_kelas,
                'label' => $x->id_kelas,
            ]);

        $optsMapel = DB::table('tbl_mata_pelajaran')
            ->select('id_mapel', 'nama_mapel')
            ->orderBy('nama_mapel')
            ->get()
            ->map(fn ($x) => [
                'value' => $x->id_mapel,
                'label' => $x->nama_mapel,
            ]);

        // query daftar nilai
        $q = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_siswa as s', 's.id_siswa', '=', 'pm.id_siswa')
            ->join('tbl_mata_pelajaran as m', 'm.id_mapel', '=', 'pm.id_mapel')
            ->select(
                'pm.id_penilaian',
                'pm.id_siswa',
                'pm.id_kelas',
                'pm.id_mapel',
                'pm.id_tahun_ajaran',
                'pm.semester',
                'pm.nilai_akhir',
                'pm.predikat',
                'pm.tuntas',
                's.nis',
                's.nama_lengkap as nama_siswa',
                'm.nama_mapel'
            );

        if ($id_tahun_ajaran !== '') $q->where('pm.id_tahun_ajaran', $id_tahun_ajaran);
        if ($semester !== '')        $q->where('pm.semester', $semester);
        if ($id_kelas !== '')        $q->where('pm.id_kelas', $id_kelas);
        if ($id_mapel !== '')        $q->where('pm.id_mapel', $id_mapel);

        $list = $q->orderBy('s.nama_lengkap')->limit(500)->get();

        return Inertia::render('admin/Penilaian/Index', [
            'options' => [
                'ta'       => $optsTa,
                'semester' => $optsSemester,
                'kelas'    => $optsKelas,
                'mapel'    => $optsMapel,
            ],
            'list' => $list,
        ]);
    }

    /**
     * Tampilkan detail komponen nilai untuk satu header penilaian.
     * Render: resources/js/Pages/Admin/Penilaian/Nilai/Detail.jsx
     * Route name yang diharapkan FE: admin.penilaian.detail.show
     */
    public function showDetail($id_penilaian)
    {
        // header
        $h = DB::table('tbl_penilaian_mapel as pm')
            ->join('tbl_siswa as s', 's.id_siswa', '=', 'pm.id_siswa')
            ->join('tbl_mata_pelajaran as m', 'm.id_mapel', '=', 'pm.id_mapel')
            ->select(
                'pm.id_penilaian',
                'pm.id_siswa',
                'pm.id_kelas',
                'pm.id_mapel',
                'pm.id_tahun_ajaran',
                'pm.semester',
                'pm.nilai_akhir',
                'pm.predikat',
                'pm.tuntas',
                's.nama_lengkap as nama_siswa',
                'm.nama_mapel'
            )
            ->where('pm.id_penilaian', $id_penilaian)
            ->first();

        if (!$h) {
            abort(404, 'Penilaian tidak ditemukan');
        }

        // detail
        $details = DB::table('tbl_penilaian_detail')
            ->where('id_penilaian', $id_penilaian)
            ->orderBy('tanggal')
            ->orderBy('id_detail')
            ->get();

        return Inertia::render('admin/Penilaian/Detail', [
            'header'  => $h,
            'details' => $details,
        ]);
    }

    /**
     * Simpan satu baris detail nilai.
     * Route name yang diharapkan FE: admin.penilaian.detail.store
     */
    public function storeDetail(Request $r, $id_penilaian)
    {
        $header = DB::table('tbl_penilaian_mapel')->where('id_penilaian', $id_penilaian)->first();
        if (!$header) {
            return back()->with('error', 'Header penilaian tidak ditemukan.');
        }

        $data = $r->validate([
            'komponen'  => 'required|in:Tugas,UH,PTS,PAS,Praktik,Proyek',
            'deskripsi' => 'nullable|string|max:100',
            'tanggal'   => 'nullable|date',
            'nilai'     => 'required|numeric|min:0|max:100',
            'bobot'     => 'nullable|numeric|min:0|max:100',
        ]);

        $insert = [
            'id_penilaian' => $id_penilaian,
            'komponen'     => $data['komponen'],
            'deskripsi'    => $data['deskripsi'] ?? null,
            'tanggal'      => $data['tanggal'] ?? null,
            'nilai'        => $data['nilai'],
            'bobot'        => $data['bobot'] ?? null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ];

        DB::table('tbl_penilaian_detail')->insert($insert);

        // Recalculate nilai_akhir + predikat + tuntas
        $this->recalculateHeader($header);

        return back()->with('success', 'Detail nilai ditambahkan.');
    }

    /**
     * Recalculate nilai_akhir/predikat/tuntas untuk 1 header.
     * Logika sederhana:
     * - Rata-rata per komponen (Tugas, UH, PTS, PAS, Praktik, Proyek)
     * - Bobot default ambil dari tbl_bobot_nilai_mapel sesuai (mapel, TA, semester)
     * - Jika di detail ada kolom "bobot" != null, maka nilai detail ikut bobot lokal (normalisasi per komponen)
     * - Nilai akhir = sum( rataKomponen * bobotKomponen ) / sumBobotTerisi
     * - Tuntas = nilai_akhir >= (KKM mapel)
     * - Predikat sederhana: A>=90, B>=80, C>=70, D<70
     */
    protected function recalculateHeader(object $header): void
    {
        // Ambil semua detail
        $details = DB::table('tbl_penilaian_detail')
            ->where('id_penilaian', $header->id_penilaian)
            ->get()
            ->groupBy('komponen');

        // Ambil bobot default
        $bobot = DB::table('tbl_bobot_nilai_mapel')
            ->where('id_mapel', $header->id_mapel)
            ->where('id_tahun_ajaran', $header->id_tahun_ajaran)
            ->where('semester', $header->semester)
            ->first();

        // Helper dapat bobot per komponen
        $def = [
            'Tugas'   => (float)($bobot->bobot_tugas ?? 0),
            'UH'      => (float)($bobot->bobot_uh ?? 0),
            'PTS'     => (float)($bobot->bobot_pts ?? 0),
            'PAS'     => (float)($bobot->bobot_pas ?? 0),
            'Praktik' => (float)($bobot->bobot_praktik ?? 0),
            'Proyek'  => (float)($bobot->bobot_proyek ?? 0),
        ];

        $sumWeighted = 0.0;
        $sumBobot    = 0.0;

        foreach ($def as $komp => $b) {
            if (!$details->has($komp) || $details[$komp]->isEmpty()) {
                continue;
            }

            $rows = $details[$komp];

            // Jika ada bobot lokal pada detail → gunakan pembobotan lokal
            $hasLocal = $rows->contains(fn ($d) => !is_null($d->bobot));

            if ($hasLocal) {
                $wSum = 0.0;
                $wTot = 0.0;
                foreach ($rows as $d) {
                    $w = is_null($d->bobot) ? 0.0 : (float)$d->bobot;
                    if ($w <= 0) continue;
                    $wSum += ((float)$d->nilai) * $w;
                    $wTot += $w;
                }
                if ($wTot > 0) {
                    $avg = $wSum / $wTot;
                    if ($b > 0) {
                        $sumWeighted += $avg * $b;
                        $sumBobot    += $b;
                    }
                }
            } else {
                // rata-rata biasa per komponen
                $avg = $rows->avg(fn ($d) => (float)$d->nilai);
                if ($b > 0) {
                    $sumWeighted += $avg * $b;
                    $sumBobot    += $b;
                }
            }
        }

        // hitung akhir
        $nilaiAkhir = $sumBobot > 0 ? ($sumWeighted / $sumBobot) : null;

        // ambil KKM mapel
        $kkm = DB::table('tbl_mata_pelajaran')->where('id_mapel', $header->id_mapel)->value('kkm') ?? 0;

        // predikat sederhana
        $pred = null;
        $tuntas = null;
        if (!is_null($nilaiAkhir)) {
            $pred = $nilaiAkhir >= 90 ? 'A' : ($nilaiAkhir >= 80 ? 'B' : ($nilaiAkhir >= 70 ? 'C' : 'D'));
            $tuntas = $nilaiAkhir >= max(0, (float)$kkm);
        }

        DB::table('tbl_penilaian_mapel')
            ->where('id_penilaian', $header->id_penilaian)
            ->update([
                'nilai_akhir' => is_null($nilaiAkhir) ? null : round($nilaiAkhir, 2),
                'predikat'    => $pred,
                'tuntas'      => is_null($tuntas) ? null : ($tuntas ? 1 : 0),
                'updated_at'  => now(),
            ]);
    }
}
