import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import ToggleSwitch from '@/Components/ToggleSwitch';
import StatCard from '@/Pages/admin/Laporan/Partials/StatCard';
import { ShieldCheck, Users, Key, Hash, Clock, Save, CheckCircle, XCircle } from 'lucide-react';

export default function UserSettingsForm({ className = '', pengaturan = {}, stats = {} }) {
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    password_min_length: pengaturan.password_min_length ?? 8,
    password_require_upper: !!pengaturan.password_require_upper,
    password_require_number: !!pengaturan.password_require_number,
    password_require_special: !!pengaturan.password_require_special,
    password_expiry_days: pengaturan.password_expiry_days ?? 90,
    auto_create_user: !!pengaturan.auto_create_user,
  });

  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.pengaturan.update-users'), {
      preserveScroll: true,
      onSuccess: () => setToast({ type: 'success', message: 'Pengaturan Pengguna berhasil diperbarui.' }),
      onError: () => setToast({ type: 'error', message: 'Gagal memperbarui pengaturan pengguna. Silakan coba lagi.' }),
    });
  };

  const classNames = (...c) => c.filter(Boolean).join(' ');

  // Simple password strength hint derived from current policy
  const passwordStrength = useMemo(() => {
    const score = [
      Number(data.password_min_length) >= 8,
      data.password_require_upper,
      data.password_require_number,
      data.password_require_special,
    ].reduce((s, v) => s + (v ? 1 : 0), 0);

    if (score <= 1) return { label: 'Lemah', color: 'bg-red-100 text-red-700' };
    if (score === 2) return { label: 'Sedang', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Kuat', color: 'bg-green-100 text-green-700' };
  }, [data]);

  return (
    <section className={classNames('max-w-5xl mx-auto p-4', className)}>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <ShieldCheck className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pengaturan Pengguna</h2>
              <p className="mt-1 text-sm text-gray-500">Kelola kebijakan kata sandi, pembuatan akun otomatis, dan lihat ringkasan pengguna.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{data.password_expiry_days} hari kadaluarsa</span>
              </div>
              <div className={classNames('px-2 py-1 rounded-md text-xs font-medium', passwordStrength.color)}>
                {passwordStrength.label}
              </div>
            </div>

            <PrimaryButton disabled={processing} onClick={submit}>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </PrimaryButton>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div className={`mt-4 mb-4 p-3 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`} role="status">
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* Statistik */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Statistik Pengguna</h3>
            <p className="text-sm text-gray-500 mt-1">Ringkasan singkat jumlah pengguna aktif.</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Siswa" value={stats.total_siswa} icon={<Users className="w-5 h-5 text-indigo-600" />} />
              <StatCard title="Total Guru" value={stats.total_guru} icon={<Users className="w-5 h-5 text-teal-600" />} />
              <StatCard title="Akun Otomatis" value={stats.auto_created || 0} icon={<UserPlusIconFallback />} />
            </div>
          </div>

          {/* Kebijakan Kata Sandi */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mt-2">Kebijakan Kata Sandi</h3>
            <p className="text-sm text-gray-500 mt-1">Atur persyaratan minimal untuk memperkuat keamanan akun.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-white border text-indigo-600"><Key className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-gray-800">Panjang Minimum Kata Sandi</p>
                      <p className="text-xs text-gray-500">Minimum karakter yang diperbolehkan.</p>
                    </div>
                  </div>

                  <div className="w-24">
                    <TextInput
                      id="password_min_length"
                      type="number"
                      min={4}
                      className="w-full text-right"
                      value={data.password_min_length}
                      onChange={(e) => setData('password_min_length', Number(e.target.value))}
                      required
                    />
                    <InputError message={errors.password_min_length} className="mt-2" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white border text-indigo-600"><Key className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-gray-700">Wajib Huruf Kapital & Kecil</div>
                        <div className="text-xs text-gray-500">Memastikan kombinasi huruf besar dan kecil.</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      name="password_require_upper"
                      checked={data.password_require_upper}
                      onChange={(e) => setData('password_require_upper', e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white border text-indigo-600"><Hash className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-gray-700">Wajib Angka</div>
                        <div className="text-xs text-gray-500">Setidaknya satu angka di password.</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      name="password_require_number"
                      checked={data.password_require_number}
                      onChange={(e) => setData('password_require_number', e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white border text-indigo-600"><Hash className="w-4 h-4" /></div>
                      <div>
                        <div className="font-medium text-gray-700">Wajib Karakter Khusus</div>
                        <div className="text-xs text-gray-500">Contoh: @, #, $.</div>
                      </div>
                    </div>
                    <ToggleSwitch
                      name="password_require_special"
                      checked={data.password_require_special}
                      onChange={(e) => setData('password_require_special', e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-white border text-indigo-600"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-gray-800">Periode Kadaluarsa Password</p>
                      <p className="text-xs text-gray-500">Berapa hari sebelum pengguna diminta mengganti password.</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <TextInput
                      id="password_expiry_days"
                      type="number"
                      min={0}
                      className="w-36"
                      value={data.password_expiry_days}
                      onChange={(e) => setData('password_expiry_days', Number(e.target.value))}
                      required
                    />
                    <InputError message={errors.password_expiry_days} className="mt-2" />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-800">Ringkasan Kekuatan Kata Sandi</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className={classNames('px-3 py-1 rounded-md text-sm font-semibold', passwordStrength.color)}>
                      {passwordStrength.label}
                    </div>
                    <div className="text-sm text-gray-500">Berdasarkan aturan saat ini</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opsi Lainnya */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Pengaturan Akun</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-white border text-indigo-600"><Users className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-gray-800">Buat Akun Otomatis</p>
                    <p className="text-xs text-gray-500">Saat terintegrasi, sistem membuat akun pengguna baru otomatis.</p>
                  </div>
                </div>

                <ToggleSwitch
                  name="auto_create_user"
                  checked={data.auto_create_user}
                  onChange={(e) => setData('auto_create_user', e.target.checked)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-white border text-indigo-600"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-gray-800">Proteksi Tambahan</p>
                    <p className="text-xs text-gray-500">Aktifkan fitur keamanan tambahan di masa depan.</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <PrimaryButton disabled={processing}>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </PrimaryButton>

            {recentlySuccessful && (
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Perubahan tersimpan.</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

// Small fallback icon component used in StatCard when an icon is not passed
function UserPlusIconFallback() {
  return (
    <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 14h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-3 -3)" />
    </svg>
  );
}