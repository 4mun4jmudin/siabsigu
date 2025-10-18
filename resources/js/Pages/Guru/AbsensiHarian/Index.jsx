// resources/js/Pages/Guru/AbsensiHarian/Index.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import toast from 'react-hot-toast';
import {
  LogIn,
  LogOut,
  CheckCircle2,
  Plus,
  Calendar,
  AlertTriangle,
  X,
} from 'lucide-react';

/**
 * Helper: safe substring HH:mm from "HH:mm" | "HH:mm:ss" | null
 */
const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

/**
 * Badge warna status
 */
const statusClass = (s) => {
  switch (s) {
    case 'Hadir':
      return 'bg-green-100 text-green-700';
    case 'Izin':
    case 'Dinas Luar':
      return 'bg-sky-100 text-sky-700';
    case 'Sakit':
      return 'bg-yellow-100 text-yellow-700';
    case 'Alfa':
      return 'bg-red-100 text-red-700';
    case 'Belum Absen':
      return 'bg-rose-100 text-rose-700';
    case 'Tidak Ada Jadwal':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function Index(props) {
  const {
    auth,
    absensiHariIni = null,
    jadwalHariIni = null,
    canPulang = false,
    history = [],
    login_manual_enabled = true,
    filter: serverFilter = 'week',
    filter_date: serverFilterDate,
    pengaturan,
    yesterday_unfinished = false,
    flash,
  } = props;

  // -----------------------------------
  // Waktu realtime
  // -----------------------------------
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const todayLong = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // -----------------------------------
  // Flash → toast (dedupe for strict mode)
  // -----------------------------------
  const shownFlashRef = useRef(new Set());
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('shownFlashMessages:v1');
      if (raw) shownFlashRef.current = new Set(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    const show = (type, msg) => {
      if (!msg) return;
      const arr = Array.isArray(msg) ? msg : [msg];
      arr.forEach((m) => {
        const key = `${type}:${m}`;
        if (!shownFlashRef.current.has(key)) {
          shownFlashRef.current.add(key);
          try {
            sessionStorage.setItem(
              'shownFlashMessages:v1',
              JSON.stringify(Array.from(shownFlashRef.current))
            );
          } catch {}
          if (type === 'success') toast.success(m);
          else if (type === 'error') toast.error(m);
          else toast(m);
        }
      });
    };
    show('success', flash?.success);
    show('error', flash?.error);
    show('info', flash?.info);
  }, [flash]);

  // -----------------------------------
  // Filter periode
  // -----------------------------------
  const [filter, setFilter] = useState(serverFilter);
  const [dateValue, setDateValue] = useState(
    serverFilterDate || new Date().toISOString().slice(0, 10)
  );

  const formatPeriodLabel = () => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (filter === 'day') {
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    if (filter === 'week') {
      // ISO: Senin…Minggu
      const day = d.getDay();
      const isoDow = day === 0 ? 7 : day;
      const monday = new Date(d);
      monday.setDate(d.getDate() - (isoDow - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (dt) =>
        dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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
      // kirim tanggal apapun, backend parse start/end month
      if (dateParam.length === 7) dateParam = `${dateParam}-01`;
      else dateParam = dateParam.slice(0, 10);
    }
    Inertia.get(
      route('guru.absensi-harian.index'),
      { filter: newFilter, date: dateParam },
      { preserveState: false, preserveScroll: true }
    );
  };

  const onFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'month') {
      const d = dateValue ? new Date(dateValue) : new Date();
      const m = d.toISOString().slice(0, 7);
      setDateValue(`${m}-01`);
    } else {
      setDateValue(dateValue ? dateValue.slice(0, 10) : new Date().toISOString().slice(0, 10));
    }
  };

  const onDateChange = (e) => {
    const val = e.target.value;
    if (filter === 'month') setDateValue(`${val}-01`);
    else setDateValue(val);
  };

  // -----------------------------------
  // Status hari ini + jadwal
  // -----------------------------------
  const absStatus = useMemo(() => {
    if (!absensiHariIni) return 'Belum Absen';
    return (absensiHariIni.status_kehadiran || absensiHariIni.status || 'Belum Absen').trim();
  }, [absensiHariIni]);

  const jamMasuk = hhmm(absensiHariIni?.jam_masuk);
  const jamPulang = hhmm(absensiHariIni?.jam_pulang);
  const jadwalMulai = hhmm(jadwalHariIni?.jam_mulai);
  const jadwalSelesai = hhmm(jadwalHariIni?.jam_selesai);

  const isIzinSakitDL = ['Izin', 'Sakit', 'Dinas Luar'].includes(absStatus);

  // -----------------------------------
  // Aksi: Absen Masuk / Pulang
  // -----------------------------------
  const { post: postAction } = useForm();

  const handleMasuk = (e) => {
    e?.preventDefault();
    if (!login_manual_enabled || pengaturan?.absensi_manual_guru_enabled === false) {
      toast.error('Absensi manual nonaktif.');
      return;
    }
    if (isIzinSakitDL) {
      toast.error('Anda sedang berstatus Sakit/Izin/Dinas Luar. Hubungi admin bila perlu perubahan.');
      return;
    }
    if (absensiHariIni?.jam_masuk) {
      toast('Anda sudah absen masuk.');
      return;
    }
    postAction(route('guru.absensi-harian.store'), { preserveScroll: true });
  };

  const handlePulang = (e) => {
    e?.preventDefault();
    if (isIzinSakitDL) {
      toast.error('Anda berstatus Sakit/Izin/Dinas Luar — tidak perlu absen pulang.');
      return;
    }
    if (!absensiHariIni?.jam_masuk) {
      toast.error('Anda belum absen masuk.');
      return;
    }
    if (absensiHariIni?.jam_pulang) {
      toast('Anda sudah absen pulang.');
      return;
    }
    if (!canPulang) {
      toast.error(`Belum waktunya absen pulang. Jadwal pulang ${jadwalSelesai || '-'}.`);
      return;
    }
    postAction(route('guru.absensi-harian.store'), { preserveScroll: true });
  };

  // -----------------------------------
  // Modal Izin/Sakit/DL
  // -----------------------------------
  const [showIzinModal, setShowIzinModal] = useState(false);
  const izinForm = useForm({
    status: 'Sakit',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
  });

  const submitIzin = (e) => {
    e?.preventDefault();
    if ((izinForm.data.keterangan || '').trim().length < 3) {
      toast.error('Keterangan minimal 3 karakter.');
      return;
    }
    izinForm.post(route('guru.absensi-harian.izin'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowIzinModal(false);
        izinForm.reset();
      },
    });
  };

  // -----------------------------------
  // Notifikasi kecil
  // -----------------------------------
  useEffect(() => {
    if (yesterday_unfinished) {
      toast((t) => (
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <div className="font-semibold">Kemarin belum absen pulang</div>
            <div className="text-sm">Hubungi admin jika butuh pembetulan.</div>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 text-xs text-gray-400 hover:text-gray-700"
          >
            Tutup
          </button>
        </div>
      ), { duration: 7000 });
    }
  }, [yesterday_unfinished]);

  // -----------------------------------
  // Komponen kecil
  // -----------------------------------
  const TopHeader = () => (
    <div className="bg-sky-600 text-white p-5 sm:p-7 rounded-2xl">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sky-100 text-sm">{todayLong}</p>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="text-4xl font-bold tracking-tight">{timeLabel}</div>
            <div className="hidden sm:block text-sm text-sky-100">
              Jadwal: {jadwalMulai && jadwalSelesai ? `${jadwalMulai}–${jadwalSelesai}` : '—'}
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl">
            <span className={`px-2 py-1 rounded-full text-xs ${statusClass(absStatus)}`}>
              {absStatus}
            </span>
            {jamMasuk && <span className="text-xs text-sky-100">Masuk: {jamMasuk}</span>}
            {jamPulang && <span className="text-xs text-sky-100">Pulang: {jamPulang}</span>}
            {absensiHariIni?.menit_keterlambatan > 0 && (
              <span className="text-xs text-amber-200">
                Terlambat {absensiHariIni.menit_keterlambatan} menit
              </span>
            )}
          </div>

          {absensiHariIni?.keterangan && (
            <div className="mt-2 text-sm text-sky-100">
              <strong>Keterangan:</strong> {absensiHariIni.keterangan}
            </div>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex flex-col items-end gap-3">
          {isIzinSakitDL ? (
            <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Ajukan Perubahan
            </PrimaryButton>
          ) : absensiHariIni?.jam_masuk ? (
            absensiHariIni?.jam_pulang ? (
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto" />
                <div className="mt-1 text-sm">Absensi hari ini selesai</div>
                <div className="text-xs text-sky-100">
                  {jamMasuk} — {jamPulang}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <PrimaryButton onClick={handlePulang}>
                  <LogOut className="w-4 h-4 mr-2" /> Absen Pulang
                </PrimaryButton>
                <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Sakit / Izin / DL
                </PrimaryButton>
              </div>
            )
          ) : (
            <div className="flex gap-2">
              <PrimaryButton onClick={handleMasuk} disabled={!login_manual_enabled}>
                <LogIn className="w-4 h-4 mr-2" /> Absen Masuk
              </PrimaryButton>
              <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Sakit / Izin / DL
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const HistoryTable = () => {
    if (!Array.isArray(history) || history.length === 0) {
      return (
        <div className="p-4 bg-white rounded-xl border text-sm text-gray-500">
          Tidak ada data untuk periode ini.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 bg-gray-50">
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
              {history.map((h, idx) => (
                <tr key={`${h.tanggal}-${idx}`} className="border-t last:border-b">
                  <td className="p-3 align-top">
                    {new Date(h.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 align-top">{h.hari}</td>
                  <td className="p-3 align-top">{h.has_schedule ? 'Ada' : 'Tidak ada'}</td>
                  <td className="p-3 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusClass(h.status)}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-3 align-top">{h.jam_masuk ?? '-'}</td>
                  <td className="p-3 align-top">{h.jam_pulang ?? '-'}</td>
                  <td className="p-3 align-top">{h.metode ?? '-'}</td>
                  <td className="p-3 align-top max-w-xs truncate" title={h.keterangan ?? ''}>
                    {h.keterangan ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y">
          {history.map((h, idx) => (
            <div key={`${h.tanggal}-m-${idx}`} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {new Date(h.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    <span className="font-normal text-gray-500"> — {h.hari}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {h.has_schedule ? 'Ada jadwal' : 'Tidak ada jadwal'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusClass(h.status)}`}>
                  {h.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Masuk</div>
                  <div>{h.jam_masuk ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pulang</div>
                  <div>{h.jam_pulang ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Metode</div>
                  <div>{h.metode ?? '-'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500">Keterangan</div>
                  <div className="text-gray-700">{h.keterangan ?? '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MobileActionBar = () => {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl md:hidden">
        <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow">
          {isIzinSakitDL ? (
            <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Ajukan Perubahan
            </PrimaryButton>
          ) : absensiHariIni?.jam_masuk ? (
            absensiHariIni?.jam_pulang ? (
              <div className="text-xs text-center text-gray-700">
                Selesai — {jamMasuk ?? '-'} / {jamPulang ?? '-'}
              </div>
            ) : (
              <PrimaryButton onClick={handlePulang} className="w-full">
                <LogOut className="w-4 h-4 mr-2" /> Absen Pulang
              </PrimaryButton>
            )
          ) : (
            <PrimaryButton onClick={handleMasuk} className="w-full" disabled={!login_manual_enabled}>
              <LogIn className="w-4 h-4 mr-2" /> Absen Masuk
            </PrimaryButton>
          )}
        </div>
      </div>
    );
  };

  // -----------------------------------
  // Render
  // -----------------------------------
  return (
    <GuruLayout user={auth?.user} header="Absensi Harian Saya">
      <Head title="Absensi Harian" />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Alert top */}
        {!absensiHariIni?.jam_masuk && !isIzinSakitDL && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <div className="font-semibold">Anda belum absen masuk</div>
              <div className="text-rose-600">Silakan absen masuk terlebih dahulu.</div>
            </div>
          </div>
        )}

        {/* Header ringkas hari ini + action desktop */}
        <TopHeader />

        {/* Action area (mobile repetition handled by sticky bar) */}
        <div className="md:hidden bg-white rounded-xl border p-4">
          {isIzinSakitDL ? (
            <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Ajukan Perubahan
            </PrimaryButton>
          ) : absensiHariIni?.jam_masuk ? (
            absensiHariIni?.jam_pulang ? (
              <div className="text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div className="mt-1 text-sm">Absensi hari ini selesai.</div>
              </div>
            ) : (
              <div className="flex gap-2">
                <PrimaryButton onClick={handlePulang} className="flex-1">
                  <LogOut className="w-4 h-4 mr-2" /> Pulang
                </PrimaryButton>
                <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" /> Sakit/Izin/DL
                </PrimaryButton>
              </div>
            )
          ) : (
            <div className="flex gap-2">
              <PrimaryButton onClick={handleMasuk} className="flex-1" disabled={!login_manual_enabled}>
                <LogIn className="w-4 h-4 mr-2" /> Masuk
              </PrimaryButton>
              <PrimaryButton variant="outline" onClick={() => setShowIzinModal(true)} className="flex-1">
                <Plus className="w-4 h-4 mr-2" /> Sakit/Izin/DL
              </PrimaryButton>
            </div>
          )}
          {!canPulang && absensiHariIni?.jam_masuk && !absensiHariIni?.jam_pulang && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Belum waktunya pulang {jadwalSelesai ? `(${jadwalSelesai})` : ''}.
            </div>
          )}
        </div>

        {/* Filter Periode */}
        <div className="bg-white rounded-xl border p-4 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="inline-flex rounded-md overflow-hidden border">
              <button
                type="button"
                onClick={() => onFilterChange('day')}
                className={`px-3 py-2 text-sm ${filter === 'day' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Hari
              </button>
              <button
                type="button"
                onClick={() => onFilterChange('week')}
                className={`px-3 py-2 text-sm ${filter === 'week' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Minggu
              </button>
              <button
                type="button"
                onClick={() => onFilterChange('month')}
                className={`px-3 py-2 text-sm ${filter === 'month' ? 'bg-sky-600 text-white' : 'bg-white text-gray-700'}`}
              >
                Bulan
              </button>
            </div>

            <div>
              {filter === 'month' ? (
                <input
                  type="month"
                  value={dateValue ? dateValue.slice(0, 7) : new Date().toISOString().slice(0, 7)}
                  onChange={onDateChange}
                  className="rounded-md border px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type="date"
                  value={dateValue ? dateValue.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  onChange={onDateChange}
                  className="rounded-md border px-3 py-2 text-sm"
                />
              )}
            </div>
          </div>

          <div className="mt-3 sm:mt-0 flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-600">
              Periode: <strong>{formatPeriodLabel()}</strong>
            </div>
            <PrimaryButton onClick={() => applyFilter(filter, dateValue)}>
              <Calendar className="w-4 h-4 mr-2" /> Terapkan
            </PrimaryButton>
          </div>
        </div>

        {/* Riwayat */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Riwayat Kehadiran — <span className="font-normal">{formatPeriodLabel()}</span>
          </h3>
          <HistoryTable />
        </div>
      </div>

      {/* Sticky actions on mobile */}
      <MobileActionBar />

      {/* Modal Izin/Sakit/DL */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-semibold">Ajukan Sakit / Izin / Dinas Luar</h4>
              <button
                onClick={() => setShowIzinModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitIzin} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                  type="date"
                  value={izinForm.data.tanggal}
                  onChange={(e) => izinForm.setData('tanggal', e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  required
                />
                {izinForm.errors.tanggal && (
                  <p className="text-xs text-red-600 mt-1">{izinForm.errors.tanggal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={izinForm.data.status}
                  onChange={(e) => izinForm.setData('status', e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  required
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
                {izinForm.errors.status && (
                  <p className="text-xs text-red-600 mt-1">{izinForm.errors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                <textarea
                  value={izinForm.data.keterangan}
                  onChange={(e) => izinForm.setData('keterangan', e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  placeholder="Jelaskan alasan (wajib, min 3 karakter)"
                  required
                />
                {izinForm.errors.keterangan && (
                  <p className="text-xs text-red-600 mt-1">{izinForm.errors.keterangan}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIzinModal(false)}
                  className="px-4 py-2 rounded-md border text-sm"
                  disabled={izinForm.processing}
                >
                  Batal
                </button>
                <PrimaryButton type="submit" disabled={izinForm.processing}>
                  {izinForm.processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}
