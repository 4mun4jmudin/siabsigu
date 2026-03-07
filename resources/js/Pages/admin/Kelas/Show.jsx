import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { toast } from '@/utils/toast';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon, UserCircleIcon, UsersIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';



// --- KOMPONEN SKELETON LOADER ---
const TableSkeleton = () => {
    return (
        <>
            {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse border-b border-gray-200">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                </tr>
            ))}
        </>
    );
};

// Komponen untuk Tombol Tab
const TabButton = ({ icon, active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${active
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
    >
        {icon}
        {children}
    </button>
);

// Komponen untuk konten tab "Daftar Siswa"
const DaftarSiswaTab = ({ siswas, search, onSearch, isLoading }) => (
    <div>
        <div className="flex justify-end mb-4 pr-1 mt-4">
            <div className="sm:w-1/3 w-full relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Cari siswa (Nama/NIS)..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                />
            </div>
        </div>
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : siswas.length > 0 ? (
                        siswas.map((siswa) => (
                            <tr key={siswa.id_siswa} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.nis}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{siswa.nama_lengkap}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${siswa.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{siswa.status}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Tidak ada siswa ditemukan</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Komponen untuk konten tab "Jadwal Pelajaran"
const JadwalPelajaranTab = ({ jadwal }) => (
    <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hari</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru Pengajar</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {jadwal.length > 0 ? (
                    jadwal.map((item) => (
                        <tr key={item.id_jadwal} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.hari}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.mata_pelajaran.nama_mapel}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.guru.nama_lengkap}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Tidak ada jadwal pelajaran</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);


export default function Show({ auth, kelas, siswasInKelas, jadwalPelajaran, filters, guruOptions }) {
    const [activeTab, setActiveTab] = useState('siswa');

    // --- SEARCH STATE & DEBOUNCE ---
    const [search, setSearch] = useState(filters?.search || '');
    const [isLoading, setIsLoading] = useState(false);
    const isFirstRender = useRef(true);

    const debouncedSearch = useCallback(debounce((value) => {
        router.get(route('admin.kelas.show', kelas.id_kelas),
            { search: value },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    }, 400), [kelas.id_kelas]);

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


    // --- EDIT MODAL STATE & LOGIC ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const {
        data: editData,
        setData: setEditData,
        put: submitEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit
    } = useForm({
        tingkat: kelas.tingkat || '',
        jurusan: kelas.jurusan || '',
        id_wali_kelas: kelas.id_wali_kelas || '',
    });

    const openEditModal = () => {
        setEditData({
            tingkat: kelas.tingkat,
            jurusan: kelas.jurusan,
            id_wali_kelas: kelas.id_wali_kelas || '',
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        resetEdit();
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        submitEdit(route('admin.kelas.update', kelas.id_kelas), {
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
        <AdminLayout user={auth.user} header={`Detail Kelas: ${kelas.tingkat} ${kelas.jurusan}`}>
            <Head title={`Detail Kelas ${kelas.tingkat} ${kelas.jurusan}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Detail Kelas</h2>
                                <p className="text-sm text-gray-500 mt-1">Informasi lengkap mengenai kelas, wali kelas, dan daftar siswa.</p>
                            </div>
                            <div className="flex items-center gap-x-2 flex-shrink-0">
                                <Link href={route('admin.kelas.index')} className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                                    <ArrowLeftIcon className="-ml-0.5 h-5 w-5" />
                                    Kembali
                                </Link>
                                <button onClick={openEditModal} className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition">
                                    <PencilIcon className="-ml-0.5 h-5 w-5" />
                                    Edit
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-blue-600">Nama Kelas</dt>
                                <dd className="mt-1 text-xl font-semibold text-blue-900">{kelas.tingkat} {kelas.jurusan}</dd>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-indigo-600 flex items-center"><UserCircleIcon className="h-5 w-5 mr-2" />Wali Kelas</dt>
                                <dd className="mt-1 text-xl font-semibold text-indigo-900">{kelas.wali_kelas?.nama_lengkap || 'Belum Diatur'}</dd>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-green-600 flex items-center"><UsersIcon className="h-5 w-5 mr-2" />Jumlah Siswa</dt>
                                <dd className="mt-1 text-xl font-semibold text-green-900">{siswasInKelas?.length || 0} Siswa</dd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                <TabButton icon={<UsersIcon className="h-5 w-5" />} active={activeTab === 'siswa'} onClick={() => setActiveTab('siswa')}>Daftar Siswa</TabButton>
                                <TabButton icon={<CalendarDaysIcon className="h-5 w-5" />} active={activeTab === 'jadwal'} onClick={() => setActiveTab('jadwal')}>Jadwal Pelajaran</TabButton>
                            </nav>
                        </div>

                        {activeTab === 'siswa' && (
                            <DaftarSiswaTab
                                siswas={siswasInKelas}
                                search={search}
                                onSearch={setSearch}
                                isLoading={isLoading}
                            />
                        )}
                        {activeTab === 'jadwal' && <JadwalPelajaranTab jadwal={jadwalPelajaran} />}
                    </div>
                </div>
            </div>

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
                                value={kelas.id_kelas}
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
                                {guruOptions && guruOptions.filter(guru => !guru.is_assigned || guru.id_guru === kelas.id_wali_kelas).map((guru) => (
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
        </AdminLayout>
    );
}
