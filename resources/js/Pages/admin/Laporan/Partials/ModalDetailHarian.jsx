// resources/js/Pages/admin/Laporan/Partials/ModalDetailHarian.jsx
import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - tanggal: string | Date   // 'YYYY-MM-DD' atau Date
 * - title?: string           // judul tambahan (opsional)
 * - rows: Array<{
 *     id?: string|number,
 *     tipe?: 'Guru'|'Siswa',   // opsional
 *     nama?: string,
 *     nis?: string,            // untuk siswa (opsional)
 *     nip?: string,            // untuk guru  (opsional)
 *     status?: 'Hadir'|'Izin'|'Sakit'|'Alfa'|'Dinas Luar',
 *     jam_masuk?: string|null,
 *     jam_pulang?: string|null,
 *     keterangan?: string|null,
 *     foto_profil_url?: string|null
 *   }>
 * - loading?: boolean
 * - onExport?: (format: 'pdf'|'excel') => void   // jika tidak ada, excel akan fallback ke CSV di sisi klien
 */

function formatTanggalID(input) {
  try {
    const d = input instanceof Date ? input : new Date(String(input) + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(input);
  }
}

const statusStyle = {
  Hadir: "bg-green-100 text-green-700",
  Izin: "bg-blue-100 text-blue-700",
  Sakit: "bg-yellow-100 text-yellow-700",
  Alfa: "bg-red-100 text-red-700",
  "Dinas Luar": "bg-purple-100 text-purple-700",
};

function StatusBadge({ value }) {
  const cls = statusStyle[value] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {value || "-"}
    </span>
  );
}

function toCSV(rows) {
  const header = [
    "Tipe",
    "Nama",
    "NIS/NIP",
    "Status",
    "Jam Masuk",
    "Jam Pulang",
    "Keterangan",
  ];

  const lines = rows.map((r) => {
    const nomor = r?.nip || r?.nis || "-";
    // escape koma & kutip
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    return [
      esc(r?.tipe || ""),
      esc(r?.nama || ""),
      esc(nomor),
      esc(r?.status || ""),
      esc(r?.jam_masuk || ""),
      esc(r?.jam_pulang || ""),
      esc(r?.keterangan || ""),
    ].join(",");
  });

  return [header.join(","), ...lines].join("\n");
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ModalDetailHarian({
  open,
  onClose,
  tanggal,
  title,
  rows = [],
  loading = false,
  onExport,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query?.trim()) return rows || [];
    const q = query.toLowerCase();
    return (rows || []).filter((r) => {
      return (
        (r?.nama || "").toLowerCase().includes(q) ||
        (r?.nip || "").toLowerCase().includes(q) ||
        (r?.nis || "").toLowerCase().includes(q) ||
        (r?.status || "").toLowerCase().includes(q) ||
        (r?.tipe || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const ringkasan = useMemo(() => {
    const base = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0, "Dinas Luar": 0 };
    (rows || []).forEach((r) => {
      const s = r?.status || "";
      if (base[s] != null) base[s] += 1;
    });
    return base;
  }, [rows]);

  const handleExportExcel = () => {
    if (typeof onExport === "function") {
      onExport("excel");
      return;
    }
    // fallback: buat CSV lokal
    const csv = toCSV(filtered);
    const filename = `laporan_harian_${(tanggal || "")
      .toString()
      .replaceAll("-", "")}.csv`;
    downloadCSV(filename, csv);
  };

  const handleExportPdf = () => {
    if (typeof onExport === "function") {
      onExport("pdf");
      return;
    }
    // fallback: gunakan fitur print browser
    window.print?.();
  };

  return (
    <Transition.Root show={!!open} as={Fragment} appear>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start sm:items-center justify-center p-4 sm:p-6 lg:p-8">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-start justify-between border-b px-4 py-3 sm:px-6">
                  <div>
                    <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900">
                      {title || "Detail Kehadiran Harian"}
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Tanggal: <span className="font-medium">{formatTanggalID(tanggal)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPdf}
                      className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                      title="Unduh PDF / Cetak"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      title="Unduh Excel (CSV fallback)"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Excel
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <span className="sr-only">Tutup</span>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Ringkasan */}
                <div className="px-4 sm:px-6 py-3 border-b bg-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.entries(ringkasan).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between rounded-md bg-white px-3 py-2 ring-1 ring-gray-200"
                      >
                        <span className="text-xs text-gray-500">{k}</span>
                        <span className="text-sm font-semibold text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="px-4 sm:px-6 py-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama / NIS / NIP / status..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-md border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Tabel */}
                <div className="px-4 sm:px-6 pb-5">
                  <div className="overflow-auto rounded-lg ring-1 ring-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Tipe",
                            "Nama",
                            "NIS/NIP",
                            "Status",
                            "Jam Masuk",
                            "Jam Pulang",
                            "Keterangan",
                          ].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-500">
                              Memuat data...
                            </td>
                          </tr>
                        ) : filtered.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-500">
                              Tidak ada data untuk ditampilkan.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((r, idx) => (
                            <tr key={r?.id ?? idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {r?.tipe || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  {r?.foto_profil_url ? (
                                    <img
                                      src={r.foto_profil_url}
                                      alt={r?.nama || "-"}
                                      className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : null}
                                  <span className="font-medium">{r?.nama || "-"}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {r?.nip || r?.nis || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <StatusBadge value={r?.status} />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {r?.jam_masuk || "-"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                {r?.jam_pulang || "-"}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {r?.keterangan || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Total baris: <span className="font-semibold text-gray-600">{filtered.length}</span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
