import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PerbandinganKelasChart({ data }) {
    const options = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: { display: false },
        },
        scales: {
            x: { stacked: true, max: 100, ticks: { callback: (value) => `${value}%` } },
            y: { stacked: true },
        },
    };

    const chartData = {
        labels: data.map(item => item.namaKelas),
        datasets: [
            { label: 'Hadir', data: data.map(item => item.persentase.hadir), backgroundColor: 'rgb(34, 197, 94)' },
            { label: 'Sakit', data: data.map(item => item.persentase.sakit), backgroundColor: 'rgb(234, 179, 8)' },
            { label: 'Izin', data: data.map(item => item.persentase.izin), backgroundColor: 'rgb(59, 130, 246)' },
            { label: 'Alfa', data: data.map(item => item.persentase.alfa), backgroundColor: 'rgb(239, 68, 68)' },
        ],
    };

    return (
         <div>
            <h3 className="font-semibold text-gray-800">Kehadiran Per Kelas</h3>
            <p className="text-sm text-gray-500 mb-4">Perbandingan persentase kehadiran antar kelas.</p>
            <div className="relative h-96">
                 <Bar options={options} data={chartData} />
            </div>
        </div>
    );
}