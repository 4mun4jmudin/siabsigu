// resources/js/Pages/OrangTua/JadwalIndex.jsx
import React, { useMemo, useState } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head } from '@inertiajs/react';
import { Clock, Book, User, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

// helper cn
const cn = (...c) => c.filter(Boolean).join(' ');
const fmtTime = (t) => (t ? t.slice(0,5) : '-');
const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const JadwalCard = ({ pelajaran }) => {
  const { mapel, jam_mulai, jam_selesai, guru } = pelajaran;
  const teacherName = guru?.nama_lengkap || '—';
  const mapelKategori = mapel?.kategori || '';

  const categoryHue = (name = '') => {
    if (!name) return 'bg-sky-100 text-sky-800';
    const k = name.toLowerCase();
    if (k.includes('agama')) return 'bg-amber-100 text-amber-800';
    if (k.includes('matematika') || k.includes('ipa')) return 'bg-emerald-100 text-emerald-800';
    if (k.includes('bahasa')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-sky-100 text-sky-800';
  };

  return (
    <article
      className="group relative flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-visible"
      aria-label={`${mapel?.nama_mapel || 'Mata Pelajaran'} pada ${fmtTime(jam_mulai)} - ${fmtTime(jam_selesai)}`}
    >
      <div className="flex-shrink-0">
        <div className="h-14 w-2 rounded-md bg-gradient-to-b from-sky-500 to-sky-700" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 flex-shrink-0">
              {initials(teacherName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 truncate">
                <Book className="w-4 h-4 text-sky-600" />
                <span className="truncate">{mapel?.nama_mapel || '-'}</span>
              </h4>
              <p className="text-xs text-slate-500 truncate">{teacherName}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Waktu</div>
            <div className="text-sm font-medium text-slate-900">{fmtTime(jam_mulai)} — {fmtTime(jam_selesai)}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', categoryHue(mapelKategori))}>
              {mapelKategori || 'Umum'}
            </span>
            {pelajaran?.id_kelas && <span className="text-xs text-slate-400">Kelas {pelajaran.id_kelas}</span>}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{fmtTime(jam_mulai)}</span>
            <span className="mx-1">•</span>
            <span>{fmtTime(jam_selesai)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function JadwalIndex({ auth, siswa, jadwalPelajaran = {} }) {
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const jadwalTersusun = daysOrder.map(day => ({
    hari: day,
    pelajaran: (jadwalPelajaran[day] || []).sort((a,b) => (a.jam_mulai||'').localeCompare(b.jam_mulai||''))
  }));

  const todayName = useMemo(() => {
    const d = new Date();
    const mapping = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    return mapping[d.getDay()];
  }, []);

  const [collapsed, setCollapsed] = useState(
    daysOrder.reduce((acc, d, i) => ({ ...acc, [d]: i !== daysOrder.indexOf(todayName) }), {})
  );
  const toggle = (hari) => setCollapsed(s => ({ ...s, [hari]: !s[hari] }));

  return (
    <OrangTuaLayout
      user={auth.user}
      header={`Jadwal Pelajaran ${siswa?.nama_panggilan || siswa?.nama_lengkap || ''}${siswa?.kelas ? ` — Kelas ${siswa.kelas.tingkat} ${siswa.kelas.jurusan || ''}` : ''}`}
    >
      <Head title="Jadwal Pelajaran" />

      {/* main content wrapper: add top padding + min-height + overflow-auto to avoid clipping */}
      <div className="pt-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)] overflow-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Jadwal Pelajaran</h1>
              <p className="text-sm text-slate-500">Jadwal lengkap per hari untuk ananda Anda</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500 hidden sm:block">Sorot hari ini:</div>
            <div className="px-3 py-1 text-sm rounded-full bg-sky-50 text-sky-700 font-medium">{todayName}</div>
          </div>
        </div>

        {/* grid: add items-start so columns align at top; allow overflow-visible for sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {jadwalTersusun.map(({ hari, pelajaran }) => {
            const isToday = hari === todayName;
            return (
              <section key={hari} className={cn('bg-white rounded-xl border border-slate-100 p-4 shadow-sm overflow-visible')}>
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className={cn('text-sm font-semibold', isToday ? 'text-sky-700' : 'text-slate-800')}>{hari}</h2>
                    <span className="text-xs text-slate-400">{pelajaran.length} mata</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(hari)}
                      aria-expanded={!collapsed[hari]}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800"
                      title={collapsed[hari] ? 'Tampilkan' : 'Sembunyikan'}
                    >
                      {collapsed[hari] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      <span>{collapsed[hari] ? 'Tampilkan' : 'Sembunyikan'}</span>
                    </button>
                  </div>
                </header>

                <div className="mt-4">
                  {pelajaran.length > 0 ? (
                    <div className="space-y-3">
                      {!collapsed[hari] && pelajaran.map(p => <JadwalCard key={p.id_jadwal} pelajaran={p} />)}
                      {collapsed[hari] && <div className="text-xs text-slate-500">Daftar disembunyikan — klik "Tampilkan" untuk melihat.</div>}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-slate-500">Tidak ada jadwal pada hari ini.</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </OrangTuaLayout>
  );
}
