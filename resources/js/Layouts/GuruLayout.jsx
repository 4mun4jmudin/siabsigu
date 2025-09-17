import React, { useState, Fragment, useEffect, useMemo } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import { Toaster, toast } from 'react-hot-toast';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
    Home,
    BookOpen,
    ClipboardCheck,
    CalendarDays,
    Users,
    FileText,
    Bell,
    Menu as MenuIcon,
    X,
    ChevronDown,
    LogOut,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import NotificationDropdown from '@/Components/NotificationDropdown'; // pastikan file ini ada

// Helper: aman memanggil route ziggy
function routeExists(name) {
    try {
        window.route(name);
        return true;
    } catch (e) {
        return false;
    }
}
function safeRoute(name, params = {}, fallback = '#') {
    return routeExists(name) ? window.route(name, params) : fallback;
}

const navigationItems = [
    { name: 'Dashboard', href: 'guru.dashboard', icon: Home },
    { name: 'Jurnal & Absensi', href: 'guru.jurnal.index', icon: BookOpen },
    { name: 'Absensi Siswa', href: 'guru.absensi-mapel.index', icon: Users },
    { name: 'Absensi Harian', href: 'guru.absensi-harian.index', icon: ClipboardCheck },
    { name: 'Jadwal Saya', href: 'guru.jadwal.index', icon: CalendarDays },
    { name: 'Daftar Siswa', href: 'guru.siswa.index', icon: Users },
    { name: 'Laporan', href: 'guru.laporan.index', icon: FileText },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

/** Nav item component with animated active indicator and tooltip when collapsed */
function NavItem({ item, collapsed }) {
    const targetHref = safeRoute(item.href);
    const isActive = targetHref !== '#' && window.route().current(item.href);
    const Icon = item.icon;

    return (
        <Link
            href={targetHref}
            className={classNames(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition duration-200 ease-in-out',
                isActive ? 'bg-gradient-to-r from-sky-700 to-sky-600 text-white shadow-md' : 'text-slate-100 hover:bg-slate-700 hover:text-white/95'
            )}
            aria-current={isActive ? 'page' : undefined}
            title={collapsed ? item.name : undefined}
        >
            {/* Left active bar */}
            <span
                aria-hidden
                className={classNames(
                    'absolute -left-2 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-md transition-all',
                    isActive ? 'bg-white/90 shadow' : 'opacity-0 group-hover:opacity-100 bg-white/10'
                )}
            />
            <span className={classNames(collapsed ? 'mx-auto' : 'flex-none')}>
                <Icon className={classNames('h-5 w-5 transition-colors', isActive ? 'text-white' : 'text-slate-200')} />
            </span>

            {!collapsed && (
                <span className="truncate font-medium text-sm leading-5">
                    {item.name}
                </span>
            )}

            {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden whitespace-nowrap rounded-md bg-slate-900/95 px-3 py-1 text-xs font-semibold text-white group-hover:block z-20 shadow">
                    {item.name}
                </span>
            )}
        </Link>
    );
}

/** Main layout */
export default function GuruLayout({ children, header = 'Panel Guru' }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user ?? { nama_lengkap: 'Pengguna', level: 'Guru' };
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success, { id: 'flash-success', position: 'top-right' });
        if (flash?.error) toast.error(flash.error, { id: 'flash-error', position: 'top-right' });
    }, [flash]);

    // small sample notifications (keperluan fallback jika NotificationDropdown tidak ada)
    const notifications = useMemo(() => [
        { id: 1, title: 'Pengumuman: Rapat GTK', time: '2 jam lalu' },
        { id: 2, title: 'Jurnal perlu konfirmasi', time: '1 hari lalu' },
    ], []);

    const SidebarContent = ({ isMobile = false }) => (
        <>
            <div className={classNames("flex h-16 items-center", isMobile ? "px-4" : "px-4 justify-between")}>
                <Link href={safeRoute('guru.dashboard')} className="flex items-center gap-3">
                    <div
                        className={classNames(
                            'flex h-10 w-10 items-center justify-center rounded-lg shadow-sm',
                            collapsed && !isMobile ? 'bg-gradient-to-br from-sky-700 to-sky-600' : 'bg-white/10'
                        )}
                    >
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight">Sekolah Pintar</span>
                            <span className="text-xs text-sky-200/80 -mt-0.5">Panel Guru</span>
                        </div>
                    )}
                </Link>

                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded-full text-white bg-white/10 hover:bg-white/20 transition"
                        aria-label={collapsed ? 'Perbesar sidebar' : 'Ciutkan sidebar'}
                        title={collapsed ? 'Perbesar' : 'Ciutkan'}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                <div className="px-1">
                    <div className="text-xs uppercase text-sky-200/80 px-3 py-1 font-semibold tracking-wider">{!collapsed && 'Menu Utama'}</div>
                </div>
                {navigationItems.map(item => <NavItem key={item.name} item={item} collapsed={!isMobile && collapsed} />)}
            </nav>

            <div className="p-3 border-t border-sky-800">
                {!collapsed || isMobile ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`}
                            alt={user.nama_lengkap}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{user.nama_lengkap}</div>
                            <div className="text-xs text-sky-200/80">{user.level || 'Guru'}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={safeRoute('profile.edit')} className="text-sky-200 hover:text-white p-2 rounded-md" title="Profil">
                                <Settings className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        <Link href={safeRoute('profile.edit')} className="text-sky-200 hover:text-white p-2 rounded-md" title="Profil">
                            <Settings className="h-5 w-5" />
                        </Link>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            <Head title={header} />
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
                {/* Desktop sidebar */}
                <aside className={classNames(
                    'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col text-white transition-all duration-300',
                    collapsed ? 'lg:w-20' : 'lg:w-64',
                    'bg-[linear-gradient(180deg,#0369a1,rgba(3,105,161,0.95))]'
                )}>
                    <SidebarContent />
                </aside>

                {/* Mobile sidebar (dialog) */}
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                        <Transition.Child as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0" enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-black/40" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full" enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-sky-900 text-white">
                                    <button className="absolute top-4 right-4 p-1 text-white" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar">
                                        <X className="h-6 w-6" />
                                    </button>
                                    <SidebarContent isMobile />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Main content column */}
                <div className={classNames("flex min-w-0 flex-1 flex-col transition-all duration-300", collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
                    {/* Topbar */}
                    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/70 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden rounded-md hover:bg-gray-100 transition" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
                                <MenuIcon className="h-6 w-6" />
                            </button>

                            <div className="hidden sm:flex sm:items-center sm:gap-4">
                                <h2 className="text-lg font-semibold text-slate-900">{header}</h2>
                                
                            </div>
                        </div>

                        <div className="flex flex-1 items-center justify-end gap-4">
                            {/* Search (optional) */}
                            <div className="hidden md:flex items-center w-full max-w-md">
                                <label htmlFor="topbar-search" className="sr-only">Cari</label>
                                <div className="relative w-full">
                                    <input
                                        id="topbar-search"
                                        type="search"
                                        placeholder="Cari pengumuman, siswa, jadwal..."
                                        className="w-full rounded-full border border-slate-200 bg-white py-2 px-4 pl-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Icons group */}
                            <div className="flex items-center gap-3">
                                {/* Notification dropdown component */}
                                <NotificationDropdown />

                                {/* Quick action */}
                                <Link href={safeRoute('guru.jurnal.index')} className="hidden sm:inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-500 to-sky-500 px-3 py-1.5 text-sm font-semibold text-white shadow hover:scale-105 transform transition">
                                    <BookOpen className="h-4 w-4" /> Jurnal
                                </Link>

                                <div className="hidden lg:block h-6 w-px bg-gray-200" />

                                {/* Profile menu */}
                                <Menu as="div" className="relative">
                                    <Menu.Button className="-m-1.5 flex items-center p-1.5 rounded-md hover:bg-gray-100 transition">
                                        <img className="h-8 w-8 rounded-full ring-1 ring-slate-200" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`} alt={user.nama_lengkap} />
                                        <span className="hidden lg:flex lg:items-center">
                                            <span className="ml-3 text-sm font-semibold leading-6 text-slate-900">{user.nama_lengkap}</span>
                                            <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                                        </span>
                                    </Menu.Button>

                                    <Transition as={Fragment} enter="transition ease-out duration-150" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-100" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                        <Menu.Items className="absolute right-0 z-50 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link href={safeRoute('profile.edit')} className={classNames(active ? 'bg-gray-50' : '', 'block px-3 py-2 text-sm text-slate-900')}>
                                                        <div className="flex items-center gap-2"><Settings className="h-4 w-4" /> Profil Saya</div>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link href={safeRoute('logout')} method="post" as="button" className={classNames(active ? 'bg-gray-50' : '', 'block w-full text-left px-3 py-2 text-sm text-slate-900')}>
                                                        <div className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Keluar</div>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        <div className="mx-auto max-w-screen-2xl transition-all">
                            {/* Breadcrumb / small header */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        {/* <h1 className="text-xl font-semibold text-slate-900">{header}</h1> */}
                                        <p className="text-sm text-slate-500">Halaman khusus untuk {user.level?.toLowerCase() || 'guru'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* children/content area */}
                            <div className="rounded-lg">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
