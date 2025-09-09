{{-- resources/views/exports/laporan_absensi_excel.blade.php --}}
@php
    use Carbon\Carbon;

    // Pastikan $data dan $filters selalu tersedia sebagai array
    $data = $data ?? [];
    $filters = $filters ?? [];

    // Periode: pakai tanggal_mulai / tanggal_selesai jika ada, fallback ke 'Saat ini'
    $start = $filters['tanggal_mulai'] ?? null;
    $end = $filters['tanggal_selesai'] ?? null;

    try {
        $startLabel = $start ? Carbon::parse($start)->translatedFormat('d F Y') : Carbon::now()->translatedFormat('d F Y');
    } catch (\Throwable $e) {
        $startLabel = $start ?? '—';
    }

    try {
        $endLabel = $end ? Carbon::parse($end)->translatedFormat('d F Y') : Carbon::now()->translatedFormat('d F Y');
    } catch (\Throwable $e) {
        $endLabel = $end ?? '—';
    }

    $namaKelas = $filters['nama_kelas'] ?? ($filters['id_kelas'] ?? 'Semua Kelas');
    $namaMapel = $filters['nama_mapel'] ?? ($filters['id_mapel'] ?? 'Semua Mapel');

    // Defensive: buat variabel yang diakses view agar tidak error
    $laporanGuru = $data['laporanGuru'] ?? [];
    $laporanPerKelas = $data['laporanPerKelas'] ?? [];
    $laporanSiswas = $data['siswas'] ?? [];
    $totalPertemuan = $data['totalPertemuan'] ?? 0;
@endphp

<table>
    <thead>
        {{-- Header Utama Laporan --}}
        <tr>
            <th colspan="6" style="font-size: 20px; font-weight: bold; text-align: left;">SMK IT ALHAWARI</th>
        </tr>
        <tr>
            <th colspan="6" style="font-size: 12px; text-align: left;">Jl. Pendidikan No. 123, Kota Harapan · Telp. (021) 123-456</th>
        </tr>
        <tr><th colspan="6"></th></tr>
        <tr>
            <th colspan="6" style="font-size: 18px; font-weight: bold; text-align: center; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                LAPORAN ABSENSI
            </th>
        </tr>
        <tr><th colspan="6"></th></tr>

        <tr>
            <th colspan="3" style="font-weight: bold; text-align: left;">
                Periode: {{ $startLabel }} — {{ $endLabel }}
            </th>
            <th colspan="3" style="font-weight: bold; text-align: left;">
                Kelas: {{ $namaKelas }} — Mapel: {{ $namaMapel }}
            </th>
        </tr>

        <tr><th colspan="6"></th></tr>
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

        @forelse($laporanGuru as $guru)
            <tr>
                <td style="border: 1px solid #000;">{{ $guru['namaGuru'] ?? '—' }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $guru['hadir'] ?? 0 }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $guru['sakit'] ?? 0 }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $guru['izin'] ?? 0 }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $guru['alfa'] ?? 0 }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $guru['persentaseKehadiran'] ?? 0 }}%</td>
            </tr>
        @empty
            <tr>
                <td colspan="6" style="text-align: center; border: 1px solid #000;">Tidak ada data guru.</td>
            </tr>
        @endforelse

        <tr><td colspan="6"></td></tr>

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

        @forelse($laporanPerKelas as $kelas)
            <tr>
                <td style="border: 1px solid #000;">{{ $kelas['namaKelas'] ?? '—' }}</td>
                <td style="border: 1px solid #000;">{{ $kelas['waliKelas'] ?? '—' }}</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['hadir'] ?? 0 }}%</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['sakit'] ?? 0 }}%</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['izin'] ?? 0 }}%</td>
                <td style="text-align: center; border: 1px solid #000;">{{ $kelas['persentase']['alfa'] ?? 0 }}%</td>
            </tr>
        @empty
            <tr>
                <td colspan="6" style="text-align: center; border: 1px solid #000;">Tidak ada data per kelas.</td>
            </tr>
        @endforelse

        <tr><td colspan="6"></td></tr>

        {{-- Tabel Detail Siswa (opsional, jika ada) --}}
        <tr>
            <td colspan="6" style="font-size: 14px; font-weight: bold;">Detail Siswa</td>
        </tr>
        <tr>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">No</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: left;">Nama Siswa</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: left;">NIS</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">H</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">S</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">I</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">A</th>
            <th style="font-weight: bold; background-color: #F3F4F6; border: 1px solid #000; text-align: center;">% Kehadiran</th>
        </tr>

        @forelse($laporanSiswas as $idx => $siswa)
            <tr>
                <td style="border: 1px solid #000; text-align: center;">{{ $idx + 1 }}</td>
                <td style="border: 1px solid #000;">{{ $siswa['nama_lengkap'] ?? '—' }}</td>
                <td style="border: 1px solid #000;">{{ $siswa['nis'] ?? '—' }}</td>
                <td style="border: 1px solid #000; text-align: center;">{{ $siswa['hadir'] ?? 0 }}</td>
                <td style="border: 1px solid #000; text-align: center;">{{ $siswa['sakit'] ?? 0 }}</td>
                <td style="border: 1px solid #000; text-align: center;">{{ $siswa['izin'] ?? 0 }}</td>
                <td style="border: 1px solid #000; text-align: center;">{{ $siswa['alfa'] ?? 0 }}</td>
                <td style="border: 1px solid #000; text-align: center;">{{ $siswa['persentase_kehadiran'] ?? 0 }}%</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" style="text-align: center; border: 1px solid #000;">Tidak ada data siswa.</td>
            </tr>
        @endforelse
    </tbody>
</table>
