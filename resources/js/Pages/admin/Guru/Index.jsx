import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
    PlusIcon, PencilIcon, TrashIcon, EyeIcon, 
    UserGroupIcon, FingerPrintIcon, KeyIcon, IdentificationIcon 
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

// Komponen Statistik Sederhana
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-100">
        <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} text-white`}>
            {icon}
        </div>
    </div>
);

export default function Index({ auth, gurus, stats, filters }) {
    const { flash } = usePage().props;
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [guruToDelete, setGuruToDelete] = useState(null);

    // Modal Delete Handlers
    const openDeleteModal = (guru) => { setGuruToDelete(guru); setConfirmingDeletion(true); };
    const closeDeleteModal = () => { setConfirmingDeletion(false); setGuruToDelete(null); };
    const handleDelete = () => {
        if (guruToDelete) {
            router.delete(route('admin.guru.destroy', guruToDelete.id_guru), {
                onSuccess: () => closeDeleteModal(),
                preserveScroll: true
            });
        }
    };

    // Search Handler
    const handleSearch = debounce((e) => {
        router.get(route('admin.guru.index'), { search: e.target.value }, {
            preserveState: true, replace: true
        });
    }, 300);

    return (
        <AdminLayout user={auth.user} header="Data Guru">
            <Head title="Data Guru" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manajemen Guru</h1>
                        <p className="text-sm text-gray-500">Kelola data profil dan akun guru sekolah.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.guru.reset-password')}>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition">
                                <KeyIcon className="h-4 w-4" /> Reset Password
                            </button>
                        </Link>
                        <Link href={route('admin.guru.create')}>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition">
                                <PlusIcon className="h-4 w-4" /> Tambah Guru
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Total Guru" value={stats.total} icon={<UserGroupIcon className="h-5 w-5"/>} color="bg-blue-500" />
                    <StatCard title="Guru Aktif" value={stats.aktif} icon={<IdentificationIcon className="h-5 w-5"/>} color="bg-green-500" />
                    <StatCard title="Wali Kelas" value={stats.waliKelas} icon={<UserGroupIcon className="h-5 w-5"/>} color="bg-purple-500" />
                    <StatCard title="Sidik Jari" value={stats.sidikJari} icon={<FingerPrintIcon className="h-5 w-5"/>} color="bg-orange-500" />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Daftar Guru</h3>
                        <div className="relative w-64">
                            <input 
                                type="text" 
                                placeholder="Cari Nama / NIP..." 
                                defaultValue={filters.search}
                                onChange={handleSearch}
                                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identitas</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akun Login</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas Wali</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {gurus.data.length > 0 ? (
                                    gurus.data.map((guru) => (
                                        <tr key={guru.id_guru} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {guru.foto_profil ? (
                                                            <img className="h-10 w-10 rounded-full object-cover" src={`/storage-public/${guru.foto_profil}`} alt="" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                                {guru.nama_lengkap.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{guru.nama_lengkap}</div>
                                                        <div className="text-xs text-gray-500">NIP: {guru.nip || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${guru.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {guru.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {guru.pengguna ? (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-mono bg-gray-100 px-1 rounded">{guru.pengguna.username}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-red-500 italic">Belum ada akun</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('admin.guru.show', guru.id_guru)} className="text-gray-400 hover:text-blue-600"><EyeIcon className="h-5 w-5" /></Link>
                                                    <Link href={route('admin.guru.edit', guru.id_guru)} className="text-gray-400 hover:text-orange-600"><PencilIcon className="h-5 w-5" /></Link>
                                                    <button onClick={() => openDeleteModal(guru)} className="text-gray-400 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            Tidak ada data guru ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Delete */}
            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Konfirmasi Hapus</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Anda yakin ingin menghapus guru <strong>{guruToDelete?.nama_lengkap}</strong>?
                        <br/>
                        <span className="text-red-500 font-bold">Peringatan:</span> Akun login dan data terkait juga akan dihapus permanen.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={closeDeleteModal} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Batal</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Hapus Data</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}