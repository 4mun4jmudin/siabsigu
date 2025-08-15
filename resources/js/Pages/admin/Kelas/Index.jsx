
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import ToastNotification from '@/Components/ToastNotification';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { 
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    BuildingOffice2Icon,
    UsersIcon,
    AcademicCapIcon,
    UserCircleIcon,
    MagnifyingGlassIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

// Komponen untuk kartu statistik
const StatCard = ({ icon, label, value, detail }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400">{detail}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
    </div>
);

// Komponen untuk paginasi
const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

// Komponen untuk "Empty State"
const EmptyState = () => (
    <div className="text-center py-12">
        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada data kelas</h3>
        <p className="mt-1 text-sm text-gray-500">Silakan mulai dengan menambahkan data kelas baru.</p>
        <div className="mt-6">
            <Link href={route('admin.kelas.create')} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Tambah Kelas
            </Link>
        </div>
    </div>
);


export default function Index({ auth, kelasList, stats, filters }) {
    const { flash, errors } = usePage().props;
    const { delete: destroy, processing } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        if (flash?.message) {
            setToast({ show: true, message: flash.message, type: 'success' });
        }
        if (errors?.error) {
            setToast({ show: true, message: errors.error, type: 'error' });
        }
    }, [flash, errors]);

    const debouncedSearch = useCallback(debounce((value) => {
        router.get(route('admin.kelas.index'), { search: value }, { preserveState: true, replace: true });
    }, 300), []);

    useEffect(() => {
        debouncedSearch(search);
        return () => debouncedSearch.cancel();
    }, [search, debouncedSearch]);

    const confirmDeletion = (e, item) => {
        e.preventDefault();
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        setItemToDelete(null);
    };
    
    const deleteItem = (e) => {
        e.preventDefault();
        destroy(route('kelas.destroy', itemToDelete.id_kelas), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => closeModal(),
        });
    };

    return (
        <AdminLayout user={auth.user} header="Data Kelas">
            <Head title="Data Kelas" />
            <ToastNotification 
                show={toast.show} 
                message={toast.message} 
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })} 
            />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Data Kelas</h2>
                        <p className="text-sm text-gray-500">Kelola data kelas dan wali kelas.</p>
                    </div>
                    <Link href={route('admin.kelas.create')} className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 active:bg-blue-600 transition">
                        + Tambah Kelas
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<BuildingOffice2Icon className="h-6 w-6 text-gray-500"/>} label="Total Kelas" value={stats.total} detail="Kelas terdaftar" />
                    <StatCard icon={<UsersIcon className="h-6 w-6 text-green-500"/>} label="Kelas Aktif" value={stats.aktif} detail="Sedang berjalan" />
                    <StatCard icon={<AcademicCapIcon className="h-6 w-6 text-blue-500"/>} label="Total Siswa" value={stats.totalSiswa} detail="Siswa aktif" />
                    <StatCard icon={<UserCircleIcon className="h-6 w-6 text-purple-500"/>} label="Dengan Wali" value={stats.denganWali} detail="Memiliki wali kelas" />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800">Pencarian Kelas</h3>
                    <div className="mt-2 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama kelas atau wali kelas..."
                            className="block w-full sm:w-1/2 pl-10 pr-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800">Daftar Kelas</h3>
                        <p className="text-sm text-gray-500 mt-1">Total {kelasList.total} kelas ditemukan</p>
                        
                        {kelasList.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Kelas</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Kelas</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali Kelas</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Siswa</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {kelasList.data.map((kelas) => (
                                                <tr key={kelas.id_kelas} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kelas.id_kelas}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {kelas.tingkat} {kelas.jurusan}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kelas.wali_kelas?.nama_lengkap || <span className="text-red-500">Belum diatur</span>}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kelas.siswa_count} Siswa</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-x-3">
                                                            {/* --- PERBAIKAN ADA DI BARIS INI --- */}
                                                            <Link href={route('admin.kelas.show', kelas.id_kelas)} className="text-gray-400 hover:text-gray-600 transition" title="Lihat Detail"><EyeIcon className="h-5 w-5"/></Link>
                                                            <Link href={route('admin.kelas.edit', kelas.id_kelas)} className="text-gray-400 hover:text-indigo-600 transition" title="Edit Data"><PencilSquareIcon className="h-5 w-5"/></Link>
                                                            <button onClick={(e) => confirmDeletion(e, kelas)} className="text-gray-400 hover:text-red-600 transition" title="Hapus Data"><TrashIcon className="h-5 w-5"/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={kelasList.links} />
                            </>
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </div>
            
            <Modal show={confirmingDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Apakah Anda yakin?</h2>
                    <p className="mt-1 text-sm text-gray-600">Data Kelas: <strong>{itemToDelete?.tingkat} {itemToDelete?.jurusan}</strong> akan dihapus.</p>
                    <div className="mt-6 flex justify-end">
                        <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                        <button onClick={deleteItem} type="button" disabled={processing} className="ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
