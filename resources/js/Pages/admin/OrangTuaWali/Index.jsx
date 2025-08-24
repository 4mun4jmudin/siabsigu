import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

// Komponen Kartu Statistik
const StatCard = ({ title, value, description, icon, color }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

// Komponen Badge Hubungan
const HubunganBadge = ({ hubungan }) => {
    const styles = {
        Ayah: 'bg-blue-100 text-blue-800',
        Ibu: 'bg-pink-100 text-pink-800',
        Wali: 'bg-purple-100 text-purple-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[hubungan]}`}>{hubungan}</span>;
};

export default function Index({ auth, waliList, stats, filters }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [waliToDelete, setWaliToDelete] = useState(null);

    const openDeleteModal = (wali) => {
        setWaliToDelete(wali);
        setConfirmingDeletion(true);
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        setWaliToDelete(null);
    };

    const deleteWali = (e) => {
        e.preventDefault();
        if (waliToDelete) {
            router.delete(route('admin.orang-tua-wali.destroy', waliToDelete.id_wali), {
                onSuccess: () => closeDeleteModal(),
                preserveScroll: true,
            });
        }
    };
    
    const handleSearch = debounce((e) => {
        router.get(route('admin.orang-tua-wali.index'), { ...filters, search: e.target.value }, {
            preserveState: true,
            replace: true,
        });
    }, 300);

    const handleFilterHubungan = (e) => {
        router.get(route('admin.orang-tua-wali.index'), { ...filters, hubungan: e.target.value }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout user={auth.user} header="Orang Tua / Wali">
            <Head title="Orang Tua / Wali" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Data Orang Tua/Wali</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola data orang tua dan wali siswa</p>
                    </div>
                    <Link href={route('admin.orang-tua-wali.create')}>
                        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Tambah Orang Tua/Wali
                        </button>
                    </Link>
                </div>

                {/* Kartu Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Orang Tua/Wali" value={stats.total} description="Data terdaftar" icon={<UserGroupIcon className="h-6 w-6 text-gray-600"/>} color="bg-gray-100" />
                    <StatCard title="Ayah" value={stats.ayah} description="Data ayah" icon={<div className="h-6 w-6 rounded-full bg-blue-500" />} color="bg-transparent p-0" />
                    <StatCard title="Ibu" value={stats.ibu} description="Data ibu" icon={<HeartIcon className="h-6 w-6 text-pink-500"/>} color="bg-pink-100" />
                    <StatCard title="Wali" value={stats.wali} description="Data wali" icon={<div className="h-6 w-6 rounded-full bg-purple-500" />} color="bg-transparent p-0" />
                </div>

                {/* Filter dan Pencarian */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Filter dan Pencarian</h3>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            defaultValue={filters.search}
                            onChange={handleSearch}
                            placeholder="Cari nama orang tua/wali atau siswa..."
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                        />
                        <select
                            value={filters.hubungan || ''}
                            onChange={handleFilterHubungan}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        >
                            <option value="">Semua Hubungan</option>
                            <option value="Ayah">Ayah</option>
                            <option value="Ibu">Ibu</option>
                            <option value="Wali">Wali</option>
                        </select>
                    </div>
                </div>

                {/* Daftar Orang Tua/Wali */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Orang Tua/Wali</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Siswa', 'Hubungan', 'Nama Orang Tua/Wali', 'Pendidikan', 'Pekerjaan', 'Penghasilan', 'Kontak', 'Aksi'].map(head => (
                                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {waliList.data.map(wali => (
                                    <tr key={wali.id_wali} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{wali.siswa?.nama_lengkap || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{wali.siswa?.nis || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><HubunganBadge hubungan={wali.hubungan} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{wali.nama_lengkap}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{wali.pendidikan_terakhir || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{wali.pekerjaan || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{wali.penghasilan_bulanan || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{wali.no_telepon_wa}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex items-center">
                                            <Link href={route('admin.orang-tua-wali.show', wali.id_wali)} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" title="Lihat Detail"><EyeIcon className="h-5 w-5"/></Link>
                                            <Link href={route('admin.orang-tua-wali.edit', wali.id_wali)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-gray-100" title="Edit"><PencilIcon className="h-5 w-5"/></Link>
                                            <button onClick={() => openDeleteModal(wali)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-gray-100" title="Hapus"><TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <form onSubmit={deleteWali} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus data ini?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Data untuk wali "{waliToDelete?.nama_lengkap}" dan akun login terkait akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
                    </p>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeDeleteModal}>Batal</SecondaryButton>
                        <DangerButton className="ml-3">Hapus Data</DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
