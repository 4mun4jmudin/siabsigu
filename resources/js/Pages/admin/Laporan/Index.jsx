import { useState, useRef } from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import StatCard from "./Partials/StatCard";
import TrendKehadiranChart from "./Partials/TrendKehadiranChart";
import DistribusiStatusChart from "./Partials/DistribusiStatusChart";
import LaporanSiswaPerKelas from "./Partials/LaporanSiswaPerKelas";
import LaporanGuruTabel from "./Partials/LaporanGuruTabel";
import FilterLaporan from "./Partials/FilterLaporan";
import PerbandinganKelasChart from "./Partials/PerbandinganKelasChart";
import RingkasanLaporan from "./Partials/RingkasanLaporan";
import { DocumentArrowDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import KehadiranMingguanChart from "./Partials/KehadiranMingguanChart"; // <-- 1. Impor komponen baru


export default function LaporanIndex({ auth, data, filters, kelasOptions }) {
    const [activeTab, setActiveTab] = useState("overview");
    const formRef = useRef();

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "laporan_siswa", label: "Laporan Siswa" },
        { id: "laporan_guru", label: "Laporan Guru" },
        { id: "per_kelas", label: "Per Kelas" },
    ];

    const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    /**
     * 👇👇 FUNGSI INI DIPERBARUI 👇👇
     * Fungsi untuk membuat URL ekspor yang menyertakan parameter filter saat ini.
     * @param {string} format - 'pdf' atau 'excel'
     * @returns {string} URL lengkap untuk ekspor.
     */
    const buildExportUrl = (format) => {
        const params = new URLSearchParams(filters).toString();
        // Memanggil nama rute yang sudah diperbaiki
        const routeName = `admin.laporan.export.${format}`;
        return route(routeName) + '?' + params;
    };

    const handleGenerateReport = () => {
        if (formRef.current) {
            formRef.current.requestSubmit();
        }
    };
    
    if (!data) {
        return <AdminLayout user={auth.user}><div className="p-6">Memuat data laporan...</div></AdminLayout>;
    }

    return (
        <AdminLayout user={auth.user}>
            <Head title="Laporan Absensi" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg-px-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Laporan Absensi</h1>
                            <p className="text-gray-500 text-sm mt-1">{currentDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* 👇👇 PEMANGGILAN FUNGSI JUGA DIPERBARUI (menggunakan huruf kecil) 👇👇 */}
                             <a href={buildExportUrl('pdf')} target="_blank" className="inline-flex items-center gap-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition">
                                <DocumentArrowDownIcon className="h-4 w-4" /> Export PDF
                            </a>
                            <a href={buildExportUrl('excel')} target="_blank" className="inline-flex items-center gap-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition">
                                <DocumentArrowDownIcon className="h-4 w-4" /> Export Excel
                            </a>
                             <button onClick={handleGenerateReport} className="inline-flex items-center gap-x-2 px-3 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 transition">
                                <Cog6ToothIcon className="h-4 w-4" /> Generate Report
                            </button>
                        </div>
                    </div>

                    {/* Sisa kode komponen tetap sama */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Laporan Absensi</h3>
                        <p className="text-sm text-gray-500 mb-6">Analisis dan laporan kehadiran siswa dan guru</p>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                           <StatCard title="Rata-rata Kehadiran Siswa" value={`${data.stats.rataRataKehadiranSiswa.percentage}%`} change={data.stats.rataRataKehadiranSiswa.change} status={data.stats.rataRataKehadiranSiswa.status} iconType="siswa" />
                           <StatCard title="Rata-rata Kehadiran Guru" value={`${data.stats.rataRataKehadiranGuru.percentage}%`} change={data.stats.rataRataKehadiranGuru.change} status={data.stats.rataRataKehadiranGuru.status} iconType="guru" />
                           <StatCard title="Siswa Hadir Hari Ini" value={data.stats.siswaHadirHariIni.count} detail={`dari ${data.stats.siswaHadirHariIni.total} siswa`} iconType="siswa_hadir" />
                           <StatCard title="Guru Hadir Hari Ini" value={data.stats.guruHadirHariIni.count} detail={`dari ${data.stats.guruHadirHariIni.total} guru`} iconType="guru_hadir" />
                        </div>
                    </div>

                    <FilterLaporan ref={formRef} initialFilters={filters} kelasOptions={kelasOptions} />
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="border-b border-gray-200">
                           <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                              {tabs.map((tab) => (
                                 <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                       activeTab === tab.id
                                          ? "border-indigo-500 text-indigo-600"
                                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                 >
                                    {tab.label}
                                 </button>
                              ))}
                           </nav>
                        </div>
                        <div className="mt-6">
                           {activeTab === "overview" && (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 <div className="lg:col-span-2">
                                    <h3 className="font-semibold text-gray-800">Trend Kehadiran Bulanan</h3>
                                    <p className="text-sm text-gray-500 mb-4">Persentase kehadiran siswa dan guru dalam 6 bulan terakhir</p>
                                    <TrendKehadiranChart data={data.trenKehadiran} />
                                 </div>
                                 <div>
                                    <h3 className="font-semibold text-gray-800">Distribusi Status Kehadiran</h3>
                                    <p className="text-sm text-gray-500 mb-4">Persentase kehadiran siswa bulan ini</p>
                                    <DistribusiStatusChart data={data.distribusiStatus} />
                                 </div>
                              </div>
                           )}
                           {activeTab === "laporan_siswa" && <LaporanSiswaPerKelas data={data.laporanPerKelas} />}
                           {activeTab === "laporan_guru" && <LaporanGuruTabel data={data.laporanGuru} />}
                           {activeTab === "per_kelas" && <PerbandinganKelasChart data={data.laporanPerKelas} />}
                        </div>
                    </div>

                     <KehadiranMingguanChart data={data.kehadiranMingguan} />

                    <RingkasanLaporan data={data.analitik} />
                </div>
            </div>
        </AdminLayout>
    );
}