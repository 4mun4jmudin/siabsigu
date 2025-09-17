<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Absensi {{ $tanggal }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .school { font-weight:700; font-size:16px; }
        .meta { text-align:right; font-size:12px; color:#444; }
        table { width:100%; border-collapse:collapse; margin-top:6px; }
        table th, table td { border:1px solid #888; padding:6px; font-size:11px; }
        th { background:#f3f3f3; }
        .center { text-align:center; }
        .small { font-size:10px; color:#555; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="school">{{ $pertemuan['mapel_name'] ?? 'Absensi' }}</div>
            <div class="small">{{ $pertemuan['kelas_name'] ?? '' }}</div>
            <div class="small">Guru: {{ $pertemuan['guru_name'] ?? '-' }}</div>
        </div>
        <div class="meta">
            <div>Tanggal: {{ $tanggal }}</div>
            <div>Jam: {{ $pertemuan['jam_mulai'] ?? '-' }} — {{ $pertemuan['jam_selesai'] ?? '-' }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="center">No</th>
                <th>NIS</th>
                <th>Nama</th>
                <th>Kelas</th>
                <th class="center">Status</th>
                <th class="center">Jam Masuk</th>
                <th class="center">Jam Pulang</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $i => $r)
                <tr>
                    <td class="center">{{ $i+1 }}</td>
                    <td>{{ $r->siswa->nis ?? '' }}</td>
                    <td>{{ $r->siswa->nama_lengkap ?? '' }}</td>
                    <td>{{ $r->siswa->kelas?->tingkat ? ($r->siswa->kelas->tingkat . ' ' . ($r->siswa->kelas->jurusan ?? '')) : ($r->siswa->kelas->nama_lengkap ?? '') }}</td>
                    <td class="center">{{ $r->status_kehadiran }}</td>
                    <td class="center">{{ $r->jam_mulai }}</td>
                    <td class="center">{{ $r->jam_selesai }}</td>
                    <td>{{ $r->keterangan }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top:20px; display:flex; justify-content:space-between;">
        <div style="text-align:center;">
            <div>Mengetahui,</div>
            <div style="margin-top:40px">Kepala Sekolah</div>
        </div>
        <div style="text-align:center;">
            <div>Guru Mata Pelajaran</div>
            <div style="margin-top:40px">{{ $pertemuan['guru_name'] ?? '' }}</div>
        </div>
    </div>
</body>
</html>
