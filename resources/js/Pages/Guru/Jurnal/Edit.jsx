// File: resources/js/Pages/Guru/Jurnal/Edit.jsx

import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Edit({ auth, jurnal, jadwalOptions }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        id_jadwal: jurnal.id_jadwal || '',
        tanggal: jurnal.tanggal || '',
        jam_masuk_kelas: jurnal.jam_masuk_kelas?.substring(0, 5) || '',
        jam_keluar_kelas: jurnal.jam_keluar_kelas?.substring(0, 5) || '',
        status_mengajar: jurnal.status_mengajar || 'Mengajar',
        materi_pembahasan: jurnal.materi_pembahasan || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('guru.jurnal.update', jurnal.id_jurnal));
    };

    return (
        <GuruLayout user={auth.user} header="Edit Jurnal Mengajar">
            <Head title="Edit Jurnal" />
            
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6">Edit Formulir Jurnal Mengajar</h1>
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="id_jadwal" value="Pilih Jadwal Mengajar" />
                        <select
                            id="id_jadwal"
                            value={data.id_jadwal}
                            onChange={e => setData('id_jadwal', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="">--- Pilih Jadwal ---</option>
                            {jadwalOptions.map(jadwal => (
                                <option key={jadwal.id_jadwal} value={jadwal.id_jadwal}>
                                    {jadwal.hari}, {jadwal.jam_mulai.substring(0,5)} - {jadwal.mata_pelajaran.nama_mapel} ({jadwal.kelas.tingkat} {jadwal.kelas.jurusan})
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.id_jadwal} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="tanggal" value="Tanggal Mengajar" />
                        <TextInput
                            id="tanggal"
                            type="date"
                            value={data.tanggal}
                            onChange={e => setData('tanggal', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.tanggal} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="jam_masuk_kelas" value="Jam Masuk Aktual" />
                            <TextInput id="jam_masuk_kelas" type="time" value={data.jam_masuk_kelas} onChange={e => setData('jam_masuk_kelas', e.target.value)} className="mt-1 block w-full"/>
                            <InputError message={errors.jam_masuk_kelas} className="mt-2" />
                        </div>
                        <div>
                             <InputLabel htmlFor="jam_keluar_kelas" value="Jam Keluar Aktual" />
                            <TextInput id="jam_keluar_kelas" type="time" value={data.jam_keluar_kelas} onChange={e => setData('jam_keluar_kelas', e.target.value)} className="mt-1 block w-full"/>
                            <InputError message={errors.jam_keluar_kelas} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="materi_pembahasan" value="Materi Pembahasan" />
                        <textarea
                            id="materi_pembahasan"
                            value={data.materi_pembahasan}
                            onChange={e => setData('materi_pembahasan', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            rows="4"
                        ></textarea>
                         <InputError message={errors.materi_pembahasan} className="mt-2" />
                    </div>
                    
                    <div className="flex items-center justify-end gap-4">
                        <Link href={route('guru.jurnal.index')}><SecondaryButton>Batal</SecondaryButton></Link>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Memperbarui...' : 'Simpan Perubahan'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuruLayout>
    );
}