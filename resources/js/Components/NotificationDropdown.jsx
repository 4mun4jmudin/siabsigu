import React, { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bell, Check, X, Clock, Mail } from 'lucide-react';
import { usePage, Link } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * NotificationDropdown
 * - Mengambil notifikasi dari Inertia page props (props.notifications atau props.auth.user.notifications)
 * - Jika ada endpoint, bisa menandai notifikasi terbaca lewat axios ke
 *   - POST /notifications/:id/read
 *   - POST /notifications/mark-all
 *   (Jika endpoint tidak tersedia, komponen tetap bekerja sebagai UI-only)
 *
 * Cara pakai: import NotificationDropdown from '@/Components/NotificationDropdown'
 */
export default function NotificationDropdown() {
    const page = usePage();
    // Preferensi: props.notifications, lalu auth.user.notifications
    const serverNotifications = page.props.notifications ?? page.props.auth?.user?.notifications ?? [];
    const [notifications, setNotifications] = useState(Array.isArray(serverNotifications) ? serverNotifications : []);
    const [loading, setLoading] = useState(false);

    // Sync kalau Inertia melakukan navigasi & mengirim notifikasi baru
    useEffect(() => {
        if (Array.isArray(serverNotifications)) setNotifications(serverNotifications);
    }, [page.props.notifications, page.props.auth?.user?.notifications]);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    // Helper: safe POST, swallow error (server mungkin belum memiliki route)
    const safePost = async (url, data = {}) => {
        try {
            return await axios.post(url, data);
        } catch (e) {
            // tampilkan warning tapi jangan crash
            console.warn('Request failed:', url, e?.response?.data ?? e.message);
            toast.error('Operasi notifikasi gagal (endpoint tidak tersedia).');
            throw e;
        }
    };

    const markAsRead = async (id) => {
        // optimistik update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n));
        try {
            // coba endpoint REST konvensional
            await safePost(`/notifications/${id}/read`);
            toast.success('Notifikasi ditandai terbaca');
        } catch (e) {
            // kalau gagal, kita tetap mempertahankan UI update (graceful)
        }
    };

    const markAllRead = async () => {
        if (notifications.length === 0) return;
        setLoading(true);
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        try {
            await safePost('/notifications/mark-all');
            toast.success('Semua notifikasi ditandai terbaca');
        } catch (e) {
            // swallow
        } finally {
            setLoading(false);
        }
    };

    const openNotification = async (n) => {
        // Jika notifikasi punya url di data, buka link; kalau tidak, hanya tandai terbaca
        try {
            if (!n.read_at) {
                await markAsRead(n.id);
            }
        } catch (_) { /* ignore */ }

        // Jika payload menyertakan url tujuan (kebanyakan Laravel Notification menyertakan data.url)
        const parsed = (() => {
            try {
                // beberapa implementasi menyimpan data sebagai JSON string, beberapa sudah object
                return typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            } catch {
                return n.data ?? {};
            }
        })();

        const targetUrl = parsed.url || parsed.link || parsed.route || null;
        if (targetUrl) {
            // Jika target url berupa route name (ziggy) Anda bisa handle sendiri.
            // Untuk sekarang gunakan location.href
            window.location.href = targetUrl;
        } else {
            // kalau tidak ada link, cukup beri toast
            toast.info('Notifikasi dibuka');
        }
    };

    return (
        <Menu as="div" className="relative">
            <div>
                <Menu.Button className="relative inline-flex items-center p-2 rounded-full hover:bg-gray-100 transition">
                    <Bell className="h-6 w-6 text-slate-700" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-rose-500 rounded-full shadow">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-sky-500" />
                            <div>
                                <div className="text-sm font-semibold">Notifikasi</div>
                                <div className="text-xs text-slate-500">{unreadCount} belum dibaca</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={markAllRead}
                                disabled={loading || unreadCount === 0}
                                className="text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50"
                                title="Tandai semua terbaca"
                            >
                                Tandai semua
                            </button>
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                Tidak ada notifikasi
                            </div>
                        ) : (
                            notifications.map((n) => {
                                // try to extract title & time from data
                                const parsed = (() => {
                                    try {
                                        return typeof n.data === 'string' ? JSON.parse(n.data) : n.data ?? {};
                                    } catch {
                                        return n.data ?? {};
                                    }
                                })();

                                const title = parsed.title || parsed.message || parsed.text || (n.type ? n.type.split('\\').pop() : 'Notifikasi');
                                const createdAt = n.created_at || n.createdAt || parsed.created_at || null;
                                const isUnread = !n.read_at;

                                return (
                                    <Menu.Item as="div" key={n.id}>
                                        <div
                                            onClick={() => openNotification(n)}
                                            className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50 transition ${isUnread ? 'bg-white' : 'bg-white'}`}
                                        >
                                            <div className={classNames(
                                                'flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold',
                                                isUnread ? 'bg-sky-500' : 'bg-slate-200 text-slate-700'
                                            )}>
                                                {parsed.icon || (isUnread ? <Bell className="h-4 w-4" /> : <Check className="h-4 w-4" />)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="text-sm font-medium text-slate-900 truncate">{title}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {createdAt ? new Date(createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                                                    </div>
                                                </div>
                                                {parsed.subtitle || parsed.body ? (
                                                    <div className="mt-1 text-xs text-slate-600 line-clamp-2">{parsed.subtitle || parsed.body}</div>
                                                ) : null}
                                            </div>

                                            <div className="flex-shrink-0 ml-2">
                                                {isUnread && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                        title="Tandai terbaca"
                                                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-slate-100"
                                                    >
                                                        <Check className="h-4 w-4 text-slate-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Menu.Item>
                                );
                            })
                        )}
                    </div>

                    <div className="px-3 py-2">
                        <div className="text-xs text-slate-500">Pengaturan notifikasi ada di menu profil.</div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

// small helper for conditional classes (keperluan internal)
function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}
