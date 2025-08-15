import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon, UserCircleIcon, UsersIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

// Komponen Paginasi (diasumsikan sudah ada atau dicopy dari file lain)
const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

// Komponen untuk Tombol Tab
const TabButton = ({ icon, active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            active 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
        {icon}
        {children}
    </button>
);

// Komponen untuk konten tab "Daftar Siswa"
const DaftarSiswaTab = ({ siswas }) => (
    <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {siswas.data.map((siswa) => (
                    <tr key={siswa.id_siswa} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.nis}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{siswa.nama_lengkap}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${siswa.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{siswa.status}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <Pagination links={siswas.links} />
    </div>
);

// Komponen untuk konten tab "Jadwal Pelajaran"
const JadwalPelajaranTab = ({ jadwal }) => (
    <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hari</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru Pengajar</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {jadwal.map((item) => (
                    <tr key={item.id_jadwal} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.hari}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.mata_pelajaran.nama_mapel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.guru.nama_lengkap}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default function Show({ auth, kelas, siswasInKelas, jadwalPelajaran }) {
    const [activeTab, setActiveTab] = useState('siswa');

    return (
        <AdminLayout user={auth.user} header={`Detail Kelas: ${kelas.tingkat} ${kelas.jurusan}`}>
            <Head title={`Detail Kelas ${kelas.tingkat} ${kelas.jurusan}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Detail Kelas</h2>
                                <p className="text-sm text-gray-500 mt-1">Informasi lengkap mengenai kelas, wali kelas, dan daftar siswa.</p>
                            </div>
                            <div className="flex items-center gap-x-2 flex-shrink-0">
                                 <Link href={route('admin.kelas.index')} className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                                    <ArrowLeftIcon className="-ml-0.5 h-5 w-5" />
                                    Kembali
                                </Link>
                                <Link href={route('admin.kelas.edit', kelas.id_kelas)} className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                                    <PencilIcon className="-ml-0.5 h-5 w-5" />
                                    Edit
                                </Link>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-blue-600">Nama Kelas</dt>
                                <dd className="mt-1 text-xl font-semibold text-blue-900">{kelas.tingkat} {kelas.jurusan}</dd>
                            </div>
                             <div className="bg-indigo-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-indigo-600 flex items-center"><UserCircleIcon className="h-5 w-5 mr-2"/>Wali Kelas</dt>
                                <dd className="mt-1 text-xl font-semibold text-indigo-900">{kelas.wali_kelas?.nama_lengkap || 'Belum Diatur'}</dd>
                            </div>
                             <div className="bg-green-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-green-600 flex items-center"><UsersIcon className="h-5 w-5 mr-2"/>Jumlah Siswa</dt>
                                <dd className="mt-1 text-xl font-semibold text-green-900">{siswasInKelas.total} Siswa</dd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                <TabButton icon={<UsersIcon className="h-5 w-5" />} active={activeTab === 'siswa'} onClick={() => setActiveTab('siswa')}>Daftar Siswa</TabButton>
                                <TabButton icon={<CalendarDaysIcon className="h-5 w-5" />} active={activeTab === 'jadwal'} onClick={() => setActiveTab('jadwal')}>Jadwal Pelajaran</TabButton>
                            </nav>
                        </div>
                        
                        {activeTab === 'siswa' && <DaftarSiswaTab siswas={siswasInKelas} />}
                        {activeTab === 'jadwal' && <JadwalPelajaranTab jadwal={jadwalPelajaran} />}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
