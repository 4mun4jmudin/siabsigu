import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'; // Asumsi Anda akan membuat komponen ini
import { Users, Book, Clock, Bell, Calendar, UserCheck } from 'lucide-react';

// Komponen Card Statistik (disederhanakan dari dashboard-stats.tsx)
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

// Komponen Jadwal Hari Ini (disederhanakan dari today-schedule.tsx)
const TodaySchedule = ({ jadwal }) => (
    <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Hari Ini
            </CardTitle>
        </CardHeader>
        <CardContent>
            {jadwal.length > 0 ? (
                <div className="space-y-4">
                    {jadwal.map((item) => (
                        <div key={item.id_jadwal} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 mr-4">
                               <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{item.mata_pelajaran.nama_mapel}</p>
                                <p className="text-xs text-gray-500">{item.kelas.tingkat} {item.kelas.jurusan}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">{item.jam_mulai.substring(0, 5)} - {item.jam_selesai.substring(0, 5)}</p>
                                <Link href="#" className="text-xs text-blue-600 hover:underline">Isi Jurnal</Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-8">Tidak ada jadwal mengajar hari ini.</p>
            )}
        </CardContent>
    </Card>
);

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
             {announcements.length > 0 ? (
                <ul className="space-y-3">
                    {announcements.map(item => (
                        <li key={item.id_pengumuman} className="text-sm border-l-4 border-yellow-400 pl-3">
                            <p className="font-semibold">{item.judul}</p>
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


export default function Dashboard({ auth, guru, jadwalHariIni, stats, pengumuman }) {
    return (
        <GuruLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard Guru" />
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <StatCard title="Total Kelas" value={stats.total_kelas} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Jumlah kelas yang diampu" />
                <StatCard title="Mata Pelajaran" value={stats.total_mapel} icon={<Book className="h-4 w-4 text-muted-foreground" />} description="Jumlah mapel yang diampu" />
                <StatCard title="Jam Mengajar" value={stats.total_jam_seminggu} icon={<Clock className="h-4 w-4 text-muted-foreground" />} description="Total jam per minggu" />
                <StatCard title="Status Kehadiran" value="Hadir" icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} description="Absensi hari ini" />
            </div>
            <div className="mt-6 grid gap-4 md:gap-8 lg:grid-cols-3">
                <TodaySchedule jadwal={jadwalHariIni} />
                <Announcements announcements={pengumuman} />
            </div>
        </GuruLayout>
    );
}

// Catatan: Anda perlu membuat komponen Card di 'resources/js/Components/ui/card.jsx'
// Jika belum ada, ini adalah contoh sederhana yang bisa Anda gunakan:
/*
// File: resources/js/Components/ui/card.jsx

import React from 'react';

export const Card = ({ className, ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);
export const CardHeader = ({ className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
);
export const CardContent = ({ className, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
// );
*/