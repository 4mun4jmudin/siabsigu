import React, { useState, Fragment } from "react";
import { Link, Head, usePage } from "@inertiajs/react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Toaster } from "react-hot-toast";
import {
    HomeIcon,
    UsersIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    UserCircleIcon,
    ChevronDownIcon
} from "@heroicons/react/24/outline";

function NavLink({ href, active, isCollapsed, children, label }) {
    return (
        <Link
            href={href}
            className={`group relative flex items-center w-full p-2 rounded-lg transition-colors ease-in-out duration-150 text-sm font-medium ${active ? "bg-indigo-700 text-white" : "text-indigo-50 hover:bg-indigo-600"}`}
        >
            {children}
            <span className={`flex-1 transition-all duration-150 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-3"}`}>
                {label}
            </span>
            {!isCollapsed && href.includes("/guru/") && (<span className="text-xs text-indigo-200"></span>)}
            {isCollapsed && (
                <span className="absolute left-full ml-4 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {label}
                </span>
            )}
        </Link>
    );
}

const navigation = [
    { name: 'Dasbor', href: route('guru.dashboard'), icon: HomeIcon },
    { name: 'Jadwal Mengajar', href: '#', icon: CalendarDaysIcon }, // Ganti '#' dengan rute yang sesuai
    { name: 'Jurnal Mengajar', href: '#', icon: ClipboardDocumentListIcon }, // Ganti '#' dengan rute yang sesuai
    { name: 'Data Siswa', href: '#', icon: UsersIcon }, // Ganti '#' dengan rute yang sesuai
];

function GuruLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Sidebar mobile */}
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
                                            <span className="sr-only">Tutup sidebar</span>
                                            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-2">
                                    <div className="flex h-16 shrink-0 items-center text-white font-bold">
                                        Absensi SIGU
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <NavLink
                                                                href={item.href}
                                                                active={route().current(item.href)}
                                                                label={item.name}
                                                                isCollapsed={false}
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Sidebar desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0 lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6">
                    <div className="flex h-16 shrink-0 items-center text-white font-bold text-lg">
                        Absensi SIGU
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <NavLink
                                                href={item.href}
                                                active={route().current(item.href)}
                                                label={item.name}
                                                isCollapsed={false}
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
            </div>

            <div className="flex flex-1 flex-col">
                {/* Header top bar */}
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <span className="sr-only">Buka sidebar mobile</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <Menu as="div" className="relative">
                                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                    <span className="sr-only">Buka menu pengguna</span>
                                    {/* Gunakan gambar profil guru jika ada */}
                                    <img
                                        className="h-8 w-8 rounded-full bg-gray-50"
                                        src={user?.guru?.foto_profil || `https://ui-avatars.com/api/?name=${user?.nama_lengkap}&background=4f46e5&color=fff`}
                                        alt=""
                                    />
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                            {user?.nama_lengkap}
                                        </span>
                                        <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                </Menu.Button>
                                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                    <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                        <Menu.Item>{({ active }) => (<Link href={route("profile.edit")} className={`${active ? "bg-gray-50" : ""} block px-3 py-1 text-sm leading-6 text-gray-900`}>Profil Anda</Link>)}</Menu.Item>
                                        <Menu.Item>{({ active }) => (<Link href={route("logout")} method="post" as="button" className={`${active ? "bg-gray-50" : ""} block px-3 py-1 text-sm leading-6 text-gray-900`}>Log Out</Link>)}</Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default GuruLayout;