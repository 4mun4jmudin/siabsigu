import React, { useState, useMemo, useCallback } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { debounce } from 'lodash';
import {
    PlusCircleIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentIcon,
    DocumentArrowDownIcon,
    UsersIcon,
    EyeIcon,
    ClockIcon,
    CalendarDaysIcon,
    UserIcon,
    BookOpenIcon,
    AcademicCapIcon,
    TagIcon,
    PencilSquareIcon as EditPencilIcon,
    UserGroupIcon
} from '@heroicons/react/24/solid';

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4 border-l-4" style={{ borderColor: color }}>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}1A` }}>
            {React.cloneElement(icon, { className: "h-6 w-6", style: { color } })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value ?? '-'}</p>
        </div>
    </div>
);

// Komponen baris data pada detail (label + value + icon)
const DataRow = ({ label, value, icon }) => (
    <div className="flex items-start py-2 space-x-3">
        <div className="mt-1 text-gray-500">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-600">{label}</p>
            <p className="text-sm text-gray-900">{value ?? '-'}</p>
        </div>
    </div>
);

export default function Index({ auth, jurnals, stats, filters, guruOptions, kelasOptions }) {
    const { flash } = usePage().props;
    const { delete: destroy } = useForm();

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedJurnalDetail, setSelectedJurnalDetail] = useState(null);
    const [copied, setCopied] = useState(false);

    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setConfirmingDeletion(true);
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        setItemToDelete(null);
    };

    const deleteItem = (e) => {
        e.preventDefault();
        destroy(route('admin.jurnal-mengajar.destroy', itemToDelete.id_jurnal), {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    };

    const handleFilterChange = useCallback(debounce((key, value) => {
        const newFilters = { ...filters };
        if (value) {
            newFilters[key] = value;
        } else {
            delete newFilters[key];
        }
        router.get(route('admin.jurnal-mengajar.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    }, 300), [filters]);

    const handleViewDetail = (jurnal) => {
        setSelectedJurnalDetail(jurnal);
        setDetailModalOpen(true);
        setCopied(false);
    };

    const closeDetailModal = () => {
        setDetailModalOpen(false);
        setSelectedJurnalDetail(null);
        setCopied(false);
    };

    const statusBadgeStyle = {
        'Mengajar': 'bg-green-100 text-green-800',
        'Tugas': 'bg-blue-100 text-blue-800',
        'Digantikan': 'bg-yellow-100 text-yellow-800',
        'Kosong': 'bg-red-100 text-red-800',
    };

    const displayDate = (date) => {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        if (isNaN(d)) return date; // fallback: tampilkan apa adanya
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const displayTime = (time) => {
        return time ? time.slice(0, 5) : '-';
    }

    const buildExportUrl = (format) => {
        const filterObj = filters || {};
        const entries = Object.entries(filterObj)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, v]);
        const params = new URLSearchParams(entries).toString();
        const base = route(`admin.jurnal-mengajar.export.${format}`);
        return params ? `${base}?${params}` : base;
    };

    const copyMateri = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (err) {
            console.error('gagal menyalin:', err);
            setCopied(false);
        }
    };

    const printDetail = () => {
        // trik sederhana: buka window baru berisi markup ringkas untuk dicetak
        if (!selectedJurnalDetail) return;
        const html = `
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Detail Jurnal - ${selectedJurnalDetail.id_jurnal}</title>
                <style>body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding:20px; color:#111}</style>
            </head>
            <body>
                <h2>Detail Jurnal Mengajar</h2>
                <p><strong>Tanggal:</strong> ${displayDate(selectedJurnalDetail.tanggal)}</p>
                <p><strong>Waktu:</strong> ${displayTime(selectedJurnalDetail.jam_masuk_kelas)} - ${displayTime(selectedJurnalDetail.jam_keluar_kelas)}</p>
                <p><strong>Guru:</strong> ${selectedJurnalDetail.jadwal_mengajar?.guru?.nama_lengkap || '-'}</p>
                <p><strong>Kelas:</strong> ${selectedJurnalDetail.jadwal_mengajar?.kelas?.tingkat || '-'} ${selectedJurnalDetail.jadwal_mengajar?.kelas?.jurusan || ''}</p>
                <p><strong>Mapel:</strong> ${selectedJurnalDetail.jadwal_mengajar?.mapel?.nama_mapel || selectedJurnalDetail.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-'}</p>
                <h3>Materi Pembahasan</h3>
                <pre style="white-space:pre-wrap;line-height:1.4">${(selectedJurnalDetail.materi_pembahasan || '-')}</pre>
            </body>
            </html>
        `;
        const w = window.open('', '_blank', 'noopener,noreferrer');
        if (w) {
            w.document.write(html);
            w.document.close();
            setTimeout(() => w.print(), 300);
        } else {
            alert('Browser memblokir pop-up cetak. Izinkan pop-up dan coba lagi.');
        }
    };

    return (
        <AdminLayout user={auth.user} header="Jurnal Mengajar">
            <Head title="Jurnal Mengajar" />
            <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Jurnal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Jurnal" value={stats?.total_jurnal ?? 0} icon={<ClipboardDocumentIcon />} color="#6b7280" />
                        <StatCard label="Mengajar" value={stats?.mengajar ?? 0} icon={<ClipboardDocumentCheckIcon />} color="#22c55e" />
                        <StatCard label="Digantikan" value={stats?.digantikan ?? 0} icon={<UsersIcon />} color="#f97316" />
                        <StatCard label="Kosong" value={stats?.kosong ?? 0} icon={<TrashIcon />} color="#ef4444" />
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">Daftar Jurnal Mengajar</h3>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={buildExportUrl('excel')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-500 transition"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Ekspor Excel
                            </a>
                            <a
                                href={buildExportUrl('pdf')}
                                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-500 transition"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Ekspor PDF
                            </a>
                            <Link href={route('admin.jurnal-mengajar.create')} className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 transition">
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                                Tambah Jurnal
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <InputLabel htmlFor="tanggal_mulai" value="Tanggal Mulai" />
                            <TextInput type="date" id="tanggal_mulai" value={filters.tanggal_mulai || ''} onChange={(e) => handleFilterChange('tanggal_mulai', e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div className="md:col-span-1">
                            <InputLabel htmlFor="tanggal_selesai" value="Tanggal Selesai" />
                            <TextInput type="date" id="tanggal_selesai" value={filters.tanggal_selesai || ''} onChange={(e) => handleFilterChange('tanggal_selesai', e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div className="md:col-span-1 relative">
                            <InputLabel htmlFor="search" value="Cari Jurnal" />
                            <div className="relative mt-1">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <TextInput
                                    id="search"
                                    type="text"
                                    defaultValue={filters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Cari guru, kelas, atau materi..."
                                    className="block w-full pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto mt-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru Pengajar</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru Pengganti</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jurnals && jurnals.length > 0 ? (
                                    jurnals.map(jurnal => (
                                        <tr key={jurnal.id_jurnal}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{displayDate(jurnal.tanggal)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jadwal_mengajar?.kelas
                                                    ? `${jurnal.jadwal_mengajar.kelas.tingkat} ${jurnal.jadwal_mengajar.kelas.jurusan}`
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jadwal_mengajar?.mapel?.nama_mapel || jurnal.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.jadwal_mengajar?.guru?.nama_lengkap || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {displayTime(jurnal.jam_masuk_kelas)} - {displayTime(jurnal.jam_keluar_kelas)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadgeStyle[jurnal.status_mengajar]}`}>
                                                    {jurnal.status_mengajar}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {jurnal.guru_pengganti?.nama_lengkap || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                                                {jurnal.materi_pembahasan || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end">
                                                <button onClick={() => handleViewDetail(jurnal)} className="text-gray-600 hover:text-gray-900 mr-3" title="Lihat detail">
                                                    <EyeIcon className="h-5 w-5 inline-block" />
                                                </button>
                                                <Link href={route('admin.jurnal-mengajar.edit', jurnal.id_jurnal)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
                                                    <PencilIcon className="h-5 w-5 inline-block" />
                                                </Link>
                                                <button onClick={() => openDeleteModal(jurnal)} className="text-red-600 hover:text-red-900" title="Hapus">
                                                    <TrashIcon className="h-5 w-5 inline-block" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12 text-gray-500">Tidak ada jurnal mengajar yang ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={confirmingDeletion} onClose={closeDeleteModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus jurnal ini?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Jurnal mengajar untuk mata pelajaran <strong>{itemToDelete?.jadwal_mengajar?.mapel?.nama_mapel ?? '-'}</strong> pada tanggal <strong>{itemToDelete?.tanggal ?? '-'}</strong> akan dihapus secara permanen.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeDeleteModal}>Batal</SecondaryButton>
                        <DangerButton onClick={deleteItem}>Hapus</DangerButton>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail (Ditingkatkan UI) */}
            <Modal show={isDetailModalOpen} onClose={closeDetailModal} maxWidth="3xl">
                <div className="p-6">
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Detail Jurnal Mengajar</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {selectedJurnalDetail ? `${displayDate(selectedJurnalDetail.tanggal)} • ${displayTime(selectedJurnalDetail.jam_masuk_kelas)} - ${displayTime(selectedJurnalDetail.jam_keluar_kelas)}` : ''}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={printDetail} className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-gray-50" title="Cetak detail">
                                <DocumentArrowDownIcon className="h-4 w-4" />
                                Cetak
                            </button>
                            <button onClick={closeDetailModal} className="text-gray-400 hover:text-gray-600 p-2 rounded" title="Tutup">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {selectedJurnalDetail && (
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Kolom kiri: ringkasan utama */}
                            <div className="md:col-span-1 bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">
                                        {selectedJurnalDetail.jadwal_mengajar?.guru?.nama_lengkap ? selectedJurnalDetail.jadwal_mengajar.guru.nama_lengkap.split(' ').map(n => n[0]).slice(0,2).join('') : 'GP'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{selectedJurnalDetail.jadwal_mengajar?.guru?.nama_lengkap ?? '-'}</p>
                                        <p className="text-xs text-gray-500">{selectedJurnalDetail.jadwal_mengajar?.kelas ? `${selectedJurnalDetail.jadwal_mengajar.kelas.tingkat} ${selectedJurnalDetail.jadwal_mengajar.kelas.jurusan}` : '-'}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <DataRow label="Tanggal" value={displayDate(selectedJurnalDetail.tanggal)} icon={<CalendarDaysIcon className="w-5 h-5" />} />
                                    <DataRow label="Waktu" value={`${displayTime(selectedJurnalDetail.jam_masuk_kelas)} - ${displayTime(selectedJurnalDetail.jam_keluar_kelas)}`} icon={<ClockIcon className="w-5 h-5" />} />
                                    <DataRow label="Mata Pelajaran" value={selectedJurnalDetail.jadwal_mengajar?.mapel?.nama_mapel || selectedJurnalDetail.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-'} icon={<BookOpenIcon className="w-5 h-5" />} />
                                    <div className="mt-2">
                                        <p className="text-sm font-semibold text-gray-600">Status</p>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusBadgeStyle[selectedJurnalDetail.status_mengajar]}`}>
                                                {selectedJurnalDetail.status_mengajar}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedJurnalDetail.status_mengajar === 'Digantikan' && (
                                        <DataRow label="Guru Pengganti" value={selectedJurnalDetail.guru_pengganti?.nama_lengkap || '-'} icon={<UserGroupIcon className="w-5 h-5" />} />
                                    )}
                                </div>
                            </div>

                            {/* Kolom kanan: materi, keterangan dan metadata */}
                            <div className="md:col-span-2 bg-white border rounded-lg p-4 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Materi Pembahasan</h3>
                                        <p className="text-sm text-gray-500">(Tekan salin untuk menyalin isi materi)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => copyMateri(selectedJurnalDetail.materi_pembahasan || '')}
                                            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                                            title="Salin materi"
                                        >
                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                            {copied ? 'Disalin!' : 'Salin'}
                                        </button>
                                        <Link href={route('admin.jurnal-mengajar.edit', selectedJurnalDetail.id_jurnal)} className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500">
                                            <PencilIcon className="h-4 w-4" />
                                            Edit
                                        </Link>
                                    </div>
                                </div>

                                <div className="prose max-w-none break-words whitespace-pre-wrap text-sm text-gray-900">
                                    {selectedJurnalDetail.materi_pembahasan ? (
                                        <div>{selectedJurnalDetail.materi_pembahasan}</div>
                                    ) : (
                                        <div className="text-gray-500 italic">Tidak ada materi tercatat.</div>
                                    )}
                                </div>

                                <div className="pt-2 border-t">
                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Informasi Tambahan</h4>
                                    <DataRow label="Diinput oleh" value={selectedJurnalDetail.penginputManual?.nama_lengkap || '-'} icon={<UserIcon className="w-5 h-5" />} />
                                    <DataRow label="Keterangan / Catatan" value={selectedJurnalDetail.keterangan || '-'} icon={<EditPencilIcon className="w-5 h-5" />} />
                                    <div className="mt-3 text-xs text-gray-500">
                                        <p>Catatan: Semua data ditampilkan sebagaimana tersimpan — jika ada field kosong, periksa entri di form input.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeDetailModal}>Tutup</SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
