import { useEffect, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/solid';

export default function SiswaLogin({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    // local state untuk UI
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    // simple password strength (very basic)
    useEffect(() => {
        const p = data.password || '';
        let score = 0;
        if (p.length >= 6) score += 1;
        if (/[A-Z]/.test(p)) score += 1;
        if (/[0-9]/.test(p)) score += 1;
        if (/[^A-Za-z0-9]/.test(p)) score += 1;
        setPasswordStrength(score); // 0..4
    }, [data.password]);

    const submit = (e) => {
        e.preventDefault();
        // submit ke rute login siswa
        post(route('login.siswa.store'));
    };

    return (
        <>
            <Head title="Log in Siswa" />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-6">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* LEFT: Branding / Illustration */}
                    <div className="hidden lg:flex flex-col justify-center space-y-6 rounded-3xl p-8 bg-[linear-gradient(135deg,#0ea5e9_0%,#6366f1_100%)] text-white shadow-2xl overflow-hidden">
                        <div className="transform -translate-x-2">
                            <h1 className="text-4xl font-extrabold leading-tight">Portal Absensi<br/>Siswa</h1>
                            <p className="mt-2 text-sky-100/90 text-sm max-w-md">Masuk menggunakan NIS untuk melakukan absensi harian. Aman, cepat, dan terintegrasi dengan sistem sekolah.</p>
                        </div>

                        <div className="mt-4 flex gap-4">
                            <div className="bg-white/10 p-4 rounded-lg shadow-inner backdrop-blur-sm">
                                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-white/90" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L4 6v6c0 5.25 3.5 9 8 10 4.5-1 8-4.75 8-10V6l-8-4z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 10h8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold">Siap untuk Absensi</h4>
                                <p className="text-xs mt-1 text-white/80">Gunakan NIS Anda sebagai username. Password default adalah NIS — ganti di pengaturan jika perlu.</p>
                            </div>
                        </div>

                        <div className="mt-auto opacity-90 text-xs">
                            <p>Butuh bantuan? Hubungi petugas IT sekolah atau wali kelas.</p>
                        </div>

                        {/* decorative circles */}
                        <div aria-hidden className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-white/6 blur-3xl pointer-events-none"></div>
                    </div>

                    {/* RIGHT: Form Card */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-10">
                        <div className="max-w-md mx-auto">
                            <div className="text-center">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-800">Login Siswa</h2>
                                <p className="mt-2 text-sm text-gray-600">Masukkan NIS dan password Anda untuk melakukan absensi</p>
                            </div>

                            {status && <div className="mt-4 text-center text-sm text-green-600 font-medium">{status}</div>}

                            <form onSubmit={submit} className="mt-6 space-y-5" autoComplete="off" aria-label="Form login siswa">
                                {/* Username / NIS */}
                                <div>
                                    <InputLabel htmlFor="username" value="NIS (Nomor Induk Siswa)" />
                                    <div className="relative mt-2">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-gray-400" />
                                        </span>
                                        <TextInput
                                            id="username"
                                            name="username"
                                            value={data.username}
                                            className="block w-full pl-11 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition"
                                            autoComplete="username"
                                            isFocused
                                            onChange={(e) => setData('username', e.target.value)}
                                            placeholder="Contoh: 12345678"
                                            aria-label="NIS"
                                        />
                                    </div>
                                    <InputError message={errors.username} className="mt-2" />
                                </div>

                                {/* Password */}
                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <div className="relative mt-2">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                        </span>

                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Default: NIS Anda"
                                            className="block w-full pl-11 pr-12 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition"
                                            autoComplete="current-password"
                                            aria-label="Password"
                                        />

                                        {/* show/hide toggle */}
                                        <button
                                            type="button"
                                            aria-pressed={showPassword}
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                            title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                        >
                                            {showPassword ? (
                                                // eye-off icon (inline svg)
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58A3 3 0 0113.42 13.42" />
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.94 12.94C4.66 16.28 8.12 18.5 12 18.5c4.13 0 7.56-2.44 9.4-5.93C19.56 6.56 15.13 4 12 4c-1.34 0-2.61.28-3.7.78" />
                                                </svg>
                                            ) : (
                                                // eye icon
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.997 12.02C4.89 16.56 8.86 19.5 12 19.5c3.14 0 7.11-3 9-7.48-1.89-4.49-5.86-7.49-9-7.49-3.15 0-7.11 3-9.003 7.48z"/>
                                                    <circle cx="12" cy="12" r="2.5" strokeWidth="1.5" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                        <div>
                                            <span>Password default adalah <span className="font-medium">NIS</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* password strength indicator */}
                                            <div className="w-20 h-2 bg-gray-100 rounded overflow-hidden">
                                                <div
                                                    className={`h-full rounded transition-all ${passwordStrength >= 3 ? 'bg-green-500' : (passwordStrength === 2 ? 'bg-yellow-400' : 'bg-red-400')}`}
                                                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                                    aria-hidden
                                                />
                                            </div>
                                            <span className="sr-only">Kekuatan password: {passwordStrength} dari 4</span>
                                        </div>
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* options */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-sm text-gray-600">
                                        <Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                                        <span className="ml-2">Ingat saya</span>
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <Link href={route('login')} className="text-sm text-gray-600 hover:text-gray-900">Login sebagai Guru/Admin?</Link>
                                        {/* quick-actions placeholder */}
                                        <button
                                            type="button"
                                            className="text-sm text-sky-600 hover:underline"
                                            onClick={() => alert('Fitur QR / Biometrik belum tersedia pada demo ini.')}
                                            title="Login cepat (QR/Biometrik)"
                                        >
                                            Login Cepat
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <PrimaryButton className="w-full justify-center text-lg py-3 bg-sky-600 hover:bg-sky-700" disabled={processing}>
                                        {processing ? 'Memproses...' : 'Log In'}
                                    </PrimaryButton>
                                </div>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                <p>Belum punya akun? Minta bantuan petugas administrasi sekolah.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
