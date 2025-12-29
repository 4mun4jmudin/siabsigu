import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import ToastNotification from '@/Components/ToastNotification';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import {
  User,
  Users,
  Calendar,
  Edit,
  Trash2,
  Printer,
  KeyRound,
  ChevronLeft,
  BookOpen,
  Fingerprint,
  QrCode,
} from 'lucide-react';
import Barcode from 'react-barcode';

/*
  File: Show.jsx (Detail Siswa)
  Fix utama:
  - Foto profil pakai `siswa.foto_url` dari backend (/storage-public/...)
  - Tambah fallback via onError (biar gak blank kalau file hilang)
*/

const StatusBadge = ({ status }) => {
  const statusMap = {
    Hadir: 'bg-green-100 text-green-800',
    Sakit: 'bg-yellow-100 text-yellow-800',
    Izin: 'bg-blue-100 text-blue-800',
    Alfa: 'bg-red-100 text-red-800',
    Aktif: 'bg-green-100 text-green-800',
    Lulus: 'bg-blue-100 text-blue-800',
    Pindah: 'bg-yellow-100 text-yellow-800',
    'Drop Out': 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
        statusMap[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-sm transition ${
      active
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
    }`}
    aria-pressed={active}
    type="button"
  >
    {children}
  </button>
);

/* --- Biodata Tab --- */
const BiodataTab = ({ siswa }) => {
  const dob = siswa.tanggal_lahir
    ? new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informasi Pribadi
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm text-gray-500">Nama Panggilan</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.nama_panggilan || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Jenis Kelamin</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.jenis_kelamin || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">NIK</dt>
            <dd className="mt-1 text-sm text-gray-900">{siswa.nik || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Nomor KK</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.nomor_kk || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Tempat, Tanggal Lahir</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.tempat_lahir || '-'}, {dob}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Agama</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.agama || '-'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-gray-500">Alamat Lengkap</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.alamat_lengkap || '-'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informasi Akademik
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm text-gray-500">Wali Kelas</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.kelas?.wali_kelas?.nama_lengkap || 'Belum diatur'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Kelas</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={siswa.status} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

/* --- Parent Tab --- */
const ParentTab = ({ parents }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {parents?.length > 0 ? (
      parents.map((parent) => (
        <article
          key={parent.id_wali}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-900">
                {parent.nama_lengkap}
              </h4>
              <p className="text-sm text-blue-600">{parent.hubungan}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <strong>WA:</strong> {parent.no_telepon_wa || '-'}
            </div>
            <div>
              <strong>Pekerjaan:</strong> {parent.pekerjaan || '-'}
            </div>
            <div>
              <strong>Pendidikan:</strong> {parent.pendidikan_terakhir || '-'}
            </div>
          </div>
        </article>
      ))
    ) : (
      <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-gray-500">
        Tidak ada data orang tua/wali ditemukan.
      </div>
    )}
  </div>
);

/* --- Attendance Tab --- */
const AttendanceTab = ({ attendance }) => {
  const hadir = attendance.filter((d) => d.status_kehadiran === 'Hadir').length;
  const sakit = attendance.filter((d) => d.status_kehadiran === 'Sakit').length;
  const izin = attendance.filter((d) => d.status_kehadiran === 'Izin').length;
  const alfa = attendance.filter((d) => d.status_kehadiran === 'Alfa').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Rekap Absensi (30 Hari Terakhir)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan cepat kehadiran siswa.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center w-full max-w-md">
          <div className="p-3 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">{hadir}</p>
            <p className="text-xs text-gray-500">Hadir</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50">
            <p className="text-2xl font-bold text-yellow-600">{sakit}</p>
            <p className="text-xs text-gray-500">Sakit</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">{izin}</p>
            <p className="text-xs text-gray-500">Izin</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50">
            <p className="text-2xl font-bold text-red-600">{alfa}</p>
            <p className="text-xs text-gray-500">Alfa</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((att) => (
                <tr key={att.id_absensi}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(att.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge status={att.status_kehadiran} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {att.keterangan || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-gray-200">
          {attendance.map((att) => (
            <div key={att.id_absensi} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(att.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(att.tanggal).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div>
                  <StatusBadge status={att.status_kehadiran} />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {att.keterangan || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- Keamanan Tab (Form) --- */
const KeamananTab = ({ siswa, onSave }) => {
  const { data, setData, processing, errors, reset } = useForm({
    sidik_jari_template: siswa.sidik_jari_template || '',
    barcode_id: siswa.barcode_id || '',
  });

  const [localSaved, setLocalSaved] = useState(false);

  useEffect(() => {
    if (processing) setLocalSaved(false);
  }, [processing]);

  const handleRegisterFingerprint = () => {
    const simulatedTemplate = `SIMULASI_TEMPLATE_${siswa.nis}_${Date.now()}`;
    setData('sidik_jari_template', simulatedTemplate);
    setLocalSaved(false);
    alert(
      'Simulasi pendaftaran sidik jari berhasil. Jangan lupa klik "Simpan Perubahan".'
    );
  };

  const handleGenerateBarcode = () => {
    const randomId =
      'SISWA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setData('barcode_id', randomId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
    setLocalSaved(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Data Keamanan & Akses
          </h3>
          <p className="text-sm text-gray-500">
            Sidik jari & barcode untuk akses/absensi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <Printer size={14} /> Cetak Kartu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Sidik Jari <Fingerprint size={16} />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Template sidik jari (simulasi untuk demo).
          </p>
          <textarea
            value={data.sidik_jari_template}
            readOnly
            rows={5}
            className="mt-3 block w-full border border-gray-200 rounded-md bg-gray-50 text-sm p-3"
            placeholder="Template sidik jari akan tampil setelah pendaftaran..."
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleRegisterFingerprint}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700"
            >
              Daftarkan Sidik Jari (Sim)
            </button>
            <span className="text-xs text-gray-500">
              Status:{' '}
              {data.sidik_jari_template ? (
                <span className="text-green-600 font-medium">Tersedia</span>
              ) : (
                <span className="text-gray-400">Belum</span>
              )}
            </span>
          </div>
          {errors.sidik_jari_template && (
            <p className="mt-2 text-xs text-red-600">
              {errors.sidik_jari_template}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Barcode / Kartu <QrCode size={16} />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Gunakan ID berikut untuk cetak kartu siswa.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={data.barcode_id}
              onChange={(e) => setData('barcode_id', e.target.value)}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
              placeholder="ID unik untuk barcode"
            />
            <button
              type="button"
              onClick={handleGenerateBarcode}
              className="px-3 py-2 bg-gray-200 rounded-md text-xs hover:bg-gray-300"
            >
              Generate
            </button>
          </div>
          {errors.barcode_id && (
            <p className="mt-2 text-xs text-red-600">{errors.barcode_id}</p>
          )}

          {data.barcode_id && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 flex flex-col items-center">
              <Barcode value={data.barcode_id} width={1.4} height={50} fontSize={12} />
              <div className="mt-2 text-xs text-gray-600">
                ID: <span className="font-medium">{data.barcode_id}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          {localSaved && (
            <span className="text-sm text-green-600">
              Perubahan tersimpan (pastikan backend menyimpan juga).
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              setLocalSaved(false);
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-xs hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold"
            disabled={processing}
          >
            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </form>
  );
};

/* --- Main component --- */
export default function Show({ auth, siswa, orangTuaWali = [], riwayatAbsensi = [] }) {
  const { flash } = usePage().props;

  const [activeTab, setActiveTab] = useState('biodata');
  const { delete: destroy, processing: processingDelete } = useForm();

  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    if (flash?.message) {
      setToast({ show: true, message: flash.message });
    }
  }, [flash]);

  const confirmDeletion = (e) => {
    e.preventDefault();
    setConfirmingDeletion(true);
  };

  const closeModal = () => {
    setConfirmingDeletion(false);
  };

  const deleteItem = (e) => {
    e.preventDefault();
    destroy(route('admin.siswa.destroy', siswa.id_siswa), {
      onSuccess: () => closeModal(),
    });
  };

  const handleSaveKeamanan = (formData) => {
    router.post(route('admin.siswa.update.keamanan', siswa.id_siswa), formData, {
      preserveScroll: true,
      onSuccess: () => {
        setToast({ show: true, message: 'Data keamanan berhasil diperbarui!' });
      },
      onError: (errors) => {
        console.error(errors);
        setToast({
          show: true,
          message: 'Gagal memperbarui data, periksa kembali input Anda.',
        });
      },
    });
  };

  // ✅ FIX AVATAR: pakai siswa.foto_url dari backend (/storage-public/...)
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    siswa.nama_lengkap || 'User'
  )}&background=7c3aed&color=fff&size=256`;

  const [imgSrc, setImgSrc] = useState(siswa.foto_url || fallbackAvatar);

  useEffect(() => {
    setImgSrc(siswa.foto_url || fallbackAvatar);
  }, [siswa.foto_url, fallbackAvatar]);

  return (
    <AdminLayout user={auth.user} header={`Detail Siswa: ${siswa.nama_lengkap}`}>
      <Head title={`Detail ${siswa.nama_lengkap}`} />
      <ToastNotification
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={route('admin.siswa.index')}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Kembali ke Daftar Siswa
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detail Siswa</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 lg:sticky lg:top-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={imgSrc}
                  alt="Foto Profil"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                  onError={() => setImgSrc(fallbackAvatar)}
                />
                <div className="mt-4">
                  <h2 className="text-xl font-bold text-gray-800">{siswa.nama_lengkap}</h2>
                  <div className="mt-2">
                    <StatusBadge status={siswa.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    NIS: <span className="font-medium text-gray-700">{siswa.nis}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Kelas:{' '}
                    <span className="font-medium text-gray-700">
                      {siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : '-'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <button
                  title="Cetak Kartu"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                  type="button"
                >
                  <Printer size={16} /> Cetak
                </button>

                <Link
                  href={route('admin.siswa.edit', siswa.id_siswa)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-md text-sm hover:bg-yellow-100"
                >
                  <Edit size={16} /> Edit
                </Link>

                <button
                  title="Hapus Siswa"
                  onClick={confirmDeletion}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 rounded-md text-sm hover:bg-red-100"
                  type="button"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <div>
                  <strong>Tempat Lahir:</strong> {siswa.tempat_lahir || '-'}
                </div>
                <div>
                  <strong>NISN:</strong> {siswa.nisn || '-'}
                </div>
                <div>
                  <strong>Agama:</strong> {siswa.agama || '-'}
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="overflow-x-auto -mx-4 px-4 py-2">
                <div className="flex gap-2 min-w-max">
                  <TabButton active={activeTab === 'biodata'} onClick={() => setActiveTab('biodata')}>
                    <User size={14} /> Biodata
                  </TabButton>
                  <TabButton active={activeTab === 'wali'} onClick={() => setActiveTab('wali')}>
                    <Users size={14} /> Orang Tua/Wali
                  </TabButton>
                  <TabButton active={activeTab === 'absensi'} onClick={() => setActiveTab('absensi')}>
                    <Calendar size={14} /> Riwayat Absensi
                  </TabButton>
                  <TabButton active={activeTab === 'akademik'} onClick={() => setActiveTab('akademik')}>
                    <BookOpen size={14} /> Nilai & Akademik
                  </TabButton>
                  <TabButton active={activeTab === 'keamanan'} onClick={() => setActiveTab('keamanan')}>
                    <KeyRound size={14} /> Keamanan
                  </TabButton>
                </div>
              </nav>
            </div>

            <div className="mt-6 space-y-6">
              {activeTab === 'biodata' && <BiodataTab siswa={siswa} />}
              {activeTab === 'wali' && <ParentTab parents={orangTuaWali} />}
              {activeTab === 'absensi' && <AttendanceTab attendance={riwayatAbsensi} />}
              {activeTab === 'akademik' && (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                  Fitur Nilai & Akademik sedang dalam pengembangan.
                </div>
              )}
              {activeTab === 'keamanan' && <KeamananTab siswa={siswa} onSave={handleSaveKeamanan} />}
            </div>
          </section>
        </div>
      </div>

      <Modal show={confirmingDeletion} onClose={closeModal}>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Apakah Anda yakin?</h2>
          <p className="mt-1 text-sm text-gray-600">
            Data siswa: <strong>{siswa.nama_lengkap}</strong> akan dihapus secara permanen.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={deleteItem}
              type="button"
              disabled={processingDelete}
              className="ml-3 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {processingDelete ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
