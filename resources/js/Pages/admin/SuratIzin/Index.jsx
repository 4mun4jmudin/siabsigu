import React, { useMemo, useState } from 'react';
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
} from '@heroicons/react/24/solid';

const StatusBadge = ({ status }) => {
  const styles = {
    Diajukan: 'bg-gray-100 text-gray-800',
    Disetujui: 'bg-green-100 text-green-800',
    Ditolak: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const JenisBadge = ({ jenis }) => {
  const styles = {
    Izin: 'bg-blue-100 text-blue-800',
    Sakit: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[jenis] || 'bg-gray-100 text-gray-800'}`}>
      {jenis}
    </span>
  );
};

const Pagination = ({ links }) => (
  <div className="mt-6 flex justify-center">
    {links.map((link, key) =>
      link.url === null ? (
        <div
          key={key}
          className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded"
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ) : (
        <Link
          key={key}
          className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${
            link.active ? 'bg-white' : ''
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
    return days >= 0 ? days + 1 : 0; // inklusif
  } catch {
    return 0;
  }
}

export default function Index({ auth, filters, surat }) {
  const { props } = usePage();
  const flash = props?.flash || {};
  const [confirm, setConfirm] = useState({ open: false, type: null, item: null, loading: false });

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
        onFinish: () => {
          setConfirm({ open: false, type: null, item: null, loading: false });
        },
      }
    );
  };

  const renderActions = (item) => {
    return (
      <div className="flex items-center gap-2">
        {item.status_pengajuan === 'Diajukan' && (
          <>
            <button
              type="button"
              onClick={() => openConfirm('approve', item)}
              className="inline-flex items-center px-2 py-1 rounded text-white bg-green-600 hover:bg-green-700 text-xs"
              title="Setujui & sinkron ke absensi"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => openConfirm('reject', item)}
              className="inline-flex items-center px-2 py-1 rounded text-white bg-red-600 hover:bg-red-700 text-xs"
              title="Tolak"
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Reject
            </button>
          </>
        )}
        {item.status_pengajuan === 'Disetujui' && (
          <>
            <button
              type="button"
              onClick={() => openConfirm('resync', item)}
              className="inline-flex items-center px-2 py-1 rounded text-white bg-blue-600 hover:bg-blue-700 text-xs"
              title="Resinkron absensi dari surat (tanpa menimpa 'Hadir')"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Resync
            </button>
            <button
              type="button"
              onClick={() => openConfirm('unsync', item)}
              className="inline-flex items-center px-2 py-1 rounded text-white bg-amber-600 hover:bg-amber-700 text-xs"
              title="Batalkan efek sinkronisasi (revert)"
            >
              <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
              Unsync
            </button>
          </>
        )}
        {item.status_pengajuan === 'Ditolak' && (
          <button
            type="button"
            onClick={() => openConfirm('approve', item)}
            className="inline-flex items-center px-2 py-1 rounded text-white bg-green-600 hover:bg-green-700 text-xs"
            title="Setujui & sinkron ke absensi"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
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
        {/* Flash messages */}
        {(flash.success || flash.status || flash.error) && (
          <div
            className={`p-4 rounded-md ${
              flash.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            } border ${flash.error ? 'border-red-200' : 'border-green-200'}`}
          >
            {flash.error || flash.success || flash.status}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Surat Izin — Verifikasi/Approval</h1>
            <p className="text-sm text-gray-500 mt-1">Approve / reject surat dan sinkron otomatis ke absensi harian.</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <FunnelIcon className="h-5 w-5" />
            <span className="font-semibold">Filter</span>
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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

        {/* Tabel */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Daftar Surat Izin</h2>
            {/* tempatkan tombol export jika perlu */}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Tgl Pengajuan',
                    'Siswa (NIS)',
                    'Periode Izin',
                    'Jenis',
                    'Status',
                    'Lampiran',
                    'Keterangan',
                    'Aksi',
                  ].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surat?.data?.length ? (
                  surat.data.map((item) => (
                    <tr key={item.id_surat} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(item.tanggal_pengajuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <div className="font-semibold">{item.siswa?.nama_lengkap || '-'}</div>
                        <div className="text-gray-500">{item.siswa?.nis || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          {formatDateShort(item.tanggal_mulai_izin)} &ndash; {formatDateShort(item.tanggal_selesai_izin)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {diffDaysIncl(item.tanggal_mulai_izin, item.tanggal_selesai_izin)} hari
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <JenisBadge jenis={item.jenis_izin} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status_pengajuan} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.file_lampiran ? (
                          <a
                            href={item.file_lampiran}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline"
                            title="Buka lampiran"
                          >
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            Lampiran
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.keterangan || '-'}>
                        {item.keterangan || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{renderActions(item)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
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

      {/* Modal Konfirmasi */}
      <Modal show={confirm.open} onClose={closeConfirm}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Aksi</h2>
          <p className="text-sm text-gray-600 mb-4">
            {confirm.type === 'approve' && (
              <>
                Setujui surat izin{' '}
                <span className="font-semibold">{confirm.item?.siswa?.nama_lengkap}</span> dan{' '}
                <span className="font-semibold">sinkron</span> ke absensi pada periode terkait?
              </>
            )}
            {confirm.type === 'reject' && (
              <>
                Yakin menolak surat izin{' '}
                <span className="font-semibold">{confirm.item?.siswa?.nama_lengkap}</span>?
              </>
            )}
            {confirm.type === 'resync' && (
              <>
                Jalankan <span className="font-semibold">resync</span> absensi dari surat ini (tidak menimpa status{' '}
                <span className="font-semibold">Hadir</span>)?
              </>
            )}
            {confirm.type === 'unsync' && (
              <>
                Batalkan efek sinkronisasi surat ini? Absensi yang dibuat oleh surat akan{' '}
                <span className="font-semibold">direvert</span> (menjadi Alfa).
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
    </AdminLayout>
  );
}
