// resources/js/Pages/Admin/TahunAjaran/Create.jsx

import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ auth }) {
    // Inisialisasi useForm dengan field-field yang dibutuhkan
    const { data, setData, post, processing, errors } = useForm({
        id_tahun_ajaran: '',
        tahun_ajaran: '',
        semester: 'Ganjil', // Nilai default
        status: 'Tidak Aktif', // Nilai default
    });

    // Fungsi yang akan dipanggil saat form di-submit
    const handleSubmit = (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        // Kirim data form ke route 'tahun-ajaran.store'
        post(route('tahun-ajaran.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tambah Tahun Ajaran</h2>}
        >
            <Head title="Tambah Tahun Ajaran" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={handleSubmit}>
                                {/* Input ID Tahun Ajaran */}
                                <div className="mb-4">
                                    <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700">ID Tahun Ajaran</label>
                                    <input
                                        type="text"
                                        id="id_tahun_ajaran"
                                        name="id_tahun_ajaran"
                                        value={data.id_tahun_ajaran}
                                        onChange={(e) => setData('id_tahun_ajaran', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Contoh: 20251"
                                    />
                                    {/* Menampilkan error validasi */}
                                    {errors.id_tahun_ajaran && <p className="text-red-500 text-xs mt-1">{errors.id_tahun_ajaran}</p>}
                                </div>

                                {/* Input Tahun Ajaran */}
                                <div className="mb-4">
                                    <label htmlFor="tahun_ajaran" className="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                                    <input
                                        type="text"
                                        id="tahun_ajaran"
                                        name="tahun_ajaran"
                                        value={data.tahun_ajaran}
                                        onChange={(e) => setData('tahun_ajaran', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Contoh: 2025/2026"
                                    />
                                    {errors.tahun_ajaran && <p className="text-red-500 text-xs mt-1">{errors.tahun_ajaran}</p>}
                                </div>

                                {/* Input Semester */}
                                <div className="mb-4">
                                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                                    <select
                                        id="semester"
                                        name="semester"
                                        value={data.semester}
                                        onChange={(e) => setData('semester', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                    {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
                                </div>

                                {/* Input Status */}
                                <div className="mb-4">
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
                                    </select>
                                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-x-6">
                                    <Link href={route('tahun-ajaran.index')} className="text-sm font-semibold leading-6 text-gray-900">
                                        Batal
                                    </Link>
                                    <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        disabled={processing} // Tombol di-disable saat form sedang diproses
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}