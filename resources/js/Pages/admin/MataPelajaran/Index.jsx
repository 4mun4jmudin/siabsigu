import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PlusIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { debounce } from 'lodash';

// Komponen Kartu Statistik
const StatCard = ({ icon, title, value, description, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-start space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
    </div>
);

// Komponen Badge Kategori
const CategoryBadge = ({ category }) => {
    const style = {
        'Wajib': 'bg-blue-100 text-blue-800',
        'Peminatan': 'bg-green-100 text-green-800',
        'Muatan Lokal': 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style[category] || 'bg-gray-100 text-gray-800'}`}>{category}</span>;
};

// Komponen Badge Status
const StatusBadge = ({ status }) => {
    const style = {
        'Aktif': 'bg-green-100 text-green-800',
        'Tidak Aktif': 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style[status]}`}>{status}</span>;
};

export default function Index({ auth, stats, mataPelajaran, guruPengampuList, filters }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [mapelToDelete, setMapelToDelete] = useState(null);

    const openDeleteModal = (mapel) => {
        setMapelToDelete(mapel);
        setConfirmingDeletion(true);
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        setMapelToDelete(null);
    };

    const deleteMapel = (e) => {
        e.preventDefault();
        if (mapelToDelete) {
            router.delete(route('mata-pelajaran.destroy', mapelToDelete.id_mapel), {
                onSuccess: () => closeDeleteModal(),
                preserveScroll: true,
            });
        }
    };

    const handleSearch = debounce((e) => {
        router.get(route('admin.mata-pelajaran.index'), { search: e.target.value }, {
            preserveState: true,
            replace: true,
        });
    }, 300);

    return (
        <AdminLayout user={auth.user} header="Mata Pelajaran">
            <Head title="Mata Pelajaran" />

            <div className="space-y-8">
                {/* Header dan Tombol Tambah */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Mata Pelajaran</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola mata pelajaran dan kurikulum sekolah</p>
                    </div>
                    <Link href={route('admin.mata-pelajaran.create')}>
                        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Tambah Mata Pelajaran
                        </button>
                    </Link>
                </div>

                {/* Kartu Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<BookOpenIcon className="h-6 w-6 text-blue-600"/>} title="Total Mata Pelajaran" value={stats.totalMapel} description="Mata pelajaran aktif" color="bg-blue-100" />
                    <StatCard icon={<ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600"/>} title="Mata Pelajaran Wajib" value={stats.mapelWajib} description="Dari total mata pelajaran" color="bg-indigo-100" />
                    <StatCard icon={<AcademicCapIcon className="h-6 w-6 text-teal-600"/>} title="Mata Pelajaran Peminatan" value={stats.mapelPeminatan} description="Sesuai jurusan" color="bg-teal-100" />
                    <StatCard icon={<UserGroupIcon className="h-6 w-6 text-orange-600"/>} title="Total Siswa Terdaftar" value={stats.totalSiswa} description="Di seluruh jenjang" color="bg-orange-100" />
                </div>

                {/* Daftar Mata Pelajaran */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Daftar Mata Pelajaran</h2>
                            <p className="text-sm text-gray-500 mt-1">Kelola semua mata pelajaran yang tersedia di sekolah</p>
                        </div>
                        <input
                            type="text"
                            defaultValue={filters.search}
                            onChange={handleSearch}
                            placeholder="Cari mapel atau kode..."
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full md:w-1/3"
                        />
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Kode', 'Nama Mata Pelajaran', 'Kategori', 'Status', 'JP/Minggu', 'KKM', 'Aksi'].map(head => (
                                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mataPelajaran.data.length > 0 ? mataPelajaran.data.map(mapel => (
                                    <tr key={mapel.id_mapel} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{mapel.id_mapel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            {mapel.nama_mapel}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><CategoryBadge category={mapel.kategori} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={mapel.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{mapel.jumlah_jp}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-center">{mapel.kkm}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex items-center">
                                            <Link href={route('admin.mata-pelajaran.show', mapel.id_mapel)} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" title="Lihat Detail">
                                                <EyeIcon className="h-5 w-5"/>
                                            </Link>
                                            <Link href={route('admin.mata-pelajaran.edit', mapel.id_mapel)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-gray-100" title="Edit">
                                                <PencilIcon className="h-5 w-5"/>
                                            </Link>
                                            <button onClick={() => openDeleteModal(mapel)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-gray-100" title="Hapus">
                                                <TrashIcon className="h-5 w-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">Tidak ada data mata pelajaran.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Distribusi dan Guru Pengampu */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
                         <h2 className="text-xl font-bold text-gray-800 mb-4">Distribusi Mata Pelajaran</h2>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-blue-800">Mata Pelajaran Wajib</p>
                                    <p className="text-xs text-blue-600">Semua jurusan harus mengambil</p>
                                </div>
                                <p className="text-lg font-bold text-blue-800">{stats.mapelWajib}</p>
                            </div>
                             <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-green-800">Mata Pelajaran Peminatan</p>
                                    <p className="text-xs text-green-600">Sesuai dengan jurusan masing-masing</p>
                                </div>
                                <p className="text-lg font-bold text-green-800">{stats.mapelPeminatan}</p>
                            </div>
                         </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Guru Pengampu</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {guruPengampuList.map(guru => (
                                <div key={guru.id_guru} className="flex justify-between items-center p-3 border rounded-lg">
                                    <p className="font-medium text-gray-700">{guru.nama_lengkap}</p>
                                    <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-md">{guru.jumlah_mapel} mapel</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <form onSubmit={deleteMapel} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus mata pelajaran ini?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Data mata pelajaran "{mapelToDelete?.nama_mapel}" akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.
                    </p>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeDeleteModal}>Batal</SecondaryButton>
                        <DangerButton className="ml-3">Hapus Mata Pelajaran</DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
