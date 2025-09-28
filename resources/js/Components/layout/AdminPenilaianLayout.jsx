import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import NavItem from "./NavItem";

// ikon minimal (tanpa dependency)
const Icon = {
  gauge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 3v3M4.2 7.8l2.1 2.1M3 12h3M7.8 19.8l2.1-2.1M21 12h-3M19.8 7.8l-2.1 2.1M12 21a9 9 0 1 0-9-9" />
      <path d="M12 12l4 2" />
    </svg>
  ),
  weight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <path d="M7 10v10M17 10v10M12 10v10" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  ),
  detail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h7M7 16h5" />
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 3h12v18H6z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="8" r="5" />
      <path d="M8 13l-2 8 6-3 6 3-2-8" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 3v18h18" />
      <path d="M7 15v3M12 9v9M17 12v6" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 7h-5V2" />
      <path d="M20 7a9 9 0 1 0 3 6" />
    </svg>
  ),
};

export default function AdminPenilaianLayout({ children, title = "Penilaian" }) {
  const [open, setOpen] = useState(true);
  const { auth } = usePage().props || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setOpen((s) => !s)}
            className="p-2 rounded hover:bg-gray-100 md:hidden"
            aria-label="Toggle Sidebar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {/* <Link href={route("admin.penilaian.dashboard")} className="font-bold">
            Sistem Penilaian
          </Link> */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded hover:bg-gray-100"
              title="Refresh"
            >
              {Icon.refresh}
            </button>
            <div className="text-sm text-gray-600">
              {auth?.user?.nama_lengkap || auth?.user?.username || "Admin"}
            </div>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 py-4">
          {/* Sidebar */}
          <aside className={["md:block", open ? "block" : "hidden"].join(" ")}>
            <nav className="bg-white border rounded-xl p-3 space-y-1 shadow-sm">
              <NavItem href={route("admin.penilaian.dashboard")} icon={Icon.gauge}>
                Dashboard
              </NavItem>

              <div className="mt-2 mb-1 text-xs font-semibold text-gray-500 px-2">
                Data & Operasional
              </div>
              <NavItem href={route("admin.penilaian.bobot.index")} icon={Icon.weight}>
                Bobot Nilai
              </NavItem>
              <NavItem href={route("admin.penilaian.nilai.index")} icon={Icon.list}>
                Daftar Nilai Kelas/Mapel
              </NavItem>
              {/* <NavItem href={route("admin.penilaian.detail.index")} icon={Icon.detail}>
                Detail Nilai
              </NavItem> */}

              {/* <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2">
                Kenaikan & Rapor
              </div>
              <NavItem href={route("admin.penilaian.kriteria.index")} icon={Icon.rules}>
                Kriteria Kenaikan
              </NavItem>
              <NavItem href={route("admin.penilaian.keputusan.index")} icon={Icon.award}>
                Keputusan Kenaikan
              </NavItem>
              <NavItem href={route("admin.penilaian.rapor.index")} icon={Icon.detail}>
                Rapor
              </NavItem>

              <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2">
                Analitik
              </div>
              <NavItem href={route("admin.penilaian.analytics.index")} icon={Icon.chart}>
                Analisis Nilai
              </NavItem> */}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              {title ? <h1 className="text-xl font-semibold mb-4">{title}</h1> : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
