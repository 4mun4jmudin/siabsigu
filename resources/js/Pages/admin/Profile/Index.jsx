import { useState, useRef } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Transition } from '@headlessui/react';
import { toast } from '@/utils/toast';
import {
    UserCircleIcon,
    EnvelopeIcon,
    KeyIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function ProfileIndex({ status }) {
    const user = usePage().props.auth.user;

    // Form Profil Dasar
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        nama_lengkap: user?.nama_lengkap || user?.name || '',
        email: user?.email || '',
    });

    // Form Password Dasar
    const { data: pwdData, setData: setPwdData, put: putPwd, errors: pwdErrors, processing: pwdProcessing, recentlySuccessful: pwdRecentlySuccessful, reset: resetPwd } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submitProfile = (e) => {
        e.preventDefault();
        patch(route('admin.profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Informasi profil berhasil diperbarui!');
            },
            onError: () => {
                toast.error('Gagal memperbarui profil. Periksa form.');
            }
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        putPwd(route('admin.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                resetPwd();
                toast.success('Kata sandi berhasil diubah!');
            },
            onError: () => {
                if (pwdErrors.password) {
                    resetPwd('password', 'password_confirmation');
                }
                if (pwdErrors.current_password) {
                    resetPwd('current_password');
                }
                toast.error('Gagal mengubah kata sandi. Periksa form.');
            },
        });
    };

    return (
        <AdminLayout header="Pengaturan Profil">
            <Head title="Profil Saya" />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Profil Cantik */}
                <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-indigo-50 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Hiasan Latar Belakang */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 bg-gradient-to-br from-indigo-100/50 to-purple-100/30 w-64 h-64 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 bg-gradient-to-tr from-blue-100/40 to-indigo-50/50 w-56 h-56 rounded-full blur-2xl" />

                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 bg-indigo-200 rounded-full blur-md opacity-30 group-hover:opacity-50 transition duration-500"></div>
                        <div className="h-32 w-32 rounded-full ring-4 ring-white shadow-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-5xl font-bold uppercase relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            {(user?.nama_lengkap || user?.name || 'A').charAt(0)}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white h-8 w-8 rounded-full z-20 flex items-center justify-center animate-bounce shadow-md">
                            <SparklesIcon className="w-4 h-4 text-emerald-50" />
                        </div>
                    </div>

                    <div className="relative z-10 text-center md:text-left flex-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm mb-3">
                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Administrator Sistem
                        </span>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-2">
                            {user?.nama_lengkap || user?.name || 'Admin'}
                        </h1>
                        <p className="text-gray-500 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                            <EnvelopeIcon className="w-5 h-5 opacity-70" /> {user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Kartu Informasi Profil */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <UserCircleIcon className="w-6 h-6 text-indigo-500" /> Informasi Pribadi
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Perbarui nama dan alamat email akun Anda.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 flex-1">
                            {status === 'profile-updated' && (
                                <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center gap-2 border border-emerald-100">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                                    Profil Anda telah berhasil diperbarui.
                                </div>
                            )}

                            <form onSubmit={submitProfile} className="space-y-5">
                                <div>
                                    <label htmlFor="nama_lengkap" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="nama_lengkap"
                                            className="block w-full rounded-xl border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 placeholder:text-gray-400 bg-gray-50/50 transition-shadow"
                                            value={data.nama_lengkap}
                                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                                            required
                                            autoComplete="name"
                                            placeholder="Masukkan nama lengkap Anda"
                                        />
                                    </div>
                                    {errors.nama_lengkap && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.nama_lengkap}</p>}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            className="block w-full rounded-xl border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 placeholder:text-gray-400 bg-gray-50/50 transition-shadow"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoComplete="username"
                                            placeholder="contoh@sekolah.sch.id"
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.email}</p>}
                                </div>

                                <div className="pt-4 flex items-center gap-4 border-t border-gray-100">
                                    <button
                                        disabled={processing}
                                        type="submit"
                                        className="inline-flex justify-center items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-emerald-600 font-medium">Tersimpan.</p>
                                    </Transition>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Kartu Ubah Kata Sandi */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <KeyIcon className="w-6 h-6 text-indigo-500" /> Ubah Kata Sandi
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Pastikan akun Anda menggunakan sandi panjang dan acak.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 flex-1">
                            <form onSubmit={submitPassword} className="space-y-5">
                                {/* Current Password */}
                                <div>
                                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Kata Sandi Saat Ini
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <input
                                            id="current_password"
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="block w-full rounded-xl border-0 py-2.5 px-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50"
                                            value={pwdData.current_password}
                                            onChange={(e) => setPwdData('current_password', e.target.value)}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {pwdErrors.current_password && <p className="mt-1.5 text-sm text-red-600 font-medium">{pwdErrors.current_password}</p>}
                                </div>

                                {/* New Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Kata Sandi Baru
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <input
                                            id="password"
                                            type={showNewPassword ? "text" : "password"}
                                            className="block w-full rounded-xl border-0 py-2.5 px-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50"
                                            value={pwdData.password}
                                            onChange={(e) => setPwdData('password', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {pwdErrors.password && <p className="mt-1.5 text-sm text-red-600 font-medium">{pwdErrors.password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                        Konfirmasi Kata Sandi Baru
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="block w-full rounded-xl border-0 py-2.5 px-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50/50"
                                            value={pwdData.password_confirmation}
                                            onChange={(e) => setPwdData('password_confirmation', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {pwdErrors.password_confirmation && <p className="mt-1.5 text-sm text-red-600 font-medium">{pwdErrors.password_confirmation}</p>}
                                </div>

                                <div className="pt-4 flex items-center gap-4 border-t border-gray-100">
                                    <button
                                        disabled={pwdProcessing}
                                        type="submit"
                                        className="inline-flex justify-center items-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                    >
                                        {pwdProcessing ? 'Menyimpan...' : 'Perbarui Sandi'}
                                    </button>

                                    <Transition
                                        show={pwdRecentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-emerald-600 font-medium">Sandi diperbarui.</p>
                                    </Transition>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
