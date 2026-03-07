import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CalendarDays,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    AlertCircle,
    List,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Info
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

export default function Index({ kalender, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [viewMode, setViewMode] = useState('calendar'); // 'table' or 'calendar'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [publicHolidays, setPublicHolidays] = useState([]);

    // For Custom Calendar Logic
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        tanggal_mulai: '',
        tanggal_selesai: '',
        keterangan: '',
        jenis_libur: 'Nasional',
    });

    // Auto-fetch national holidays
    React.useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const year = new Date().getFullYear();
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
                if (res.ok) {
                    const data = await res.json();
                    setPublicHolidays(data);
                }
            } catch (error) {
                console.error("Gagal mengambil hari libur nasional:", error);
            }
        };
        fetchHolidays();
    }, []);

    const allEvents = useMemo(() => {
        const dbEvents = kalender.data.map(item => ({
            id: item.id_kalender,
            title: item.keterangan,
            start: item.tanggal_mulai,
            end: item.tanggal_selesai,
            jenis_libur: item.jenis_libur,
            resource: item,
            is_readonly: false
        }));

        const apiEvents = publicHolidays.map(hol => {
            const dateStr = hol.date;

            // Avoid duplicate if Admin already added the same holiday manually
            const isDuplicate = dbEvents.some(dbe =>
                dbe.start <= dateStr && dbe.end >= dateStr && dbe.jenis_libur === 'Nasional'
            );

            if (isDuplicate) return null;

            return {
                id: 'api-' + dateStr + '-' + hol.localName,
                title: hol.localName + ' (Bawaan)',
                start: dateStr,
                end: dateStr,
                jenis_libur: 'Bawaan',
                resource: null,
                is_readonly: true
            };
        }).filter(Boolean);

        return [...dbEvents, ...apiEvents];
    }, [kalender.data, publicHolidays]);

    // Calendar generation functions
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayNames = ["Aha", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const cells = [];

    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
        const d = prevMonthDays - firstDay + i + 1;
        cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month - 1, d) });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }

    // Next month padding (make sure it fills 6 rows = 42 cells)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
        cells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    const getEventsForDate = (dateObj) => {
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localDateStr = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 10);

        return allEvents.filter(e => {
            return localDateStr >= e.start && localDateStr <= e.end;
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.kalender.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const openModal = (item = null) => {
        clearErrors();
        if (item) {
            setEditingId(item.id_kalender);
            setData({
                tanggal_mulai: item.tanggal_mulai,
                tanggal_selesai: item.tanggal_selesai,
                keterangan: item.keterangan,
                jenis_libur: item.jenis_libur,
            });
        } else {
            setEditingId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => reset(), 300);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('admin.kalender.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.kalender.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) {
            destroy(route('admin.kalender.destroy', id));
        }
    };

    const handleCellClick = (dateObj, eventsOnDate) => {
        if (eventsOnDate.length > 0) {
            const event = eventsOnDate[0];
            if (!event.is_readonly) {
                openModal(event.resource);
            }
        } else {
            // Open modal to add new event on this date
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            const localDateStr = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 10);

            clearErrors();
            setEditingId(null);
            reset();
            setData({
                tanggal_mulai: localDateStr,
                tanggal_selesai: localDateStr,
                keterangan: '',
                jenis_libur: 'Nasional',
            });
            setIsModalOpen(true);
        }
    };

    return (
        <AdminLayout>
            <Head title="Kalender Akademik" />

            <div className="bg-white shadow rounded-lg p-6 max-w-7xl mx-auto mt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <CalendarDays className="mr-2 text-indigo-600" />
                            Kalender Akademik (Hari Libur)
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Kelola jadwal libur nasional dan sekolah. Hari libur tidak akan dianggap Alfa.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-3 py-1.5 rounded-md flex items-center text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <CalendarIcon size={16} className="mr-2" />
                                Kalender
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-md flex items-center text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List size={16} className="mr-2" />
                                Tabel Data
                            </button>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-150"
                        >
                            <Plus size={18} className="mr-2" />
                            Tambah
                        </button>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    <div className="border border-gray-100 rounded-xl p-6 bg-[#f8fafc] shadow-inner">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-4">
                                {monthNames[month]} {year}
                                <button onClick={handleToday} className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 shadow-sm font-medium">
                                    Hari Ini
                                </button>
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white hover:shadow transition bg-transparent text-gray-600 border border-transparent hover:border-gray-200">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white hover:shadow transition bg-transparent text-gray-600 border border-transparent hover:border-gray-200">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid Header */}
                        <div className="grid grid-cols-7 gap-3 mb-2">
                            {dayNames.map((day, idx) => (
                                <div key={idx} className="text-center font-bold text-gray-600 text-sm pb-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid Body */}
                        <div className="grid grid-cols-7 gap-3">
                            {cells.map((cell, idx) => {
                                const isSunday = cell.date.getDay() === 0;
                                const cellEvents = getEventsForDate(cell.date);

                                // Determine cell background styling based on events & sunday
                                let bgColorClass = 'bg-white border-gray-100 shadow-sm'; // Default white style per user request
                                let dayTextColor = cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-300';
                                let tooltipTitle = '';

                                if (cellEvents.length > 0) {
                                    // Map first event color
                                    const evt = cellEvents[0];
                                    tooltipTitle = cellEvents.map(e => e.title).join(", ");

                                    if (evt.jenis_libur === 'Nasional' || evt.jenis_libur === 'Bawaan') {
                                        bgColorClass = 'bg-[#fce4e4] border-[#fbcdcd] hover:bg-[#fbd3d3] shadow-sm';
                                        dayTextColor = 'text-red-600';
                                    } else if (evt.jenis_libur === 'Sekolah') {
                                        bgColorClass = 'bg-blue-100 border-blue-200 hover:bg-blue-200 shadow-sm';
                                        dayTextColor = 'text-blue-700';
                                    } else {
                                        bgColorClass = 'bg-orange-100 border-orange-200 hover:bg-orange-200 shadow-sm';
                                        dayTextColor = 'text-orange-700';
                                    }
                                } else if (isSunday) {
                                    // Sundays without specific events stay red/pinkish
                                    bgColorClass = 'bg-[#fce4e4] border-[#fbcdcd] hover:bg-[#fbd3d3] shadow-sm';
                                    dayTextColor = cell.isCurrentMonth ? 'text-red-600' : 'text-red-300';
                                } else {
                                    // Hover effect for normal empty days
                                    bgColorClass = 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md shadow-sm transition-shadow';
                                }

                                const today = new Date();
                                const isToday = cell.date.getDate() === today.getDate() &&
                                    cell.date.getMonth() === today.getMonth() &&
                                    cell.date.getFullYear() === today.getFullYear();

                                return (
                                    <div
                                        key={idx}
                                        title={tooltipTitle} // Native HTML Tooltip (menggelembung)
                                        onClick={() => handleCellClick(cell.date, cellEvents)}
                                        className={`
                                            min-h-[100px] rounded-xl p-2 border relative cursor-pointer
                                            transition-all duration-200 select-none
                                            ${bgColorClass}
                                            ${!cell.isCurrentMonth ? 'opacity-50' : ''}
                                            ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#fdfaf3]' : ''}
                                        `}
                                    >
                                        <div className={`absolute top-2 right-3 font-semibold ${dayTextColor}`}>
                                            {cell.day}
                                        </div>

                                        {/* Optional: Add little dot decorations like the image */}
                                        {cellEvents.length > 0 && (
                                            <div className="absolute top-3 left-2 flex flex-col gap-1">
                                                {cellEvents.map((evt, i) => (
                                                    <span key={i} className="w-2 h-2 rounded-full bg-white/60 shadow-sm border border-black/10"></span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Invisible label placeholder (simulating image tooltip style internally if wanted, but standard HTML title is used for hover) */}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-gray-600 justify-center bg-white py-3 px-4 rounded-lg shadow-sm w-max mx-auto border border-gray-200">
                            <span className="flex items-center"><span className="w-4 h-4 rounded-md bg-[#fce4e4] border border-[#fbcdcd] mr-2 shadow-sm"></span> Minggu Sahaja</span>
                            <span className="flex items-center"><span className="w-4 h-4 rounded-md bg-[#fce4e4] border border-[#fbcdcd] mr-2 shadow-sm"></span> Libur Nasional</span>
                            <span className="flex items-center"><span className="w-4 h-4 rounded-md bg-blue-100 border border-blue-200 mr-2 shadow-sm"></span> Libur Sekolah</span>
                            <span className="flex items-center"><span className="w-4 h-4 rounded-md bg-orange-100 border border-orange-200 mr-2 shadow-sm"></span> Libur Lainnya</span>
                            <span className="flex items-center"><span className="w-4 h-4 rounded-md bg-white border border-gray-200 mr-2 shadow-sm"></span> Hari Kerja</span>
                            <span className="flex items-center ml-2 text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full"><Info size={14} className="mr-1" /> Arahkan Kursor (Hover) pada blok warna untuk melihat nama libur</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSearch} className="mb-6 flex">
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari keterangan libur..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 transition duration-150">
                                Cari
                            </button>
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); router.get(route('admin.kalender.index')); }}
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                >
                                    Reset
                                </button>
                            )}
                        </form>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Keterangan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Mulai</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Selesai</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis Libur</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {kalender.data.length > 0 ? (
                                        kalender.data.map((item) => (
                                            <tr key={item.id_kalender} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.keterangan}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.tanggal_mulai}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.tanggal_selesai}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${item.jenis_libur === 'Nasional' ? 'bg-red-100 text-red-800' :
                                                            item.jenis_libur === 'Sekolah' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}
                                                    >
                                                        {item.jenis_libur}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openModal(item)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id_kalender)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                Tidak ada data hari libur ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {kalender.links.length > 3 && (
                            <div className="mt-4 flex justify-end">
                                <div className="flex space-x-1">
                                    {kalender.links.map((link, i) => (
                                        <button
                                            key={i}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'
                                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex justify-between items-center" id="modal-title">
                                            {editingId ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
                                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500"><X size={20} /></button>
                                        </h3>

                                        <div className="mt-4">
                                            <form onSubmit={submit}>
                                                <div className="mb-4">
                                                    <label className="block text-gray-700 text-sm font-bold mb-2">Keterangan / Nama Libur</label>
                                                    <input
                                                        type="text"
                                                        value={data.keterangan}
                                                        onChange={e => setData('keterangan', e.target.value)}
                                                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors.keterangan ? 'border-red-500' : ''}`}
                                                        placeholder="Cth: Hari Raya Idul Fitri"
                                                    />
                                                    {errors.keterangan && <p className="text-red-500 text-xs italic mt-1">{errors.keterangan}</p>}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-gray-700 text-sm font-bold mb-2">Tanggal Mulai</label>
                                                        <input
                                                            type="date"
                                                            value={data.tanggal_mulai}
                                                            onChange={e => setData('tanggal_mulai', e.target.value)}
                                                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors.tanggal_mulai ? 'border-red-500' : ''}`}
                                                        />
                                                        {errors.tanggal_mulai && <p className="text-red-500 text-xs italic mt-1">{errors.tanggal_mulai}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-700 text-sm font-bold mb-2">Tanggal Selesai</label>
                                                        <input
                                                            type="date"
                                                            value={data.tanggal_selesai}
                                                            onChange={e => setData('tanggal_selesai', e.target.value)}
                                                            min={data.tanggal_mulai}
                                                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors.tanggal_selesai ? 'border-red-500' : ''}`}
                                                        />
                                                        {errors.tanggal_selesai && <p className="text-red-500 text-xs italic mt-1">{errors.tanggal_selesai}</p>}
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="block text-gray-700 text-sm font-bold mb-2">Jenis Libur</label>
                                                    <select
                                                        value={data.jenis_libur}
                                                        onChange={e => setData('jenis_libur', e.target.value)}
                                                        className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${errors.jenis_libur ? 'border-red-500' : ''}`}
                                                    >
                                                        <option value="Nasional">Nasional (Tanggal Merah)</option>
                                                        <option value="Sekolah">Sekolah (Libur Semester / Khusus)</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                    {errors.jenis_libur && <p className="text-red-500 text-xs italic mt-1">{errors.jenis_libur}</p>}
                                                </div>

                                                {data.tanggal_mulai && data.tanggal_selesai && new Date(data.tanggal_mulai) > new Date(data.tanggal_selesai) && (
                                                    <div className="mb-4 bg-red-50 flex items-center p-3 rounded text-red-800 text-sm">
                                                        <AlertCircle size={16} className="mr-2" />
                                                        Tanggal selesai tidak boleh lebih awal dari tanggal mulai!
                                                    </div>
                                                )}

                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                                    >
                                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={closeModal}
                                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
