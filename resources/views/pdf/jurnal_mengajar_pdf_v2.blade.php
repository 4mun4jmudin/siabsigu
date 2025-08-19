<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Laporan Jurnal Mengajar</title>
  <style>
    /** Global **/
    @page {
      margin: 40px 30px 60px 30px; /* top right bottom left */
    }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; }
    .header {
      width: 100%;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand img { width: 72px; height: 72px; object-fit: contain; }
    .brand .school {
      line-height: 1;
    }
    .school .name { font-size: 18px; font-weight: 700; color: #0F172A; }
    .school .meta { font-size: 10px; color: #475569; }

    .title {
      margin-top: 10px;
      text-align: center;
    }
    .title h2 { margin: 0; font-size: 16px; letter-spacing: 0.5px; }
    .filters { text-align: center; font-size: 10px; color: #374151; margin-bottom: 6px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
    thead { background-color: #2563EB; color: #fff; }
    thead th {
      padding: 8px 6px;
      font-weight: 700;
      border: 1px solid #D1D5DB;
      text-align: center;
    }
    tbody td {
      padding: 6px 6px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
      color: #0F172A;
    }
    tbody tr:nth-child(even) { background: #FBFDFF; }

    .materi { white-space: pre-wrap; word-wrap: break-word; }

    /* make thead repeat on each page */
    thead { display: table-header-group; }
    tfoot { display: table-row-group; }

    /* Footer area fixed */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 28px;
      font-size: 10px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
      padding: 6px 10px;
      text-align: right;
    }

    /* small helpers */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .small { font-size: 10px; color: #6B7280; }
  </style>
</head>
<body>

  {{-- HEADER --}}
  <div class="header">
    <div class="brand">
      @php
        $logoPath = public_path('images/logo.png'); // sesuaikan path logo di public/
      @endphp
      @if(file_exists($logoPath))
        <img src="{{ $logoPath }}" alt="Logo Sekolah" />
      @endif
      <div class="school">
        <div class="name">{{ $school['name'] ?? config('app.name') }}</div>
        <div class="meta">{{ $school['address'] ?? '' }} · {{ $school['phone'] ?? '' }}</div>
      </div>
    </div>
  </div>

  {{-- JUDUL --}}
  <div class="title">
    <h2>Laporan Jurnal Mengajar</h2>
  </div>

  {{-- FILTER INFO --}}
  <div class="filters">
    @php
      $f = $filters ?? [];
      $periode = ($f['tanggal_mulai'] ?? '_________') . ' s/d ' . ($f['tanggal_selesai'] ?? '_________');
      $searchText = $f['search'] ?? null;
      $extra = '';
      if (!empty($f['id_guru'])) {
        $g = \App\Models\Guru::find($f['id_guru']);
        $extra .= ' | Guru: ' . ($g->nama_lengkap ?? '-');
      }
      if (!empty($f['id_kelas'])) {
        $k = \App\Models\Kelas::find($f['id_kelas']);
        $extra .= ' | Kelas: ' . (($k->tingkat ?? '') . ' ' . ($k->jurusan ?? ''));
      }
    @endphp

    <div class="small">Periode: {{ $periode }} {{ $extra }} {{ $searchText ? ' | Pencarian: "'.$searchText.'"' : '' }}</div>
  </div>

  {{-- TABEL DATA --}}
  <table>
    <thead>
      <tr>
        <th style="width:4%">No</th>
        <th style="width:9%">Tanggal</th>
        <th style="width:8%">Hari</th>
        <th style="width:7%">Jam Masuk</th>
        <th style="width:7%">Jam Keluar</th>
        <th style="width:10%">Kelas</th>
        <th style="width:14%">Mata Pelajaran</th>
        <th style="width:12%">Guru Pengajar</th>
        <th style="width:7%">Status</th>
        <th style="width:12%">Guru Pengganti</th>
        <th style="width:20%">Materi Pembahasan</th>
      </tr>
    </thead>

    <tbody>
      @php
        use Carbon\Carbon;
        $formatTime = function($v) {
            if (empty($v) && $v !== '0') return '-';
            try {
                if (is_string($v) && strpos($v, ':') !== false) return substr($v, 0, 5);
                if ($v instanceof \Carbon\Carbon) return $v->format('H:i');
                return Carbon::parse($v)->format('H:i');
            } catch (\Exception $e) {
                $s = (string) $v;
                return strlen($s) > 5 ? substr($s, 0, 5) : $s;
            }
        };
      @endphp

      @forelse($jurnals as $i => $jurnal)
        @php
          $jadwal = $jurnal->jadwalMengajar ?? null;
          $kelasText = '-';
          if ($jadwal && $jadwal->kelas) {
              $kelasText = trim(($jadwal->kelas->tingkat ?? '-') . ' ' . ($jadwal->kelas->jurusan ?? ''));
          }
          $mapel = $jadwal ? ($jadwal->mapel->nama_mapel ?? $jadwal->mataPelajaran->nama_mapel ?? '-') : '-';
          $guruPengajar = $jadwal->guru->nama_lengkap ?? '-';
          $guruPengganti = $jurnal->guruPengganti->nama_lengkap ?? '-';
          $tanggal = $jurnal->tanggal ? Carbon::parse($jurnal->tanggal)->format('d-m-Y') : '-';
        @endphp
        <tr>
          <td class="text-center">{{ $i + 1 }}</td>
          <td class="text-center">{{ $tanggal }}</td>
          <td class="text-center">{{ $jadwal->hari ?? '-' }}</td>
          <td class="text-center">{{ $formatTime($jurnal->jam_masuk_kelas) }}</td>
          <td class="text-center">{{ $formatTime($jurnal->jam_keluar_kelas) }}</td>
          <td class="text-left">{{ $kelasText }}</td>
          <td class="text-left">{{ $mapel }}</td>
          <td class="text-left">{{ $guruPengajar }}</td>
          <td class="text-center">{{ $jurnal->status_mengajar ?? '-' }}</td>
          <td class="text-left">{{ $guruPengganti }}</td>
          <td class="text-left materi">{{ $jurnal->materi_pembahasan ?? '-' }}</td>
        </tr>
      @empty
        <tr>
          <td colspan="11" class="text-center small">Tidak ada data untuk filter ini.</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  {{-- FOOTER: waktu cetak + page numbers (page_numbers via DomPDF script) --}}
  <div class="footer">
    Dicetak: {{ \Carbon\Carbon::now()->format('Y-m-d H:i:s') }}
  </div>

  {{-- DomPDF: tambahkan nomor halaman di pojok kanan bawah --}}
  <script type="text/php">
    if ( isset($pdf) ) {
        $text = "Halaman {PAGE_NUM} / {PAGE_COUNT}";
        $font = $fontMetrics->get_font("Helvetica", "normal");
        $size = 9;
        $y = $pdf->get_height() - 24; // posisi vertikal (dalam pt)
        $x = $pdf->get_width() - 150; // posisi horizontal dari kiri
        $pdf->page_text($x, $y, $text, $font, $size, array(0,0,0));
    }
  </script>

</body>
</html>
