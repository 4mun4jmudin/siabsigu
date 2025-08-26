import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';

// NOTE: This file contains both the Create page and the GuruForm component
// You may split GuruForm into Partials/GuruForm.jsx if you prefer.

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function Create({ auth, users = [] }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    id_guru: '',
    nama_lengkap: '',
    nip: '',
    jenis_kelamin: 'Laki-laki',
    status: 'Aktif',
    id_pengguna: '',
    foto_profil: null,
    barcode_id: '',
    sidik_jari_template: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.guru.store'));
  };

  // helper: generate simple barcode id
  const generateBarcode = () => {
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    setData('barcode_id', `G${rand}`);
  };

  // clear form after success (optional) - depends on backend response hooks
  useEffect(() => {
    return () => {
      // revoke object URLs if any (GuruForm handles its own cleanup)
    };
  }, []);

  return (
    <AdminLayout user={auth.user} header="Tambah Guru">
      <Head title="Tambah Guru" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-white shadow sm:rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tambah Guru</h2>
              <p className="mt-1 text-sm text-gray-500">Masukkan data guru baru. Field bertanda * wajib diisi.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={route('admin.guru.index')} className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                <ArrowLeftIcon className="h-4 w-4" />
                Kembali
              </Link>
              <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                {processing ? <><Spinner /> <span> Menyimpan...</span></> : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <GuruForm data={data} setData={setData} errors={errors} users={users} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm">Scroll ke Atas</button>
          <Link href={route('admin.guru.index')} className="px-4 py-2 rounded-md bg-gray-200 text-sm">Batal</Link>
          <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm">{processing ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </AdminLayout>
  );
}

function GuruForm({ data, setData, errors, users = [], guru = null }) {
  const [preview, setPreview] = useState(guru?.foto_profil ? `/storage/${guru.foto_profil}` : null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setData('foto_profil', file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  useEffect(() => {
    return () => {
      // revoke preview URL to free memory
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const removePhoto = () => {
    setData('foto_profil', null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = null;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // tiny visual feedback could be added
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left: photo + attendance */}
      <div className="md:col-span-1 space-y-6">
        <div className="p-4 border border-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700">Foto Profil</h3>
          <p className="mt-1 text-xs text-gray-500">Seret & lepas gambar atau klik untuk memilih. Ukuran maksimal 2MB.</p>

          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`mt-4 relative rounded-md border-2 ${dragActive ? 'border-blue-300 bg-blue-50' : 'border-dashed border-gray-200'} p-4 flex flex-col items-center justify-center`}
            style={{ minHeight: 180 }}
          >
            {preview ? (
              <div className="relative w-40 h-40 rounded-full overflow-hidden shadow">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={removePhoto} className="absolute top-1 right-1 bg-white p-1 rounded-full shadow text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <PhotoIcon className="h-10 w-10 mx-auto" />
                <p className="mt-2 text-sm">Tarik gambar ke sini atau</p>
                <label htmlFor="foto_profil" className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm cursor-pointer">
                  <span>Pilih File</span>
                </label>
              </div>
            )}

            <input ref={inputRef} id="foto_profil" name="foto_profil" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            {errors.foto_profil && <p className="text-red-500 text-xs mt-2">{errors.foto_profil}</p>}
          </div>
        </div>

        <div className="p-4 border border-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700">Data Absensi</h3>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600">Barcode ID</label>
            <div className="mt-1 flex gap-2">
              <input type="text" value={data.barcode_id || ''} onChange={(e) => setData('barcode_id', e.target.value)} className="flex-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              <button type="button" onClick={() => { setData('barcode_id', `G${Math.floor(100000 + Math.random()*900000)}`); }} className="px-3 py-2 bg-gray-50 border rounded-md text-sm">Generate</button>
              <button type="button" onClick={() => copyToClipboard(data.barcode_id || '')} className="px-3 py-2 bg-gray-50 border rounded-md text-sm">Copy</button>
            </div>
            {errors.barcode_id && <p className="text-red-500 text-xs mt-1">{errors.barcode_id}</p>}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600">Template Sidik Jari</label>
            <textarea value={data.sidik_jari_template || ''} onChange={(e) => setData('sidik_jari_template', e.target.value)} rows={4} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm"></textarea>
            <p className="mt-1 text-xs text-gray-500">Biasanya diisi otomatis oleh perangkat pemindai. Opsional.</p>
            {errors.sidik_jari_template && <p className="text-red-500 text-xs mt-1">{errors.sidik_jari_template}</p>}
          </div>
        </div>
      </div>

      {/* Right: main details */}
      <div className="md:col-span-2">
        <div className="p-4 border border-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Informasi Utama</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">ID Guru <span className="text-red-500">*</span></label>
              <input type="text" value={data.id_guru} onChange={(e) => setData('id_guru', e.target.value)} disabled={!!guru} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm disabled:bg-gray-50" />
              {errors.id_guru && <p className="text-red-500 text-xs mt-1">{errors.id_guru}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">NIP</label>
              <input type="text" value={data.nip || ''} onChange={(e) => setData('nip', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" value={data.nama_lengkap} onChange={(e) => setData('nama_lengkap', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
              {errors.nama_lengkap && <p className="text-red-500 text-xs mt-1">{errors.nama_lengkap}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select value={data.jenis_kelamin} onChange={(e) => setData('jenis_kelamin', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              {errors.jenis_kelamin && <p className="text-red-500 text-xs mt-1">{errors.jenis_kelamin}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600">Status <span className="text-red-500">*</span></label>
              <div className="mt-1 inline-flex bg-gray-50 rounded-md p-1">
                {['Aktif', 'Tidak Aktif', 'Pensiun'].map(s => (
                  <button key={s} type="button" onClick={() => setData('status', s)} className={`px-3 py-1 text-sm rounded-md ${data.status === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600">Hubungkan Akun User</label>
              <select value={data.id_pengguna || ''} onChange={(e) => setData('id_pengguna', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
                <option value="">Tidak terhubung</option>
                {users.map(u => (
                  <option key={u.id_pengguna} value={u.id_pengguna}>{u.username}{u.nama_lengkap ? ` - ${u.nama_lengkap}` : ''}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Menghubungkan akun memungkinkan guru untuk login ke sistem.</p>
              {errors.id_pengguna && <p className="text-red-500 text-xs mt-1">{errors.id_pengguna}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
