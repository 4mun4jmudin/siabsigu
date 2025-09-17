<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>Daftar Hadir Bulanan - {{ $tanggal->translatedFormat('F Y') }}</title>
  <style>
    @page { margin: 12mm; }
    body { font-family: DejaVu Sans, sans-serif; color:#111; font-size:10px; }
    .wrap { width:100%; }
    .title { text-align:left; font-weight:700; font-size:14px; margin-bottom:6px; }
    .meta { display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; }
    .meta .left { font-weight:600; }
    table { border-collapse: collapse; width:100%; font-size:10px; }
    th, td { border: 1px solid #bfc3c7; padding:4px; text-align:center; vertical-align:middle; }
    thead th { background:#f3f4f6; }
    td.left { text-align:left; padding-left:6px; }
    .no { width:30px; }
    .nis { width:90px; }
    .name { width:220px; text-align:left; }
    .day { width:18px; padding:2px; }
    .count { width:48px; }
    .signs { margin-top:16px; display:flex; justify-content:space-between; }
    .sign { text-align:center; width:200px; font-size:11px; }
    /* keep table compact to avoid cropping; dompdf will obey paper size set in controller */
  </style>
</head>
<body>
  <div class="wrap">
    <div class="title">DAFTAR HADIR SISWA</div>
    <div class="meta">
      <div class="left">
        Mata Pelajaran: {{ $jadwal?->mataPelajaran?->nama_mapel ?? ($pertemuan['mapel_name'] ?? '-') }}<br/>
        Kelas: {{ $jadwal?->kelas?->tingkat ?? ($pertemuan['kelas_name'] ?? '-') }}
      </div>
      <div class="right">
        Bulan: {{ $tanggal->translatedFormat('F Y') }}<br/>
        Guru: {{ $jadwal?->guru?->nama_lengkap ?? ($pertemuan['guru_name'] ?? '-') }}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="no">No</th>
          <th class="nis">NIS</th>
          <th class="name">Nama</th>
          @for($d = 1; $d <= $lastDay; $d++)
            <th class="day">{{ $d }}</th>
          @endfor
          <th class="count">Jumlah</th>
          <th class="count">Ket</th>
        </tr>
      </thead>
      <tbody>
        @foreach($rows as $i => $r)
          <tr>
            <td class="no">{{ $i + 1 }}</td>
            <td class="nis">{{ $r['nis'] ?? '' }}</td>
            <td class="name left">{{ $r['nama'] ?? '' }}</td>
            @for($d = 1; $d <= $lastDay; $d++)
              <td class="day">{{ $r['days'][$d] ?? '' }}</td>
            @endfor
            <td class="count">{{ $r['countH'] ?? 0 }}</td>
            <td class="count"></td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div class="signs">
      <div class="sign">
        Mengetahui,<br/>
        Kepala Sekolah<br/><br/><br/>
        (_________________)
      </div>

      <div class="sign">
        Guru Mata Pelajaran<br/><br/><br/>
        ({{ $jadwal?->guru?->nama_lengkap ?? ($pertemuan['guru_name'] ?? '') }})
      </div>
    </div>
  </div>
</body>
</html>
