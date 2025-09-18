// resources/js/Pages/Auth/Login.jsx
// Login Admin & Guru – modern, responsif, pakai logo & background yang diminta

import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/solid';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    username: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => () => reset('password'), []);

  const submit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    post(route('login'), {
      onFinish: () => setIsLoading(false),
    });
  };

  const onKeyWatch = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsOn(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('https://i.ytimg.com/vi/E-VdemkhzXw/maxresdefault.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Head title="Log in" />

      {/* overlay gradient biar kontras */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-md overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 text-center">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRl33BhpowHZZHfLJuzZrr3VVSMwe5t4evLmA&s"
              alt="Logo Sekolah"
              className="mx-auto h-20 w-20 object-contain rounded-full shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">Selamat Datang</h1>
            <p className="mt-1 mb-6 text-sm text-slate-600">
              Login untuk Admin &amp; Guru
            </p>
          </div>

          {/* Flash status */}
          {status && (
            <div className="mx-8 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {status}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="px-8 pb-8 space-y-5" autoComplete="off">
            {/* Username */}
            <div>
              <InputLabel htmlFor="username" value="Username" className="text-slate-700" />
              <div className="relative mt-1">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <TextInput
                  id="username"
                  type="text"
                  name="username"
                  value={data.username}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  autoComplete="username"
                  isFocused
                  onChange={(e) => setData('username', e.target.value)}
                  onKeyUp={onKeyWatch}
                  placeholder="Masukkan username Anda"
                />
              </div>
              <InputError message={errors.username} className="mt-2" />
            </div>

            {/* Password */}
            <div>
              <InputLabel htmlFor="password" value="Password" className="text-slate-700" />
              <div className="relative mt-1">
                <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <TextInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={data.password}
                  className="block w-full pl-10 pr-12 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  autoComplete="current-password"
                  onChange={(e) => setData('password', e.target.value)}
                  onKeyUp={onKeyWatch}
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    // eye-off
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M9.88 4.24A9.86 9.86 0 0112 4c7 0 10 8 10 8a17.73 17.73 0 01-3.69 5.13m-3.2 2.07A9.86 9.86 0 0112 20C5 20 2 12 2 12a18.2 18.2 0 013.1-4.56" />
                    </svg>
                  ) : (
                    // eye
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
              <InputError message={errors.password} className="mt-2" />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2">
                <Checkbox
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                />
                <span className="text-sm text-slate-600">Ingat saya</span>
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
            <div>
              <PrimaryButton
                className="w-full justify-center py-3 text-base"
                disabled={processing || isLoading}
              >
                {(processing || isLoading) ? (
                  <>
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Memproses…
                  </>
                ) : (
                  'Log In'
                )}
              </PrimaryButton>
            </div>

            <p className="pt-2 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} — Sistem Absensi. All rights reserved.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
