import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal'; // <-- Import Modal
import { Head, Link, useForm } from '@inertiajs/react'; // <-- Import useForm
import { User, Users, Calendar, Edit, Trash2, Printer, KeyRound, ChevronLeft, BookOpen } from 'lucide-react';

// --- Komponen-komponen UI ---

const StatusBadge = ({ status }) => {
    const statusMap = {
        Hadir: 'bg-green-100 text-green-800',
        Sakit: 'bg-yellow-100 text-yellow-800',
        Izin: 'bg-blue-100 text-blue-800',
        Alfa: 'bg-red-100 text-red-800',
        Aktif: 'bg-green-100 text-green-800',
        Lulus: 'bg-blue-100 text-blue-800',
        Pindah: 'bg-yellow-100 text-yellow-800',
        'Drop Out': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const TabButton = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
        {children}
    </button>
);

// --- Komponen untuk setiap Tab ---

const BiodataTab = ({ siswa }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pribadi</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Nama Panggilan</dt><dd className="mt-1 text-sm text-gray-900">{siswa.nama_panggilan || '-'}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Jenis Kelamin</dt><dd className="mt-1 text-sm text-gray-900">{siswa.jenis_kelamin}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">NIK</dt><dd className="mt-1 text-sm text-gray-900">{siswa.nik}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Nomor KK</dt><dd className="mt-1 text-sm text-gray-900">{siswa.nomor_kk}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Tempat, Tanggal Lahir</dt><dd className="mt-1 text-sm text-gray-900">{siswa.tempat_lahir}, {new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Agama</dt><dd className="mt-1 text-sm text-gray-900">{siswa.agama}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Alamat Lengkap</dt><dd className="mt-1 text-sm text-gray-900">{siswa.alamat_lengkap}</dd></div>
        </dl>
        <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akademik</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Wali Kelas</dt><dd className="mt-1 text-sm text-gray-900">{siswa.kelas?.wali_kelas?.nama_lengkap || 'Belum diatur'}</dd></div>
            </dl>
        </div>
    </div>
);

const ParentTab = ({ parents }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parents.length > 0 ? parents.map(parent => (
            <div key={parent.id_wali} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-full mr-3"><Users className="h-6 w-6 text-blue-600"/></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{parent.nama_lengkap}</h3>
                        <p className="text-sm font-medium text-blue-600">{parent.hubungan}</p>
                    </div>
                </div>
                <dl className="space-y-3">
                    <div><dt className="text-sm font-medium text-gray-500">No. Telepon (WA)</dt><dd className="mt-1 text-sm text-gray-900">{parent.no_telepon_wa}</dd></div>
                    <div><dt className="text-sm font-medium text-gray-500">Pekerjaan</dt><dd className="mt-1 text-sm text-gray-900">{parent.pekerjaan || '-'}</dd></div>
                    <div><dt className="text-sm font-medium text-gray-500">Pendidikan Terakhir</dt><dd className="mt-1 text-sm text-gray-900">{parent.pendidikan_terakhir || '-'}</dd></div>
                </dl>
            </div>
        )) : <p className="text-sm text-gray-500 col-span-full">Tidak ada data orang tua/wali ditemukan.</p>}
    </div>
);

const AttendanceTab = ({ attendance }) => {
    const hadir = attendance.filter(d => d.status_kehadiran === 'Hadir').length;
    const sakit = attendance.filter(d => d.status_kehadiran === 'Sakit').length;
    const izin = attendance.filter(d => d.status_kehadiran === 'Izin').length;
    const alfa = attendance.filter(d => d.status_kehadiran === 'Alfa').length;

    return (
        <div className="bg-white rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekap Absensi (30 Hari Terakhir)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div><p className="text-2xl font-bold text-green-600">{hadir}</p><p className="text-sm font-medium text-gray-500">Hadir</p></div>
                    <div><p className="text-2xl font-bold text-yellow-600">{sakit}</p><p className="text-sm font-medium text-gray-500">Sakit</p></div>
                    <div><p className="text-2xl font-bold text-blue-600">{izin}</p><p className="text-sm font-medium text-gray-500">Izin</p></div>
                    <div><p className="text-2xl font-bold text-red-600">{alfa}</p><p className="text-sm font-medium text-gray-500">Alfa</p></div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendance.map((att) => (
                            <tr key={att.id_absensi}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(att.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={att.status_kehadiran} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.keterangan || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Komponen Utama ---
export default function Show({ auth, siswa, orangTuaWali, riwayatAbsensi }) {
    const [activeTab, setActiveTab] = useState('biodata');
    const { delete: destroy, processing } = useForm();
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);

    const confirmDeletion = (e) => {
        e.preventDefault();
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
    };

    const deleteItem = (e) => {
        e.preventDefault();
        destroy(route('siswa.destroy', siswa.id_siswa), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <AdminLayout user={auth.user} header={`Detail Siswa: ${siswa.nama_lengkap}`}>
            <Head title={`Detail ${siswa.nama_lengkap}`} />
            
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link href={route('siswa.index')} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2">
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Kembali ke Daftar Siswa
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Siswa</h1>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                        <img src={siswa.foto_profil ? `/storage/${siswa.foto_profil}` : `https://ui-avatars.com/api/?name=${siswa.nama_lengkap.replace(/\s/g, "+")}`} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm" />
                        <div className="flex-grow text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start">
                                <h2 className="text-2xl font-bold text-gray-800">{siswa.nama_lengkap}</h2>
                                <div className="ml-3"><StatusBadge status={siswa.status} /></div>
                            </div>
                            <p className="text-gray-500 mt-1">NIS: {siswa.nis} | NISN: {siswa.nisn}</p>
                            <p className="text-gray-600 font-medium mt-2">{siswa.kelas.tingkat} {siswa.kelas.jurusan}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"><Printer size={20} /></button>
                            <Link href={route('siswa.edit', siswa.id_siswa)} className="p-2 bg-yellow-100 rounded-lg text-yellow-700 hover:bg-yellow-200"><Edit size={20} /></Link>
                            <button onClick={confirmDeletion} className="p-2 bg-red-100 rounded-lg text-red-700 hover:bg-red-200"><Trash2 size={20} /></button>
                        </div>
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton active={activeTab === 'biodata'} onClick={() => setActiveTab('biodata')}>Biodata</TabButton>
                        <TabButton active={activeTab === 'wali'} onClick={() => setActiveTab('wali')}>Orang Tua/Wali</TabButton>
                        <TabButton active={activeTab === 'absensi'} onClick={() => setActiveTab('absensi')}>Riwayat Absensi</TabButton>
                        <TabButton active={activeTab === 'akademik'} onClick={() => setActiveTab('akademik')}>Nilai & Akademik</TabButton>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'biodata' && <BiodataTab siswa={siswa} />}
                    {activeTab === 'wali' && <ParentTab parents={orangTuaWali} />}
                    {activeTab === 'absensi' && <AttendanceTab attendance={riwayatAbsensi} />}
                    {activeTab === 'akademik' && <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-md">Fitur Nilai & Akademik sedang dalam pengembangan.</div>}
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Apakah Anda yakin?</h2>
                    <p className="mt-1 text-sm text-gray-600">Data siswa: <strong>{siswa.nama_lengkap}</strong> akan dihapus secara permanen.</p>
                    <div className="mt-6 flex justify-end">
                        <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                        <button onClick={deleteItem} type="button" disabled={processing} className="ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
                            {processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
