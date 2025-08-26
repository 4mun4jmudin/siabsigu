import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import SiswaForm from './Partials/SiswaForm'; // Impor form reusable

export default function Create({ auth, kelasOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        id_siswa: '',
        nis: '',
        nisn: '',
        id_kelas: '',
        nama_lengkap: '',
        nama_panggilan: '',
        foto_profil: null,
        nik: '',
        nomor_kk: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: 'Laki-laki',
        agama: 'Islam',
        alamat_lengkap: '',
        status: 'Aktif',
        sidik_jari_template: null,
        barcode_id: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.siswa.store'));
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Siswa">
            <Head title="Tambah Siswa" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Formulir Data Siswa Baru</h2>
                    <SiswaForm data={data} setData={setData} errors={errors} kelasOptions={kelasOptions} />
                </div>
                
                <div className="flex items-center gap-4">
                    <button type="submit" className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <Link href={route('admin.siswa.index')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-xs uppercase hover:bg-gray-300 transition">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
