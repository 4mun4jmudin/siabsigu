// resources/js/Pages/Guru/Index.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { LogIn, LogOut, CheckCircle, Plus, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index(props) {
  const {
    auth,
    absensiHariIni,
    jadwalHariIni,
    canPulang,
    history = [],
    login_manual_enabled,
    filter: serverFilter,
    filter_date: serverFilterDate,
    flash,
  } = props;

  // time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // UI state
  const [filter, setFilter] = useState(serverFilter || 'day');
  const [dateValue, setDateValue] = useState(serverFilterDate || new Date().toISOString().slice(0, 10));
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [pulangNotified, setPulangNotified] = useState(false);

  // form for izin
  const { data, setData, post, processing, errors, reset } = useForm({
    status: 'Sakit',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
  });

  // small dedupe for flash to avoid double toast on StrictMode remount
  const shownFlashRef = useRef(new Set());
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('shownFlashMessages:v1');
      if (raw) shownFlashRef.current = new Set(JSON.parse(raw));
    } catch (e) {}
  }, []);
  useEffect(() => {
    const showMessage = (type, msg) => {
      if (!msg) return;
      const arr = Array.isArray(msg) ? msg : [msg];
      arr.forEach((m) => {
        const key = `${type}:${m}`;
        if (!shownFlashRef.current.has(key)) {
          shownFlashRef.current.add(key);
          try { sessionStorage.setItem('shownFlashMessages:v1', JSON.stringify(Array.from(shownFlashRef.current))); } catch(e){}
          if (type === 'success') toast.success(m); else if (type === 'error') toast.error(m); else toast(m);
        }
      });
    };

    showMessage('success', flash?.success);
    showMessage('error', flash?.error);
    showMessage('info', flash?.info);
  }, [flash]);

  // notification when pulang active
  useEffect(() => {
    if (canPulang && jadwalHariIni && !pulangNotified) {
      const jam = jadwalHariIni.jam_selesai ? jadwalHariIni.jam_selesai.slice(0, 5) : '—';
      toast.success(`Waktu absen pulang sudah aktif — jadwal pulang ${jam}`);
      setPulangNotified(true);
    } else if (!canPulang && pulangNotified) {
      setPulangNotified(false);
    }
  }, [canPulang, jadwalHariIni, pulangNotified]);

  const getAbsensiStatus = () => {
    if (!absensiHariIni) return null;
    return (absensiHariIni.status_kehadiran || absensiHariIni.status || '').trim();
  };

  const isIzinOrSakit = () => {
    const s = getAbsensiStatus();
    return s === 'Sakit' || s === 'Izin';
  };

  // server actions
  const { post: postAction } = useForm();

  const handleMasuk = (e) => {
    e?.preventDefault();
    if (isIzinOrSakit()) {
      toast.error('Anda sudah mengajukan Sakit/Izin. Hubungi admin untuk mengubah status.');
      return;
    }
    postAction(route('guru.absensi-harian.store'), { preserveScroll: true });
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
    postAction(route('guru.absensi-harian.store'), { preserveScroll: true });
  };

  const openIzinModal = () => setShowIzinModal(true);
  const closeIzinModal = () => { setShowIzinModal(false); reset(); };

  const submitIzin = (e) => {
    e?.preventDefault();
    if (!data.keterangan || data.keterangan.trim().length < 3) {
      toast.error('Keterangan minimal 3 karakter.');
      return;
    }
    post(route('guru.absensi-harian.izin'), {
      data: data,
      preserveScroll: true,
      onSuccess: () => { closeIzinModal(); },
      onError: (errs) => {
        if (errs && Object.keys(errs).length) {
          const msgs = Object.values(errs).flat().join(' ');
          toast.error(msgs || 'Gagal mengirim pengajuan.');
        } else toast.error('Gagal mengirim pengajuan. Cek koneksi atau hubungi admin.');
      },
    });
  };

  // Filter helpers
  const formatPeriodLabel = () => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (filter === 'day') {
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (filter === 'week') {
      const day = d.getDay();
      const isoDow = (day === 0) ? 7 : day;
      const monday = new Date(d); monday.setDate(d.getDate() - (isoDow - 1));
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      const fmt = dt => dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${fmt(monday)} — ${fmt(sunday)}`;
    }
    if (filter === 'month') {
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const applyFilter = (newFilter = filter, newDate = dateValue) => {
    let dateParam = newDate || new Date().toISOString().slice(0, 10);
    if (newFilter === 'month') {
      if (dateParam.length === 7) dateParam = dateParam + '-01';
      else if (dateParam.length >= 8) dateParam = dateParam.slice(0, 10);
    }
    Inertia.get(route('guru.absensi-harian.index'), { filter: newFilter, date: dateParam }, { preserveState: false, preserveScroll: true });
  };

  const onFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'month') {
      const d = dateValue ? new Date(dateValue) : new Date();
      const monthStr = d.toISOString().slice(0, 7);
      setDateValue(monthStr + '-01');
    } else {
      if (!dateValue) setDateValue(new Date().toISOString().slice(0, 10));
    }
  };

  const onDateChange = (e) => {
    const val = e.target.value;
    if (filter === 'month') setDateValue(val + '-01'); else setDateValue(val);
  };

  // history components
  const HistoryTable = () => {
    if (!history || history.length === 0) {
      return <div className="p-4 bg-white rounded-lg shadow text-sm text-gray-500">Tidak ada data untuk periode ini.</div>;
    }

    // Desktop table
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="hidden md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="p-3">Tanggal</th>
                <th className="p-3">Hari</th>
                <th className="p-3">Jadwal</th>
                <th className="p-3">Status</th>
                <th className="p-3">Jam Masuk</th>
                <th className="p-3">Jam Pulang</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={`${h.tanggal}-${h.jadwal ?? ''}`} className="border-t last:border-b">
                  <td className="p-3 align-top">{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-3 align-top">{h.hari}</td>
                  <td className="p-3 align-top">{h.has_schedule ? 'Ada' : 'Tidak ada'}</td>
                  <td className="p-3 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs ${h.status === 'Hadir' ? 'bg-green-100 text-green-800' : (h.status === 'Sakit' || h.status === 'Izin') ? 'bg-yellow-100 text-yellow-800' : (h.status === 'Alfa') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-3 align-top">{h.jam_masuk ?? '-'}</td>
                  <td className="p-3 align-top">{h.jam_pulang ?? '-'}</td>
                  <td className="p-3 align-top">{h.metode ?? '-'}</td>
                  <td className="p-3 align-top max-w-xs truncate" title={h.keterangan ?? ''}>{h.keterangan ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {history.map((h) => (
            <div key={h.tanggal} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} — <span className="font-normal text-gray-600">{h.hari}</span></div>
                  <div className="mt-1 text-xs text-gray-600">{h.has_schedule ? 'Ada jadwal' : 'Tidak ada jadwal'}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${h.status === 'Hadir' ? 'bg-green-100 text-green-800' : (h.status === 'Sakit' || h.status === 'Izin') ? 'bg-yellow-100 text-yellow-800' : (h.status === 'Alfa') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                    {h.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 gap-2">
                <div><div className="text-xs text-gray-500">Masuk</div><div>{h.jam_masuk ?? '-'}</div></div>
                <div><div className="text-xs text-gray-500">Pulang</div><div>{h.jam_pulang ?? '-'}</div></div>
                <div><div className="text-xs text-gray-500">Metode</div><div>{h.metode ?? '-'}</div></div>
                <div className="col-span-2"><div className="text-xs text-gray-500">Keterangan</div><div className="text-sm text-gray-700">{h.keterangan ?? '-'}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // small subcomponents for layout clarity
  const TopHeader = () => {
    const absStatus = getAbsensiStatus();
    const jamMasuk = absensiHariIni?.jam_masuk ? absensiHariIni.jam_masuk.slice(0, 5) : null;
    const jamPulang = absensiHariIni?.jam_pulang ? absensiHariIni.jam_pulang.slice(0, 5) : null;
    const keterangan = absensiHariIni?.keterangan ?? null;

    return (
      <div className="bg-sky-600 text-white p-5 sm:p-8 rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-sky-100">Waktu sekarang</p>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{formattedTime}</h1>
              <div className="hidden sm:block text-sm text-sky-100">Jadwal: {jadwalHariIni ? `${jadwalHariIni.jam_mulai.slice(0,5)} - ${jadwalHariIni.jam_selesai.slice(0,5)}` : '—'}</div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                {absStatus ? <CheckCircle className="w-5 h-5 text-white" /> : <LogIn className="w-5 h-5 text-white" />}
                <div className="text-sm">
                  <div className="font-semibold">{absStatus || 'Belum Absen'}</div>
                  {jamMasuk && <div className="text-xs text-sky-100">Masuk: {jamMasuk}</div>}
                  {jamPulang && <div className="text-xs text-sky-100">Pulang: {jamPulang}</div>}
                </div>
              </div>
            </div>

            {keterangan && <div className="mt-3 text-sm text-sky-100"><strong>Keterangan:</strong> {keterangan}</div>}
          </div>

          {/* right side actions on desktop */}
          <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-center gap-3">
            {jadwalHariIni ? (
              absensiHariIni && absensiHariIni.jam_masuk ? (
                absensiHariIni.jam_pulang ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-200 mx-auto" />
                    <div className="mt-1 text-sm">Absensi hari ini selesai</div>
                    <div className="text-xs text-sky-100">Masuk {jamMasuk} — Pulang {jamPulang}</div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <PrimaryButton onClick={handlePulang}><LogOut className="w-4 h-4 mr-2 inline" /> Absen Pulang</PrimaryButton>
                    <PrimaryButton variant="outline" onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit/Izin</PrimaryButton>
                  </div>
                )
              ) : (
                <div className="flex gap-2">
                  <PrimaryButton onClick={handleMasuk} disabled={!login_manual_enabled}><LogIn className="w-4 h-4 mr-2 inline" /> Absen Masuk</PrimaryButton>
                  <PrimaryButton variant="outline" onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit/Izin</PrimaryButton>
                </div>
              )
            ) : (
              <PrimaryButton variant="outline" onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan Sakit/Izin</PrimaryButton>
            )}
          </div>
        </div>
      </div>
    );
  };

  // mobile sticky action bar
  const MobileActionBar = () => {
    if (typeof window === 'undefined') return null;
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl md:hidden">
        <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow flex items-center justify-between gap-2">
          <div className="flex-1">
            {jadwalHariIni ? (
              absensiHariIni && absensiHariIni.jam_masuk ? (
                absensiHariIni.jam_pulang ? (
                  <div className="text-xs text-gray-700 text-center">Sudah selesai — {jamMasuk} / {jamPulang}</div>
                ) : (
                  <PrimaryButton onClick={handlePulang} className="w-full">Absen Pulang</PrimaryButton>
                )
              ) : (
                <PrimaryButton onClick={handleMasuk} className="w-full" disabled={!login_manual_enabled}>Absen Masuk</PrimaryButton>
              )
            ) : (
              <PrimaryButton onClick={openIzinModal} className="w-full">Ajukan Sakit/Izin</PrimaryButton>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render
  return (
    <GuruLayout user={auth.user} header="Absensi Harian Saya">
      <Head title="Absensi Harian" />
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
            <TopHeader />
            <div className="mt-4 p-4 sm:p-6 bg-white rounded-lg border border-gray-100">
              {/* show smaller action area on mobile */}
              <div className="md:hidden">
                {jadwalHariIni ? (
                  absensiHariIni && absensiHariIni.jam_masuk ? (
                    absensiHariIni.jam_pulang ? (
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div className="mt-1 text-sm">Absensi hari ini selesai.</div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <div>Sudah absen masuk pada <strong>{absensiHariIni.jam_masuk.slice(0,5)}</strong></div>
                        <div className="flex gap-2 justify-center mt-2">
                          <PrimaryButton onClick={handlePulang}><LogOut className="w-4 h-4 mr-2 inline" /> Absen Pulang</PrimaryButton>
                          <PrimaryButton variant="outline" onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan</PrimaryButton>
                        </div>
                        {!canPulang && <div className="text-xs text-gray-500 mt-2">Belum waktunya pulang: {jadwalHariIni.jam_selesai.slice(0,5)}</div>}
                      </div>
                    )
                  ) : (
                    <div className="text-center space-y-2">
                      <div>Silakan absen masuk untuk hari ini.</div>
                      <div className="flex gap-2 justify-center mt-2">
                        <PrimaryButton onClick={handleMasuk} disabled={!login_manual_enabled}><LogIn className="w-4 h-4 mr-2 inline" /> Absen Masuk</PrimaryButton>
                        <PrimaryButton variant="outline" onClick={openIzinModal}><Plus className="w-4 h-4 mr-2 inline" /> Ajukan</PrimaryButton>
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

              {/* large screen: already rendered on header right */}
            </div>
          </div>

          {/* Filter */}
          <div>
            <div className="bg-white rounded-lg p-4 shadow sm:flex sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="inline-flex rounded-md overflow-hidden border">
                  <button type="button" onClick={() => onFilterChange('day')} className={`px-3 py-2 text-sm ${filter === 'day' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}>Hari</button>
                  <button type="button" onClick={() => onFilterChange('week')} className={`px-3 py-2 text-sm ${filter === 'week' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}>Minggu</button>
                  <button type="button" onClick={() => onFilterChange('month')} className={`px-3 py-2 text-sm ${filter === 'month' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}>Bulan</button>
                </div>

                <div>
                  {filter === 'month' ? (
                    <input type="month" value={dateValue ? dateValue.slice(0,7) : new Date().toISOString().slice(0,7)} onChange={onDateChange} className="rounded-md border px-3 py-2" />
                  ) : (
                    <input type="date" value={dateValue ? dateValue.slice(0,10) : new Date().toISOString().slice(0,10)} onChange={onDateChange} className="rounded-md border px-3 py-2" />
                  )}
                </div>
              </div>

              <div className="mt-3 sm:mt-0 flex items-center gap-3">
                <div className="text-sm text-gray-600 hidden sm:block">Periode: <strong>{formatPeriodLabel()}</strong></div>
                <PrimaryButton onClick={() => applyFilter(filter, dateValue)}><Calendar className="w-4 h-4 mr-2 inline" /> Terapkan</PrimaryButton>
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Riwayat Kehadiran — <span className="font-normal">{formatPeriodLabel()}</span></h3>
            <HistoryTable />
          </div>
        </div>
      </div>

      {/* Mobile sticky action */}
      <MobileActionBar />

      {/* Modal Izin */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-semibold">Ajukan Sakit / Izin</h4>
              <button onClick={closeIzinModal} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitIzin} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2">
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
                {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
                {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                <textarea value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} rows={4} className="mt-1 block w-full rounded-md border px-3 py-2" placeholder="Jelaskan keterangan..." />
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
