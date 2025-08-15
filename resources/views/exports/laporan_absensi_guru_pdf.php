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
            margin: 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .table th, .table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }
        .table th {
            background-color: #f2f2f2;
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
        .total-summary td {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>LAPORAN REKAPITULASI ABSENSI GURU</h3>
        <h4>{{ $title }}</h4>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th rowspan="2">No</th>
                <th rowspan="2">NIP</th>
                <th rowspan="2">Nama Guru</th>
                <th colspan="4">Jumlah Kehadiran</th>
            </tr>
            <tr>
                <th>Hadir</th>
                <th>Sakit</th>
                <th>Izin</th>
                <th>Alfa</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($data as $index => $row)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $row['nip'] }}</td>
                    <td>{{ $row['nama'] }}</td>
                    <td class="text-center">{{ $row['hadir_count'] }}</td>
                    <td class="text-center">{{ $row['sakit_count'] }}</td>
                    <td class="text-center">{{ $row['izin_count'] }}</td>
                    <td class="text-center">{{ $row['alfa_count'] }}</td>
                </tr>
            @endforeach
            <tr class="total-summary">
                 <td colspan="3" class="text-center"><b>TOTAL</b></td>
                 <td class="text-center">{{ $totals['hadir'] }}</td>
                 <td class="text-center">{{ $totals['sakit'] }}</td>
                 <td class="text-center">{{ $totals['izin'] }}</td>
                 <td class="text-center">{{ $totals['alfa'] }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>