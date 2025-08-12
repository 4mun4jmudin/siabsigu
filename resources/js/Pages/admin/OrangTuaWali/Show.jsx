import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftIcon, PencilIcon, UserCircleIcon, AcademicCapIcon, FingerPrintIcon, ClockIcon } from '@heroicons/react/24/outline';

// Komponen untuk menampilkan baris data
const DetailRow = ({ label, value, isBadge = false, children }) => (
    <div className="flex justify-between py-3 border-b border-gray-200">
        <span className="text-sm text-gray-500">{label}</span>
        {children ? children : <span className={`text-sm font-semibold text-gray-800 ${isBadge ? 'px-2 py-1 bg-gray-100 rounded-full' : ''}`}>{value || '-'}</span>}
    </div>
);

// Komponen Badge Status Absensi
const AbsensiStatusBadge = ({ status }) => {
    const styles = {
        Hadir: 'bg-green-100 text-green-800',
        Sakit: 'bg-yellow-100 text-yellow-800',
        Izin: 'bg-blue-100 text-blue-800',
        Alfa: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
}

const StatusBadge = ({ status }) => {
    const style = {
        'Aktif': 'bg-green-100 text-green-800',
        'Lulus': 'bg-blue-100 text-blue-800',
        'Pindah': 'bg-yellow-100 text-yellow-800',
        'Drop Out': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style[status]}`}>{status}</span>;
};

export default function Show({ auth, wali, absensiSiswa }) {
    return (
        <AdminLayout user={auth.user} header={`Detail Wali: ${wali.nama_lengkap}`}>
            <Head title={`Detail Wali ${wali.nama_lengkap}`} />

            <div className="space-y-6">
                {/* Header Halaman */}
                <div className="flex justify-between items-center">
                    <Link href={route('orang-tua-wali.index')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Kembali ke Daftar Wali
                    </Link>
                    <Link href={route('orang-tua-wali.edit', wali.id_wali)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition">
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Edit Data Wali
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kolom Kiri: Info Wali & Akun */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4 mb-4">
                                <UserCircleIcon className="h-12 w-12 text-gray-400"/>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{wali.nama_lengkap}</h3>
                                    <p className="text-sm text-gray-500">{wali.hubungan} dari {wali.siswa.nama_lengkap}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <DetailRow label="NIK" value={wali.nik} />
                                <DetailRow label="Tanggal Lahir" value={wali.tanggal_lahir} />
                                <DetailRow label="Pendidikan" value={wali.pendidikan_terakhir} />
                                <DetailRow label="Pekerjaan" value={wali.pekerjaan} />
                                <DetailRow label="Penghasilan" value={wali.penghasilan_bulanan} />
                                <DetailRow label="No. Telepon (WA)" value={wali.no_telepon_wa} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                             <h3 className="text-lg font-bold text-gray-800 mb-4">Informasi Akun</h3>
                             <div className="space-y-2">
                                {/* --- PERBAIKAN DI SINI --- */}
                                <DetailRow label="Username" value={wali.pengguna?.username} />
                                <DetailRow label="Email" value={wali.pengguna?.email} />
                                <DetailRow label="Level Akun" value={wali.pengguna?.level} isBadge={true} />
                             </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Info Siswa & Absensi */}
                    <div className="lg:col-span-2 space-y-6">
                         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-4 mb-4">
                                <AcademicCapIcon className="h-12 w-12 text-gray-400"/>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{wali.siswa.nama_lengkap}</h3>
                                    <p className="text-sm text-gray-500">Siswa Perwalian</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <DetailRow label="NIS" value={wali.siswa.nis} />
                                <DetailRow label="NISN" value={wali.siswa.nisn} />
                                <DetailRow label="Kelas" value={`${wali.siswa.kelas.tingkat}-${wali.siswa.kelas.jurusan}`} />
                                <DetailRow label="Status Siswa" isBadge={true}><StatusBadge status={wali.siswa.status} /></DetailRow>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">5 Riwayat Absensi Terakhir Siswa</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {['Tanggal', 'Status', 'Jam Masuk', 'Keterangan'].map(head => (
                                                <th key={head} className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{head}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {absensiSiswa.length > 0 ? absensiSiswa.map(absen => (
                                            <tr key={absen.id_absensi}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{absen.tanggal}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><AbsensiStatusBadge status={absen.status_kehadiran} /></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{absen.jam_masuk || '-'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{absen.keterangan || '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">Belum ada riwayat absensi.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
