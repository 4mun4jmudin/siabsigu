import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import { ArrowLeftIcon } from 'lucide-react';

// Komponen untuk baris data
const DetailRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 col-span-2">{value || '-'}</dd>
    </div>
);

export default function Show({ auth, jurnal }) {

    const displayDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <GuruLayout user={auth.user} header="Detail Jurnal Mengajar">
            <Head title="Detail Jurnal" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href={route('guru.jurnal.index')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Kembali ke Daftar Jurnal
                    </Link>
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b">
                        <h1 className="text-xl font-bold text-gray-800">Detail Jurnal</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {displayDate(jurnal.tanggal)}
                        </p>
                    </div>

                    <div className="p-6">
                        <dl>
                            <DetailRow label="Kelas" value={`${jurnal.jadwal_mengajar.kelas.tingkat} ${jurnal.jadwal_mengajar.kelas.jurusan}`} />
                            <DetailRow label="Mata Pelajaran" value={jurnal.jadwal_mengajar.mata_pelajaran.nama_mapel} />
                            <DetailRow label="Waktu Aktual" value={`${jurnal.jam_masuk_kelas.substring(0,5)} - ${jurnal.jam_keluar_kelas.substring(0,5)} WIB`} />
                            <DetailRow label="Status" value={jurnal.status_mengajar} />
                            
                            <div className="grid grid-cols-3 gap-4 py-3">
                                <dt className="text-sm font-medium text-gray-500">Materi Pembahasan</dt>
                                <dd className="text-sm text-gray-900 col-span-2 whitespace-pre-wrap">{jurnal.materi_pembahasan}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </GuruLayout>
    );
}