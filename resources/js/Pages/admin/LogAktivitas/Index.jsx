import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    MagnifyingGlassIcon, 
    CalendarDaysIcon,
    ArrowPathIcon,
    BarsArrowDownIcon
} from '@heroicons/react/24/outline';

const LogAktivitasStatusBadge = ({ aksi }) => {
    let color = "bg-gray-100 text-gray-800 border-gray-200";
    if (aksi.toLowerCase().includes('login') || aksi.toLowerCase().includes('masuk')) color = "bg-blue-50 text-blue-700 border-blue-200";
    if (aksi.toLowerCase().includes('tambah') || aksi.toLowerCase().includes('create')) color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (aksi.toLowerCase().includes('ubah') || aksi.toLowerCase().includes('update') || aksi.toLowerCase().includes('edit')) color = "bg-amber-50 text-amber-700 border-amber-200";
    if (aksi.toLowerCase().includes('hapus') || aksi.toLowerCase().includes('delete') || aksi.toLowerCase().includes('tolak')) color = "bg-red-50 text-red-700 border-red-200";
    if (aksi.toLowerCase().includes('setujui') || aksi.toLowerCase().includes('approve')) color = "bg-teal-50 text-teal-700 border-teal-200";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
            {aksi}
        </span>
    );
};

export default function Index({ logs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        setIsLoading(true);
        router.get(route('admin.log-aktivitas.index'), { search, date }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleReset = () => {
        setSearch('');
        setDate('');
        setIsLoading(true);
        router.get(route('admin.log-aktivitas.index'), {}, {
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-2">
                            <BarsArrowDownIcon className="h-7 w-7 text-indigo-600" />
                            Log Aktivitas Sistem
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Pantau semua jejak tindakan pengguna (Audit Trail) untuk keamanan.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Log Aktivitas Sistem" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* FILTER SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cari Keterangan / Pengguna</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg"
                                    placeholder="Ketik nama atau aksi..."
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Filter Tanggal</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Mencari...' : 'Terapkan'}
                            </button>
                            {(search || date) && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex-1 sm:flex-none justify-center inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <ArrowPathIcon className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* TABLE SECTION */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                                        Waktu
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
                                        Pengguna
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                        Aksi
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Detail Keterangan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <tr key={log.id_log} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="font-medium text-gray-900">{new Date(log.waktu).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-xs text-gray-500">{new Date(log.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3 border border-indigo-200">
                                                        {log.pengguna?.nama_lengkap ? log.pengguna.nama_lengkap.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 line-clamp-1">{log.pengguna?.nama_lengkap || 'Sistem / Guest'}</div>
                                                        <div className="text-xs text-gray-500">{log.pengguna?.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <LogAktivitasStatusBadge aksi={log.aksi} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <p className="line-clamp-2" title={log.keterangan}>{log.keterangan}</p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <BarsArrowDownIcon className="h-12 w-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-900">Tidak ada log aktivitas</p>
                                                <p className="text-gray-500 mt-1">Belum ada jejak yang terekam atau filter terlalu spesifik.</p>
                                                {(search || date) && (
                                                    <button onClick={handleReset} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
                                                        Hapus Filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINATION */}
                {logs.links && logs.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
                        <div className="flex flex-1 justify-between sm:hidden">
                             {logs.prev_page_url ? (
                                <Link
                                    href={logs.prev_page_url}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Previous
                                </Link>
                             ) : <div></div>}
                            {logs.next_page_url ? (
                                <Link
                                    href={logs.next_page_url}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Next
                                </Link>
                            ) : <div></div>}
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Menampilkan <span className="font-medium">{logs.from || 0}</span> sampai{' '}
                                    <span className="font-medium">{logs.to || 0}</span> dari{' '}
                                    <span className="font-medium">{logs.total}</span> hasil
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {logs.links.map((link, index) => {
                                        let label = link.label;
                                        if (label.includes('Previous')) label = '«';
                                        if (label.includes('Next')) label = '»';

                                        return link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold border ${
                                                    link.active
                                                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                    index === logs.links.length - 1 ? 'rounded-r-md' : ''
                                                } ${!link.active && !link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 ${
                                                    index === 0 ? 'rounded-l-md' : ''
                                                } ${index === logs.links.length - 1 ? 'rounded-r-md' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: label }}
                                            />
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
