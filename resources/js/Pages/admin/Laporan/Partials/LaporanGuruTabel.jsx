import React from 'react';

export default function LaporanGuruTabel({ data }) {
     const getStatusClass = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'bg-green-100 text-green-800';
            case 'Baik': return 'bg-blue-100 text-blue-800';
            case 'Cukup': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
             <h3 className="text-xl font-semibold mb-4 text-gray-800">Detail Kehadiran Guru</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Guru</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Hari</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hadir</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sakit/Izin/Alfa</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Persentase</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((guru, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guru.namaGuru}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.totalHariKerja}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.hadir}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${guru.sakit}/${guru.izin}/${guru.alfa}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.persentaseKehadiran}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(guru.status)}`}>
                                        {guru.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}