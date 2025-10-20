// File: resources/js/Pages/Guru/Jurnal/Create.jsx

import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import { AlertTriangle, Info } from 'lucide-react';

// Terima prop 'absensiHariIni' dari controller
export default function Create({ auth, jadwalOptions, absensiHariIni }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id_jadwal: '',
        tanggal: new Date().toISOString().slice(0, 10),
        jam_masuk_kelas: '',
        jam_keluar_kelas: '',
        status_mengajar: 'Mengajar',
        materi_pembahasan: '',
    });

    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'info' atau 'warning'

    // --- LOGIKA CERDAS YANG DIPERBARUI ---
    useEffect(() => {
        const isToday = data.tanggal === new Date().toISOString().slice(0, 10);

        if (isToday) {
            if (!absensiHariIni) {
                // KASUS 1: Guru belum absen sama sekali hari ini
                setIsFormDisabled(true);
                setInfoMessage('Anda harus melakukan absensi terlebih dahulu sebelum dapat mengisi jurnal untuk hari ini.');
                setMessageType('warning');
            } else {
                const statusAbsen = absensiHariIni.status_kehadiran;
                if (statusAbsen === 'Sakit' || statusAbsen === 'Izin' || statusAbsen === 'Alfa') {
                    // KASUS 2: Guru tercatat tidak hadir
                    setData(prevData => ({
                        ...prevData,
                        status_mengajar: statusAbsen,
                        materi_pembahasan: `Guru tidak dapat mengajar karena ${statusAbsen.toLowerCase()}. Keterangan: ${absensiHariIni.keterangan || 'Tidak ada keterangan.'}`
                    }));
                    setIsFormDisabled(true);
                    setInfoMessage(`Status kehadiran Anda hari ini adalah "${statusAbsen}", Anda tidak dapat mengisi jurnal mengajar.`);
                    setMessageType('warning');
                } else {
                    // KASUS 3: Guru tercatat Hadir
                    setIsFormDisabled(false);
                    setInfoMessage('');
                }
            }
        } else {
            // KASUS 4: Guru memilih tanggal selain hari ini
            setIsFormDisabled(false);
            setInfoMessage('Anda sedang mengisi jurnal untuk tanggal yang lalu. Pastikan data yang diinput sudah benar.');
            setMessageType('info');
        }
    }, [data.tanggal, absensiHariIni]);
    // --- AKHIR LOGIKA CERDAS ---

    useEffect(() => {
        const selectedJadwal = jadwalOptions.find(j => j.id_jadwal === data.id_jadwal);
        if (selectedJadwal) {
            setData(prevData => ({
                ...prevData,
                jam_masuk_kelas: selectedJadwal.jam_mulai.substring(0, 5),
                jam_keluar_kelas: selectedJadwal.jam_selesai.substring(0, 5),
            }));
        }
    }, [data.id_jadwal]);

    const submit = (e) => {
        e.preventDefault();
        post(route('guru.jurnal.store'));
    };

    return (
        <GuruLayout user={auth.user} header="Input Jurnal Mengajar">
            <Head title="Input Jurnal" />
            
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6">Formulir Jurnal Mengajar</h1>

                {/* Tampilkan pesan informasi jika ada */}
                {infoMessage && (
                    <div className={`mb-6 p-4 border-l-4 ${messageType === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-blue-50 border-blue-400 text-blue-800'}`}>
                        <div className="flex items-start">
                            {messageType === 'warning' ? <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" /> : <Info className="h-5 w-5 mr-3 flex-shrink-0" />}
                            <div>
                                <h3 className="font-bold">{messageType === 'warning' ? 'Perhatian' : 'Informasi'}</h3>
                                <p className="text-sm">{infoMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="id_jadwal" value="Pilih Jadwal Mengajar" />
                        <select
                            id="id_jadwal"
                            value={data.id_jadwal}
                            onChange={e => setData('id_jadwal', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                            disabled={isFormDisabled}
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
                            className="mt-1 block w-full disabled:bg-gray-100"
                            // Form tanggal tidak perlu di-disable agar guru bisa memilih tanggal lain
                        />
                        <InputError message={errors.tanggal} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="jam_masuk_kelas" value="Jam Masuk Aktual" />
                            <TextInput id="jam_masuk_kelas" type="time" value={data.jam_masuk_kelas} onChange={e => setData('jam_masuk_kelas', e.target.value)} className="mt-1 block w-full disabled:bg-gray-100" disabled={isFormDisabled}/>
                            <InputError message={errors.jam_masuk_kelas} className="mt-2" />
                        </div>
                        <div>
                             <InputLabel htmlFor="jam_keluar_kelas" value="Jam Keluar Aktual" />
                            <TextInput id="jam_keluar_kelas" type="time" value={data.jam_keluar_kelas} onChange={e => setData('jam_keluar_kelas', e.target.value)} className="mt-1 block w-full disabled:bg-gray-100" disabled={isFormDisabled}/>
                            <InputError message={errors.jam_keluar_kelas} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="materi_pembahasan" value="Materi Pembahasan" />
                        <textarea
                            id="materi_pembahasan"
                            value={data.materi_pembahasan}
                            onChange={e => setData('materi_pembahasan', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                            rows="4"
                            disabled={isFormDisabled}
                        ></textarea>
                         <InputError message={errors.materi_pembahasan} className="mt-2" />
                    </div>
                    
                    <div className="flex items-center justify-end gap-4">
                        <Link href={route('guru.jurnal.index')}><SecondaryButton>Batal</SecondaryButton></Link>
                        <PrimaryButton disabled={processing || isFormDisabled}>
                            {processing ? 'Menyimpan...' : 'Simpan Jurnal'}
                        </PrimaryButton> 
                    </div>
                </form>
            </div>
        </GuruLayout>
    );
}