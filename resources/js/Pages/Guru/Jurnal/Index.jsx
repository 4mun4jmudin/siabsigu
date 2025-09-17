// File: resources/js/Pages/Guru/Jurnal/Index.jsx

import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';

const StatusBadge = ({ status }) => {
    const styles = {
        Mengajar: 'bg-green-100 text-green-800',
        Tugas: 'bg-blue-100 text-blue-800',
        Digantikan: 'bg-yellow-100 text-yellow-800',
        Kosong: 'bg-red-100 text-red-800',
    };
    const cls = styles[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{status || '-'}</span>;
};

const Pagination = ({ links }) => (
    links.length > 3 && (
        <div className="mt-4 flex justify-center">
            {links.map((link, key) => (
                link.url === null ?
                    (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                    (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
            ))}
        </div>
    )
);

export default function Index({ auth, jurnals, filters }) {
    const { delete: destroy, processing } = useForm();
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const confirmDeletion = (jurnal) => {
        setItemToDelete(jurnal);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        setItemToDelete(null);
    };

    const deleteJurnal = (e) => {
        e.preventDefault();
        destroy(route('guru.jurnal.destroy', itemToDelete.id_jurnal), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    return (
        <GuruLayout user={auth.user} header="Jurnal Mengajar">
            <Head title="Jurnal Mengajar" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    {/* <div>
                        <h1 className="text-2xl font-bold text-gray-800">Jurnal Mengajar Saya</h1>
                        <p className="text-sm text-gray-500 mt-1">Catatan aktivitas mengajar Anda.</p>
                    </div> */}
                    <Link href={route('guru.jurnal.create')}>
                        <PrimaryButton className="flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Input Jurnal Baru
                        </PrimaryButton>
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Tanggal', 'Jam', 'Kelas', 'Mata Pelajaran', 'Status', 'Materi', 'Aksi'].map(head => (
                                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jurnals.data.map(jurnal => (
                                    <tr key={jurnal.id_jurnal}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(jurnal.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{jurnal.jam_masuk_kelas.substring(0, 5)} - {jurnal.jam_keluar_kelas.substring(0, 5)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{jurnal.jadwal_mengajar.kelas.tingkat} {jurnal.jadwal_mengajar.kelas.jurusan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{jurnal.jadwal_mengajar.mata_pelajaran.nama_mapel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={jurnal.status_mengajar} /></td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{jurnal.materi_pembahasan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-3">
                                                <Link href={route('guru.jurnal.show', jurnal.id_jurnal)} className="text-gray-500 hover:text-gray-800" title="Lihat Detail"><Eye className="h-4 w-4" /></Link>
                                                <Link href={route('guru.jurnal.edit', jurnal.id_jurnal)} className="text-blue-600 hover:text-blue-800" title="Edit Jurnal"><Edit className="h-4 w-4" /></Link>
                                                <button onClick={() => confirmDeletion(jurnal)} className="text-red-600 hover:text-red-800" title="Hapus Jurnal"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {jurnals.data.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-gray-500">Belum ada data jurnal.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={jurnals.links} />
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal}>
                <form onSubmit={deleteJurnal} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin?
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Data jurnal untuk mata pelajaran <strong>{itemToDelete?.jadwal_mengajar.mata_pelajaran.nama_mapel}</strong> di kelas <strong>{itemToDelete?.jadwal_mengajar.kelas.tingkat}</strong> pada tanggal <strong>{itemToDelete ? new Date(itemToDelete.tanggal).toLocaleDateString('id-ID') : ''}</strong> akan dihapus permanen.
                    </p>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeModal}>Batal</SecondaryButton>
                        <DangerButton className="ml-3" disabled={processing}>
                            {processing ? 'Menghapus...' : 'Ya, Hapus Jurnal'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </GuruLayout>
    );
}