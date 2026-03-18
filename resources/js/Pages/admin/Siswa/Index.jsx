import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/utils/toast';
// Import path relatif sesuaikan dengan struktur project kamu
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import Checkbox from '@/Components/Checkbox';
import SkeletonTable from '@/Components/SkeletonTable';
import ImportModal from './ImportModal'; // Pastikan file ini ada di folder yang sama
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import {
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    ArrowUpOnSquareIcon,
    ArrowDownOnSquareIcon,
    UsersIcon,
    KeyIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';



// const Pagination = ({ links }) => (
//     <div className="flex flex-wrap justify-center gap-1">
//         {links.map((link, key) => (
//             link.url === null ?
//                 (<div key={key} className="px-3 py-2 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />) :
//                 (<Link key={key} className={`px-3 py-2 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'bg-white text-gray-700'}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />)
//         ))}
//     </div>
// );

const EmptyState = () => (
    <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada data siswa</h3>
        <p className="mt-1 text-sm text-gray-500">Silakan mulai dengan menambahkan data siswa baru.</p>
        <div className="mt-6">
            <Link href={route('admin.siswa.create')} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Tambah Siswa
            </Link>
        </div>
    </div>
);

export default function Index({ auth, siswas, kelasOptions, filters }) {
    const { flash } = usePage().props;
    const { delete: destroy, post, processing } = useForm();

    // State Filter & Search
    const [search, setSearch] = useState(filters.search || '');
    const [selectedKelas, setSelectedKelas] = useState(filters.kelas || '');

    // State Rows Per Page (Default 10)
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    // State UI

    const [isLoading, setIsLoading] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // State Delete Single
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // State Bulk Actions
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState(null); // 'delete', 'move_class', 'change_status'
    const [bulkValue, setBulkValue] = useState(''); // Nilai target (id_kelas atau status)

    // State Loading khusus Bulk Action
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);



    const isFirstRender = useRef(true);

    // --- SEARCH & FILTER ---
    // Update debouncedSearch untuk menyertakan perPage juga
    const debouncedSearch = useCallback(debounce((searchVal, kelasVal, perPageVal) => {
        router.get(route('admin.siswa.index'),
            { search: searchVal, kelas: kelasVal, per_page: perPageVal, page: 1 },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    }, 400), []);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Effect untuk Search dan Filter Kelas (Debounced)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Jika hanya search/kelas berubah, panggil debounce
        debouncedSearch(search, selectedKelas, perPage);
    }, [search, selectedKelas, debouncedSearch]);

    // Handle Per Page Change (Langsung reload, tidak perlu debounce)
    const handlePerPageChange = (e) => {
        const newVal = e.target.value;
        setPerPage(newVal);

        // Langsung reload tanpa debounce agar responsif
        router.get(route('admin.siswa.index'),
            { search, kelas: selectedKelas, per_page: newVal, page: 1 },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleKelasChange = (e) => {
        setSelectedKelas(e.target.value);
    };

    // --- BULK ACTION LOGIC ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = siswas.data.map(s => s.id_siswa);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const executeBulkAction = (e) => {
        e.preventDefault();

        const requestOptions = {
            preserveScroll: true,
            onStart: () => setIsBulkProcessing(true),
            onFinish: () => {
                setIsBulkProcessing(false);
                setBulkAction(null);
            },
            onSuccess: () => {
                setSelectedIds([]);
                setBulkValue('');
            },
            onError: (errors) => {
                console.error("Bulk action error:", errors);
                toast.success("Terjadi kesalahan saat memproses data.");
            }
        };

        if (bulkAction === 'delete') {
            if (confirm(`Yakin ingin menghapus ${selectedIds.length} siswa terpilih?`)) {
                router.post(route('admin.siswa.bulk-delete'), {
                    ids: selectedIds
                }, requestOptions);
            } else {
                setBulkAction(null);
            }
        } else if (bulkAction === 'move_class' || bulkAction === 'change_status') {
            if (!bulkValue) return alert('Silakan pilih target nilai.');

            router.post(route('admin.siswa.bulk-update'), {
                ids: selectedIds,
                type: bulkAction === 'move_class' ? 'kelas' : 'status',
                value: bulkValue
            }, requestOptions);
        }
    };

    // --- SINGLE DELETE LOGIC ---
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
        if (!itemToDelete) return closeModal();
        destroy(route('admin.siswa.destroy', itemToDelete.id_siswa), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => closeModal(),
        });
    };

    const handleGenerateAccounts = (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin membuat akun untuk semua siswa aktif yang belum memilikinya?')) {
            post(route('admin.siswa.generate-accounts'), { preserveScroll: true });
        }
    };

    return (
        <AdminLayout user={auth.user} header="Data Siswa">
            <Head title="Data Siswa" />


            <div className="space-y-6">
                {/* Header & Main Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Data Siswa</h2>
                        <p className="text-sm text-gray-500">Kelola data semua siswa yang terdaftar.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('admin.siswa.reset-password')}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-500 active:bg-indigo-600 transition"
                        >
                            <KeyIcon className="h-4 w-4 mr-2" />
                            Reset Pass
                        </Link>

                        <button
                            onClick={handleGenerateAccounts}
                            disabled={processing}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-500 active:bg-green-700 disabled:opacity-50 transition"
                        >
                            <UsersIcon className="h-4 w-4 mr-2" />
                            Buat Akun Massal
                        </button>
                        <Link href={route('admin.siswa.create')} className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 active:bg-blue-600 transition">
                            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            + Tambah Siswa
                        </Link>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Search */}
                        <div className="sm:col-span-5 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIS..." className="block w-full pl-10 border-gray-300 rounded-md shadow-sm transition focus:ring-2 focus:ring-blue-200" />
                        </div>

                        {/* Filter Kelas */}
                        <div className="sm:col-span-3">
                            <select value={selectedKelas} onChange={handleKelasChange} className="block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Semua Kelas</option>
                                {kelasOptions.map(kelas => (
                                    <option key={kelas.id_kelas} value={kelas.id_kelas}>{kelas.tingkat} {kelas.jurusan}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rows Per Page Selector (NEW) */}
                        <div className="sm:col-span-2">
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                title="Jumlah Baris Per Halaman"
                            >
                                <option value="10">10 Baris</option>
                                <option value="25">25 Baris</option>
                                <option value="50">50 Baris</option>
                                <option value="100">100 Baris</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="sm:col-span-2 flex justify-end gap-2">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition"
                                title="Import Excel"
                            >
                                <ArrowDownOnSquareIcon className="h-4 w-4" />
                            </button>

                            <a
                                href={route('admin.siswa.export_pdf', { search: search, kelas: selectedKelas })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition"
                                title="Export PDF"
                            >
                                <ArrowUpOnSquareIcon className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* BULK ACTION TOOLBAR (Floating) */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-4 animate-fade-in-up">
                        <span className="font-semibold text-sm">{selectedIds.length} Dipilih</span>
                        <div className="h-4 w-px bg-gray-600"></div>

                        <button onClick={() => { setBulkAction('move_class'); setBulkValue(''); }} className="text-sm hover:text-blue-300 flex items-center gap-1">
                            <ArrowPathIcon className="h-4 w-4" /> Pindah Kelas
                        </button>

                        <button onClick={() => { setBulkAction('change_status'); setBulkValue(''); }} className="text-sm hover:text-yellow-300 flex items-center gap-1">
                            <CheckCircleIcon className="h-4 w-4" /> Ubah Status
                        </button>

                        <button onClick={() => setBulkAction('delete')} className="text-sm hover:text-red-300 flex items-center gap-1">
                            <TrashIcon className="h-4 w-4" /> Hapus
                        </button>

                        <div className="h-4 w-px bg-gray-600"></div>
                        <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* TABLE SECTION */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg relative min-h-[300px]">
                    <div className="p-6 text-gray-900">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Daftar Siswa</h3>
                            <div className="text-sm text-gray-500 text-right">
                                {isLoading ? 'Memuat data...' : (
                                    <>
                                        Total <strong>{siswas.total}</strong> siswa ditemukan
                                        {perPage !== 'all' && (
                                            <span className="ml-1 hidden sm:inline">
                                                (Halaman {siswas.current_page} dari {siswas.last_page})
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto relative">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left w-10">
                                            <Checkbox
                                                checked={siswas.data.length > 0 && selectedIds.length === siswas.data.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akun</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <SkeletonTable rows={5} columns={8} />
                                    ) : siswas.data.length > 0 ? (
                                        siswas.data.map((siswa) => (
                                            <tr key={siswa.id_siswa} className={`hover:bg-gray-50 transition ${selectedIds.includes(siswa.id_siswa) ? 'bg-blue-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <Checkbox
                                                        checked={selectedIds.includes(siswa.id_siswa)}
                                                        onChange={() => handleSelectOne(siswa.id_siswa)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.nis}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{siswa.nama_lengkap}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${siswa.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{siswa.status}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {siswa.id_pengguna ? (
                                                        <span className="text-green-600 font-semibold">Ada</span>
                                                    ) : (
                                                        <span className="text-red-600 font-semibold">Tidak Ada</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-x-3">
                                                        <Link href={route('admin.siswa.show', siswa.id_siswa)} className="text-gray-400 hover:text-gray-600 transition" title="Lihat Detail"><EyeIcon className="h-5 w-5" /></Link>
                                                        <Link href={route('admin.siswa.edit', siswa.id_siswa)} className="text-gray-400 hover:text-indigo-600 transition" title="Edit Data"><PencilSquareIcon className="h-5 w-5" /></Link>
                                                        <button onClick={(e) => confirmDeletion(e, siswa)} className="text-gray-400 hover:text-red-600 transition" title="Hapus Data"><TrashIcon className="h-5 w-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-4">
                                                <EmptyState />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Tampilkan Pagination hanya jika tidak sedang loading dan ada data
                        {!isLoading && siswas.data.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <Pagination links={siswas.links} />
                            </div>
                        )} */}
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Single */}
            <Modal show={confirmingDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Apakah Anda yakin?</h2>
                    <p className="mt-1 text-sm text-gray-600">Data Siswa: <strong>{itemToDelete?.nama_lengkap}</strong> akan dihapus. Tindakan ini tidak dapat diurungkan.</p>
                    <div className="mt-6 flex justify-end">
                        <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                        <button onClick={deleteItem} type="button" disabled={processing} className="ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Bulk Actions */}
            <Modal show={!!bulkAction} onClose={() => setBulkAction(null)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                        {bulkAction === 'delete' ? 'Hapus Massal' : bulkAction === 'move_class' ? 'Pindah Kelas Massal' : 'Ubah Status Massal'}
                    </h2>

                    {bulkAction === 'delete' ? (
                        <p className="text-sm text-gray-600 mb-4">
                            Anda akan menghapus <strong>{selectedIds.length} data siswa</strong> terpilih. Semua data terkait (akun, nilai, absensi) akan ikut terhapus.
                        </p>
                    ) : bulkAction === 'move_class' ? (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Pilih kelas tujuan untuk <strong>{selectedIds.length} siswa</strong> terpilih:</p>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm"
                                value={bulkValue}
                                onChange={(e) => setBulkValue(e.target.value)}
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {kelasOptions.map(k => (
                                    <option key={k.id_kelas} value={k.id_kelas}>{k.tingkat} {k.jurusan}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Pilih status baru untuk <strong>{selectedIds.length} siswa</strong> terpilih:</p>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm"
                                value={bulkValue}
                                onChange={(e) => setBulkValue(e.target.value)}
                            >
                                <option value="">-- Pilih Status --</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Lulus">Lulus</option>
                                <option value="Pindah">Pindah</option>
                                <option value="Drop Out">Drop Out</option>
                            </select>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setBulkAction(null)} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                        <button
                            onClick={executeBulkAction}
                            type="button"
                            disabled={isBulkProcessing || (bulkAction !== 'delete' && !bulkValue)}
                            className={`ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm disabled:opacity-50 ${bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isBulkProcessing ? 'Memproses...' : 'Konfirmasi'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Import */}
            <ImportModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    router.reload({ only: ['siswas'] });
                }}
            />
        </AdminLayout>
    );
}