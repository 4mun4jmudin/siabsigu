import React, { useState, Fragment, useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Bars3BottomLeftIcon, // Icon menu yang lebih modern
  XMarkIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

// ✅ Navigasi Sidebar
const navigation = [
  { name: "Dashboard Absensi", routeName: "siswa.dashboard", icon: HomeIcon },
  { name: "Profil Saya", routeName: "siswa.akun.edit", icon: ClipboardDocumentListIcon },
  // Tombol logout kita pisahkan visualnya agar UX lebih jelas
];

// Komponen Link Navigasi Custom
function NavLink({ href, active, children, label, method, as }) {
  const isButton = as === "button";
  return (
    <Link
      href={href}
      method={method}
      as={as}
      type={isButton ? "button" : undefined}
      className={`group relative flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 text-sm font-medium border-l-4 ${
        active
          ? "bg-white/10 text-white border-sky-400 shadow-lg shadow-sky-900/20"
          : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={`shrink-0 transition-colors duration-200 ${active ? "text-sky-400" : "text-slate-400 group-hover:text-white"}`}>
        {children}
      </span>
      <span className="ml-3 tracking-wide">{label}</span>
      
      {/* Indikator Glow Halus saat Active */}
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-sky-400 rounded-l-full opacity-0 lg:opacity-100 shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>
      )}
    </Link>
  );
}

export default function SiswaLayout({ children, header }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Ambil data app & user
  const { auth, app } = usePage().props; 
  const user = auth?.user;

  // Data Sekolah & Logo
  const schoolName = app?.nama_sekolah || "Sistem Absensi";
  const logoUrl = app?.logo_url || "https://ui-avatars.com/api/?name=S&background=0ea5e9&color=fff";
  const appLabel = "STUDENT PORTAL";

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 ring-1 ring-white/10">
      {/* BRAND SECTION */}
      <div className="flex h-20 shrink-0 items-center gap-x-4 mt-2 border-b border-slate-800">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <img
            className="relative h-11 w-11 rounded-xl object-cover ring-2 ring-slate-800 bg-slate-800"
            src={logoUrl}
            alt="Logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://ui-avatars.com/api/?name=S&background=0ea5e9&color=fff";
            }}
          />
        </div>

        <div className="leading-tight overflow-hidden">
          <div className="text-white font-bold text-sm tracking-tight truncate" title={schoolName}>
            {schoolName}
          </div>
          <div className="text-sky-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            {appLabel}
          </div>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
              Menu Utama
            </div>
            <ul role="list" className="-mx-2 space-y-2">
              {navigation.map((item) => {
                let href = "#";
                try { href = route(item.routeName); } catch (e) {}
                const isActive = route().current(item.routeName);

                return (
                  <li key={item.name}>
                    <NavLink
                      href={href}
                      active={isActive}
                      label={item.name}
                    >
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </li>

          <li className="mt-auto">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
              Akun
            </div>
            <ul role="list" className="-mx-2 space-y-1">
                <li>
                    <NavLink
                      href={route('logout')}
                      method="post"
                      as="button"
                      active={false}
                      label="Keluar Aplikasi"
                    >
                      <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                    </NavLink>
                </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      <Toaster 
        position="top-center" 
        toastOptions={{
            style: {
                background: '#334155',
                color: '#fff',
                borderRadius: '12px',
            }
        }}
      />

      {/* Mobile Sidebar (Modal) */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
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
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar (Static) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col shadow-2xl">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-slate-700 lg:hidden hover:text-sky-600 transition" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            {/* Header Title */}
            <div className="flex flex-col justify-center">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">{header}</h1>
                <p className="hidden sm:block text-xs text-slate-500">Selamat datang kembali, Semangat belajar!</p>
            </div>

            {/* User Dropdown */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Divider vertical */}
              <div className="hidden lg:block h-6 w-px bg-slate-200" aria-hidden="true" />

              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5 transition hover:bg-slate-100 rounded-full pr-3 pl-2">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 p-[2px]">
                     <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-slate-400" />
                     </div>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-3 text-sm font-semibold leading-6 text-slate-700 max-w-[100px] truncate">
                      {user?.nama_lengkap || "Siswa"}
                    </span>
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-slate-400" aria-hidden="true" />
                  </span>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-2xl bg-white py-2 shadow-xl ring-1 ring-gray-900/5 focus:outline-none border border-slate-100">
                    <div className="px-4 py-2 border-b border-slate-100 lg:hidden">
                        <p className="text-xs text-slate-500">Login sebagai</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.nama_lengkap}</p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={route("profile.edit")}
                          className={`${active ? "bg-sky-50 text-sky-600" : "text-slate-700"} block px-4 py-2 text-sm font-medium transition-colors`}
                        >
                          Pengaturan Profil
                        </Link>
                      )}
                    </Menu.Item>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={route("logout")}
                          method="post"
                          as="button"
                          className={`${active ? "bg-rose-50 text-rose-600" : "text-slate-700"} block w-full text-left px-4 py-2 text-sm font-medium transition-colors`}
                        >
                          Keluar (Logout)
                        </Link>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="py-8 animate-fade-in-up">
          <div className="px-4 sm:px-6 lg:px-8">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}