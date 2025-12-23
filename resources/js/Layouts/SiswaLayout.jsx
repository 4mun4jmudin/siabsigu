import React, { useState, Fragment, useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// ✅ lebih aman: simpan routeName, bukan URL hasil route()
const navigation = [
  { name: "Absensi", routeName: "siswa.dashboard", icon: HomeIcon },
  { name: "Akun Saya", routeName: "siswa.akun.edit", icon: ClipboardDocumentListIcon },
  { name: "Logout", routeName: "logout", icon: XMarkIcon, method: "post", as: "button" },
];

function pickFirst(...vals) {
  return vals.find((v) => v !== null && v !== undefined && String(v).trim() !== "") ?? null;
}

function resolveAssetUrl(val) {
  if (!val) return null;

  const s = String(val).trim();

  // full URL / data URL
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;

  // sudah absolute path
  if (s.startsWith("/")) return s;

  // dianggap path di disk public → pakai route storage.public
  // NOTE: param 'path' di route kamu pakai urldecode, jadi kita encode di sini
  return route("storage.public", { path: encodeURIComponent(s) });
}

function withVersion(url, version) {
  if (!url || !version) return url;
  return url.includes("?") ? `${url}&v=${version}` : `${url}?v=${version}`;
}

function NavLink({ href, active, children, label, method, as }) {
  const isButton = as === "button";
  return (
    <Link
      href={href}
      method={method}
      as={as}
      type={isButton ? "button" : undefined}
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
  const { auth, pengaturan } = usePage().props;
  const user = auth?.user;

  // ✅ ambil nama sekolah & logo dari pengaturan (pakai banyak kemungkinan nama kolom)
  const schoolNameRaw = pickFirst(
    pengaturan?.nama_sekolah,
    pengaturan?.nama_instansi,
    pengaturan?.nama_lembaga,
    pengaturan?.school_name
  );

  const appLabelRaw = pickFirst(
    pengaturan?.nama_aplikasi,
    pengaturan?.app_name,
    "SISWA AREA"
  );

  const logoRaw = pickFirst(
    pengaturan?.logo_url,
    pengaturan?.logo_sekolah_url,
    pengaturan?.logo_sekolah,
    pengaturan?.logo,
    pengaturan?.logo_path
  );

  const version = useMemo(() => {
    // cache-busting: pakai updated_at pengaturan kalau ada
    try {
      if (!pengaturan?.updated_at) return null;
      return new Date(pengaturan.updated_at).getTime();
    } catch {
      return null;
    }
  }, [pengaturan?.updated_at]);

  const schoolName = schoolNameRaw || "Nama Sekolah";
  const appLabel = appLabelRaw || "SISWA AREA";

  const defaultLogo =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRl33BhpowHZZHfLJuzZrr3VVSMwe5t4evLmA&s";

  const logoUrl = withVersion(resolveAssetUrl(logoRaw) || defaultLogo, version);

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sky-800 px-6 pb-4">
      {/* BRAND */}
      <div className="flex h-16 shrink-0 items-center gap-x-3">
        <img
          className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/20 bg-white/10"
          src={logoUrl}
          alt="Logo Sekolah"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultLogo;
          }}
        />

        <div className="leading-tight">
          <div className="text-white font-extrabold text-sm sm:text-base line-clamp-1">
            {schoolName}
          </div>
          <div className="text-sky-100/80 text-[11px] font-semibold uppercase tracking-wide">
            {appLabel}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const href = route(item.routeName);

                // ✅ active check pakai route name (lebih akurat)
                const isActive = item.method === "post" ? false : route().current(item.routeName);

                return (
                  <li key={item.name}>
                    <NavLink
                      href={href}
                      method={item.method}
                      as={item.as}
                      active={isActive}
                      label={item.name}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Mobile Sidebar */}
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
            <div className="fixed inset-0 bg-gray-900/80" />
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Main */}
      <div className="lg:pl-72">
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
                      {user?.nama_lengkap || "User"}
                    </span>
                    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
                  </span>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-36 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={route("profile.edit")}
                          className={`${active ? "bg-gray-50" : ""} block px-3 py-1 text-sm text-gray-900`}
                        >
                          Profil
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={route("logout")}
                          method="post"
                          as="button"
                          className={`${active ? "bg-gray-50" : ""} block w-full text-left px-3 py-1 text-sm text-gray-900`}
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

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
