<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Absensi</title>
    <style>
        /* Kurangi margin atas agar header lebih rapat */
        @page { margin: 15mm 12mm 15mm 12mm; }
        body {
            font-family: "Helvetica Neue", Arial, sans-serif;
            color: #222;
            font-size: 12px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1.5px solid #2c3e50;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        .logo {
            width: 52px;        /* lebih kecil */
            height: 52px;
            border-radius: 6px;
            overflow: hidden;
            display: inline-block;
            background: #fff;
            border: 1px solid #e0e0e0;
        }
        .logo img { width: 100%; height: 100%; object-fit: contain; }

        .school-info {
            flex: 1;
            padding-left: 4px;
        }
        .school-name {
            font-size: 16px;
            font-weight: 700;
            margin: 0;
            color: #12283a;
        }
        .school-sub {
            margin: 0;
            font-size: 10.5px;
            color: #4b5563;
        }

        .report-meta {
            text-align: right;
            font-size: 11px;
            color: #333;
            min-width: 150px;
        }
        .title {
            text-align: center;
            margin: 6px 0 8px 0;
            font-size: 14px;
            font-weight: 700;
            color: #0b3d91;
        }

        .section { margin-bottom: 10px; }
        .card {
            border: 1px solid #e6e6e6;
            border-radius: 6px;
            padding: 6px;
            background: #ffffff;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
        }
        th, td {
            border: 1px solid #dcdcdc;
            padding: 6px 6px;
            vertical-align: middle;
        }
        th {
            background: #f6f9ff;
            font-weight: 700;
            text-align: center;
            font-size: 11.5px;
        }
        td.center { text-align: center; }
        tr:nth-child(even) td { background: #fbfbfb; }

        .stat-grid { display: flex; gap: 8px; }
        .stat-item {
            flex: 1;
            padding: 6px;
            border-radius: 6px;
            background: #f8fafc;
            border: 1px solid #e6eef9;
            text-align: center;
        }
        .stat-item .value { font-size: 18px; font-weight: 700; color: #0b4da0; }
        .stat-label { font-size: 10px; color: #475569; }

        .signature { width: 100%; margin-top: 18px; display:flex; justify-content:flex-end; }
        .signature .block { text-align:center; width:220px; }
        .small { font-size: 10px; color: #6b7280; }

        .footer {
            position: fixed;
            bottom: 8mm;
            left: 12mm;
            right: 12mm;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }

        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <!-- <div class="logo">
            @if(file_exists(public_path('images/logo.png')))
                <img src="{{ public_path('images/logo.png') }}" alt="logo" />
            @else
                <img src="data:image/svg+xml;utf8,
                    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
                      <rect fill='%230b3d91' width='100%' height='100%' />
                      <text x='50%' y='55%' fill='white' font-size='36' text-anchor='middle' font-family='Arial'>SMK</text>
                    </svg>" alt="logo" />
            @endif
        </div> -->

        <div class="school-info">
            <p class="school-name">SMK IT ALHAWARI</p>
            <p class="school-sub">Jl. Pendidikan No. 123, Kota Harapan &middot; Telp. (021) 123-456</p>
        </div>

        <div class="report-meta">
            <div><strong>Periode:</strong> {{ \Carbon\Carbon::parse($filters['bulan'] ?? now())->translatedFormat('F Y') }}</div>
            <div><strong>Kelas:</strong> {{ $filters['nama_kelas'] ?? 'Semua Kelas' }}</div>
            <div class="small">Dicetak: {{ now()->translatedFormat('d F Y H:i') }}</div>
        </div>
    </div>

    <div class="title">LAPORAN ABSENSI BULANAN</div>

    <div class="section">
        <div class="card">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="flex:1;">
                    <div class="stat-grid" style="max-width:650px;">
                        <div class="stat-item">
                            <div class="stat-label">Rata-rata Kehadiran Siswa</div>
                            <div class="value">{{ $data['stats']['rataRataKehadiranSiswa']['percentage'] ?? 0 }}%</div>
                            <div class="small">Perubahan: {{ $data['stats']['rataRataKehadiranSiswa']['change'] ?? '0.0%' }}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Rata-rata Kehadiran Guru</div>
                            <div class="value">{{ $data['stats']['rataRataKehadiranGuru']['percentage'] ?? 0 }}%</div>
                            <div class="small">Perubahan: {{ $data['stats']['rataRataKehadiranGuru']['change'] ?? '0.0%' }}</div>
                        </div>
                    </div>
                </div>
                <div style="min-width:140px; text-align:right;">
                    <div class="small">Total Siswa Aktif: {{ \App\Models\Siswa::where('status','Aktif')->count() }}</div>
                    <div class="small">Total Guru Aktif: {{ \App\Models\Guru::where('status','Aktif')->count() }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h4 style="margin:6px 0 8px 0;">Rekap Kehadiran Guru</h4>
        <table>
            <thead>
                <tr>
                    <th style="width:40%;">Nama Guru</th>
                    <th style="width:10%;">Hadir</th>
                    <th style="width:10%;">Sakit</th>
                    <th style="width:10%;">Izin</th>
                    <th style="width:10%;">Alfa</th>
                    <th style="width:20%;">Persentase</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data['laporanGuru'] as $guru)
                <tr>
                    <td>{{ $guru['namaGuru'] }}</td>
                    <td class="center">{{ $guru['hadir'] }}</td>
                    <td class="center">{{ $guru['sakit'] }}</td>
                    <td class="center">{{ $guru['izin'] }}</td>
                    <td class="center">{{ $guru['alfa'] }}</td>
                    <td class="center">{{ $guru['persentaseKehadiran'] }}%</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="center">Tidak ada data.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section page-break">
        <h4 style="margin:6px 0 8px 0;">Rekap Kehadiran Siswa per Kelas</h4>
        <table>
            <thead>
                <tr>
                    <th style="width:30%;">Nama Kelas</th>
                    <th style="width:25%;">Wali Kelas</th>
                    <th style="width:11%;">% Hadir</th>
                    <th style="width:11%;">% Sakit</th>
                    <th style="width:11%;">% Izin</th>
                    <th style="width:11%;">% Alfa</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data['laporanPerKelas'] as $kelas)
                <tr>
                    <td>{{ $kelas['namaKelas'] }}</td>
                    <td>{{ $kelas['waliKelas'] }}</td>
                    <td class="center">{{ $kelas['persentase']['hadir'] }}%</td>
                    <td class="center">{{ $kelas['persentase']['sakit'] }}%</td>
                    <td class="center">{{ $kelas['persentase']['izin'] }}%</td>
                    <td class="center">{{ $kelas['persentase']['alfa'] }}%</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="center">Tidak ada data.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <!-- <div class="signature">
        <div class="block">
            <div class="small">Mengetahui,</div>
            <div style="height:48px;"></div>
            <div><strong>Kepala Sekolah</strong></div>
            <div class="small">NIP. 1987654321</div>
        </div>
    </div> -->

    <div class="footer">
        Laporan ini dibuat otomatis oleh SIABSIGU • Dicetak: {{ now()->translatedFormat('d F Y H:i') }}
    </div>
</body>
</html>
