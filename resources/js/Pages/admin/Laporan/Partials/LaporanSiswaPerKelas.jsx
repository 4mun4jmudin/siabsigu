function ProgressBar({ data }) {
    const total =
        (data.hadir ?? 0) + (data.sakit ?? 0) + (data.izin ?? 0) + (data.alfa ?? 0);
    const denom = total || 1;

    return (
        <div className="w-full h-3 rounded bg-gray-100 overflow-hidden flex">
            <div className="h-full bg-green-500" style={{ width: `${(data.hadir ?? 0) / denom * 100}%` }} />
            <div className="h-full bg-yellow-500" style={{ width: `${(data.sakit ?? 0) / denom * 100}%` }} />
            <div className="h-full bg-blue-500" style={{ width: `${(data.izin ?? 0) / denom * 100}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${(data.alfa ?? 0) / denom * 100}%` }} />
        </div>
    );
}

export default function LaporanSiswaPerKelas({ data }) {
    const getStatusClass = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'bg-green-100 text-green-800';
            case 'Perlu Perhatian': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Detail Kehadiran Siswa per Kelas</h3>
            <div className="space-y-5">
                {data.map((item, index) => (
                    <div key={index} className="border-b pb-4">
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