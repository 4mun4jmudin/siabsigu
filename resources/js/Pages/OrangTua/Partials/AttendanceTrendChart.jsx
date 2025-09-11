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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AttendanceTrendChart({ chartData }) {
    const data = {
        labels: chartData.map(d => d.label),
        datasets: [
            {
                label: 'Hadir',
                data: chartData.map(d => d.hadir),
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
            {
                label: 'Alfa',
                data: chartData.map(d => d.alfa),
                backgroundColor: 'rgba(239, 68, 68, 0.7)', // red-500
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 20,
                    font: {
                        size: 10,
                    }
                }
            },
            title: {
                display: true,
                text: 'Tren Kehadiran 4 Minggu Terakhir',
                font: {
                    size: 14,
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1, // Hanya tampilkan angka bulat di sumbu Y
                }
            }
        }
    };

    return (
        <div className="relative h-64">
            <Bar options={options} data={data} />
        </div>
    );
}