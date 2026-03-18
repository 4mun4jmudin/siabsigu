import React from 'react';
import Skeleton from '@/Components/Skeleton';

/**
 * Komponen Skeleton berbentuk tabel untuk loading state.
 *
 * Props:
 * - rows: Jumlah baris skeleton (default: 5)
 * - columns: Jumlah kolom (default: 8)
 *
 * Contoh: <SkeletonTable rows={5} columns={8} />
 */

// Variasi lebar kolom agar tampilan lebih natural
const COLUMN_WIDTHS = [
    'w-4',    // Checkbox
    'w-24',   // NIS / ID
    'w-48',   // Nama / Teks panjang
    'w-20',   // Kelas / Label pendek
    'w-8',    // JK / Single char
    'w-16',   // Status badge
    'w-12',   // Akun
    'w-24',   // Aksi
];

export default function SkeletonTable({ rows = 5, columns = 8 }) {
    return (
        <>
            {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse border-b border-gray-200 dark:border-gray-700">
                    {[...Array(columns)].map((_, colIndex) => {
                        // Gunakan variasi lebar dari array, fallback ke 'w-20'
                        const width = COLUMN_WIDTHS[colIndex] || 'w-20';
                        // Kolom ke-6 (index 5) biasanya badge → rounded-full & h-6
                        const isBadge = colIndex === 5;

                        return (
                            <td key={colIndex} className="px-6 py-4">
                                <Skeleton
                                    className={`${isBadge ? 'h-6 rounded-full' : 'h-4'} ${width}`}
                                />
                            </td>
                        );
                    })}
                </tr>
            ))}
        </>
    );
}
