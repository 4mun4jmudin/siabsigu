import React, { useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DocumentArrowDownIcon, TableCellsIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

export default function Monthly({ auth, filters, kelasOptions = [], rows = [], featureMode = 'full' }) {
  const month = filters?.month || new Date().toISOString().slice(0,7);
  const kelas = filters?.id_kelas || "";

  const buildExportUrl = (fmt) => {
    const params = new URLSearchParams({ month, id_kelas: kelas });
    const name = fmt === 'excel' ? 'admin.absensi-siswa.bulanan.export.excel' : 'admin.absensi-siswa.bulanan.export.pdf';
    return `${route(name)}?${params.toString()}`;
  };

  const onChangeFilter = (key, value) => {
    const q = { month, id_kelas: kelas, [key]: value };
    router.get(route('admin.absensi-siswa.bulanan.index'), q, { preserveState: true, preserveScroll: true, replace: true });
  };

  const total = useMemo(() => {
    const init = { hadir:0, sakit:0, izin:0, alfa:0 };
    return (rows || []).reduce((acc, r) => {
      acc.hadir += Number(r.hadir||0);
      acc.sakit += Number(r.sakit||0);
      acc.izin  += Number(r.izin||0);
      acc.alfa  += Number(r.alfa||0);
      return acc;
    }, init);
  }, [rows]);

  const totalTercatat = total.hadir + total.sakit + total.izin + total.alfa;
  const persenTotal = totalTercatat ? Math.round(total.hadir / totalTercatat * 100) : 0;

  return (
    <AdminLayout user={auth.user} header="Rekap Bulanan Absensi Siswa">
      <Head title="Rekap Bulanan Absensi Siswa" />

      <div className="space-y-6">
        {/* Header + Switch Harian/Bulanan */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bulan</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e)=>onChangeFilter('month', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kelas (opsional)</label>
                <select
                  value={kelas}
                  onChange={(e)=>onChangeFilter('id_kelas', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map(k => (
                    <option key={k.id_kelas} value={k.id_kelas}>
                      {k.tingkat} {k.jurusan}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <a href={buildExportUrl('excel')} target="_blank" className="inline-flex items-center px-3 py-2 bg-white border rounded-md text-sm hover:shadow">
                  <TableCellsIcon className="h-4 w-4 mr-2" /> Excel
                </a>
                <a href={buildExportUrl('pdf')}   target="_blank" className="inline-flex items-center px-3 py-2 bg-white border rounded-md text-sm hover:shadow">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" /> PDF
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={route('admin.absensi-siswa.index', { id_kelas: kelas })}
                className="inline-flex items-center px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
              >
                <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                Ke Harian
              </Link>
            </div>
          </div>
        </div>

        {/* Ringkasan atas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard label="Hadir" value={total.hadir} color="#16a34a" />
          <SummaryCard label="Sakit" value={total.sakit} color="#f59e0b" />
          <SummaryCard label="Izin"  value={total.izin}  color="#3b82f6" />
          <SummaryCard label="Alfa"  value={total.alfa}  color="#ef4444" />
          <SummaryCard label="Kehadiran (%)" value={persenTotal + '%'} color="#0ea5e9" />
        </div>

        {/* Tabel rekap per kelas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {['Kelas','Hadir','Sakit','Izin','Alfa','Kehadiran (%)','Rata Telat (menit)'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows||[]).length ? rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.nama_kelas}</td>
                  <td className="px-3 py-2">{r.hadir}</td>
                  <td className="px-3 py-2">{r.sakit}</td>
                  <td className="px-3 py-2">{r.izin}</td>
                  <td className="px-3 py-2">{r.alfa}</td>
                  <td className="px-3 py-2">{r.persen_hadir}%</td>
                  <td className="px-3 py-2">{r.rata_telat}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-400">Tidak ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{color}}>{value}</div>
    </div>
  );
}
