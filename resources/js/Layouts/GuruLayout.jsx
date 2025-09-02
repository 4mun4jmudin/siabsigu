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
} from 'lucide-react';

/**
 * Helper untuk memeriksa apakah sebuah route ada tanpa menyebabkan error.
 * Ini berguna agar aplikasi tidak crash jika link menunjuk ke route yang belum dibuat.
 * @param {string} name - Nama route yang akan diperiksa.
 * @returns {boolean} - True jika route ada, false jika tidak.
 */
function routeExists(name) {
  try {
    // Fungsi route() dari Ziggy akan melempar error jika nama tidak ditemukan
    window.route(name);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Helper untuk membuat URL route dengan aman.
 * Jika route tidak ada, akan mengembalikan fallback (defaultnya '#').
 * @param {string} name - Nama route.
 * @param {object} params - Parameter untuk route.
 * @param {string} fallback - Nilai yang dikembalikan jika route tidak ada.
 * @returns {string} - URL yang sudah jadi atau nilai fallback.
 */
function safeRoute(name, params = {}, fallback = '#') {
  return routeExists(name) ? window.route(name, params) : fallback;
}

// Daftar item navigasi
const navigationItems = [
  { name: 'Dashboard', href: 'guru.dashboard', icon: Home },
  { name: 'Jurnal Mengajar', href: 'guru.jurnal.index', icon: BookOpen },
  { name: 'Absensi Siswa', href: '#', icon: ClipboardCheck }, // Ganti '#' saat rute sudah siap
  { name: 'Jadwal Saya', href: '#', icon: CalendarDays },
  { name: 'Daftar Siswa', href: '#', icon: Users },
  { name: 'Laporan', href: '#', icon: FileText },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Komponen NavItem yang terpisah untuk kebersihan kode
function NavItem({ item, collapsed }) {
  const targetHref = safeRoute(item.href);
  // Cek apakah route saat ini cocok dengan href item navigasi
  const isActive = targetHref !== '#' && window.route().current(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={targetHref}
      className={classNames(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-sky-700 text-white' : 'text-slate-100 hover:bg-slate-700 hover:text-white'
      )}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.name : undefined}
    >
      <span className={classNames(collapsed ? 'mx-auto' : 'flex-none')}>
        <Icon className={classNames('h-5 w-5', isActive ? 'text-white' : 'text-slate-200')} />
      </span>
      {!collapsed && <span className="truncate">{item.name}</span>}

      {/* Tooltip yang hanya muncul saat sidebar diciutkan */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden whitespace-nowrap rounded-md bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white group-hover:block z-10">
          {item.name}
        </span>
      )}
    </Link>
  );
}


export default function GuruLayout({ children, header = 'Panel Guru' }) {
  const { auth, flash } = usePage().props;
  const user = auth?.user ?? { nama_lengkap: 'Pengguna' };

  const [sidebarOpen, setSidebarOpen] = useState(false); // Untuk mobile
  const [collapsed, setCollapsed] = useState(false); // Untuk desktop
  
  // Menangani notifikasi dari flash session
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);
  
  // Contoh data notifikasi
  const notifications = useMemo(() => [
    { id: 1, title: 'Pengumuman: Rapat GTK', time: '2 jam lalu' },
    { id: 2, title: 'Jurnal perlu konfirmasi', time: '1 hari lalu' },
  ], []);

  // Konten Sidebar (digunakan untuk mobile dan desktop)
  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className={classNames("flex h-16 items-center", isMobile ? "px-4" : "px-4 justify-between")}>
        <Link href={safeRoute('guru.dashboard')} className="flex items-center gap-3">
          <div className={classNames('flex h-10 w-10 items-center justify-center rounded-md', collapsed && !isMobile ? 'bg-sky-800' : 'bg-white/10')}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {!collapsed && <div className="text-lg font-semibold">Panel Guru</div>}
        </Link>
        {!isMobile && (
            <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-full text-white bg-white/10 hover:bg-white/20">
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navigationItems.map(item => <NavItem key={item.name} item={item} collapsed={!isMobile && collapsed} />)}
      </nav>
      <div className="p-3 border-t border-sky-800">
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`} alt={user.nama_lengkap} className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.nama_lengkap}</div>
              <div className="text-xs text-sky-200/80">Guru</div>
            </div>
            <Link href={safeRoute('profile.edit')} className="text-sky-200 hover:text-white" title="Profil">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Link href={safeRoute('profile.edit')} className="text-sky-200 hover:text-white" title="Profil">
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

      <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* --- Sidebar (Desktop) --- */}
        <aside className={classNames('hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-sky-900 text-white transition-all duration-300', collapsed ? 'lg:w-20' : 'lg:w-64')}>
            <SidebarContent />
        </aside>

        {/* --- Mobile sidebar (Dialog) --- */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/60" />
            </Transition.Child>
            <div className="fixed inset-0 flex">
              <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-sky-900 text-white">
                  <button className="absolute top-4 right-4 p-1 text-white" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar">
                    <X className="h-6 w-6" />
                  </button>
                  <SidebarContent isMobile={true} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* --- Main column --- */}
        <div className={classNames("flex min-w-0 flex-1 flex-col transition-all duration-300", collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
                        <Bell className="h-6 w-6" />
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                    </button>
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
                    <Menu as="div" className="relative">
                        <Menu.Button className="-m-1.5 flex items-center p-1.5">
                            <img className="h-8 w-8 rounded-full bg-gray-50" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`} alt="" />
                            <span className="hidden lg:flex lg:items-center">
                                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">{user.nama_lengkap}</span>
                                <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                            </span>
                        </Menu.Button>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <Menu.Item>{({ active }) => <Link href={safeRoute('profile.edit')} className={classNames(active ? 'bg-gray-50' : '', 'block px-3 py-1 text-sm leading-6 text-gray-900')}>Profil Saya</Link>}</Menu.Item>
                                <Menu.Item>{({ active }) => <Link href={safeRoute('logout')} method="post" as="button" className={classNames(active ? 'bg-gray-50' : '', 'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900')}>Keluar</Link>}</Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
          </header>
          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}