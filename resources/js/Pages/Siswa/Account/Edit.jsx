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
  UserCircleIcon, 
  ShieldCheckIcon,
  CloudArrowUpIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'; // Menambahkan EyeIcon & EyeSlashIcon
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function Edit({ user, siswa }) {
  const { flash } = usePage().props;
  const [activeTab, setActiveTab] = useState('profile');

  // State untuk toggle visibility password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        // Reset visibility saat sukses
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
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
    <SiswaLayout header="Pengaturan Akun">
      <Head title="Manajemen Akun" />

      <div className="min-h-screen bg-slate-50/50 pb-20">
        
        {/* HERO HEADER */}
        <div className="bg-slate-900 pt-8 pb-24 px-4 sm:px-6 lg:px-8 shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#bae6fd 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur"></div>
                    <img
                        src={fotoUrl}
                        alt="Foto profil"
                        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-slate-900 bg-slate-800 shadow-2xl"
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatarUrl; }}
                    />
                    <button 
                        onClick={triggerFileInput}
                        className="absolute bottom-0 right-0 bg-white text-slate-900 p-2 rounded-full shadow-lg hover:bg-sky-50 transition border border-slate-200"
                        title="Ganti Foto"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="text-center md:text-left text-white">
                    <h1 className="text-3xl font-bold tracking-tight">{siswa.nama_lengkap}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm text-slate-300">
                        <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                            <UserCircleIcon className="w-4 h-4 text-sky-400"/>
                            {user.username}
                        </span>
                        {siswa.kelas && (
                            <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                {siswa.kelas.tingkat} {siswa.kelas.jurusan}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          
          {/* FLASH MESSAGE */}
          {flash?.success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 shadow-sm flex items-center gap-3 animate-fade-in-up">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
              {flash.success}
            </div>
          )}

          {/* TAB NAVIGATION */}
          <div className="flex space-x-1 rounded-xl bg-slate-200/80 p-1 mb-8 shadow-inner max-w-md mx-auto md:mx-0 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full rounded-lg py-2.5 text-sm font-bold leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-white text-sky-700 shadow'
                  : 'text-slate-600 hover:bg-white/[0.5] hover:text-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCircleIcon className="w-5 h-5" />
                Data Pribadi
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full rounded-lg py-2.5 text-sm font-bold leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                activeTab === 'security'
                  ? 'bg-white text-sky-700 shadow'
                  : 'text-slate-600 hover:bg-white/[0.5] hover:text-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                Keamanan
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT CONTENT (FORMS) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* TAB: PROFILE */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Edit Informasi Pribadi</h3>
                            <p className="text-sm text-slate-500 mt-1">Perbarui detail profil dan informasi kontak Anda.</p>
                        </div>
                        
                        <form onSubmit={submitProfile} className="p-6 md:p-8 space-y-6">
                            {/* Upload Area */}
                            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 transition-colors cursor-pointer group"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={triggerFileInput}
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3 group-hover:bg-white group-hover:text-sky-500 group-hover:shadow-sm transition-all">
                                        <CloudArrowUpIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">
                                        {selectedFile ? <span className="text-sky-600">{selectedFile.name}</span> : <span>Klik untuk upload atau drag & drop</span>}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF max 2MB</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {profileErrors.foto_profil && (
                                    <p className="text-xs text-rose-500 text-center mt-2">{profileErrors.foto_profil}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <InputLabel value="Nama Lengkap" className="text-slate-600 mb-1.5" />
                                    <TextInput
                                        className="w-full"
                                        value={profileData.nama_lengkap}
                                        onChange={(e) => setProfileData('nama_lengkap', e.target.value)}
                                        placeholder="Nama lengkap sesuai rapor"
                                    />
                                    <InputError message={profileErrors.nama_lengkap} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value="Nama Panggilan" className="text-slate-600 mb-1.5" />
                                    <TextInput
                                        className="w-full"
                                        value={profileData.nama_panggilan}
                                        onChange={(e) => setProfileData('nama_panggilan', e.target.value)}
                                        placeholder="Panggilan akrab"
                                    />
                                    <InputError message={profileErrors.nama_panggilan} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value="Username" className="text-slate-600 mb-1.5" />
                                    <TextInput
                                        className="w-full bg-slate-50 text-slate-500 cursor-not-allowed"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData('username', e.target.value)}
                                        disabled
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">*Username tidak dapat diubah sembarangan.</p>
                                    <InputError message={profileErrors.username} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value="Tempat Lahir" className="text-slate-600 mb-1.5" />
                                    <TextInput
                                        className="w-full"
                                        value={profileData.tempat_lahir}
                                        onChange={(e) => setProfileData('tempat_lahir', e.target.value)}
                                    />
                                    <InputError message={profileErrors.tempat_lahir} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value="Tanggal Lahir" className="text-slate-600 mb-1.5" />
                                    <TextInput
                                        type="date"
                                        className="w-full"
                                        value={profileData.tanggal_lahir}
                                        onChange={(e) => setProfileData('tanggal_lahir', e.target.value)}
                                    />
                                    <InputError message={profileErrors.tanggal_lahir} className="mt-1" />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <InputLabel value="Alamat Lengkap" className="text-slate-600 mb-1.5" />
                                    <textarea
                                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm py-3 px-4"
                                        rows="3"
                                        value={profileData.alamat_lengkap}
                                        onChange={(e) => setProfileData('alamat_lengkap', e.target.value)}
                                        placeholder="Alamat tempat tinggal saat ini..."
                                    />
                                    <InputError message={profileErrors.alamat_lengkap} className="mt-1" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                                <Transition
                                    show={profileSuccess}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                >
                                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircleIcon className="w-4 h-4"/> Tersimpan
                                    </p>
                                </Transition>
                                <PrimaryButton disabled={profileProcessing} className="px-6 py-2.5 rounded-lg text-sm bg-sky-600 hover:bg-sky-700 focus:ring-sky-500">
                                    {profileProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Ubah Kata Sandi</h3>
                            <p className="text-sm text-slate-500 mt-1">Pastikan menggunakan password yang kuat dan aman.</p>
                        </div>

                        <form onSubmit={updatePassword} className="p-6 md:p-8 space-y-6">
                            {/* Current Password Field */}
                            <div>
                                <InputLabel value="Password Saat Ini" className="text-slate-600 mb-1.5" />
                                <div className="relative">
                                    <TextInput
                                        type={showCurrentPassword ? "text" : "password"}
                                        className="w-full pr-10"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData('current_password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={passwordErrors.current_password} className="mt-1" />
                            </div>

                            <div className="pt-2 border-t border-slate-100"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* New Password Field */}
                                <div>
                                    <InputLabel value="Password Baru" className="text-slate-600 mb-1.5" />
                                    <div className="relative">
                                        <TextInput
                                            type={showNewPassword ? "text" : "password"}
                                            className="w-full pr-10"
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData('password', e.target.value)}
                                            placeholder="Min. 8 karakter"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={passwordErrors.password} className="mt-1" />
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <InputLabel value="Konfirmasi Password Baru" className="text-slate-600 mb-1.5" />
                                    <div className="relative">
                                        <TextInput
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full pr-10"
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                            placeholder="Ulangi password baru"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={passwordErrors.password_confirmation} className="mt-1" />
                                </div>
                            </div>

                            <div className="bg-sky-50 rounded-xl p-4 text-xs text-sky-800 border border-sky-100">
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Gunakan minimal 8 karakter.</li>
                                    <li>Kombinasikan huruf besar, huruf kecil, dan angka.</li>
                                    <li>Hindari menggunakan tanggal lahir sebagai password.</li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                                <Transition
                                    show={passwordSuccess}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                >
                                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircleIcon className="w-4 h-4"/> Password Diperbarui
                                    </p>
                                </Transition>
                                <PrimaryButton disabled={passwordProcessing} className="px-6 py-2.5 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
                                    {passwordProcessing ? 'Memproses...' : 'Ubah Password'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* RIGHT CONTENT (SIDEBAR INFO) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* INFO CARD 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <ShieldCheckIcon className="w-6 h-6 text-sky-400"/>
                        </div>
                        <h4 className="font-bold text-lg">Keamanan Data</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                        Data profil Anda terenkripsi dan tersimpan aman di server sekolah. Perubahan data diri akan langsung tersinkronisasi dengan sistem absensi harian.
                    </p>
                    <div className="text-xs bg-slate-800 rounded-lg p-3 border border-slate-700 text-slate-400">
                        <p className="mb-2 font-semibold text-slate-300">Tips Keamanan:</p>
                        <ul className="space-y-1.5">
                            <li className="flex gap-2"><span className="text-sky-500">•</span> Jangan bagikan password ke siapapun.</li>
                            <li className="flex gap-2"><span className="text-sky-500">•</span> Logout setelah menggunakan komputer umum.</li>
                        </ul>
                    </div>
                </div>

                {/* INFO CARD 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Tentang Foto Profil</h4>
                    <p className="text-sm text-slate-500 mb-4">
                        Foto profil digunakan untuk identifikasi visual oleh guru dan sistem keamanan sekolah.
                    </p>
                    <div className="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=Contoh&background=e2e8f0&color=64748b" className="w-10 h-10 rounded-full opacity-50" alt="sample"/>
                        <div className="text-xs text-slate-400">
                            Gunakan foto formal/semi-formal dengan pencahayaan yang baik.
                        </div>
                    </div>
                </div>

            </div>

          </div>
        </div>
      </div>
    </SiswaLayout>
  );
}