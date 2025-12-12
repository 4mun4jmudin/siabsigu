import React, { useState, useRef } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function EditPhoto({ user, siswa }) {
  const { flash } = usePage().props;

  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(
    siswa?.foto_profil_url || null
  );

  const { data, setData, post, processing, errors } = useForm({
    foto_profil: null,
  });

  const handleFile = (file) => {
    if (!file) return;

    setData('foto_profil', file);

    // Preview lokal
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('siswa.akun.update-foto'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  const currentPhotoUrl =
    previewUrl ||
    siswa?.foto_profil_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      siswa?.nama_lengkap || user?.nama_lengkap || 'Siswa'
    )}&background=0ea5e9&color=fff`;

  return (
    <SiswaLayout header="Ubah Foto Profil">
      <Head title="Ubah Foto Profil" />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href={route('siswa.akun.edit')}
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Kembali ke Pengaturan Akun
          </Link>
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-6">
          {/* Foto saat ini */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-32 h-32 rounded-full border-4 border-sky-500 overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src={currentPhotoUrl}
                alt="Foto saat ini"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    siswa?.nama_lengkap || user?.nama_lengkap || 'Siswa'
                  )}&background=0ea5e9&color=fff`;
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {siswa?.nama_lengkap || user?.nama_lengkap}
              </p>
              <p className="text-xs text-slate-500">
                Foto profil akan ditampilkan di dashboard dan halaman lainnya.
              </p>
            </div>
          </div>

          {/* Pesan flash */}
          {flash?.success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
              {flash.success}
            </div>
          )}
          {flash?.error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
              {flash.error}
            </div>
          )}

          {/* Form upload */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <InputLabel value="Pilih Foto Baru" />

              <div
                className={`mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  data.foto_profil
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {data.foto_profil ? (
                  <p className="text-xs text-emerald-700 truncate max-w-full">
                    {data.foto_profil.name}
                  </p>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <PhotoIcon className="h-6 w-6 text-slate-500" />
                    <span className="text-xs text-slate-700">
                      Seret foto ke sini atau klik untuk memilih
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Maksimal 2MB, format: JPG, JPEG, PNG, WEBP, GIF
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleChange}
                />
              </div>

              <InputError message={errors.foto_profil} className="mt-1" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <PrimaryButton disabled={processing}>
                {processing ? 'Menyimpan...' : 'Simpan Foto'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </SiswaLayout>
  );
}
