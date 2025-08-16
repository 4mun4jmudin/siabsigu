// src/Pages/Admin/Absensi/Index.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {
    UserGroupIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    UsersIcon,
} from '@heroicons/react/24/solid';
import debounce from 'lodash.debounce';

// ----------------- Helper kecil -----------------
const sanitizeFilters = (filtersObj = {}) => {
    const cleaned = {};
    Object.entries(filtersObj).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        // treat "null" string or "undefined" string as empty
        if (typeof v === 'string' && v.trim() === '') return;
        cleaned[k] = v;
    });
    return cleaned;
};

const parseQueryStringToObj = (search) => {
    const params = new URLSearchParams(search || window.location.search);
    const obj = {};
    for (const [k, v] of params.entries()) {
        obj[k] = v;
    }
    return obj;
};

const shallowEqual = (a = {}, b = {}) => {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
        if (String(a[k]) !== String(b[k])) return false;
    }
    return true;
};

// ----------------- Komponen UI kecil -----------------
const StatCard = ({ label, value, icon, color, detail }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center border-l-4" style={{ borderColor: color }}>
        <div className="flex-shrink-0 mr-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${color}1A` }}>
                {React.cloneElement(icon, { className: "h-5 w-5", style: { color } })}
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            {detail && <p className="text-xs text-gray-400">{detail}</p>}
        </div>
    </div>
);

const StatusBadge = ({ status, izinTerkait }) => {
    if (izinTerkait) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-200">Surat Izin</span>;
    if (!status) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Belum Diinput</span>;
    const styles = {
        Hadir: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200',
        Sakit: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200',
        Izin: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200',
        Alfa: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
};

// ----------------- Komponen Halaman -----------------
export default function Index({ auth, tahunAjaranOptions, kelasOptions, siswaWithAbsensi, stats, filters }) {
   // State untuk modal
    const [isMassalModalOpen, setIsMassalModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentSiswa, setCurrentSiswa] = useState(null);

    // ✅ State lokal untuk menampung nilai dari form filter.
    // Diinisialisasi sekali dari props `filters` yang dikirim server.
    const [localFilters, setLocalFilters] = useState({
        id_tahun_ajaran: filters.id_tahun_ajaran || '',
        id_kelas: filters.id_kelas || '',
        tanggal: filters.tanggal || '',
        search: filters.search || '',
    });

    // Ref untuk menandai render pertama agar useEffect filter tidak berjalan saat mount
    const isFirstRender = useRef(true);

    // Form untuk input absensi massal
    const { data: massalData, setData: setMassalData, post: postMassal, processing: processingMassal } = useForm({
        tanggal: filters?.tanggal || new Date().toISOString().slice(0, 10),
        id_kelas: filters?.id_kelas || '',
        absensi: [],
    });

    // Form untuk edit absensi individual
    const { data: editData, setData: setEditData, post: postIndividual, processing: processingIndividual, errors: editErrors, reset: resetEditForm } = useForm({
        tanggal: filters?.tanggal || new Date().toISOString().slice(0, 10),
        id_siswa: '',
        status_kehadiran: 'Hadir',
        jam_masuk: '',
        jam_pulang: '',
        keterangan: '',
    });

    // Mengisi data absensi awal untuk modal massal saat data siswa berubah
    useEffect(() => {
        const initialAbsensi = (siswaWithAbsensi || []).map(siswa => ({
            id_siswa: siswa.id_siswa,
            status_kehadiran: siswa.status_final || siswa.absensi?.status_kehadiran || 'Hadir',
        }));
        setMassalData('absensi', initialAbsensi);
    }, [siswaWithAbsensi]);

    // Fungsi filter yang di-debounce untuk dikirim ke server
    const debouncedFilter = useMemo(() => {
        return debounce((newFilters) => {
            const sanitized = sanitizeFilters(newFilters);
            
            // Hapus key 'search' jika kosong agar URL lebih bersih
            if (sanitized.search === '') {
                delete sanitized.search;
            }

            console.log("Mengirim filter ke server:", sanitized);

            // Menggunakan Inertia router untuk membuat request GET dengan parameter filter baru
            router.get(route('admin.absensi-siswa.index'), sanitized, {
                preserveState: true, // `true` agar state lain (seperti modal) tidak hilang
                preserveScroll: true,
                replace: true, // `true` agar tidak menambah history browser
            });
        }, 300); // Delay 300ms setelah pengguna berhenti mengetik/mengubah
    }, []);

    // Membatalkan debounce saat komponen di-unmount untuk mencegah memory leak
    useEffect(() => {
        return () => debouncedFilter.cancel();
    }, [debouncedFilter]);

    // ✅ Satu-satunya useEffect yang memicu pengiriman filter ke server.
    // Berjalan setiap kali `localFilters` berubah (kecuali saat render pertama).
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        debouncedFilter(localFilters);
    }, [localFilters, debouncedFilter]);

    // Handler untuk mengubah nilai pada state `localFilters`
    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    // Massal handlers
    const openMassalModal = () => {
        setMassalData('tanggal', localFilters.tanggal || massalData.tanggal);
        setMassalData('id_kelas', localFilters.id_kelas || massalData.id_kelas);
        setIsMassalModalOpen(true);
    };
    const closeMassalModal = () => setIsMassalModalOpen(false);

    const handleStatusChange = (id_siswa, status_kehadiran) => {
        const list = (massalData.absensi || []).map(item => item.id_siswa === id_siswa ? { ...item, status_kehadiran } : item);
        setMassalData('absensi', list);
    };
    const handleSetAllHadir = () => {
        const list = (massalData.absensi || []).map(item => ({ ...item, status_kehadiran: 'Hadir' }));
        setMassalData('absensi', list);
    };
    const submitMassalAbsensi = (e) => {
        e.preventDefault();
        // small guard
        if (!massalData.id_kelas || !massalData.tanggal) {
            alert('Pastikan Kelas dan Tanggal terpilih sebelum menyimpan.');
            return;
        }
        postMassal(route('admin.absensi-siswa.store.massal'), {
            onSuccess: () => closeMassalModal(),
            onError: () => console.error('Gagal simpan massal'),
        });
    };

    // Individual handlers
    const openEditModal = (siswa) => {
        resetEditForm();
        setCurrentSiswa(siswa);
        setEditData({
            tanggal: localFilters.tanggal || editData.tanggal,
            id_siswa: siswa.id_siswa,
            status_kehadiran: siswa.status_final || siswa.absensi?.status_kehadiran || 'Hadir',
            jam_masuk: siswa.absensi?.jam_masuk || '',
            jam_pulang: siswa.absensi?.jam_pulang || '',
            keterangan: siswa.absensi?.keterangan || '',
        });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);
    const submitIndividualAbsensi = (e) => {
        e.preventDefault();
        postIndividual(route('admin.absensi-siswa.update.individual'), {
            onSuccess: () => closeEditModal(),
            onError: () => console.error('Gagal simpan individual'),
        });
    };

    const tanggalTampilan = new Date((localFilters.tanggal || filters.tanggal) + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <AdminLayout user={auth.user} header="Absensi Siswa">
            <Head title="Absensi Siswa" />

            <div className="space-y-6">
                {/* Header & Filter */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label htmlFor="tahun_ajaran" className="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                            <select id="tahun_ajaran" value={localFilters.id_tahun_ajaran || ''} onChange={(e) => handleFilterChange('id_tahun_ajaran', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {tahunAjaranOptions.map(ta => (
                                    <option key={ta.id_tahun_ajaran} value={ta.id_tahun_ajaran}>{ta.tahun_ajaran} - {ta.semester}</option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label htmlFor="kelas" className="block text-sm font-medium text-gray-700">Kelas</label>
                            <select id="kelas" value={localFilters.id_kelas || ''} onChange={(e) => handleFilterChange('id_kelas', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {kelasOptions.map(kelas => (
                                    <option key={kelas.id_kelas} value={kelas.id_kelas}>
                                        {kelas.tingkat} {kelas.jurusan} (Wali: {kelas.wali_kelas?.nama_lengkap || 'N/A'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-1">
                            <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal</label>
                            <input type="date" id="tanggal" value={localFilters.tanggal || ''} onChange={(e) => handleFilterChange('tanggal', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>

                        <div className="lg:col-span-1">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Cari Siswa</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input type="text" id="search" value={localFilters.search || ''} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="NIS / Nama..." className="block w-full pl-10 border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Siswa" value={stats.total} icon={<UsersIcon />} color="#6b7280" />
                    <StatCard label="Hadir" value={stats.hadir} icon={<CheckCircleIcon />} color="#22c55e" />
                    <StatCard label="Sakit" value={stats.sakit} icon={<ExclamationTriangleIcon />} color="#eab308" />
                    <StatCard label="Izin" value={stats.izin} icon={<InformationCircleIcon />} color="#3b82f6" />
                    <StatCard label="Alfa" value={stats.alfa} icon={<XCircleIcon />} color="#ef4444" />
                    <StatCard label="Belum Diinput" value={stats.belum_diinput} icon={<ClipboardDocumentListIcon />} color="#f97316" detail={`${stats.terlambat} Terlambat`} />
                </div>

                {/* Tabel */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Daftar Kehadiran - {tanggalTampilan}</h2>
                            <PrimaryButton onClick={openMassalModal} disabled={(siswaWithAbsensi || []).length === 0}>
                                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                                Input Absensi Kelas
                            </PrimaryButton>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['NIS', 'Nama Siswa', 'Status', 'Metode', 'Jam Masuk', 'Keterlambatan', 'Keterangan', 'Aksi'].map(head => (
                                            <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(siswaWithAbsensi || []).length > 0 ? siswaWithAbsensi.map(siswa => (
                                        <tr key={siswa.id_siswa} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.nis}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{siswa.nama_lengkap}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={siswa.status_final} izinTerkait={siswa.izin_terkait} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.absensi?.metode_absen || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.absensi?.jam_masuk || '-'}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
  <div className="flex items-center">
    <span className="mr-3">{siswa.absensi?.jam_masuk || '-'}</span>

    {/* waktu_status dikirim dari controller */}
    { (siswa.waktu_status ?? '-') === 'Tepat Waktu' && (
      <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 flex items-center">
        <ClockIcon className="h-3 w-3 mr-1" />
        Tepat Waktu
      </span>
    )}

    { (siswa.waktu_status ?? '-').startsWith('Terlambat') && (
      <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 flex items-center">
        <ClockIcon className="h-3 w-3 mr-1" />
        {siswa.waktu_status}
      </span>
    )}

    { (siswa.waktu_status ?? '-') === 'Belum Diinput' && (
      <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Belum Diinput</span>
    )}

    { (siswa.waktu_status ?? '-') === '-' && (
      <span className="ml-1 text-xs text-gray-400">-</span>
    )}
  </div>
</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.absensi?.keterangan || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => openEditModal(siswa)} className="text-indigo-600 hover:text-indigo-900" title="Edit Individual">
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12 text-gray-500">
                                                <p className="font-semibold">Tidak ada data siswa.</p>
                                                <p className="text-sm">Silakan pilih kelas lain atau periksa data master siswa.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Massal */}
            <Modal show={isMassalModalOpen} onClose={closeMassalModal} maxWidth="3xl">
                <form onSubmit={submitMassalAbsensi} className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Input Absensi Kelas</h2>
                    <p className="text-sm text-gray-500 mb-4">Tandai status kehadiran untuk setiap siswa pada tanggal {tanggalTampilan}.</p>
                    <div className="mb-4">
                        <SecondaryButton type="button" onClick={handleSetAllHadir}>Tandai Semua Hadir</SecondaryButton>
                    </div>
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Nama Siswa</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(massalData.absensi || []).map((absen, index) => (
                                    <tr key={absen.id_siswa}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{siswaWithAbsensi[index]?.nama_lengkap || absen.id_siswa}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <fieldset className="flex items-center gap-x-4">
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
                                                            disabled={!!siswaWithAbsensi[index]?.izin_terkait && siswaWithAbsensi[index]?.izin_terkait.jenis_izin !== status}
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
                            <select id="status_kehadiran" value={editData.status_kehadiran} onChange={(e) => setEditData('status_kehadiran', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
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
