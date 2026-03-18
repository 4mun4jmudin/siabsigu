import React from 'react';
import Skeleton from '@/Components/Skeleton';

/**
 * Skeleton loader untuk halaman Detail Profil Siswa.
 * Meniru layout: sidebar profil (foto, nama, biodata) + area konten tab.
 *
 * Contoh: <SkeletonProfile />
 */
export default function SkeletonProfile() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* === Sidebar Profil === */}
            <aside className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex flex-col items-center text-center">
                        {/* Foto Profil (lingkaran) */}
                        <Skeleton className="w-28 h-28 rounded-full" />

                        {/* Nama */}
                        <Skeleton className="h-5 w-40 mt-4" />

                        {/* Status Badge */}
                        <Skeleton className="h-5 w-16 rounded-full mt-3" />

                        {/* NIS */}
                        <Skeleton className="h-3 w-28 mt-3" />

                        {/* Kelas */}
                        <Skeleton className="h-3 w-24 mt-2" />
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-16 rounded-md" />
                        <Skeleton className="h-9 w-20 rounded-md" />
                    </div>

                    {/* Extra Bio Info (Tempat Lahir, NISN, Agama) */}
                    <div className="mt-6 space-y-2">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </aside>

            {/* === Area Konten (Tab) === */}
            <section className="lg:col-span-3 space-y-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-32 rounded-md" />
                        <Skeleton className="h-8 w-28 rounded-md" />
                        <Skeleton className="h-8 w-28 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                </div>

                {/* Tab Content — Blok kotak besar meniru konten biodata/riwayat */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-full max-w-[200px]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Blok kedua — meniru bagian riwayat/tabel */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                    <Skeleton className="h-5 w-48" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
