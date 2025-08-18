<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Jadwal Mengajar</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 10px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #333; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; font-weight: bold; }
        .header { margin-bottom: 20px; text-align: center; }
        .header h3 { margin: 0; font-size: 16px; }
        .header p { margin: 5px 0; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h3>{{ $title }}</h3>
        <p>Tahun Ajaran {{ $tahunAjaran->tahun_ajaran }} - Semester {{ $tahunAjaran->semester }}</p>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Hari</th>
                <th>Waktu</th>
                <th>Mata Pelajaran</th>
                <th>Guru</th>
                <th>Kelas</th>
            </tr>
        </thead>
        <tbody>
            @forelse($jadwalGrouped as $hari => $jadwals)
                @foreach($jadwals as $index => $jadwal)
                    <tr>
                        @if($index === 0)
                            <td rowspan="{{ count($jadwals) }}" style="vertical-align: middle; text-align: center; font-weight: bold;">{{ $hari }}</td>
                        @endif
                        <td>{{ \Carbon\Carbon::parse($jadwal->jam_mulai)->format('H:i') }} - {{ \Carbon\Carbon::parse($jadwal->jam_selesai)->format('H:i') }}</td>
                        <td>{{ $jadwal->mapel->nama_mapel ?? 'N/A' }}</td>
                        <td>{{ $jadwal->guru->nama_lengkap ?? 'N/A' }}</td>
                        <td>{{ $jadwal->kelas->nama_lengkap ?? 'N/A' }}</td>
                    </tr>
                @endforeach
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">Tidak ada jadwal untuk ditampilkan.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>