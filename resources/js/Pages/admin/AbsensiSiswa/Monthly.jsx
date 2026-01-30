import React, { useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    DocumentArrowDownIcon,
    TableCellsIcon,
    ArrowUturnLeftIcon,
    FunnelIcon,
    CalendarDaysIcon,
    BuildingLibraryIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    ChartPieIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon as CheckSolid,
    ExclamationTriangleIcon as WarnSolid,
    InformationCircleIcon as InfoSolid,
    XCircleIcon as XSolid
} from "@heroicons/react/24/solid";

// --- Components ---

const StatCard = ({ label, value, icon, colorClass, bgClass, detail }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-full">
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bgClass} ${colorClass} bg-opacity-20 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                {icon}
            </div>
        </div>
        {detail && (
            <div className="mt-3 z-10 relative">
                 <span className={`text-xs font-semibold ${colorClass}`}>{detail}</span>
            </div>
        )}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${bgClass} opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
    </div>
);

const ProgressBar = ({ value, colorClass }) => (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div 
            className={`h-2.5 rounded-full ${colorClass}`} 
            style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
    </div>
);

export default function Monthly({ auth, filters, kelasOptions = [], rows = [], featureMode = 'full' }) {
    const month = filters?.month || new Date().toISOString().slice(0, 7);
    const kelas = filters?.id_kelas || "";

    const buildExportUrl = (fmt) => {
        const params = new URLSearchParams({ month, id_kelas: kelas });
        const name = fmt === 'excel' ? 'admin.absensi-siswa.bulanan.export.excel' : 'admin.absensi-siswa.bulanan.export.pdf';
        try {
            return `${route(name)}?${params.toString()}`;
        } catch (e) {
            return '#';
        }
    };

    const onChangeFilter = (key, value) => {
        const q = { month, id_kelas: kelas, [key]: value };
        router.get(route('admin.absensi-siswa.bulanan.index'), q, { preserveState: true, preserveScroll: true, replace: true });
    };

    const total = useMemo(() => {
        const init = { hadir: 0, sakit: 0, izin: 0, alfa: 0, expected: 0 };
        return (rows || []).reduce((acc, r) => {
            acc.hadir += Number(r.hadir || 0);
            acc.sakit += Number(r.sakit || 0);
            acc.izin += Number(r.izin || 0);
            acc.alfa += Number(r.alfa || 0);
            return acc;
        }, init);
    }, [rows]);

    const totalTercatat = total.hadir + total.sakit + total.izin + total.alfa;
    const persenHadir = totalTercatat ? Math.round((total.hadir / totalTercatat) * 100) : 0;

    // Format Month Label
    const monthLabel = new Date(month + "-01").toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <AdminLayout user={auth.user} header="Rekap Absensi Bulanan">
            <Head title={`Rekap ${monthLabel}`} />

            <div className="space-y-6">
                
                {/* Section 1: Top Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Overall Performance */}
                    <div className="lg:col-span-4">
                        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg h-full relative overflow-hidden flex flex-col justify-center">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <ChartPieIcon className="w-6 h-6 text-indigo-100" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-indigo-50">Performa Kehadiran</h3>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-5xl font-bold">{persenHadir}%</span>
                                    <span className="text-indigo-200">Rata-rata</span>
                                </div>
                                <p className="text-sm text-indigo-200/80 mb-6">
                                    Periode: {monthLabel}
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-indigo-200">
                                        <span>Kehadiran</span>
                                        <span>{total.hadir} siswa</span>
                                    </div>
                                    <div className="w-full bg-indigo-900/50 rounded-full h-2">
                                        <div className="bg-emerald-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${persenHadir}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            {/* Decor */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                        </div>
                    </div>

                    {/* Right: Detail Stats */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard 
                            label="Hadir" 
                            value={total.hadir} 
                            icon={<CheckSolid className="w-6 h-6" />} 
                            bgClass="bg-emerald-50" 
                            colorClass="text-emerald-600" 
                        />
                        <StatCard 
                            label="Sakit" 
                            value={total.sakit} 
                            icon={<WarnSolid className="w-6 h-6" />} 
                            bgClass="bg-blue-50" 
                            colorClass="text-blue-600" 
                        />
                        <StatCard 
                            label="Izin" 
                            value={total.izin} 
                            icon={<InfoSolid className="w-6 h-6" />} 
                            bgClass="bg-indigo-50" 
                            colorClass="text-indigo-600" 
                        />
                        <StatCard 
                            label="Alfa" 
                            value={total.alfa} 
                            icon={<XSolid className="w-6 h-6" />} 
                            bgClass="bg-rose-50" 
                            colorClass="text-rose-600" 
                        />
                    </div>
                </div>

                {/* Section 2: Filters & Actions */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {/* Month Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Pilih Periode
                                </label>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="month"
                                        value={month}
                                        onChange={(e) => onChangeFilter('month', e.target.value)}
                                        className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Class Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Filter Kelas
                                </label>
                                <div className="relative">
                                    <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={kelas}
                                        onChange={(e) => onChangeFilter('id_kelas', e.target.value)}
                                        className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {kelasOptions.map(k => (
                                            <option key={k.id_kelas} value={k.id_kelas}>
                                                {k.tingkat} {k.jurusan}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex rounded-xl shadow-sm bg-gray-50 p-1 border border-gray-200">
                                <a 
                                    href={buildExportUrl('excel')} 
                                    target="_blank"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all"
                                >
                                    <TableCellsIcon className="h-4 w-4 mr-2" /> 
                                    Excel
                                </a>
                                <div className="w-px bg-gray-300 my-1"></div>
                                <a 
                                    href={buildExportUrl('pdf')} 
                                    target="_blank"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-white hover:text-rose-600 hover:shadow-sm transition-all"
                                >
                                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" /> 
                                    PDF
                                </a>
                            </div>
                            
                            <Link
                                href={route('admin.absensi-siswa.index', { id_kelas: kelas })}
                                className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                            >
                                <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                                Input Harian
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Section 3: Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Siswa Aktif</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hadir</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Sakit</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Izin</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Alfa</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5">Tingkat Kehadiran</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Rata-rata Telat</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(rows || []).length > 0 ? (
                                    rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                {row.nama_kelas}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {row.siswa_aktif} Siswa
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    {row.hadir}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className="text-gray-600">{row.sakit}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className="text-gray-600">{row.izin}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {row.alfa > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                        {row.alfa}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-gray-700 min-w-[3ch]">{row.persen_hadir}%</span>
                                                    <ProgressBar 
                                                        value={row.persen_hadir} 
                                                        colorClass={
                                                            row.persen_hadir >= 90 ? 'bg-emerald-500' :
                                                            row.persen_hadir >= 75 ? 'bg-indigo-500' :
                                                            'bg-rose-500'
                                                        } 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {row.rata_telat > 0 ? (
                                                    <div className="flex items-center justify-end gap-1 text-yellow-600">
                                                        <ClockIcon className="w-4 h-4" />
                                                        <span className="font-medium">{row.rata_telat}m</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-emerald-600 font-medium text-xs">Tepat Waktu</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                                    <DocumentArrowDownIcon className="h-8 w-8 text-gray-300" />
                                                </div>
                                                <p className="font-medium text-gray-900">Belum ada data rekapitulasi</p>
                                                <p className="text-xs text-gray-500 mt-1">Coba pilih periode bulan lain atau pastikan data absensi harian sudah diisi.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}