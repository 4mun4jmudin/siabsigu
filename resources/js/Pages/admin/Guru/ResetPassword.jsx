import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

export default function ResetPassword({ auth, gurus, filters }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm();
    
    const [search, setSearch] = useState(filters.search || '');
    const [toast, setToast] = useState({ show: false, message: '' });
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [guruToReset, setGuruToReset] = useState(null);

    // Toast Effect
    useEffect(() => {
        if (flash?.message || flash?.success || flash?.error) {
            setToast({ show: true, message: flash.message || flash.success || flash.error });
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const debouncedSearch = useCallback(debounce((val) => {
        router.get(route('admin.guru.reset-password'), { search: val }, { preserveState: true, replace: true });
    }, 300), []);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleReset = () => {
        if (guruToReset) {
            post(route('admin.guru.reset-password.store', guruToReset.id_guru), {
                onSuccess: () => { setConfirmingReset(false); setGuruToReset(null); }
            });
        }
    };

    return (
        <AdminLayout user={auth.user} header="Reset Password Guru">
            <Head title="Reset Password Guru" />
            
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded shadow-lg transition-opacity duration-500">
                    {toast.message}
                </div>
            )}

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href={route('admin.guru.index')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition">
                                <ArrowLeftIcon className="h-4 w-4" /> Kembali
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Reset Password Guru</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Cari guru dan reset password mereka ke default (<code>alhawari#cibiuk</code>).
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={handleSearch} 
                            placeholder="Cari Nama Guru atau NIP..." 
                            className="pl-10 w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Guru</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akun Saat Ini</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {gurus.data.length > 0 ? (
                                    gurus.data.map(guru => (
                                        <tr key={guru.id_guru} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{guru.nama_lengkap}</div>
                                                <div className="text-xs text-gray-500">{guru.nip ? `NIP: ${guru.nip}` : 'NIP: -'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {guru.pengguna ? (
                                                    <div className="text-sm text-gray-600 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded border border-gray-200">
                                                        {guru.pengguna.username}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-red-500 italic">Belum ada akun</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => { setGuruToReset(guru); setConfirmingReset(true); }} 
                                                    className="text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1 ml-auto transition shadow-sm"
                                                >
                                                    <ArrowPathIcon className="h-3 w-3" /> Reset
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-gray-500">
                                            Data guru tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={confirmingReset} onClose={() => setConfirmingReset(false)}>
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium text-center text-gray-900">Reset Akun Guru</h3>
                    <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                        <p className="font-semibold mb-2">Akun milik: {guruToReset?.nama_lengkap}</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Username baru: <strong>guru#[nama_depan_kecil]</strong></li>
                            <li>Password baru: <strong>alhawari#cibiuk</strong></li>
                        </ul>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button 
                            onClick={() => setConfirmingReset(false)} 
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleReset} 
                            disabled={processing} 
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition shadow-sm"
                        >
                            {processing ? 'Memproses...' : 'Ya, Reset Akun'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}