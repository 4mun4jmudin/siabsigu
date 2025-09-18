// resources/js/Pages/OrangTua/Login.jsx (atau file lama Anda)
// Modern Parent Login Page – Inertia + Tailwind
import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function OrangTuaLogin({ status, canResetPassword }) {
    const { props } = usePage();
    const appName = props?.ziggy?.appName || props?.appName || 'AbsensiApp';

    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [capsOn, setCapsOn] = useState(false);

    useEffect(() => () => reset('password'), []);

    const submit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        post(route('login.orangtua'), {
            onFinish: () => setIsLoading(false),
        });
    };

    const onKeyWatch = (e) => {
        if (typeof e.getModifierState === 'function') {
            setCapsOn(e.getModifierState('CapsLock'));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <Head title="Login Orang Tua/Wali" />

            {/* dekorasi halus */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
            </div>

            <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 md:grid-cols-2">
                {/* Left / hero */}
                <div className="relative hidden md:block">
                    <div className="absolute inset-6 rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                        <img
                            src="https://i.ytimg.com/vi/E-VdemkhzXw/maxresdefault.jpg"
                            alt="Sekolah"
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <div className="mb-2 text-sm uppercase tracking-wide opacity-80">Portal Orang Tua</div>
                            <h2 className="text-2xl font-semibold">{appName}</h2>
                            <p className="mt-2 max-w-md text-sm opacity-90">
                                Pantau kehadiran dan informasi akademik putra/putri Anda dengan cepat dan mudah.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right / form card */}
                <div className="flex items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                                {/* logo mini */}
                                <img
                                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRl33BhpowHZZHfLJuzZrr3VVSMwe5t4evLmA&s"
                                    alt="Logo Sekolah"
                                    className="mx-auto h-20 w-20 object-contain rounded-full shadow-sm"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                            <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
                                Login Orang Tua / Wali
                            </h1>
                            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                                Masuk untuk mengakses informasi akademik siswa.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form
                            onSubmit={submit}
                            className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/70"
                        >
                            {/* Username */}
                            <div className="mb-4">
                                <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Username
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        autoComplete="username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        onKeyUp={onKeyWatch}
                                        className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Masukkan username"
                                    />
                                </div>
                                {errors.username && <p className="mt-2 text-sm text-rose-600">{errors.username}</p>}
                            </div>

                            {/* Password */}
                            <div className="mb-2">
                                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M6 10V7a6 6 0 1112 0v3" />
                                            <rect x="4" y="10" width="16" height="10" rx="2" />
                                        </svg>
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        onKeyUp={onKeyWatch}
                                        className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 py-2.5 text-slate-900 shadow-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                        placeholder="Masukkan password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                                <path d="M3 3l18 18" />
                                                <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                                                <path d="M9.88 4.24A9.53 9.53 0 0112 4c7 0 10 8 10 8a17.73 17.73 0 01-3.69 5.13m-3.2 2.07A9.86 9.86 0 0112 20C5 20 2 12 2 12a18.2 18.2 0 013.1-4.56" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {capsOn && (
                                    <div className="mt-2 text-[12px] font-medium text-amber-600">
                                        Caps Lock aktif — periksa huruf besar/kecil.
                                    </div>
                                )}
                                {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="mt-3 flex items-center justify-between">
                                <label className="inline-flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">Ingat saya</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={processing || isLoading}
                                    className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm ring-1 ring-indigo-600/10 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {(processing || isLoading) && (
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                    )}
                                    Masuk
                                </button>
                            </div>
                        </form>

                        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            Dengan login, Anda menyetujui <span className="underline">Syarat & Ketentuan</span> dan{' '}
                            <span className="underline">Kebijakan Privasi</span> kami.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
