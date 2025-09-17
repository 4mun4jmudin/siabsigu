{{-- resources/views/admin/absensi/monthly.blade.php --}}
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>Absensi Bulanan - {{ $pertemuan['mapel_name'] ?? 'Mapel' }} - {{ $month }}/{{ $year }}</title>
<style>
  @page { margin: 8mm 6mm; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size:11px; color:#111; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .wrap { width:100%; }
  .header { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
  .logo { width:72px; height:72px; object-fit:contain; border-radius:4px; }
  .title { flex:1; }
  .title h1 { margin:0; font-size:16px; letter-spacing:1px; }
  .meta { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
  .meta .m { border:1px solid #ddd; padding:6px 8px; border-radius:4px; background:#fafafa; font-size:11px; }

  table { width:100%; border-collapse:collapse; page-break-inside:auto; }
  thead th {
    border:1px solid #bbb; padding:6px 4px; font-weight:700; background:#f3f6fb; text-align:center; font-size:11px;
  }
  tbody td { border:1px solid #ddd; padding:4px 6px; vertical-align:middle; font-size:10px; }
  .no { width:36px; text-align:center; }
  .nis { width:80px; text-align:center; }
  .name { width:260px; text-align:left; padding-left:8px; }
  .class { width:90px; text-align:center; }
  .day { width:22px; text-align:center; font-size:9px; }
  .footer { position: fixed; bottom:6mm; left:6mm; right:6mm; font-size:10px; color:#666; display:flex; justify-content:space-between; }
  .small { font-size:10px; color:#666; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      @if(!empty($pertemuan['logo']))
        <img src="{{ $pertemuan['logo'] }}" class="logo" alt="logo"/>
      @else
        <div style="width:72px;height:72px;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:700;">SMK</div>
      @endif

      <div class="title">
        <h1>DAFTAR HADIR SISWA — {{ strtoupper($pertemuan['mapel_name'] ?? 'MATA PELAJARAN') }}</h1>
        <div class="small">Tahun Pelajaran: {{ date('Y') }} &nbsp; | &nbsp; Bulan: {{ \Carbon\Carbon::create($year, $month,1)->locale('id')->isoFormat('MMMM Y') }}</div>

        <div class="meta" style="margin-top:8px">
          <div class="m"><strong>Kelas</strong><div>{{ $pertemuan['kelas_name'] ?? '-' }}</div></div>
          <div class="m"><strong>Guru</strong><div>{{ $pertemuan['guru_name'] ?? '-' }}</div></div>
          <div class="m"><strong>Jam</strong><div>{{ $pertemuan['jam_mulai'] ?? '-' }} — {{ $pertemuan['jam_selesai'] ?? '-' }}</div></div>
        </div>
      </div>
    </div>

    <div style="margin-top:8px;">
      <table>
        <thead>
          <tr>
            <th class="no">No</th>
            <th class="nis">NIS</th>
            <th class="name">Nama</th>
            <th class="class">Kelas</th>
            @for($d=1;$d<=$daysInMonth;$d++)
              <th class="day">{{ $d }}</th>
            @endfor
            <th class="day">S</th>
            <th class="day">I</th>
            <th class="day">A</th>
            <th class="day">KET</th>
          </tr>
        </thead>
        <tbody>
          @foreach($rows as $r)
            <tr>
              <td class="no">{{ $r['no'] }}</td>
              <td class="nis">{{ $r['siswa']?->nis ?? '-' }}</td>
              <td class="name">{{ $r['siswa']?->nama_lengkap ?? '-' }}</td>
              <td class="class">{{ $r['siswa']?->kelas?->tingkat ?? '' }} {{ $r['siswa']?->kelas?->jurusan ?? '' }}</td>

              @for($d=1;$d<=$daysInMonth;$d++)
                @php $st = $r['days'][$d] ?? null; @endphp
                <td class="day">
                  @if($st)
                    @switch($st)
                      @case('Hadir') H @break
                      @case('Izin') I @break
                      @case('Sakit') S @break
                      @case('Alfa') A @break
                      @case('Digantikan') D @break
                      @case('Tugas') T @break
                      @default - 
                    @endswitch
                  @else
                    -
                  @endif
                </td>
              @endfor

              <td class="day">{{ $r['counts']['Sakit'] ?? 0 }}</td>
              <td class="day">{{ $r['counts']['Izin'] ?? 0 }}</td>
              <td class="day">{{ $r['counts']['Alfa'] ?? 0 }}</td>
              <td class="day"></td>
            </tr>
          @endforeach

          @if(count($rows) === 0)
            <tr>
              <td colspan="{{ 4 + $daysInMonth + 4 }}" class="small text-center">Tidak ada data</td>
            </tr>
          @endif
        </tbody>
      </table>
    </div>

  </div>

  <div class="footer">
    <div>SMK IT ALHAWARI — Backup Absensi</div>
    <div class="right">Generated: {{ \Carbon\Carbon::now()->format('Y-m-d H:i') }}</div>
  </div>

  <script type="text/php">
    if ( isset($pdf) ) {
      $font = $fontMetrics->getFont("DejaVuSans", "normal");
      $pdf->page_text(750, 18, "Halaman {PAGE_NUM} / {PAGE_COUNT}", $font, 9, array(0,0,0));
    }
  </script>
</body>
</html>
