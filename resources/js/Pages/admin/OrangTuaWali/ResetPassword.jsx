import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { 
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

const EmptyState = () => (
    <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <MagnifyingGlassIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Data tidak ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
    </div>
);

export default function ResetPassword({ auth, walis, filters }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm();
    
    const [search, setSearch] = useState(filters.search || '');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [waliToReset, setWaliToReset] = useState(null);

    // Handle Toast
    useEffect(() => {
        if (flash?.message || flash?.success || flash?.error) {
            setToast({ 
                show: true, 
                message: flash.message || flash.success || flash.error,
                type: flash.error ? 'error' : 'success'
            });
            const timer = setTimeout(() => { setToast({ ...toast, show: false }); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Debounce Search
    // Menggunakan useCallback agar fungsi debounce tidak dibuat ulang setiap render
    const debouncedSearch = useCallback(
        debounce((searchVal) => {
            router.get(route('admin.orang-tua-wali.reset-password'), { search: searchVal }, {
                preserveState: true, replace: true, preserveScroll: true
            });
        }, 300), []
    );

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const openResetModal = (wali) => {
        setWaliToReset(wali);
        setConfirmingReset(true);
    };

    const closeResetModal = () => {
        setConfirmingReset(false);
        setWaliToReset(null);
    };

    const handleReset = () => {
        if (!waliToReset) return;
        post(route('admin.orang-tua-wali.reset-password.store', waliToReset.id_wali), {
            preserveScroll: true,
            onSuccess: () => closeResetModal(),
            onError: () => {
                closeResetModal();
                setToast({ show: true, message: 'Gagal mereset password.', type: 'error' });
            }
        });
    };

    return (
        <AdminLayout user={auth.user} header="Reset Password Orang Tua">
            <Head title="Reset Password Orang Tua" />
            
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} transition-opacity duration-300 flex items-center`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast({ ...toast, show: false })} className="ml-3 font-bold">×</button>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.orang-tua-wali.index')} className="text-gray-500 hover:text-gray-700 transition">
                                <ArrowLeftIcon className="h-5 w-5" />
                            </Link>
                            <h2 className="text-2xl font-bold text-gray-800">Reset Password Orang Tua</h2>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                            Password akan direset menjadi <strong>alhawari#cibiuk</strong> dan Username menjadi <strong>NIK</strong>.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={search} 
                            onChange={handleSearchChange}
                            placeholder="Cari Nama Wali, NIK, atau Nama Siswa..." 
                            className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                    <div className="p-6 text-gray-900">
                        {walis && walis.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identitas Wali</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa Perwalian</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK (Username Baru)</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {walis.data.map((wali) => (
                                                <tr key={wali.id_wali} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                                                                {wali.nama_lengkap.charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{wali.nama_lengkap}</div>
                                                                <div className="text-xs text-gray-500">{wali.hubungan}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {wali.siswa ? (
                                                            <div className="flex items-center text-sm text-gray-700">
                                                                <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                                                                {wali.siswa.nama_lengkap}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-red-500 italic">Tidak ada siswa</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {wali.nik ? (
                                                            <span className="font-mono text-sm text-gray-600">{wali.nik}</span>
                                                        ) : (
                                                            <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">NIK Kosong!</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {wali.id_pengguna && wali.nik ? (
                                                            <button 
                                                                onClick={() => openResetModal(wali)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                                                            >
                                                                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                                                                Reset Password
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic bg-gray-50 px-2 py-1 rounded">
                                                                {!wali.nik ? 'Lengkapi NIK' : 'Belum Ada Akun'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={walis.links} />
                            </>
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi */}
            <Modal show={confirmingReset} onClose={closeResetModal}>
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full">
                        <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Konfirmasi Reset Password
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Anda akan mereset akun untuk wali: <br/>
                                <strong className="text-lg text-gray-800">{waliToReset?.nama_lengkap}</strong>
                            </p>
                            
                            <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-left border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-bold mb-2 uppercase tracking-wide">Detail Perubahan:</p>
                                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-2">
                                    <li>
                                        Username akan diubah menjadi NIK: <br/>
                                        <span className="font-mono bg-yellow-100 px-1 rounded font-bold">{waliToReset?.nik}</span>
                                    </li>
                                    <li>
                                        Password akan diubah menjadi default: <br/>
                                        <span className="font-mono bg-yellow-100 px-1 rounded font-bold">alhawari#cibiuk</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            onClick={handleReset}
                            disabled={processing}
                        >
                            {processing ? 'Memproses...' : 'Ya, Reset Akun'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            onClick={closeResetModal}
                            disabled={processing}
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}