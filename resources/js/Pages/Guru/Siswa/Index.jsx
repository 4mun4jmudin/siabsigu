import React, { useState, useEffect, useRef } from 'react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Users, Search, X } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination'; // Pastikan Anda punya komponen ini

const SiswaRow = ({ siswa }) => (
    <tr className="bg-white border-b hover:bg-gray-50">
        <td className="p-4">
            <div className="flex items-center">
                <img
                    className="w-10 h-10 rounded-full object-cover"
                    src={siswa.foto_profil_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.nama_lengkap)}&background=random`}
                    alt={siswa.nama_lengkap}
                />
                <div className="pl-3">
                    <div className="text-base font-semibold">{siswa.nama_lengkap}</div>
                    <div className="font-normal text-gray-500">{siswa.nis} / {siswa.nisn}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            {siswa.kelas ? `${siswa.kelas.tingkat} ${siswa.kelas.jurusan}` : 'N/A'}
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center">
                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${siswa.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {siswa.status}
            </div>
        </td>
        <td className="px-6 py-4">
            <Link
                href={route('guru.siswa.show', siswa.id_siswa)}
                className="font-medium text-sky-600 hover:underline"
            >
                Lihat Detail
            </Link>
        </td>
    </tr>
);

export default function SiswaIndex({ auth, siswas, kelasFilterOptions, filters }) {
    // useForm untuk controlled inputs
    const { data, setData, get, processing } = useForm({
        kelas: filters.kelas || '',
        search: filters.search || '',
    });

    // flag untuk mencegah effect berjalan pada mount pertama (sehingga tidak menimpa page dari pagination)
    const isFirstRender = useRef(true);

    // debounce timer ref agar cleanup aman
    const debounceRef = useRef(null);

    // Hanya pantau perubahan filter yang relevan (search & kelas).
    // Ketika user mengubah filter, kita akan melakukan GET ke route dan reset page ke 1.
    useEffect(() => {
        // Melewatkan eksekusi pada mount pertama (mis. navigasi pagination Inertia)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Debounce: tunggu 300ms setelah user berhenti mengetik / memilih filter
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            // Saat filter berubah, request ke server dengan page=1
            get(route('guru.siswa.index'), {
                // kirimkan query params explicit agar server mengembalikan page 1
                params: { kelas: data.kelas || undefined, search: data.search || undefined, page: 1 },
                preserveState: true,   // pertahankan state form di client
                replace: true,         // ganti history entry supaya tidak memenuhi history saat mengetik
                preserveScroll: true,
            });
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.kelas, data.search]); // hanya tergantung nilai yang benar-benar kita butuhkan

    const handleReset = () => {
        // reset local form state
        setData('kelas', '');
        setData('search', '');

        // langsung minta server dengan page=1 reset
        get(route('guru.siswa.index'), {
            params: { kelas: '', search: '', page: 1 },
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    return (
        <GuruLayout user={auth.user} header="Daftar Siswa Saya">
            <Head title="Daftar Siswa" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white relative shadow-md sm:rounded-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
                        <div className="w-full md:w-1/2">
                            <TextInput
                                type="search"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                className="w-full"
                                placeholder="Cari berdasarkan nama atau NIS..."
                                aria-label="Cari siswa"
                            />
                        </div>
                        <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3">
                            <select
                                value={data.kelas}
                                onChange={(e) => setData('kelas', e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                aria-label="Filter kelas"
                            >
                                <option value="">Semua Kelas</option>
                                {kelasFilterOptions.map((k) => (
                                    <option key={k.id_kelas} value={k.id_kelas}>
                                        {k.tingkat} {k.jurusan}
                                    </option>
                                ))}
                            </select>
                            {(data.kelas || data.search) && (
                                <button onClick={handleReset} className="text-gray-500 hover:text-gray-700" aria-label="Reset filter">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="p-4">Nama Siswa</th>
                                    <th scope="col" className="px-6 py-3">Kelas</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {siswas.data && siswas.data.length > 0 ? (
                                    siswas.data.map(siswa => <SiswaRow key={siswa.id_siswa} siswa={siswa} />)
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">
                                            Tidak ada siswa yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <nav className="p-4">
                        <Pagination links={siswas.links} />
                    </nav>
                </div>
            </div>
        </GuruLayout>
    );
}
