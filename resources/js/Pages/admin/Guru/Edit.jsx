// resources/js/Pages/admin/Guru/Edit.jsx

import React, { useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import GuruForm from './Partials/GuruForm'; // pastikan partial mendukung prop `guru`

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function Edit({ auth, guru, users = [] }) {
  const { data, setData, post, processing, errors } = useForm({
    _method: 'PUT',
    id_guru: guru.id_guru || '',
    nama_lengkap: guru.nama_lengkap || '',
    nip: guru.nip || '',
    jenis_kelamin: guru.jenis_kelamin || 'Laki-laki',
    status: guru.status || 'Aktif',
    id_pengguna: guru.id_pengguna || '',
    foto_profil: null, // new file will replace existing; partial handles preview from guru
    barcode_id: guru.barcode_id || '',
    sidik_jari_template: guru.sidik_jari_template || '',
    // optional flag: backend can check this to delete existing foto if set to '1'
    remove_foto: '0',
  });

  useEffect(() => {
    // jika ingin inisialisasi khusus di client side bisa ditempatkan di sini
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // forceFormData: true agar Inertia mengirim FormData (file upload)
    post(route('admin.guru.update', guru.id_guru), {
      forceFormData: true,
    });
  };

  // helper quick-generate barcode (UI convenience)
  const generateBarcode = () => {
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    setData('barcode_id', `G${rand}`);
  };

  // If frontend wants to mark existing foto for deletion:
  const markRemoveFoto = () => {
    // set remove flag so backend can delete old file even if no new file uploaded
    setData('remove_foto', '1');
    setData('foto_profil', null);
  };

  return (
    <AdminLayout user={auth.user} header={`Edit Guru: ${guru.nama_lengkap || ''}`}>
      <Head title={`Edit ${guru.nama_lengkap || ''}`} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-white shadow sm:rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Data Guru</h2>
              <p className="mt-1 text-sm text-gray-500">Perbarui data guru. Field bertanda * wajib diisi.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={route('admin.guru.index')} className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                <ArrowLeftIcon className="h-4 w-4" />
                Kembali
              </Link>

              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                {processing ? <><Spinner /> <span>Menyimpan...</span></> : 'Update'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            {/* Pass guru prop so partial can show existing foto preview and initial values */}
            <GuruForm
              data={data}
              setData={setData}
              errors={errors}
              users={users}
              guru={guru}
              // optional callbacks / helpers the partial can use (if implemented)
              markRemoveFoto={markRemoveFoto}
              generateBarcode={generateBarcode}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm">Scroll ke Atas</button>
          <Link href={route('admin.guru.index')} className="px-4 py-2 rounded-md bg-gray-200 text-sm">Batal</Link>
          <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm">{processing ? 'Menyimpan...' : 'Update'}</button>
        </div>
      </form>
    </AdminLayout>
  );
}
