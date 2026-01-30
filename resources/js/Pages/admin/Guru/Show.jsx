import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeftIcon, 
    PencilIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    MagnifyingGlassIcon,
    IdentificationIcon,
    CalendarDaysIcon,
    ClockIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// --- KONFIGURASI TAB ---
const TABS = [
  { id: 'informasi', label: 'Informasi Umum', icon: IdentificationIcon },
  { id: 'jadwal', label: 'Jadwal Mengajar', icon: CalendarDaysIcon },
  { id: 'riwayat', label: 'Riwayat Absensi', icon: ClockIcon },
  { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookOpenIcon },
];

// --- HELPER STYLE STATUS ---
const statusColor = {
  Aktif: 'bg-green-100 text-green-800 border-green-200',
  'Tidak Aktif': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Pensiun: 'bg-red-100 text-red-800 border-red-200',
};

// --- HELPER FORMAT TANGGAL ---
function formatDateISO(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
        day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' 
    });
  } catch (e) {
    return dateStr || '-';
  }
}

function timeSlice(t) {
  return t ? t.slice(0, 5) : '-';
}

// --- KOMPONEN KECIL ---
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
    {children}
  </span>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
    <div className="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
  </div>
);

export default function Show({ auth, guru, jadwalMengajar = {}, riwayatAbsensi = [], jurnalMengajar = [] }) {
  const [activeTab, setActiveTab] = useState('informasi');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page saat tab atau query berubah
  useEffect(() => {
    setPage(1); 
  }, [activeTab, query]);

  // Navigasi Keyboard untuk Tab
  useEffect(() => {
    function onKey(e) {
      if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
        const idx = TABS.findIndex(t => t.id === activeTab);
        const nextIdx = e.key === 'ArrowRight' 
            ? (idx + 1) % TABS.length 
            : (idx - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[nextIdx].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab]);

  // Urutkan Hari Jadwal
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const sortedDays = useMemo(() => {
    return Object.keys(jadwalMengajar || {}).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
  }, [jadwalMengajar]);

  // Filter Data Absensi
  const filteredAbsensi = useMemo(() => {
    if (!riwayatAbsensi) return [];
    return riwayatAbsensi.filter(a => {
      const q = query.toLowerCase();
      return (
        a.status_kehadiran?.toLowerCase().includes(q) ||
        a.keterangan?.toLowerCase().includes(q) ||
        (a.tanggal && formatDateISO(a.tanggal).toLowerCase().includes(q))
      );
    });
  }, [riwayatAbsensi, query]);

  // Filter Data Jurnal
  const filteredJurnal = useMemo(() => {
    if (!jurnalMengajar) return [];
    return jurnalMengajar.filter(j => {
      const q = query.toLowerCase();
      return (
        j.materi_pembahasan?.toLowerCase().includes(q) ||
        j.jadwal_mengajar?.mata_pelajaran?.nama_mapel?.toLowerCase().includes(q) ||
        (j.tanggal && formatDateISO(j.tanggal).toLowerCase().includes(q))
      );
    });
  }, [jurnalMengajar, query]);

  // Helper Pagination Client-side
  function paginate(arr) {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  }

  // Fallback Avatar
  const avatarUrl = guru.foto_profil
    ? `/storage-public/${guru.foto_profil}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.nama_lengkap)}&color=7F9CF5&background=EBF4FF&size=256`;

  return (
    <AdminLayout user={auth.user} header={`Detail Guru`}>
      <Head title={`Detail ${guru.nama_lengkap}`} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER PROFILE CARD --- */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          {/* Cover Background (Optional styling) */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-end -mt-12 mb-4 sm:mb-0 justify-between gap-4">
                <div className="flex items-end gap-4">
                    <div className="relative">
                        <img 
                            src={avatarUrl} 
                            alt={guru.nama_lengkap} 
                            className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-white shadow-md bg-white" 
                        />
                        <span className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${guru.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div className="mb-1 sm:mb-3">
                        <h1 className="text-2xl font-bold text-gray-900">{guru.nama_lengkap}</h1>
                        <p className="text-sm text-gray-500 font-medium">NIP: {guru.nip || '-'}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Link href={route('admin.guru.index')} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        <ArrowLeftIcon className="h-4 w-4" /> Kembali
                    </Link>
                    <Link href={route('admin.guru.edit', guru.id_guru)} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm">
                        <PencilIcon className="h-4 w-4" /> Edit Profil
                    </Link>
                </div>
            </div>

            {/* Badges Info Singkat */}
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <Pill className={statusColor[guru.status] || 'bg-gray-100 text-gray-800'}>{guru.status || '-'}</Pill>
                <Pill className="bg-blue-50 text-blue-700 border-blue-100">ID: {guru.id_guru}</Pill>
                <Pill className="bg-purple-50 text-purple-700 border-purple-100">
                    {guru.pengguna?.username ? `Akun: ${guru.pengguna.username}` : 'Tanpa Akun Login'}
                </Pill>
                {guru.kelas_wali && (
                    <Pill className="bg-orange-50 text-orange-700 border-orange-100">
                        Wali Kelas: {guru.kelas_wali.tingkat} {guru.kelas_wali.jurusan}
                    </Pill>
                )}
            </div>
          </div>
        </div>

        {/* --- TABS NAVIGATION & CONTENT --- */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden min-h-[500px]">
          
          {/* Tab Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Desktop Tabs */}
                <nav className="hidden sm:flex space-x-1" aria-label="Tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                    ${isActive 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Mobile Tab Select */}
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Pilih Tab</label>
                    <select
                        id="tabs"
                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                    >
                        {TABS.map((tab) => (
                            <option key={tab.id} value={tab.id}>{tab.label}</option>
                        ))}
                    </select>
                </div>

                {/* Search Bar (Hanya muncul di tab list data) */}
                {activeTab !== 'informasi' && activeTab !== 'jadwal' && (
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Cari data..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                )}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 bg-gray-50/30">
            <AnimatePresence mode='wait'>
                
                {/* TAB 1: INFORMASI UMUM */}
                {activeTab === 'informasi' && (
                    <motion.div
                        key="informasi"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                                <IdentificationIcon className="h-5 w-5 text-gray-400" />
                                Detail Pribadi
                            </h3>
                            <dl className="grid grid-cols-1 gap-y-4 text-sm">
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">ID Guru</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 font-mono">{guru.id_guru}</dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">NIP</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900">{guru.nip || '-'}</dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Jenis Kelamin</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900">{guru.jenis_kelamin}</dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2">
                                        <Pill className={statusColor[guru.status]}>{guru.status}</Pill>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                                <IdentificationIcon className="h-5 w-5 text-gray-400" />
                                Data Sistem
                            </h3>
                            <dl className="grid grid-cols-1 gap-y-4 text-sm">
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Barcode ID</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded inline-block w-fit">
                                        {guru.barcode_id || '-'}
                                    </dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Sidik Jari</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2">
                                        {guru.sidik_jari_template ? (
                                            <span className="text-green-600 flex items-center gap-1 font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Terdaftar
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Belum didaftarkan</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Wali Kelas</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900">
                                        {guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan}` : '-'}
                                    </dd>
                                </div>
                                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="font-medium text-gray-500">Terdaftar Sejak</dt>
                                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900">{guru.created_at ? formatDateISO(guru.created_at) : '-'}</dd>
                                </div>
                            </dl>
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: JADWAL MENGAJAR */}
                {activeTab === 'jadwal' && (
                    <motion.div
                        key="jadwal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {sortedDays.length === 0 && <EmptyState title="Jadwal Kosong" subtitle="Belum ada jadwal mengajar yang tersedia untuk guru ini." />}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedDays.map(hari => (
                                <div key={hari} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                        <h4 className="font-bold text-gray-800">{hari}</h4>
                                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                            {jadwalMengajar[hari].length} Mapel
                                        </span>
                                    </div>
                                    <ul className="divide-y divide-gray-100">
                                        {jadwalMengajar[hari].map(item => (
                                            <li key={item.id_jadwal} className="p-4 hover:bg-gray-50 transition">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-semibold text-gray-900">{item.mata_pelajaran.nama_mapel}</span>
                                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {timeSlice(item.jam_mulai)} - {timeSlice(item.jam_selesai)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span>Kelas:</span>
                                                    <span className="font-medium text-gray-700 bg-yellow-50 px-1.5 rounded border border-yellow-100">
                                                        {item.kelas.tingkat} {item.kelas.jurusan}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: RIWAYAT ABSENSI */}
                {activeTab === 'riwayat' && (
                    <motion.div
                        key="riwayat"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {filteredAbsensi.length === 0 ? (
                            <EmptyState title="Tidak ada data" subtitle="Belum ada riwayat absensi yang tercatat." />
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paginate(filteredAbsensi).map((item, idx) => (
                                                <tr key={item.id_absensi || idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                        {formatDateISO(item.tanggal)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full 
                                                            ${item.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-800' : 
                                                              item.status_kehadiran === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                                                              item.status_kehadiran === 'Izin' ? 'bg-yellow-100 text-yellow-800' : 
                                                              'bg-red-100 text-red-800'}`}>
                                                            {item.status_kehadiran}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                        {timeSlice(item.jam_masuk)} - {timeSlice(item.jam_pulang)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {item.keterangan || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                            Sebelumnya
                                        </button>
                                        <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= filteredAbsensi.length} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                            Selanjutnya
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Menampilkan <span className="font-medium">{Math.min((page - 1) * pageSize + 1, filteredAbsensi.length)}</span> sampai <span className="font-medium">{Math.min(page * pageSize, filteredAbsensi.length)}</span> dari <span className="font-medium">{filteredAbsensi.length}</span> data
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                                    <span className="sr-only">Previous</span>
                                                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= filteredAbsensi.length} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                                    <span className="sr-only">Next</span>
                                                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* TAB 4: JURNAL MENGAJAR */}
                {activeTab === 'jurnal' && (
                    <motion.div
                        key="jurnal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {filteredJurnal.length === 0 ? (
                            <EmptyState title="Jurnal Kosong" subtitle="Belum ada catatan jurnal mengajar." />
                        ) : (
                            <div className="space-y-4">
                                {paginate(filteredJurnal).map((item, idx) => (
                                    <div key={item.id_jurnal || idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{item.jadwal_mengajar?.mata_pelajaran?.nama_mapel || 'Mapel Tidak Dikenal'}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{formatDateISO(item.tanggal)} • {item.jadwal_mengajar?.kelas?.tingkat} {item.jadwal_mengajar?.kelas?.jurusan}</p>
                                            </div>
                                            <Pill className="bg-blue-50 text-blue-700 border-blue-100 self-start">
                                                Pertemuan
                                            </Pill>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                                            <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Materi Pembahasan:</p>
                                            {item.materi_pembahasan || '-'}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Simple Pagination for Jurnal */}
                                <div className="flex justify-center gap-2 mt-4">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50">Prev</button>
                                    <span className="px-3 py-1 text-sm text-gray-500">Hal. {page}</span>
                                    <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= filteredJurnal.length} className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50">Next</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}