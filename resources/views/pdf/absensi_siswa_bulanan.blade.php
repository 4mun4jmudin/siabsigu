<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Absensi Siswa Bulanan</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
        h2 { margin: 0 0 6px; }
        table { width:100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border:1px solid #ccc; padding:6px 8px; text-align:left; }
        th { background:#f5f5f5; }
        .small { color:#666; font-size:11px; }
        .right { text-align:right; }
        .center { text-align:center; }
    </style>
</head>
<body>
    <h2>Rekap Absensi Siswa Bulanan</h2>
    <div class="small">Periode: {{ $month }} &nbsp;&nbsp;|&nbsp;&nbsp; Kelas: {{ $kelas }}</div>

    <table>
        <thead>
            <tr>
                <th>Kelas</th>
                <th>Hadir</th>
                <th>Sakit</th>
                <th>Izin</th>
                <th>Alfa</th>
                <th>Kehadiran (%)</th>
                <th>Rata Telat (menit)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $r)
                <tr>
                    <td>{{ $r->nama_kelas }}</td>
                    <td class="right">{{ (int)$r->hadir }}</td>
                    <td class="right">{{ (int)$r->sakit }}</td>
                    <td class="right">{{ (int)$r->izin }}</td>
                    <td class="right">{{ (int)$r->alfa }}</td>
                    <td class="right">{{ (int)$r->persen_hadir }}</td>
                    <td class="right">{{ (int)$r->rata_telat }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="center small">Tidak ada data</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
