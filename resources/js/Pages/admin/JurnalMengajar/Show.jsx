import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function Show({ auth, jurnal }) {
    const displayDate = (date) => {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const displayTime = (time) => {
        return time ? time.slice(0, 5) : '-';
    }

    const statusBadgeStyle = {
        'Mengajar': 'bg-green-100 text-green-800',
        'Tugas': 'bg-blue-100 text-blue-800',
        'Digantikan': 'bg-yellow-100 text-yellow-800',
        'Kosong': 'bg-red-100 text-red-800',
    };

    const DataRow = ({ label, value }) => (
        <div className="flex flex-col md:flex-row md:items-center py-2 border-b last:border-b-0">
            <p className="font-semibold text-gray-600 w-48 shrink-0">{label}</p>
            <p className="text-gray-900 mt-1 md:mt-0">{value}</p>
        </div>
    );

    return (
        <AdminLayout user={auth.user} header="Detail Jurnal Mengajar">
            <Head title="Detail Jurnal Mengajar" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Detail Jurnal</h2>
                            <Link href={route('admin.jurnal-mengajar.index')}>
                                <PrimaryButton className="flex items-center">
                                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                    Kembali
                                </PrimaryButton>
                            </Link>
                        </div>
                        
                        {jurnal ? (
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2">Informasi Umum</h3>
                                    <DataRow label="Tanggal" value={displayDate(jurnal.tanggal)} />
                                    <DataRow label="Waktu" value={`${displayTime(jurnal.jam_masuk_kelas)} - ${displayTime(jurnal.jam_keluar_kelas)}`} />
                                    <DataRow label="Guru Pengajar" value={jurnal.jadwal_mengajar?.guru?.nama_lengkap || '-'} />
                                    <DataRow label="Kelas" value={`${jurnal.jadwal_mengajar?.kelas?.tingkat || '-'} ${jurnal.jadwal_mengajar?.kelas?.jurusan || ''}`} />
                                    <DataRow label="Mata Pelajaran" value={jurnal.jadwal_mengajar?.mapel?.nama_mapel || jurnal.jadwal_mengajar?.mataPelajaran?.nama_mapel || '-'} />
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2">Detail Mengajar</h3>
                                    <DataRow label="Status" value={<span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadgeStyle[jurnal.status_mengajar]}`}>{jurnal.status_mengajar}</span>} />
                                    {jurnal.status_mengajar === 'Digantikan' && (
                                        <DataRow label="Guru Pengganti" value={jurnal.guru_pengganti?.nama_lengkap || '-'} />
                                    )}
                                    <DataRow label="Materi Pembahasan" value={jurnal.materi_pembahasan || '-'} />
                                    <DataRow label="Diinput Oleh" value={jurnal.penginputManual?.nama_lengkap || '-'} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <p>Data jurnal tidak ditemukan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}