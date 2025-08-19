<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Jurnal Mengajar</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2 align="center">Laporan Jurnal Mengajar</h2>
    <table>
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Kelas</th>
                <th>Mata Pelajaran</th>
                <th>Guru Pengajar</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Guru Pengganti</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($jurnal as $row)
            <tr>
                <td>{{ $row->tanggal }}</td>
                <td>{{ $row->jadwal->kelas->nama_kelas ?? '-' }}</td>
                <td>{{ $row->jadwal->mataPelajaran->nama_mapel ?? '-' }}</td>
                <td>{{ $row->jadwal->guru->nama ?? '-' }}</td>
                <td>{{ $row->jam_masuk_kelas }} - {{ $row->jam_keluar_kelas }}</td>
                <td>{{ $row->status_mengajar }}</td>
                <td>{{ $row->guruPengganti->nama ?? '-' }}</td>
                <td>{{ $row->materi_pembahasan }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
