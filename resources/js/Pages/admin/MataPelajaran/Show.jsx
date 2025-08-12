import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon, PencilIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

// Komponen Badge Kategori dan Status dari halaman Index
const CategoryBadge = ({ category }) => {
    const style = { 'Wajib': 'bg-blue-100 text-blue-800', 'Peminatan': 'bg-green-100 text-green-800', 'Muatan Lokal': 'bg-yellow-100 text-yellow-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style[category] || 'bg-gray-100 text-gray-800'}`}>{category}</span>;
};
const StatusBadge = ({ status }) => {
    const style = { 'Aktif': 'bg-green-100 text-green-800', 'Tidak Aktif': 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style[status]}`}>{status}</span>;
};
const StatCard = ({ icon, title, value }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm flex items-center space-x-4 border border-gray-200">
        <div className="p-3 rounded-full bg-gray-100">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default function Show({ auth, mataPelajaran, detailStats }) {
    return (
        <AdminLayout user={auth.user} header={`Detail Mata Pelajaran: ${mataPelajaran.nama_mapel}`}>
            <Head title={`Detail ${mataPelajaran.nama_mapel}`} />

            <div className="space-y-6">
                {/* Header Halaman */}
                <div className="flex justify-between items-center">
                    <Link href={route('mata-pelajaran.index')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Kembali ke Daftar Mata Pelajaran
                    </Link>
                    <Link href={route('mata-pelajaran.edit', mataPelajaran.id_mapel)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition">
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Edit Mata Pelajaran
                    </Link>
                </div>

                {/* Kartu Statistik Detail */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={<AcademicCapIcon className="h-6 w-6 text-gray-600"/>} title="Jumlah Guru Pengampu" value={detailStats.jumlahGuru} />
                    <StatCard icon={<BookOpenIcon className="h-6 w-6 text-gray-600"/>} title="Diajarkan di Kelas" value={detailStats.jumlahKelas} />
                    <StatCard icon={<UserGroupIcon className="h-6 w-6 text-gray-600"/>} title="Total Siswa Mengambil" value={detailStats.totalSiswa} />
                </div>

                {/* Detail Informasi & Jadwal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kolom Informasi */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Informasi Mata Pelajaran</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kode</span>
                                <span className="font-semibold text-gray-800">{mataPelajaran.id_mapel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Nama Mapel</span>
                                <span className="font-semibold text-gray-800">{mataPelajaran.nama_mapel}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Kategori</span>
                                <CategoryBadge category={mataPelajaran.kategori} />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status</span>
                                <StatusBadge status={mataPelajaran.status} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">KKM</span>
                                <span className="font-semibold text-green-600">{mataPelajaran.kkm}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">JP / Minggu</span>
                                <span className="font-semibold text-gray-800">{mataPelajaran.jumlah_jp}</span>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Jadwal */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Daftar Jadwal Mengajar</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Hari', 'Jam', 'Kelas', 'Guru Pengampu'].map(head => (
                                            <th key={head} className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {mataPelajaran.jadwal_mengajar.length > 0 ? mataPelajaran.jadwal_mengajar.map(jadwal => (
                                        <tr key={jadwal.id_jadwal}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{jadwal.hari}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{jadwal.jam_mulai} - {jadwal.jam_selesai}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{jadwal.kelas.tingkat}-{jadwal.kelas.jurusan}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{jadwal.guru.nama_lengkap}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">Tidak ada jadwal untuk mata pelajaran ini.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
