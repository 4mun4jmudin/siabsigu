import React from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link } from '@inertiajs/react';
import { User, Shield, Phone, Briefcase } from 'lucide-react';

const InfoCard = ({ title, icon, children }) => (
    <div className="bg-white shadow-sm rounded-lg">
        <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                {icon}
                <span className="ml-3">{title}</span>
            </h3>
        </div>
        <div className="p-6 space-y-4 text-gray-600">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 col-span-2">{value || '-'}</dd>
    </div>
);


export default function ProfileShow({ auth, orangTua, siswa }) {
    return (
        <OrangTuaLayout user={auth.user} header="Profil Saya & Ananda">
            <Head title="Profil" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Kartu Profil Orang Tua */}
                    <InfoCard title="Profil Orang Tua / Wali" icon={<Shield className="text-sky-600" />}>
                        <InfoRow label="Nama Lengkap" value={orangTua.nama_lengkap} />
                        <InfoRow label="Hubungan" value={orangTua.hubungan} />
                        <InfoRow label="NIK" value={orangTua.nik} />
                        <InfoRow label="No. Telepon/WA" value={orangTua.no_telepon_wa} />
                        <InfoRow label="Pekerjaan" value={orangTua.pekerjaan} />
                        <InfoRow label="Pendidikan" value={orangTua.pendidikan_terakhir} />
                    </InfoCard>

                    {/* Kartu Profil Siswa */}
                    {siswa && (
                         <InfoCard title="Profil Ananda" icon={<User className="text-emerald-600" />}>
                            <InfoRow label="Nama Lengkap" value={siswa.nama_lengkap} />
                            <InfoRow label="NIS / NISN" value={`${siswa.nis} / ${siswa.nisn}`} />
                            <InfoRow label="Kelas" value={`${siswa.kelas.tingkat} ${siswa.kelas.jurusan}`} />
                            <InfoRow label="Tempat, Tgl Lahir" value={`${siswa.tempat_lahir}, ${new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
                            <InfoRow label="Jenis Kelamin" value={siswa.jenis_kelamin} />
                            <InfoRow label="Agama" value={siswa.agama} />
                            <InfoRow label="Alamat" value={siswa.alamat_lengkap} />
                        </InfoCard>
                    )}
                </div>
            </div>
        </OrangTuaLayout>
    );
}