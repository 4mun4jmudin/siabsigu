<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Absensi Siswa</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; text-align: center; }
        .header h2 { margin: 0; }
        .header p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Laporan Absensi Siswa</h2>
        <p>Kelas: {{ $namaKelas }}</p>
        <p>Tanggal: {{ \Carbon\Carbon::parse($tanggal)->translatedFormat('l, d F Y') }}</p>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>No</th>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th>Status Kehadiran</th>
                <th>Jam Masuk</th>
                <th>Keterlambatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dataSiswa as $index => $siswa)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $siswa->nis }}</td>
                    <td>{{ $siswa->nama_lengkap }}</td>
                    @php
                        $absensi = $siswa->absensi->first();
                        $status = $absensi ? $absensi->status_kehadiran : 'Belum Diinput';
                    @endphp
                    <td>{{ $status }}</td>
                    <td>{{ $absensi && $absensi->jam_masuk ? \Carbon\Carbon::parse($absensi->jam_masuk)->format('H:i') : '-' }}</td>
                    <td>{{ $absensi && $absensi->menit_keterlambatan > 0 ? $absensi->menit_keterlambatan . ' menit' : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>