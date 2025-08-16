import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import {
    ClipboardDocumentListIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    UsersIcon,
    ClockIcon as ClockSolidIcon,
    CheckCircleIcon as CheckSolidIcon,
    XCircleIcon as XSolidIcon,
    InformationCircleIcon as InfoSolidIcon,
    ExclamationTriangleIcon as WarningSolidIcon,
} from "@heroicons/react/24/solid";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import debounce from "lodash.debounce";

// --- Komponen-komponen UI Kecil ---

const StatCard = ({ label, value, icon, color, detail }) => (
    <div
        className="bg-white p-4 rounded-lg shadow-sm flex items-center border-l-4"
        style={{ borderColor: color }}
    >
        <div className="flex-shrink-0 mr-4">
            <div
                className={`h-10 w-10 rounded-full flex items-center justify-center`}
                style={{ backgroundColor: `${color}1A` }}
            >
                {React.cloneElement(icon, {
                    className: "h-5 w-5",
                    style: { color },
                })}
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            {detail && <p className="text-xs text-gray-400">{detail}</p>}
        </div>
    </div>
);

// --- Komponen Halaman Utama ---

export default function Index({
    auth,
    kelasOptions,
    siswaWithAbsensi,
    stats,
    filters,
}) {
    const [isMassalModalOpen, setIsMassalModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentSiswa, setCurrentSiswa] = useState(null);

    // State lokal untuk filter, diinisialisasi dari props
    const [localFilters, setLocalFilters] = useState({
        id_kelas: filters.id_kelas || "",
        tanggal: filters.tanggal || "",
        search: filters.search || "",
    });

    const isFirstRender = useRef(true);

    // Form untuk absensi massal
    const {
        data: massalData,
        setData: setMassalData,
        post: postMassal,
        processing: processingMassal,
        errors: massalErrors, // Ambil error untuk form massal
    } = useForm({
        tanggal: filters.tanggal,
        id_kelas: filters.id_kelas,
        absensi: [],
    });

    // Form untuk edit individual
    const {
        data: editData,
        setData: setEditData,
        post: postIndividual,
        processing: processingIndividual,
        errors: editErrors,
        reset: resetEditForm,
    } = useForm({
        tanggal: "",
        id_siswa: "",
        status_kehadiran: "Hadir",
        jam_masuk: "",
        jam_pulang: "",
        keterangan: "",
    });

    // Update form massal saat data siswa berubah
    useEffect(() => {
        const initialAbsensi = (siswaWithAbsensi || []).map((siswa) => ({
            id_siswa: siswa.id_siswa,
            status_kehadiran: siswa.absensi?.status_kehadiran || "Hadir",
        }));
        setMassalData("absensi", initialAbsensi);
    }, [siswaWithAbsensi]);

    // Fungsi debounced untuk mengirim filter ke server
    const debouncedFilter = useMemo(
        () =>
            debounce((newFilters) => {
                router.get(route("admin.absensi-siswa.index"), newFilters, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }, 300),
        []
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        debouncedFilter(localFilters);
    }, [localFilters, debouncedFilter]);

    // Handler untuk mengubah filter lokal
    const handleFilterChange = (key, value) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    // --- Handlers untuk Modal ---

    const openMassalModal = () => {
        setMassalData("tanggal", localFilters.tanggal);
        setMassalData("id_kelas", localFilters.id_kelas);
        setIsMassalModalOpen(true);
    };
    const closeMassalModal = () => setIsMassalModalOpen(false);
    const submitMassalAbsensi = (e) => {
        e.preventDefault();
        postMassal(route("admin.absensi-siswa.store.massal"), {
            onSuccess: () => closeMassalModal(),
        });
    };

    const openEditModal = (siswa) => {
        resetEditForm();
        setCurrentSiswa(siswa);
        setEditData({
            tanggal: localFilters.tanggal,
            id_siswa: siswa.id_siswa,
            status_kehadiran: siswa.absensi?.status_kehadiran || "Hadir",
            jam_masuk: siswa.absensi?.jam_masuk?.substring(0, 5) || "",
            jam_pulang: siswa.absensi?.jam_pulang?.substring(0, 5) || "",
            keterangan: siswa.absensi?.keterangan || "",
        });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);
    const submitIndividualAbsensi = (e) => {
        e.preventDefault();
        postIndividual(route("admin.absensi-siswa.storeManual"), {
            onSuccess: () => closeEditModal(),
        });
    };

    // Fungsi untuk update status di modal massal
    const handleStatusChange = (id_siswa, status_kehadiran) => {
        setMassalData(
            "absensi",
            massalData.absensi.map((item) =>
                item.id_siswa === id_siswa
                    ? { ...item, status_kehadiran }
                    : item
            )
        );
    };
    
    // Fungsi untuk menandai semua siswa hadir
    const handleSetAllHadir = () => {
        const allHadir = massalData.absensi.map(item => ({...item, status_kehadiran: 'Hadir'}));
        setMassalData('absensi', allHadir);
    }

    const tanggalTampilan = new Date(
        localFilters.tanggal + "T00:00:00"
    ).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <AdminLayout user={auth.user} header="Absensi Siswa">
            <Head title="Absensi Siswa" />

            <div className="space-y-6">
                {/* Header & Filter */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <InputLabel htmlFor="kelas" value="Kelas" />
                            <select
                                id="kelas"
                                value={localFilters.id_kelas || ""}
                                onChange={(e) =>
                                    handleFilterChange("id_kelas", e.target.value)
                                }
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                {kelasOptions.map((kelas) => (
                                    <option key={kelas.id_kelas} value={kelas.id_kelas}>
                                        {kelas.tingkat} {kelas.jurusan}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <InputLabel htmlFor="tanggal" value="Tanggal" />
                            <TextInput
                                id="tanggal"
                                type="date"
                                value={localFilters.tanggal || ""}
                                onChange={(e) =>
                                    handleFilterChange("tanggal", e.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <InputLabel htmlFor="search" value="Cari Siswa" />
                            <div className="relative mt-1">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <TextInput
                                    id="search"
                                    type="text"
                                    value={localFilters.search || ""}
                                    onChange={(e) =>
                                        handleFilterChange("search", e.target.value)
                                    }
                                    placeholder="NIS / Nama..."
                                    className="block w-full pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Siswa" value={stats.total} icon={<UsersIcon />} color="#6b7280" />
                    <StatCard label="Hadir" value={stats.hadir} icon={<CheckSolidIcon />} color="#22c55e" detail={`${stats.terlambat} Terlambat`} />
                    <StatCard label="Sakit" value={stats.sakit} icon={<WarningSolidIcon />} color="#eab308" />
                    <StatCard label="Izin" value={stats.izin} icon={<InfoSolidIcon />} color="#3b82f6" />
                    <StatCard label="Alfa" value={stats.alfa} icon={<XSolidIcon />} color="#ef4444" />
                    <StatCard label="Belum Diinput" value={stats.belum_diinput} icon={<ClipboardDocumentListIcon />} color="#f97316" />
                </div>

                {/* Tabel */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                Daftar Kehadiran - {tanggalTampilan}
                            </h2>
                            <PrimaryButton
                                onClick={openMassalModal}
                                disabled={(siswaWithAbsensi || []).length === 0}
                            >
                                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                                Input Absensi Kelas
                            </PrimaryButton>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* ... thead ... */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["NIS", "Nama Siswa", "Status Kehadiran", "Jam Masuk", "Aksi"].map((head) => (
                                            <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(siswaWithAbsensi || []).length > 0 ? (
                                        siswaWithAbsensi.map((siswa) => (
                                            <tr key={siswa.id_siswa} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.nis}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{siswa.nama_lengkap}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {siswa.absensi?.status_kehadiran === 'Hadir' ? (
                                                        (siswa.absensi.menit_keterlambatan ?? 0) > 0 ? (
                                                            <span className="flex items-center px-2 py-1 text-xs font-semibold leading-5 text-yellow-800 bg-yellow-100 rounded-full">
                                                                <ClockIcon className="w-4 h-4 mr-1.5" />
                                                                Terlambat ({siswa.absensi.menit_keterlambatan} menit)
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                                                                <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                                                Tepat Waktu
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className={`flex items-center px-2 py-1 text-xs font-semibold leading-5 rounded-full ${
                                                            {Sakit: 'bg-yellow-100 text-yellow-800', Izin: 'bg-blue-100 text-blue-800', Alfa: 'bg-red-100 text-red-800'}[siswa.absensi?.status_kehadiran] || 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            <XCircleIcon className="w-4 h-4 mr-1.5" />
                                                            {siswa.absensi?.status_kehadiran || 'Belum Diinput'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.absensi?.jam_masuk?.substring(0, 5) || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button onClick={() => openEditModal(siswa)} className="text-indigo-600 hover:text-indigo-900" title="Edit Individual">
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-12 text-gray-500">
                                                <p className="font-semibold">Tidak ada data siswa.</p>
                                                <p className="text-sm">Silakan pilih kelas untuk menampilkan data.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================== */}
            {/* PERBAIKAN UTAMA ADA DI DALAM MODAL INI */}
            {/* ====================================================== */}
            <Modal show={isMassalModalOpen} onClose={closeMassalModal} maxWidth="3xl">
                <form onSubmit={submitMassalAbsensi} className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Input Absensi Kelas</h2>
                    <p className="text-sm text-gray-500 mb-4">Tandai status kehadiran untuk setiap siswa pada tanggal {tanggalTampilan}.</p>
                    <div className="mb-4">
                        <SecondaryButton type="button" onClick={handleSetAllHadir}>
                            Tandai Semua Hadir
                        </SecondaryButton>
                    </div>
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-2/5">Nama Siswa</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-3/5">Status Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(massalData.absensi || []).map((absen, index) => (
                                    <tr key={absen.id_siswa}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                            {siswaWithAbsensi[index]?.nama_lengkap || absen.id_siswa}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <fieldset className="flex items-center gap-x-2 sm:gap-x-4">
                                                {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(status => (
                                                    <div key={status} className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id={`status_${absen.id_siswa}_${status}`}
                                                            name={`status_${absen.id_siswa}`}
                                                            value={status}
                                                            checked={absen.status_kehadiran === status}
                                                            onChange={() => handleStatusChange(absen.id_siswa, status)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor={`status_${absen.id_siswa}_${status}`} className="ml-2 block text-sm text-gray-700">{status}</label>
                                                    </div>
                                                ))}
                                            </fieldset>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeMassalModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processingMassal}>{processingMassal ? 'Menyimpan...' : 'Simpan Absensi'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Individual */}
            <Modal show={isEditModalOpen} onClose={closeEditModal} maxWidth="lg">
                <form onSubmit={submitIndividualAbsensi} className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Absensi Individual</h2>
                    <p className="text-sm text-gray-500 mb-6">Mengubah data untuk: <span className="font-semibold">{currentSiswa?.nama_lengkap}</span></p>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="status_kehadiran" value="Status Kehadiran" />
                            <select id="status_kehadiran" value={editData.status_kehadiran} onChange={(e) => setEditData("status_kehadiran", e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                            <InputError message={editErrors.status_kehadiran} className="mt-2" />
                        </div>
                        {editData.status_kehadiran === 'Hadir' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="jam_masuk" value="Jam Masuk" />
                                    <TextInput id="jam_masuk" type="time" value={editData.jam_masuk} onChange={(e) => setEditData('jam_masuk', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={editErrors.jam_masuk} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="jam_pulang" value="Jam Pulang" />
                                    <TextInput id="jam_pulang" type="time" value={editData.jam_pulang} onChange={(e) => setEditData('jam_pulang', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={editErrors.jam_pulang} className="mt-2" />
                                </div>
                            </div>
                        )}
                        <div>
                            <InputLabel htmlFor="keterangan" value="Keterangan (Opsional)" />
                            <TextInput id="keterangan" value={editData.keterangan} onChange={(e) => setEditData('keterangan', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={editErrors.keterangan} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton type="button" onClick={closeEditModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processingIndividual}>{processingIndividual ? 'Menyimpan...' : 'Simpan Perubahan'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}