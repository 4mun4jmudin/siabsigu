import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

// Fungsi untuk mendapatkan warna badge berdasarkan status
const getStatusBadge = (status) => {
    const styles = {
        Hadir: 'bg-green-100 text-green-800',
        Sakit: 'bg-yellow-100 text-yellow-800',
        Izin: 'bg-blue-100 text-blue-800',
        Alfa: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
};

export default function ModalDetailHarian({ isOpen, onClose, data, tanggal, namaKelas }) {
    if (!isOpen) return null;

    return (
        // Latar belakang overlay
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
            onClick={onClose} // Menutup modal saat klik di luar
        >
            {/* Konten Modal */}
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Mencegah penutupan saat klik di dalam
            >
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Detail Kehadiran Harian</h3>
                        <p className="text-sm text-gray-500">{namaKelas} - {tanggal}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>
                
                {/* Body Modal dengan scroll */}
                <div className="overflow-y-auto p-4">
                    {data && data.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.nis}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.jam_masuk}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Memuat data atau tidak ada absensi pada tanggal ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
}