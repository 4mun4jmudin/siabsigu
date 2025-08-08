import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, usePage, useForm } from '@inertiajs/react';

const FlashMessage = ({ message }) => {
    return (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
            <p className="font-bold">Sukses</p>
            <p>{message}</p>
        </div>
    );
};

export default function Index({ auth, tahunAjarans }) {
    const { flash } = usePage().props;
    const { delete: destroy, processing } = useForm();

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

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
        destroy(route('tahun-ajaran.destroy', itemToDelete.id_tahun_ajaran), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                // Mungkin ada error, bisa ditangani di sini
                closeModal();
            },
        });
    };

    return (
        <AdminLayout user={auth.user} header="Manajemen Tahun Ajaran">
            <Head title="Tahun Ajaran" />

            <div className="max-w-7xl mx-auto">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        {flash.message && <FlashMessage message={flash.message} />}

                        <Link 
                            href={route('tahun-ajaran.create')} 
                            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                        >
                            Tambah Tahun Ajaran
                        </Link>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Ajaran</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tahunAjarans.map((ta) => (
                                        <tr key={ta.id_tahun_ajaran}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ta.id_tahun_ajaran}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ta.tahun_ajaran}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ta.semester}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ta.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {ta.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link href={route('tahun-ajaran.edit', ta.id_tahun_ajaran)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                                <button onClick={(e) => confirmDeletion(e, ta)} className="text-red-600 hover:text-red-900">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus data ini?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Data Tahun Ajaran: <strong>{itemToDelete?.tahun_ajaran} ({itemToDelete?.semester})</strong> akan dihapus secara permanen.
                    </p>
                    <div className="mt-6 flex justify-end">
                        <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
                            Batal
                        </button>
                        <button onClick={deleteItem} type="button" disabled={processing} className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none disabled:opacity-50">
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}