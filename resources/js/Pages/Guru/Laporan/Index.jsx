import React from 'react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Head, useForm } from '@inertiajs/react';
import { FileText, Filter, FileSpreadsheet, FileType } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

// Helper untuk membuat query string dari objek filter
const buildQueryString = (params) => {
    return Object.entries(params)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
};

export default function LaporanIndex({ auth, filterOptions, laporanData, filters }) {
    const { data, setData, get, processing } = useForm({
        tanggal_mulai: filters.tanggal_mulai || '',
        tanggal_selesai: filters.tanggal_selesai || '',
        id_kelas: filters.id_kelas || '',
        id_mapel: filters.id_mapel || '',
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('guru.laporan.index'), {
            preserveState: true,
        });
    };

    // Fungsi untuk menangani ekspor dan preview
    const handleAction = (action) => {
        // Cek apakah filter sudah diisi
        if (!data.tanggal_mulai || !data.tanggal_selesai || !data.id_kelas || !data.id_mapel) {
            alert('Silakan isi semua filter terlebih dahulu sebelum melakukan ekspor atau preview.');
            return;
        }

        const queryString = buildQueryString(data);

        if (action === 'excel') {
            const url = route('guru.laporan.exportExcel') + '?' + queryString;
            window.location.href = url; // Redirect untuk download
        }

        if (action === 'pdf') {
            const url = route('guru.laporan.previewPdf') + '?' + queryString;
            window.open(url, '_blank'); // Buka di tab baru
        }
    };

    return (
        <GuruLayout user={auth.user} header="Laporan Mengajar">
            <Head title="Laporan" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Panel Filter */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold flex items-center mb-4">
                        <Filter className="w-6 h-6 mr-3 text-sky-600" />
                        Filter Laporan Absensi
                    </h2>
                    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="id_kelas" className="block text-sm font-medium text-gray-700">Kelas</label>
                            <select id="id_kelas" value={data.id_kelas} onChange={e => setData('id_kelas', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Pilih Kelas</option>
                                {filterOptions.kelas.map(k => (
                                    <option key={k.id_kelas} value={k.id_kelas}>{k.tingkat} {k.jurusan}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="id_mapel" className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                            <select id="id_mapel" value={data.id_mapel} onChange={e => setData('id_mapel', e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Pilih Mata Pelajaran</option>
                                {filterOptions.mapel.map(m => (
                                    <option key={m.id_mapel} value={m.id_mapel}>{m.nama_mapel}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                            <TextInput type="date" id="tanggal_mulai" value={data.tanggal_mulai} onChange={e => setData('tanggal_mulai', e.target.value)} required className="mt-1 block w-full" />
                        </div>
                        <div>
                            <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                            <TextInput type="date" id="tanggal_selesai" value={data.tanggal_selesai} onChange={e => setData('tanggal_selesai', e.target.value)} required className="mt-1 block w-full" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                            <PrimaryButton disabled={processing}>Tampilkan Laporan</PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* Hasil Laporan */}
                {laporanData && laporanData.siswas && (
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Hasil Laporan Absensi Siswa</h2>
                            <div className="flex space-x-2">
                                <button onClick={() => handleAction('pdf')} title="Preview PDF" className="p-2 text-gray-500 hover:text-red-600 flex items-center gap-2 border rounded-md hover:bg-gray-50">
                                    <FileType className="w-5 h-5" />
                                    <span>PDF</span>
                                </button>
                                <button onClick={() => handleAction('excel')} title="Ekspor Excel" className="p-2 text-gray-500 hover:text-green-600 flex items-center gap-2 border rounded-md hover:bg-gray-50">
                                    <FileSpreadsheet className="w-5 h-5" />
                                    <span>Excel</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Total Pertemuan: <strong>{laporanData.totalPertemuan}</strong></p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-6 py-3">Nama Siswa</th>
                                        <th className="px-6 py-3">NIS</th>
                                        <th className="px-2 py-3 text-center">H</th>
                                        <th className="px-2 py-3 text-center">S</th>
                                        <th className="px-2 py-3 text-center">I</th>
                                        <th className="px-2 py-3 text-center">A</th>
                                        <th className="px-6 py-3 text-center">% Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {laporanData.siswas.map((siswa, index) => (
                                        <tr key={siswa.id_siswa} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-4">{index + 1}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{siswa.nama_lengkap}</td>
                                            <td className="px-6 py-4">{siswa.nis}</td>
                                            <td className="px-2 py-4 text-center">{siswa.hadir}</td>
                                            <td className="px-2 py-4 text-center">{siswa.sakit}</td>
                                            <td className="px-2 py-4 text-center">{siswa.izin}</td>
                                            <td className="px-2 py-4 text-center">{siswa.alfa}</td>
                                            <td className="px-6 py-4 text-center">{siswa.persentase_kehadiran}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </GuruLayout>
    );
}