// resources/js/Pages/admin/Dashboard.jsx

import AdminLayout from '@/Layouts/AdminLayout';
import { UserGroupIcon, AcademicCapIcon, BookOpenIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';

// Komponen Reusable
const StatCard = ({ icon, label, value, description }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 transition-all duration-300 hover:shadow-xl hover:scale-105">
        <div className="bg-blue-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-gray-400 text-xs">{description}</p>
        </div>
    </div>
);

const PresenceCard = ({ title, present, absent, color }) => {
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const barColor = color === 'green' ? 'bg-green-500' : 'bg-blue-500';
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Hadir</span><span className="font-semibold">{present}</span></div>
                <div className="flex justify-between"><span>Tidak Hadir</span><span className="font-semibold text-red-500">{absent}</span></div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{total}</span></div>
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div></div>
                <p className="text-right text-sm mt-1 text-gray-500">{percentage}% Kehadiran</p>
            </div>
        </div>
    );
}

const QuickActionCard = ({ bgColor, icon, title, description, href }) => (
    <a href={href} className={`block p-6 rounded-lg shadow-md text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${bgColor}`}>
        <div className="mb-2 inline-block">{icon}</div>
        <h3 className="font-bold text-base text-gray-800">{title}</h3>
        <p className="text-xs text-gray-600">{description}</p>
    </a>
);

function timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun yang lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan yang lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari yang lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam yang lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit yang lalu";
    return Math.floor(seconds) + " detik yang lalu";
}

export default function Dashboard({ auth, stats, latestActivities, announcements }) {
    const activityColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    const announcementColors = ['border-l-yellow-400', 'border-l-blue-400', 'border-l-green-400'];
    const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AdminLayout user={auth.user} header="Dashboard">
            
            <div className="w-full mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard Sistem Absensi & Jurnal</h2>
                        <p className="text-sm text-gray-500">Sistem Manajemen Absensi dan Jurnal Mengajar</p>
                    </div>
                    <div className="text-left sm:text-right bg-white p-3 rounded-lg shadow-sm w-full sm:w-auto">
                        <h3 className="font-bold">SMA Negeri 1</h3>
                        <p className="text-gray-500 text-sm">{currentDate}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<UserGroupIcon className="h-6 w-6 text-blue-600" />} label="Total Guru" value={stats.totalGuru} description="Guru aktif" />
                    <StatCard icon={<AcademicCapIcon className="h-6 w-6 text-green-600" />} label="Total Siswa" value={stats.totalSiswa} description="Siswa aktif" />
                    <StatCard icon={<BookOpenIcon className="h-6 w-6 text-purple-600" />} label="Mata Pelajaran" value={stats.totalMapel} description="Mata pelajaran aktif" />
                    <StatCard icon={<CalendarDaysIcon className="h-6 w-6 text-orange-600" />} label="Jadwal Mengajar" value={stats.totalJadwal} description="Jadwal hari ini" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PresenceCard title="Kehadiran Guru Hari Ini" present={stats.kehadiranGuru.hadir} absent={stats.kehadiranGuru.tidakHadir} color="blue" />
                    <PresenceCard title="Kehadiran Siswa Hari Ini" present={stats.kehadiranSiswa.hadir} absent={stats.kehadiranSiswa.tidakHadir} color="green" />
                </div>
                
                <div>
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">Aksi Cepat</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionCard href="#" bgColor="bg-blue-50" icon={<ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-700"/>} title="Absensi Guru" description="Kelola kehadiran guru" />
                        <QuickActionCard href="#" bgColor="bg-green-50" icon={<ClipboardDocumentCheckIcon className="h-8 w-8 text-green-700"/>} title="Absensi Siswa" description="Kelola kehadiran siswa" />
                        <QuickActionCard href="#" bgColor="bg-purple-50" icon={<DocumentPlusIcon className="h-8 w-8 text-purple-700"/>} title="Jurnal Mengajar" description="Input jurnal harian" />
                        <QuickActionCard href="#" bgColor="bg-orange-50" icon={<CalendarDaysIcon className="h-8 w-8 text-orange-700"/>} title="Jadwal Mengajar" description="Kelola jadwal" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">Aktivitas Terbaru</h3>
                        <div className="space-y-4">
                            {latestActivities.length > 0 ? latestActivities.map((activity, index) => (
                                <div key={activity.id_log} className="flex items-start space-x-3">
                                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${activityColors[index % activityColors.length]}`}></span>
                                    <div>
                                        <p className="text-sm text-gray-800">{activity.aksi} oleh <strong>{activity.pengguna?.nama_lengkap ?? 'Sistem'}</strong></p>
                                        <p className="text-xs text-gray-400">{timeAgo(activity.waktu)}</p>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-500">Tidak ada aktivitas terbaru.</p>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800">Pengumuman</h3>
                        <div className="space-y-4">
                            {announcements.length > 0 ? announcements.map((announcement, index) => (
                                <div key={announcement.id_pengumuman} className={`p-4 rounded-md border-l-4 ${announcementColors[index % announcementColors.length]} bg-gray-50`}>
                                    <h4 className="font-bold text-sm text-gray-900">{announcement.judul}</h4>
                                    <p className="text-sm text-gray-600">{announcement.isi}</p>
                                </div>
                            )) : <p className="text-sm text-gray-500">Tidak ada pengumuman.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

/* --- Sisipkan kode komponen reusable di sini jika Anda belum memisahkannya --- */
/* const StatCard = (...) => { ... } */
/* const PresenceCard = (...) => { ... } */
/* const QuickActionCard = (...) => { ... } */