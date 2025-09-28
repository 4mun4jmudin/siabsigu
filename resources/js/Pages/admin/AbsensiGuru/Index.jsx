import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import WeeklyAttendanceChart from './Components/WeeklyAttendanceChart';
import {
  PlusIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/solid';
import { debounce } from 'lodash';

const StatCard = ({ title, value, description, icon, color }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm flex items-center justify-between border-l-4" style={{ borderColor: color }}>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    {icon}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Hadir: 'bg-green-100 text-green-800',
    Sakit: 'bg-yellow-100 text-yellow-800',
    Izin: 'bg-blue-100 text-blue-800',
    Alfa: 'bg-red-100 text-red-800',
    'Dinas Luar': 'bg-purple-100 text-purple-800',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const TabLink = ({ href, isActive, children }) => (
  <Link
    href={href}
    preserveState
    preserveScroll
    className={`px-3 py-2 font-semibold text-sm rounded-md ${isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
  >
    {children}
  </Link>
);

const Pagination = ({ links }) => (
  <div className="mt-6 flex justify-center">
    {links.map((link, key) =>
      link.url === null ? (
        <div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />
      ) : (
        <Link
          key={key}
          className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${
            link.active ? 'bg-white' : ''
          }`}
          href={link.url}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      )
    )}
  </div>
);

export default function Index({
  auth,
  absensiData,
  stats,
  guruBelumAbsen,
  riwayatAbsensi,
  laporanBulanan,
  laporanSemesteran,
  tahunAjaranOptions,
  filters,
  chartData,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    tanggal: filters.tanggal,
    id_guru: '',
    status_kehadiran: 'Hadir',
    jam_masuk: '',
    jam_pulang: '',
    keterangan: '',
  });

  const handleFilterChange = (key, value) => {
    router.get(route('admin.absensi-guru.index'), { ...filters, [key]: value }, { preserveState: true, replace: true, preserveScroll: true });
  };

  const handleSearch = debounce((e) => handleFilterChange('search', e.target.value), 300);

  const openModal = (absen = null) => {
    if (absen) {
      setIsEditMode(true);
      setData({
        tanggal: filters.tanggal,
        id_guru: absen.id_guru,
        nama_lengkap: absen.guru.nama_lengkap,
        status_kehadiran: absen.status_kehadiran,
        jam_masuk: absen.jam_masuk || '',
        jam_pulang: absen.jam_pulang || '',
        keterangan: absen.keterangan || '',
      });
    } else {
      setIsEditMode(false);
      reset();
      setData('tanggal', filters.tanggal);
    }
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const submitManualAbsensi = (e) => {
    e.preventDefault();
    post(route('admin.absensi-guru.store'), {
      onSuccess: () => closeModal(),
      preserveScroll: true,
    });
  };

  const handleExport = (format) => {
    const params = new URLSearchParams();
    let exportUrl = '';

    if (filters.tab === 'laporan_bulanan') {
      if (filters.bulan && filters.tahun) {
        params.append('bulan', filters.bulan);
        params.append('tahun', filters.tahun);
      } else {
        alert('Peringatan: Silakan pilih Bulan dan Tahun terlebih dahulu.');
        return;
      }
    } else if (filters.tab === 'laporan_semester') {
      if (filters.id_tahun_ajaran) {
        params.append('id_tahun_ajaran', filters.id_tahun_ajaran);
      } else {
        alert('Peringatan: Silakan pilih Tahun Ajaran terlebih dahulu.');
        return;
      }
    } else {
      return;
    }

    exportUrl = format === 'excel' ? route('admin.absensi-guru.export-excel') : route('admin.absensi-guru.export-pdf');
    window.open(`${exportUrl}?${params.toString()}`, '_blank');
  };

  return (
    <AdminLayout user={auth.user} header="Absensi Guru">
      <Head title="Absensi Guru" />
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Absensi Guru</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola absensi kehadiran guru harian</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Input Absensi Manual
          </button>
        </div>

        {filters.tab === 'harian' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="Total Guru" value={stats.total_guru} description="Guru aktif" icon={<UserGroupIcon className="h-8 w-8 text-gray-400" />} color="#6b7280" />
            <StatCard
              title="Hadir"
              value={stats.hadir}
              description={`${Math.round((stats.hadir / (stats.total_guru || 1)) * 100)}%`}
              icon={<CheckCircleIcon className="h-8 w-8 text-green-500" />}
              color="#22c55e"
            />
            <StatCard title="Izin" value={stats.izin} description="Dengan keterangan" icon={<InformationCircleIcon className="h-8 w-8 text-blue-500" />} color="#3b82f6" />
            <StatCard title="Sakit" value={stats.sakit} description="Tidak masuk" icon={<ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />} color="#eab308" />
            <StatCard title="Alfa" value={stats.alfa} description="Tanpa keterangan" icon={<XCircleIcon className="h-8 w-8 text-red-500" />} color="#ef4444" />
          </div>
        )}

        <div className="bg-gray-100 p-1 rounded-lg flex space-x-2">
          <TabLink href={route('admin.absensi-guru.index', { tab: 'harian' })} isActive={filters.tab === 'harian'}>
            Absensi Hari Ini
          </TabLink>
          <TabLink href={route('admin.absensi-guru.index', { tab: 'riwayat' })} isActive={filters.tab === 'riwayat'}>
            Riwayat Absensi
          </TabLink>
          <TabLink href={route('admin.absensi-guru.index', { tab: 'laporan_bulanan' })} isActive={filters.tab === 'laporan_bulanan'}>
            Laporan Bulanan
          </TabLink>
          <TabLink href={route('admin.absensi-guru.index', { tab: 'laporan_semester' })} isActive={filters.tab === 'laporan_semester'}>
            Laporan Semester
          </TabLink>
        </div>

        <div>
          {filters.tab === 'harian' && (
            <div className="space-y-6 animate-fade-in">
              {chartData && <WeeklyAttendanceChart chartData={chartData} />}

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Absensi</h3>
                <div className="flex items-center gap-4">
                  <TextInput type="text" defaultValue={filters.search} onChange={handleSearch} placeholder="Cari nama guru atau NIP..." className="w-full" />
                  <TextInput type="date" value={filters.tanggal} onChange={(e) => handleFilterChange('tanggal', e.target.value)} className="w-auto" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Daftar Absensi Guru -{' '}
                  {new Date(filters.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['NIP', 'Nama Guru', 'Jam Masuk', 'Status', 'Keterlambatan', 'Aksi'].map((head) => (
                          <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {absensiData?.map((absen) => (
                        <tr key={absen.id_guru}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{absen.guru.nip || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{absen.guru.nama_lengkap}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{absen.jam_masuk || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={absen.status_kehadiran} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {absen.status_kehadiran === 'Hadir' ? (
                              (absen.menit_keterlambatan ?? 0) > 0 ? (
                                <span className="text-red-600 font-semibold">{absen.menit_keterlambatan} menit</span>
                              ) : (
                                <span className="text-green-600">Tepat Waktu</span>
                              )
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-x-3">
                              <Link
                                href={route('admin.absensi-guru.show', { absensi_guru: absen.id_guru })}
                                className="text-gray-400 hover:text-blue-600 transition"
                                title="Lihat Detail Riwayat"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              <button onClick={() => openModal(absen)} className="text-gray-400 hover:text-indigo-600 transition" title="Edit Absensi">
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {absensiData?.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            Belum ada data absensi untuk tanggal ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {filters.tab === 'riwayat' && (
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat Absensi (30 Hari Terakhir)</h3>
              <TextInput type="text" defaultValue={filters.search} onChange={handleSearch} placeholder="Cari nama guru atau NIP..." className="w-full mb-4" />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Tanggal', 'Nama Guru', 'Status', 'Jam Masuk', 'Jam Pulang', 'Keterangan'].map((head) => (
                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {riwayatAbsensi?.data?.map((absen) => (
                      <tr key={absen.id_absensi}>
                        <td className="px-6 py-4">
                          {new Date(absen.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-medium">{absen.guru.nama_lengkap}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={absen.status_kehadiran} />
                        </td>
                        <td className="px-6 py-4">{absen.jam_masuk || '-'}</td>
                        <td className="px-6 py-4">{absen.jam_pulang || '-'}</td>
                        <td className="px-6 py-4">{absen.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {riwayatAbsensi && <Pagination links={riwayatAbsensi.links} />}
              </div>
            </div>
          )}

          {filters.tab === 'laporan_bulanan' && (
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Laporan Bulanan</h3>
                <div className="flex items-center gap-4">
                  <select onChange={(e) => handleFilterChange('bulan', e.target.value)} value={filters.bulan} className="border-gray-300 rounded-md shadow-sm">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select onChange={(e) => handleFilterChange('tahun', e.target.value)} value={filters.tahun} className="border-gray-300 rounded-md shadow-sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i}>{new Date().getFullYear() - i}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-red-700 transition text-sm"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" /> PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-700 transition text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> Excel
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Nama Guru', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Dinas Luar', 'Kehadiran (%)', 'Rata Telat (mnt)', 'Aksi'].map((head) => (
                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laporanBulanan?.map((guru) => (
                      <tr key={guru.id_guru}>
                        <td className="px-6 py-4 font-medium">{guru.nama_lengkap}</td>
                        <td className="px-6 py-4 text-center">{guru.hadir}</td>
                        <td className="px-6 py-4 text-center">{guru.sakit}</td>
                        <td className="px-6 py-4 text-center">{guru.izin}</td>
                        <td className="px-6 py-4 text-center">{guru.alfa}</td>
                        <td className="px-6 py-4 text-center">{guru.dinas_luar ?? 0}</td>
                        <td className="px-6 py-4 text-center">{guru.persen_hadir ?? 0}%</td>
                        <td className="px-6 py-4 text-center">{guru.rata_telat ?? 0}</td>
                        <td className="px-6 py-4">
                          <Link
                            href={route('admin.absensi-guru.show', {
                              absensi_guru: guru.id_guru,
                              bulan: filters.bulan,
                              tahun: filters.tahun,
                            })}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <EyeIcon className="h-5 w-5" />
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filters.tab === 'laporan_semester' && (
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Laporan Semester</h3>
                <div className="flex items-center gap-4">
                  <select
                    onChange={(e) => handleFilterChange('id_tahun_ajaran', e.target.value)}
                    value={filters.id_tahun_ajaran || ''}
                    className="border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {tahunAjaranOptions?.map((ta) => (
                      <option key={ta.id_tahun_ajaran} value={ta.id_tahun_ajaran}>
                        {ta.tahun_ajaran} - {ta.semester}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-red-700 transition text-sm"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" /> PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-700 transition text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Nama Guru', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Dinas Luar', 'Kehadiran (%)', 'Rata Telat (mnt)', 'Aksi'].map((head) => (
                        <th key={head} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laporanSemesteran?.map((guru) => (
                      <tr key={guru.id_guru}>
                        <td className="px-6 py-4 font-medium">{guru.nama_lengkap}</td>
                        <td className="px-6 py-4 text-center">{guru.hadir}</td>
                        <td className="px-6 py-4 text-center">{guru.sakit}</td>
                        <td className="px-6 py-4 text-center">{guru.izin}</td>
                        <td className="px-6 py-4 text-center">{guru.alfa}</td>
                        <td className="px-6 py-4 text-center">{guru.dinas_luar ?? 0}</td>
                        <td className="px-6 py-4 text-center">{guru.persen_hadir ?? 0}%</td>
                        <td className="px-6 py-4 text-center">{guru.rata_telat ?? 0}</td>
                        <td className="px-6 py-4">
                          <Link
                            href={route('admin.absensi-guru.show', { absensi_guru: guru.id_guru })}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <EyeIcon className="h-5 w-5" />
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal show={isModalOpen} onClose={closeModal}>
        <form onSubmit={submitManualAbsensi} className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{isEditMode ? 'Edit Absensi' : 'Input Absensi Manual'}</h2>
          <div className="space-y-4">
            <div>
              <InputLabel htmlFor="id_guru" value="Pilih Guru" />
              {isEditMode ? (
                <TextInput value={data.nama_lengkap} className="mt-1 block w-full bg-gray-100" disabled />
              ) : (
                <select
                  id="id_guru"
                  value={data.id_guru}
                  onChange={(e) => setData('id_guru', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="">--- Pilih Guru yang Belum Absen ---</option>
                  {guruBelumAbsen?.map((guru) => (
                    <option key={guru.id_guru} value={guru.id_guru}>
                      {guru.nama_lengkap} ({guru.nip})
                    </option>
                  ))}
                </select>
              )}
              <InputError message={errors.id_guru} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="status_kehadiran" value="Status Kehadiran" />
              <select
                id="status_kehadiran"
                value={data.status_kehadiran}
                onChange={(e) => setData('status_kehadiran', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                {['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dinas Luar'].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <InputError message={errors.status_kehadiran} className="mt-2" />
            </div>
            {data.status_kehadiran === 'Hadir' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="jam_masuk" value="Jam Masuk" />
                  <TextInput
                    id="jam_masuk"
                    type="time"
                    value={data.jam_masuk || ''}
                    onChange={(e) => setData('jam_masuk', e.target.value)}
                    className="mt-1 block w-full"
                  />
                  <InputError message={errors.jam_masuk} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="jam_pulang" value="Jam Pulang" />
                  <TextInput
                    id="jam_pulang"
                    type="time"
                    value={data.jam_pulang || ''}
                    onChange={(e) => setData('jam_pulang', e.target.value)}
                    className="mt-1 block w-full"
                  />
                  <InputError message={errors.jam_pulang} className="mt-2" />
                </div>
              </div>
            )}
            <div>
              <InputLabel htmlFor="keterangan" value="Keterangan (Opsional)" />
              <TextInput id="keterangan" value={data.keterangan || ''} onChange={(e) => setData('keterangan', e.target.value)} className="mt-1 block w-full" />
              <InputError message={errors.keterangan} className="mt-2" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton type="button" onClick={closeModal}>
              Batal
            </SecondaryButton>
            <PrimaryButton className="ml-3" disabled={processing}>
              {processing ? 'Menyimpan...' : 'Simpan'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
