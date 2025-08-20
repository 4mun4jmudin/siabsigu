import React from 'react';
import { UsersIcon, AcademicCapIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function StatCard({ title, value, change, status, detail, iconType }) {
    const statusClass = status === 'naik' ? 'text-green-600' : 'text-red-600';
    const StatusIcon = status === 'naik' ? ArrowUpIcon : ArrowDownIcon;

    const renderIcon = () => {
        const iconClass = "h-7 w-7";
        switch (iconType) {
            case 'siswa':
                return <UsersIcon className={`${iconClass} text-green-500`} />;
            case 'guru':
                return <AcademicCapIcon className={`${iconClass} text-blue-500`} />;
            case 'siswa_hadir':
                return <UsersIcon className={`${iconClass} text-gray-500`} />;
            case 'guru_hadir':
                return <AcademicCapIcon className={`${iconClass} text-gray-500`} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-xl p-5 border border-gray-200">
            <div className="flex justify-between items-center"> 
                <div>
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                    {renderIcon()}
                </div>
            </div>
            <div className="mt-2 flex items-baseline text-sm">
                {change && (
                    <p className={`flex items-baseline font-semibold ${statusClass}`}>
                        <StatusIcon className="self-center flex-shrink-0 h-4 w-4 mr-0.5" />
                        <span>{change}</span>
                        <span className="ml-1 font-normal text-gray-500">dari bulan lalu</span>
                    </p>
                )}
                {detail && (
                    <p className="text-gray-500">{detail}</p>
                )}
            </div>
        </div>
    );
}