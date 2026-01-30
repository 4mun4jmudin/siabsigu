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
    FunnelIcon,
    ArrowDownTrayIcon,
    ChartPieIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/solid";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentArrowDownIcon,
    TableCellsIcon,
    CalendarDaysIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";
import debounce from "lodash.debounce";

// --- Komponen UI: StatCard Modern ---
const StatCard = ({ label, value, icon, colorClass, bgClass, detail, percentage }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-full">
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bgClass} ${colorClass} bg-opacity-20 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
        </div>
        
        <div className="mt-4 z-10 relative">
             {detail && (
                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${bgClass} ${colorClass} bg-opacity-30`}>
                    {detail}
                </div>
            )}
            {percentage !== undefined && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div 
                        className={`h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            )}
        </div>

        {/* Background Decoration */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${bgClass} opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
    </div>
);

// --- Komponen UI: Status Badge ---
const StatusBadge = ({ status, terlambat }) => {
    if (status === 'Hadir') {
        if (terlambat > 0) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 ring-1 ring-yellow-500/10">
                    <ClockSolidIcon className="w-3.5 h-3.5 mr-1.5" />
                    Telat {terlambat}m
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/10">
                <CheckSolidIcon className="w-3.5 h-3.5 mr-1.5" />
                Hadir
            </span>
        );
    }

    const styles = {
        Sakit: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
        Izin: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
        Alfa: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    };

    const icons = {
        Sakit: <WarningSolidIcon className="w-3.5 h-3.5 mr-1.5" />,
        Izin: <InfoSolidIcon className="w-3.5 h-3.5 mr-1.5" />,
        Alfa: <XSolidIcon className="w-3.5 h-3.5 mr-1.5" />,
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ring-1 ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200 ring-gray-500/10'}`}>
            {icons[status]}
            {status || 'Belum Input'}
        </span>
    );
};

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

    // State lokal untuk filter
    const [localFilters, setLocalFilters] = useState({
        id_kelas: filters.id_kelas || "",
        tanggal: filters.tanggal || new Date().toISOString().split('T')[0],
        search: filters.search || "",
    });

    const buildExportUrl = (format) => {
        const params = new URLSearchParams({
            id_kelas: localFilters.id_kelas,
            tanggal: localFilters.tanggal,
            search: localFilters.search,
        });
        try {
            return route(`admin.absensi-siswa.export.${format}`) + '?' + params.toString();
        } catch (e) {
            return '#';
        }
    };

    const isFirstRender = useRef(true);

    // Form untuk absensi massal
    const {
        data: massalData,
        setData: setMassalData,
        post: postMassal,
        processing: processingMassal,
        errors: massalErrors,
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

    // Navigasi tanggal cepat
    const changeDate = (days) => {
        const currentDate = new Date(localFilters.tanggal);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateString = currentDate.toISOString().split('T')[0];
        handleFilterChange("tanggal", newDateString);
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
        const allHadir = massalData.absensi.map(item => ({ ...item, status_kehadiran: 'Hadir' }));
        setMassalData('absensi', allHadir);
    }

    const tanggalObj = new Date(localFilters.tanggal + "T00:00:00");
    const tanggalTampilan = tanggalObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Hitung persentase kehadiran
    const totalSiswa = stats.total || 0;
    const kehadiranPercentage = totalSiswa > 0 ? Math.round((stats.hadir / totalSiswa) * 100) : 0;

    return (
        <AdminLayout user={auth.user} header="Manajemen Absensi Siswa">
            <Head title="Absensi Siswa" />

            <div className="space-y-6">
                
                {/* Section 1: Dashboard Ringkas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Kolom Kiri: Quick Stats Highlight */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                                    <ChartPieIcon className="w-5 h-5" />
                                    Tingkat Kehadiran
                                </h3>
                                <div className="flex items-end gap-3 mt-2">
                                    <span className="text-5xl font-extrabold tracking-tight">{kehadiranPercentage}%</span>
                                    <span className="text-indigo-200 mb-2 font-medium">dari {totalSiswa} siswa</span>
                                </div>
                                <div className="w-full bg-indigo-900/30 rounded-full h-2 mt-4 backdrop-blur-sm">
                                    <div 
                                        className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                                        style={{ width: `${kehadiranPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-indigo-200 mt-4 opacity-80">
                                    Data per {tanggalTampilan}
                                </p>
                            </div>
                            {/* Decorative Circles */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
                            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Detail Stats Cards */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard 
                            label="Hadir" 
                            value={stats.hadir} 
                            icon={<CheckSolidIcon />} 
                            bgClass="bg-emerald-100" 
                            colorClass="text-emerald-600"
                            percentage={totalSiswa > 0 ? (stats.hadir / totalSiswa) * 100 : 0}
                            detail={stats.terlambat > 0 ? `${stats.terlambat} Telat` : null}
                        />
                        <StatCard 
                            label="Sakit/Izin" 
                            value={stats.sakit + stats.izin} 
                            icon={<InfoSolidIcon />} 
                            bgClass="bg-blue-100" 
                            colorClass="text-blue-600" 
                            percentage={totalSiswa > 0 ? ((stats.sakit + stats.izin) / totalSiswa) * 100 : 0}
                        />
                         <StatCard 
                            label="Tanpa Keterangan" 
                            value={stats.alfa} 
                            icon={<XSolidIcon />} 
                            bgClass="bg-rose-100" 
                            colorClass="text-rose-600" 
                            percentage={totalSiswa > 0 ? (stats.alfa / totalSiswa) * 100 : 0}
                        />
                        <StatCard 
                            label="Belum Input" 
                            value={stats.belum_diinput} 
                            icon={<ClipboardDocumentListIcon />} 
                            bgClass="bg-orange-100" 
                            colorClass="text-orange-600" 
                            percentage={totalSiswa > 0 ? (stats.belum_diinput / totalSiswa) * 100 : 0}
                        />
                    </div>
                </div>

                {/* Section 2: Filter & Control Panel */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2 mb-2 md:mb-0">
                            <FunnelIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-800 text-lg">Filter Pencarian</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                        {/* Kelas Selector */}
                        <div className="md:col-span-4">
                            <InputLabel htmlFor="kelas" value="Kelas" className="mb-1.5 font-medium text-gray-600" />
                            <div className="relative group">
                                <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <select
                                    id="kelas"
                                    value={localFilters.id_kelas || ""}
                                    onChange={(e) => handleFilterChange("id_kelas", e.target.value)}
                                    className="pl-10 block w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all hover:border-indigo-400 cursor-pointer"
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {kelasOptions.map((kelas) => (
                                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                                            {kelas.tingkat} {kelas.jurusan}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tanggal Picker dengan Navigasi */}
                        <div className="md:col-span-4">
                            <InputLabel htmlFor="tanggal" value="Tanggal" className="mb-1.5 font-medium text-gray-600" />
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => changeDate(-1)}
                                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                    title="Hari Sebelumnya"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <div className="relative flex-1 group">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <TextInput
                                        id="tanggal"
                                        type="date"
                                        value={localFilters.tanggal || ""}
                                        onChange={(e) => handleFilterChange("tanggal", e.target.value)}
                                        className="pl-10 block w-full rounded-xl"
                                    />
                                </div>
                                <button 
                                    onClick={() => changeDate(1)}
                                    className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                    title="Hari Berikutnya"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="md:col-span-4">
                            <InputLabel htmlFor="search" value="Cari Siswa" className="mb-1.5 font-medium text-gray-600" />
                            <div className="relative group">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <TextInput
                                    id="search"
                                    type="text"
                                    value={localFilters.search || ""}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    placeholder="NIS atau Nama Siswa..."
                                    className="pl-10 block w-full rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Data Table & Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-indigo-600" />
                                Daftar Kehadiran Siswa
                            </h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Menampilkan data tanggal: <span className="font-semibold text-gray-700">{tanggalTampilan}</span>
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Tombol Export Group */}
                            <div className="flex rounded-xl shadow-sm bg-white border border-gray-200 p-1">
                                <a
                                    href={buildExportUrl('excel')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                >
                                    <TableCellsIcon className="w-4 h-4 mr-1.5 text-emerald-600" />
                                    Excel
                                </a>
                                <div className="w-px bg-gray-200 my-1"></div>
                                <a
                                    href={buildExportUrl('pdf')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                >
                                    <DocumentArrowDownIcon className="w-4 h-4 mr-1.5 text-rose-600" />
                                    PDF
                                </a>
                            </div>

                            {/* Tombol Input Massal */}
                            <PrimaryButton
                                onClick={openMassalModal}
                                disabled={(siswaWithAbsensi || []).length === 0}
                                className="rounded-xl px-4 py-2.5 shadow-md shadow-indigo-200"
                            >
                                <PencilSquareIcon className="h-5 w-5 mr-2" />
                                Input Absensi Kelas
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20">NIS</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Masuk</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu Pulang</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(siswaWithAbsensi || []).length > 0 ? (
                                    siswaWithAbsensi.map((siswa, idx) => (
                                        <tr key={siswa.id_siswa} className={`hover:bg-indigo-50/30 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                                {siswa.nis}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 shadow-sm ${
                                                        ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500'][siswa.id_siswa % 5]
                                                    }`}>
                                                        {siswa.nama_lengkap.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{siswa.nama_lengkap}</div>
                                                        <div className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                            {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge 
                                                    status={siswa.absensi?.status_kehadiran} 
                                                    terlambat={siswa.absensi?.menit_keterlambatan} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {siswa.absensi?.jam_masuk?.substring(0, 5) ? (
                                                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">
                                                        {siswa.absensi?.jam_masuk?.substring(0, 5)}
                                                     </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {siswa.absensi?.jam_pulang?.substring(0, 5) ? (
                                                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">
                                                        {siswa.absensi?.jam_pulang?.substring(0, 5)}
                                                     </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <button 
                                                    onClick={() => openEditModal(siswa)} 
                                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95" 
                                                    title="Edit Absensi"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="bg-gray-100 p-4 rounded-full mb-4">
                                                    <UserGroupIcon className="h-10 w-10 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-1">Data Tidak Ditemukan</h3>
                                                <p className="text-sm text-gray-500">
                                                    Silakan pilih <strong>Kelas</strong> terlebih dahulu atau coba ubah tanggal pencarian Anda.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal Absensi Massal */}
            <Modal show={isMassalModalOpen} onClose={closeMassalModal} maxWidth="4xl">
                <form onSubmit={submitMassalAbsensi} className="flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Input Absensi Kelas</h2>
                            <p className="text-sm text-gray-500 mt-1">Tanggal: <span className="font-semibold text-indigo-600">{tanggalTampilan}</span></p>
                        </div>
                        <SecondaryButton type="button" onClick={handleSetAllHadir} className="text-xs bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500">
                            <CheckSolidIcon className="w-4 h-4 mr-2 text-emerald-600" />
                            Tandai Semua Hadir
                        </SecondaryButton>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {(massalData.absensi || []).map((absen, index) => (
                                        <tr key={absen.id_siswa} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                                {siswaWithAbsensi[index]?.nama_lengkap || absen.id_siswa}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 custom-scrollbar">
                                                    {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(status => (
                                                        <label key={status} className={`cursor-pointer group flex items-center px-3 py-2 rounded-lg border transition-all duration-200 ${
                                                            absen.status_kehadiran === status 
                                                                ? status === 'Hadir' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500/50' :
                                                                  status === 'Sakit' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/50' :
                                                                  status === 'Izin' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/50' :
                                                                  'bg-rose-50 border-rose-200 ring-1 ring-rose-500/50'
                                                                : 'border-gray-200 hover:bg-gray-50 bg-white'
                                                        }`}>
                                                            <input
                                                                type="radio"
                                                                name={`status_${absen.id_siswa}`}
                                                                value={status}
                                                                checked={absen.status_kehadiran === status}
                                                                onChange={() => handleStatusChange(absen.id_siswa, status)}
                                                                className={`h-4 w-4 border-gray-300 focus:ring-offset-0 ${
                                                                    status === 'Hadir' ? 'text-emerald-600 focus:ring-emerald-500' :
                                                                    status === 'Sakit' ? 'text-blue-600 focus:ring-blue-500' :
                                                                    status === 'Izin' ? 'text-indigo-600 focus:ring-indigo-500' :
                                                                    'text-rose-600 focus:ring-rose-500'
                                                                }`}
                                                            />
                                                            <span className={`ml-2 text-sm ${
                                                                absen.status_kehadiran === status 
                                                                    ? status === 'Hadir' ? 'font-bold text-emerald-700' :
                                                                      status === 'Sakit' ? 'font-bold text-blue-700' :
                                                                      status === 'Izin' ? 'font-bold text-indigo-700' :
                                                                      'font-bold text-rose-700'
                                                                    : 'text-gray-600 group-hover:text-gray-900'
                                                            }`}>
                                                                {status}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end items-center gap-3">
                        <SecondaryButton type="button" onClick={closeMassalModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processingMassal} className="shadow-lg shadow-indigo-200">
                            {processingMassal ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Menyimpan Data...
                                </>
                            ) : 'Simpan Absensi'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Individual */}
            <Modal show={isEditModalOpen} onClose={closeEditModal} maxWidth="md">
                <form onSubmit={submitIndividualAbsensi} className="flex flex-col">
                    <div className="p-6 border-b border-gray-100 bg-indigo-50/50 rounded-t-xl">
                        <h2 className="text-xl font-bold text-gray-900">Edit Absensi Siswa</h2>
                        <div className="mt-2 flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {currentSiswa?.nama_lengkap.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{currentSiswa?.nama_lengkap}</p>
                                <p className="text-xs text-gray-500 font-mono">{currentSiswa?.nis}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div>
                            <InputLabel htmlFor="status_kehadiran" value="Status Kehadiran" className="mb-2"/>
                            <div className="grid grid-cols-2 gap-3">
                                {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(status => (
                                    <label key={status} className={`cursor-pointer text-center p-3 rounded-xl border transition-all ${
                                        editData.status_kehadiran === status 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="status_edit" 
                                            value={status} 
                                            className="hidden" 
                                            checked={editData.status_kehadiran === status}
                                            onChange={(e) => setEditData("status_kehadiran", e.target.value)}
                                        />
                                        <span className="font-semibold text-sm">{status}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={editErrors.status_kehadiran} className="mt-2" />
                        </div>

                        {editData.status_kehadiran === 'Hadir' && (
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <InputLabel htmlFor="jam_masuk" value="Jam Masuk" />
                                    <TextInput 
                                        id="jam_masuk" 
                                        type="time" 
                                        value={editData.jam_masuk} 
                                        onChange={(e) => setEditData('jam_masuk', e.target.value)} 
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                                    />
                                    <InputError message={editErrors.jam_masuk} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="jam_pulang" value="Jam Pulang" />
                                    <TextInput 
                                        id="jam_pulang" 
                                        type="time" 
                                        value={editData.jam_pulang} 
                                        onChange={(e) => setEditData('jam_pulang', e.target.value)} 
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                                    />
                                    <InputError message={editErrors.jam_pulang} className="mt-2" />
                                </div>
                            </div>
                        )}
                        <div>
                            <InputLabel htmlFor="keterangan" value="Keterangan (Opsional)" />
                            <TextInput 
                                id="keterangan" 
                                value={editData.keterangan} 
                                onChange={(e) => setEditData('keterangan', e.target.value)} 
                                className="mt-1 block w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                                placeholder="Tambahkan catatan khusus..."
                            />
                            <InputError message={editErrors.keterangan} className="mt-2" />
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                        <SecondaryButton type="button" onClick={closeEditModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processingIndividual}>
                            {processingIndividual ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}