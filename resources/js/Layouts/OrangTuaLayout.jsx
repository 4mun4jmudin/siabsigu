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

/* ======================
   Helpers: safe route check
   ====================== */
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

/* ======================
   Navigation items
   ====================== */
const navigationItems = [
  { name: 'Dashboard', href: 'orangtua.dashboard', icon: Home },
  { name: 'Absensi Ananda', href: 'orangtua.absensi.index', icon: CalendarDays },
  { name: 'Jadwal Pelajaran', href: 'orangtua.jadwal.index', icon: BookOpen },
  { name: 'Pengumuman', href: 'orangtua.pengumuman.index', icon: Users },
  // Uncomment or add more if needed (keamanan: tidak menghapus route existing)
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/* ======================
   NavItem (tidak ubah routing / click)
   ====================== */
function NavItem({ item, collapsed }) {
  const targetHref = safeRoute(item.href);
  const isActive = targetHref !== '#' && window.route().current(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={targetHref}
      className={classNames(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
        isActive
          ? 'bg-sky-700 text-white focus:ring-sky-400'
          : 'text-slate-100 hover:bg-slate-700 hover:text-white focus:ring-slate-500/30'
      )}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.name : undefined}
    >
      <span className={classNames(collapsed ? 'mx-auto' : 'flex-none')}>
        <Icon className={classNames('h-5 w-5', isActive ? 'text-white' : 'text-slate-200')} aria-hidden />
      </span>

      {!collapsed && <span className="truncate">{item.name}</span>}

      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden whitespace-nowrap rounded-md bg-slate-900/95 px-3 py-1 text-xs font-semibold text-white group-hover:block z-10">
          {item.name}
        </span>
      )}
    </Link>
  );
}

/* ======================
   Layout component (renamed to OrangTuaLayout)
   ====================== */
export default function OrangTuaLayout({ children, header = 'Panel Orang Tua/Wali' }) {
  const { auth, flash } = usePage().props;
  const user = auth?.user ?? { nama_lengkap: 'Pengguna' };

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(false); // desktop

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  // notifikasi contoh — tidak ubah fungsional
  const notifications = useMemo(() => [
    { id: 1, title: 'Pengumuman: Rapat GTK', time: '2 jam lalu' },
    { id: 2, title: 'Jurnal perlu konfirmasi', time: '1 hari lalu' },
  ], []);

  /* Sidebar content component (shared desktop & mobile) */
  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className={classNames('flex h-16 items-center', isMobile ? 'px-4' : 'px-4 justify-between')}>
        <Link href={safeRoute('orangtua.dashboard')} className="flex items-center gap-3">
          <div className={classNames('flex h-10 w-10 items-center justify-center rounded-md', (!isMobile && collapsed) ? 'bg-sky-800' : 'bg-white/10')}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {!collapsed && <div className="text-lg font-semibold leading-tight text-white">Panel Orang Tua/Wali</div>}
        </Link>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
            aria-label={collapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
            title={collapsed ? 'Perlebar' : 'Ciutkan'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1" aria-label="Sidebar">
        {navigationItems.map(item => (
          <NavItem key={item.name} item={item} collapsed={!isMobile && collapsed} />
        ))}
      </nav>

      <div className="p-3 border-t border-sky-800">
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`}
              alt={user.nama_lengkap}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-white">{user.nama_lengkap}</div>
              <div className="text-xs text-sky-200/80">Orang Tua / Wali</div>
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
        {/* Desktop sidebar */}
        <aside
          className={classNames(
            'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-sky-900 text-white transition-all duration-300',
            collapsed ? 'lg:w-20' : 'lg:w-64'
          )}
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar as dialog */}
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

        {/* Main content area */}
        <div className={classNames('flex min-w-0 flex-1 flex-col transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            {/* Page title (visible on mobile as well) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-sm font-semibold text-slate-900 truncate">{header}</h1>
                  <span className="hidden sm:inline text-xs text-slate-500">— Panel Orang Tua/Wali</span>
                </div>
                {/* contextual action area (small screens hide extra actions) */}
                <div className="flex items-center gap-2">
                  {/* Notifications */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="relative inline-flex items-center p-2 rounded-md text-gray-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500" aria-label="Notifikasi">
                      <Bell className="h-6 w-6" />
                      <span className="absolute -top-0.5 -right-0.5 inline-flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                      </span>
                    </Menu.Button>

                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                        <div className="px-2">
                          <div className="py-2 text-xs font-semibold text-slate-600 px-2">Notifikasi</div>
                          {notifications.map(n => (
                            <Menu.Item key={n.id}>
                              {() => (
                                <div className="block rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
                                  <div className="font-medium">{n.title}</div>
                                  <div className="text-xs text-slate-500">{n.time}</div>
                                </div>
                              )}
                            </Menu.Item>
                          ))}
                          {notifications.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">Belum ada notifikasi.</div>}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="-m-1.5 flex items-center p-1.5 rounded-md">
                      <img className="h-8 w-8 rounded-full bg-gray-50" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap)}&background=0ea5e9&color=fff`} alt={user.nama_lengkap} />
                      <span className="hidden lg:flex lg:items-center">
                        <span className="ml-3 text-sm font-semibold leading-6 text-gray-900">{user.nama_lengkap}</span>
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
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
