// resources/js/Pages/admin/Guru/Create.jsx

import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruForm from './Partials/GuruForm'; // <-- Impor form reusable

export default function Create({ auth, users }) {
    const { data, setData, post, processing, errors } = useForm({
        id_guru: '',
        nama_lengkap: '',
        nip: '',
        jenis_kelamin: 'Laki-laki',
        status: 'Aktif',
        id_pengguna: '',
        foto_profil: null,
        barcode_id: '',
        sidik_jari_template: '',

    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('guru.store'), {
            // Inertia akan otomatis handle multipart/form-data
        });
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Guru">
            <Head title="Tambah Guru" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <GuruForm data={data} setData={setData} errors={errors} users={users} />
                </div>
                
                <div className="flex items-center gap-4">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-md" disabled={processing}>
                        Simpan
                    </button>
                    <Link href={route('guru.index')} className="px-4 py-2 bg-gray-200 rounded-md">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}