import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        id_guru: '',
        nama_lengkap: '',
        nip: '',
        jenis_kelamin: 'Laki-laki',
        status: 'Aktif',
        foto_profil: null,
        barcode_id: '',
        sidik_jari_template: '',
    });

    // State untuk preview foto
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef();

    // Handle upload foto
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('foto_profil', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Hapus foto dari preview & state
    const removePhoto = () => {
        setData('foto_profil', null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Generate Barcode Random
    const generateBarcode = () => {
        const random = Math.floor(100000 + Math.random() * 900000);
        setData('barcode_id', `G${random}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.guru.store'));
    };

    return (
        <AdminLayout user={auth.user} header="Tambah Guru">
            <Head title="Tambah Guru" />

            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Tambah Guru Baru</h2>
                        <p className="text-sm text-gray-500">Isi biodata guru di bawah ini. Akun login akan dibuat secara otomatis oleh sistem.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.guru.index')} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition">
                            <ArrowLeftIcon className="h-4 w-4"/> Kembali
                        </Link>
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition shadow-sm font-medium">
                            {processing ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* KOLOM KIRI: FOTO & SYSTEM INFO */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Upload Foto */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Foto Profil</label>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition min-h-[220px] relative bg-gray-50/30">
                                {preview ? (
                                    <div className="relative w-full h-48 group">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-md">
                                            <button type="button" onClick={removePhoto} className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700">
                                                Hapus Foto
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current.click()} className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-6">
                                        <div className="p-3 bg-blue-50 rounded-full mb-3">
                                            <PhotoIcon className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Klik untuk upload</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 2MB)</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>
                            {errors.foto_profil && <p className="text-red-500 text-xs mt-2">{errors.foto_profil}</p>}
                        </div>

                        {/* Barcode & Fingerprint */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                Identitas Sistem
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Barcode ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={data.barcode_id} 
                                        onChange={e => setData('barcode_id', e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500" 
                                        placeholder="Scan / Generate"
                                    />
                                    <button type="button" onClick={generateBarcode} className="px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs font-medium hover:bg-orange-100">Auto</button>
                                </div>
                                {errors.barcode_id && <p className="text-red-500 text-xs mt-1">{errors.barcode_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Template Sidik Jari</label>
                                <textarea 
                                    rows={3}
                                    value={data.sidik_jari_template}
                                    onChange={e => setData('sidik_jari_template', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500"
                                    placeholder="Data template fingerprint (opsional)..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: BIODATA */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                Biodata Lengkap
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Guru <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={data.id_guru} 
                                        onChange={e => setData('id_guru', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Contoh: G001"
                                    />
                                    {errors.id_guru && <p className="text-red-500 text-xs mt-1">{errors.id_guru}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={data.nip} 
                                        onChange={e => setData('nip', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nomor Induk Pegawai"
                                    />
                                    {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={data.nama_lengkap} 
                                        onChange={e => setData('nama_lengkap', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nama Lengkap beserta gelar"
                                    />
                                    {errors.nama_lengkap && <p className="text-red-500 text-xs mt-1">{errors.nama_lengkap}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                                    <select 
                                        value={data.jenis_kelamin} 
                                        onChange={e => setData('jenis_kelamin', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                                    <select 
                                        value={data.status} 
                                        onChange={e => setData('status', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
                                        <option value="Pensiun">Pensiun</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900 mb-1">Informasi Akun Otomatis</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Sistem akan membuatkan akun login secara otomatis dengan detail berikut:
                                    </p>
                                    <ul className="text-xs text-blue-800 list-disc list-inside mt-1 font-medium">
                                        <li>Username: <code>guru#[nama_tanpa_spasi]</code> (Contoh: <code>guru#ahmad</code>)</li>
                                        <li>Password Default: <code>alhawari#cibiuk</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}