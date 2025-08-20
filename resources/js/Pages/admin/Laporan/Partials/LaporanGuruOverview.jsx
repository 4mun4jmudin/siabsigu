import React from 'react';

const ProgressBar = ({ data }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
        return <div className="w-full bg-gray-200 rounded-full h-4"></div>;
    }
    return (
        <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
            <div className="h-4 bg-green-500" style={{ width: `${(data.hadir / total) * 100}%` }} title={`Hadir: ${data.hadir}%`}></div>
            <div className="h-4 bg-yellow-500" style={{ width: `${(data.sakit / total) * 100}%` }} title={`Sakit: ${data.sakit}%`}></div>
            <div className="h-4 bg-blue-500" style={{ width: `${(data.izin / total) * 100}%` }} title={`Izin: ${data.izin}%`}></div>
            <div className="h-4 bg-red-500" style={{ width: `${(data.alfa / total) * 100}%` }} title={`Alfa: ${data.alfa}%`}></div>
        </div>
    );
};

export default function LaporanSiswaPerKelas({ data }) {
    const getStatusClass = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'bg-green-100 text-green-800';
            case 'Baik': return 'bg-blue-100 text-blue-800';
            case 'Cukup': return 'bg-yellow-100 text-yellow-800';
            case 'Perlu Perhatian': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Detail Kehadiran Siswa per Kelas</h3>
            <div className="space-y-5">
                {data.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-bold text-gray-900">{item.namaKelas}</p>
                                <p className="text-sm text-gray-500">Wali Kelas: {item.waliKelas}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                        <ProgressBar data={item.persentase} />
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                            <span>H: {item.persentase.hadir}%</span>
                            <span>S: {item.persentase.sakit}%</span>
                            <span>I: {item.persentase.izin}%</span>
                            <span>A: {item.persentase.alfa}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}