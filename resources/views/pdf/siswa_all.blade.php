<!DOCTYPE html>
<html>
<head>
    <title>Data Seluruh Siswa</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2, .header h4 {
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, td {
            padding: 6px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
        .status-aktif {
            color: green;
        }
        .status-non {
            color: red;
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
        <h2>DATA SISWA</h2>
        <h4>Daftar Seluruh Siswa Terdaftar</h4>
        <p>Dicetak pada: {{ \Carbon\Carbon::now()->format('d-m-Y H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">NIS / NISN</th>
                <th width="25%">Nama Lengkap</th>
                <th width="15%">Kelas</th>
                <th width="10%">JK</th>
                <th width="15%">Tempat, Tgl Lahir</th>
                <th width="15%">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($siswas as $index => $siswa)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>
                    {{ $siswa->nis }}<br>
                    <small style="color:gray">{{ $siswa->nisn }}</small>
                </td>
                <td>
                    <strong>{{ $siswa->nama_lengkap }}</strong><br>
                    <small>{{ $siswa->nama_panggilan }}</small>
                </td>
                <td class="text-center">
                    {{ $siswa->kelas ? $siswa->kelas->tingkat . ' ' . $siswa->kelas->jurusan : '-' }}
                </td>
                <td class="text-center">{{ $siswa->jenis_kelamin == 'Laki-laki' ? 'L' : 'P' }}</td>
                <td>
                    {{ $siswa->tempat_lahir }}, <br>
                    {{ \Carbon\Carbon::parse($siswa->tanggal_lahir)->format('d/m/Y') }}
                </td>
                <td class="text-center">
                    <span class="{{ $siswa->status == 'Aktif' ? 'status-aktif' : 'status-non' }}">
                        {{ $siswa->status }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Dokumen ini digenerate otomatis oleh sistem.</p>
    </div>
</body>
</html>