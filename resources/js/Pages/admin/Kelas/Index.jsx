import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/utils/toast';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import SkeletonTable from '@/Components/SkeletonTable';
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
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';



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


// Komponen untuk "Empty State"
const EmptyState = ({ onAddClick }) => (
    <div className="text-center py-12">
        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada data kelas</h3>
        <p className="mt-1 text-sm text-gray-500">Silakan mulai dengan menambahkan data kelas baru.</p>
        <div className="mt-6">
            <button onClick={onAddClick} className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Tambah Kelas
            </button>
        </div>
    </div>
);


export default function Index({ auth, kelasList, stats, filters, guruOptions }) {
    const { flash, errors } = usePage().props;
    const { delete: destroy, processing: deletingProcessing } = useForm();
    const [search, setSearch] = useState(filters.search || '');

    // State untuk Modal Create
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const {
        data: createData,
        setData: setCreateData,
        post: submitCreate,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate
    } = useForm({
        id_kelas: '',
        tingkat: '',
        jurusan: '',
        id_wali_kelas: '',
    });

    // State untuk Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingKelas, setEditingKelas] = useState(null);
    const {
        data: editData,
        setData: setEditData,
        put: submitEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit
    } = useForm({
        tingkat: '',
        jurusan: '',
        id_wali_kelas: '',
    });

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const isFirstRender = React.useRef(true);

    const debouncedSearch = useCallback(debounce((value) => {
        router.get(route('admin.kelas.index'),
            { search: value },
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
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        debouncedSearch(search);
    }, [search, debouncedSearch]);

    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, [debouncedSearch]);

    // Handle Delete
    const confirmDeletion = (e, item) => {
        e.preventDefault();
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        setItemToDelete(null);
    };

    const deleteItem = (e) => {
        e.preventDefault();
        destroy(route('admin.kelas.destroy', itemToDelete.id_kelas), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data kelas berhasil dihapus');
                closeDeleteModal();
            },
            onError: (err) => {
                closeDeleteModal();
                const errorMessage = Object.values(err)[0] || 'Gagal menghapus data kelas.';
                toast.error(errorMessage);
            },
        });
    };

    // Handle Create
    const openCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetCreate();
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        submitCreate(route('admin.kelas.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data kelas berhasil ditambahkan');
                closeCreateModal();
            },
            onError: (errs) => {
                const message = Object.values(errs)[0] || 'Gagal menyimpan data, periksa kembali input Anda.';
                toast.error(message);
            }
        });
    };

    // Handle Edit
    const openEditModal = (kelas) => {
        setEditingKelas(kelas);
        setEditData({
            tingkat: kelas.tingkat,
            jurusan: kelas.jurusan || '',
            id_wali_kelas: kelas.id_wali_kelas || '',
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingKelas(null);
        resetEdit();
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        submitEdit(route('admin.kelas.update', editingKelas.id_kelas), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data kelas berhasil diperbarui');
                closeEditModal();
            },
            onError: (errs) => {
                const message = Object.values(errs)[0] || 'Gagal memperbarui data, periksa kembali input Anda.';
                toast.error(message);
            }
        });
    };


    return (
        <AdminLayout user={auth.user} header="Data Kelas">
            <Head title="Data Kelas" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Data Kelas</h2>
                        <p className="text-sm text-gray-500">Kelola data kelas dan wali kelas.</p>
                    </div>
                    <button onClick={openCreateModal} className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 active:bg-blue-600 transition">
                        + Tambah Kelas
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<BuildingOffice2Icon className="h-6 w-6 text-gray-500" />} label="Total Kelas" value={stats.total} detail="Kelas terdaftar" />
                    <StatCard icon={<UsersIcon className="h-6 w-6 text-green-500" />} label="Kelas Aktif" value={stats.aktif} detail="Sedang berjalan" />
                    <StatCard icon={<AcademicCapIcon className="h-6 w-6 text-blue-500" />} label="Total Siswa" value={stats.totalSiswa} detail="Siswa aktif" />
                    <StatCard icon={<UserCircleIcon className="h-6 w-6 text-purple-500" />} label="Dengan Wali" value={stats.denganWali} detail="Memiliki wali kelas" />
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
                        <p className="text-sm text-gray-500 mt-1">
                            {isLoading ? 'Memuat data...' : `Total ${kelasList.length} kelas ditemukan`}
                        </p>

                        {kelasList.length > 0 || isLoading ? (
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
                                            {isLoading ? (
                                                <SkeletonTable rows={5} columns={5} />
                                            ) : (
                                                kelasList.map((kelas) => (
                                                    <tr key={kelas.id_kelas} className="hover:bg-gray-50 disabled:opacity-50">
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
                                                                <Link href={route('admin.kelas.show', kelas.id_kelas)} className="text-gray-400 hover:text-gray-600 transition" title="Lihat Detail"><EyeIcon className="h-5 w-5" /></Link>
                                                                <button onClick={() => openEditModal(kelas)} className="text-gray-400 hover:text-indigo-600 transition" title="Edit Data"><PencilSquareIcon className="h-5 w-5" /></button>
                                                                <button onClick={(e) => confirmDeletion(e, kelas)} className="text-gray-400 hover:text-red-600 transition" title="Hapus Data"><TrashIcon className="h-5 w-5" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <EmptyState onAddClick={openCreateModal} />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Kelas */}
            <Modal show={isCreateModalOpen} onClose={closeCreateModal}>
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Tambah Data Kelas</h2>

                    <div className="space-y-6">
                        <div>
                            <InputLabel htmlFor="id_kelas" value="ID Kelas *" />
                            <TextInput
                                id="id_kelas"
                                name="id_kelas"
                                value={createData.id_kelas}
                                className="mt-1 block w-full"
                                onChange={(e) => setCreateData('id_kelas', e.target.value)}
                                placeholder="Contoh: KLS-01"
                                required
                            />
                            <InputError message={createErrors.id_kelas} className="mt-2" />
                            <p className="mt-1 text-xs text-gray-500">ID Kelas bersifat unik dan akan digunakan di seluruh sistem.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="tingkat" value="Tingkat Kelas *" />
                                <SelectInput
                                    id="tingkat"
                                    name="tingkat"
                                    value={createData.tingkat}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setCreateData('tingkat', e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Tingkat</option>
                                    <option value="X">Kelas X</option>
                                    <option value="XI">Kelas XI</option>
                                    <option value="XII">Kelas XII</option>
                                </SelectInput>
                                <InputError message={createErrors.tingkat} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="jurusan" value="Jurusan (Opsional)" />
                                <TextInput
                                    id="jurusan"
                                    name="jurusan"
                                    value={createData.jurusan}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setCreateData('jurusan', e.target.value)}
                                    placeholder="Contoh: IPA, IPS, RPL"
                                />
                                <InputError message={createErrors.jurusan} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="id_wali_kelas" value="Wali Kelas (Opsional)" />
                            <SelectInput
                                id="id_wali_kelas"
                                name="id_wali_kelas"
                                value={createData.id_wali_kelas}
                                className="mt-1 block w-full"
                                onChange={(e) => setCreateData('id_wali_kelas', e.target.value)}
                            >
                                <option value="">--- Pilih Wali Kelas ---</option>
                                {guruOptions && guruOptions.filter(guru => !guru.is_assigned).map((guru) => (
                                    <option key={guru.id_guru} value={guru.id_guru}>
                                        {guru.nama_lengkap} (NIP: {guru.nip || '-'})
                                    </option>
                                ))}
                            </SelectInput>
                            <InputError message={createErrors.id_wali_kelas} className="mt-2" />
                            <p className="mt-1 text-xs text-gray-500">Pilih guru yang akan menjadi wali kelas ini. Anda bisa mengaturnya nanti jika belum ada.</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeCreateModal} type="button">Batal</SecondaryButton>
                        <PrimaryButton type="submit" disabled={createProcessing}>
                            {createProcessing ? 'Menyimpan...' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Kelas */}
            <Modal show={isEditModalOpen} onClose={closeEditModal}>
                <form onSubmit={handleEditSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Edit Data Kelas</h2>

                    <div className="space-y-6">
                        <div>
                            <InputLabel htmlFor="edit_id_kelas" value="ID Kelas (Tidak Dapat Diubah)" />
                            <TextInput
                                id="edit_id_kelas"
                                name="id_kelas"
                                value={editingKelas?.id_kelas || ''}
                                className="mt-1 block w-full bg-gray-100"
                                disabled
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="edit_tingkat" value="Tingkat Kelas *" />
                                <SelectInput
                                    id="edit_tingkat"
                                    name="tingkat"
                                    value={editData.tingkat}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setEditData('tingkat', e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Tingkat</option>
                                    <option value="X">Kelas X</option>
                                    <option value="XI">Kelas XI</option>
                                    <option value="XII">Kelas XII</option>
                                </SelectInput>
                                <InputError message={editErrors.tingkat} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_jurusan" value="Jurusan (Opsional)" />
                                <TextInput
                                    id="edit_jurusan"
                                    name="jurusan"
                                    value={editData.jurusan}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setEditData('jurusan', e.target.value)}
                                    placeholder="Contoh: IPA, IPS, RPL"
                                />
                                <InputError message={editErrors.jurusan} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_id_wali_kelas" value="Wali Kelas (Opsional)" />
                            <SelectInput
                                id="edit_id_wali_kelas"
                                name="id_wali_kelas"
                                value={editData.id_wali_kelas}
                                className="mt-1 block w-full"
                                onChange={(e) => setEditData('id_wali_kelas', e.target.value)}
                            >
                                <option value="">--- Pilih Wali Kelas ---</option>
                                {guruOptions && guruOptions.filter(guru => !guru.is_assigned || guru.id_guru === editingKelas?.id_wali_kelas).map((guru) => (
                                    <option key={guru.id_guru} value={guru.id_guru}>
                                        {guru.nama_lengkap} (NIP: {guru.nip || '-'})
                                    </option>
                                ))}
                            </SelectInput>
                            <InputError message={editErrors.id_wali_kelas} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeEditModal} type="button">Batal</SecondaryButton>
                        <PrimaryButton type="submit" disabled={editProcessing}>
                            {editProcessing ? 'Memperbarui...' : 'Update'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Delete Confirmation */}
            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Apakah Anda yakin?</h2>
                    <p className="mt-1 text-sm text-gray-600">Data Kelas: <strong>{itemToDelete?.tingkat} {itemToDelete?.jurusan}</strong> akan dihapus.</p>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeDeleteModal} type="button" className="mr-3">Batal</SecondaryButton>
                        <button onClick={deleteItem} type="button" disabled={deletingProcessing} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                            {deletingProcessing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
