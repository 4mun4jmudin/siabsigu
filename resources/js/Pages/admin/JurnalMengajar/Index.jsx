import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { debounce } from 'lodash';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/solid';

// const namaMapel = jurnal.jadwal_mengajar?.mapel?.nama_mapel || jurnal.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-';


const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4 border-l-4" style={{ borderColor: color }}>
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}1A` }}>
            {React.cloneElement(icon, { className: "h-6 w-6", style: { color } })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center flex-wrap gap-2">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

export default function Index({ auth, jurnals, stats, filters, guruOptions, kelasOptions }) {
    const { flash } = usePage().props;
    const { delete: destroy } = useForm();

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        setItemToDelete(null);
    };
    
    const deleteItem = (e) => {
        e.preventDefault();
        destroy(route('admin.jurnal-mengajar.destroy', itemToDelete.id_jurnal), {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    };

    const debouncedFilter = useCallback(debounce((newFilters) => {
        router.get(route('admin.jurnal-mengajar.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    }, 300), []);

    useEffect(() => {
        debouncedFilter(localFilters);
    }, [localFilters]);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const statusBadgeStyle = {
        'Mengajar': 'bg-green-100 text-green-800',
        'Tugas': 'bg-blue-100 text-blue-800',
        'Digantikan': 'bg-yellow-100 text-yellow-800',
        'Kosong': 'bg-red-100 text-red-800',
    };

    const displayDate = (date) => {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <AdminLayout user={auth.user} header="Jurnal Mengajar">
            <Head title="Jurnal Mengajar" />
            <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Jurnal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Jurnal" value={stats.total_jurnal} icon={<ClipboardDocumentIcon />} color="#6b7280" />
                        <StatCard label="Mengajar" value={stats.mengajar} icon={<ClipboardDocumentCheckIcon />} color="#22c55e" />
                        <StatCard label="Digantikan" value={stats.digantikan} icon={<UsersIcon />} color="#f97316" />
                        <StatCard label="Kosong" value={stats.kosong} icon={<TrashIcon />} color="#ef4444" />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">Daftar Jurnal Mengajar</h3>
                        <div className="flex flex-wrap gap-2">
                             <Link href={route('admin.jurnal-mengajar.create')} className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 transition">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Tambah Jurnal
                            </Link>
                        </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <InputLabel htmlFor="tanggal_mulai" value="Tanggal Mulai" />
                            <TextInput type="date" id="tanggal_mulai" value={localFilters.tanggal_mulai || ''} onChange={(e) => handleFilterChange('tanggal_mulai', e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div className="md:col-span-1">
                            <InputLabel htmlFor="tanggal_selesai" value="Tanggal Selesai" />
                            <TextInput type="date" id="tanggal_selesai" value={localFilters.tanggal_selesai || ''} onChange={(e) => handleFilterChange('tanggal_selesai', e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div className="md:col-span-1 relative">
                            <InputLabel htmlFor="search" value="Cari Jurnal" />
                            <div className="relative mt-1">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <TextInput
                                    id="search"
                                    type="text"
                                    value={localFilters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Cari guru, kelas, atau materi..."
                                    className="block w-full pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto mt-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru Pengajar</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru Pengganti</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                                {jurnals.data.length > 0 ? (
                                    jurnals.data.map(jurnal => (
                                        <tr key={jurnal.id_jurnal}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{displayDate(jurnal.tanggal)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jadwal_mengajar?.kelas
                                                    ? `${jurnal.jadwal_mengajar.kelas.tingkat} ${jurnal.jadwal_mengajar.kelas.jurusan}`
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {/* PERBAIKAN: Mengakses relasi mataPelajaran dengan benar */}
                                                {jurnal.jadwal_mengajar?.mapel?.nama_mapel || jurnal.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-'}                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jadwal_mengajar?.guru?.nama_lengkap || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jam_masuk_kelas?.slice(0, 5) || '-'} - {jurnal.jam_keluar_kelas?.slice(0, 5) || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadgeStyle[jurnal.status_mengajar]}`}>
                                                    {jurnal.status_mengajar}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.guru_pengganti?.nama_lengkap || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                                {jurnal.materi_pembahasan || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                <Link href={route('admin.jurnal-mengajar.edit', jurnal.id_jurnal)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <PencilSquareIcon className="h-5 w-5 inline-block" />
                                                </Link>
                                                <button onClick={() => openDeleteModal(jurnal)} className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="h-5 w-5 inline-block" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12 text-gray-500">Tidak ada jurnal mengajar yang ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={jurnals.links} />
                </div>
            </div>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus jurnal ini?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Jurnal mengajar untuk mata pelajaran **{itemToDelete?.jadwal_mengajar?.mapel?.nama_mapel}** pada tanggal **{itemToDelete?.tanggal}** akan dihapus secara permanen.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeDeleteModal}>Batal</SecondaryButton>
                        <DangerButton onClick={deleteItem}>Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}