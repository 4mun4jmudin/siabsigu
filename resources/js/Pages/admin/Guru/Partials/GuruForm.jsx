import React, { useState } from 'react';

export default function GuruForm({ data, setData, errors, users, guru = null }) {
    const [preview, setPreview] = useState(guru?.foto_profil ? `/storage/${guru.foto_profil}` : null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('foto_profil', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kolom Kiri - Foto & Opsi Absensi */}
            <div className="md:col-span-1 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Foto Profil</h3>
                    <p className="mt-1 text-sm text-gray-600">Upload foto profil guru.</p>
                    <div className="mt-4">
                        <div className="w-40 h-40 bg-gray-100 rounded-full mx-auto overflow-hidden">
                            <img 
                                src={preview || `https://ui-avatars.com/api/?name=${data.nama_lengkap || 'G'}&color=7F9CF5&background=EBF4FF`} 
                                alt="Preview"
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        <input type="file" onChange={handleFileChange} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {errors.foto_profil && <p className="text-red-500 text-xs mt-1">{errors.foto_profil}</p>}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900">Data Absensi</h3>
                    <p className="mt-1 text-sm text-gray-600">Informasi untuk sistem absensi.</p>
                     <div className="mt-4">
                        <label className="block font-medium text-sm text-gray-700">Barcode ID</label>
                        <input type="text" value={data.barcode_id || ''} onChange={e => setData('barcode_id', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        {errors.barcode_id && <p className="text-red-500 text-xs mt-1">{errors.barcode_id}</p>}
                    </div>
                    <div className="mt-4">
                        <label className="block font-medium text-sm text-gray-700">Template Sidik Jari</label>
                        <textarea value={data.sidik_jari_template || ''} onChange={e => setData('sidik_jari_template', e.target.value)} rows="4" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        <p className="mt-1 text-xs text-gray-500">Field ini biasanya diisi otomatis oleh alat pemindai sidik jari.</p>
                        {errors.sidik_jari_template && <p className="text-red-500 text-xs mt-1">{errors.sidik_jari_template}</p>}
                    </div>
                </div>
            </div>

            {/* Kolom Kanan - Detail Informasi */}
            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Utama</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium text-sm text-gray-700">ID Guru <span className="text-red-500">*</span></label>
                            <input type="text" value={data.id_guru} onChange={e => setData('id_guru', e.target.value)} disabled={!!guru} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                            {errors.id_guru && <p className="text-red-500 text-xs mt-1">{errors.id_guru}</p>}
                        </div>
                        <div>
                            <label className="block font-medium text-sm text-gray-700">NIP</label>
                            <input type="text" value={data.nip || ''} onChange={e => setData('nip', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block font-medium text-sm text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
                            <input type="text" value={data.nama_lengkap} onChange={e => setData('nama_lengkap', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            {errors.nama_lengkap && <p className="text-red-500 text-xs mt-1">{errors.nama_lengkap}</p>}
                        </div>
                         <div>
                            <label className="block font-medium text-sm text-gray-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                            <select value={data.jenis_kelamin} onChange={e => setData('jenis_kelamin', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>
                         <div>
                            <label className="block font-medium text-sm text-gray-700">Status <span className="text-red-500">*</span></label>
                            <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="Aktif">Aktif</option>
                                <option value="Tidak Aktif">Tidak Aktif</option>
                                <option value="Pensiun">Pensiun</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block font-medium text-sm text-gray-700">Hubungkan Akun User</label>
                            <select value={data.id_pengguna || ''} onChange={e => setData('id_pengguna', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Tidak terhubung</option>
                                {users.map(user => (
                                    <option key={user.id_pengguna} value={user.id_pengguna}>{user.username} - {user.nama_lengkap}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Hubungkan ke akun agar guru bisa login.</p>
                            {errors.id_pengguna && <p className="text-red-500 text-xs mt-1">{errors.id_pengguna}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
