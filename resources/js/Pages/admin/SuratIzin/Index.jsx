import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { debounce } from 'lodash';

import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

const StatusBadge = ({ status }) => {
  const styles = {
    Diajukan: 'bg-slate-100 text-slate-800 ring-slate-200',
    Disetujui: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    Ditolak: 'bg-rose-100 text-rose-800 ring-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${
        styles[status] || 'bg-slate-100 text-slate-800 ring-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

const JenisBadge = ({ jenis }) => {
  const styles = {
    Izin: 'bg-sky-100 text-sky-800 ring-sky-200',
    Sakit: 'bg-amber-100 text-amber-800 ring-amber-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${
        styles[jenis] || 'bg-slate-100 text-slate-800 ring-slate-200'
      }`}
    >
      {jenis}
    </span>
  );
};

const Pagination = ({ links }) => (
  <div className="mt-6 flex flex-wrap justify-center gap-2">
    {links.map((link, key) =>
      link.url === null ? (
        <div
          key={key}
          className="px-3 py-2 text-sm text-slate-400 border rounded-lg"
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ) : (
        <Link
          key={key}
          className={`px-3 py-2 text-sm border rounded-lg hover:bg-white ${
            link.active ? 'bg-white border-slate-300' : 'border-slate-200'
          }`}
          href={link.url}
          preserveScroll
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      )
    )}
  </div>
);

function formatDate(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return d;
  }
}

function formatDateShort(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function diffDaysIncl(start, end) {
  try {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const ms = e - s;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return days >= 0 ? days + 1 : 0;
  } catch {
    return 0;
  }
}

function hasRoute(name) {
  return !!window?.Ziggy?.routes?.[name];
}

function getExt(url) {
  if (!url) return '';
  const clean = String(url).split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function bytesToSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

export default function Index({ auth, filters, surat }) {
  const { props } = usePage();
  const flash = props?.flash || {};

  const [confirm, setConfirm] = useState({ open: false, type: null, item: null, loading: false });

  // ✅ Modal preview lampiran (tanpa tab baru)
  const [preview, setPreview] = useState({
    open: false,
    kind: 'other', // image | pdf | other
    url: null, // url untuk ditampilkan (view route kalau ada)
    rawUrl: null, // url asli dari DB (buat deteksi ekstensi)
    downloadUrl: null,
    title: 'Lampiran',
    loading: false,
  });

  const canLampiranView = hasRoute('admin.surat-izin.lampiran.view');
  const canLampiranDownload = hasRoute('admin.surat-izin.lampiran.download');

  const doSearch = useMemo(
    () =>
      debounce((value) => {
        router.get(
          route('admin.surat-izin.index'),
          { ...filters, q: value },
          { preserveState: true, replace: true, preserveScroll: true }
        );
      }, 300),
    [filters]
  );

  useEffect(() => {
    return () => doSearch.cancel();
  }, [doSearch]);

  const handleFilterChange = (key, value) => {
    router.get(
      route('admin.surat-izin.index'),
      { ...filters, [key]: value },
      { preserveState: true, replace: true, preserveScroll: true }
    );
  };

  const resetFilters = () => {
    router.get(route('admin.surat-izin.index'), {}, { preserveState: false, replace: true, preserveScroll: true });
  };

  const openConfirm = (type, item) => setConfirm({ open: true, type, item, loading: false });
  const closeConfirm = () => setConfirm({ open: false, type: null, item: null, loading: false });

  const submitAction = async () => {
    if (!confirm.item || !confirm.type) return;
    setConfirm((c) => ({ ...c, loading: true }));

    const id = confirm.item.id_surat;
    let url;

    switch (confirm.type) {
      case 'approve':
        url = route('admin.surat-izin.approve', { surat: id });
        break;
      case 'reject':
        url = route('admin.surat-izin.reject', { surat: id });
        break;
      case 'resync':
        url = route('admin.surat-izin.resync', { surat: id });
        break;
      case 'unsync':
        url = route('admin.surat-izin.unsync', { surat: id });
        break;
      default:
        return;
    }

    router.post(
      url,
      {},
      {
        preserveScroll: true,
        onFinish: () => setConfirm({ open: false, type: null, item: null, loading: false }),
      }
    );
  };

  const openPreview = (item) => {
    const raw = item?.file_lampiran;
    if (!raw) return;

    const ext = getExt(raw);
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    const isPdf = ext === 'pdf';

    // ✅ tampilkan via route view (auth-safe), fallback ke raw url
    const viewUrl = canLampiranView ? route('admin.surat-izin.lampiran.view', { surat: item.id_surat }) : raw;
    const downloadUrl = canLampiranDownload
      ? route('admin.surat-izin.lampiran.download', { surat: item.id_surat })
      : raw;

    setPreview({
      open: true,
      kind: isImg ? 'image' : isPdf ? 'pdf' : 'other',
      url: viewUrl,
      rawUrl: raw,
      downloadUrl,
      title: `Lampiran — Surat #${item.id_surat}`,
      loading: true,
    });
  };

  const closePreview = () => {
    setPreview((p) => ({ ...p, open: false, url: null, rawUrl: null, downloadUrl: null, loading: false }));
  };

  const renderActions = (item) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {item.status_pengajuan === 'Diajukan' && (
          <>
            <button
              type="button"
              onClick={() => openConfirm('approve', item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
              title="Setujui & sinkron ke absensi"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => openConfirm('reject', item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 text-xs font-semibold"
              title="Tolak"
            >
              <XCircleIcon className="h-4 w-4" />
              Reject
            </button>
          </>
        )}

        {item.status_pengajuan === 'Disetujui' && (
          <>
            <button
              type="button"
              onClick={() => openConfirm('resync', item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-sky-600 hover:bg-sky-700 text-xs font-semibold"
              title="Resinkron absensi dari surat (tanpa menimpa 'Hadir')"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Resync
            </button>
            <button
              type="button"
              onClick={() => openConfirm('unsync', item)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-amber-600 hover:bg-amber-700 text-xs font-semibold"
              title="Batalkan efek sinkronisasi (revert)"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Unsync
            </button>
          </>
        )}

        {item.status_pengajuan === 'Ditolak' && (
          <button
            type="button"
            onClick={() => openConfirm('approve', item)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
            title="Setujui & sinkron ke absensi"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Approve
          </button>
        )}
      </div>
    );
  };

  return (
    <AdminLayout user={auth.user} header="Surat Izin Siswa">
      <Head title="Surat Izin Siswa" />

      <div className="space-y-6">
        {/* Flash */}
        {(flash.success || flash.status || flash.error) && (
          <div
            className={`p-4 rounded-xl border ${
              flash.error ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {flash.error || flash.success || flash.status}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Surat Izin — Verifikasi/Approval</h1>
            <p className="text-sm text-slate-500 mt-1">
              Approve / reject surat dan sinkron otomatis ke absensi harian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={route('admin.surat-izin.create')}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Buat Surat
            </Link>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <FunnelIcon className="h-5 w-5" />
            <span className="font-bold">Filter</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <InputLabel htmlFor="q" value="Cari (Nama / NIS)" />
              <TextInput
                id="q"
                type="text"
                defaultValue={filters?.q || ''}
                onChange={(e) => doSearch(e.target.value)}
                className="mt-1 block w-full"
                placeholder="Ketik nama siswa atau NIS..."
              />
            </div>

            <div>
              <InputLabel htmlFor="status" value="Status" />
              <select
                id="status"
                value={filters?.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || null)}
                className="mt-1 block w-full border-slate-200 rounded-xl shadow-sm focus:ring-sky-400 focus:border-sky-400"
              >
                <option value="">Semua</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <InputLabel htmlFor="dari" value="Dari (Tanggal Pengajuan)" />
                <TextInput
                  id="dari"
                  type="date"
                  defaultValue={filters?.dari || ''}
                  onChange={(e) => handleFilterChange('dari', e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <InputLabel htmlFor="sampai" value="Sampai (Tanggal Pengajuan)" />
                <TextInput
                  id="sampai"
                  type="date"
                  defaultValue={filters?.sampai || ''}
                  onChange={(e) => handleFilterChange('sampai', e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex items-end">
                <SecondaryButton type="button" onClick={resetFilters} className="w-full">
                  Reset
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Daftar Surat Izin</h2>
            <div className="text-xs text-slate-500">
              Total: <span className="font-semibold">{surat?.total ?? '-'}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Tgl Pengajuan', 'Siswa (NIS)', 'Periode Izin', 'Jenis', 'Status', 'Lampiran', 'Keterangan', 'Aksi'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {surat?.data?.length ? (
                  surat.data.map((item) => (
                    <tr key={item.id_surat} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                        {formatDate(item.tanggal_pengajuan)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-800">
                        <div className="font-bold">{item.siswa?.nama_lengkap || '-'}</div>
                        <div className="text-slate-500">{item.siswa?.nis || '-'}</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                        <div>
                          {formatDateShort(item.tanggal_mulai_izin)} &ndash; {formatDateShort(item.tanggal_selesai_izin)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {diffDaysIncl(item.tanggal_mulai_izin, item.tanggal_selesai_izin)} hari
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <JenisBadge jenis={item.jenis_izin} />
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status_pengajuan} />
                      </td>

                      {/* ✅ Lampiran: preview modal (no new tab) */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {item.file_lampiran ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openPreview(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              title="Preview lampiran"
                            >
                              <PaperClipIcon className="h-4 w-4 text-slate-500" />
                              Preview
                            </button>

                            <a
                              href={
                                canLampiranDownload
                                  ? route('admin.surat-izin.lampiran.download', { surat: item.id_surat })
                                  : item.file_lampiran
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                              title="Download lampiran"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate" title={item.keterangan || '-'}>
                        {item.keterangan || '-'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">{renderActions(item)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-slate-400" />
                        Tidak ada data surat.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {surat?.links && <Pagination links={surat.links} />}
        </div>
      </div>

      {/* Modal Konfirmasi Aksi */}
      <Modal show={confirm.open} onClose={closeConfirm}>
        <div className="p-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Konfirmasi Aksi</h2>
          <p className="text-sm text-slate-600 mb-4">
            {confirm.type === 'approve' && (
              <>
                Setujui surat izin <span className="font-bold">{confirm.item?.siswa?.nama_lengkap}</span> dan{' '}
                <span className="font-bold">sinkron</span> ke absensi pada periode terkait?
              </>
            )}
            {confirm.type === 'reject' && (
              <>
                Yakin menolak surat izin <span className="font-bold">{confirm.item?.siswa?.nama_lengkap}</span>?
              </>
            )}
            {confirm.type === 'resync' && (
              <>
                Jalankan <span className="font-bold">resync</span> absensi dari surat ini (tidak menimpa status{' '}
                <span className="font-bold">Hadir</span>)?
              </>
            )}
            {confirm.type === 'unsync' && (
              <>
                Batalkan efek sinkronisasi surat ini? Absensi yang dibuat oleh surat akan{' '}
                <span className="font-bold">direvert</span> (menjadi Alfa).
              </>
            )}
          </p>

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={closeConfirm} disabled={confirm.loading}>
              Batal
            </SecondaryButton>
            <PrimaryButton type="button" onClick={submitAction} disabled={confirm.loading}>
              {confirm.loading ? 'Memproses...' : 'Lanjutkan'}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* ✅ Modal Preview Lampiran */}
      <Modal show={preview.open} onClose={closePreview}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{preview.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {preview.rawUrl ? `Tipe: ${getExt(preview.rawUrl) || 'unknown'}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={closePreview}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Tutup preview"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="relative w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              {preview.loading && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
                    Memuat lampiran...
                  </div>
                </div>
              )}

              {preview.kind === 'image' ? (
                <img
                  src={preview.url}
                  alt="Lampiran"
                  className="w-full max-h-[75vh] object-contain bg-white"
                  onLoad={() => setPreview((p) => ({ ...p, loading: false }))}
                  onError={() => setPreview((p) => ({ ...p, loading: false, kind: 'other' }))}
                />
              ) : preview.kind === 'pdf' ? (
                <iframe
                  title="Lampiran PDF"
                  src={preview.url}
                  className="w-full h-[75vh] bg-white"
                  onLoad={() => setPreview((p) => ({ ...p, loading: false }))}
                />
              ) : (
                <div className="p-6">
                  <div className="text-sm text-slate-700">
                    Preview otomatis tidak tersedia untuk tipe file ini.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {preview.url && (
                      <a
                        href={preview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Buka di tab baru
                      </a>
                    )}
                    {preview.downloadUrl && (
                      <a
                        href={preview.downloadUrl}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {preview.downloadUrl && (
              <div className="mt-3 flex justify-end">
                <a
                  href={preview.downloadUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Download
                </a>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
