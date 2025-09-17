{{-- resources/views/admin/absensi/pdf.blade.php --}}
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Laporan Absensi - {{ $pertemuan['mapel_name'] ?? 'Semua Mapel' }} - {{ $tanggal }}</title>
    <style>
        @page {
            margin: 25mm 20mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
        }
        .header .school-name {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }
        .header .report-title {
            font-size: 16px;
            color: #555;
            margin: 5px 0 0 0;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 20px;
            font-size: 11px;
        }
        .meta-table td {
            padding: 4px;
            vertical-align: top;
        }
        .meta-table strong {
            display: inline-block;
            width: 90px;
            font-weight: bold;
        }
        .summary-box {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 10px;
            text-align: center;
        }
        .summary-box .count {
            font-size: 18px;
            font-weight: bold;
            display: block;
        }
        .summary-box .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .data-table thead th {
            background-color: #f5f5f5;
            padding: 10px 8px;
            border: 1px solid #ddd;
            font-size: 11px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
        }
        .data-table tbody td {
            padding: 8px;
            border: 1px solid #e0e0e0;
            vertical-align: top;
            font-size: 11px;
        }
        .data-table tbody tr:nth-child(even) {
            background-color: #fcfcfc;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            position: fixed;
            bottom: -20mm; /* Adjust based on @page margin */
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 8px;
        }
        .footer .page-number:before {
            content: "Halaman " counter(page);
        }
        .signature-section {
            margin-top: 40px;
            width: 100%;
        }
        .signature-section td {
            width: 50%;
            text-align: center;
            font-size: 12px;
        }
        .signature-section .signature-space {
            height: 60px;
        }
    </style>
</head>
<body>
    <div class="header">
        <p class="school-name">SMK IT ALHAWARI</p>
        <p class="report-title">Laporan Absensi Kehadiran Siswa</p>
    </div>

    {{-- Info Pertemuan & Ringkasan --}}
    <table class="meta-table">
        <tr>
            <td style="width: 60%;">
                <strong>Mata Pelajaran</strong>: {{ $pertemuan['mapel_name'] ?? 'Semua Mapel' }}<br/>
                <strong>Kelas</strong>: {{ $pertemuan['kelas_name'] ?? '-' }}<br/>
                <strong>Guru</strong>: {{ $pertemuan['guru_name'] ?? '-' }}<br/>
                <strong>Waktu</strong>: {{ $pertemuan['jam_mulai'] ?? '-' }} - {{ $pertemuan['jam_selesai'] ?? '-' }}<br/>
                <strong>Tanggal</strong>: {{ \Carbon\Carbon::parse($tanggal)->locale('id')->isoFormat('dddd, D MMMM Y') }}
            </td>
            <td style="width: 40%;">
                @php
                    $counts = collect($rows)->groupBy('status_kehadiran')->map->count();
                    $total = count($rows);
                @endphp
                <table class="summary-box" style="width:100%;">
                    <tr>
                        <td><span class="count">{{ $total }}</span><span class="label">Total Siswa</span></td>
                        <td><span class="count">{{ $counts['Hadir'] ?? 0 }}</span><span class="label">Hadir</span></td>
                        <td><span class="count">{{ $counts['Izin'] ?? 0 }}</span><span class="label">Izin</span></td>
                        <td><span class="count">{{ $counts['Sakit'] ?? 0 }}</span><span class="label">Sakit</span></td>
                        <td><span class="count">{{ $counts['Alfa'] ?? 0 }}</span><span class="label">Alfa</span></td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>


    {{-- Tabel Data Absensi --}}
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width:30px">No</th>
                <th style="width:80px">NIS</th>
                <th>Nama Siswa</th>
                <th style="width:70px">Status</th>
                <th class="text-center" style="width:80px">Jam Masuk</th>
                <th class="text-center" style="width:80px">Jam Pulang</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $i => $r)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $r->siswa->nis ?? ($r->siswa->id_siswa ?? '-') }}</td>
                    <td>{{ $r->siswa->nama_lengkap ?? '-' }}</td>
                    <td>{{ $r->status_kehadiran }}</td>
                    <td class="text-center">{{ \Carbon\Carbon::parse($r->jam_mulai)->format('H:i') ?? '-' }}</td>
                    <td class="text-center">{{ \Carbon\Carbon::parse($r->jam_selesai)->format('H:i') ?? '-' }}</td>
                    <td>{{ strip_tags($r->keterangan ?? '-') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 20px;">Tidak ada data absensi untuk tanggal ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Tanda Tangan --}}
    <table class="signature-section">
        <tr>
            <td>
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div class="signature-space"></div>
                <p><strong>(___________________)</strong></p>
            </td>
            <td>
                <p>Guru Mata Pelajaran,</p>
                <p>&nbsp;</p> {{-- Spacer --}}
                <div class="signature-space"></div>
                <p><strong>{{ $pertemuan['guru_name'] ?? '(___________________)' }}</strong></p>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dibuat secara otomatis oleh Sistem Absensi SMK IT ALHAWARI pada {{ \Carbon\Carbon::now()->locale('id')->isoFormat('D MMMM Y, HH:mm') }}.
        <span class="page-number"></span>
    </div>

</body>
</html>