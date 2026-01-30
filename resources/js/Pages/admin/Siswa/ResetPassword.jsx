import React, { useState, useEffect, useCallback, useRef } from 'react';
// Pastikan path import ini sesuai dengan struktur project Anda
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { 
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CheckBadgeIcon,
    XCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

// Komponen Pagination
const Pagination = ({ links }) => (
    <div className="mt-6 flex justify-center">
        {links.map((link, key) => (
            link.url === null ?
                (<div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
                (<Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-white' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
        ))}
    </div>
);

// Tampilan jika data kosong
const EmptyState = () => (
    <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <MagnifyingGlassIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Data tidak ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
    </div>
);

export default function ResetPassword({ auth, siswas, filters }) {
    const { flash } = usePage().props;
    // Menggunakan useForm untuk handle post request reset
    const { post, processing } = useForm();
    
    // State untuk Search
    const [search, setSearch] = useState(filters.search || '');
    
    // State untuk UI
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [studentToReset, setStudentToReset] = useState(null);

    // Handle Flash Message dari Controller
    useEffect(() => {
        if (flash?.message || flash?.success || flash?.error) {
            setToast({ 
                show: true, 
                message: flash.message || flash.success || flash.error,
                type: flash.error ? 'error' : 'success'
            });
            
            // Auto hide toast
            const timer = setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Logic Pencarian (Debounce)
    const debouncedSearch = useCallback(
        debounce((searchVal) => {
            router.get(route('admin.siswa.reset-password'), { search: searchVal }, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        }, 300),
        []
    );

    // Handle search change
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    // Modal Handlers
    const openResetModal = (siswa) => {
        setStudentToReset(siswa);
        setConfirmingReset(true);
    };

    const closeResetModal = () => {
        setConfirmingReset(false);
        setStudentToReset(null);
    };

    // Eksekusi Reset Password
    const handleReset = () => {
        if (!studentToReset) return;

        post(route('admin.siswa.reset-password.store', studentToReset.id_siswa), {
            preserveScroll: true,
            onSuccess: () => {
                closeResetModal();
                // Toast akan muncul otomatis dari useEffect flash
            },
            onError: () => {
                closeResetModal();
                setToast({ show: true, message: 'Gagal mereset password.', type: 'error' });
            }
        });
    };

    return (
        <AdminLayout user={auth.user} header="Reset Password Siswa">
            <Head title="Reset Password Siswa" />
            
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} transition-opacity duration-300 flex items-center`}>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast({ ...toast, show: false })} className="ml-3 font-bold text-white hover:text-gray-200">×</button>
                </div>
            )}

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('admin.siswa.index')} className="text-gray-500 hover:text-gray-700 transition">
                                <ArrowLeftIcon className="h-5 w-5" />
                            </Link>
                            <h2 className="text-2xl font-bold text-gray-800">Reset Password Siswa</h2>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                            Fitur ini akan mengembalikan password siswa menjadi <strong>NIS</strong> masing-masing.
                        </p>
                    </div>
                </div>

                {/* Filter/Search Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={search} 
                            onChange={handleSearchChange}
                            placeholder="Cari Nama Siswa atau NIS..." 
                            className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                    <div className="p-6 text-gray-900">
                        
                        {siswas.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identitas Siswa</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Akun</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {siswas.data.map((siswa) => (
                                                <tr key={siswa.id_siswa} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                {siswa.foto_url ? (
                                                                    <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={siswa.foto_url} alt="" />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold border border-indigo-200">
                                                                        {siswa.nama_lengkap.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{siswa.nama_lengkap}</div>
                                                                <div className="text-sm text-gray-500 font-mono">NIS: {siswa.nis}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {siswa.id_pengguna ? (
                                                            <div className="flex items-center text-green-700 text-sm font-medium bg-green-50 px-2 py-1 rounded w-fit">
                                                                <CheckBadgeIcon className="h-4 w-4 mr-1.5" />
                                                                Aktif
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded w-fit">
                                                                <XCircleIcon className="h-4 w-4 mr-1.5" />
                                                                Belum Ada Akun
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {siswa.id_pengguna ? (
                                                            <button 
                                                                onClick={() => openResetModal(siswa)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                                                            >
                                                                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                                                                Reset Password
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic bg-gray-50 px-2 py-1 rounded">Perlu buat akun dulu</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination links={siswas.links} />
                            </>
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Reset */}
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
                                Anda akan mereset password untuk siswa: <br/>
                                <strong className="text-lg text-gray-800">{studentToReset?.nama_lengkap}</strong>
                            </p>
                            
                            <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-left border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-bold mb-2 uppercase tracking-wide">Penting:</p>
                                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                                    <li>Password akan kembali menjadi <strong>NIS</strong> ({studentToReset?.nis}).</li>
                                    <li>Password lama siswa tidak akan bisa digunakan lagi.</li>
                                    <li>Beritahu siswa untuk login menggunakan NIS.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleReset}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : 'Ya, Reset Password'}
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