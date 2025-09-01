import React, { useState, Fragment } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
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
    ChevronDown
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: route('guru.dashboard'), icon: Home },
    { name: 'Jurnal Mengajar', href: '#', icon: BookOpen }, // Ganti '#' dengan route('guru.jurnal.index') nanti
    { name: 'Absensi Siswa', href: '#', icon: ClipboardCheck },
    { name: 'Jadwal Saya', href: '#', icon: CalendarDays },
    { name: 'Daftar Siswa', href: '#', icon: Users },
    { name: 'Laporan', href: '#', icon: FileText },
];

export default function GuruLayout({ children, header }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage().props;
    const user = auth.user;

    const NavLink = ({ item }) => (
        <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-100 transition-all hover:bg-gray-700 ${route().current(item.href) ? 'bg-gray-700' : ''}`}
        >
            <item.icon className="h-4 w-4" />
            {item.name}
        </Link>
    );

    const SidebarContent = () => (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b border-gray-700 px-4 lg:h-[60px] lg:px-6">
                <Link href={route('guru.dashboard')} className="flex items-center gap-2 font-semibold text-white">
                    <BookOpen className="h-6 w-6" />
                    <span>Panel Guru</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {navigation.map(item => <NavLink key={item.name} item={item} />)}
                </nav>
            </div>
        </div>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Toaster position="top-right" />
            <Head title={header} />

            {/* --- Sidebar for Desktop --- */}
            <div className="hidden border-r bg-gray-800 text-white md:block">
                <SidebarContent />
            </div>

            {/* --- Mobile Header & Sidebar --- */}
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold">{header}</h1>
                    </div>
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
                            <img src={`https://ui-avatars.com/api/?name=${user.nama_lengkap}&background=4f46e5&color=fff`} className="h-8 w-8 rounded-full" />
                            <span className="hidden md:inline">{user.nama_lengkap}</span>
                            <ChevronDown className="h-4 w-4 hidden md:inline" />
                        </Menu.Button>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => <Link href={route('profile.edit')} className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>Profil Saya</Link>}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => <Link href={route('logout')} method="post" as="button" className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}>Log Out</Link>}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </header>

                {/* --- Main Content --- */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Dialog */}
            <Transition show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
                    <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60" />
                    </Transition.Child>
                    <Dialog.Panel className="fixed inset-y-0 left-0 h-full w-3/4 max-w-sm bg-gray-800 text-white p-4">
                         <button onClick={() => setSidebarOpen(false)} className="absolute right-4 top-4">
                            <X className="h-6 w-6 text-white" />
                        </button>
                        <SidebarContent />
                    </Dialog.Panel>
                </Dialog>
            </Transition>
        </div>
    );
}