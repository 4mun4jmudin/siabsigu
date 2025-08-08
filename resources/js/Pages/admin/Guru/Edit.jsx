// resources/js/Pages/admin/Guru/Edit.jsx

import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruForm from './Partials/GuruForm';

export default function Edit({ auth, guru, users }) {
    const { data, setData, post, processing, errors } = useForm({
       _method: 'PUT',
        nama_lengkap: guru.nama_lengkap || '',
        nip: guru.nip || '',
        jenis_kelamin: guru.jenis_kelamin || 'Laki-laki',
        status: guru.status || 'Aktif',
        id_pengguna: guru.id_pengguna || '',
        foto_profil: null,
        // --- TAMBAHKAN FIELD BARU DARI DATA GURU ---
        barcode_id: guru.barcode_id || '',
        sidik_jari_template: guru.sidik_jari_template || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Gunakan method POST untuk update karena form berisi file
        // Laravel akan membaca _method: 'PUT' untuk routing
        post(route('guru.update', guru.id_guru), {
            forceFormData: true, // Paksa Inertia menggunakan FormData
        });
    };

    return (
        <AdminLayout user={auth.user} header="Edit Guru">
            <Head title="Edit Guru" />

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <GuruForm data={data} setData={setData} errors={errors} users={users} guru={guru} />
                </div>
                
                <div className="flex items-center gap-4">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-md" disabled={processing}>
                        Update
                    </button>
                    <Link href={route('guru.index')} className="px-4 py-2 bg-gray-200 rounded-md">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}