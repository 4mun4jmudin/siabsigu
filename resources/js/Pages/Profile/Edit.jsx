import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            // Hapus navigasi dashboard: header hanya teks biasa, bukan link
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-blue-800 leading-tight">
                    Profil Saya
                </h2>
            }
        >
            <Head title="Profil" />

            <div className="py-10 bg-gradient-to-br from-blue-50 to-yellow-50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

                    {/* HEADER PROFIL */}
                    <div className="p-6 bg-blue-600 rounded-2xl shadow-lg flex items-center space-x-6 text-white">
                        <div className="relative">
                            <UserCircleIcon className="h-24 w-24 text-blue-100" />
                            <span className="absolute bottom-1 right-1 bg-yellow-400 text-blue-900 text-xs px-2 py-0.5 rounded-full shadow">
                                Aktif
                            </span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">{auth.user.name}</h2>
                            <p className="text-lg">{auth.user.email}</p>
                            <p className="mt-1 text-sm opacity-90">
                                Perbarui informasi profil, email, dan kata sandi Anda di sini.
                            </p>
                        </div>
                    </div>

                    {/* GRID FORM */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Informasi Profil */}
                        <div className="p-6 bg-white rounded-xl shadow-md border border-blue-100">
                            <h3 className="text-lg font-semibold text-blue-700 mb-4">
                                Informasi Profil
                            </h3>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        {/* Ubah Password */}
                        <div className="p-6 bg-white rounded-xl shadow-md border border-blue-100">
                            <h3 className="text-lg font-semibold text-blue-700 mb-4">
                                Ubah Kata Sandi
                            </h3>
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>

                    {/* Hapus Akun */}
                    <div className="p-6 bg-white rounded-xl shadow-md border border-red-200">
                        <h3 className="text-lg font-semibold text-red-600 mb-4">
                            Hapus Akun
                        </h3>
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
