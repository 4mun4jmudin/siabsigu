<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>Daftar Hadir - {{ $pertemuan['mapel_name'] ?? '-' }} {{ $tanggal->format('Y-m-d') }}</title>
  <style>
    /* Minimal, dompdf-friendly CSS */
    @page { margin: 18mm 12mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .school { font-weight:700; font-size:14px; }
    .meta { text-align:right; font-size:11px; color:#444; }
    table { width:100%; border-collapse: collapse; margin-top:8px; }
    th, td { border:1px solid #ccc; padding:6px 8px; font-size:11px; vertical-align:middle; }
    th { background:#f3f4f6; text-align:left; }
    .no { width:36px; text-align:center; }
    .nis { width:110px; }
    .name { width: 240px; }
    .small { font-size:10px; color:#555; }
    .signature { margin-top:28px; display:flex; justify-content:space-between; }
    .sign { text-align:center; width:200px; }
    .page-break { page-break-after:always; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school">DAFTAR HADIR SISWA</div>
      <div class="small">{{ $pertemuan['mapel_name'] ?? '' }} — {{ $pertemuan['kelas_name'] ?? '' }}</div>
    </div>
    <div class="meta">
      <div>Bulan / Tanggal: {{ $tanggal->translatedFormat('F Y') }} / {{ $tanggal->format('Y-m-d') }}</div>
      <div>Guru: {{ $pertemuan['guru_name'] ?? '-' }}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="no">No</th>
        <th class="nis">NIS</th>
        <th class="name">Nama</th>
        <th style="width:80px">Status</th>
        <th style="width:160px">Keterangan</th>
        <th style="width:80px">Jam Masuk</th>
        <th style="width:80px">Jam Pulang</th>
      </tr>
    </thead>
    <tbody>
      @foreach($rows as $i => $r)
        <tr>
          <td class="no">{{ $i + 1 }}</td>
          <td class="nis">{{ $r['nis'] ?? '' }}</td>
          <td class="name">{{ $r['nama'] ?? '' }}</td>
          <td>{{ $r['status'] ?? '-' }}</td>
          <td>{{ $r['keterangan'] ?? '' }}</td>
          <td>{{ $r['jam_mulai'] ?? '' }}</td>
          <td>{{ $r['jam_selesai'] ?? '' }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <div class="signature">
    <div class="sign">
      Mengetahui,<br/><br/><br/>
      Kepala Sekolah<br/><br/><br/>_________________
    </div>
    <div class="sign">
      Guru Mata Pelajaran<br/><br/><br/>
      {{ $pertemuan['guru_name'] ?? '' }}<br/>_________________
    </div>
  </div>
</body>
</html>
