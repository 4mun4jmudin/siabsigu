<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Absensi Guru</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h3, .header h4 {
            margin: 5px 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th, .table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        .table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }
        .text-center {
            text-align: center;
        }
        .total-summary td {
            font-weight: bold;
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>LAPORAN REKAPITULASI KEHADIRAN GURU</h3>
        <h4>{{ $title }}</h4>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th rowspan="2" style="width: 5%;">No</th>
                <th rowspan="2" style="width: 15%;">NIP</th>
                <th rowspan="2">Nama Guru</th>
                <th colspan="4">Jumlah Kehadiran</th>
            </tr>
            <tr>
                <th style="width: 8%;">Hadir</th>
                <th style="width: 8%;">Sakit</th>
                <th style="width: 8%;">Izin</th>
                <th style="width: 8%;">Alfa</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data as $index => $row)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $row['nip'] }}</td>
                    <td>{{ $row['nama_lengkap'] }}</td>
                    <td class="text-center">{{ $row['hadir'] }}</td>
                    <td class="text-center">{{ $row['sakit'] }}</td>
                    <td class="text-center">{{ $row['izin'] }}</td>
                    <td class="text-center">{{ $row['alfa'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 20px;">Tidak ada data untuk periode yang dipilih.</td>
                </tr>
            @endforelse
            @if(count($data) > 0)
            <tr class="total-summary">
                 <td colspan="3" class="text-center"><b>TOTAL KESELURUHAN</b></td>
                 <td class="text-center">{{ $totals['hadir'] }}</td>
                 <td class="text-center">{{ $totals['sakit'] }}</td>
                 <td class="text-center">{{ $totals['izin'] }}</td>
                 <td class="text-center">{{ $totals['alfa'] }}</td>
            </tr>
            @endif
        </tbody>
    </table>
</body>
</html>
