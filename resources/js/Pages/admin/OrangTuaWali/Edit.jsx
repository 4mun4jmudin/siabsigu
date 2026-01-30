import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Import Icon

export default function Edit({ auth, wali, siswaOptions }) {
    const { data, setData, put, processing, errors } = useForm({
        // Data Pribadi Wali
        id_siswa: wali.id_siswa || '',
        hubungan: wali.hubungan || 'Ayah',
        nama_lengkap: wali.nama_lengkap || '',
        nik: wali.nik || '',
        tanggal_lahir: wali.tanggal_lahir || '',
        pendidikan_terakhir: wali.pendidikan_terakhir || '',
        pekerjaan: wali.pekerjaan || '',
        penghasilan_bulanan: wali.penghasilan_bulanan || '',
        no_telepon_wa: wali.no_telepon_wa || '',
        
        // Data Akun Login
        username: wali.pengguna?.username || '',
        email: wali.pengguna?.email || '',
        password: '',
        password_confirmation: '',
    });

    // State untuk toggle visibilitas password
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.orang-tua-wali.update', wali.id_wali));
    };

    return (
        <AdminLayout user={auth.user} header="Edit Orang Tua/Wali">
            <Head title="Edit Orang Tua/Wali" />
            <div className="max-w-4xl mx-auto">
                <form onSubmit={submit} className="space-y-8">
                    
                    {/* Informasi Siswa Perwalian */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                            Siswa Perwalian
                        </h2>
                        <div>
                            <InputLabel htmlFor="id_siswa" value="Pilih Anak / Siswa Perwalian" />
                            <select 
                                id="id_siswa" 
                                value={data.id_siswa} 
                                onChange={e => setData('id_siswa', e.target.value)} 
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">--- Pilih Siswa ---</option>
                                {siswaOptions.map(siswa => (
                                    <option key={siswa.id_siswa} value={siswa.id_siswa}>
                                        {siswa.nama_lengkap} ({siswa.nis})
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.id_siswa} className="mt-2" />
                        </div>
                    </div>

                    {/* Informasi Pribadi Wali */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            Informasi Pribadi Orang Tua / Wali
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap Wali" />
                                <TextInput id="nama_lengkap" value={data.nama_lengkap} onChange={e => setData('nama_lengkap', e.target.value)} className="mt-1 block w-full" isFocused />
                                <InputError message={errors.nama_lengkap} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="hubungan" value="Hubungan dengan Siswa" />
                                <select id="hubungan" value={data.hubungan} onChange={e => setData('hubungan', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option>Ayah</option>
                                    <option>Ibu</option>
                                    <option>Wali</option>
                                </select>
                                <InputError message={errors.hubungan} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="nik" value="NIK" />
                                <TextInput id="nik" value={data.nik} onChange={e => setData('nik', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.nik} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir" />
                                <TextInput id="tanggal_lahir" type="date" value={data.tanggal_lahir} onChange={e => setData('tanggal_lahir', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.tanggal_lahir} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="pendidikan_terakhir" value="Pendidikan Terakhir" />
                                <select id="pendidikan_terakhir" value={data.pendidikan_terakhir} onChange={e => setData('pendidikan_terakhir', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value="">Pilih Pendidikan</option>
                                    {['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'].map(opt => <option key={opt}>{opt}</option>)}
                                </select>
                                <InputError message={errors.pendidikan_terakhir} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="pekerjaan" value="Pekerjaan" />
                                <TextInput id="pekerjaan" value={data.pekerjaan} onChange={e => setData('pekerjaan', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.pekerjaan} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="penghasilan_bulanan" value="Penghasilan Bulanan" />
                                <select id="penghasilan_bulanan" value={data.penghasilan_bulanan} onChange={e => setData('penghasilan_bulanan', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value="">Pilih Penghasilan</option>
                                    {['< 1 Juta', '1 - 3 Juta', '3 - 5 Juta', '5 - 10 Juta', '> 10 Juta', 'Tidak Berpenghasilan'].map(opt => <option key={opt}>{opt}</option>)}
                                </select>
                                <InputError message={errors.penghasilan_bulanan} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="no_telepon_wa" value="No. Telepon (WhatsApp)" />
                                <TextInput id="no_telepon_wa" value={data.no_telepon_wa} onChange={e => setData('no_telepon_wa', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.no_telepon_wa} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* Akun Login */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                                Akun Login
                            </h2>
                            {/* Tombol Show Password Global */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium focus:outline-none"
                            >
                                {showPassword ? (
                                    <>
                                        <EyeSlashIcon className="w-4 h-4" /> Sembunyikan Password
                                    </>
                                ) : (
                                    <>
                                        <EyeIcon className="w-4 h-4" /> Lihat Password
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-6 bg-orange-50 p-3 rounded-md border border-orange-100">
                            Info: Kosongkan password jika tidak ingin mengubahnya.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="username" value="Username" />
                                <TextInput id="username" value={data.username} onChange={e => setData('username', e.target.value)} className="mt-1 block w-full bg-gray-50" readOnly />
                                <p className="text-xs text-gray-400 mt-1">*Username mengikuti username akun awal (biasanya NIK/No.HP)</p>
                                <InputError message={errors.username} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="Email (Opsional)" />
                                <TextInput id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            
                            {/* Input Password Baru dengan Icon Toggle */}
                            <div className="relative">
                                <InputLabel htmlFor="password" value="Password Baru" />
                                <div className="relative mt-1">
                                    <TextInput 
                                        id="password" 
                                        type={showPassword ? "text" : "password"} 
                                        value={data.password} 
                                        onChange={e => setData('password', e.target.value)} 
                                        className="block w-full pr-10" 
                                        placeholder="Min. 8 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            {/* Input Konfirmasi Password dengan Icon Toggle */}
                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password Baru" />
                                <div className="relative mt-1">
                                    <TextInput 
                                        id="password_confirmation" 
                                        type={showPassword ? "text" : "password"} 
                                        value={data.password_confirmation} 
                                        onChange={e => setData('password_confirmation', e.target.value)} 
                                        className="block w-full pr-10"
                                        placeholder="Ulangi password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end mt-6 gap-3">
                        <Link 
                            href={route('admin.orang-tua-wali.index')} 
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            Batal
                        </Link>
                        <PrimaryButton disabled={processing}>{processing ? 'Mengupdate...' : 'Update Data'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}