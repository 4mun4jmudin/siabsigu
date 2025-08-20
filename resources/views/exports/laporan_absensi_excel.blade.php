{{-- File ini HANYA untuk ekspor ke Excel dengan styling yang disempurnakan --}}
<table>
    <thead>
        {{-- Header Utama Laporan --}}
        <tr>
            <th colspan="6" style="font-size: 20px; font-weight: bold; text-align: left;">SMK IT ALHAWARI</th>
        </tr>
        <tr>
            <th colspan="6" style="font-size: 12px; text-align: left;">Jl. Pendidikan No. 123, Kota Harapan &middot; Telp. (021) 123-456</th>
        </tr>
        <tr>
            <th colspan="6"></th> {{-- Baris kosong sebagai spasi --}}
        </tr>
        <tr>
            <th colspan="6" style="font-size: 18px; font-weight: bold; text-align: center; border-top: 1px solid #000; border-bottom: 1px solid #000;">LAPORAN ABSENSI BULANAN</th>
        </tr>
        <tr>
            <th colspan="6"></th> {{-- Baris kosong sebagai spasi --}}
        </tr>
        <tr>
            <th colspan="3" style="font-weight: bold; text-align: left;">Periode: {{ \Carbon\Carbon::parse($filters['bulan'] ?? now())->translatedFormat('F Y') }}</th>
            <th colspan="3" style="font-weight: bold; text-align: left;">Kelas: {{ $filters['nama_kelas'] ?? 'Semua Kelas' }}</th>
        </tr>
        <tr>
            <th colspan="6"></th> {{-- Baris kosong sebagai spasi --}}
        </tr>
    </thead>
    <tbody>
        {{-- Tabel Rekapitulasi Guru --}}
        <tr>
            <td colspan="6" style="font-size: 14px; font-weight: bold;">Rekap Kehadiran Guru</td>
        </tr>
        <tr>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Nama Guru</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Hadir</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Sakit</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Izin</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Alfa</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Persentase</th>
        </tr>
        @forelse($data['laporanGuru'] as $guru)
        <tr>
            <td style="border: 1px solid #000;">{{ $guru['namaGuru'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $guru['hadir'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $guru['sakit'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $guru['izin'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $guru['alfa'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $guru['persentaseKehadiran'] }}%</td>
        </tr>
        @empty
        <tr>
            <td colspan="6" style="text-align: center; border: 1px solid #000;">Tidak ada data.</td>
        </tr>
        @endforelse
        <tr>
            <td colspan="6"></td> {{-- Baris kosong sebagai spasi --}}
        </tr>

        {{-- Tabel Rekapitulasi Siswa per Kelas --}}
        <tr>
            <td colspan="6" style="font-size: 14px; font-weight: bold;">Rekap Kehadiran Siswa per Kelas</td>
        </tr>
        <tr>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Nama Kelas</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">Wali Kelas</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">% Hadir</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">% Sakit</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">% Izin</th>
            <th style="font-weight: bold; background-color: #DDEBF7; border: 1px solid #000; text-align: center;">% Alfa</th>
        </tr>
        @forelse($data['laporanPerKelas'] as $kelas)
        <tr>
            <td style="border: 1px solid #000;">{{ $kelas['namaKelas'] }}</td>
            <td style="border: 1px solid #000;">{{ $kelas['waliKelas'] }}</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['hadir'] }}%</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['sakit'] }}%</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['izin'] }}%</td>
            <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['alfa'] }}%</td>
        </tr>
        @empty
        <tr>
            <td colspan="6" style="text-align: center; border: 1px solid #000;">Tidak ada data.</td>
        </tr>
        @endforelse
    </tbody>
</table>