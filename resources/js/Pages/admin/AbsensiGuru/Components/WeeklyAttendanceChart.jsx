import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Mendaftarkan komponen-komponen yang akan digunakan oleh Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function WeeklyAttendanceChart({ chartData }) {
    // Opsi untuk kustomisasi tampilan grafik
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top', // Posisi legenda (Hadir, Sakit, Izin, Alfa)
            },
            title: {
                display: false, // Judul di dalam grafik (kita buat di luar)
            },
        },
        scales: {
            x: {
                stacked: true, // Menumpuk bar untuk status yang berbeda pada hari yang sama
            },
            y: {
                stacked: true,
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Jumlah Guru'
                }
            },
        },
    };

    // Memformat data dari controller agar sesuai dengan yang dibutuhkan oleh Chart.js
    const data = {
        labels: chartData.labels, // Label tanggal (e.g., '15 Agu', '16 Agu')
        datasets: chartData.datasets.map(dataset => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor,
        })),
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Tren Kehadiran Mingguan</h2>
            <p className="text-sm text-gray-500 mb-4">Visualisasi rekapitulasi kehadiran guru selama 7 hari terakhir.</p>
            <div className="relative h-96">
                <Bar options={options} data={data} />
            </div>
        </div>
    );
}
