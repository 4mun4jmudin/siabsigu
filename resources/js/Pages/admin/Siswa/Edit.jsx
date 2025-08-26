import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import SiswaForm from './Partials/SiswaForm';

export default function Edit({ auth, siswa, kelasOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        nis: siswa.nis || '',
        nisn: siswa.nisn || '',
        id_kelas: siswa.id_kelas || '',
        nama_lengkap: siswa.nama_lengkap || '',
        nama_panggilan: siswa.nama_panggilan || '',
        foto_profil: null, // Selalu null di awal
        nik: siswa.nik || '',
        nomor_kk: siswa.nomor_kk || '',
        tempat_lahir: siswa.tempat_lahir || '',
        tanggal_lahir: siswa.tanggal_lahir || '',
        jenis_kelamin: siswa.jenis_kelamin || 'Laki-laki',
        agama: siswa.agama || 'Islam',
        alamat_lengkap: siswa.alamat_lengkap || '',
        status: siswa.status || 'Aktif',
        sidik_jari_template: siswa.sidik_jari_template || null,
        barcode_id: siswa.barcode_id || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.siswa.update', siswa.id_siswa), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout user={auth.user} header="Edit Siswa">
            <Head title="Edit Siswa" />

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <SiswaForm data={data} setData={setData} errors={errors} kelasOptions={kelasOptions} siswa={siswa} />
                </div>
                
                <div className="flex items-center gap-4">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-md" disabled={processing}>
                        Update
                    </button>
                    <Link href={route('admin.siswa.index')} className="px-4 py-2 bg-gray-200 rounded-md">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
