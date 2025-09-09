import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 1) {
        return null;
    }

    return (
        <nav aria-label="Pagination">
            <ul className="flex flex-wrap -m-1">
                {links.map((link, index) => (
                    <li key={index} className="m-1">
                        {link.url === null ? (
                            <div
                                className="px-3 py-2 text-sm leading-4 text-gray-400 border rounded"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                aria-disabled="true"
                            />
                        ) : (
                            <Link
                                href={link.url}
                                className={`px-3 py-2 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${
                                    link.active ? 'bg-sky-700 text-white' : 'bg-white text-gray-700'
                                }`}
                                // biarkan Inertia handle navigation default (link.url biasanya sudah berisi semua query params)
                                preserveScroll
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
