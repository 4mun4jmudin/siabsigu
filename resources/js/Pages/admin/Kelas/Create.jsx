import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function Create({ auth, guruOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        id_kelas: '',
        tingkat: '',
        jurusan: '',
        id_wali_kelas: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.kelas.store'));
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Kelas">
            <Head title="Tambah Kelas" />
            
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">Formulir Data Kelas Baru</h2>
                        <p className="text-sm text-gray-500 mt-1">Isi detail di bawah ini untuk membuat kelas baru.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="id_kelas" className="block font-medium text-sm text-gray-700">
                                    ID Kelas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="id_kelas"
                                    type="text"
                                    value={data.id_kelas}
                                    onChange={e => setData('id_kelas', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    placeholder="Contoh: KEL001"
                                />
                                {errors.id_kelas && <p className="text-red-500 text-xs mt-1">{errors.id_kelas}</p>}
                            </div>
                            <div>
                                <label htmlFor="tingkat" className="block font-medium text-sm text-gray-700">
                                    Tingkat <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="tingkat"
                                    type="text"
                                    value={data.tingkat}
                                    onChange={e => setData('tingkat', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    placeholder="Contoh: X, XI, atau XII"
                                />
                                {errors.tingkat && <p className="text-red-500 text-xs mt-1">{errors.tingkat}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="jurusan" className="block font-medium text-sm text-gray-700">
                                Jurusan (Opsional)
                            </label>
                            <input
                                id="jurusan"
                                type="text"
                                value={data.jurusan}
                                onChange={e => setData('jurusan', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                placeholder="Contoh: Rekayasa Perangkat Lunak"
                            />
                            {errors.jurusan && <p className="text-red-500 text-xs mt-1">{errors.jurusan}</p>}
                        </div>

                        <div>
                            <label htmlFor="id_wali_kelas" className="block font-medium text-sm text-gray-700">
                                Wali Kelas (Opsional)
                            </label>
                            <select
                                id="id_wali_kelas"
                                value={data.id_wali_kelas}
                                onChange={e => setData('id_wali_kelas', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Pilih Wali Kelas</option>
                                {guruOptions.map(guru => (
                                    <option key={guru.id_guru} value={guru.id_guru}>
                                        {guru.nama_lengkap}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Hanya guru yang belum menjadi wali kelas yang akan tampil.</p>
                            {errors.id_wali_kelas && <p className="text-red-500 text-xs mt-1">{errors.id_wali_kelas}</p>}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-4">
                        <button 
                            type="submit" 
                            className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 disabled:opacity-25 transition" 
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Kelas'}
                        </button>
                        <Link 
                            href={route('admin.kelas.index')} 
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold text-xs uppercase hover:bg-gray-300 transition"
                        >
                            Batal
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
