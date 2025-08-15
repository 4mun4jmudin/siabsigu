import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import ToastNotification from '@/Components/ToastNotification';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { 
    UserGroupIcon, 
    UserPlusIcon, 
    HomeModernIcon, 
    FingerPrintIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    QrCodeIcon,      // <-- 1. Impor Ikon Barcode
    ArrowPathIcon    // <-- 1. Impor Ikon Reset
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

// Komponen untuk link paginasi
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
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada data guru</h3>
        <p className="mt-1 text-sm text-gray-500">Silakan mulai dengan menambahkan data guru baru.</p>
        <div className="mt-6">
            <Link href={route('admin.guru.create')} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Tambah Guru
            </Link>
        </div>
    </div>
);


export default function Index({ auth, gurus, stats, filters }) {
    const { flash } = usePage().props;
    const { delete: destroy, processing: deleting } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    const [toast, setToast] = useState({ show: false, message: '' });
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // State & Form untuk Registrasi Sidik Jari
    const [fingerprintModal, setFingerprintModal] = useState({ isOpen: false, guru: null });
    const { data: fpData, setData: setFpData, post: postFingerprint, processing: registering, errors: fpErrors, reset: resetFp } = useForm({
        sidik_jari_template: '',
    });

    // --- 2. State & Form BARU untuk Reset Barcode ---
    const [barcodeModal, setBarcodeModal] = useState({ isOpen: false, guru: null });
    const { post: resetBarcode, processing: resettingBarcode } = useForm();

    useEffect(() => {
        if (flash?.success) {
            setToast({ show: true, message: flash.success });
        }
    }, [flash]);

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
        destroy(route('admin.guru.destroy', itemToDelete.id_guru), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => closeModal(),
        });
    };

    const debouncedSearch = useCallback(debounce((value) => {
        router.get(route('admin.guru.index'), { search: value }, {
            preserveState: true,
            replace: true,
        });
    }, 300), []);

    useEffect(() => {
        debouncedSearch(search);
        return () => debouncedSearch.cancel();
    }, [search, debouncedSearch]);

    // Handlers untuk Modal Sidik Jari
    const openFingerprintModal = (guru) => {
        resetFp();
        setFingerprintModal({ isOpen: true, guru: guru });
    };

    const closeFingerprintModal = () => {
        setFingerprintModal({ isOpen: false, guru: null });
    };

    const submitFingerprint = (e) => {
        e.preventDefault();
        if (!fingerprintModal.guru) return;
        postFingerprint(route('admin.guru.register-fingerprint', fingerprintModal.guru.id_guru), {
            onSuccess: () => closeFingerprintModal(),
        });
    };

    // --- 3. Handlers BARU untuk Modal Barcode ---
    const openBarcodeModal = (guru) => {
        setBarcodeModal({ isOpen: true, guru: guru });
    };

    const closeBarcodeModal = () => {
        setBarcodeModal({ isOpen: false, guru: null });
    };

    const submitBarcodeReset = (e) => {
        e.preventDefault();
        if (!barcodeModal.guru) return;
        resetBarcode(route('admin.guru.generate-barcode', barcodeModal.guru.id_guru), {
            preserveScroll: true,
            onSuccess: () => closeBarcodeModal(),
        });
    };

    return (
        <AdminLayout user={auth.user} header="Data Guru">
            <Head title="Data Guru" />
            
            <ToastNotification 
                show={toast.show} 
                message={toast.message} 
                onClose={() => setToast({ ...toast, show: false })} 
            />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Data Guru</h2>
                        <p className="text-sm text-gray-500">Kelola data guru dan informasi kepegawaian.</p>
                    </div>
                    <Link href={route('admin.guru.create')} className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 active:bg-blue-600 disabled:opacity-25 transition">
                        + Tambah Guru
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<UserGroupIcon className="h-6 w-6 text-gray-500"/>} label="Total Guru" value={stats.total} detail="Guru terdaftar" />
                    <StatCard icon={<UserPlusIcon className="h-6 w-6 text-green-500"/>} label="Guru Aktif" value={stats.aktif} detail="Sedang mengajar" />
                    <StatCard icon={<HomeModernIcon className="h-6 w-6 text-blue-500"/>} label="Wali Kelas" value={stats.waliKelas} detail="Guru wali kelas" />
                    <StatCard icon={<FingerPrintIcon className="h-6 w-6 text-purple-500"/>} label="Sidik Jari" value={stats.sidikJari} detail="Terdaftar" />
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Pencarian Guru</h3>
                                <div className="mt-2 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama guru atau NIP..." className="block w-full sm:w-1/2 pl-10 pr-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Daftar Guru</h3>
                                <p className="text-sm text-gray-500 mt-1">Total {gurus.total} guru ditemukan</p>
                            </div>
                        </div>

                        {gurus.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto mt-4">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Kelamin</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali Kelas</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {gurus.data.map((guru) => (
                                                <tr key={guru.id_guru} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.nip || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guru.nama_lengkap}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.jenis_kelamin}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {guru.kelas_wali ? (<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{`${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan || ''}`}</span>) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${guru.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{guru.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-x-3">
                                                            <Link href={route('admin.guru.show', guru.id_guru)} className="text-gray-400 hover:text-gray-600 transition" title="Lihat Detail"><EyeIcon className="h-5 w-5"/></Link>
                                                            <Link href={route('admin.guru.edit', guru.id_guru)} className="text-gray-400 hover:text-indigo-600 transition" title="Edit Data"><PencilSquareIcon className="h-5 w-5"/></Link>
                                                            <button 
                                                                onClick={() => openFingerprintModal(guru)} 
                                                                className={`transition ${guru.sidik_jari_template ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-purple-600'}`} 
                                                                title={guru.sidik_jari_template ? 'Sidik Jari Terdaftar' : 'Registrasi Sidik Jari'}
                                                            >
                                                                <FingerPrintIcon className="h-5 w-5"/>
                                                            </button>
                                                            {/* --- 4. Tombol BARU untuk Reset Barcode --- */}
                                                            <button 
                                                                onClick={() => openBarcodeModal(guru)} 
                                                                className="text-gray-400 hover:text-sky-600 transition" 
                                                                title="Buat / Reset Barcode ID"
                                                            >
                                                                <QrCodeIcon className="h-5 w-5"/>
                                                            </button>
                                                            <button onClick={(e) => confirmDeletion(e, guru)} className="text-gray-400 hover:text-red-600 transition" title="Hapus Data"><TrashIcon className="h-5 w-5"/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={gurus.links} />
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
                    <p className="mt-1 text-sm text-gray-600">Data Guru: <strong>{itemToDelete?.nama_lengkap}</strong> akan dihapus. Tindakan ini tidak dapat diurungkan.</p>
                    <div className="mt-6 flex justify-end">
                        <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                        <button onClick={deleteItem} type="button" disabled={deleting} className="ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                            {deleting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={fingerprintModal.isOpen} onClose={closeFingerprintModal}>
                <form onSubmit={submitFingerprint} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Registrasi Sidik Jari
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 mb-4">
                        Letakkan jari <span className="font-bold">{fingerprintModal.guru?.nama_lengkap}</span> pada alat pemindai. Data template akan muncul di bawah ini.
                    </p>
                    <div>
                        <InputLabel htmlFor="sidik_jari_template" value="Data Template Sidik Jari" />
                        <textarea
                            id="sidik_jari_template"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows="4"
                            value={fpData.sidik_jari_template}
                            onChange={(e) => setFpData('sidik_jari_template', e.target.value)}
                            placeholder="Data dari alat pemindai akan muncul di sini..."
                        />
                        <InputError message={fpErrors.sidik_jari_template} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeFingerprintModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={registering}>
                            {registering ? 'Menyimpan...' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* --- 5. Modal BARU untuk Konfirmasi Reset Barcode --- */}
            <Modal show={barcodeModal.isOpen} onClose={closeBarcodeModal}>
                <form onSubmit={submitBarcodeReset} className="p-6">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-sky-100 mx-auto">
                        <ArrowPathIcon className="h-6 w-6 text-sky-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Reset Barcode ID
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Anda akan membuat Barcode ID baru untuk guru: <br/>
                                <strong className="font-bold">{barcodeModal.guru?.nama_lengkap}</strong>.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                Barcode ID yang lama (jika ada) akan diganti dan tidak berlaku lagi. Lanjutkan?
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeBarcodeModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500" disabled={resettingBarcode}>
                            {resettingBarcode ? 'Memproses...' : 'Ya, Buat Barcode Baru'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
