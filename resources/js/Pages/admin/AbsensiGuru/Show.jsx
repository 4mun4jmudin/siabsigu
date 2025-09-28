import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowLeftIcon,
    UserCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ClockIcon
} from '@heroicons/react/24/solid';

// Komponen Kartu Statistik untuk Halaman Detail
const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm flex items-center border-l-4" style={{ borderColor: color }}>
        <div className="flex-shrink-0 mr-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${color}1A` }}>
                {React.cloneElement(icon, { className: "h-6 w-6", style: { color } })}
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// Komponen Badge Status
const StatusBadge = ({ status }) => {
    const styles = {
        Hadir: 'bg-green-100 text-green-800',
        Sakit: 'bg-yellow-100 text-yellow-800',
        Izin: 'bg-blue-100 text-blue-800',
        Alfa: 'bg-red-100 text-red-800',
        'Dinas Luar': 'bg-purple-100 text-purple-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

// Komponen Paginasi
const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

export default function Show({ auth, guru, absensiHistory, rekapStatistik, filters }) {

    const handleFilterChange = (key, value) => {
        router.get(
            route('admin.absensi-guru.show', guru.id_guru),
            { ...filters, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    const bulanTahunText = new Date(filters.tahun, filters.bulan - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <AdminLayout user={auth.user} header={`Detail Absensi ${guru.nama_lengkap}`}>
            <Head title={`Detail Absensi ${guru.nama_lengkap}`} />

            <div className="space-y-6">
                {/* Header Halaman */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <Link href={route('admin.absensi-guru.index')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2">
                            <ArrowLeftIcon className="h-4 w-4" />
                            Kembali ke Daftar Absensi
                        </Link>
                        <div className="flex items-center gap-4">
                            <UserCircleIcon className="h-16 w-16 text-gray-300" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{guru.nama_lengkap}</h1>
                                <p className="text-sm text-gray-500">NIP: {guru.nip || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rekapitulasi Statistik Bulanan */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-1">Rekapitulasi Kehadiran</h2>
                    <p className="text-sm text-gray-500 mb-4">Menampilkan rekap untuk periode <span className="font-semibold">{bulanTahunText}</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatCard label="Total Hadir" value={rekapStatistik.hadir || 0} icon={<CheckCircleIcon />} color="#22c55e" />
                        <StatCard label="Total Sakit" value={rekapStatistik.sakit || 0} icon={<ExclamationTriangleIcon />} color="#eab308" />
                        <StatCard label="Total Izin" value={rekapStatistik.izin || 0} icon={<InformationCircleIcon />} color="#3b82f6" />
                        <StatCard label="Total Alfa" value={rekapStatistik.alfa || 0} icon={<XCircleIcon />} color="#ef4444" />
                        <StatCard label="Rata-rata Telat" value={`${Math.round(rekapStatistik.rata_rata_telat || 0)} min`} icon={<ClockIcon />} color="#8b5cf6" />
                    </div>
                </div>

                {/* Tabel Riwayat Absensi */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Riwayat Absensi Bulanan</h2>
                        <div className="flex items-center gap-4">
                            <select onChange={(e) => handleFilterChange('bulan', e.target.value)} value={filters.bulan} className="border-gray-300 rounded-md shadow-sm">
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                            </select>
                            <select onChange={(e) => handleFilterChange('tahun', e.target.value)} value={filters.tahun} className="border-gray-300 rounded-md shadow-sm">
                                {Array.from({ length: 5 }, (_, i) => <option key={i}>{new Date().getFullYear() - i}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Tanggal', 'Status', 'Jam Masuk', 'Jam Pulang', 'Keterlambatan', 'Keterangan'].map(head => (
                                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {absensiHistory.data.length > 0 ? absensiHistory.data.map(absen => (
                                    <tr key={absen.id_absensi} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            {new Date(absen.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={absen.status_kehadiran} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{absen.jam_masuk || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{absen.jam_pulang || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {absen.status_kehadiran === 'Hadir' ? (
                                                (absen.menit_keterlambatan ?? 0) > 0 ? (
                                                    <span className="text-red-600 font-semibold">
                                                        {absen.menit_keterlambatan} menit
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600">Tepat Waktu</span>
                                                )
                                            ) : (
                                                '-' // <-- bukan 'Hadir'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{absen.keterangan || '-'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-gray-500">
                                            Tidak ada data absensi untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {absensiHistory.data.length > 0 && <Pagination links={absensiHistory.links} />}
                </div>
            </div>
        </AdminLayout>
    );
}
