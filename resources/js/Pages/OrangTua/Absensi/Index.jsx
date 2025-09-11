import React, { useMemo } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, useForm } from '@inertiajs/react';
import { BookOpen, Clock, CheckCircle, Plus, Heart, AlertCircle, Filter, AlertCircle as AlertIcon } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import InputError from '@/Components/InputError';

// Simple classnames helper (fallback if you don't have a util)
const cn = (...classes) => classes.filter(Boolean).join(' ');

/* ============================
   Small UI helpers
   ============================ */
const AttendanceStatusTag = ({ status }) => {
  const statusMap = {
    Hadir: 'bg-emerald-100 text-emerald-800',
    Sakit: 'bg-amber-100 text-amber-800',
    Izin: 'bg-yellow-100 text-yellow-800',
    Alfa: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', statusMap[status] || 'bg-slate-100 text-slate-800')}>
      {status}
    </span>
  );
};

function LegendItem({ color, icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-6 w-6 rounded-md flex items-center justify-center text-white', color)}>{icon}</div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  );
}

/* ============================
   Calendar component (circle cells)
   ============================ */
const Calendar = ({ month, year, absensiHarian = {}, onDateClick, selectedDate }) => {
  // compute today's iso string
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // prepare monthDays
  const monthDays = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const first = (firstOfMonth.getDay() + 6) % 7; // Monday start
    const dim = new Date(year, month, 0).getDate();
    return Array.from({ length: first }, () => null).concat(Array.from({ length: dim }, (_, i) => i + 1));
  }, [month, year]);

  const statusMap = {
    Hadir: { bg: 'bg-sky-600', icon: <CheckCircle className="h-4 w-4 text-white" /> },
    Izin:  { bg: 'bg-yellow-400', icon: <Plus className="h-4 w-4 text-white" /> },
    Sakit: { bg: 'bg-amber-600', icon: <Heart className="h-4 w-4 text-white" /> },
    Alfa:  { bg: 'bg-rose-600', icon: <AlertCircle className="h-4 w-4 text-white" /> },
  };

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-4 mb-3">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1 select-none">{d}</div>
        ))}
      </div>

      {/* Calendar grid - circular cells */}
      <div className="grid grid-cols-7 gap-4 justify-items-center">
        {monthDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-12 md:h-14" />;

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const absen = absensiHarian[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isSunday = (idx % 7) === 6;

          const status = absen?.status_kehadiran;
          const statusStyle = status ? statusMap[status] : null;

          // circle base
          const circleBase = 'flex items-center justify-center rounded-full transition-transform duration-150 ease-out cursor-pointer select-none';
          const circleSize = 'w-12 h-12 md:w-14 md:h-14'; // adjust sizes if needed
          const colored = statusStyle ? `${statusStyle.bg} text-white` : 'bg-white text-slate-800 border border-slate-200';
          const hoverEffect = statusStyle ? 'hover:scale-105 hover:shadow-lg' : 'hover:scale-105 hover:shadow';
          const todayRing = isToday ? 'ring-2 ring-sky-300' : '';
          const selectedRing = isSelected ? 'ring-2 ring-sky-500 ring-offset-2' : '';

          return (
            <div key={dateStr} className="relative w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => onDateClick(dateStr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDateClick(dateStr);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Tanggal ${day} ${month} ${year}${status ? `, status ${status}` : ''}`}
                className={cn(circleBase, circleSize, colored, hoverEffect, todayRing, selectedRing, 'group')}
              >
                <span className={cn('text-sm font-semibold', status ? 'text-white' : (isSunday ? 'text-rose-600' : 'text-slate-800'))}>
                  {day}
                </span>

                {/* small icon badge for status (top-right) */}
                {statusStyle && (
                  <span className="absolute -top-1 -right-1 bg-white/20 rounded-full p-1">
                    {statusStyle.icon}
                  </span>
                )}
              </button>

              {/* Tooltip (hover / focus) */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-50 opacity-0 scale-95 pointer-events-none transition-all duration-150 group-hover:opacity-100 group-focus:opacity-100 group-hover:scale-100 group-focus:scale-100">
                {absen && (
                  <div className="w-48 rounded-md bg-white border border-slate-200 shadow-md p-3 text-xs text-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-shrink-0">{statusStyle?.icon}</div>
                      <div className="font-semibold">{absen.status_kehadiran}</div>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2"><Clock className="w-3 h-3" /> Masuk: {absen.jam_masuk?.slice(0,5) || '-'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1"><Clock className="w-3 h-3" /> Pulang: {absen.jam_pulang?.slice(0,5) || '-'}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-xs">
        <LegendItem color="bg-sky-600" icon={<CheckCircle className="h-4 w-4 text-white" />} label="Hadir" />
        <LegendItem color="bg-yellow-400" icon={<Plus className="h-4 w-4 text-white" />} label="Izin" />
        <LegendItem color="bg-amber-600" icon={<Heart className="h-4 w-4 text-white" />} label="Sakit" />
        <LegendItem color="bg-rose-600" icon={<AlertCircle className="h-4 w-4 text-white" />} label="Alfa" />
      </div>
    </div>
  );
};

/* ============================
   RiwayatTab (tabel / filter)
   ============================ */
const RiwayatTab = ({ riwayatKehadiran, filters }) => {
  const { data, setData, get, processing } = useForm({
    status: filters.status || 'Semua',
    tanggal_mulai: filters.tanggal_mulai || '',
    tanggal_selesai: filters.tanggal_selesai || '',
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    get(route('orangtua.absensi.index'), {
      data: { ...data, tab: 'riwayat' },
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-grow min-w-[160px]">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select id="status" value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
            <option>Semua</option>
            <option>Hadir</option>
            <option>Sakit</option>
            <option>Izin</option>
            <option>Alfa</option>
            <option>Terlambat</option>
          </select>
        </div>
        <div className="flex-grow min-w-[170px]">
          <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700">Dari Tanggal</label>
          <input type="date" id="tanggal_mulai" value={data.tanggal_mulai} onChange={e => setData('tanggal_mulai', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
        </div>
        <div className="flex-grow min-w-[170px]">
          <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700">Sampai Tanggal</label>
          <input type="date" id="tanggal_selesai" value={data.tanggal_selesai} onChange={e => setData('tanggal_selesai', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
        </div>
        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-sky-600 text-white flex items-center justify-center gap-2 h-10 mt-1 w-full md:w-auto">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Tanggal</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Jam Masuk</th>
              <th scope="col" className="px-6 py-3">Jam Pulang</th>
              <th scope="col" className="px-6 py-3">Keterlambatan</th>
            </tr>
          </thead>
          <tbody>
            {riwayatKehadiran.data.map(absen => (
              <tr key={absen.id_absensi} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {new Date(absen.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </td>
                <td className="px-6 py-4"><AttendanceStatusTag status={absen.status_kehadiran} /></td>
                <td className="px-6 py-4">{absen.jam_masuk?.slice(0, 5) || '-'}</td>
                <td className="px-6 py-4">{absen.jam_pulang?.slice(0, 5) || '-'}</td>
                <td className={`px-6 py-4 font-medium ${absen.menit_keterlambatan > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {absen.menit_keterlambatan > 0 ? `${absen.menit_keterlambatan} menit` : 'Tepat Waktu'}
                </td>
              </tr>
            ))}
            {riwayatKehadiran.data.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                  <AlertIcon className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                  Tidak ada data riwayat yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination links={riwayatKehadiran.links} className="mt-6" />
    </div>
  );
};


/* ============================
   Main Page (Absensi Index)
   ============================ */
export default function AbsensiIndex({ auth, siswa, absensiHarian = {}, absensiMapel = {}, riwayatKehadiran, filters }) {
  const [activeTab, setActiveTab] = React.useState(filters.tab || 'kalender');
  const [selectedDate, setSelectedDate] = React.useState(null);

  const { data, setData, get, processing } = useForm({
    bulan: filters.bulan || new Date().getMonth() + 1,
    tahun: filters.tahun || new Date().getFullYear(),
  });

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleMonthYearChange = (e) => {
    e.preventDefault();
    get(route('orangtua.absensi.index'), { data, preserveState: true });
  };

  return (
    <OrangTuaLayout user={auth.user} header="Riwayat Absensi Ananda">
      <Head title="Absensi" />
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('kalender')} className={cn('whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'kalender' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
              Tampilan Kalender
            </button>
            <button onClick={() => setActiveTab('riwayat')} className={cn('whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'riwayat' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
              Riwayat Kehadiran
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'kalender' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleMonthYearChange} className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-semibold text-gray-800">{months[data.bulan - 1]} {data.tahun}</h2>
                  <div className="flex items-center gap-2">
                    <select value={data.bulan} onChange={e => setData('bulan', e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={data.tahun} onChange={e => setData('tahun', e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button type="submit" disabled={processing} className="px-3 py-2 rounded-md bg-sky-600 text-white text-sm">Tampilkan</button>
                  </div>
                </form>

                <Calendar month={Number(data.bulan)} year={Number(data.tahun)} absensiHarian={absensiHarian} onDateClick={setSelectedDate} selectedDate={selectedDate} />
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 self-start">
                <h3 className="font-semibold text-gray-800 mb-4">Detail Absensi</h3>
                {selectedDate ? (
                  <div className="space-y-4">
                    <p className="font-medium text-center pb-2 border-b">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Absensi Harian</p>
                      {absensiHarian[selectedDate] ? (
                        <div className="flex justify-between items-center text-sm">
                          <AttendanceStatusTag status={absensiHarian[selectedDate].status_kehadiran} />
                          <div className="text-gray-600">
                            <span>M: {absensiHarian[selectedDate].jam_masuk?.slice(0, 5) || '-'}</span>
                            <span className="ml-3">P: {absensiHarian[selectedDate].jam_pulang?.slice(0, 5) || '-'}</span>
                          </div>
                        </div>
                      ) : <p className="text-xs text-gray-500">Tidak ada data.</p>}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Absensi per Mata Pelajaran</p>
                      <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {absensiMapel[selectedDate]?.length > 0 ? absensiMapel[selectedDate].map(absen => (
                          <li key={absen.id_absensi_mapel} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-gray-800 text-sm flex items-center"><BookOpen className="w-4 h-4 mr-2 text-sky-600" />{absen.jadwal.mapel.nama_mapel}</p>
                              <AttendanceStatusTag status={absen.status_kehadiran} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1.5" />{absen.jam_mulai.slice(0, 5)} - {absen.jam_selesai.slice(0, 5)}</p>
                          </li>
                        )) : <p className="text-xs text-gray-500 text-center py-2">Tidak ada jadwal pelajaran.</p>}
                      </ul>
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-500 text-center py-10">Pilih tanggal pada kalender untuk melihat detail.</p>}
              </div>
            </div>
          )}
          {activeTab === 'riwayat' && <RiwayatTab riwayatKehadiran={riwayatKehadiran} filters={filters} />}
        </div>
      </div>
    </OrangTuaLayout>
  );
}
