import React from 'react';

export default function Tab({ name, label, active, onClick }) {
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick(name);
            }}
            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${active
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
            `}
        >
            {label}
        </a>
    );
}