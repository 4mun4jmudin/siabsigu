import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Create({ auth, siswaOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        // Data Pribadi Wali
        id_siswa: '',
        hubungan: 'Ayah',
        nama_lengkap: '',
        nik: '',
        tanggal_lahir: '',
        pendidikan_terakhir: '',
        pekerjaan: '',
        penghasilan_bulanan: '',
        no_telepon_wa: '',
        
        // Data Akun Login
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('orang-tua-wali.store'));
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Orang Tua/Wali">
            <Head title="Tambah Orang Tua/Wali" />
            <div className="max-w-4xl mx-auto">
                <form onSubmit={submit} className="space-y-8">
                    {/* Informasi Siswa Perwalian */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Siswa Perwalian</h2>
                        <div>
                            <InputLabel htmlFor="id_siswa" value="Pilih Anak / Siswa Perwalian" />
                            <select id="id_siswa" value={data.id_siswa} onChange={e => setData('id_siswa', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                                <option value="">--- Pilih Siswa ---</option>
                                {siswaOptions.map(siswa => <option key={siswa.id_siswa} value={siswa.id_siswa}>{siswa.nama_lengkap} ({siswa.nis})</option>)}
                            </select>
                            <InputError message={errors.id_siswa} className="mt-2" />
                        </div>
                    </div>

                    {/* Informasi Pribadi Wali */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Informasi Pribadi Orang Tua / Wali</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap Wali" />
                                <TextInput id="nama_lengkap" value={data.nama_lengkap} onChange={e => setData('nama_lengkap', e.target.value)} className="mt-1 block w-full" isFocused />
                                <InputError message={errors.nama_lengkap} className="mt-2" />
                            </div>
                             <div>
                                <InputLabel htmlFor="hubungan" value="Hubungan dengan Siswa" />
                                <select id="hubungan" value={data.hubungan} onChange={e => setData('hubungan', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
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
                                <select id="pendidikan_terakhir" value={data.pendidikan_terakhir} onChange={e => setData('pendidikan_terakhir', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
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
                                <select id="penghasilan_bulanan" value={data.penghasilan_bulanan} onChange={e => setData('penghasilan_bulanan', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
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

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Akun Login</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <InputLabel htmlFor="username" value="Username" />
                                <TextInput id="username" value={data.username} onChange={e => setData('username', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.username} className="mt-2" />
                            </div>
                             <div>
                                <InputLabel htmlFor="email" value="Email (Opsional)" />
                                <TextInput id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                             <div>
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.password} className="mt-2" />
                            </div>
                             <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                                <TextInput id="password_confirmation" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end mt-6">
                        <Link href={route('admin.orang-tua-wali.index')} className="text-sm text-gray-600 hover:text-gray-900 mr-4">Batal</Link>
                        <PrimaryButton disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Data'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
