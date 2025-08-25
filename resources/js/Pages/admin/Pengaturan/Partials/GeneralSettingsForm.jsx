import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Home, MapPin, User, Calendar, BookOpen, Save, CheckCircle, XCircle } from 'lucide-react';

export default function GeneralSettingsForm({ className = '', pengaturan = {}, tahun_ajaran = [] }) {
    const { data, setData, put, post, processing, errors, recentlySuccessful } = useForm({

        nama_sekolah: pengaturan.nama_sekolah || '',
        alamat_sekolah: pengaturan.alamat_sekolah || '',
        kepala_sekolah: pengaturan.kepala_sekolah || '',
        tahun_ajaran_aktif: pengaturan.tahun_ajaran_aktif || '',
        semester_aktif: pengaturan.semester_aktif || '',
    });

    const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    // preview logo (client-side only)
    const [logoPreview, setLogoPreview] = useState(pengaturan.logo_url || null);

    useEffect(() => {
        // clear preview when pengaturan.logo_url changes
        setLogoPreview(pengaturan.logo_url || null);
    }, [pengaturan.logo_url]);

    const submit = (e) => {
        console.log('Data yang akan dikirim:', data);
        e.preventDefault();
        post(route('admin.pengaturan.update-general'), {
            _method: 'put', // Spoofing the PUT request
            preserveScroll: true,
            onSuccess: () => setToast({ type: 'success', message: 'Pengaturan berhasil disimpan!' }),
            onError: (response) => {
                // Cek jika ada error validasi spesifik
                const firstError = Object.values(errors)[0];
                if (firstError) {
                    setToast({ type: 'error', message: `Gagal menyimpan: ${firstError}` });
                } else {
                    setToast({ type: 'error', message: 'Gagal menyimpan pengaturan. Silakan coba lagi.' });
                }
            },
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        // preview only — if you want to upload, include file in FormData on submit
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target.result);
        reader.readAsDataURL(file);
        // set to form data if backend accepts file fields (example key 'logo')
        setData('logo', file);
    };

    return (
        <section className={"max-w-4xl mx-auto p-4 " + className}>
            <header className="mb-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-md bg-indigo-50 p-2 text-indigo-600"><Home className="w-5 h-5" /></div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Pengaturan Umum</h2>
                        <p className="text-sm text-gray-500">Simpan informasi dasar sekolah dan konfigurasi akademik.</p>
                    </div>
                </div>
            </header>

            {/* Toast Notification */}
            {toast && (
                <div className={`mb-4 p-3 rounded-md ${toast.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`} role="status">
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="bg-white border rounded-lg shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Form inputs */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <InputLabel htmlFor="nama_sekolah" value="Nama Sekolah" />
                            <TextInput
                                id="nama_sekolah"
                                className="mt-1 block w-full"
                                value={data.nama_sekolah}
                                onChange={(e) => setData('nama_sekolah', e.target.value)}
                                required
                                aria-describedby="namaHelp"
                            />
                            <p id="namaHelp" className="text-xs text-gray-500 mt-1">Nama resmi sekolah yang akan tampil di laporan dan header aplikasi.</p>
                            <InputError message={errors.nama_sekolah} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="kepala_sekolah" value="Kepala Sekolah" />
                            <div className="mt-1 flex items-center gap-3">
                                <div className="p-2 rounded-md bg-gray-50 text-gray-600"><User className="w-5 h-5" /></div>
                                <TextInput
                                    id="kepala_sekolah"
                                    className="block w-full"
                                    value={data.kepala_sekolah}
                                    onChange={(e) => setData('kepala_sekolah', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.kepala_sekolah} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="alamat_sekolah" value="Alamat Sekolah" />
                            <div className="mt-1 flex gap-3">
                                <div className="p-2 rounded-md bg-gray-50 text-gray-600"><MapPin className="w-5 h-5" /></div>
                                <textarea
                                    id="alamat_sekolah"
                                    className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-2"
                                    value={data.alamat_sekolah}
                                    onChange={(e) => setData('alamat_sekolah', e.target.value)}
                                    rows={4}
                                    required
                                />
                            </div>
                            <InputError message={errors.alamat_sekolah} className="mt-2" />
                        </div>

                        {/* Akademik */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="tahun_ajaran_aktif" value="Tahun Ajaran Aktif" />
                                <div className="mt-1 relative">
                                    <select
                                        id="tahun_ajaran_aktif"
                                        className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-2 pr-8"
                                        value={data.tahun_ajaran_aktif}
                                        onChange={(e) => setData('tahun_ajaran_aktif', e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih Tahun Ajaran</option>
                                        {tahun_ajaran.map((ta) => (
                                            <option key={ta.id_tahun_ajaran} value={ta.tahun_ajaran}>{ta.tahun_ajaran}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-2 text-gray-400"><Calendar className="w-4 h-4" /></div>
                                </div>
                                <InputError message={errors.tahun_ajaran_aktif} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="semester_aktif" value="Semester Aktif" />
                                <div className="mt-1 relative">
                                    <select
                                        id="semester_aktif"
                                        className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-2 pr-8"
                                        value={data.semester_aktif}
                                        onChange={(e) => setData('semester_aktif', e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih Semester</option>
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                    <div className="absolute right-2 top-2 text-gray-400"><BookOpen className="w-4 h-4" /></div>
                                </div>
                                <InputError message={errors.semester_aktif} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                <Save className="w-4 h-4 mr-2" /> Simpan
                            </PrimaryButton>

                            {recentlySuccessful && (
                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Tersimpan.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Logo preview & quick summary */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full text-center">
                            <InputLabel value="Logo Sekolah (opsional)" />
                            <div className="mt-2 flex items-center justify-center">
                                <div className="w-36 h-36 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {logoPreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={logoPreview} alt="Logo Sekolah" className="object-contain w-full h-full" />
                                    ) : (
                                        <div className="text-gray-400">Preview Logo</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3">
                                <input id="logo" name="logo" type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500" />
                                <p id="logoHelp" className="text-xs text-gray-400 mt-1">Ukuran maksimal direkomendasikan 2MB. Hanya preview — file akan dikirim saat submit jika endpoint menerima file.</p>
                            </div>
                        </div>

                        <div className="w-full bg-gray-50 p-3 rounded-md text-sm text-gray-600 border">
                            <div className="font-medium text-gray-800">Ringkasan Akademik</div>
                            <div className="mt-2">
                                <div className="text-xs text-gray-500">Tahun Ajaran</div>
                                <div className="font-semibold">{data.tahun_ajaran_aktif || '-'}</div>
                            </div>
                            <div className="mt-2">
                                <div className="text-xs text-gray-500">Semester</div>
                                <div className="font-semibold">{data.semester_aktif || '-'}</div>
                            </div>
                        </div>

                        <div className="w-full text-xs text-gray-500 text-center">Pastikan informasi sekolah selalu diperbarui agar dokumen resmi sesuai.</div>
                    </div>
                </div>
            </form>
        </section>
    );
}