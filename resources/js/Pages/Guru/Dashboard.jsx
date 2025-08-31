import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import {
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    MegaphoneIcon,
    CheckCircleIcon,
    BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import moment from 'moment';
import 'moment/locale/id';

// Komponen untuk kartu statistik
const StatCard = ({ title, value, icon, description, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
        <div className="flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-gray-400 text-xs">{description}</p>
        </div>
    </div>
);

// Komponen untuk item jadwal
const JadwalCard = ({ jadwal }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 text-sm">{jadwal.mapel.nama_mapel}</h4>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {jadwal.jam_mulai.substring(0, 5)} - {jadwal.jam_selesai.substring(0, 5)}
            </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
            Kelas: <span className="font-medium">{jadwal.kelas.tingkat} {jadwal.kelas.jurusan}</span>
        </p>
    </div>
);

// Komponen untuk item jurnal
const JurnalCard = ({ jurnal }) => (
    <div className="flex items-start space-x-3 py-3 border-b last:border-b-0">
        <ClipboardDocumentListIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
        <div>
            <div className="text-sm font-medium text-gray-900">
                Jurnal Kelas <span className="font-bold">{jurnal.jadwal_mengajar.kelas.tingkat} {jurnal.jadwal_mengajar.kelas.jurusan}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
                Mata Pelajaran: {jurnal.jadwal_mengajar.mapel.nama_mapel}
            </div>
            <div className="text-xs text-gray-500 mt-1">
                {moment(jurnal.tanggal).format('LL')} - Status: <span className="font-semibold text-blue-600">{jurnal.status_mengajar}</span>
            </div>
        </div>
    </div>
);


export default function GuruDashboard({ auth, guru, jadwalHariIni, jurnalTerbaru, pengumuman }) {
    
    // Konfigurasi locale untuk Carbon di Laravel sudah dilakukan, jadi moment di frontend juga bisa diatur
    moment.locale('id');

    const totalKelasDiajar = jadwalHariIni.length;
    const guruNama = guru?.nama_lengkap || 'Guru';
    const hariIni = moment().format('dddd, LL');

    return (
        <GuruLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dasbor Guru</h2>}
        >
            <Head title="Dasbor Guru" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center">
                             <div>
                                <h1 className="text-2xl font-bold text-gray-800">Selamat Datang, {guruNama}!</h1>
                                <p className="mt-1 text-sm text-gray-500">Dasbor Anda hari ini, {hariIni}</p>
                            </div>
                            <img src={guru?.foto_profil || 'https://via.placeholder.com/150'} alt="Foto Profil" className="w-16 h-16 rounded-full object-cover" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard 
                            title="Jadwal Hari Ini" 
                            value={totalKelasDiajar} 
                            description="Kelas yang harus Anda ajar"
                            color="border-blue-500"
                            icon={<CalendarDaysIcon className="h-8 w-8 text-blue-500" />}
                        />
                        <StatCard 
                            title="Kelas Wali" 
                            value={guru?.kelas_wali?.length || '0'} 
                            description="Kelas yang Anda wali"
                            color="border-purple-500"
                            icon={<BuildingLibraryIcon className="h-8 w-8 text-purple-500" />}
                        />
                        <StatCard 
                            title="Jurnal Mengajar" 
                            value={jurnalTerbaru.length}
                            description="Jurnal terbaru Anda"
                            color="border-green-500"
                            icon={<ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Jadwal Hari Ini ({jadwalHariIni.length})</h3>
                            {jadwalHariIni.length > 0 ? (
                                <div className="space-y-4">
                                    {jadwalHariIni.map(jadwal => (
                                        <JadwalCard key={jadwal.id_jadwal} jadwal={jadwal} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada jadwal mengajar untuk hari ini.</p>
                            )}
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Jurnal Mengajar Terbaru</h3>
                            {jurnalTerbaru.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {jurnalTerbaru.map(jurnal => (
                                        <JurnalCard key={jurnal.id_jurnal} jurnal={jurnal} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Belum ada jurnal mengajar yang dicatat.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Pengumuman Terbaru</h3>
                        {pengumuman.length > 0 ? (
                            <div className="space-y-4">
                                {pengumuman.map(item => (
                                    <div key={item.id_pengumuman} className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                                        <div className="flex items-center space-x-3">
                                            <MegaphoneIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900">{item.judul}</h4>
                                                <p className="text-sm text-gray-700 mt-1">{item.isi}</p>
                                                <p className="text-xs text-gray-500 mt-1">Diterbitkan: {moment(item.tanggal_terbit).fromNow()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Tidak ada pengumuman untuk saat ini.</p>
                        )}
                    </div>

                </div>
            </div>
        </GuruLayout>
    );
}