import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Clock, Users, User, QrCode, Fingerprint, Save, CheckCircle, XCircle } from 'lucide-react';

export default function AbsensiSettingsForm({ className = '', pengaturan = {} }) {
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    jam_masuk_siswa: pengaturan.jam_masuk_siswa || '',
    jam_pulang_siswa: pengaturan.jam_pulang_siswa || '',
    jam_masuk_guru: pengaturan.jam_masuk_guru || '',
    jam_pulang_guru: pengaturan.jam_pulang_guru || '',
    batas_terlambat_siswa: pengaturan.batas_terlambat_siswa ?? 0,
    batas_terlambat_guru: pengaturan.batas_terlambat_guru ?? 0,
    login_barcode_enabled: !!pengaturan.login_barcode_enabled,
    login_fingerprint_enabled: !!pengaturan.login_fingerprint_enabled,
    login_manual_enabled: !!pengaturan.login_manual_enabled,
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
    put(route('admin.pengaturan.update-absensi'), {
      preserveScroll: true,
      onSuccess: () => setToast({ type: 'success', message: 'Pengaturan Absensi berhasil disimpan.' }),
      onError: () => setToast({ type: 'error', message: 'Gagal menyimpan pengaturan absensi. Cek input dan coba lagi.' }),
    });
  };

  const classNames = (...classes) => classes.filter(Boolean).join(' ');

  const MethodBadge = ({ children, active, Icon }) => (
    <span
      className={classNames(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      )}
      aria-pressed={active}
    >
      {Icon && <Icon className="w-4 h-4" aria-hidden />}
      {children}
    </span>
  );

  return (
    <section className={classNames('max-w-4xl mx-auto p-4', className)}>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pengaturan Absensi</h2>
              <p className="mt-1 text-sm text-gray-500">Atur jam masuk/pulang, toleransi keterlambatan, dan metode absensi.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <MethodBadge active={data.login_barcode_enabled} Icon={QrCode}>Barcode</MethodBadge>
              <MethodBadge active={data.login_fingerprint_enabled} Icon={Fingerprint}>Sidik Jari</MethodBadge>
              <MethodBadge active={data.login_manual_enabled} Icon={User}>Manual</MethodBadge>
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

        <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Card: Waktu Siswa */}
          <div className="col-span-1 md:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white border text-indigo-600">
                <Users className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">Waktu Siswa</h3>
                <p className="text-xs text-gray-500 mt-1">Jam resmi mulai dan pulang untuk siswa.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <InputLabel htmlFor="jam_masuk_siswa" value="Jam Masuk Siswa" />
                <div className="relative">
                  <TextInput
                    id="jam_masuk_siswa"
                    type="time"
                    className="mt-1 block w-full pl-10"
                    value={data.jam_masuk_siswa}
                    onChange={(e) => setData('jam_masuk_siswa', e.target.value)}
                    required
                  />
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.jam_masuk_siswa} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="jam_pulang_siswa" value="Jam Pulang Siswa" />
                <div className="relative">
                  <TextInput
                    id="jam_pulang_siswa"
                    type="time"
                    className="mt-1 block w-full pl-10"
                    value={data.jam_pulang_siswa}
                    onChange={(e) => setData('jam_pulang_siswa', e.target.value)}
                    required
                  />
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.jam_pulang_siswa} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="batas_terlambat_siswa" value="Toleransi Terlambat Siswa (menit)" />
                <div className="relative">
                  <TextInput
                    id="batas_terlambat_siswa"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    className="mt-1 block w-full pl-10"
                    value={data.batas_terlambat_siswa}
                    onChange={(e) => setData('batas_terlambat_siswa', Number(e.target.value))}
                    required
                  />
                  <CheckCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.batas_terlambat_siswa} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Card: Waktu Guru */}
          <div className="col-span-1 md:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white border text-indigo-600">
                <User className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">Waktu Guru</h3>
                <p className="text-xs text-gray-500 mt-1">Jam resmi guru dan toleransi keterlambatan.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <InputLabel htmlFor="jam_masuk_guru" value="Jam Masuk Guru" />
                <div className="relative">
                  <TextInput
                    id="jam_masuk_guru"
                    type="time"
                    className="mt-1 block w-full pl-10"
                    value={data.jam_masuk_guru}
                    onChange={(e) => setData('jam_masuk_guru', e.target.value)}
                    required
                  />
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.jam_masuk_guru} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="jam_pulang_guru" value="Jam Pulang Guru" />
                <div className="relative">
                  <TextInput
                    id="jam_pulang_guru"
                    type="time"
                    className="mt-1 block w-full pl-10"
                    value={data.jam_pulang_guru}
                    onChange={(e) => setData('jam_pulang_guru', e.target.value)}
                    required
                  />
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.jam_pulang_guru} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="batas_terlambat_guru" value="Toleransi Terlambat Guru (menit)" />
                <div className="relative">
                  <TextInput
                    id="batas_terlambat_guru"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    className="mt-1 block w-full pl-10"
                    value={data.batas_terlambat_guru}
                    onChange={(e) => setData('batas_terlambat_guru', Number(e.target.value))}
                    required
                  />
                  <CheckCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden />
                </div>
                <InputError message={errors.batas_terlambat_guru} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Metode Absensi */}
          <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white border text-indigo-600">
                <QrCode className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800">Metode Absensi yang Tersedia</h3>
                <p className="text-xs text-gray-500 mt-1">Aktifkan atau non-aktifkan metode yang diinginkan. Perubahan akan terlihat di pratinjau.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-start gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  name="login_barcode_enabled"
                  checked={data.login_barcode_enabled}
                  onChange={(e) => setData('login_barcode_enabled', e.target.checked)}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-medium text-gray-700"><QrCode className="w-4 h-4" /> Login via Barcode</div>
                  <div className="text-xs text-gray-500">Siswa/guru memindai QR/barcode.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  name="login_fingerprint_enabled"
                  checked={data.login_fingerprint_enabled}
                  onChange={(e) => setData('login_fingerprint_enabled', e.target.checked)}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-medium text-gray-700"><Fingerprint className="w-4 h-4" /> Login via Sidik Jari</div>
                  <div className="text-xs text-gray-500">Memerlukan perangkat fingerprint.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  name="login_manual_enabled"
                  checked={data.login_manual_enabled}
                  onChange={(e) => setData('login_manual_enabled', e.target.checked)}
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2 font-medium text-gray-700"><User className="w-4 h-4" /> Absensi Manual</div>
                  <div className="text-xs text-gray-500">Petugas dapat memasukkan manual via dashboard.</div>
                </div>
              </label>
            </div>

            <InputError message={errors.login_barcode_enabled || errors.login_fingerprint_enabled || errors.login_manual_enabled} className="mt-3" />

            {/* Pratinjau kecil */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-800">Pratinjau Pengaturan</h4>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <div className="text-xs text-gray-500">Siswa:</div>
                <span className="ml-2 text-sm">{data.jam_masuk_siswa || '-'} → {data.jam_pulang_siswa || '-'}</span>
                <div className="ml-4 text-xs text-gray-500">Guru:</div>
                <span className="ml-2 text-sm">{data.jam_masuk_guru || '-'} → {data.jam_pulang_guru || '-'}</span>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <MethodBadge active={data.login_barcode_enabled} Icon={QrCode}>Barcode</MethodBadge>
                <MethodBadge active={data.login_fingerprint_enabled} Icon={Fingerprint}>Sidik Jari</MethodBadge>
                <MethodBadge active={data.login_manual_enabled} Icon={User}>Manual</MethodBadge>
              </div>
            </div>
          </div>

          {/* fallback action for small screens */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {recentlySuccessful ? (
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Perubahan berhasil disimpan.</div>
              ) : (
                'Pastikan pengaturan sudah benar sebelum menyimpan.'
              )}
            </div>

            <div className="flex items-center gap-2">
              <PrimaryButton disabled={processing}>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}