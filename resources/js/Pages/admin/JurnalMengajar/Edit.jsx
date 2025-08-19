import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { UserIcon } from '@heroicons/react/24/solid';

const Edit = ({ auth, jurnal, jadwalOptions, guruOptions }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        _method: 'PUT', // Penting untuk metode PUT/PATCH di Laravel
        id_jadwal: jurnal.id_jadwal || '',
        tanggal: jurnal.tanggal || '',
        jam_masuk_kelas: jurnal.jam_masuk_kelas?.slice(0, 5) || '', // Pastikan format HH:MM
        jam_keluar_kelas: jurnal.jam_keluar_kelas?.slice(0, 5) || '', // Pastikan format HH:MM
        status_mengajar: jurnal.status_mengajar || 'Mengajar',
        id_guru_pengganti: jurnal.id_guru_pengganti || '',
        materi_pembahasan: jurnal.materi_pembahasan || '',
    });

    const [isFindPenggantiModalOpen, setIsFindPenggantiModalOpen] = useState(false);
    const [availableGurus, setAvailableGurus] = useState([]);
    const [loadingPengganti, setLoadingPengganti] = useState(false);

    // Effect untuk mengisi jam_masuk_kelas dan jam_keluar_kelas secara otomatis
    // jika jadwal berubah dan input jam belum diisi manual
    useEffect(() => {
        const selectedJadwal = jadwalOptions.find(j => j.id_jadwal === data.id_jadwal);
        if (selectedJadwal) {
            setData(prev => ({
                ...prev,
                // Hanya set jika sebelumnya kosong atau sama dengan nilai default jadwal
               jam_masuk_kelas: prev.jam_masuk_kelas || selectedJadwal.jam_mulai?.slice(0, 5),
            jam_keluar_kelas: prev.jam_keluar_kelas || selectedJadwal.jam_selesai?.slice(0, 5),
            }));
        } else {
            setData(prev => ({
                ...prev,
                jam_masuk_kelas: '',
                jam_keluar_kelas: '',
            }));
        }
    }, [data.id_jadwal, jadwalOptions]);
    
    // Fungsi untuk membuka modal pencarian guru pengganti
    const openFindPenggantiModal = async () => {
        if (!data.id_jadwal) {
            toast.error('Pilih jadwal mengajar terlebih dahulu untuk mencari guru pengganti.');
            return;
        }
        setLoadingPengganti(true);
        setIsFindPenggantiModalOpen(true);
        try {
            const response = await axios.get(route('admin.jurnal-mengajar.find-pengganti', { id_jadwal: data.id_jadwal }));
            setAvailableGurus(response.data.guru_tersedia);
        } catch (error) {
            console.error('Error fetching available gurus:', error);
            toast.error('Gagal mencari guru pengganti. Pastikan jadwal mengajar valid.');
            setAvailableGurus([]);
        } finally {
            setLoadingPengganti(false);
        }
    };

    // Fungsi untuk memilih guru dari modal pencarian
    const selectGuruPengganti = (guru) => {
        setData('id_guru_pengganti', guru.id_guru);
        setIsFindPenggantiModalOpen(false);
        toast.success(`Guru ${guru.nama_lengkap} dipilih.`);
    };

    // Handler submit form
    const submit = (e) => {
        e.preventDefault();
        put(route('admin.jurnal-mengajar.update', jurnal.id_jurnal));
    };

    return (
        <AdminLayout user={auth.user} header="Edit Jurnal Mengajar">
            <Head title="Edit Jurnal Mengajar" />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Formulir Jurnal</h2>
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="id_jadwal" value="Jadwal Mengajar" />
                            <select id="id_jadwal" value={data.id_jadwal} onChange={(e) => setData('id_jadwal', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">-- Pilih Jadwal --</option>
                                {jadwalOptions.length > 0 ? (
                                    jadwalOptions.map(j => (
                                        <option key={j.id_jadwal} value={j.id_jadwal}>
                                            {j.hari}, {j.jam_mulai?.slice(0, 5) || 'XX:XX'}-{j.jam_selesai?.slice(0, 5) || 'XX:XX'} | {j.mapel?.nama_mapel || j.mataPelajaran?.nama_mapel || 'Mapel Dihapus'} ({j.kelas?.tingkat || 'Kelas Dihapus'} {j.kelas?.jurusan || ''}) - {j.guru?.nama_lengkap || 'Guru Dihapus'}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Tidak ada jadwal tersedia</option>
                                )}
                            </select>
                            <InputError message={errors.id_jadwal} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="tanggal" value="Tanggal" />
                            <TextInput id="tanggal" type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className="mt-1 block w-full" />
                            <InputError message={errors.tanggal} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="jam_masuk_kelas" value="Jam Masuk Kelas" />
                                <TextInput id="jam_masuk_kelas" type="time" value={data.jam_masuk_kelas} onChange={(e) => setData('jam_masuk_kelas', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.jam_masuk_kelas} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="jam_keluar_kelas" value="Jam Keluar Kelas" />
                                <TextInput id="jam_keluar_kelas" type="time" value={data.jam_keluar_kelas} onChange={(e) => setData('jam_keluar_kelas', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.jam_keluar_kelas} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="status_mengajar" value="Status Mengajar" />
                            <select
                                id="status_mengajar"
                                value={data.status_mengajar}
                                onChange={(e) => {
                                    setData('status_mengajar', e.target.value);
                                    if (e.target.value !== 'Digantikan') {
                                        setData('id_guru_pengganti', '');
                                    }
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="Mengajar">Mengajar</option>
                                <option value="Tugas">Tugas</option>
                                <option value="Digantikan">Digantikan</option>
                                <option value="Kosong">Kosong</option>
                            </select>
                            <InputError message={errors.status_mengajar} className="mt-2" />
                        </div>

                        {data.status_mengajar === 'Digantikan' && (
                            <div className="mt-4">
                                <InputLabel htmlFor="id_guru_pengganti" value="Guru Pengganti" />
                                <div className="flex gap-2 items-center">
                                    <select
                                        id="id_guru_pengganti"
                                        value={data.id_guru_pengganti}
                                        onChange={(e) => setData('id_guru_pengganti', e.target.value)}
                                        className="flex-1 mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {guruOptions.length > 0 ? (
                                            guruOptions.map(g => (
                                                <option key={g.id_guru} value={g.id_guru}>{g.nama_lengkap}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Tidak ada guru tersedia</option>
                                        )}
                                    </select>
                                    <SecondaryButton type="button" onClick={openFindPenggantiModal} disabled={!data.id_jadwal || processing}>
                                        <UserIcon className="h-4 w-4 mr-1" /> Cari
                                    </SecondaryButton>
                                </div>
                                <InputError message={errors.id_guru_pengganti} className="mt-2" />
                            </div>
                        )}
                        
                        <div>
                            <InputLabel htmlFor="materi_pembahasan" value="Materi Pembahasan" />
                            <textarea id="materi_pembahasan" value={data.materi_pembahasan} onChange={(e) => setData('materi_pembahasan', e.target.value)} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                            <InputError message={errors.materi_pembahasan} className="mt-2" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <SecondaryButton type="button" onClick={() => router.get(route('admin.jurnal-mengajar.index'))}>Batal</SecondaryButton>
                            <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal Cari Guru Pengganti */}
            <Modal show={isFindPenggantiModalOpen} onClose={() => setIsFindPenggantiModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Cari Guru Pengganti</h2>
                    {loadingPengganti ? (
                        <div className="text-center py-8">Memuat daftar guru...</div>
                    ) : (
                        <div>
                            {availableGurus.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {availableGurus.map(guru => (
                                        <div key={guru.id_guru} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">{guru.nama_lengkap}</p>
                                                <p className="text-sm text-gray-500">NIP: {guru.nip}</p>
                                            </div>
                                            <PrimaryButton type="button" onClick={() => selectGuruPengganti(guru)}>Pilih</PrimaryButton>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">Tidak ada guru yang tersedia di jadwal ini.</div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default Edit;