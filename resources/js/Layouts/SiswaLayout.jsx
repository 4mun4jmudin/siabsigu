import React, { useState, Fragment } from "react";
import { Link, Head, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
// =================================================================
// PERBAIKAN DI SINI: Tambahkan 'Dialog', 'Transition', dan 'Menu'
// =================================================================
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
    HomeIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";

// Navigasi khusus untuk siswa
const navigation = [
    { name: 'Absensi', href: route('siswa.dashboard'), icon: HomeIcon },
    // { name: 'Jadwal Saya', href: '#', icon: CalendarDaysIcon },
    // { name: 'Riwayat Absensi', href: '#', icon: ClipboardDocumentListIcon },
];

function NavLink({ href, active, children, label }) {
    return (
        <Link
            href={href}
            className={`group flex items-center w-full p-2 rounded-lg transition-colors duration-150 text-sm font-medium ${
                active ? "bg-sky-700 text-white" : "text-sky-100 hover:bg-sky-600"
            }`}
        >
            {children}
            <span className="ml-3">{label}</span>
        </Link>
    );
}

export default function SiswaLayout({ children, header }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage().props;
    const user = auth.user;

    const SidebarContent = () => (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sky-800 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-x-3">
                <img className="h-10 w-auto" src="/images/logo-sekolah.png" alt="Logo Sekolah" />
                <span className="text-white font-bold text-lg">SISWA AREA</span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        href={item.href}
                                        active={route().current(item.href.split('?')[0])} // Handle query strings
                                        label={item.name}
                                    >
                                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" />

            {/* Mobile sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
                    <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-900/80" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex">
                        <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                            <XMarkIcon className="h-6 w-6 text-white" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <SidebarContent />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <SidebarContent />
            </div>

            <div className="lg:pl-72">
                {/* Top bar */}
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold">{header}</h1>
                        <div className="flex items-center gap-x-6">
                            <Menu as="div" className="relative">
                                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                                            {user.nama_lengkap}
                                        </span>
                                        <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
                                    </span>
                                </Menu.Button>
                                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                    <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                        <Menu.Item>{({ active }) => (<Link href={route('profile.edit')} className={`${active ? 'bg-gray-50' : ''} block px-3 py-1 text-sm text-gray-900`}>Profil</Link>)}</Menu.Item>
                                        <Menu.Item>{({ active }) => (<Link href={route('logout')} method="post" as="button" className={`${active ? 'bg-gray-50' : ''} block w-full text-left px-3 py-1 text-sm text-gray-900`}>Log Out</Link>)}</Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </header>

                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}