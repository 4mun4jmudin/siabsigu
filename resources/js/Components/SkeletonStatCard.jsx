import React from 'react';
import Skeleton from '@/Components/Skeleton';

/**
 * Skeleton loader yang meniru layout StatCard di Dashboard.
 * Menampilkan placeholder untuk: ikon, label, value, dan description.
 *
 * Contoh: <SkeletonStatCard />
 */
export default function SkeletonStatCard() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between gap-3 h-28">
            <div className="flex-1 space-y-3">
                <div className="h-3 w-20 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-slate-100 animate-pulse rounded"></div>
            </div>
            <div className="h-12 w-12 bg-slate-100 animate-pulse rounded-xl"></div>
        </div>
    );
}
