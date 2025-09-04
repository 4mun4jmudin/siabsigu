// resources/js/Pages/Guru/AbsensiHarian/Index.jsx
import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import toast from 'react-hot-toast';
import GuruLayout from '@/Layouts/GuruLayout';
import { Clock, LogIn, LogOut, CheckCircle, Plus } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index(props) {
    const {
        auth,
        absensiHariIni,
        jadwalHariIni,
        canPulang,
        history,
        login_manual_enabled,
        filter: serverFilter,
        filter_date: serverFilterDate,
        flash,
    } = props;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [pulangNotified, setPulangNotified] = useState(false);
    const [filter, setFilter] = useState(serverFilter || 'day');
    const [dateValue, setDateValue] = useState(serverFilterDate || new Date().toISOString().slice(0, 10));
    const [showIzinModal, setShowIzinModal] = useState(false);

    const { post: postAction, processing: processingAction } = useForm();
    const { data, setData, post, processing, errors, reset } = useForm({
        status: 'Sakit',
        tanggal: new Date().toISOString().slice(0, 10),
        keterangan: '',
    });

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Biarkan ini menjadi satu-satunya sumber notifikasi
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.info) toast(flash.info);
    }, [flash]);

    useEffect(() => {
        if (canPulang && jadwalHariIni && !pulangNotified) {
            const jam = jadwalHariIni.jam_selesai ? jadwalHariIni.jam_selesai.slice(0, 5) : '—';
            toast.success(`Waktu absen pulang sudah aktif — jadwal pulang ${jam}`);
            setPulangNotified(true);
        } else if (!canPulang && pulangNotified) {
            setPulangNotified(false);
        }
    }, [canPulang, jadwalHariIni, pulangNotified]);

    const formatPeriodLabel = () => {
        if (!dateValue) return '';
        const d = new Date(dateValue);
        if (filter === 'day') {
            return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        }
        if (filter === 'week') {
            const day = d.getDay();
            const isoDow = (day === 0) ? 7 : day;
            const monday = new Date(d);
            monday.setDate(d.getDate() - (isoDow - 1));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const formatDate = (dt) => dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            return `${formatDate(monday)} — ${formatDate(sunday)}`;
        }
        if (filter === 'month') {
            return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
        return '';
    };

    const applyFilter = (newFilter = filter, newDate = dateValue) => {
        let dateParam = newDate || new Date().toISOString().slice(0, 10);

        const params = new URLSearchParams({
            filter: newFilter,
            date: dateParam,
        }).toString();

        const url = route('guru.absensi-harian.index') + '?' + params;
        window.location.href = url;
    };

    const onFilterChange = (newFilter) => {
        setFilter(newFilter);
        if (newFilter === 'month') {
            const d = dateValue ? new Date(dateValue) : new Date();
            const monthStr = d.toISOString().slice(0, 7);
            setDateValue(monthStr + '-01');
            applyFilter(newFilter, monthStr + '-01');
        } else {
            applyFilter(newFilter, dateValue);
        }
    };

    const onDateChange = (e) => {
        const val = e.target.value;
        if (filter === 'month') {
            setDateValue(val + '-01');
            applyFilter(filter, val + '-01');
        } else {
            setDateValue(val);
            applyFilter(filter, val);
        }
    };

    const getAbsensiStatus = () => {
        if (!absensiHariIni) return null;
        return (absensiHariIni.status_kehadiran || absensiHariIni.status || '').trim();
    };

    const isIzinOrSakit = () => {
        const s = getAbsensiStatus();
        return s === 'Sakit' || s === 'Izin';
    };

    const handleMasuk = (e) => {
        e?.preventDefault();
        if (isIzinOrSakit()) {
            toast.error('Anda sudah mengajukan Sakit/Izin. Hubungi admin untuk mengubah status.');
            return;
        }
        postAction(route('guru.absensi-harian.store'), {
            preserveScroll: true,
        });
    };

    const handlePulang = (e) => {
        e?.preventDefault();
        if (isIzinOrSakit()) {
            toast.error('Anda tercatat Sakit/Izin, tidak dapat Absen Pulang.');
            return;
        }

        if (!canPulang) {
            const jam = jadwalHariIni?.jam_selesai ? jadwalHariIni.jam_selesai.slice(0, 5) : 'waktu pulang';
            toast.error(`Belum waktunya absen pulang. Jadwal pulang pada ${jam}.`);
            return;
        }

        postAction(route('guru.absensi-harian.store'), {
            preserveScroll: true,
        });
    };

    const openIzinModal = () => setShowIzinModal(true);
    const closeIzinModal = () => { setShowIzinModal(false); reset(); };

    // --- FUNGSI INI YANG DIPERBAIKI ---
    const submitIzin = (e) => {
        e?.preventDefault();
        if (!data.keterangan || data.keterangan.trim().length < 3) {
            toast.error('Keterangan minimal 3 karakter.');
            return;
        }
        // Hapus confirm() agar lebih modern
        // if (!confirm(`Kirim pengajuan ${data.status} untuk tanggal ${data.tanggal}?`)) return;

        post(route('guru.absensi-harian.izin'), {
            data: data,
            preserveScroll: true,
            onSuccess: () => {
                // Biarkan notifikasi ditangani oleh flash
                closeIzinModal();
            },
            onError: (errors) => {
                // Tampilkan error validasi dari server jika ada
                if (Object.keys(errors).length > 0) {
                    const msgs = Object.values(errors).flat().join('\n');
                    toast.error(msgs || 'Gagal mengirim pengajuan.');
                } else {
                    toast.error('Gagal mengirim pengajuan. Cek koneksi atau hubungi admin.');
                }
            },
        });
    };
    // ------------------------------------

    const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const renderDateInput = () => {
        if (filter === 'month') {
            const monthVal = dateValue ? dateValue.slice(0, 7) : new Date().toISOString().slice(0, 7);
            return (
                <input
                    type="month"
                    value={monthVal}
                    onChange={(e) => {
                        const m = e.target.value;
                        setDateValue(m + '-01');
                        applyFilter(filter, m + '-01');
                    }}
                    className="rounded-md border px-3 py-2"
                />
            );
        } else {
            const dv = dateValue ? dateValue.slice(0, 10) : new Date().toISOString().slice(0, 10);
            return (
                <input
                    type="date"
                    value={dv}
                    onChange={(e) => onDateChange(e)}
                    className="rounded-md border px-3 py-2"
                />
            );
        }
    };

    const FilterControls = () => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md shadow-sm" role="tablist" aria-label="Filter periode">
                    <button type="button" onClick={() => onFilterChange('day')} className={`px-3 py-1.5 text-sm rounded-l-md ${filter === 'day' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Hari</button>
                    <button type="button" onClick={() => onFilterChange('week')} className={`px-3 py-1.5 text-sm ${filter === 'week' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Minggu</button>
                    <button type="button" onClick={() => onFilterChange('month')} className={`px-3 py-1.5 text-sm rounded-r-md ${filter === 'month' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Bulan</button>
                </div>

                <div className="ml-3">
                    {renderDateInput()}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">Periode: <strong>{formatPeriodLabel()}</strong></div>
                <PrimaryButton type="button" onClick={() => applyFilter(filter, dateValue)}>Terapkan</PrimaryButton>
            </div>
        </div>
    );

    const renderHistoryTable = () => (
        <div className="bg-white shadow rounded-lg p-4">
            {history && history.length > 0 ? (
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500">
                            <th className="py-2">Tanggal</th>
                            <th>Hari</th>
                            <th>Jadwal</th>
                            <th>Status</th>
                            <th>Jam Masuk</th>
                            <th>Jam Pulang</th>
                            <th>Metode</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((h) => (
                            <tr key={h.tanggal} className="border-t">
                                <td className="py-2">{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td>{h.hari}</td>
                                <td>{h.has_schedule ? 'Ada' : 'Tidak ada jadwal'}</td>
                                <td>
                                    <span className={`px-2 py-1 rounded-full text-xs ${h.status === 'Hadir' ? 'bg-green-100 text-green-800' : (h.status === 'Sakit' || h.status === 'Izin') ? 'bg-yellow-100 text-yellow-800' : (h.status === 'Alfa') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {h.status}
                                    </span>
                                </td>
                                <td>{h.jam_masuk ?? '-'}</td>
                                <td>{h.jam_pulang ?? '-'}</td>
                                <td>{h.metode ?? '-'}</td>
                                <td>{h.keterangan ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-sm text-gray-500">Tidak ada data untuk periode ini.</p>
            )}
        </div>
    );

    const absStatus = getAbsensiStatus();
    const jamMasuk = absensiHariIni?.jam_masuk ? absensiHariIni.jam_masuk.slice(0, 5) : null;
    const jamPulang = absensiHariIni?.jam_pulang ? absensiHariIni.jam_pulang.slice(0, 5) : null;
    const keterangan = absensiHariIni?.keterangan ?? null;

    return (
        <GuruLayout user={auth.user} header="Absensi Harian Saya">
            <Head title="Absensi Harian" />
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
                    <div className="p-6 text-center bg-sky-600 text-white">
                        <p className="text-sky-200">Waktu sekarang</p>
                        <h1 className="text-4xl font-bold tracking-tighter mt-2">{formattedTime}</h1>
                        {jadwalHariIni ? (
                            <p className="mt-2 text-sm">Jadwal hari ini: {jadwalHariIni.jam_mulai.slice(0, 5)} - {jadwalHariIni.jam_selesai.slice(0, 5)}</p>
                        ) : null}
                        <div className="mt-4 flex items-center justify-center gap-3">
                            {absStatus ? (
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                    <div className="text-sm">
                                        <div className="font-semibold">{absStatus}</div>
                                        {jamMasuk && <div className="text-xs text-sky-100">Masuk: {jamMasuk}</div>}
                                        {jamPulang && <div className="text-xs text-sky-100">Pulang: {jamPulang}</div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                    <LogIn className="w-5 h-5 text-white" />
                                    <div className="text-sm">
                                        <div className="font-semibold">Belum Absen</div>
                                        <div className="text-xs text-sky-100">Silakan absen masuk</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {keterangan && (
                            <div className="mt-3 text-sm text-white/90">
                                <strong>Keterangan:</strong> {keterangan}
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        {jadwalHariIni ? (
                            absensiHariIni && absensiHariIni.jam_masuk ? (
                                absensiHariIni.jam_pulang ? (
                                    <div className="text-center">
                                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <div>Absensi hari ini selesai.</div>
                                        <div className="mt-2 text-sm text-gray-600">Jam masuk: {jamMasuk} — Jam pulang: {jamPulang}</div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div>Sudah absen masuk pada <strong>{jamMasuk}</strong></div>
                                        <div className="mt-3">
                                            <PrimaryButton onClick={handlePulang} className="mr-2">
                                                <LogOut className="w-4 h-4 mr-2 inline" /> Absen Pulang Sekarang
                                            </PrimaryButton>
                                            <PrimaryButton variant="outline" onClick={openIzinModal} className="ml-2">
                                                <Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit / Izin
                                            </PrimaryButton>
                                        </div>
                                        {!canPulang && (
                                            <p className="text-sm text-gray-500 mt-2">Belum waktunya pulang: jadwal pulang {jadwalHariIni.jam_selesai.slice(0, 5)}</p>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="text-center">
                                    <div>Silakan absen masuk untuk hari ini.</div>
                                    <div className="mt-3">
                                        <PrimaryButton onClick={handleMasuk} disabled={!login_manual_enabled}>
                                            <LogIn className="w-4 h-4 mr-2 inline" /> Absen Masuk Sekarang
                                        </PrimaryButton>
                                        <PrimaryButton variant="outline" onClick={openIzinModal} className="ml-2">
                                            <Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit / Izin
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="text-center">
                                <div>Hari ini tidak ada jadwal mengajar — absensi tidak wajib.</div>
                                <div className="mt-3">
                                    <PrimaryButton onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit / Izin</PrimaryButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <FilterControls />
                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Riwayat Kehadiran — {formatPeriodLabel()}</h3>
                    {renderHistoryTable()}
                </div>
            </div>
            {showIzinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h4 className="font-semibold">Ajukan Sakit / Izin</h4>
                            <button onClick={closeIzinModal} className="text-gray-500 hover:text-gray-800">Tutup</button>
                        </div>
                        <form onSubmit={submitIzin} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" value={data.status} onChange={(e) => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2">
                                    <option value="Sakit">Sakit</option>
                                    <option value="Izin">Izin</option>
                                </select>
                                {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                                <input type="date" name="tanggal" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                                {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                                <textarea name="keterangan" value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" rows={4} placeholder="Jelaskan keterangan..." />
                                {errors.keterangan && <p className="text-xs text-red-600 mt-1">{errors.keterangan}</p>}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeIzinModal} className="px-4 py-2 rounded-md border text-sm" disabled={processing}>Batal</button>
                                <PrimaryButton type="submit" disabled={processing}>{processing ? 'Mengirim...' : 'Kirim Pengajuan'}</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </GuruLayout>
    );
}