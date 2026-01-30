import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement,
    Title, 
    Tooltip, 
    Legend, 
    ArcElement,
    Filler // Import Filler untuk area chart
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
    ArrowDownIcon, 
    ArrowUpIcon, 
    FunnelIcon, 
    DocumentArrowDownIcon,
    PresentationChartLineIcon,
    AcademicCapIcon,
    UserGroupIcon,
    TrophyIcon,
    ExclamationCircleIcon,
    CalendarIcon,
    ChartBarIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import axios from 'axios';

// Register ChartJS Components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
);

// --- KOMPONEN KECIL ---

const StatCard = ({ title, value, change, status, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition transform group-hover:scale-125 ${color.text}`}>
            {React.cloneElement(icon, { className: "h-20 w-20" })}
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
                    {React.cloneElement(icon, { className: "h-6 w-6" })}
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs bg-gray-50 w-fit px-2 py-1 rounded-lg">
                <span className={`flex items-center font-bold ${status === 'naik' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {status === 'naik' ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    {change}
                </span>
                <span className="text-gray-400 ml-2 font-medium">vs bulan lalu</span>
            </div>
        </div>
    </div>
);

// Komponen Kalender Heatmap Modern
const CalendarHeatmap = ({ data, currentMonth }) => {
    const year = parseInt(currentMonth.split('-')[0]);
    const month = parseInt(currentMonth.split('-')[1]) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateStr);
        return { day: i + 1, count: dayData ? dayData.count : 0, hasData: !!dayData };
    });

    const getColor = (count, hasData) => {
        if (!hasData) return 'bg-gray-100 text-gray-300';
        if (count >= 95) return 'bg-emerald-500 text-white shadow-emerald-200';
        if (count >= 85) return 'bg-emerald-300 text-emerald-900';
        if (count >= 70) return 'bg-amber-300 text-amber-900';
        return 'bg-rose-400 text-white';
    };

    return (
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase pb-2">{d}</div>
            ))}
            {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 sm:h-10"></div>
            ))}
            {days.map((day) => (
                <div 
                    key={day.day} 
                    className={`h-8 sm:h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 hover:shadow-md cursor-default group relative ${getColor(day.count, day.hasData)}`}
                >
                    {day.day}
                    {day.hasData && (
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                            Kehadiran: {day.count}%
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default function Index({ auth, data, filters, kelasOptions }) {
    const [bulan, setBulan] = useState(filters.bulan || new Date().toISOString().slice(0, 7));
    const [idKelas, setIdKelas] = useState(filters.id_kelas || 'semua');
    const [activeTab, setActiveTab] = useState('kelas');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailDate, setDetailDate] = useState(new Date().toISOString().slice(0, 10));
    const [detailData, setDetailData] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // --- CHART CONFIGURATION ---
    const createGradient = (ctx, colorStart, colorEnd) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    const trendData = {
        labels: data.trenKehadiran.map(d => d.bulan),
        datasets: [
            {
                label: 'Siswa (%)',
                data: data.trenKehadiran.map(d => d.siswa),
                borderColor: '#3B82F6', // Blue-500
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    return createGradient(ctx, 'rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.0)');
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3B82F6',
                pointHoverBackgroundColor: '#3B82F6',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Guru (%)',
                data: data.trenKehadiran.map(d => d.guru),
                borderColor: '#10B981', // Emerald-500
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    return createGradient(ctx, 'rgba(16, 185, 129, 0.5)', 'rgba(16, 185, 129, 0.0)');
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#10B981',
                pointHoverBackgroundColor: '#10B981',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const statusData = {
        labels: ['Hadir', 'Sakit', 'Izin', 'Alfa'],
        datasets: [{
            data: [
                data.distribusiStatus.hadir,
                data.distribusiStatus.sakit,
                data.distribusiStatus.izin,
                data.distribusiStatus.alfa,
            ],
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
            hoverOffset: 4,
            borderWidth: 0,
        }],
    };

    const handleFilter = () => {
        router.get(route('admin.laporan.index'), { bulan, id_kelas: idKelas }, { preserveState: true, preserveScroll: true });
    };

    const fetchDetailHarian = async () => {
        setLoadingDetail(true);
        try {
            const res = await axios.get(route('admin.laporan.detailHarian'), {
                params: { date: detailDate, id_kelas: idKelas }
            });
            setDetailData(res.data);
        } catch (error) {
            console.error("Gagal ambil detail", error);
            setDetailData([]);
        } finally {
            setLoadingDetail(false);
        }
    };

    // --- SORTING KELAS ---
    const sortedKelas = useMemo(() => {
        if (!data.laporanPerKelas) return [];
        return [...data.laporanPerKelas].sort((a, b) => b.persentase.hadir - a.persentase.hadir);
    }, [data.laporanPerKelas]);

    const topKelas = sortedKelas.length > 0 ? sortedKelas[0] : null;
    const bottomKelas = sortedKelas.length > 0 ? sortedKelas[sortedKelas.length - 1] : null;

    return (
        <AdminLayout user={auth.user} header="Laporan & Analitik">
            <Head title="Laporan & Analitik" />

            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                
                {/* --- HEADER & FILTER BAR --- */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Dashboard Laporan</h2>
                        <p className="text-gray-500 mt-1">
                            Analisis performa periode <span className="font-semibold text-indigo-600">{new Date(bulan).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                        <input 
                            type="month" 
                            value={bulan} 
                            onChange={e => setBulan(e.target.value)} 
                            className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2 bg-white shadow-sm"
                        />
                        <select 
                            value={idKelas} 
                            onChange={e => setIdKelas(e.target.value)} 
                            className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px] py-2 bg-white shadow-sm"
                        >
                            {kelasOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button onClick={handleFilter} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-md flex items-center gap-2">
                            <FunnelIcon className="h-4 w-4" /> Filter
                        </button>
                    </div>
                </div>

                {/* --- STAT CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Kehadiran Siswa" 
                        value={`${data.stats.rataRataKehadiranSiswa.percentage}%`} 
                        change={data.stats.rataRataKehadiranSiswa.change} 
                        status={data.stats.rataRataKehadiranSiswa.status}
                        icon={<AcademicCapIcon />}
                        color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                    />
                    <StatCard 
                        title="Kehadiran Guru" 
                        value={`${data.stats.rataRataKehadiranGuru.percentage}%`} 
                        change={data.stats.rataRataKehadiranGuru.change} 
                        status={data.stats.rataRataKehadiranGuru.status}
                        icon={<UserGroupIcon />}
                        color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
                    />
                    
                    {/* Harian Card (Simplified for cleaner look) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Harian Siswa</p>
                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Hari Ini</span>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-extrabold text-gray-800">{data.stats.siswaHadirHariIni.count}</h3>
                                <span className="text-sm text-gray-400 mb-1.5">/ {data.stats.siswaHadirHariIni.total}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(data.stats.siswaHadirHariIni.count / (data.stats.siswaHadirHariIni.total || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Harian Guru</p>
                            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Hari Ini</span>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-extrabold text-gray-800">{data.stats.guruHadirHariIni.count}</h3>
                                <span className="text-sm text-gray-400 mb-1.5">/ {data.stats.guruHadirHariIni.total}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(data.stats.guruHadirHariIni.count / (data.stats.guruHadirHariIni.total || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CHARTS & INSIGHTS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <PresentationChartLineIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Tren Kehadiran (6 Bulan)</h3>
                        </div>
                        <div className="h-80 w-full">
                            <Line 
                                data={trendData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    scales: { y: { beginAtZero: true, max: 100, grid: { display: true, color: '#f3f4f6' } }, x: { grid: { display: false } } },
                                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Side Column: Heatmap & Insights */}
                    <div className="space-y-6">
                        {/* Heatmap */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    Kalender Absensi
                                </h3>
                            </div>
                            <CalendarHeatmap data={data.heatmapData || []} currentMonth={bulan} />
                        </div>

                        {/* Insights */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <LightBulbIcon className="h-6 w-6 text-yellow-300" />
                                <h3 className="text-lg font-bold">Smart Insights</h3>
                            </div>
                            <div className="space-y-3">
                                {data.analitik.pencapaian.length === 0 && data.analitik.rekomendasi.length === 0 ? (
                                    <p className="text-sm text-indigo-100 italic">Data belum cukup untuk analisis.</p>
                                ) : (
                                    <>
                                        {data.analitik.pencapaian.map((item, idx) => (
                                            <div key={`p-${idx}`} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-sm font-medium flex gap-2">
                                                <span className="text-emerald-300">✔</span> {item.text}
                                            </div>
                                        ))}
                                        {data.analitik.rekomendasi.map((item, idx) => (
                                            <div key={`r-${idx}`} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-sm font-medium flex gap-2">
                                                <span className="text-amber-300">⚠</span> {item.text}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TOP & BOTTOM CLASSES --- */}
                {activeTab === 'kelas' && topKelas && bottomKelas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                <TrophyIcon className="h-24 w-24 text-green-600" />
                            </div>
                            <div className="bg-green-50 p-4 rounded-full text-green-600 z-10">
                                <TrophyIcon className="h-8 w-8" />
                            </div>
                            <div className="z-10">
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Kelas Paling Rajin</p>
                                <h4 className="text-2xl font-extrabold text-gray-900">{topKelas.namaKelas}</h4>
                                <p className="text-sm text-gray-500">Tingkat Kehadiran: <span className="font-bold text-green-600">{topKelas.persentase.hadir}%</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-5">
                                <ExclamationCircleIcon className="h-24 w-24 text-rose-600" />
                            </div>
                            <div className="bg-rose-50 p-4 rounded-full text-rose-600 z-10">
                                <ExclamationCircleIcon className="h-8 w-8" />
                            </div>
                            <div className="z-10">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Perlu Perhatian</p>
                                <h4 className="text-2xl font-extrabold text-gray-900">{bottomKelas.namaKelas}</h4>
                                <p className="text-sm text-gray-500">Tingkat Kehadiran: <span className="font-bold text-rose-600">{bottomKelas.persentase.hadir}%</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DETAILED DATA TABLE --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Tabs & Actions */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="flex bg-gray-200/50 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('kelas')} 
                                className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'kelas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Per Kelas
                            </button>
                            <button 
                                onClick={() => setActiveTab('guru')} 
                                className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'guru' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Per Guru
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                            <a href={route('admin.laporan.export.excel', { bulan, id_kelas: idKelas })} target="_blank" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                <DocumentArrowDownIcon className="h-4 w-4" /> Excel
                            </a>
                            <a href={route('admin.laporan.export.pdf', { bulan, id_kelas: idKelas })} target="_blank" className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                <DocumentArrowDownIcon className="h-4 w-4" /> PDF
                            </a>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {activeTab === 'kelas' ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Wali Kelas</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hadir</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Absen</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Predikat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {data.laporanPerKelas.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.namaKelas}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{row.waliKelas}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-xs">{row.persentase.hadir}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm">
                                                <div className="flex justify-center gap-1">
                                                    <span className="text-blue-600 font-medium text-xs bg-blue-50 px-1.5 rounded" title="Sakit">S: {row.persentase.sakit}%</span>
                                                    <span className="text-amber-600 font-medium text-xs bg-amber-50 px-1.5 rounded" title="Izin">I: {row.persentase.izin}%</span>
                                                    <span className="text-rose-600 font-medium text-xs bg-rose-50 px-1.5 rounded" title="Alfa">A: {row.persentase.alfa}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    row.status === 'Sangat Baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    row.status === 'Baik' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    row.status === 'Perlu Perhatian' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Guru</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Kehadiran</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Hadir (Hari)</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Ketidakhadiran</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {data.laporanGuru.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.namaGuru}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${row.persentaseKehadiran}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{row.persentaseKehadiran}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-mono text-gray-600">{row.hadir} / {row.totalHariKerja}</td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                                {row.sakit + row.izin + row.alfa > 0 ? (
                                                    <span className="text-rose-600">{row.sakit + row.izin + row.alfa} Hari</span>
                                                ) : (
                                                    <span className="text-emerald-600">Nihil</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                    row.status === 'Sangat Baik' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* --- DRILL DOWN SECTION --- */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                            <ChartBarIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Cek Detail Harian</h3>
                            <p className="text-sm text-gray-500">Lihat siapa saja yang tidak hadir pada tanggal tertentu secara spesifik.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <input 
                            type="date" 
                            value={detailDate} 
                            onChange={e => setDetailDate(e.target.value)}
                            className="bg-white border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button 
                            onClick={() => { setShowDetailModal(true); fetchDetailHarian(); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                        >
                            Cek Data
                        </button>
                    </div>
                </div>

            </div>

            {/* --- MODAL DETAIL HARIAN --- */}
            <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                            Detail Absensi: <span className="text-indigo-600">{new Date(detailDate).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                        </h3>
                        <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                            <span className="sr-only">Close</span>✕
                        </button>
                    </div>

                    {loadingDetail ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
                            <span className="text-sm font-medium">Mengambil data absensi...</span>
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-[60vh] border rounded-lg scrollbar-thin scrollbar-thumb-gray-300">
                            {detailData.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50">
                                    <p className="text-gray-500 font-medium">🎉 Tidak ada data absen (Semua Hadir / Libur)</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Siswa</th>
                                            <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Jam Masuk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {detailData.map((item, idx) => (
                                            <tr key={idx} className={item.status !== 'Hadir' ? 'bg-rose-50/50' : ''}>
                                                <td className="px-5 py-3 text-sm">
                                                    <p className="font-bold text-gray-900">{item.nama}</p>
                                                    <p className="text-xs text-gray-500">{item.nis}</p>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                        item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        item.status === 'Sakit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        item.status === 'Izin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-500 font-mono">{item.jam_masuk}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowDetailModal(false)} className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm font-bold transition shadow-sm">
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>

        </AdminLayout>
    );
}