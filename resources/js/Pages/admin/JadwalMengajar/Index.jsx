import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/id'; // Import locale Bahasa Indonesia

import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import {
    PlusCircleIcon,
    PencilIcon,
    TrashIcon,
    CalendarDaysIcon,
    ClockIcon,
    BookOpenIcon,
    UsersIcon,
    TableCellsIcon,
    EyeIcon,
    UserCircleIcon,
    BuildingLibraryIcon,
    QueueListIcon,
    DocumentArrowDownIcon,
    PrinterIcon
} from '@heroicons/react/24/solid';

// set moment locale supaya format lokal konsisten
moment.locale('id');

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

// --- Komponen-komponen Kecil ---
const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center border-l-4" style={{ borderColor: color }}>
        <div className="flex-shrink-0 mr-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${color}1A` }}>
                {React.cloneElement(icon, { className: "h-5 w-5", style: { color } })}
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const DailyStatCard = ({ day, stats }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between border border-gray-50">
        <div>
            <p className="text-sm font-semibold text-gray-600 text-center">{day}</p>
            <p className="text-2xl font-extrabold text-indigo-600 text-center mt-2">{stats.hours} <span className="text-sm font-medium text-gray-400">Jam</span></p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-around text-xs text-gray-600">
            <div className="text-center">
                <p className="font-bold text-sm">{stats.subjects}</p>
                <p className="text-gray-400">Mapel</p>
            </div>
            <div className="text-center">
                <p className="font-bold text-sm">{stats.teachers}</p>
                <p className="text-gray-400">Guru</p>
            </div>
        </div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className={`flex justify-between items-start gap-4 py-3`}>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 font-semibold text-right max-w-[60%] break-words">{value || '-'}</dd>
    </div>
);

// --- Helper Functions ---
const generateColor = (str) => {
    if (!str) return 'hsl(0, 0%, 80%)';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
};

// flatten jadwalByDay into array
const flattenJadwal = (jadwalByDay) => {
    const daysOrderFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const arr = [];
    daysOrderFull.forEach(day => {
        (jadwalByDay[day] || []).forEach(j => {
            arr.push({ ...j, hari: day });
        });
    });
    // sort by day order then by jam_mulai
    const dayIndex = (d) => daysOrderFull.indexOf(d);
    arr.sort((a, b) => {
        const di = dayIndex(a.hari) - dayIndex(b.hari);
        if (di !== 0) return di;
        // compare times
        return (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
    });
    return arr;
};

// --- Main Component ---
export default function Index({
    auth, kelasOptions, guruOptions, mapelOptions, jadwalByDay, scheduleGrid,
    tahunAjaranAktif, stats, filters, errors, flash,
}) {
    // --- State Management ---
    const [viewMode, setViewMode] = useState('calendar'); // calendar | grid | daily | list
    const [events, setEvents] = useState([]);
    const [calendarKey, setCalendarKey] = useState(1);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [jadwalToDelete, setJadwalToDelete] = useState(null);
    const [scheduleDetail, setScheduleDetail] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const [localFilters, setLocalFilters] = useState({
        filter_by: filters?.filter_by || 'kelas',
        kelas_id: filters?.kelas_id || '',
        guru_id: filters?.guru_id || '',
    });

    const [selectedDay, setSelectedDay] = useState('Senin'); // for daily grid

    // export/print states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'export' | 'print'
    const [confirmFormat, setConfirmFormat] = useState(null); // 'pdf' | 'excel' | null
    const [autoPrint, setAutoPrint] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, post, put, delete: destroy, reset, processing, recentlySuccessful, clearErrors } =
        useForm({
            id_jadwal: '',
            id_tahun_ajaran: tahunAjaranAktif?.id_tahun_ajaran || '',
            id_kelas: '',
            id_mapel: '',
            id_guru: '',
            hari: 'Senin',
            jam_mulai: '',
            jam_selesai: '',
        });

    // --- Effects Hooks ---
    useEffect(() => {
        const allJadwal = Object.values(jadwalByDay).flat();

        const formattedEvents = allJadwal.map(jadwal => {
            const dayIndex = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].indexOf(jadwal.hari);
            const baseDate = moment().day(dayIndex).startOf('day');

            const [startHour, startMinute] = (jadwal.jam_mulai || '00:00').split(':').map(n => parseInt(n, 10));
            const [endHour, endMinute] = (jadwal.jam_selesai || '00:00').split(':').map(n => parseInt(n, 10));

            const startDateTime = baseDate.clone().hour(startHour).minute(startMinute).second(0).millisecond(0);
            const endDateTime = baseDate.clone().hour(endHour).minute(endMinute).second(0).millisecond(0);

            return {
                title: `${jadwal.mapel?.nama_mapel || 'Mapel Dihapus'} — ${jadwal.guru?.nama_lengkap || 'Guru Dihapus'}`,
                start: startDateTime.toDate(),
                end: endDateTime.toDate(),
                allDay: false,
                resource: jadwal,
            };
        });

        setEvents(formattedEvents);
    }, [jadwalByDay]);

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const params = {
            filter_by: localFilters.filter_by,
            ...(localFilters.filter_by === 'kelas' && { kelas_id: localFilters.kelas_id }),
            ...(localFilters.filter_by === 'guru' && { guru_id: localFilters.guru_id }),
        };
        router.get(route('admin.jadwal-mengajar.index'), params, { preserveState: true, replace: true, preserveScroll: true });
    }, [localFilters]);

    useEffect(() => {
        if (recentlySuccessful) {
            closeFormModal();
            closeDeleteModal();
        }
    }, [recentlySuccessful]);

    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const dailyStats = useMemo(() => {
        const dailyData = {};
        daysOrder.forEach(day => {
            const jadwalHarian = jadwalByDay[day] || [];
            let totalMinutes = 0;
            jadwalHarian.forEach(jadwal => {
                const start = moment(jadwal.jam_mulai, ['HH:mm:ss', 'HH:mm']);
                const end = moment(jadwal.jam_selesai, ['HH:mm:ss', 'HH:mm']);
                if (start.isValid() && end.isValid()) {
                    totalMinutes += end.diff(start, 'minutes');
                }
            });
            const uniqueSubjects = new Set(jadwalHarian.map(j => j.id_mapel)).size;
            const uniqueTeachers = new Set(jadwalHarian.map(j => j.id_guru)).size;
            dailyData[day] = {
                hours: (totalMinutes / 60).toFixed(1),
                subjects: uniqueSubjects,
                teachers: uniqueTeachers
            };
        });
        return dailyData;
    }, [jadwalByDay]);

    // flattened list for daftar
    const jadwalList = useMemo(() => flattenJadwal(jadwalByDay), [jadwalByDay]);

    // --- Handlers ---
    const handleEventDrop = ({ event, start, end }) => {
        const originalEvents = [...events];
        const updatedEvents = events.map(e =>
            e.resource.id_jadwal === event.resource.id_jadwal ? { ...e, start, end } : e
        );
        setEvents(updatedEvents);

        // kirim sebagai string lokal tanpa konversi ke UTC
        router.patch(route('admin.jadwal-mengajar.updateTime', event.resource.id_jadwal), {
            start: moment(start).format('YYYY-MM-DD HH:mm:ss'),
            end: moment(end).format('YYYY-MM-DD HH:mm:ss'),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // sukses
            },
            onError: (serverErrors) => {
                setEvents(originalEvents);
                const conflictError = serverErrors.id_kelas || serverErrors.id_guru;
                if (conflictError) {
                    toast.error(conflictError);
                } else {
                    toast.error("Gagal memindahkan jadwal. Mungkin terjadi konflik.");
                }
            },
            onFinish: () => {
                setCalendarKey(prevKey => prevKey + 1);
            }
        });
    };

    const openAddModal = () => { setIsEditMode(false); reset(); setData('id_tahun_ajaran', tahunAjaranAktif?.id_tahun_ajaran); setIsFormModalOpen(true); };
    const openEditModal = (jadwal) => { setIsEditMode(true); reset(); setData({ id_jadwal: jadwal.id_jadwal, id_tahun_ajaran: jadwal.id_tahun_ajaran, id_kelas: jadwal.id_kelas, id_mapel: jadwal.id_mapel, id_guru: jadwal.id_guru, hari: jadwal.hari, jam_mulai: jadwal.jam_mulai, jam_selesai: jadwal.jam_selesai, }); setIsFormModalOpen(true); };
    const openDeleteModal = (jadwal) => { setJadwalToDelete(jadwal); setIsDeleteModalOpen(true); };
    const openDetailModal = (jadwal) => { setIsLoadingDetail(true); setIsDetailModalOpen(true); axios.get(route('admin.jadwal-mengajar.show', jadwal.id_jadwal)).then(response => setScheduleDetail(response.data)).catch(error => { toast.error('Gagal memuat detail jadwal.'); console.error(error); closeDetailModal(); }).finally(() => setIsLoadingDetail(false)); };
    const closeFormModal = () => { setIsFormModalOpen(false); clearErrors(); };
    const closeDeleteModal = () => { setIsDeleteModalOpen(false); setJadwalToDelete(null); };
    const closeDetailModal = () => { setIsDetailModalOpen(false); setScheduleDetail(null); };
    const handleFilterChange = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));
    const submitForm = (e) => { e.preventDefault(); if (isEditMode) { router.patch(route('admin.jadwal-mengajar.update', data.id_jadwal), data, { preserveScroll: true, onSuccess: () => closeFormModal() }); } else { post(route('admin.jadwal-mengajar.store')); } };
    const submitDelete = (e) => { e.preventDefault(); destroy(route('admin.jadwal-mengajar.destroy', jadwalToDelete.id_jadwal)); };

    // event renderer for calendar (show mapel + guru + kelas/ruang)
    const EventComponent = ({ event }) => {
        const r = event.resource || {};
        return (
            <div className="rbc-event-content text-xs leading-tight">
                <div className="font-semibold">{event.title}</div>
                <div className="text-[10px] text-gray-700">
                    {r.kelas?.nama_lengkap ? `${r.kelas.nama_lengkap}` : ''}
                    {r.ruang ? ` • ${r.ruang}` : ''}
                </div>
            </div>
        );
    };

    const buildExportUrl = (format) => {
        const params = new URLSearchParams({
            filter_by: localFilters.filter_by,
            kelas_id: localFilters.kelas_id,
            guru_id: localFilters.guru_id,
        }).toString();

        return route(`admin.jadwal-mengajar.export.${format}`) + '?' + params;
    };

    const openConfirm = (action, format = null) => {
        setConfirmAction(action); // 'export' or 'print'
        setConfirmFormat(format); // 'pdf' | 'excel' | null
        setAutoPrint(false);
        setIsConfirmOpen(true);
    };

    const closeConfirm = () => {
        setIsConfirmOpen(false);
        setConfirmAction(null);
        setConfirmFormat(null);
        setAutoPrint(false);
    };

    // helper: download blob as file
    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    // helper: fetch file as blob
    const fetchFileAsBlob = async (url) => {
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.blob();
    };

    // perform the confirmed action (export / print)
    const performConfirmedAction = async () => {
        if (confirmAction === 'export') {
            const url = buildExportUrl(confirmFormat);
            setIsExporting(true);

            try {
                // If user asked auto-print and format is pdf -> fetch then print
                if (confirmFormat === 'pdf' && autoPrint) {
                    const blob = await fetchFileAsBlob(url);
                    // create blob URL
                    const blobUrl = window.URL.createObjectURL(blob);

                    // create hidden iframe
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    iframe.src = blobUrl;

                    document.body.appendChild(iframe);

                    // wait for iframe load then print
                    iframe.onload = () => {
                        try {
                            // fokus dan print
                            iframe.contentWindow.focus();
                            // some browsers block print unless called from user gesture,
                            // but because this chain started from user click it usually works.
                            iframe.contentWindow.print();
                        } catch (err) {
                            console.error('Print error:', err);
                            toast.error('Gagal mencetak otomatis. Silakan unduh PDF dan cetak manual.');
                        } finally {
                            // cleanup after short delay to allow print dialog to open
                            setTimeout(() => {
                                try { document.body.removeChild(iframe); } catch (e) {}
                                window.URL.revokeObjectURL(blobUrl);
                            }, 2000);
                        }
                    };

                    toast.success('File PDF siap dan print dialog akan muncul...');
                } else {
                    // Normal export (excel or pdf without auto-print)
                    // Use fetch+blob to show loader reliably, then trigger download
                    const blob = await fetchFileAsBlob(url);

                    // derive filename from content-disposition if present (best effort)
                    let filename = confirmFormat === 'excel' ? 'jadwal-mengajar.xlsx' : 'jadwal-mengajar.pdf';
                    // try to parse filename from response headers (not accessible from fetch blob easily),
                    // so use default filename.

                    downloadBlob(blob, filename);
                    toast.success(`Unduhan ${confirmFormat.toUpperCase()} dimulai...`);
                }
            } catch (err) {
                console.error('Export error:', err);
                toast.error('Gagal mengekspor. Coba cek koneksi atau coba lagi.');
            } finally {
                setIsExporting(false);
                closeConfirm();
            }
        } else if (confirmAction === 'print') {
            // Print preview client-side using jadwalList grouping
            setIsExporting(true);
            try {
                const title = (() => {
                    if (localFilters.filter_by === 'guru' && localFilters.guru_id) {
                        const g = guruOptions.find(x => String(x.id_guru) === String(localFilters.guru_id));
                        return `Jadwal Mengajar Guru: ${g ? g.nama_lengkap : localFilters.guru_id}`;
                    } else if (localFilters.filter_by === 'kelas' && localFilters.kelas_id) {
                        const k = kelasOptions.find(x => String(x.id_kelas) === String(localFilters.kelas_id));
                        return `Jadwal Pelajaran Kelas: ${k ? k.nama_lengkap : localFilters.kelas_id}`;
                    }
                    return 'Jadwal Mengajar';
                })();

                const grouped = jadwalList.reduce((acc, cur) => {
                    if (!acc[cur.hari]) acc[cur.hari] = [];
                    acc[cur.hari].push(cur);
                    return acc;
                }, {});

                const tahun = tahunAjaranAktif?.tahun_ajaran || '';
                const semester = tahunAjaranAktif?.semester || '';

                let html = `
                    <!doctype html>
                    <html>
                    <head>
                      <meta charset="utf-8"/>
                      <title>${title}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
                        h1 { font-size: 18px; margin-bottom: 0; }
                        p.meta { margin-top: 4px; color: #555; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                        th, td { border: 1px solid #444; padding: 6px 8px; font-size: 12px; }
                        th { background: #f2f2f2; text-align: left; }
                        .hari { background:#efefef; font-weight: 700; text-align:center; }
                        @media print { .no-print { display: none; } }
                      </style>
                    </head>
                    <body>
                      <div>
                        <h1>${title}</h1>
                        <p class="meta">Tahun Ajaran: ${tahun} • Semester: ${semester}</p>
                        <p class="meta">Dicetak: ${moment().format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                `;

                Object.keys(grouped).forEach(hari => {
                    html += `<h3 style="margin-top:18px;">${hari}</h3>`;
                    html += `<table><thead><tr><th style="width:120px">Waktu</th><th>Mata Pelajaran</th><th>Guru</th><th>Kelas</th><th>Ruang</th></tr></thead><tbody>`;
                    grouped[hari].forEach(j => {
                        html += `<tr>
                            <td>${j.jam_mulai || '-'} - ${j.jam_selesai || '-'}</td>
                            <td>${j.mapel?.nama_mapel || '-'}</td>
                            <td>${j.guru?.nama_lengkap || '-'}</td>
                            <td>${j.kelas?.nama_lengkap || '-'}</td>
                            <td>${j.ruang || '-'}</td>
                        </tr>`;
                    });
                    html += `</tbody></table>`;
                });

                html += `<div style="margin-top:18px;" class="no-print"><button onclick="window.print();">Print</button></div>`;
                html += `</body></html>`;

                const w = window.open('', '_blank', 'noopener');
                if (w) {
                    w.document.open();
                    w.document.write(html);
                    w.document.close();
                    setTimeout(() => {
                        try {
                            w.focus();
                            w.print();
                        } catch (err) {
                            console.error('Gagal otomatis print:', err);
                            toast.error('Gagal otomatis print. Coba print manual di tab baru.');
                        }
                    }, 600);
                    toast.success('Membuka print preview...');
                } else {
                    // fallback: open print in iframe to avoid popup blocking
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    document.body.appendChild(iframe);
                    iframe.contentDocument.open();
                    iframe.contentDocument.write(html);
                    iframe.contentDocument.close();
                    setTimeout(() => {
                        try {
                            iframe.contentWindow.focus();
                            iframe.contentWindow.print();
                        } catch (e) {
                            console.error(e);
                            toast.error('Gagal membuka print preview. Pastikan popup tidak diblokir.');
                        } finally {
                            setTimeout(() => {
                                try { document.body.removeChild(iframe); } catch (e) {}
                            }, 2000);
                        }
                    }, 800);
                }
            } catch (err) {
                console.error('Print preview error:', err);
                toast.error('Gagal menyiapkan print preview.');
            } finally {
                setIsExporting(false);
                closeConfirm();
            }
            return;
        }

        closeConfirm();
    };

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importReport, setImportReport] = useState(null);

   const safeScheduleGrid = scheduleGrid && Array.isArray(scheduleGrid) ? scheduleGrid : [];

    // debug ringan (hapus nanti jika ingin bersih)
    useEffect(() => {
        if (!Array.isArray(scheduleGrid) || scheduleGrid.length === 0) {
            console.debug('[JadwalMengajar] scheduleGrid kosong atau bukan array:', scheduleGrid);
        }
    }, [scheduleGrid]);

    return (
        <AdminLayout user={auth.user} header={`Jadwal Mengajar (T.A. ${tahunAjaranAktif?.tahun_ajaran || ''} - ${tahunAjaranAktif?.semester || ''})`}>
            <Head title="Jadwal Mengajar" />
            <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Tampilan Jadwal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Filter Berdasarkan</label>
                            <div className="mt-2 flex gap-x-4">
                                <div className="flex items-center">
                                    <input type="radio" id="filter_kelas" name="filter_by" value="kelas" checked={localFilters.filter_by === 'kelas'} onChange={() => handleFilterChange('filter_by', 'kelas')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <label htmlFor="filter_kelas" className="ml-2 block text-sm text-gray-900">Kelas</label>
                                </div>
                                <div className="flex items-center">
                                    <input type="radio" id="filter_guru" name="filter_by" value="guru" checked={localFilters.filter_by === 'guru'} onChange={() => handleFilterChange('filter_by', 'guru')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <label htmlFor="filter_guru" className="ml-2 block text-sm text-gray-900">Guru</label>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            {localFilters.filter_by === 'kelas' ? (
                                <div>
                                    <InputLabel htmlFor="kelas_id" value="Pilih Kelas" />
                                    <select id="kelas_id" value={localFilters.kelas_id} onChange={(e) => handleFilterChange('kelas_id', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Pilih Kelas --</option>
                                        {kelasOptions.map((kelas) => (<option key={kelas.id_kelas} value={kelas.id_kelas}>{kelas.nama_lengkap}</option>))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <InputLabel htmlFor="guru_id" value="Pilih Guru" />
                                    <select id="guru_id" value={localFilters.guru_id} onChange={(e) => handleFilterChange('guru_id', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                        <option value="">-- Pilih Guru --</option>
                                        {guruOptions.map((guru) => (<option key={guru.id_guru} value={guru.id_guru}>{guru.nama_lengkap}</option>))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Ringkasan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Jadwal" value={stats.total_jadwal} icon={<CalendarDaysIcon />} color="#3b82f6"/>
                        <StatCard
                        label="Total Jam / Minggu"
                        value={Math.round(Number(stats.total_jam_per_minggu || 0))}
                        icon={<ClockIcon />}
                        color="#10b981"/>
                        <StatCard label="Jumlah Mata Pelajaran" value={stats.jumlah_mapel} icon={<BookOpenIcon />} color="#f97316"/>
                        <StatCard label="Jumlah Guru Mengajar" value={stats.jumlah_guru} icon={<UsersIcon />} color="#8b5cf6"/>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Mingguan</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {daysOrder.map(day => (<DailyStatCard key={day} day={day} stats={dailyStats[day]} />))}
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm relative">
                    {/* Spinner overlay when exporting */}
                    {isExporting && (
                        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center rounded-lg">
                            <div className="flex flex-col items-center gap-3">
                                <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                <div className="text-sm font-medium text-gray-700">Memproses ekspor... tunggu sebentar</div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-x-1 bg-gray-200 p-1 rounded-lg mr-3">
                            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                                <CalendarDaysIcon className="h-5 w-5 inline-block md:mr-2" /><span className="hidden md:inline">Kalender</span>
                            </button>
                            <button onClick={() => setViewMode('grid')} className={`px-2 py-1 text-xs font-semibold rounded-md ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                                <TableCellsIcon className="h-5 w-5 inline-block md:mr-2" /><span className="hidden md:inline">Grid Mingguan</span>
                            </button>
                            <button onClick={() => setViewMode('daily')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'daily' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                                <TableCellsIcon className="h-5 w-5 inline-block md:mr-2" /><span className="hidden md:inline">Grid Harian</span>
                            </button>
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                                <QueueListIcon className="h-5 w-5 inline-block md:mr-2" /><span className="hidden md:inline">Daftar Jadwal</span>
                            </button>
                        </div>
                         <div className="flex items-center gap-x-2">
                            {/* ======================================= */}
                            {/* TOMBOL EKSPOR + CETAK */}
                            {/* ======================================= */}
                            <button
                                onClick={() => openConfirm('export', 'excel')}
                                disabled={isExporting}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition ease-in-out duration-150"
                                title="Ekspor ke Excel"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2 text-green-600" />
                                Excel
                            </button>

                            <button
                                onClick={() => openConfirm('export', 'pdf')}
                                disabled={isExporting}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition ease-in-out duration-150"
                                title="Ekspor ke PDF"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2 text-red-600" />
                                PDF
                            </button>

                            <button
                                onClick={() => openConfirm('print', null)}
                                disabled={isExporting}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition ease-in-out duration-150"
                                title="Cetak Jadwal"
                            >
                                <PrinterIcon className="h-4 w-4 mr-2 text-indigo-600" />
                                Cetak
                            </button>

                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition ease-in-out duration-150"
                                title="Impor dari Excel"
                            >
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12" strokeWidth="2"/><path d="M5 12l7-9 7 9" strokeWidth="2"/></svg>
                                Impor
                            </button>

                            <PrimaryButton onClick={openAddModal}>
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                                Tambah Jadwal
                            </PrimaryButton>
                        </div>
                    </div>

                    {viewMode === 'calendar' && (
                        <div className="h-[75vh] text-sm rbc-calendar">
                            <DnDCalendar
                                key={calendarKey}
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                defaultView="week"
                                views={['month', 'week', 'day', 'agenda']}
                                toolbar={true}
                                culture='id'
                                onEventDrop={handleEventDrop}
                                onSelectEvent={event => openDetailModal(event.resource)}
                                components={{ event: EventComponent }}
                                eventPropGetter={(event) => ({
                                    style: {
                                        backgroundColor: generateColor(event.resource.guru?.nama_lengkap),
                                        borderColor: 'transparent',
                                        color: '#1e293b',
                                        borderRadius: '6px'
                                    }
                                })}
                                messages={{
                                    next: "Berikutnya", previous: "Sebelumnya", today: "Hari Ini", month: "Bulan",
                                    week: "Minggu", day: "Hari", agenda: "Agenda", date: "Tanggal",
                                    time: "Waktu", event: "Acara", noEventsInRange: "Tidak ada jadwal dalam rentang ini.",
                                }}
                            />
                        </div>
                    )}

                    {viewMode === 'grid' && (
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Jam</th>
                                        {daysOrder.map(day => (<th key={day} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{day}</th>))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {safeScheduleGrid.length > 0 ? safeScheduleGrid.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 sticky left-0 bg-white z-10">{row.time}</td>
                                            {daysOrder.map(day => (
                                                <td key={day} className="px-2 py-2 whitespace-nowrap text-sm text-gray-700 align-top">
                                                    {row[day] ? (
                                                        <div className="bg-gray-50 p-3 rounded-md border-l-4 group relative h-full" style={{ borderColor: generateColor(row[day].guru?.nama_lengkap) }}>
                                                            <div className="absolute top-2 right-2 flex gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => openDetailModal(row[day])} className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100" title="Lihat Detail"><EyeIcon className="h-4 w-4"/></button>
                                                                <button onClick={() => openEditModal(row[day])} className="p-1 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="Edit Jadwal"><PencilIcon className="h-4 w-4"/></button>
                                                                <button onClick={() => openDeleteModal(row[day])} className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Hapus Jadwal"><TrashIcon className="h-4 w-4"/></button>
                                                            </div>
                                                            <p className="font-bold text-gray-900 text-xs leading-tight">{row[day].mapel?.nama_mapel || 'Mapel Dihapus'}</p>
                                                            <p className="text-xs text-gray-500 italic mt-1">{row[day].guru?.nama_lengkap || 'Guru Dihapus'}</p>
                                                            {filters.filter_by === 'guru' && <p className="text-xs text-indigo-600 mt-1">{row[day].kelas?.nama_lengkap || 'Kelas Dihapus'}</p>}
                                                        </div>
                                                    ) : <div className="h-16"></div>}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                    <tr>
                                    <td colSpan={daysOrder.length + 1} className="text-center py-12 text-gray-500">
                                        Tidak ada jadwal untuk ditampilkan.
                                    </td>
                                    </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewMode === 'daily' && (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <label className="text-sm text-gray-600">Pilih Hari:</label>
                                <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="border rounded-md p-2">
                                    {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jam</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Guru</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(jadwalByDay[selectedDay] || []).length > 0 ? (jadwalByDay[selectedDay] || []).map((j) => (
                                            <tr key={j.id_jadwal}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{j.jam_mulai} - {j.jam_selesai}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{j.mapel?.nama_mapel || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{j.guru?.nama_lengkap || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{j.kelas?.nama_lengkap || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openDetailModal(j)} className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100" title="Lihat Detail"><EyeIcon className="h-4 w-4"/></button>
                                                        <button onClick={() => openEditModal(j)} className="p-1 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="Edit Jadwal"><PencilIcon className="h-4 w-4"/></button>
                                                        <button onClick={() => openDeleteModal(j)} className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Hapus Jadwal"><TrashIcon className="h-4 w-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="text-center py-12 text-gray-500">Tidak ada jadwal untuk hari ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hari</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Guru</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ruang</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {jadwalList.length > 0 ? jadwalList.map(j => (
                                        <tr key={j.id_jadwal}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{j.hari}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{j.jam_mulai} - {j.jam_selesai}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center" style={{ backgroundColor: generateColor(j.guru?.nama_lengkap) }}>
                                                    <UserCircleIcon className="h-4 w-4 text-indigo-700"/>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{j.guru?.nama_lengkap || '-'}</div>
                                                    <div className="text-xs text-gray-400">{j.guru?.nip || ''}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{j.mapel?.nama_mapel || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{j.kelas?.nama_lengkap || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{j.ruang || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-green-600 font-semibold">Aktif</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openDetailModal(j)} className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100" title="Lihat Detail"><EyeIcon className="h-4 w-4"/></button>
                                                    <button onClick={() => openEditModal(j)} className="p-1 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="Edit Jadwal"><PencilIcon className="h-4 w-4"/></button>
                                                    <button onClick={() => openDeleteModal(j)} className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Hapus Jadwal"><TrashIcon className="h-4 w-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={8} className="text-center py-12 text-gray-500">Tidak ada jadwal.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>

            {/* Konfirmasi Export / Print Modal */}
            <Modal show={isConfirmOpen} onClose={closeConfirm} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Konfirmasi</h3>
                    <p className="text-sm text-gray-600">
                        {confirmAction === 'export' ? (
                            <>Anda akan mengekspor data jadwal ke <span className="font-semibold">{confirmFormat?.toUpperCase()}</span>. Lanjutkan?</>
                        ) : (
                            <>Anda akan membuka tampilan cetak jadwal (print preview). Lanjutkan?</>
                        )}
                    </p>

                    {confirmAction === 'export' && confirmFormat === 'pdf' && (
                        <div className="mt-4 flex items-center gap-3">
                            <input id="autoprint" type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="autoprint" className="text-sm text-gray-700">Cetak otomatis setelah unduh (PDF)</label>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeConfirm} disabled={isExporting}>Batal</SecondaryButton>
                        <PrimaryButton onClick={performConfirmedAction} disabled={isExporting}>
                            {isExporting ? 'Memproses...' : (confirmAction === 'export' ? `Ekspor ${confirmFormat?.toUpperCase()}` : 'Cetak')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            <Modal show={isImportModalOpen} onClose={() => { setIsImportModalOpen(false); setImportFile(null); setImportReport(null); }} maxWidth="md">
            <div className="p-6">
                <h3 className="text-lg font-bold mb-3">Impor Jadwal dari Excel</h3>
                <p className="text-sm text-gray-600 mb-4">Unduh <a href={route('admin.jadwal-mengajar.import.template')} className="text-indigo-600 underline">template</a> dulu, isi, lalu unggah. Kolom wajib: Hari, Jam Mulai, Jam Selesai, Kode Kelas, NIP Guru, Kode Mapel.</p>

                <div className="mb-4">
                    <input type="file" accept=".xls,.xlsx" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                </div>

                {importReport && (
                    <div className="mb-4">
                        <div className="p-3 rounded border bg-gray-50">
                            <p className="text-sm">Total baris: <strong>{importReport.total_rows}</strong></p>
                            <p className="text-sm">Berhasil diimpor: <strong>{importReport.imported}</strong></p>
                            <p className="text-sm">Gagal: <strong>{importReport.failed.length}</strong></p>
                            {importReport.failed.length > 0 && (
                                <div className="mt-2 max-h-40 overflow-auto text-xs">
                                    <table className="min-w-full text-left text-xs">
                                        <thead>
                                            <tr><th className="font-semibold">Baris</th><th className="font-semibold">Alasan</th></tr>
                                        </thead>
                                        <tbody>
                                            {importReport.failed.map((f, i) => (
                                                <tr key={i}><td className="py-1 pr-2">{f.row}</td><td className="py-1">{f.reason}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <SecondaryButton onClick={() => { setIsImportModalOpen(false); setImportFile(null); setImportReport(null); }}>Tutup</SecondaryButton>
                    <PrimaryButton
                        onClick={async () => {
                            if (!importFile) {
                                toast.error('Pilih file terlebih dahulu.');
                                return;
                            }
                            setImporting(true);
                            setImportReport(null);
                            try {
                                const formData = new FormData();
                                formData.append('file', importFile);

                                const resp = await axios.post(route('admin.jadwal-mengajar.import'), formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (resp.data && resp.data.report) {
                                    setImportReport(resp.data.report);
                                    toast.success('Impor selesai. Lihat laporan di bawah.');
                                } else {
                                    toast.success('Impor selesai.');
                                }
                            } catch (err) {
                                console.error(err);
                                const msg = err?.response?.data?.error || 'Gagal mengimpor. Periksa file atau format.';
                                toast.error(msg);
                            } finally {
                                setImporting(false);
                            }
                        }}
                        disabled={importing}
                    >
                        {importing ? 'Mengimpor...' : 'Mulai Impor'}
                    </PrimaryButton>
                </div>
            </div>
            </Modal>


            {/* Modals (form, delete, detail) tetap sama seperti sebelumnya */}
            <Modal show={isFormModalOpen} onClose={closeFormModal} maxWidth="2xl">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{isEditMode ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="id_kelas" value="Kelas" />
                                <select id="id_kelas" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={data.id_kelas} onChange={(e) => setData('id_kelas', e.target.value)}>
                                    <option value="">-- Pilih Kelas --</option>
                                    {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_lengkap}</option>)}
                                </select>
                                <InputError message={errors.id_kelas} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="id_mapel" value="Mata Pelajaran" />
                                <select id="id_mapel" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={data.id_mapel} onChange={(e) => setData('id_mapel', e.target.value)}>
                                    <option value="">-- Pilih Mata Pelajaran --</option>
                                    {mapelOptions.map(m => <option key={m.id_mapel} value={m.id_mapel}>{m.nama_mapel}</option>)}
                                </select>
                                <InputError message={errors.id_mapel} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="id_guru" value="Guru Pengajar" />
                                <select id="id_guru" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={data.id_guru} onChange={(e) => setData('id_guru', e.target.value)}>
                                    <option value="">-- Pilih Guru --</option>
                                    {guruOptions.map(g => <option key={g.id_guru} value={g.id_guru}>{g.nama_lengkap}</option>)}
                                </select>
                                <InputError message={errors.id_guru} className="mt-2" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="hari" value="Hari" />
                                <select id="hari" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={data.hari} onChange={(e) => setData('hari', e.target.value)}>
                                    {daysOrder.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <InputError message={errors.hari} className="mt-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="jam_mulai" value="Jam Mulai" />
                                    <TextInput id="jam_mulai" type="time" className="mt-1 block w-full" value={data.jam_mulai} onChange={(e) => setData('jam_mulai', e.target.value)} />
                                    <InputError message={errors.jam_mulai} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="jam_selesai" value="Jam Selesai" />
                                    <TextInput id="jam_selesai" type="time" className="mt-1 block w-full" value={data.jam_selesai} onChange={(e) => setData('jam_selesai', e.target.value)} />
                                    <InputError message={errors.jam_selesai} className="mt-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <SecondaryButton type="button" onClick={closeFormModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Jadwal'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={isDeleteModalOpen} onClose={closeDeleteModal} maxWidth="md">
                <form onSubmit={submitDelete} className="p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800">Hapus Jadwal Mengajar?</h2>
                    <p className="mt-2 text-sm text-gray-600">Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="mt-6 flex justify-center gap-x-4">
                        <SecondaryButton type="button" onClick={closeDeleteModal}>Batal</SecondaryButton>
                        <DangerButton disabled={processing}>Hapus</DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={isDetailModalOpen} onClose={closeDetailModal} maxWidth="3xl">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Detail Jadwal Mengajar</h2>
                            <p className="text-sm text-gray-500 mt-1">Rincian lengkap jadwal, guru, dan kelas.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <SecondaryButton type="button" onClick={closeDetailModal}>Tutup</SecondaryButton>
                        </div>
                    </div>

                    {isLoadingDetail ? (
                        <div className="text-center py-16">Memuat data...</div>
                    ) : scheduleDetail ? (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="col-span-1 lg:col-span-2">
                                <div className="bg-gradient-to-r from-indigo-50 via-white to-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-16 w-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: generateColor(scheduleDetail.guru?.nama_lengkap) }}>
                                                <BookOpenIcon className="h-8 w-8 text-indigo-700" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-extrabold text-gray-900">{scheduleDetail.mapel?.nama_mapel || '— Mapel Dihapus —'}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{scheduleDetail.hari}, {scheduleDetail.jam_mulai?.substring(0,5)} - {scheduleDetail.jam_selesai?.substring(0,5)}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold"><CalendarDaysIcon className="h-4 w-4 mr-1" /> {scheduleDetail.tahun_ajaran?.tahun_ajaran || '-'}</span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold"><ClockIcon className="h-4 w-4 mr-1" /> {scheduleDetail.jam_mulai?.substring(0,5)} - {scheduleDetail.jam_selesai?.substring(0,5)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-50 shadow-sm">
                                            <p className="text-xs text-gray-500">Informasi Guru</p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-indigo-50" style={{ backgroundColor: generateColor(scheduleDetail.guru?.nama_lengkap) }}>
                                                    <UserCircleIcon className="h-6 w-6 text-indigo-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{scheduleDetail.guru?.nama_lengkap || '-'}</p>
                                                    <p className="text-xs text-gray-500">{scheduleDetail.guru?.jabatan || 'Guru'}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div className="text-xs text-gray-500">NIP</div>
                                                <div className="text-sm font-medium text-gray-800">{scheduleDetail.guru?.nip || '-'}</div>
                                                <div className="text-xs text-gray-500">Username</div>
                                                <div className="text-sm font-medium text-gray-800">{scheduleDetail.guru?.pengguna?.username || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-gray-50 shadow-sm">
                                            <p className="text-xs text-gray-500">Informasi Kelas</p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-yellow-50">
                                                    <BuildingLibraryIcon className="h-6 w-6 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{scheduleDetail.kelas?.nama_lengkap || '-'}</p>
                                                    <p className="text-xs text-gray-500">Wali: {scheduleDetail.kelas?.wali_kelas?.nama_lengkap || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <aside className="col-span-1">
                                <div className="sticky top-6 space-y-4">
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <p className="text-xs text-gray-500">Ringkasan</p>
                                        <div className="mt-3 space-y-2">
                                            <DetailRow label="Mapel" value={scheduleDetail.mapel?.nama_mapel} />
                                            <DetailRow label="Hari" value={scheduleDetail.hari} />
                                            <DetailRow label="Jam" value={`${scheduleDetail.jam_mulai?.substring(0,5)} - ${scheduleDetail.jam_selesai?.substring(0,5)}`} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <p className="text-xs text-gray-500">Kontrol</p>
                                        <div className="mt-3 flex flex-col gap-2">
                                            <PrimaryButton onClick={() => openEditModal(scheduleDetail)} className="w-full justify-center"><PencilIcon className="h-4 w-4 mr-2" /> Edit Jadwal</PrimaryButton>
                                            <DangerButton onClick={() => openDeleteModal(scheduleDetail)} className="w-full justify-center">Hapus Jadwal</DangerButton>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-red-500">Gagal memuat data atau data tidak ditemukan.</div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
