import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import PrimaryButton from '@/Components/PrimaryButton';
import { Users, BookOpen, Clock, UserCheck, Bell, Calendar as CalendarIcon, Send } from 'lucide-react';

// Komponen Card Statistik
const StatCard = ({ title, value, icon, description }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

// Komponen Jadwal Hari Ini dengan Fitur "Jurnal Cepat"
const TodaySchedule = ({ jadwal }) => {
    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
        id_jadwal: '',
        status_mengajar: 'Tugas',
        alasan: '',
    });
    const [activeJadwalId, setActiveJadwalId] = useState(null);

    const handleQuickSubmit = (e) => {
        e.preventDefault();
        post(route('guru.jurnal.quick_entry'), {
            preserveScroll: true,
            onSuccess: () => {
                setActiveJadwalId(null); // Tutup form setelah berhasil
                reset(); // Reset form state
            }
        });
    };

    const toggleForm = (jadwalId) => {
        if (activeJadwalId === jadwalId) {
            setActiveJadwalId(null); // Tutup jika sudah terbuka
        } else {
            setActiveJadwalId(jadwalId); // Buka form untuk jadwal yang diklik
            setData('id_jadwal', jadwalId); // Set id_jadwal di form
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Jadwal Hari Ini & Jurnal Cepat
                </CardTitle>
            </CardHeader>
            <CardContent>
                {jadwal && jadwal.length > 0 ? (
                    <div className="space-y-2">
                        {jadwal.map((item) => (
                            <div key={item.id_jadwal} className="bg-gray-50 rounded-lg p-3 transition-all duration-300">
                                <div className="flex items-center">
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="text-sm font-bold text-gray-700">{item.jam_mulai.substring(0, 5)}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.mata_pelajaran.nama_mapel}</p>
                                            <p className="text-xs text-gray-500">{item.kelas.tingkat} {item.kelas.jurusan}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={route('guru.jurnal.create', { id_jadwal: item.id_jadwal })} className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md shadow-sm">Isi Jurnal</Link>
                                        <button onClick={() => toggleForm(item.id_jadwal)} className="text-xs text-white bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded-md shadow-sm">Izin/Tugas</button>
                                    </div>
                                </div>
                                
                                {/* Form Jurnal Cepat yang bisa muncul/hilang */}
                                {activeJadwalId === item.id_jadwal && (
                                    <form onSubmit={handleQuickSubmit} className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                                        <p className="text-xs text-gray-600 mb-2">Catat dengan cepat jika Anda berhalangan hadir.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <select value={data.status_mengajar} onChange={e => setData('status_mengajar', e.target.value)} className="col-span-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                                <option value="Tugas">Memberi Tugas</option>
                                                <option value="Kosong">Kelas Kosong</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={data.alasan}
                                                onChange={e => setData('alasan', e.target.value)}
                                                placeholder="Alasan singkat (cth: Rapat dinas)"
                                                className="col-span-2 text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        {errors.alasan && <p className="text-red-500 text-xs mt-1">{errors.alasan}</p>}
                                        <div className="text-right mt-2">
                                            <PrimaryButton size="sm" disabled={processing}>
                                                <Send className="h-3 w-3 mr-1"/>
                                                {processing ? 'Mengirim...' : 'Kirim'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada jadwal mengajar hari ini.</p>
                )}
            </CardContent>
        </Card>
    );
};

// Komponen Pengumuman
const Announcements = ({ announcements }) => (
    <Card className="col-span-1 lg:col-span-1">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengumuman
            </CardTitle>
        </CardHeader>
        <CardContent>
             {announcements && announcements.length > 0 ? (
                <ul className="space-y-3">
                    {announcements.map(item => (
                        <li key={item.id_pengumuman} className="text-sm border-l-4 border-yellow-400 pl-3">
                            <p className="font-semibold text-gray-800">{item.judul}</p>
                            <p className="text-xs text-gray-600">{item.isi}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">Tidak ada pengumuman baru.</p>
            )}
        </CardContent>
    </Card>
);

// Komponen Utama Halaman Dashboard
export default function Dashboard({ auth, guru, jadwalHariIni, stats, pengumuman }) {
    return (
        <GuruLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard Guru" />

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <StatCard title="Total Kelas" value={stats.total_kelas} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Jumlah kelas yang diampu" />
                <StatCard title="Mata Pelajaran" value={stats.total_mapel} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} description="Jumlah mapel yang diampu" />
                <StatCard title="Jam Mengajar" value={stats.total_jam_seminggu} icon={<Clock className="h-4 w-4 text-muted-foreground" />} description="Total jam per minggu" />
                <StatCard title="Status Kehadiran" value="Hadir" icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} description="Absensi hari ini (Contoh)" />
            </div>
            <div className="mt-6 grid gap-4 md:gap-8 lg:grid-cols-3">
                <TodaySchedule jadwal={jadwalHariIni} />
                <Announcements announcements={pengumuman} />
            </div>
        </GuruLayout>
    );
}