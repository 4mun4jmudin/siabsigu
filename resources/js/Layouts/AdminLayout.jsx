// resources/js/Layouts/AdminLayout.jsx
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
    ChartPieIcon,
    SparklesIcon,
    ComputerDesktopIcon
} from "@heroicons/react/24/outline";

// NavLink, CollapsibleNavGroup unchanged (copy from your original)...
function NavLink({ href, active, isCollapsed, children, label }) {
    return (
        <Link
            href={href}
            className={`group relative flex items-center w-full p-2 rounded-lg transition-colors ease-in-out duration-150 text-sm font-medium ${active ? "bg-indigo-700 text-white" : "text-indigo-50 hover:bg-indigo-600/60"
                } ${isCollapsed ? "justify-center" : ""}`}
        >
            <div className={`${isCollapsed ? "mx-auto" : "mr-3"}`}>{children}</div>

            {!isCollapsed && <span className="truncate">{label}</span>}

            {isCollapsed && (
                <span
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden whitespace-nowrap rounded-md bg-indigo-900/90 px-3 py-1.5 text-xs font-semibold text-white group-hover:block"
                    role="tooltip"
                >
                    {label}
                </span>
            )}
        </Link>
    );
}

function CollapsibleNavGroup({ title, icon, isCollapsed, children, active = false }) {
    const [isOpen, setIsOpen] = useState(active);

    useEffect(() => {
        if (active) setIsOpen(true);
    }, [active]);

    return (
        <li className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex w-full items-center p-2 rounded-lg transition-all duration-150 text-sm font-medium ${isOpen ? "bg-indigo-700 text-white" : "text-indigo-50 hover:bg-indigo-600/60"
                    } ${isCollapsed ? "justify-center" : ""}`}
            >
                <div className={`${isCollapsed ? "mx-auto" : "mr-3"}`}>{icon}</div>

                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-left">{title}</span>
                        <ChevronDownIcon
                            className={`w-4 h-4 ml-2 transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
                            aria-hidden
                        />
                    </>
                )}

                {isCollapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden whitespace-nowrap rounded-md bg-indigo-900/90 px-3 py-1.5 text-xs font-semibold text-white group-hover:block">
                        {title}
                    </span>
                )}
            </button>

            <Transition
                show={isOpen && !isCollapsed}
                enter="transition-all ease-in-out duration-200"
                enterFrom="max-h-0 opacity-0"
                enterTo="max-h-screen opacity-100"
                leave="transition-all ease-in-out duration-180"
                leaveFrom="max-h-screen opacity-100"
                leaveTo="max-h-0 opacity-0"
            >
                <ul className="mt-2 pl-7 pr-2 space-y-2">{children}</ul>
            </Transition>
        </li>
    );
}

export default function AdminLayout({ user, header, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [toggleImageError, setToggleImageError] = useState(false);

    // get page props and flash/pengaturan
    const pageProps = usePage().props || {};
    const { flash, pengaturan } = pageProps;

    // fallback: if user prop not passed, try pageProps.auth.user
    const currentUser = user ?? pageProps.auth?.user ?? null;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const toggleIconPath = pengaturan?.toggle_icon_url || "/images/sidebar-toggle-blue.png";

    const SidebarHeader = ({ isCollapsed }) => (
        <div className={`flex items-center gap-3 p-4 ${isCollapsed ? "justify-center" : ""}`}>
            {pengaturan?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pengaturan.logo_url} alt="Logo Sekolah" className="h-10 w-10 object-contain rounded-md shadow-sm" />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400/10 ring-1 ring-yellow-300/30">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L4 6v6c0 5.25 3.5 9 8 10 4.5-1 8-4.75 8-10V6l-8-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            {!isCollapsed && (
                <div>
                    <h1 className="text-lg font-semibold text-indigo-50">IT AL - HAWARI</h1>
                    <p className="text-xs text-indigo-100/80">Sistem Absensi • Sekolah Digital</p>
                </div>
            )}
        </div>
    );

    const sidebarContent = (isMobile = false) => (
        <div className="flex flex-col h-full">
            <SidebarHeader isCollapsed={!isSidebarOpen && !isMobile} />

            <nav className="px-3 py-2 flex-1 overflow-y-auto custom-scrollbar">
                <ul className="space-y-1">
                    <li>
                        <NavLink
                            href={route("admin.dashboard")}
                            active={route().current("admin.dashboard")}
                            isCollapsed={!isSidebarOpen && !isMobile}
                            label="Dashboard"
                        >
                            <HomeIcon className="w-6 h-6" />
                        </NavLink>
                    </li>

                    <CollapsibleNavGroup
                        title="Master Data"
                        icon={<RectangleStackIcon className="w-6 h-6" />}
                        isCollapsed={!isSidebarOpen && !isMobile}
                        active={
                            route().current("admin.guru.*") ||
                            route().current("admin.siswa.*") ||
                            route().current("admin.kelas.*") ||
                            route().current("admin.mata-pelajaran.*")
                        }
                    >
                        <li>
                            <NavLink href={route("admin.guru.index")} active={route().current("admin.guru.*")} isCollapsed={false} label="Data Guru">
                                <UsersIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.siswa.index")} active={route().current("admin.siswa.*")} isCollapsed={false} label="Data Siswa">
                                <AcademicCapIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.kelas.index")} active={route().current("admin.kelas.*")} isCollapsed={false} label="Data Kelas">
                                <BuildingOffice2Icon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.mata-pelajaran.index")} active={route().current("admin.mata-pelajaran.*")} isCollapsed={false} label="Mata Pelajaran">
                                <BookOpenIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.orang-tua-wali.index")} active={route().current("admin.orang-tua-wali.*")} isCollapsed={false} label="Orang Tua/Wali">
                                <UserGroupIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                    </CollapsibleNavGroup>

                    <CollapsibleNavGroup
                        title="Absensi"
                        icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                        isCollapsed={!isSidebarOpen && !isMobile}
                        active={route().current("admin.absensi-guru.*")}
                    >
                        <li>
                            <NavLink href={route("admin.absensi-guru.index")} active={route().current("admin.absensi-guru.*")} isCollapsed={false} label="Absensi Guru">
                                <UsersIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.absensi-siswa.index")} active={route().current("admin.absensi-siswa.*")} isCollapsed={false} label="Absensi Siswa">
                                <AcademicCapIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink href={route("admin.absensi-siswa-mapel.index")} active={route().current("admin.absensi-siswa-mapel.*")} isCollapsed={false} label="Absensi Siswa per Mapel">
                                <BookOpenIcon className="w-5 h-5" />
                            </NavLink>
                        </li>
                    </CollapsibleNavGroup>

                    <li>
                        <NavLink href={route("admin.jadwal-mengajar.index")} active={route().current("admin.jadwal-mengajar.*")} isCollapsed={!isSidebarOpen && !isMobile} label="Jadwal Mengajar">
                            <CalendarDaysIcon className="w-6 h-6" />
                        </NavLink>
                    </li>

                    <li>
                        <NavLink href={route("admin.jurnal-mengajar.index")} active={route().current("admin.jurnal-mengajar.*")} isCollapsed={!isSidebarOpen && !isMobile} label="Jurnal Mengajar">
                            <DocumentTextIcon className="w-6 h-6" />
                        </NavLink>
                    </li>

                    <li>
                        <NavLink href={route("admin.laporan.index")} active={route().current("admin.laporan.*")} isCollapsed={!isSidebarOpen && !isMobile} label="Laporan">
                            <ChartBarIcon className="w-6 h-6" />
                        </NavLink>
                    </li>

                    <li>
                        <NavLink href={route("admin.pengaturan.index")} active={route().current("admin.pengaturan.index")} isCollapsed={!isSidebarOpen && !isMobile} label="Pengaturan">
                            <Cog6ToothIcon className="w-6 h-6" />
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className={`p-3 ${!isSidebarOpen && !isMobile ? "flex justify-center" : "text-xs text-indigo-100/70"}`}>
                {!isSidebarOpen && !isMobile ? (
                    <div className="text-indigo-50/90">v1.0</div>
                ) : (
                    <div className="w-full flex items-center justify-between">
                        <div>
                            <div className="text-xs">© {new Date().getFullYear()} AbsensiApp</div>
                            <div className="text-[11px] text-indigo-100/60">Sekolah Digital • Teknologi Canggih</div>
                        </div>
                        <div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-800/30 px-2 py-1 text-[11px] font-medium">Beta</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <Head title={header} />

            <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4500 }} />

            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
                <Transition.Root show={isMobileSidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsMobileSidebarOpen}>
                        <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-black/40" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                                <Dialog.Panel className="relative flex w-full max-w-xs flex-1">
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button type="button" className="-m-2.5 p-2.5" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Tutup menu">
                                            {!toggleImageError ? (
                                                <img
                                                    src={toggleIconPath}
                                                    alt="Tutup sidebar"
                                                    onError={() => setToggleImageError(true)}
                                                    className="h-6 w-6 object-contain transform rotate-90 transition-transform duration-200 hover:scale-110"
                                                />
                                            ) : (
                                                <XMarkIcon className="h-6 w-6 text-indigo-900" />
                                            )}
                                        </button>
                                    </div>

                                    <aside className="flex w-full flex-col overflow-y-auto bg-gradient-to-b from-indigo-900 to-indigo-800 text-indigo-50">
                                        {sidebarContent(true)}
                                    </aside>
                                </Dialog.Panel>
                            </Transition.Child>

                            <div className="w-14 flex-shrink-0" aria-hidden="true" />
                        </div>
                    </Dialog>
                </Transition.Root>

                <aside className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col bg-gradient-to-b from-indigo-900 to-indigo-800 text-indigo-50 transition-all duration-300 ${isSidebarOpen ? "lg:w-64" : "lg:w-20"}`}>
                    {sidebarContent(false)}
                </aside>

                <div className={`flex min-h-screen flex-col transition-all duration-300 ${isSidebarOpen ? "lg:pl-64" : "lg:pl-20"}`}>
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-indigo-100/10 bg-white/60 backdrop-blur-sm px-4 shadow-sm">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-indigo-700 hover:bg-indigo-50 rounded-md"
                            onClick={() => {
                                const isMobile = window.innerWidth < 1024;
                                if (isMobile) setIsMobileSidebarOpen(true);
                                else setIsSidebarOpen(!isSidebarOpen);
                            }}
                            aria-label="Toggle sidebar"
                            aria-pressed={isSidebarOpen}
                        >
                            <span className="sr-only">Toggle sidebar</span>
                            {!toggleImageError ? (
                                <img
                                    src={toggleIconPath}
                                    alt={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
                                    onError={() => setToggleImageError(true)}
                                    className={`h-8 w-8 object-contain transition-transform duration-300 ease-out ${isSidebarOpen ? "rotate-180 scale-95" : "rotate-0 scale-100"} hover:scale-105`}
                                />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>

                        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

                        <div className="flex flex-1 gap-x-4 justify-between items-center">
                            <form className="relative flex flex-1" action="#" method="GET">
                                <label htmlFor="search-field" className="sr-only">Search</label>
                                <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
                                <input id="search-field" className="block h-10 w-full border-0 bg-white/60 py-0 pl-8 pr-3 text-gray-900 placeholder:text-gray-400 rounded-md focus:ring-2 focus:ring-indigo-300 sm:text-sm" placeholder="Cari..." type="search" name="search" />
                            </form>

                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                <button type="button" className="-m-2.5 p-2.5 text-indigo-600 hover:text-indigo-800 relative">
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center">3</span>
                                </button>

                                <Menu as="div" className="relative">
                                    <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                        <span className="sr-only">Open user menu</span>
                                        <div className="h-8 w-8 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm font-bold">
                                            {currentUser?.nama_lengkap?.charAt(0) ?? "U"}
                                        </div>
                                        <div className="hidden lg:flex lg:items-center">
                                            <span className="ml-3 text-sm font-semibold leading-6 text-gray-900" aria-hidden>
                                                {currentUser?.nama_lengkap ?? "User"}
                                            </span>
                                            <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden />
                                        </div>
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

                    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </>
    );
}
