import React, { useState, useRef } from 'react';
import { Link, Head, usePage, useForm } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import {
  KeyIcon,
  PencilSquareIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';

export default function Edit({ user, siswa }) {
  const { flash } = usePage().props;
  const [activeTab, setActiveTab] = useState('profile');

  // Local state to track the selected file so we can display its name
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Form data for profile updates
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

  // Form data for password updates
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

  // Submit handlers
  const submitProfile = (e) => {
    e.preventDefault();
    // Use the correct route name as defined in the routes file
    postProfile(route('siswa.akun.update-profile'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

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

  // Handlers for drag‑and‑drop file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData('foto_profil', file);
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setProfileData('foto_profil', file);
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Determine the current photo URL for display
  const fotoUrl = siswa.foto_profil_url
    ? siswa.foto_profil_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.nama_lengkap || 'Siswa')}&background=0b6fb6&color=fff`;


  return (
    <SiswaLayout header="Akun Saya">
      <Head title="Manajemen Akun" />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ---------------- HEADER PROFIL ---------------- */}
        <div className="flex flex-col sm:flex-row items-center p-6 rounded-3xl shadow-xl mb-10 text-white bg-gradient-to-r from-sky-600 to-sky-800">
          <img
            src={fotoUrl}
            className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-lg"
            alt="Foto profil"
          />
          <div className="mt-4 sm:mt-0 sm:ml-6">
            <h1 className="text-3xl font-bold">{siswa.nama_lengkap}</h1>
            <p className="text-sm text-blue-100">
              Kelola data pribadi dan keamanan akun Anda.
            </p>
            {siswa.kelas && (
              <p className="text-xs mt-2 text-blue-200">
                Kelas: {siswa.kelas.tingkat} {siswa.kelas.jurusan}
              </p>
            )}
          </div>
        </div>

        {/* ---------------- TAB NAVIGASI ---------------- */}
        <div className="flex gap-3 mb-6 border-b">
          <button
            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'profile' ? 'border-b-4 border-sky-600 text-sky-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            Data Pribadi
          </button>

          <button
            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'security' ? 'border-b-4 border-sky-600 text-sky-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('security')}
          >
            Keamanan Akun
          </button>
        </div>

        {/* ---------------- TAB: DATA PRIBADI ---------------- */}
        {activeTab === 'profile' && (
          <section className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 mb-10">
            <div className="flex items-center gap-3 mb-5">
              <PencilSquareIcon className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-semibold text-gray-800">Data Pribadi</h2>
            </div>

            <form onSubmit={submitProfile} className="space-y-5">
              {/* ------------ FORM FIELDS ------------ */}
              <div>
                <InputLabel value="Nama Lengkap" />
                <TextInput
                  className="mt-1 w-full"
                  value={profileData.nama_lengkap}
                  onChange={(e) => setProfileData('nama_lengkap', e.target.value)}
                />
                <InputError message={profileErrors.nama_lengkap} />
              </div>

              <div>
                <InputLabel value="Nama Panggilan" />
                <TextInput
                  className="mt-1 w-full"
                  value={profileData.nama_panggilan}
                  onChange={(e) => setProfileData('nama_panggilan', e.target.value)}
                />
                <InputError message={profileErrors.nama_panggilan} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <InputLabel value="Tempat Lahir" />
                  <TextInput
                    className="mt-1 w-full"
                    value={profileData.tempat_lahir}
                    onChange={(e) => setProfileData('tempat_lahir', e.target.value)}
                  />
                </div>

                <div>
                  <InputLabel value="Tanggal Lahir" />
                  <TextInput
                    type="date"
                    className="mt-1 w-full"
                    value={profileData.tanggal_lahir}
                    onChange={(e) => setProfileData('tanggal_lahir', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <InputLabel value="Alamat Lengkap" />
                <textarea
                  className="mt-1 w-full rounded-md border-gray-300 focus:ring-sky-500"
                  rows="3"
                  value={profileData.alamat_lengkap}
                  onChange={(e) => setProfileData('alamat_lengkap', e.target.value)}
                />
              </div>

              <div>
                <InputLabel value="Username" />
                <TextInput
                  className="mt-1 w-full"
                  value={profileData.username}
                  onChange={(e) => setProfileData('username', e.target.value)}
                />
                <InputError message={profileErrors.username} />
              </div>

              {/* ------------ FOTO PROFIL (DRAG & DROP) ------------ */}
              <div>
                <InputLabel value="Foto Profil" />
                <div className="flex items-center space-x-4 mt-2">
                  <img src={fotoUrl} className="h-24 w-24 rounded-full object-cover ring-2 ring-sky-600" alt="Foto profil" />
                  <Link href={route('siswa.akun.edit-foto')} className="text-sm text-sky-600 hover:underline">
                    Ubah Foto
                  </Link>
                </div>
              </div>


              {/* ------------ ACTION ------------ */}
              <div className="flex items-center gap-4 pt-2">
                <PrimaryButton disabled={profileProcessing}>Simpan Perubahan</PrimaryButton>
                <Transition show={profileSuccess} enter="transition ease-out duration-200" leave="transition ease-in duration-100">
                  <p className="text-green-600 text-sm">Perubahan disimpan.</p>
                </Transition>
              </div>
            </form>
          </section>
        )}

        {/* ---------------- TAB: KEAMANAN AKUN ---------------- */}
        {activeTab === 'security' && (
          <section className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <KeyIcon className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-semibold text-gray-800">Keamanan Akun</h2>
            </div>

            <form onSubmit={updatePassword} className="space-y-5">
              <div>
                <InputLabel value="Password Saat Ini" />
                <TextInput
                  type="password"
                  className="mt-1 w-full"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData('current_password', e.target.value)}
                />
                <InputError message={passwordErrors.current_password} />
              </div>

              <div>
                <InputLabel value="Password Baru" />
                <TextInput
                  type="password"
                  className="mt-1 w-full"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData('password', e.target.value)}
                />
                <InputError message={passwordErrors.password} />
              </div>

              <div>
                <InputLabel value="Konfirmasi Password" />
                <TextInput
                  type="password"
                  className="mt-1 w-full"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <PrimaryButton disabled={passwordProcessing}>Ubah Password</PrimaryButton>
                <Transition show={passwordSuccess} enter="transition ease-out duration-200" leave="transition ease-in duration-100">
                  <p className="text-green-600 text-sm">Password berhasil diperbarui.</p>
                </Transition>
              </div>
            </form>
          </section>
        )}
      </div>
    </SiswaLayout>
  );
}