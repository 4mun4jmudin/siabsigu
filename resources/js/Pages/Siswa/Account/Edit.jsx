import React, { useState, useRef } from 'react';
import { Link, Head, usePage, useForm } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import { KeyIcon, PencilSquareIcon, PhotoIcon } from '@heroicons/react/24/solid';

export default function Edit({ user, siswa }) {
  const { flash } = usePage().props;
  const [activeTab, setActiveTab] = useState('profile');

  // Local state for foto profil
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Form data untuk profil
  const {
    data: profileData,
    setData: setProfileData,
    errors: profileErrors,
    processing: profileProcessing,
    recentlySuccessful: profileSuccess,
    post: postProfile,
  } = useForm({
    nama_lengkap: siswa.nama_lengkap || '',
    nama_panggilan: siswa.nama_panggilan || '',
    tempat_lahir: siswa.tempat_lahir || '',
    tanggal_lahir: siswa.tanggal_lahir || '',
    alamat_lengkap: siswa.alamat_lengkap || '',
    username: user.username || '',
    foto_profil: null,
  });

  // Form data untuk password
  const {
    data: passwordData,
    setData: setPasswordData,
    errors: passwordErrors,
    processing: passwordProcessing,
    recentlySuccessful: passwordSuccess,
    post: postPassword,
  } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Submit profil
  const submitProfile = (e) => {
    e.preventDefault();
    postProfile(route('siswa.akun.update-profile'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  // Submit password
  const updatePassword = (e) => {
    e.preventDefault();
    postPassword(route('siswa.akun.update-password'), {
      preserveScroll: true,
      onSuccess: () => {
        setPasswordData({
          current_password: '',
          password: '',
          password_confirmation: '',
        });
      },
    });
  };

  // Handler foto profil
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileData('foto_profil', file);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setProfileData('foto_profil', file);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Foto profil saat ini
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    siswa.nama_lengkap || 'Siswa'
  )}&background=0b6fb6&color=fff`;

  const fotoUrl = previewUrl || siswa.foto_profil_url || fallbackAvatarUrl;

  return (
    <SiswaLayout header="Akun Saya">
      <Head title="Manajemen Akun" />

      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-sky-50 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* GLOBAL FLASH */}
          {flash?.success && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
              {flash.success}
            </div>
          )}

          {/* HEADER PROFILE */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 px-6 py-6 sm:px-8 sm:py-7 shadow-xl mb-8">
            <div className="absolute inset-y-0 right-0 opacity-20 pointer-events-none">
              <div className="h-full w-64 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]" />
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="shrink-0">
                <img
                  src={fotoUrl}
                  alt="Foto profil"
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-white/80 shadow-xl bg-white"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackAvatarUrl;
                  }}
                />
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {siswa.nama_lengkap}
                </h1>
                <p className="mt-1 text-sm text-sky-100">
                  Kelola identitas, data pribadi, dan keamanan akun dengan tenang. Kami
                  menjaga kerahasiaan data Anda.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  {siswa.kelas && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur border border-white/20">
                      <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                      {siswa.kelas.tingkat} {siswa.kelas.jurusan}
                    </span>
                  )}

                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur border border-white/20">
                    <span className="mr-1.5 text-sky-100/80">Username:</span>
                    <span className="font-semibold">{user.username}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAV */}
          <div className="mb-6">
            <div className="inline-flex items-center rounded-full bg-slate-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-sky-700'
                }`}
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>Data Pribadi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'security'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-sky-700'
                }`}
              >
                <KeyIcon className="h-4 w-4" />
                <span>Keamanan Akun</span>
              </button>
            </div>
          </div>

          {/* TAB: DATA PRIBADI */}
          {activeTab === 'profile' && (
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-6 mb-10">
              {/* FORM DATA PRIBADI */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <PencilSquareIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                        Data Pribadi
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pastikan data sesuai dengan identitas resmi sekolah.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={submitProfile} className="space-y-5">
                  <div>
                    <InputLabel value="Nama Lengkap" />
                    <TextInput
                      className="mt-1 block w-full"
                      value={profileData.nama_lengkap}
                      onChange={(e) =>
                        setProfileData('nama_lengkap', e.target.value)
                      }
                    />
                    <InputError message={profileErrors.nama_lengkap} />
                  </div>

                  <div>
                    <InputLabel value="Nama Panggilan" />
                    <TextInput
                      className="mt-1 block w-full"
                      value={profileData.nama_panggilan}
                      onChange={(e) =>
                        setProfileData('nama_panggilan', e.target.value)
                      }
                    />
                    <InputError message={profileErrors.nama_panggilan} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <InputLabel value="Tempat Lahir" />
                      <TextInput
                        className="mt-1 block w-full"
                        value={profileData.tempat_lahir}
                        onChange={(e) =>
                          setProfileData('tempat_lahir', e.target.value)
                        }
                      />
                      <InputError message={profileErrors.tempat_lahir} />
                    </div>

                    <div>
                      <InputLabel value="Tanggal Lahir" />
                      <TextInput
                        type="date"
                        className="mt-1 block w-full"
                        value={profileData.tanggal_lahir}
                        onChange={(e) =>
                          setProfileData('tanggal_lahir', e.target.value)
                        }
                      />
                      <InputError message={profileErrors.tanggal_lahir} />
                    </div>
                  </div>

                  <div>
                    <InputLabel value="Alamat Lengkap" />
                    <textarea
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                      rows="3"
                      value={profileData.alamat_lengkap}
                      onChange={(e) =>
                        setProfileData('alamat_lengkap', e.target.value)
                      }
                    />
                    <InputError message={profileErrors.alamat_lengkap} />
                  </div>

                  <div>
                    <InputLabel value="Username" />
                    <TextInput
                      className="mt-1 block w-full"
                      value={profileData.username}
                      onChange={(e) =>
                        setProfileData('username', e.target.value)
                      }
                    />
                    <InputError message={profileErrors.username} />
                  </div>

                  {/* FOTO PROFIL */}
                  <div>
                    <InputLabel value="Foto Profil" />
                    <div className="mt-2 flex gap-4 items-center">
                      <img
                        src={fotoUrl}
                        alt="Foto profil"
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-sky-500/80 shadow-md bg-white"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackAvatarUrl;
                        }}
                      />
                      <div className="flex-1">
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="group cursor-pointer rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-3 text-xs sm:text-sm text-slate-600 hover:border-sky-400 hover:bg-sky-50 transition"
                          onClick={triggerFileInput}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
                              <PhotoIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {selectedFile ? selectedFile.name : 'Tarik atau pilih foto baru'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Format: JPG, PNG, maks. 2 MB. Foto yang jelas
                                membantu keakuratan data presensi.
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            href={route('siswa.akun.edit-foto')}
                            className="text-xs text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            Pengaturan foto lebih lanjut
                          </Link>
                          {profileErrors.foto_profil && (
                            <p className="text-xs text-rose-600">
                              {profileErrors.foto_profil}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="flex items-center gap-4 pt-3">
                    <PrimaryButton disabled={profileProcessing}>
                      {profileProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </PrimaryButton>

                    <Transition
                      show={profileSuccess}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <p className="text-sm text-emerald-600">
                        Perubahan profil berhasil disimpan.
                      </p>
                    </Transition>
                  </div>
                </form>
              </div>

              {/* PANEL INFO KEBOLEHAN DATA */}
              <aside className="rounded-2xl bg-slate-900 text-slate-50 p-5 sm:p-6 shadow-lg">
                <h3 className="text-sm font-semibold tracking-wide text-sky-200 uppercase">
                  Integritas Data
                </h3>
                <p className="mt-2 text-sm text-slate-100/90">
                  Data yang Anda ubah terhubung langsung dengan sistem akademik
                  sekolah. Gunakan identitas asli dan pastikan seluruh informasi
                  sudah benar.
                </p>

                <ul className="mt-4 space-y-3 text-xs text-slate-200">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>
                      Perubahan tersimpan dengan aman di server sekolah dan hanya
                      dapat diakses oleh pihak berwenang.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>
                      Foto profil digunakan untuk mengurangi kesalahan identitas saat
                      presensi dan penilaian.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>
                      Jangan meminjamkan akun Anda kepada orang lain demi
                      keamanan data.
                    </span>
                  </li>
                </ul>
              </aside>
            </section>
          )}

          {/* TAB: KEAMANAN AKUN */}
          {activeTab === 'security' && (
            <section className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-6 mb-10">
              {/* FORM PASSWORD */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <KeyIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                        Keamanan Akun
                      </h2>
                      <p className="text-xs text-slate-500">
                        Ganti kata sandi Anda secara berkala untuk menjaga akun
                        tetap aman.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={updatePassword} className="space-y-5">
                  <div>
                    <InputLabel value="Password Saat Ini" />
                    <TextInput
                      type="password"
                      className="mt-1 block w-full"
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData('current_password', e.target.value)
                      }
                    />
                    <InputError message={passwordErrors.current_password} />
                  </div>

                  <div>
                    <InputLabel value="Password Baru" />
                    <TextInput
                      type="password"
                      className="mt-1 block w-full"
                      value={passwordData.password}
                      onChange={(e) =>
                        setPasswordData('password', e.target.value)
                      }
                    />
                    <InputError message={passwordErrors.password} />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Gunakan kombinasi huruf besar, kecil, angka, dan simbol.
                      Minimal 8 karakter.
                    </p>
                  </div>

                  <div>
                    <InputLabel value="Konfirmasi Password Baru" />
                    <TextInput
                      type="password"
                      className="mt-1 block w-full"
                      value={passwordData.password_confirmation}
                      onChange={(e) =>
                        setPasswordData('password_confirmation', e.target.value)
                      }
                    />
                    <InputError message={passwordErrors.password_confirmation} />
                  </div>

                  <div className="flex items-center gap-4 pt-3">
                    <PrimaryButton disabled={passwordProcessing}>
                      {passwordProcessing ? 'Memproses...' : 'Ubah Password'}
                    </PrimaryButton>

                    <Transition
                      show={passwordSuccess}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <p className="text-sm text-emerald-600">
                        Password berhasil diperbarui.
                      </p>
                    </Transition>
                  </div>
                </form>
              </div>

              {/* PANEL EDUKASI KEAMANAN */}
              <aside className="rounded-2xl bg-slate-900 text-slate-50 p-5 sm:p-6 shadow-lg">
                <h3 className="text-sm font-semibold tracking-wide text-sky-200 uppercase">
                  Kepercayaan & Privasi
                </h3>
                <p className="mt-2 text-sm text-slate-100/90">
                  Password Anda disimpan dengan aman menggunakan standar enkripsi
                  modern. Pihak sekolah tidak dapat melihat isi password Anda.
                </p>

                <ul className="mt-4 space-y-3 text-xs text-slate-200">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>
                      Jangan bagikan password kepada siapa pun, termasuk teman
                      sekelas atau grup chat.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>
                      Hindari menggunakan password yang sama dengan media sosial
                      atau akun lain.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>
                      Selalu logout dari perangkat umum (warnet, laboratorium,
                      perangkat pinjaman).
                    </span>
                  </li>
                </ul>
              </aside>
            </section>
          )}
        </div>
      </div>
    </SiswaLayout>
  );
}
