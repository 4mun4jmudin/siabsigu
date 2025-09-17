{{-- resources/views/admin/absensi/pdf_monthly.blade.php --}}
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Absensi Bulanan - {{ $jadwal->mataPelajaran?->nama_mapel ?? '' }} - {{ $tanggal->format('F Y') }}</title>
    <style>
        @page { size: A4 landscape; margin: 12mm 10mm; }
        html, body { margin:0; padding:0; }
        body { font-family: "DejaVu Sans", "Arial", sans-serif; color:#222; font-size:10px; }

        /* Header area */
        .title {
            text-align: center;
            font-weight:700;
            font-size:16px;
            margin: 4px 0;
        }
        .sub {
            text-align: center;
            font-size:11px;
            color:#333;
            margin-bottom:6px;
        }
        .meta {
            position: absolute;
            right: 10mm;
            top: 10mm;
            text-align: right;
            font-size:11px;
        }

        /* Table basics */
        table { width:100%; border-collapse:collapse; table-layout: fixed; font-size:9px; }
        thead th, tbody td { border:1px solid #666; vertical-align:middle; padding:4px 6px; }
        thead th { background:#f7f7f7; font-weight:700; text-align:center; }

        /* Column widths (without NIS) */
        th.no-col, td.no-col { width:36px; }                /* No */
        th.name-col, td.name-col { width:320px; text-align:left; padding-left:8px; } /* Nama */
        th.day-col, td.day-col { width:12px; padding:3px 2px; font-size:9px; } /* per hari (lebih sempit) */
        th.sum-col, td.sum-col { width:28px; } /* H,S,I,A columns */

        /* visual tweaks */
        thead { display: table-header-group; } /* repeat header on each page */
        tbody tr { page-break-inside: avoid; }
        .page-break { page-break-after: always; margin-bottom:8mm; }

        /* name wrapping and small text */
        .name-col { word-break: break-word; }
        .small { font-size:10px; color:#666; }

        /* footer */
        .foot { margin-top:10px; display:flex; justify-content:space-between; font-size:10px; gap:10px; }
    </style>
</head>
<body>
    {{-- Title & meta --}}
    <div class="title">DAFTAR HADIR SISWA</div>
    <div class="sub">{{ $jadwal->mataPelajaran?->nama_mapel ?? '-' }} — Kelas: {{ $jadwal->kelas?->tingkat . ' ' . ($jadwal->kelas?->jurusan ?? '') }}</div>
    <div class="meta">
        <div>Bulan: {{ $tanggal->isoFormat('MMMM yyyy') }}</div>
        <div>Guru: {{ $jadwal->guru?->nama_lengkap ?? '-' }}</div>
    </div>

    @php
        $rowsCollection = collect($rows);
        $perPage = 26; // jumlah baris per halaman, bisa diubah (26/28 dll)
        $chunks = $rowsCollection->chunk($perPage);
    @endphp

    @foreach($chunks as $chunkIndex => $chunk)
        <table>
            <thead>
                <tr>
                    <th class="no-col" rowspan="2">No</th>
                    <th class="name-col" rowspan="2">Nama Siswa</th>
                    <th colspan="{{ $lastDay }}">Tanggal</th>
                    <th class="sum-col" rowspan="2">H</th>
                    <th class="sum-col" rowspan="2">S</th>
                    <th class="sum-col" rowspan="2">I</th>
                    <th class="sum-col" rowspan="2">A</th>
                </tr>
                <tr>
                    @for($d=1;$d<=$lastDay;$d++)
                        <th class="day-col">{{ $d }}</th>
                    @endfor
                </tr>
            </thead>
            <tbody>
                @foreach($chunk as $i => $r)
                    @php
                        $idx = ($chunkIndex * $perPage) + $i + 1;
                        $countH = $countS = $countI = $countA = 0;
                    @endphp
                    <tr>
                        <td class="no-col">{{ $idx }}</td>
                        <td class="name-col">{{ $r['nama'] }}</td>

                        @for($d = 1; $d <= $lastDay; $d++)
                            @php
                                $val = $r['days'][$d] ?? '';
                                $short = '';
                                if ($val) {
                                    $short = strtoupper(substr((string)$val, 0, 1));
                                    if ($short === 'H') $countH++;
                                    if ($short === 'S') $countS++;
                                    if ($short === 'I') $countI++;
                                    if ($short === 'A') $countA++;
                                }
                            @endphp
                            <td class="day-col">{{ $short }}</td>
                        @endfor

                        <td class="sum-col">{{ $countH }}</td>
                        <td class="sum-col">{{ $countS }}</td>
                        <td class="sum-col">{{ $countI }}</td>
                        <td class="sum-col">{{ $countA }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        @if (!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach

    <div class="foot">
        <div style="text-align:center; width:45%;">
            Mengetahui,<br><br><br><br>
            Kepala Sekolah
        </div>
        <div style="text-align:center; width:45%;">
            {{ $jadwal->kelas?->kota ?? '—' }}, {{ $tanggal->format('d F Y') }}<br>
            Guru Mata Pelajaran<br><br><br>
            <strong>{{ $jadwal->guru?->nama_lengkap ?? '' }}</strong>
        </div>
    </div>
</body>
</html>
