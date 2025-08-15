import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/solid';

// Komponen untuk Tombol Tab
const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            active 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
);

// Komponen untuk menampilkan satu baris detail
const DetailItem = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);


// Komponen untuk konten tab "Informasi Umum"
const InformasiUmumTab = ({ guru }) => {
    return (
        <div className="mt-6 border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
                <DetailItem label="ID Guru" value={guru.id_guru} />
                <DetailItem label="Jenis Kelamin" value={guru.jenis_kelamin} />
                <DetailItem label="Wali Kelas" value={guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan || ''}` : 'Bukan wali kelas'} />
                <DetailItem label="Akun Terhubung" value={guru.pengguna?.username || 'Tidak terhubung'} />
                <DetailItem label="Barcode ID" value={guru.barcode_id} />
                <DetailItem label="Template Sidik Jari" value={guru.sidik_jari_template ? 'Terdaftar' : 'Belum terdaftar'} />
            </dl>
        </div>
    );
};

// Komponen untuk konten tab "Jadwal Mengajar"
const JadwalMengajarTab = ({ jadwal }) => {
     const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
     const sortedDays = Object.keys(jadwal).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

    return (
        <div className="mt-6 border-t border-gray-200 pt-6">
             {sortedDays.length > 0 ? sortedDays.map(hari => (
                <div key={hari} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{hari}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jadwal[hari].map(item => (
                                    <tr key={item.id_jadwal}>
                                        <td className="px-4 py-2 text-sm">{item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}</td>
                                        <td className="px-4 py-2 text-sm">{item.mata_pelajaran.nama_mapel}</td>
                                        <td className="px-4 py-2 text-sm">{item.kelas.tingkat} {item.kelas.jurusan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             )) : <p className="text-sm text-gray-500">Tidak ada jadwal mengajar yang ditemukan.</p>}
        </div>
    );
};

// Komponen untuk konten tab "Riwayat Absensi"
const RiwayatAbsensiTab = ({ absensi }) => {
    return (
        <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {absensi.map(item => (
                            <tr key={item.id_absensi}>
                                <td className="px-4 py-2 text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                <td className="px-4 py-2 text-sm">{item.status_kehadiran}</td>
                                <td className="px-4 py-2 text-sm">{item.jam_masuk?.slice(0, 5) || '-'}</td>
                                <td className="px-4 py-2 text-sm">{item.jam_pulang?.slice(0, 5) || '-'}</td>
                                <td className="px-4 py-2 text-sm">{item.keterangan || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Komponen untuk konten tab "Jurnal Mengajar"
const JurnalMengajarTab = ({ jurnal }) => {
    return (
        <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Materi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {jurnal.map(item => (
                            <tr key={item.id_jurnal}>
                                <td className="px-4 py-2 text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                <td className="px-4 py-2 text-sm">{item.jadwal_mengajar.mata_pelajaran.nama_mapel}</td>
                                <td className="px-4 py-2 text-sm">{item.jadwal_mengajar.kelas.tingkat} {item.jadwal_mengajar.kelas.jurusan}</td>
                                <td className="px-4 py-2 text-sm">{item.materi_pembahasan || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default function Show({ auth, guru, jadwalMengajar, riwayatAbsensi, jurnalMengajar }) {
    const [activeTab, setActiveTab] = useState('informasi');
    const statusColor = {
        'Aktif': 'bg-green-100 text-green-800',
        'Tidak Aktif': 'bg-yellow-100 text-yellow-800',
        'Pensiun': 'bg-red-100 text-red-800',
    };

    return (
        <AdminLayout user={auth.user} header={`Detail Guru: ${guru.nama_lengkap}`}>
            <Head title={`Detail ${guru.nama_lengkap}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Bagian Informasi Utama (Header Baru) */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Detail Data Guru</h2>
                                <p className="text-sm text-gray-500">Informasi lengkap mengenai guru.</p>
                            </div>
                            <div className="flex items-center gap-x-2 flex-shrink-0">
                                 <Link href={route('admin.guru.index')} className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                                    <ArrowLeftIcon className="-ml-0.5 h-5 w-5" />
                                    Kembali
                                </Link>
                                <Link href={route('admin.guru.edit', guru.id_guru)} className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                                    <PencilIcon className="-ml-0.5 h-5 w-5" />
                                    Edit
                                </Link>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-start gap-6">
                            <div className="md:w-1/4 flex flex-col items-center text-center">
                                <img
                                    className="h-32 w-32 rounded-full object-cover shadow-lg"
                                    src={guru.foto_profil ? `/storage/${guru.foto_profil}` : `https://ui-avatars.com/api/?name=${guru.nama_lengkap.replace(/\s/g, "+")}&color=7F9CF5&background=EBF4FF&size=128`}
                                    alt={guru.nama_lengkap}
                                />
                                <h3 className="mt-4 text-lg font-bold text-gray-900">{guru.nama_lengkap}</h3>
                                <p className="text-sm text-gray-500">{guru.nip}</p>
                                <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[guru.status]}`}>
                                    {guru.status}
                                </span>
                            </div>
                            <div className="w-full md:w-3/4">
                                <dl className="divide-y divide-gray-200">
                                    <DetailItem label="ID Guru" value={guru.id_guru} />
                                    <DetailItem label="Jenis Kelamin" value={guru.jenis_kelamin} />
                                    <DetailItem label="Wali Kelas" value={guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan || ''}` : 'Bukan wali kelas'} />
                                    <DetailItem label="Akun Terhubung" value={guru.pengguna?.username || 'Tidak terhubung'} />
                                    <DetailItem label="Barcode ID" value={guru.barcode_id} />
                                    <DetailItem label="Template Sidik Jari" value={guru.sidik_jari_template ? 'Terdaftar' : 'Belum terdaftar'} />
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Konten Tab */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {/* Navigasi Tab */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                <TabButton active={activeTab === 'informasi'} onClick={() => setActiveTab('informasi')}>Informasi Umum</TabButton>
                                <TabButton active={activeTab === 'jadwal'} onClick={() => setActiveTab('jadwal')}>Jadwal Mengajar</TabButton>
                                <TabButton active={activeTab === 'riwayat'} onClick={() => setActiveTab('riwayat')}>Riwayat Absensi</TabButton>
                                <TabButton active={activeTab === 'jurnal'} onClick={() => setActiveTab('jurnal')}>Jurnal Mengajar</TabButton>
                            </nav>
                        </div>

                        {/* Konten yang ditampilkan berdasarkan tab aktif */}
                        {activeTab === 'informasi' && <InformasiUmumTab guru={guru} />}
                        {activeTab === 'jadwal' && <JadwalMengajarTab jadwal={jadwalMengajar} />}
                        {activeTab === 'riwayat' && <RiwayatAbsensiTab absensi={riwayatAbsensi} />}
                        {activeTab === 'jurnal' && <JurnalMengajarTab jurnal={jurnalMengajar} />}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
