// resources/js/Pages/Guru/AbsensiSiswa/Index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { ArrowLeft, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDebounce } from 'use-debounce';

const STATUS_OPTIONS = ['Hadir', 'Sakit', 'Izin', 'Alfa'];

export default function Index({ jadwal, siswaList = [], absensiHariIni = {}, today, filters = {} }) {
  // local filter states
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'Semua');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // modal confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittingWithLocation, setSubmittingWithLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // form (entries)
  const { data, setData, post, processing, errors } = useForm({
    id_jadwal: jadwal?.id_jadwal || null,
    tanggal: today || new Date().toISOString().slice(0, 10),
    entries: [],
    latitude: null,
    longitude: null,
  });

  // build initial entries when siswaList or absensiHariIni changes
  useEffect(() => {
    const entries = (siswaList || []).map((siswa) => {
      const existing = absensiHariIni && absensiHariIni[siswa.id_siswa];
      return {
        id_siswa: siswa.id_siswa,
        status_kehadiran: existing?.status_kehadiran || null,
        keterangan: existing?.keterangan || '',
      };
    });
    setData('entries', entries);
    // set jadwal/tanggal just in case
    setData('id_jadwal', jadwal?.id_jadwal || null);
    setData('tanggal', today || new Date().toISOString().slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siswaList, absensiHariIni, jadwal, today]);

  // push query params on filter change (so back-end can re-filter)
  useEffect(() => {
    const params = {};
    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (statusFilter && statusFilter !== 'Semua') params.status = statusFilter;

    router.get(route('guru.absensi-mapel.show', { id_jadwal: jadwal.id_jadwal }), params, {
      preserveState: true,
      replace: true,
    });
  }, [debouncedSearchTerm, statusFilter, jadwal?.id_jadwal]);

  // helpers
  const handleEntryChange = (index, field, value) => {
    const entries = [...(data.entries || [])];
    entries[index] = { ...entries[index], [field]: value };
    // jika set hadir, kosongkan keterangan
    if (field === 'status_kehadiran' && value === 'Hadir') entries[index].keterangan = '';
    setData('entries', entries);
  };

  const setAllStatus = (status) => {
    const entries = (data.entries || []).map((e) => ({
      ...e,
      status_kehadiran: status,
      keterangan: status === 'Hadir' ? '' : e.keterangan,
    }));
    setData('entries', entries);
  };

  // filtered list for UI (based on search + status filter)
  const filteredSiswa = useMemo(() => {
    const term = (debouncedSearchTerm || '').trim().toLowerCase();
    return (siswaList || []).filter((s, idx) => {
      const entry = data.entries?.[idx] || {};
      if (statusFilter !== 'Semua' && entry.status_kehadiran !== statusFilter) return false;
      if (!term) return true;
      const hay = `${s.nama_lengkap} ${s.nis || ''}`.toLowerCase();
      const jam = `${jadwal?.jam_mulai || ''} ${jadwal?.jam_selesai || ''}`.toLowerCase();
      return hay.includes(term) || jam.includes(term);
    });
  }, [siswaList, data.entries, debouncedSearchTerm, statusFilter, jadwal]);

  // summary counts
  const summary = useMemo(() => {
    const out = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, kosong: 0, total: (siswaList || []).length };
    (data.entries || []).forEach((e) => {
      if (!e?.status_kehadiran) out.kosong++;
      else out[e.status_kehadiran] = (out[e.status_kehadiran] || 0) + 1;
    });
    return out;
  }, [data.entries, siswaList]);

  // submit flow:
  // 1) if browser supports geolocation, optionally fetch coords before submit
  // 2) open confirm modal
  const handleSubmitClick = async (withLocation = false) => {
    setLocationError(null);
    if (withLocation && navigator.geolocation) {
      setSubmittingWithLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setData('latitude', pos.coords.latitude?.toString());
          setData('longitude', pos.coords.longitude?.toString());
          setSubmittingWithLocation(false);
          setConfirmOpen(true);
        },
        (err) => {
          setSubmittingWithLocation(false);
          setLocationError('Gagal mendapatkan lokasi. Pastikan izinkan akses lokasi di browser.');
          // tetap lanjut ke konfirmasi tanpa lokasi
          setConfirmOpen(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      // tanpa lokasi
      setConfirmOpen(true);
    }
  };

  const doSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(false);
    // client-side simple validation: minimal set status for each student? (optional)
    // post the form
    post(route('guru.absensi-mapel.store'), {
      preserveScroll: true,
      onFinish: () => {
        // reset location after submit to avoid resending it accidentally
        setData('latitude', null);
        setData('longitude', null);
      },
    });
  };

  return (
    <GuruLayout header={`Absensi: ${jadwal?.mata_pelajaran?.nama_mapel || '-'}`}>
      <Head title={`Absensi ${jadwal?.kelas?.nama_kelas || ''}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href={route('guru.absensi-mapel.index')} className="inline-flex items-center text-sm text-sky-600 hover:underline">
              <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">
              Absensi Kelas {jadwal?.kelas?.nama_kelas || (jadwal?.kelas?.tingkat ? `${jadwal.kelas.tingkat} ${jadwal.kelas.jurusan || ''}` : '')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Mapel: {jadwal?.mata_pelajaran?.nama_mapel || '-'} • {jadwal?.jam_mulai?.slice(0, 5) || '-'} - {jadwal?.jam_selesai?.slice(0, 5) || '-'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
              <div className="text-xs text-slate-500">Ringkasan:</div>
              <div className="text-xs font-medium text-green-700">Hadir {summary.Hadir}</div>
              <div className="text-xs font-medium text-amber-700">Sakit {summary.Sakit}</div>
              <div className="text-xs font-medium text-sky-700">Izin {summary.Izin}</div>
              <div className="text-xs font-medium text-red-700">Alfa {summary.Alfa}</div>
              <div className="text-xs text-slate-400 ml-2">Total {summary.total}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitClick(true)}
                disabled={processing || submittingWithLocation}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow hover:scale-[1.02] transform transition disabled:opacity-50"
                title="Simpan & sertakan lokasi (jika diizinkan)"
              >
                {processing ? 'Menyimpan...' : 'Simpan (dengan lokasi)'}
              </button>

              <button
                type="button"
                onClick={() => handleSubmitClick(false)}
                disabled={processing || submittingWithLocation}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title="Simpan tanpa lokasi"
              >
                Simpan tanpa lokasi
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={doSubmit} className="space-y-4" aria-label="Form absensi">
          {/* Filter bar */}
          <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Kolom pencarian + filter */}
            <div className="flex items-center gap-4 w-full md:w-2/3">
              {/* Input Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  aria-label="Cari siswa"
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-sky-300"
                  placeholder="Cari nama / NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Status */}
              <div className="flex gap-2 flex-wrap ml-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('Semua')}
                  className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === 'Semua'
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-100 text-slate-700'
                    }`}
                >
                  Semua
                </button>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === s
                        ? 'bg-sky-600 text-white'
                        : 'bg-gray-100 text-slate-700'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Set */}
            <div className="flex items-center gap-3 justify-end md:w-1/3">
              <div className="text-sm text-slate-500 hidden sm:block">Quick set:</div>
              <button
                type="button"
                onClick={() => setAllStatus('Hadir')}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm"
              >
                Set Semua Hadir
              </button>
              <button
                type="button"
                onClick={() => setAllStatus('Alfa')}
                className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm"
              >
                Set Semua Alfa
              </button>
            </div>
          </div>

          {/* List siswa */}
          <div className="bg-white border rounded-lg overflow-hidden">
            {(filteredSiswa || []).length === 0 ? (
              <div className="p-6 text-center text-slate-500">Tidak ada siswa sesuai filter.</div>
            ) : (
              <div className="divide-y">
                {(filteredSiswa || []).map((siswa) => {
                  const index = siswaList.findIndex(s => s.id_siswa === siswa.id_siswa);
                  const entry = data.entries?.[index] || { id_siswa: siswa.id_siswa, status_kehadiran: null, keterangan: '' };
                  const changed = absensiHariIni[siswa.id_siswa] ? (
                    absensiHariIni[siswa.id_siswa].status_kehadiran !== entry.status_kehadiran ||
                    absensiHariIni[siswa.id_siswa].keterangan !== entry.keterangan
                  ) : !!entry.status_kehadiran;

                  return (
                    <div key={siswa.id_siswa} className="grid grid-cols-12 gap-4 items-center p-3">
                      <div className="col-span-12 md:col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">{(siswa.nama_panggilan || siswa.nama_lengkap || '').slice(0, 1)}</div>
                          <div>
                            <div className="font-medium text-slate-900">{siswa.nama_lengkap}</div>
                            <div className="text-xs text-slate-500">NIS: {siswa.nis}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-5 flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleEntryChange(index, 'status_kehadiran', opt)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition ${entry.status_kehadiran === opt
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
                              }`}
                            aria-pressed={entry.status_kehadiran === opt}
                            aria-label={`Tandai ${siswa.nama_lengkap} sebagai ${opt}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div className="col-span-12 md:col-span-3">
                        {entry.status_kehadiran && entry.status_kehadiran !== 'Hadir' ? (
                          <input
                            value={entry.keterangan}
                            onChange={(e) => handleEntryChange(index, 'keterangan', e.target.value)}
                            placeholder="Keterangan (opsional)"
                            className="w-full text-sm border rounded-md px-2 py-2 focus:ring-2 focus:ring-sky-300"
                            aria-label={`Keterangan untuk ${siswa.nama_lengkap}`}
                          />
                        ) : (
                          <div className="text-sm text-slate-400">—</div>
                        )}
                      </div>

                      {/* status changed indicator */}
                      <div className="col-span-12 md:col-span-12 flex justify-end md:justify-between items-center gap-3">
                        <div className="text-xs text-slate-400 md:order-first">
                          {changed ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-4 w-4" /> Diubah</span> : <span className="text-xs text-slate-400">Belum diubah</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* bottom actions for mobile: sticky bar */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 sm:px-0 sm:static sm:max-w-none sm:flex sm:justify-end sm:mt-0">
            <div className="w-full sm:w-auto sm:ml-auto">
              <PrimaryButton type="button" disabled={processing} onClick={() => handleSubmitClick(false)} className="w-full sm:w-auto">
                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </PrimaryButton>
            </div>
          </div>
        </form>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
            <div className="relative max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900">Konfirmasi Simpan Absensi</h3>
              <p className="mt-2 text-sm text-slate-600">Anda akan menyimpan perubahan absensi untuk {summary.total} siswa. Lanjutkan?</p>
              {locationError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{locationError}</div>
                </div>
              )}
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setConfirmOpen(false)} className="px-3 py-2 rounded-md bg-white border">Batal</button>
                <button onClick={doSubmit} disabled={processing} className="px-4 py-2 rounded-md bg-sky-600 text-white">
                  {processing ? 'Menyimpan...' : 'Ya, Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* server validation errors */}
        {errors?.entries && (
          <div className="mt-4 text-sm text-red-600 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              {Array.isArray(errors.entries) ? errors.entries.join(', ') : String(errors.entries)}
            </div>
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
