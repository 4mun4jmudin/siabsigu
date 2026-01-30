import React, { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    ArrowLeftIcon, 
    PhotoIcon, 
    XMarkIcon, 
    IdentificationIcon, 
    FingerPrintIcon, 
    QrCodeIcon 
} from '@heroicons/react/24/outline';

export default function Edit({ auth, guru }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT', // Metode PUT untuk update data dengan file upload
        id_guru: guru.id_guru,
        nama_lengkap: guru.nama_lengkap,
        nip: guru.nip || '',
        jenis_kelamin: guru.jenis_kelamin,
        status: guru.status,
        foto_profil: null,
        barcode_id: guru.barcode_id || '',
        sidik_jari_template: guru.sidik_jari_template || '',
    });

    // Setup preview foto (dari database atau upload baru)
    const [preview, setPreview] = useState(guru.foto_profil ? `/storage-public/${guru.foto_profil}` : null);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('foto_profil', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const removePhoto = () => {
        // Logic: Jika foto dihapus, kirim null. Backend harus handle penghapusan file lama.
        setData('foto_profil', null); 
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const generateBarcode = () => {
        const random = Math.floor(100000 + Math.random() * 900000);
        setData('barcode_id', `G${random}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.guru.update', guru.id_guru));
    };

    return (
        <AdminLayout user={auth.user} header="Edit Guru">
            <Head title={`Edit Guru - ${guru.nama_lengkap}`} />

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <IdentificationIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Edit Data Guru</h2>
                            <p className="text-sm text-gray-500">Perbarui informasi profil dan sistem guru.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link href={route('admin.guru.index')} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition w-full sm:w-auto">
                            <ArrowLeftIcon className="h-4 w-4"/> Kembali
                        </Link>
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition shadow-sm font-medium w-full sm:w-auto flex justify-center">
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* --- KOLOM KIRI: FOTO & IDENTITAS SISTEM --- */}
                    <div className="md:col-span-1 space-y-6">
                        
                        {/* Card Foto Profil */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <PhotoIcon className="h-4 w-4 text-gray-500" /> Foto Profil
                            </label>
                            
                            <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center transition min-h-[220px] relative ${!preview ? 'hover:bg-gray-50' : ''} bg-gray-50/30`}>
                                {preview ? (
                                    <div className="relative w-full h-48 group">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md shadow-sm" />
                                        
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 rounded-md backdrop-blur-sm">
                                            <p className="text-white text-xs font-medium">Klik tombol di bawah untuk ubah</p>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => fileInputRef.current.click()} className="bg-white text-gray-800 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-100">
                                                    Ganti
                                                </button>
                                                <button type="button" onClick={removePhoto} className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700">
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current.click()} className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-6">
                                        <div className="p-4 bg-blue-50 rounded-full mb-3 shadow-inner">
                                            <PhotoIcon className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Upload Foto Baru</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 2MB)</p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            {errors.foto_profil && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded">{errors.foto_profil}</p>}
                        </div>

                        {/* Card Identitas Sistem (Barcode & Fingerprint) */}
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <QrCodeIcon className="h-4 w-4 text-orange-500" />
                                Identitas Sistem Absensi
                            </h3>
                            
                            {/* Barcode Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Barcode ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={data.barcode_id} 
                                        onChange={e => setData('barcode_id', e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500 font-mono bg-gray-50" 
                                        placeholder="Scan / Generate"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateBarcode} 
                                        className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 shadow-sm"
                                        title="Generate Barcode Baru"
                                    >
                                        Auto
                                    </button>
                                </div>
                                {errors.barcode_id && <p className="text-red-500 text-xs mt-1">{errors.barcode_id}</p>}
                            </div>

                            {/* Fingerprint Input */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                    <FingerPrintIcon className="h-3 w-3" /> Template Sidik Jari
                                </label>
                                <textarea 
                                    rows={3}
                                    value={data.sidik_jari_template}
                                    onChange={e => setData('sidik_jari_template', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500 font-mono text-xs bg-gray-50"
                                    placeholder="Data template fingerprint (biasanya sangat panjang)..."
                                ></textarea>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">Diisi oleh mesin fingerprint</p>
                            </div>
                        </div>
                    </div>

                    {/* --- KOLOM KANAN: BIODATA & AKUN --- */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Card Biodata */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                Biodata Lengkap
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* ID Guru (Read Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Guru</label>
                                    <input 
                                        type="text" 
                                        value={data.id_guru} 
                                        disabled 
                                        className="w-full border-gray-200 bg-gray-100 text-gray-500 rounded-md shadow-sm cursor-not-allowed font-medium" 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">ID Guru tidak dapat diubah.</p>
                                </div>

                                {/* NIP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                                    <input 
                                        type="text" 
                                        value={data.nip} 
                                        onChange={e => setData('nip', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Kosongkan jika belum ada"
                                    />
                                    {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
                                </div>

                                {/* Nama Lengkap */}
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

                                {/* Jenis Kelamin */}
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

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                                    <div className="relative">
                                        <select 
                                            value={data.status} 
                                            onChange={e => setData('status', e.target.value)}
                                            className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10 font-medium ${data.status === 'Aktif' ? 'text-green-700 bg-green-50' : 'text-gray-700'}`}
                                        >
                                            <option value="Aktif">Aktif</option>
                                            <option value="Tidak Aktif">Tidak Aktif</option>
                                            <option value="Pensiun">Pensiun</option>
                                        </select>
                                        <div className={`absolute inset-y-0 right-8 flex items-center pointer-events-none`}>
                                            <span className={`h-2.5 w-2.5 rounded-full ${data.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Informasi Akun (Read Only) */}
                        <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <IdentificationIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-800">Akun Login Terhubung</h4>
                                    <p className="text-xs text-gray-500 mt-1">Data akun ini dikelola otomatis oleh sistem.</p>
                                    
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold text-gray-500">Username</p>
                                            <p className="text-sm font-mono font-medium text-gray-800 bg-white px-2 py-1 rounded border border-indigo-100 inline-block">
                                                {guru.pengguna?.username || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold text-gray-500">Level Akses</p>
                                            <p className="text-sm font-medium text-gray-800">
                                                {guru.pengguna?.level || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Tombol Shortcut ke Reset Password jika diperlukan */}
                                <div>
                                    <Link 
                                        href={route('admin.guru.reset-password', { search: guru.nama_lengkap })}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                    >
                                        Lupa Password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}