import React from 'react';

/**
 * Komponen Skeleton dasar untuk loading state.
 * Gunakan props `className` untuk kustomisasi ukuran dan bentuk.
 *
 * Contoh: <Skeleton className="h-4 w-24" />
 *         <Skeleton className="h-6 w-16 rounded-full" />
 */
export default function Skeleton({ className = '' }) {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
        />
    );
}
