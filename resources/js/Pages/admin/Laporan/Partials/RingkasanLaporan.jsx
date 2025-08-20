import React from 'react';

const ListItem = ({ text, color }) => {
    const colorClass = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
    }[color] || 'bg-gray-500';

    return (
        <li className="flex items-start">
            <span className={`mt-1.5 mr-2 flex-shrink-0 h-2 w-2 rounded-full ${colorClass}`}></span>
            <span className="text-sm text-gray-700">{text}</span>
        </li>
    );
};

export default function RingkasanLaporan({ data }) {
    if (!data || !data.pencapaian || !data.rekomendasi) {
        return null; 
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Ringkasan Laporan</h3>
            <p className="text-sm text-gray-500 mb-6">Kesimpulan dan rekomendasi berdasarkan data kehadiran.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Pencapaian</h4>
                    <ul className="space-y-2">
                        {data.pencapaian.map((item, index) => (
                            <ListItem key={index} text={item.text} color={item.color} />
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Rekomendasi</h4>
                    <ul className="space-y-2">
                        {data.rekomendasi.map((item, index) => (
                            <ListItem key={index} text={item.text} color={item.color} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}