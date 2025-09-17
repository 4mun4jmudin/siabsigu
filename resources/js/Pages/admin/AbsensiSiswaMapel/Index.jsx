// resources/js/Pages/Admin/AbsensiSiswaMapel/Index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Select from 'react-select';

/**
 * Index (reworked)
 * - Single global status dropdown (no per-row dropdown)
 * - Metode absen hidden from UI
 * - Floating save button when there are unsaved changes (isDirty)
 */

const StatusBadge = ({ status }) => {
    const map = {
        'Hadir': 'bg-emerald-100 text-emerald-800',
        'Sakit': 'bg-yellow-100 text-yellow-800',
        'Izin': 'bg-sky-100 text-sky-800',
        'Alfa': 'bg-red-100 text-red-800',
        'Digantikan': 'bg-orange-100 text-orange-800',
        'Tugas': 'bg-violet-100 text-violet-800',
        'Belum Absen': 'bg-gray-100 text-gray-700',
    };

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default function AbsensiSiswaMapelIndex(props) {
    const {
        absensi = [],
        pertemuan = null,
        jadwalOptions = [],
        kelasOptions = [],
        guruOptions = [],
        summary = {},
        filters = {},
        canEdit = false,
        routes = {},
    } = props;

    const page = usePage();
    const authUser = page.props?.auth?.user ?? null;
    const { flash } = page.props;

    const { data, setData, post, processing, errors, reset } = useForm({
        id_jadwal: filters.id_jadwal ?? null,
        tanggal: filters.tanggal ?? new Date().toISOString().substring(0, 10),
        absensi: absensi.map(a => ({
            id_absensi_mapel: a.id_absensi_mapel ?? null,
            id_siswa: a.siswa?.id_siswa ?? null,
            nis: a.siswa?.nis ?? '',
            nama_lengkap: a.siswa?.nama_lengkap ?? '',
            kelas_label: a.siswa?.kelas?.tingkat ? `${a.siswa.kelas.tingkat} ${a.siswa.kelas.jurusan ?? ''}` : (a.siswa?.kelas?.nama_lengkap ?? ''),
            status_kehadiran: a.status_kehadiran ?? 'Hadir',
            jam_mulai: a.jam_mulai ?? null,
            jam_selesai: a.jam_selesai ?? null,
            metode_absen: a.metode_absen ?? 'Manual',
            keterangan: a.keterangan ?? '',
            id_penginput_manual: a.id_penginput_manual ?? null,
            updated_at: a.updated_at ?? null,
        }))
    });

    // local editable rows
    const [localRows, setLocalRows] = useState(data.absensi);
    useEffect(() => { setLocalRows(data.absensi); }, [data.absensi]);

    // filter state for controls
    const [filterState, setFilterState] = useState({
        tanggal: filters.tanggal ?? data.tanggal,
        id_jadwal: filters.id_jadwal ?? data.id_jadwal ?? null,
        id_kelas: filters.id_kelas ?? null,
        id_guru: filters.id_guru ?? null,
    });

    // keep form in sync with localRows and filters
    useEffect(() => { setData('absensi', localRows); }, [localRows]);
    useEffect(() => { setData('tanggal', filterState.tanggal); setData('id_jadwal', filterState.id_jadwal); }, [filterState.tanggal, filterState.id_jadwal]);

    // selection for bulk actions
    const [selectedIds, setSelectedIds] = useState(new Set());
    useEffect(() => { setSelectedIds(new Set()); }, [absensi]);

    const toggleSelect = (id) => {
        if (!id) return;
        setSelectedIds(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });
    };

    const isAllSelected = localRows.length > 0 && localRows.every(r => r.id_absensi_mapel && selectedIds.has(r.id_absensi_mapel));
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(localRows.filter(r => r.id_absensi_mapel).map(r => r.id_absensi_mapel)));
        }
    };

    // dirty tracking & beforeunload
    const [isDirty, setIsDirty] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    // update row (edits)
    const updateRow = (idx, field, value) => {
        setLocalRows(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
        setIsDirty(true);
    };

    // global status dropdown (single)
    const [bulkStatus, setBulkStatus] = useState('');
    const applyBulkStatus = () => {
        if (!bulkStatus) return alert('Pilih status terlebih dahulu.');
        if (selectedIds.size === 0) return alert('Pilih minimal satu siswa.');
        const ids = Array.from(selectedIds);
        setLocalRows(prev => prev.map(r => ids.includes(r.id_absensi_mapel) ? { ...r, status_kehadiran: bulkStatus } : r));
        setSelectedIds(new Set());
        setBulkStatus('');
        setIsDirty(true);
    };

    const setAllPresent = () => {
        setLocalRows(prev => prev.map(r => ({ ...r, status_kehadiran: 'Hadir' })));
        setIsDirty(true);
    };

    const resetAll = () => {
        const resetRows = absensi.map(a => ({
            id_absensi_mapel: a.id_absensi_mapel ?? null,
            id_siswa: a.siswa?.id_siswa ?? null,
            nis: a.siswa?.nis ?? '',
            nama_lengkap: a.siswa?.nama_lengkap ?? '',
            kelas_label: a.siswa?.kelas?.tingkat ? `${a.siswa.kelas.tingkat} ${a.siswa.kelas.jurusan ?? ''}` : (a.siswa?.kelas?.nama_lengkap ?? ''),
            status_kehadiran: a.status_kehadiran ?? 'Hadir',
            jam_mulai: a.jam_mulai ?? null,
            jam_selesai: a.jam_selesai ?? null,
            metode_absen: a.metode_absen ?? 'Manual',
            keterangan: a.keterangan ?? '',
            id_penginput_manual: a.id_penginput_manual ?? null,
            updated_at: a.updated_at ?? null,
        }));
        setLocalRows(resetRows);
        setSelectedIds(new Set());
        setIsDirty(false);
    };

    // submit save
    const submitSave = (e) => {
        e?.preventDefault?.();
        // only include rows that either already exist (id_absensi_mapel) OR status != 'Belum Absen'
        const toSendRows = localRows.filter(r => {
            // keep existing records (even if status unchanged)
            if (r.id_absensi_mapel) return true;
            // if not existing and still 'Belum Absen' -> do not send (no create)
            if ((r.status_kehadiran ?? '') === 'Belum Absen') return false;
            // else new row where user set real status -> send create
            return true;
        });

        const payload = {
            id_jadwal: filterState.id_jadwal ?? data.id_jadwal,
            tanggal: filterState.tanggal ?? data.tanggal,
            absensi: toSendRows.map(r => ({
                id_absensi_mapel: r.id_absensi_mapel,
                id_siswa: r.id_siswa,
                status_kehadiran: r.status_kehadiran,
                keterangan: r.keterangan,
                metode_absen: r.metode_absen ?? 'Manual',
                jam_mulai: r.jam_mulai,
                jam_selesai: r.jam_selesai,
                id_guru_pengganti: r.id_guru_pengganti ?? null,
            }))
        };

        post(routes.store ?? route('admin.absensi-siswa-mapel.store'), {
            data: payload,
            onSuccess: () => {
                window.toast?.success?.('Perubahan disimpan.');
                setIsDirty(false);
            },
            onError: () => {
                window.toast?.error?.('Gagal menyimpan perubahan.');
            }
        });
    };


    // import form
    const importForm = useForm({ file: null, id_jadwal: filterState.id_jadwal ?? data.id_jadwal, tanggal: filterState.tanggal ?? data.tanggal });
    useEffect(() => { importForm.setData('id_jadwal', filterState.id_jadwal ?? data.id_jadwal); importForm.setData('tanggal', filterState.tanggal ?? data.tanggal); }, [filterState.id_jadwal, filterState.tanggal]);

    const handleImportSubmit = (e) => {
        e.preventDefault();
        const f = importForm.data.file;
        if (!f) return alert('Pilih file CSV terlebih dahulu.');
        const fd = new FormData();
        fd.append('file', f);
        fd.append('id_jadwal', importForm.data.id_jadwal);
        fd.append('tanggal', importForm.data.tanggal);

        window.axios.post(routes.import ?? route('admin.absensi-siswa-mapel.import'), fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                window.toast?.success?.('Import selesai.');
                window.location.reload();
            })
            .catch(err => {
                console.error(err);
                window.toast?.error?.('Import gagal. Periksa format CSV.');
            });
    };

    // exports
    const handleExportCsv = () => {
        const q = new URLSearchParams({
            tanggal: filterState.tanggal ?? data.tanggal,
            id_jadwal: filterState.id_jadwal ?? '',
            type: 'csv',
        }).toString();
        window.location.href = `${(routes.export ?? route('admin.absensi-siswa-mapel.export'))}?${q}`;
    };
    const handleExportPdfPertemuan = () => {
        const q = new URLSearchParams({
            tanggal: filterState.tanggal ?? data.tanggal,
            id_jadwal: filterState.id_jadwal ?? '',
            type: 'pdf',
            monthly: '0'
        }).toString();
        window.location.href = `${(routes.export ?? route('admin.absensi-siswa-mapel.export'))}?${q}`;
    };
    const handleExportPdfMonthly = () => {
        if (!filterState.id_jadwal) return alert('Export PDF bulanan memerlukan Jadwal/Mapel dipilih (id_jadwal).');
        const q = new URLSearchParams({
            tanggal: filterState.tanggal ?? data.tanggal,
            id_jadwal: filterState.id_jadwal,
            type: 'pdf',
            monthly: '1'
        }).toString();
        window.location.href = `${(routes.export ?? route('admin.absensi-siswa-mapel.export'))}?${q}`;
    };

    // derived summary
    const derivedSummary = useMemo(() => {
        const total = localRows.length;
        const counts = localRows.reduce((acc, r) => { acc[r.status_kehadiran] = (acc[r.status_kehadiran] || 0) + 1; return acc; }, {});
        return { total, counts };
    }, [localRows]);

    // select helpers for react-select
    const selectedJadwalOption = useMemo(() => jadwalOptions.find(j => j.value === filterState.id_jadwal) ?? null, [filterState.id_jadwal, jadwalOptions]);
    const selectedKelasOption = useMemo(() => kelasOptions.find(k => k.value === filterState.id_kelas) ?? null, [filterState.id_kelas, kelasOptions]);
    const selectedGuruOption = useMemo(() => guruOptions.find(g => g.value === filterState.id_guru) ?? null, [filterState.id_guru, guruOptions]);

    // filter/show navigation
    const handleShow = (e) => {
        e?.preventDefault?.();
        const payload = { tanggal: filterState.tanggal, id_jadwal: filterState.id_jadwal, id_kelas: filterState.id_kelas, id_guru: filterState.id_guru };
        const qObj = {};
        Object.keys(payload).forEach(k => {
            if (payload[k] !== null && payload[k] !== undefined && payload[k] !== '') qObj[k] = payload[k];
        });
        const q = new URLSearchParams(qObj).toString();
        const base = route('admin.absensi-siswa-mapel.index');
        window.location.href = q ? `${base}?${q}` : base;
    };

    useEffect(() => {
        if (flash?.success) window.toast?.success?.(flash.success);
        if (flash?.error) window.toast?.error?.(flash.error);
    }, [flash]);

    // edit modal state (keep to allow individual edits)
    const [editingIdx, setEditingIdx] = useState(null);
    const openEdit = (i) => setEditingIdx(i);
    const closeEdit = () => setEditingIdx(null);

    const statusOptions = [
        { value: 'Hadir', label: 'Hadir' },
        { value: 'Sakit', label: 'Sakit' },
        { value: 'Izin', label: 'Izin' },
        { value: 'Alfa', label: 'Alfa' },
        { value: 'Digantikan', label: 'Digantikan' },
        { value: 'Tugas', label: 'Tugas' },
    ];

    return (
        <AdminLayout header="Kelola Absensi Siswa per Mapel" user={authUser}>
            <Head title="Kelola Absensi Siswa per Mapel" />

            <div className="space-y-6">
                {/* Top controls */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <form className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end" onSubmit={handleShow}>
                        <div className="col-span-1 md:col-span-2">
                            <InputLabel value="Tanggal" htmlFor="tanggal" />
                            <TextInput id="tanggal" type="date" value={filterState.tanggal} onChange={(e) => { setFilterState(s => ({ ...s, tanggal: e.target.value, id_jadwal: null })); setData('tanggal', e.target.value); importForm.setData('tanggal', e.target.value); }} />
                        </div>

                        <div className="col-span-1 md:col-span-4">
                            <InputLabel value="Jadwal / Mapel" />
                            <div className="min-w-0">
                                <Select classNamePrefix="react-select" isClearable options={jadwalOptions} value={selectedJadwalOption} onChange={(opt) => { const val = opt ? opt.value : null; setFilterState(s => ({ ...s, id_jadwal: val })); setData('id_jadwal', val); importForm.setData('id_jadwal', val); }} placeholder="Pilih jadwal..." />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <InputLabel value="Filter Kelas" />
                            <Select classNamePrefix="react-select" isClearable options={kelasOptions} value={selectedKelasOption} onChange={(opt) => setFilterState(s => ({ ...s, id_kelas: opt ? opt.value : null }))} placeholder="Pilih kelas..." />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <InputLabel value="Filter Guru" />
                            <Select classNamePrefix="react-select" isClearable options={guruOptions} value={selectedGuruOption} onChange={(opt) => setFilterState(s => ({ ...s, id_guru: opt ? opt.value : null }))} placeholder="Pilih guru..." />
                        </div>

                        <div className="col-span-1 md:col-span-12 flex flex-wrap gap-2 justify-end">
                            <PrimaryButton type="submit">Tampilkan</PrimaryButton>
                            <PrimaryButton type="button" onClick={() => window.location.href = route('admin.absensi-siswa-mapel.create')}>Buat Pertemuan</PrimaryButton>
                            <PrimaryButton type="button" onClick={() => document.getElementById('csv-file-input')?.click()}>Import CSV</PrimaryButton>
                            <PrimaryButton type="button" onClick={handleExportCsv}>Export CSV</PrimaryButton>
                            <PrimaryButton type="button" onClick={handleExportPdfPertemuan}>Export PDF (Pertemuan)</PrimaryButton>
                            <PrimaryButton type="button" onClick={handleExportPdfMonthly}>Export PDF (Bulanan)</PrimaryButton>
                        </div>

                        <form onSubmit={handleImportSubmit} className="hidden" id="import-form">
                            <input id="csv-file-input" type="file" accept=".csv" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} />
                        </form>
                    </form>
                </div>

                {/* Header & summary */}
                <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold truncate">{pertemuan ? `${pertemuan.mapel_name} • ${pertemuan.kelas_name}` : 'Pertemuan: (Pilih jadwal)'}</h2>
                        <p className="text-sm text-gray-500 truncate">{pertemuan ? `${pertemuan.guru_name} — ${pertemuan.jam_mulai ?? '-'} / ${pertemuan.jam_selesai ?? '-'} — ${pertemuan.tanggal}` : 'Tanggal: ' + filterState.tanggal}</p>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="text-sm">
                            <div className="text-xs text-gray-500">Total Siswa</div>
                            <div className="font-semibold">{derivedSummary.total}</div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {['Hadir', 'Izin', 'Sakit', 'Alfa', 'Digantikan', 'Tugas'].map(k => (
                                <div key={k} className="text-xs text-center">
                                    <div className="text-gray-500 truncate" style={{ maxWidth: 80 }}>{k}</div>
                                    <div className="font-medium">{derivedSummary.counts[k] ?? 0} {derivedSummary.total ? `(${Math.round(((derivedSummary.counts[k] ?? 0) / derivedSummary.total) * 100)}%)` : ''}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => window.axios.post(routes.lock ?? route('admin.absensi-siswa-mapel.lock'), { id_jadwal: filterState.id_jadwal, tanggal: filterState.tanggal })} className="text-sm text-red-600">Lock</button>
                        </div>
                    </div>
                </div>

                {/* Table + bulk controls */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4" />
                            <span className="text-sm">Pilih semua</span>
                            <div className="h-6 w-px bg-gray-200 mx-2" />

                            <div className="flex gap-2 flex-wrap items-center">
                                {/* single global dropdown for status */}
                                <select className="text-sm border rounded px-2 py-1" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                                    <option value="">Pilih status untuk terapkan</option>
                                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <button onClick={applyBulkStatus} className="text-sm px-2 py-1 border rounded">Terapkan</button>

                                <button onClick={() => runBulkKeteranganPlaceholder(selectedIds, routes)} className="text-sm px-2 py-1 border rounded">Tambah Keterangan</button>

                                <button onClick={() => { setAllPresent(); }} className="text-sm px-2 py-1 bg-sky-600 text-white rounded">Set Semua Hadir</button>
                                <button onClick={() => resetAll()} className="text-sm px-2 py-1 border rounded">Reset</button>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500">{localRows.length} baris</div>
                    </div>

                    <div className="overflow-x-auto -mx-4 px-4">
                        <table className="min-w-[1000px] w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4" /></th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">No</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">NIS</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Nama</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Kelas</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Jam Masuk</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Jam Pulang</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Keterangan</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Penginput</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Terakhir Diubah</th>
                                    <th className="px-3 py-2 text-left text-xs text-gray-500">Aksi</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {localRows.map((row, idx) => (
                                    <tr key={row.id_absensi_mapel ?? `${row.id_siswa}-${idx}`}>
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                disabled={!row.id_absensi_mapel}
                                                checked={row.id_absensi_mapel ? selectedIds.has(row.id_absensi_mapel) : false}
                                                onChange={() => row.id_absensi_mapel && toggleSelect(row.id_absensi_mapel)}
                                                className="h-4 w-4"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-sm">{idx + 1}</td>
                                        <td className="px-3 py-2 text-sm">{row.nis}</td>
                                        <td className="px-3 py-2 text-sm truncate max-w-[220px]">{row.nama_lengkap}</td>
                                        <td className="px-3 py-2 text-sm">{row.kelas_label}</td>

                                        {/* status shown as badge only (no per-row dropdown) */}
                                        <td className="px-3 py-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={row.status_kehadiran} />
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 text-sm"><input type="time" className="text-sm border rounded px-2 py-1 w-28" value={row.jam_mulai ?? ''} onChange={(e) => updateRow(idx, 'jam_mulai', e.target.value)} /></td>

                                        <td className="px-3 py-2 text-sm"><input type="time" className="text-sm border rounded px-2 py-1 w-28" value={row.jam_selesai ?? ''} onChange={(e) => updateRow(idx, 'jam_selesai', e.target.value)} /></td>

                                        <td className="px-3 py-2 text-sm"><input type="text" className="text-sm border rounded px-2 py-1 w-full" value={row.keterangan ?? ''} onChange={(e) => updateRow(idx, 'keterangan', e.target.value)} /></td>

                                        <td className="px-3 py-2 text-sm whitespace-nowrap">{row.id_penginput_manual ?? '-'}</td>
                                        <td className="px-3 py-2 text-sm whitespace-nowrap">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</td>

                                        <td className="px-3 py-2 text-sm">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => openEdit(idx)} className="px-2 py-1 border rounded text-xs">Edit</button>
                                                <button type="button" onClick={() => { const newStatus = row.status_kehadiran === 'Hadir' ? 'Alfa' : 'Hadir'; updateRow(idx, 'status_kehadiran', newStatus); }} className="px-2 py-1 border rounded text-xs">{row.status_kehadiran === 'Hadir' ? 'Set Alfa' : 'Set Hadir'}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mt-4 gap-3">
                        <button className="px-3 py-2 border rounded" onClick={() => { resetAll(); }}>Batal</button>
                        <PrimaryButton processing={processing} onClick={submitSave}>Simpan Absensi</PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {editingIdx !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-lg w-full max-w-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Edit Absensi — {localRows[editingIdx].nama_lengkap}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-600">Status</label>
                                <div className="mt-1"><StatusBadge status={localRows[editingIdx].status_kehadiran} /></div>
                                <select className="mt-2 w-full border rounded px-2 py-1" value={localRows[editingIdx].status_kehadiran} onChange={(e) => updateRow(editingIdx, 'status_kehadiran', e.target.value)}>
                                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Jam Mulai</label>
                                <input type="time" className="w-full border rounded px-2 py-2" value={localRows[editingIdx].jam_mulai ?? ''} onChange={(e) => updateRow(editingIdx, 'jam_mulai', e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Jam Selesai</label>
                                <input type="time" className="w-full border rounded px-2 py-2" value={localRows[editingIdx].jam_selesai ?? ''} onChange={(e) => updateRow(editingIdx, 'jam_selesai', e.target.value)} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-600">Keterangan</label>
                                <input type="text" className="w-full border rounded px-2 py-2" value={localRows[editingIdx].keterangan ?? ''} onChange={(e) => updateRow(editingIdx, 'keterangan', e.target.value)} />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={closeEdit} className="px-3 py-2 border rounded">Tutup</button>
                            <PrimaryButton onClick={() => { closeEdit(); }}>Simpan</PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Save Button */}
            {isDirty && (
                <div className="fixed right-6 bottom-6 z-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-2 rounded-full shadow-md text-sm font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5v14" /></svg>
                            <span>Perubahan belum disimpan</span>
                        </div>

                        <button
                            onClick={submitSave}
                            disabled={processing}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

/* Helper kecil untuk contoh: menjalankan bulk keterangan placeholder.
   Kalau Anda gunakan endpoint khusus, ubah panggilan axios sesuai. */
function runBulkKeteranganPlaceholder(selectedIds, routes) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert('Pilih minimal satu siswa.');
    const keterangan = prompt('Masukkan keterangan untuk banyak siswa:');
    if (keterangan === null) return;
    window.axios.post(routes.bulk_update ?? route('admin.absensi-siswa-mapel.bulk_update'), { ids, keterangan })
        .then(() => {
            window.toast?.success?.('Keterangan massal diterapkan');
            window.location.reload();
        })
        .catch(err => {
            console.error(err);
            window.toast?.error?.('Gagal menerapkan keterangan massal');
        });
}
