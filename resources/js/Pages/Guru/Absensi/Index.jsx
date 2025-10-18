// resources/js/Pages/Guru/Absensi/Index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  AlertTriangle,
  Lock,
  Brain,
  Pencil,
  RefreshCcw,
  Download,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useDebounce } from 'use-debounce';

const EXCEPTIONS = ['Alfa_Mapel', 'Izin_Mapel', 'Sakit_Mapel', 'Tugas_Mapel'];

export default function Index({
  jadwal,
  siswaList = [],
  absensiHariIni = {},
  dailyStatusMap = {},
  today,
  filters = {},
  onlyToday = true, // dikirim dari backend sebagai penanda kunci 1x24 jam
}) {
  // ---------- filters & ui ----------
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  const [tanggal, setTanggal] = useState(
    filters.tanggal || today || new Date().toISOString().slice(0, 10),
  );
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // ---------- confirm/save state ----------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processingSave, setProcessingSave] = useState(false);

  // ---------- banner ----------
  const [dateWarning, setDateWarning] = useState('');

  // ---------- form ----------
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    id_jadwal: jadwal?.id_jadwal || null,
    tanggal,
    entries: [],
  });

  // today guard (frontend)
  const TODAY = useMemo(() => (today || new Date().toISOString().slice(0, 10)), [today]);
  const editable = onlyToday ? tanggal === TODAY : true;

  // ---------- initialize entries from server payload ----------
  useEffect(() => {
    const entries = (siswaList || []).map((s) => {
      const abs = absensiHariIni?.[s.id_siswa];
      return {
        id_siswa: s.id_siswa,
        status_kehadiran: abs?.status_kehadiran || null,
        keterangan: abs?.keterangan || '',
        is_overridden: abs?.is_overridden === 1 || abs?.is_overridden === true,
      };
    });
    setData('entries', entries);
    setData('id_jadwal', jadwal?.id_jadwal || null);
    setData('tanggal', tanggal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siswaList, absensiHariIni, jadwal, today, tanggal]);

  // ---------- sync URL (search & tanggal) ----------
  useEffect(() => {
    // Paksa tetap di hari ini pada UI jika mode onlyToday aktif
    if (onlyToday && tanggal !== TODAY) {
      setTanggal(TODAY);
      setData('tanggal', TODAY);
      setDateWarning('Absensi per mapel hanya untuk tanggal hari ini (1×24 jam). Tanggal dikembalikan ke hari ini.');
      return;
    }

    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (tanggal) params.tanggal = tanggal;

    router.get(route('guru.absensi-mapel.show', { id_jadwal: jadwal.id_jadwal }), params, {
      preserveState: true,
      replace: true,
    });
  }, [debouncedSearch, tanggal, jadwal?.id_jadwal, onlyToday, TODAY]);

  // ---------- helpers ----------
  const getDaily = (id_siswa) => dailyStatusMap?.[id_siswa] ?? null;

  const allowedOptions = (id_siswa) => {
    const d = getDaily(id_siswa);
    if (d === 'Hadir') return ['Hadir', ...EXCEPTIONS];
    if (d === 'Izin' || d === 'Sakit' || d === 'Alfa') return [d];
    return ['Hadir', 'Sakit', 'Izin', 'Alfa', ...EXCEPTIONS, 'Belum Absen'];
    // catatan: 'Belum Absen' hanya muncul saat harian belum ada
  };

  const handleEntryChange = (index, field, value) => {
    if (!editable) return; // kunci tanggal non-hari-ini
    const entries = [...(data.entries || [])];
    const e = { ...(entries[index] || {}) };
    const id_siswa = e.id_siswa;
    const d = getDaily(id_siswa);

    if (field === 'status_kehadiran') {
      const allowed = allowedOptions(id_siswa);
      if (!allowed.includes(value)) return;

      // Jika harian = Hadir dan dipilih base (Izin/Sakit/Alfa) → konversi ke *_Mapel
      if (d === 'Hadir' && ['Izin', 'Sakit', 'Alfa'].includes(value)) {
        const map = { Izin: 'Izin_Mapel', Sakit: 'Sakit_Mapel', Alfa: 'Alfa_Mapel' };
        value = map[value];
      }

      e.status_kehadiran = value;
      if (value === 'Hadir') e.keterangan = '';

      // override jika beda dari default harian
      e.is_overridden =
        (d === 'Hadir' && EXCEPTIONS.includes(value)) || (!d && value !== 'Belum Absen');
    } else if (field === 'keterangan') {
      e.keterangan = value;
    }

    entries[index] = e;
    setData('entries', entries);
  };

  // ---------- bulk helpers ----------
  const setAllHadir = () => {
    if (!editable) return;
    setData(
      'entries',
      (data.entries || []).map((e) => {
        const d = getDaily(e.id_siswa);
        if (d === 'Hadir') return { ...e, status_kehadiran: 'Hadir', keterangan: '', is_overridden: false };
        return e;
      }),
    );
  };

  const setAllAlfaMapel = () => {
    if (!editable) return;
    setData(
      'entries',
      (data.entries || []).map((e) => {
        const d = getDaily(e.id_siswa);
        if (d === 'Hadir') return { ...e, status_kehadiran: 'Alfa_Mapel', is_overridden: true };
        return e;
      }),
    );
  };

  // ---------- list shown (search + exception only) ----------
  const filteredSiswa = useMemo(() => {
    const term = (debouncedSearch || '').toLowerCase().trim();
    let list = siswaList;
    if (term) {
      list = list.filter((s) => {
        const hay = `${s.nama_lengkap} ${s.nis || ''}`.toLowerCase();
        return hay.includes(term);
      });
    }
    if (showExceptionsOnly) {
      list = list.filter((s) => {
        const idx = siswaList.findIndex((x) => x.id_siswa === s.id_siswa);
        const entry = data.entries?.[idx];
        return entry && EXCEPTIONS.includes(entry.status_kehadiran);
      });
    }
    return list;
  }, [siswaList, debouncedSearch, showExceptionsOnly, data.entries]);

  // ---------- summary ----------
  const summary = useMemo(() => {
    const out = {
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alfa: 0,
      Alfa_Mapel: 0,
      Izin_Mapel: 0,
      Sakit_Mapel: 0,
      Tugas_Mapel: 0,
      total: (siswaList || []).length,
    };
    (data.entries || []).forEach((e) => {
      const st = e?.status_kehadiran;
      if (st && out[st] !== undefined) out[st]++;
    });
    return out;
  }, [data.entries, siswaList]);

  // ---------- actions ----------
  const handleSubmit = () => {
    clearErrors();
    setConfirmOpen(true);
  };

  const doSubmit = (e) => {
    e.preventDefault();
    if (!editable) return; // aman
    setProcessingSave(true);
    post(route('guru.absensi-mapel.store'), {
      preserveScroll: true,
      onFinish: () => {
        setProcessingSave(false);
        setConfirmOpen(false);
      },
    });
  };

  const doRefreshPrefill = () => {
    if (!editable) {
      setDateWarning('Prefill hanya untuk tanggal hari ini (1×24 jam).');
      return;
    }
    router.post(
      route('guru.absensi-mapel.prefill', { id_jadwal: jadwal.id_jadwal }),
      { tanggal },
      { preserveScroll: true },
    );
  };

  const exportMeeting = () => {
    // ekspor boleh kapan saja — backend mengizinkan
    window.location.href = route('guru.absensi-mapel.export.meeting', {
      id_jadwal: jadwal.id_jadwal,
      tanggal,
    });
  };

  const exportMonthly = () => {
    // ekspor boleh kapan saja — backend mengizinkan
    const month = (tanggal || '').slice(0, 7) || new Date().toISOString().slice(0, 7);
    window.location.href = route('guru.absensi-mapel.export.monthly', {
      id_jadwal: jadwal.id_jadwal,
      month,
    });
  };

  // ---------- badge util ----------
  const badgeClass = (val) => {
    switch (val) {
      case 'Hadir':
        return 'bg-green-50 text-green-700';
      case 'Izin':
      case 'Izin_Mapel':
        return 'bg-sky-50 text-sky-700';
      case 'Sakit':
      case 'Sakit_Mapel':
        return 'bg-amber-50 text-amber-700';
      case 'Alfa':
      case 'Alfa_Mapel':
        return 'bg-red-50 text-red-700';
      case 'Tugas_Mapel':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <GuruLayout header={`Absensi: ${jadwal?.mata_pelajaran?.nama_mapel || '-'}`}>
      <Head title={`Absensi ${jadwal?.kelas?.nama_kelas || ''}`} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner peringatan tanggal */}
        {dateWarning && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm">{dateWarning}</div>
            <button
              onClick={() => setDateWarning('')}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={route('guru.absensi-mapel.index')}
              className="inline-flex items-center text-sm text-sky-600 hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Absensi Kelas{' '}
              {jadwal?.kelas?.nama_kelas ||
                (jadwal?.kelas?.tingkat ? `${jadwal.kelas.tingkat} ${jadwal.kelas.jurusan || ''}` : '')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Mapel: {jadwal?.mata_pelajaran?.nama_mapel || '-'} •{' '}
              {jadwal?.jam_mulai?.slice(0, 5) || '-'} - {jadwal?.jam_selesai?.slice(0, 5) || '-'}
            </p>
          </div>

          {/* Summary Compact */}
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
            <div className="text-xs text-slate-500">Ringkasan:</div>
            <div className="text-xs font-medium text-green-700">Hadir {summary.Hadir}</div>
            <div className="text-xs font-medium text-sky-700">Izin {summary.Izin}</div>
            <div className="text-xs font-medium text-amber-700">Sakit {summary.Sakit}</div>
            <div className="text-xs font-medium text-red-700">Alfa {summary.Alfa}</div>
            <div className="ml-2 text-xs font-bold text-red-800">Alfa_Mapel {summary.Alfa_Mapel}</div>
          </div>
        </div>

        {/* Toolbar — rata & rapi */}
        <div className="rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[180px_minmax(300px,1fr)_auto_auto]">
            {/* Tanggal */}
            <div className="relative">
              <label className="sr-only">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => {
                  const v = e.target.value;
                  if (onlyToday && v !== TODAY) {
                    setDateWarning('Absensi hanya untuk hari ini. Tanggal tidak bisa diubah.');
                    // kembalikan ke TODAY
                    setTanggal(TODAY);
                    setData('tanggal', TODAY);
                    return;
                  }
                  setTanggal(v);
                  setData('tanggal', v);
                }}
                className="h-10 w-[180px] rounded-md border px-3 text-sm disabled:bg-slate-50"
                disabled={onlyToday} // kunci input agar tidak menyesatkan
                title={onlyToday ? 'Dikunci ke tanggal hari ini (1×24 jam)' : 'Pilih tanggal'}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-label="Cari siswa"
                placeholder="Cari nama / NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-md border pl-10 pr-3 text-sm focus:ring-2 focus:ring-sky-300"
              />
            </div>

            {/* Toggle Exception */}
            <label className="inline-flex h-10 items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={showExceptionsOnly}
                onChange={(e) => setShowExceptionsOnly(e.target.checked)}
              />
              Hanya pengecualian
            </label>

            {/* Aksi Cepat */}
            <div className="justify-self-end">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">
                  Aksi Cepat <ChevronDown className="h-4 w-4" />
                </Menu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-lg focus:outline-none">
                    {/* Prefill */}
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={doRefreshPrefill}
                            className={`${active ? 'bg-slate-100' : ''} flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 disabled:opacity-50`}
                            disabled={!editable}
                            title={!editable ? 'Hanya bisa untuk hari ini' : 'Prefill ulang dari harian'}
                          >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh Prefill (dari harian)
                          </button>
                        )}
                      </Menu.Item>
                    </div>

                    {/* Set Kehadiran */}
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={setAllHadir}
                            className={`${active ? 'bg-green-50 text-green-700' : 'text-slate-700'} flex w-full items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
                            disabled={!editable}
                            title={!editable ? 'Terkunci (bukan hari ini)' : 'Set semua Hadir untuk yang harian=Hadir'}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Set Semua Hadir
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={setAllAlfaMapel}
                            className={`${active ? 'bg-red-50 text-red-700' : 'text-slate-700'} flex w-full items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
                            disabled={!editable}
                            title={!editable ? 'Terkunci (bukan hari ini)' : 'Set semua Alfa_Mapel untuk yang harian=Hadir'}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                            Set Semua Alfa_Mapel
                          </button>
                        )}
                      </Menu.Item>
                    </div>

                    {/* Export */}
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportMeeting}
                            className={`${active ? 'bg-slate-100' : ''} flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700`}
                          >
                            <Download className="h-4 w-4" />
                            Export Pertemuan
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={exportMonthly}
                            className={`${active ? 'bg-slate-100' : ''} flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700`}
                          >
                            <Download className="h-4 w-4" />
                            Export Bulanan
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Info lock hari ini */}
        {!editable && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            <Lock className="mt-0.5 h-4 w-4" />
            <p className="text-sm">
              Perubahan absensi terkunci karena tanggal bukan hari ini. Anda tetap bisa melakukan ekspor.
            </p>
          </div>
        )}

        {/* Form Tabel */}
        <form onSubmit={doSubmit} className="mt-4 space-y-4" aria-label="Form absensi">
          <div className="overflow-hidden rounded-lg border bg-white">
            {(filteredSiswa || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500">Tidak ada siswa sesuai filter.</div>
            ) : (
              <div className="divide-y">
                {(filteredSiswa || []).map((siswa, rowIdx) => {
                  const index = siswaList.findIndex((s) => s.id_siswa === siswa.id_siswa);
                  const entry =
                    data.entries?.[index] || { id_siswa: siswa.id_siswa, status_kehadiran: null, keterangan: '' };
                  const daily = getDaily(siswa.id_siswa);
                  const opts = allowedOptions(siswa.id_siswa);

                  const isOverride =
                    entry.is_overridden === true || (daily === 'Hadir' && EXCEPTIONS.includes(entry.status_kehadiran));
                  const autoBadge = !isOverride && !!daily;
                  const lockedDaily = daily && daily !== 'Hadir';
                  const rowDisabled = !editable || lockedDaily;

                  return (
                    <div
                      key={siswa.id_siswa}
                      className={`grid grid-cols-12 items-center gap-4 p-3 ${rowIdx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
                    >
                      {/* Identitas */}
                      <div className="col-span-12 md:col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600">
                            {(siswa.nama_panggilan || siswa.nama_lengkap || '').slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{siswa.nama_lengkap}</div>
                            <div className="text-xs text-slate-500">NIS: {siswa.nis}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              {daily ? (
                                <span className={`rounded-full px-2 py-0.5 ${badgeClass(daily)}`}>Harian: {daily}</span>
                              ) : (
                                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">Harian: (belum ada)</span>
                              )}
                              {autoBadge && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <Brain className="h-3 w-3" />
                                  auto
                                </span>
                              )}
                              {isOverride && (
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  <Pencil className="h-3 w-3" />
                                  override
                                </span>
                              )}
                              {lockedDaily && (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <Lock className="h-3 w-3" />
                                  terkunci
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pilihan Status */}
                      <div className="col-span-12 md:col-span-5 flex flex-wrap gap-2">
                        {opts.map((opt) => (
                          <button
                            key={`${siswa.id_siswa}-${opt}`}
                            type="button"
                            disabled={rowDisabled}
                            onClick={() => handleEntryChange(index, 'status_kehadiran', opt)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition
                              ${entry.status_kehadiran === opt ? 'border-sky-600 bg-sky-600 text-white' : 'border-gray-200 bg-white text-slate-700 hover:bg-slate-50'}
                              ${rowDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            aria-pressed={entry.status_kehadiran === opt}
                            aria-label={`Set ${siswa.nama_lengkap} = ${opt}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {/* Keterangan */}
                      <div className="col-span-12 md:col-span-3">
                        {entry.status_kehadiran && entry.status_kehadiran !== 'Hadir' ? (
                          <input
                            value={entry.keterangan || ''}
                            onChange={(e) => handleEntryChange(index, 'keterangan', e.target.value)}
                            placeholder="Keterangan (opsional)"
                            className="h-10 w-full rounded-md border px-2 text-sm focus:ring-2 focus:ring-sky-300 disabled:bg-slate-50"
                            aria-label={`Keterangan untuk ${siswa.nama_lengkap}`}
                            disabled={rowDisabled}
                          />
                        ) : (
                          <div className="text-sm text-slate-400">—</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions bottom */}
          <div className="flex justify-end">
            <PrimaryButton
              type="button"
              disabled={processing || processingSave || !editable}
              onClick={handleSubmit}
              title={!editable ? 'Terkunci (bukan hari ini)' : 'Simpan perubahan'}
            >
              {processingSave ? 'Menyimpan...' : 'Simpan Perubahan'}
            </PrimaryButton>
          </div>
        </form>

        {/* Modal Konfirmasi */}
        {confirmOpen && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
            <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">Konfirmasi Simpan Absensi</h3>
              <p className="mt-2 text-sm text-slate-600">
                Perubahan absensi mapel akan disimpan untuk tanggal {tanggal}. Lanjutkan?
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setConfirmOpen(false)} className="rounded-md border bg-white px-3 py-2">
                  Batal
                </button>
                <button
                  onClick={doSubmit}
                  disabled={processing || processingSave || !editable}
                  className="rounded-md bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {processingSave ? 'Menyimpan...' : 'Ya, Simpan'}
                </button>
              </div>
              {errors?.entries && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-600">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>{Array.isArray(errors.entries) ? errors.entries.join(', ') : String(errors.entries)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
