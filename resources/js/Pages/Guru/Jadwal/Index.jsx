import React, { useMemo } from 'react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, BookOpen, Info, Printer, Download } from 'lucide-react';

const JadwalCard = ({ jadwal, jurnal }) => {
    const isJurnalDibuat = !!jurnal;
    return (
        <div className={`p-4 rounded-lg border ${isJurnalDibuat ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800">{jadwal.mapel?.nama_mapel ?? '—'}</p>
                    <p className="text-sm text-gray-600">Kelas {jadwal.kelas?.tingkat ?? ''} {jadwal.kelas?.jurusan ?? ''}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isJurnalDibuat ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isJurnalDibuat ? 'Jurnal Dibuat' : 'Belum Ada Jurnal'}
                </span>
            </div>
            <div className="mt-3 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                <span>{jadwal.jam_mulai?.slice(0,5) ?? '—'} - {jadwal.jam_selesai?.slice(0,5) ?? '—'}</span>
            </div>
            <div className="mt-4 flex gap-2">
                <a
                    href={route('guru.jurnal.create', { jadwal_id: jadwal.id_jadwal })}
                    className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                >
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    {isJurnalDibuat ? 'Lihat Jurnal' : 'Buat Jurnal'}
                </a>
            </div>
        </div>
    );
};

export default function Index({ auth, guru, jadwals, jadwalHariIni, jurnalHariIni, info }) {
    const hariUrutan = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

    // derivations
    const jumlahJadwalHariIni = jadwalHariIni?.length ?? 0;

    const handleToday = () => {
        // scroll to top & focus the Hari Ini section
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const dow = useMemo(() => hariUrutan, []);

    return (
        <GuruLayout user={auth.user} header="Jadwal Mengajar Saya">
            <Head title="Jadwal Mengajar" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header ringkasan */}
                <div className="bg-white shadow-sm sm:rounded-lg p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(guru.nama_lengkap)}&background=0ea5e9&color=fff`}
                            alt={guru.nama_lengkap}
                            className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{guru.nama_lengkap}</h1>
                            <p className="text-sm text-gray-500">Tahun Ajaran: {info.tahunAjaran ?? '-' } • {info.semester ?? ''}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleToday} className="px-3 py-2 rounded-md bg-sky-600 text-white text-sm">Hari Ini</button>
                        <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="px-3 py-2 rounded-md bg-sky-50 text-sky-700 text-sm border">Minggu Ini</button>
                        <button onClick={() => window.print()} className="px-3 py-2 rounded-md bg-white border text-sm flex items-center gap-2"><Printer className="w-4 h-4" /> Cetak</button>
                        <a href={route('guru.jadwal.export.ical')} className="px-3 py-2 rounded-md bg-white border text-sm flex items-center gap-2"><Download className="w-4 h-4" /> Export iCal</a>
                    </div>
                </div>

                {/* Ringkasan Hari Ini */}
                <div className="mb-8" id="hari-ini">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Calendar className="w-6 h-6 mr-3 text-sky-600" />
                        Jadwal Hari Ini ({info.tanggalHariIni})
                    </h2>

                    {jumlahJadwalHariIni > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jadwalHariIni.map((jadwal) => (
                                <JadwalCard key={jadwal.id_jadwal} jadwal={{
                                    id_jadwal: jadwal.id_jadwal,
                                    jam_mulai: jadwal.jam_mulai,
                                    jam_selesai: jadwal.jam_selesai,
                                    mapel: { nama_mapel: jadwal.mata_pelajaran },
                                    kelas: { tingkat: jadwal.kelas?.split(' ')[0] ?? '', jurusan: jadwal.kelas?.split(' ').slice(1).join(' ') ?? '' }
                                }} jurnal={jurnalHariIni[jadwal.id_jadwal]} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                            <Info className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="mt-4 text-gray-600">Tidak ada jadwal mengajar untuk hari ini.</p>
                        </div>
                    )}
                </div>

                {/* Tampilan Mingguan */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Jadwal Minggu Ini</h2>
                    <div className="space-y-6">
                        {dow.map((hari) => (
                            (jadwals[hari] && jadwals[hari].length > 0) && (
                                <div key={hari}>
                                    <h3 className="text-lg font-medium text-gray-700 pb-2 border-b">{hari}</h3>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {jadwals[hari].map((jadwal) => (
                                            <JadwalCard key={jadwal.id_jadwal} jadwal={{
                                                id_jadwal: jadwal.id_jadwal,
                                                jam_mulai: jadwal.jam_mulai,
                                                jam_selesai: jadwal.jam_selesai,
                                                mapel: jadwal.mapel,
                                                kelas: jadwal.kelas
                                            }} jurnal={jurnalHariIni[jadwal.id_jadwal]} />
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </GuruLayout>
    );
}
