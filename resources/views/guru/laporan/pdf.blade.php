<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Absensi Siswa</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
        }
        .header p {
            margin: 5px 0;
            font-size: 12px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px;
        }
        .report-table {
            width: 100%;
            border-collapse: collapse;
        }
        .report-table th, .report-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }
        .report-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        {{-- Ganti dengan nama sekolah dari pengaturan jika ada --}}
        <h1>Laporan Absensi Siswa</h1>
        <p>Tahun Ajaran Aktif</p>
    </div>

    <table class="info-table">
        <tr>
            <td width="120px"><strong>Guru</strong></td>
            <td>: {{ $guru->nama_lengkap }}</td>
        </tr>
        <tr>
            <td><strong>Tanggal Laporan</strong></td>
            <td>: {{ \Carbon\Carbon::parse($filters['tanggal_mulai'])->isoFormat('D MMMM YYYY') }} - {{ \Carbon\Carbon::parse($filters['tanggal_selesai'])->isoFormat('D MMMM YYYY') }}</td>
        </tr>
        <tr>
            <td><strong>Total Pertemuan</strong></td>
            <td>: {{ $laporanData['totalPertemuan'] }}</td>
        </tr>
    </table>

    <table class="report-table">
        <thead>
            <tr>
                <th class="text-center">No</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th class="text-center">H</th>
                <th class="text-center">S</th>
                <th class="text-center">I</th>
                <th class="text-center">A</th>
                <th class="text-center">% Kehadiran</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($laporanData['siswas'] as $index => $siswa)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $siswa['nama_lengkap'] }}</td>
                    <td>{{ $siswa['nis'] }}</td>
                    <td class="text-center">{{ $siswa['hadir'] }}</td>
                    <td class="text-center">{{ $siswa['sakit'] }}</td>
                    <td class="text-center">{{ $siswa['izin'] }}</td>
                    <td class="text-center">{{ $siswa['alfa'] }}</td>
                    <td class="text-center">{{ $siswa['persentase_kehadiran'] }}%</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center">Tidak ada data untuk ditampilkan.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak pada: {{ now()->isoFormat('D MMMM YYYY, HH:mm:ss') }}
    </div>
</body>
</html>