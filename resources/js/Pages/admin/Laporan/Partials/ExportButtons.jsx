// resources/js/Pages/admin/Laporan/Partials/ExportButtons.jsx
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { usePage } from '@inertiajs/react';

export default function ExportButtons({ scope = 'guru' }) {
  const { filters = {} } = usePage().props;
  const qs = new URLSearchParams({
    periode: filters.periode || 'bulanan',
    bulan: filters.bulan || '',
    id_kelas: filters.id_kelas || '',
    q: filters.q || ''
  }).toString();

  const pdf  = () => window.open(route('admin.laporan.export.pdf', { scope })   + `?${qs}`,  '_blank');
  const xlsx = () => window.open(route('admin.laporan.export.excel', { scope }) + `?${qs}`,  '_blank');

  return (
    <div className="flex gap-2">
      <button onClick={pdf}  className="btn btn-red"><PrinterIcon className="w-5 h-5 mr-1"/>PDF</button>
      <button onClick={xlsx} className="btn btn-green"><DocumentArrowDownIcon className="w-5 h-5 mr-1"/>Excel</button>
    </div>
  );
}
