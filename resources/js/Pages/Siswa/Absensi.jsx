import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import SiswaLayout from '@/Layouts/SiswaLayout';
import { ClockIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

// Komponen untuk menampilkan jam digital
const DigitalClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-6xl font-mono font-bold text-gray-800">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
    );
};

export default function Absensi({ siswa, absensiHariIni }) {
    const { post, processing } = useForm();
    const { flash } = usePage().props;

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (flash?.success || flash?.error) {
            const message = flash.success || flash.error;
            const type = flash.success ? 'success' : 'error';
            setToast({ show: true, message, type });

            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 3000); // Hide after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleAbsen = (e) => {
        e.preventDefault();
        post(route('siswa.absensi.store'));
    };

    const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <SiswaLayout header="Halaman Absensi">
            <Head title="Absensi Siswa" />

            {/* Notifikasi Toast */}
            {toast.show && (
                <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Header Sambutan */}
                    <div className="mb-6">
                        <img 
                            src={siswa.foto_profil ? `/storage/${siswa.foto_profil}` : `https://ui-avatars.com/api/?name=${siswa.nama_lengkap}&background=4f46e5&color=fff`}
                            alt="Foto Profil"
                            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-md -mt-20"
                        />
                        <h1 className="text-2xl font-bold text-gray-800 mt-4">
                            Selamat Datang, {siswa.nama_panggilan || siswa.nama_lengkap}!
                        </h1>
                        <p className="text-sm text-gray-500">
                            {siswa.kelas.tingkat} {siswa.kelas.jurusan} | NIS: {siswa.nis}
                        </p>
                    </div>

                    {/* Jam & Tanggal */}
                    <div className="bg-gray-50 rounded-lg p-6 my-8">
                        <DigitalClock />
                        <p className="text-lg text-gray-600 mt-2">{tanggalHariIni}</p>
                    </div>

                    {/* Status Absensi & Tombol Aksi */}
                    {absensiHariIni ? (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg" role="alert">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-8 w-8 mr-3" />
                                <div>
                                    <p className="font-bold">Anda Sudah Absen Hari Ini</p>
                                    <p className="text-sm">
                                        Absen masuk terekam pada pukul <strong>{new Date(`1970-01-01T${absensiHariIni.jam_masuk}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-4">
                                Silakan tekan tombol di bawah ini untuk merekam kehadiran Anda hari ini.
                            </p>
                            <form onSubmit={handleAbsen}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-transform transform hover:scale-105 disabled:bg-sky-400 disabled:cursor-not-allowed"
                                >
                                    <ClockIcon className="h-6 w-6 mr-3" />
                                    {processing ? 'Memproses...' : 'Absen Masuk Sekarang'}
                                </button>
                            </form>
                        </div>
                    )}

                     {/* Informasi Tambahan */}
                     <div className="mt-8 text-left bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg relative" role="alert">
                        <div className="flex items-start">
                            <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5"/>
                            <div>
                                <strong className="font-bold">Perhatian!</strong>
                                <span className="block sm:inline ml-1 text-sm">Pastikan Anda melakukan absensi sesuai dengan jam masuk yang telah ditentukan untuk menghindari catatan keterlambatan.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SiswaLayout>
    );
}