import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Mendaftarkan komponen-komponen yang akan digunakan oleh Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function KehadiranMingguanChart({ data }) {
    // Opsi untuk kustomisasi tampilan grafik
    const options = {
        responsive: true,
        maintainAspectRatio: false, // Penting agar tinggi grafik bisa diatur
        plugins: {
            legend: {
                position: 'bottom', // Posisi legenda (Siswa, Guru) di bawah
            },
            title: {
                display: false, // Kita tidak perlu judul di dalam canvas
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                suggestedMin: 85, // Sumbu Y dimulai dari 85% untuk detail lebih baik
                suggestedMax: 100, // Sumbu Y berakhir di 100%
                ticks: {
                    // Menambahkan simbol '%' di belakang angka sumbu Y
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
        },
    };

    // Memformat data dari controller agar sesuai dengan yang dibutuhkan Chart.js
    const chartData = {
        labels: data?.labels || [], // ['Minggu 1', 'Minggu 2', ...]
        datasets: [
            {
                label: 'Siswa',
                data: data?.siswaData || [],
                backgroundColor: '#3b82f6', // Biru
                borderRadius: 4,
            },
            {
                label: 'Guru',
                data: data?.guruData || [],
                backgroundColor: '#16a34a', // Hijau
                borderRadius: 4,
            }
        ],
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Kehadiran Mingguan</h3>
            <p className="text-sm text-gray-500 mb-4">Persentase kehadiran siswa dan guru per minggu dalam bulan ini</p>
            <div className="relative h-96">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
}