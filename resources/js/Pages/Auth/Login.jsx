import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/solid'; // Mengganti EnvelopeIcon dengan UserIcon

// Ganti dengan path logo sekolah Anda.
// Simpan logo di folder public/images/
const logoUrl = '/images/logo-sekolah.png';

export default function Login({ status, canResetPassword }) {
    // 1. Mengubah state form dari 'email' menjadi 'username'
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '', // <-- Diubah
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-200 p-4"
            style={{
                backgroundImage: `url('https://i.ytimg.com/vi/E-VdemkhzXw/maxresdefault.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Head title="Log in" />

            {/* Card Login */}
            <div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6">

                {/* Header Card */}
                <div className="text-center">
                    <img
                        src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRl33BhpowHZZHfLJuzZrr3VVSMwe5t4evLmA&s'
                        alt="Logo Sekolah"
                        className="mx-auto h-20 w-auto mb-4"
                        onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
                    />
                    <div style={{display: 'none'}} className="bg-gray-200 h-20 w-20 rounded-full mx-auto flex items-center justify-center text-gray-500 font-bold text-lg">LOGO</div>

                    <h2 className="text-3xl font-bold text-gray-900">
                        Selamat Datang!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Login ke Sistem Absensi Guru & Siswa
                    </p>
                </div>

                {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                {/* Form */}
                <form onSubmit={submit} className="space-y-6">
                    {/* 2. Mengubah Input Field untuk Username */}
                    <div>
                        <InputLabel htmlFor="username" value="Username" className="font-bold text-gray-700" />
                        <div className="relative mt-2">
                            <UserIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                            <TextInput
                                id="username"
                                type="text"
                                name="username"
                                value={data.username}
                                className="block w-full pl-10"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="Masukkan username Anda"
                            />
                        </div>
                        {/* 3. Menampilkan error untuk 'username' */}
                        <InputError message={errors.username} className="mt-2" />
                    </div>

                    {/* Input Password (tidak berubah) */}
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" className="font-bold text-gray-700" />
                        <div className="relative mt-2">
                            <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full pl-10"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Masukkan password Anda"
                            />
                        </div>
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    {/* Opsi Remember Me & Lupa Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Lupa password?
                            </Link>
                        )}
                    </div>

                    {/* Tombol Login */}
                    <div>
                        <PrimaryButton className="w-full justify-center text-lg py-3" disabled={processing}>
                            {processing ? 'Memproses...' : 'Log In'}
                        </PrimaryButton>
                    </div>
                </form>

                 <p className="text-xs text-center text-gray-500">
                    © {new Date().getFullYear()} Nama Sekolah. All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
