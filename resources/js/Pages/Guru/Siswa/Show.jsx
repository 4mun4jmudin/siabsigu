import React from 'react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Head, Link } from '@inertiajs/react';
import { User, Home, Phone, CheckCircle, XCircle, AlertTriangle, PieChart } from 'lucide-react';

const InfoCard = ({ title, icon, children }) => (
    <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
            {icon}
            <span className="ml-3">{title}</span>
        </h3>
        <div className="space-y-3 text-gray-600">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center">
        <dt className="w-full sm:w-1/3 font-medium text-gray-500">{label}</dt>
        <dd className="w-full sm:w-2/3 mt-1 sm:mt-0">{value || '-'}</dd>
    </div>
);

const StatCard = ({ label, value, icon, colorClass }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        <div className={`p-3 rounded-full text-white ${colorClass}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    </div>
);

export default function SiswaShow({ auth, siswa, orangTuaWali, absensiSummary }) {
    return (
        <GuruLayout user={auth.user} header={`Detail Siswa: ${siswa.nama_lengkap}`}>
            <Head title={`Detail ${siswa.nama_lengkap}`} />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
                {/* Kartu Profil Utama */}
                <div className="bg-white shadow-sm rounded-lg p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <img
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-200"
                        src={siswa.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.nama_lengkap)}&background=random`}
                        alt={siswa.nama_lengkap}
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{siswa.nama_lengkap}</h1>
                        <p className="text-gray-600 mt-1">NIS: {siswa.nis} / NISN: {siswa.nisn}</p>
                        <p className="text-gray-600">
                            Kelas {siswa.kelas.tingkat} {siswa.kelas.jurusan}
                        </p>
                    </div>
                </div>

                {/* Ringkasan Absensi */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Hadir" value={absensiSummary.hadir} icon={<CheckCircle size={24} />} colorClass="bg-green-500" />
                    <StatCard label="Sakit" value={absensiSummary.sakit} icon={<AlertTriangle size={24} />} colorClass="bg-yellow-500" />
                    <StatCard label="Izin" value={absensiSummary.izin} icon={<AlertTriangle size={24} />} colorClass="bg-blue-500" />
                    <StatCard label="Alfa" value={absensiSummary.alfa} icon={<XCircle size={24} />} colorClass="bg-red-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Kartu Data Diri */}
                    <InfoCard title="Data Pribadi" icon={<User className="text-sky-600" />}>
                        <InfoRow label="NIK" value={siswa.nik} />
                        <InfoRow label="Tempat, Tgl Lahir" value={`${siswa.tempat_lahir}, ${new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
                        <InfoRow label="Jenis Kelamin" value={siswa.jenis_kelamin} />
                        <InfoRow label="Agama" value={siswa.agama} />
                        <InfoRow label="Alamat" value={siswa.alamat_lengkap} />
                    </InfoCard>

                    {/* Kartu Orang Tua / Wali */}
                    <InfoCard title="Kontak Orang Tua / Wali" icon={<Phone className="text-sky-600" />}>
                        {orangTuaWali.length > 0 ? orangTuaWali.map(wali => (
                            <div key={wali.id_wali} className="p-3 border-t first:border-t-0">
                                <p className="font-semibold">{wali.nama_lengkap} <span className="text-xs font-normal bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full ml-2">{wali.hubungan}</span></p>
                                <p className="text-sm">{wali.no_telepon_wa}</p>
                            </div>
                        )) : <p>Tidak ada data kontak.</p>}
                    </InfoCard>
                </div>

                <div className="text-center">
                    <Link href={route('guru.siswa.index')} className="text-sky-600 hover:underline">
                        &larr; Kembali ke Daftar Siswa
                    </Link>
                </div>
            </div>
        </GuruLayout>
    );
}