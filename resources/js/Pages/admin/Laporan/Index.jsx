import { useState, useRef, useMemo } from "react";
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
import KehadiranMingguanChart from "./Partials/KehadiranMingguanChart";
import AttendanceHeatmap from "./Partials/AttendanceHeatmap";
import ModalDetailHarian from "./Partials/ModalDetailHarian"; // <-- 1. Impor komponen Modal
import { DocumentArrowDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import axios from "axios"; // <-- 2. Impor Axios untuk memanggil API

export default function LaporanIndex({ auth, data, filters = {}, kelasOptions = [] }) {
    const [activeTab, setActiveTab] = useState("overview");
    const formRef = useRef();

    // --- 👇 3. TAMBAHKAN STATE MANAGEMENT UNTUK MODAL 👇 ---
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalInfo, setModalInfo] = useState({ tanggal: '', namaKelas: '' });
    // --- --------------------------------------------- ---

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "laporan_siswa", label: "Laporan Siswa" },
        { id: "laporan_guru", label: "Laporan Guru" },
        { id: "per_kelas", label: "Per Kelas" },
    ];

    const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const buildExportUrl = (format) => {
        const params = new URLSearchParams(filters).toString();
        const routeName = `admin.laporan.export.${format}`;
        const url = route(routeName) + (params ? `?${params}` : '');
        return encodeURI(url);
    };

    const handleGenerateReport = () => {
        if (formRef.current) {
            formRef.current.requestSubmit();
        }
    };

    const selectedKelasFilter = (filters?.id_kelas && filters.id_kelas !== 'semua')
        ? filters.id_kelas
        : (kelasOptions?.length ? kelasOptions[0].id_kelas : null);

    const selectedClassName = kelasOptions.find(k => k.id_kelas === selectedKelasFilter)?.nama_lengkap || (filters?.id_kelas === 'semua' ? 'Semua Kelas' : 'Pilih Kelas');

    const bulanFilter = (typeof filters?.bulan === 'string' && /^\d{4}-\d{2}$/.test(filters.bulan))
        ? filters.bulan
        : new Date().toISOString().slice(0, 7);

    const [yearStr, monthStr] = bulanFilter.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const heatmapData = useMemo(() => {
        // ... (logika useMemo Anda sudah sangat baik, tidak perlu diubah) ...
        const raw = data?.heatmapData ?? [];
        if (!Array.isArray(raw)) return [];
        return raw.map(item => {
            const date = item?.date ?? item?.tanggal ?? item?.tgl ?? null;
            if (!date) return null;
            const hadir = Number(item.hadir ?? item.hadir_count ?? item.present ?? item.value ?? item.count ?? 0);
            const total = Number(item.total ?? item.jumlah_siswa ?? item.total_siswa ?? 0);
            let count;
            if (total && !isNaN(total) && total > 0) {
                count = Math.round((isNaN(hadir) ? 0 : hadir) / total * 100);
            } else if (typeof item.count !== 'undefined') {
                count = Math.round(Number(item.count) || 0);
            } else if (typeof item.hadir !== 'undefined' && (item.hadir <= 100 && item.hadir >= 0)) {
                count = Math.round(Number(item.hadir) || 0);
            } else {
                count = Math.round(isNaN(hadir) ? 0 : hadir);
            }
            count = Math.max(0, Math.min(100, isNaN(count) ? 0 : count));
            const dateStr = (typeof date === 'string') ? date.slice(0, 10) : (date instanceof Date ? date.toISOString().slice(0, 10) : null);
            return dateStr ? { date: dateStr, count } : null;
        }).filter(Boolean);
    }, [data]);

    // --- 👇 4. GANTI LOGIKA FUNGSI INI 👇 ---
    /**
     * Helper untuk membuka modal detail harian saat user klik pada kotak heatmap
     * @param {object} value - Objek data dari heatmap, e.g., { date: 'YYYY-MM-DD', count: 95 }
     */
    const handleHeatmapDayClick = (value) => {
        if (!value || !value.date) return;

        // Buka modal dan siapkan info awal
        setModalOpen(true);
        setModalData([]); // Kosongkan data lama sambil menunggu data baru
        const formattedDate = new Date(value.date + "T00:00:00").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        setModalInfo({ tanggal: formattedDate, namaKelas: selectedClassName });

        // Panggil API ke backend untuk mengambil data detail
        axios.get(route('admin.laporan.detailHarian'), {
            params: {
                date: value.date,
                id_kelas: selectedKelasFilter ?? 'semua'
            }
        }).then(response => {
            // Setelah data diterima, masukkan ke state modal
            setModalData(response.data);
        }).catch(error => {
            console.error("Gagal mengambil data detail harian:", error);
            // Anda bisa menambahkan notifikasi error di sini jika perlu
        });
    };
    // --- ------------------------------- ---

    if (!data) {
        return <AdminLayout user={auth.user}><div className="p-6">Memuat data laporan...</div></AdminLayout>;
    }

    return (
        <AdminLayout user={auth.user}>
            <Head title="Laporan Absensi" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* ... (Header, Kartu Statistik, Filter, Konten Tab) ... */}
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Laporan Absensi</h1>
                            <p className="text-gray-500 text-sm mt-1">{currentDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={buildExportUrl('pdf')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition" aria-label="Export PDF">
                                <DocumentArrowDownIcon className="h-4 w-4" /> Export PDF
                            </a>
                            <a href={buildExportUrl('excel')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase hover:bg-gray-50 transition" aria-label="Export Excel">
                                <DocumentArrowDownIcon className="h-4 w-4" /> Export Excel
                            </a>
                            <button onClick={handleGenerateReport} className="inline-flex items-center gap-x-2 px-3 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 transition" aria-label="Generate report">
                                <Cog6ToothIcon className="h-4 w-4" /> Generate Report
                            </button>
                        </div>
                    </div>
                    
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
                                        className={`${activeTab === tab.id
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
                                    <div className="lg:col-span-2 space-y-6">
                                        <TrendKehadiranChart data={data.trenKehadiran} />
                                        <KehadiranMingguanChart data={data.kehadiranMingguan} />
                                    </div>
                                    <div className="space-y-6">
                                        <DistribusiStatusChart data={data.distribusiStatus} />
                                        {/* Heatmap sekarang di-render di sini */}
                                        <AttendanceHeatmap
                                            data={heatmapData}
                                            month={month}
                                            year={year}
                                            selectedClassName={selectedClassName}
                                            onDayClick={handleHeatmapDayClick}
                                        />
                                    </div>
                                </div>
                            )}
                            {activeTab === "laporan_siswa" && <LaporanSiswaPerKelas data={data.laporanPerKelas} />}
                            {activeTab === "laporan_guru" && <LaporanGuruTabel data={data.laporanGuru} />}
                            {activeTab === "per_kelas" && <PerbandinganKelasChart data={data.laporanPerKelas} />}
                        </div>
                    </div>

                    <RingkasanLaporan data={data.analitik} />
                </div>
            </div>

            {/* --- 👇 5. RENDER KOMPONEN MODAL DI SINI 👇 --- */}
            <ModalDetailHarian
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                data={modalData}
                tanggal={modalInfo.tanggal}
                namaKelas={modalInfo.namaKelas}
            />
            {/* --- ------------------------------------ --- */}
        </AdminLayout>
    );
}