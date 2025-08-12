import React, { useState, Fragment, useEffect } from "react";
import { Link, Head, usePage } from "@inertiajs/react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Toaster, toast } from "react-hot-toast";
import {
    HomeIcon,
    UsersIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    BellIcon,
    ChevronDownIcon,
    RectangleStackIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    Bars3Icon,
    XMarkIcon,
    BuildingOffice2Icon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Komponen untuk link navigasi di dalam sidebar
function NavLink({ href, active, isCollapsed, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center w-full p-2 text-base text-white rounded-lg group hover:bg-[#374EC4] transition duration-75 ${
                active ? "bg-[#374EC4]" : ""
            } ${isCollapsed ? "justify-center" : ""}`}
        >
            {children}
        </Link>
    );
}

// Komponen untuk grup menu yang bisa dibuka-tutup
function CollapsibleNavGroup({
    title,
    icon,
    isCollapsed,
    children,
    active = false,
}) {
    const [isOpen, setIsOpen] = useState(active);

    useEffect(() => {
        if (active) {
            setIsOpen(true);
        }
    }, [active]);

    return (
        <li>
            <button
                type="button"
                className={`flex items-center w-full p-2 text-base text-white rounded-lg group hover:bg-[#374EC4] transition duration-75 ${
                    active && !isOpen ? "bg-[#374EC4]" : ""
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {icon}
                {!isCollapsed && (
                    <>
                        <span className="flex-1 ml-3 text-left whitespace-nowrap">
                            {title}
                        </span>
                        <ChevronDownIcon
                            className={`w-5 h-5 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </>
                )}
            </button>
            <Transition
                show={isOpen && !isCollapsed}
                enter="transition-all ease-in-out duration-200"
                enterFrom="max-h-0 opacity-0"
                enterTo="max-h-screen opacity-100"
                leave="transition-all ease-in-out duration-200"
                leaveFrom="max-h-screen opacity-100"
                leaveTo="max-h-0 opacity-0"
            >
                <ul className="py-2 pl-6 space-y-2 overflow-hidden">
                    {children}
                </ul>
            </Transition>
        </li>
    );
}

export default function AdminLayout({ user, header, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const sidebarContent = (isMobile = false) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div
                className={`p-4 flex items-center ${
                    !isSidebarOpen && !isMobile ? "justify-center" : ""
                }`}
            >
                <ClockIcon className="h-8 w-8 mr-2 text-white flex-shrink-0" />
                {(isSidebarOpen || isMobile) && (
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            AbsensiApp
                        </h1>
                        <p className="text-xs text-gray-300">Sistem Absensi</p>
                    </div>
                )}
            </div>

            {/* Menu */}
            <ul className="space-y-2 font-medium p-4 flex-1 overflow-y-auto">
                <li>
                    <NavLink
                        href={route("dashboard")}
                        active={route().current("dashboard")}
                        isCollapsed={!isSidebarOpen && !isMobile}
                    >
                        <HomeIcon className="w-6 h-6" />
                        {(isSidebarOpen || isMobile) && (
                            <span className="ml-3">Dashboard</span>
                        )}
                    </NavLink>
                </li>

                <CollapsibleNavGroup
                    title="Master Data"
                    icon={<RectangleStackIcon className="w-6 h-6" />}
                    isCollapsed={!isSidebarOpen && !isMobile}
                    active={
                        route().current("guru.*") ||
                        route().current("siswa.*") ||
                        route().current("kelas.*") ||
                        route().current("mata-pelajaran.*") ||
                        route().current("orang-tua-wali.*")
                    }
                >
                    <li>
                        <NavLink
                            href={route("guru.index")}
                            active={route().current("guru.*")}
                            isCollapsed={false}
                        >
                            <UsersIcon className="w-5 h-5 mr-3" />
                            Data Guru
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            href={route("siswa.index")}
                            active={route().current("siswa.*")}
                            isCollapsed={false}
                        >
                            <AcademicCapIcon className="w-5 h-5 mr-3" />
                            Data Siswa
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            href={route("kelas.index")}
                            active={route().current("kelas.*")}
                            isCollapsed={false}
                        >
                            <BuildingOffice2Icon className="w-5 h-5 mr-3" />
                            Data Kelas
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            href={route("mata-pelajaran.index")}
                            active={route().current("mata-pelajaran.*")}
                            isCollapsed={false}
                        >
                            <BookOpenIcon className="w-5 h-5 mr-3" />
                            Mata Pelajaran
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            href={route("orang-tua-wali.index")}
                            active={route().current("orang-tua-wali.*")}
                            isCollapsed={false}
                        >
                            <UserGroupIcon className="w-5 h-5 mr-3" />
                            Orang Tua/Wali
                        </NavLink>
                    </li>
                </CollapsibleNavGroup>

                <CollapsibleNavGroup
                    title="Absensi"
                    icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                    isCollapsed={!isSidebarOpen && !isMobile}
                >
                    <li>
                        <NavLink href="#" isCollapsed={false}>
                            <UsersIcon className="w-5 h-5 mr-3" />
                            Absensi Guru
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href="#" isCollapsed={false}>
                            <AcademicCapIcon className="w-5 h-5 mr-3" />
                            Absensi Siswa
                        </NavLink>
                    </li>
                </CollapsibleNavGroup>

                <li>
                    <NavLink href="#" isCollapsed={!isSidebarOpen && !isMobile}>
                        <CalendarDaysIcon className="w-6 h-6" />
                        {(isSidebarOpen || isMobile) && (
                            <span className="ml-3">Jadwal Mengajar</span>
                        )}
                    </NavLink>
                </li>
                <li>
                    <NavLink href="#" isCollapsed={!isSidebarOpen && !isMobile}>
                        <DocumentTextIcon className="w-6 h-6" />
                        {(isSidebarOpen || isMobile) && (
                            <span className="ml-3">Jurnal Mengajar</span>
                        )}
                    </NavLink>
                </li>
                <li>
                    <NavLink href="#" isCollapsed={!isSidebarOpen && !isMobile}>
                        <ChartBarIcon className="w-6 h-6" />
                        {(isSidebarOpen || isMobile) && (
                            <span className="ml-3">Laporan</span>
                        )}
                    </NavLink>
                </li>
                <li>
                    <NavLink href="#" isCollapsed={!isSidebarOpen && !isMobile}>
                        <Cog6ToothIcon className="w-6 h-6" />
                        {(isSidebarOpen || isMobile) && (
                            <span className="ml-3">Pengaturan</span>
                        )}
                    </NavLink>
                </li>
            </ul>

            {/* Footer Sidebar */}
            {(isSidebarOpen || isMobile) && (
                <div className="p-4 border-t border-[#374EC4] text-center text-xs text-gray-300">
                    © {new Date().getFullYear()} AbsensiApp <br /> Version 1.0.0
                </div>
            )}
        </div>
    );

    return (
        <>
            <Head title={header} />
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 5000,
                }}
            />
            <div className="bg-gray-100">
                {/* --- Sidebar Mobile --- */}
                <Transition.Root show={isMobileSidebarOpen} as={Fragment}>
                    <Dialog
                        as="div"
                        className="relative z-50 lg:hidden"
                        onClose={setIsMobileSidebarOpen}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-[#1E3A8A]/80" />
                        </Transition.Child>
                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button
                                            type="button"
                                            className="-m-2.5 p-2.5"
                                            onClick={() =>
                                                setIsMobileSidebarOpen(false)
                                            }
                                        >
                                            <XMarkIcon className="h-6 w-6 text-white" />
                                        </button>
                                    </div>
                                    <aside className="flex w-full flex-col overflow-y-auto bg-[#1E3A8A]">
                                        {sidebarContent(true)}
                                    </aside>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* --- Sidebar Desktop --- */}
                <aside
                    className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col bg-[#1E3A8A] transition-all duration-300 ${
                        isSidebarOpen ? "lg:w-64" : "lg:w-20"
                    }`}
                >
                    {sidebarContent(false)}
                </aside>

                {/* --- Konten Utama --- */}
                <div
                    className={`flex flex-col min-h-screen transition-all duration-300 ${
                        isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
                    }`}
                >
                    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-700"
                            onClick={() => {
                                const isMobile = window.innerWidth < 1024;
                                if (isMobile) {
                                    setIsMobileSidebarOpen(true);
                                } else {
                                    setIsSidebarOpen(!isSidebarOpen);
                                }
                            }}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        <div
                            className="h-6 w-px bg-gray-200 lg:hidden"
                            aria-hidden="true"
                        />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between">
                            <form
                                className="relative flex flex-1"
                                action="#"
                                method="GET"
                            >
                                <label
                                    htmlFor="search-field"
                                    className="sr-only"
                                >
                                    Search
                                </label>
                                <MagnifyingGlassIcon
                                    className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    id="search-field"
                                    className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="Cari..."
                                    type="search"
                                    name="search"
                                />
                            </form>

                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                <button
                                    type="button"
                                    className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
                                >
                                    <span className="sr-only">
                                        View notifications
                                    </span>
                                    <BellIcon
                                        className="h-6 w-6"
                                        aria-hidden="true"
                                    />
                                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        3
                                    </span>
                                </button>

                                <div
                                    className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
                                    aria-hidden="true"
                                />

                                <Menu as="div" className="relative">
                                    <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                        <span className="sr-only">
                                            Open user menu
                                        </span>
                                        <div className="h-8 w-8 rounded-full bg-blue-800 text-white flex items-center justify-center text-sm font-bold">
                                            {user.nama_lengkap.charAt(0)}
                                        </div>
                                        <div className="hidden lg:flex lg:items-center">
                                            <span
                                                className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                                                aria-hidden="true"
                                            >
                                                {user.nama_lengkap}
                                            </span>
                                            <ChevronDownIcon
                                                className="ml-2 h-5 w-5 text-gray-400"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        href={route(
                                                            "profile.edit"
                                                        )}
                                                        className={`${
                                                            active
                                                                ? "bg-gray-50"
                                                                : ""
                                                        } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                                                    >
                                                        Profil Anda
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        href={route("logout")}
                                                        method="post"
                                                        as="button"
                                                        className={`${
                                                            active
                                                                ? "bg-gray-50"
                                                                : ""
                                                        } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                                                    >
                                                        Log Out
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </>
    );
}
