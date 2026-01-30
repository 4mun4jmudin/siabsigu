import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ClockIcon, // Tambahkan ikon jam
} from '@heroicons/react/24/outline';

/* ----------------- Hook: reveal on scroll ----------------- */
function useReveal(options = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setRevealed(true);
        obs.unobserve(node);
      }
    }, options);
    obs.observe(node);
    return () => obs.disconnect();
  }, [options]);
  return [ref, revealed];
}

/* ----------------- Helpers ----------------- */
const formatNumber = (n = 0) => new Intl.NumberFormat('id-ID').format(n);
const pct = (a = 0, b = 0) => {
  const t = a + b;
  return t ? Math.round((a / t) * 100) : 0;
};
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + ' tahun yang lalu';
  interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + ' bulan yang lalu';
  interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + ' hari yang lalu';
  interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + ' jam yang lalu';
  interval = seconds / 60; if (interval > 1) return Math.floor(interval) + ' menit yang lalu';
  return Math.floor(seconds) + ' detik yang lalu';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/* ----------------- Charts (SVG) ----------------- */
function SimpleBarChart({ data = [], height = 64, gap = 6, barColor = '#0ea5e9' }) {
  const max = Math.max(...data.map((d) => Number(d.value || 0)), 1);
  const bw = 14;
  const w = data.length * bw + Math.max(0, (data.length - 1) * gap);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} className="block overflow-visible">
      {data.map((d, i) => {
        const x = i * (bw + gap);
        const h = Math.round((Number(d.value || 0) / max) * (height - 12));
        const y = height - h;
        return (
          <g key={i} transform={`translate(${x},0)`}>
            <rect x={0} y={y} width={bw} height={h} rx={4} fill={barColor} className="hover:opacity-80 transition-opacity cursor-pointer">
               <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text x={bw / 2} y={height + 12} fontSize="9" textAnchor="middle" fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ values = [], stroke = '#06b6d4', height = 40 }) {
  if (!values || !values.length) return null;
  const max = Math.max(...values); const min = Math.min(...values);
  const w = 120, step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => {
    const ratio = max === min ? 0.5 : (v - min) / (max - min);
    const x = i * step, y = height - ratio * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const last = values[values.length - 1];
  const cy = height - ((max === min ? 0.5 : (last - min) / (max - min)) * (height - 4)) - 2;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} aria-hidden className="overflow-visible">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * step} cy={cy} r="3" fill={stroke} className="animate-pulse" />
    </svg>
  );
}

/* ----------------- UI Small Components ----------------- */
const StatCard = ({ icon, label, value, description, color = 'sky' }) => {
    const bgColors = {
        sky: 'bg-sky-50 text-sky-700 border-sky-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        rose: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    const currentBg = bgColors[color] || bgColors.sky;

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 h-full">
        <div className={`p-3 rounded-xl border ${currentBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <div className="mt-1">
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
          </div>
        </div>
      </div>
    );
};

const PresenceCard = ({ title, present = 0, absent = 0, accent = 'sky' }) => {
  const total = present + absent;
  const percentage = pct(present, absent);
  const accentClass = accent === 'green' ? 'bg-emerald-500' : 'bg-sky-500';
  const textClass = accent === 'green' ? 'text-emerald-600' : 'text-sky-600';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h4>
            <div className="text-xs text-gray-400 mt-1">{total} Terdaftar</div>
        </div>
        <div className={`text-2xl font-bold ${textClass}`}>{percentage}%</div>
      </div>
      
      <div className="space-y-3">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className={`${accentClass} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
        </div>
        <div className="flex justify-between text-xs font-medium">
           <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">Hadir: {present}</span>
           <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Absen: {absent}</span>
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ columns = [], rows = [] }) => (
  <div className="overflow-hidden border border-gray-100 rounded-xl">
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
            <tr>
            {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left font-semibold whitespace-nowrap first:pl-5 last:pr-5">{c.header}</th>
            ))}
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
            {rows.length ? (
            rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 whitespace-nowrap text-gray-700 first:pl-5 last:pr-5">
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                    </td>
                ))}
                </tr>
            ))
            ) : (
            <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 italic">Belum ada data untuk ditampilkan</td>
            </tr>
            )}
        </tbody>
        </table>
    </div>
  </div>
);

const Tabs = ({ value, onChange, items }) => (
  <div className="inline-flex bg-gray-100 p-1 rounded-lg">
    {items.map((it) => (
      <button
        key={it.value}
        onClick={() => onChange(it.value)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            value === it.value 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {it.label}
      </button>
    ))}
  </div>
);

/* ----------------- Main Component ----------------- */
export default function Dashboard({ auth, stats = {}, latestActivities = [], announcements = [] }) {
  const { pengaturan, adminMode } = usePage().props || {};
  const isAbsensiMode = adminMode === 'absensi';

  // safe defaults & data shaping
  const s = {
    totalGuru: stats.totalGuru ?? 0,
    totalSiswa: stats.totalSiswa ?? 0,
    totalMapel: stats.totalMapel ?? 0,
    totalJadwal: stats.totalJadwal ?? 0,
    kehadiranGuru: stats.kehadiranGuru ?? { hadir: 0, tidakHadir: 0 },
    kehadiranSiswa: stats.kehadiranSiswa ?? { hadir: 0, tidakHadir: 0 },
    trendSiswa: stats.trendSiswa ?? [],
    trendGuru: stats.trendGuru ?? [],
    sparkLast30: stats.sparkLast30 ?? [],
    perKelasHariIni: stats.perKelasHariIni ?? [],
    perKelasBulanIni: stats.perKelasBulanIni ?? [],
    perGuruHariIni: stats.perGuruHariIni ?? [],
    perGuruBulanIni: stats.perGuruBulanIni ?? [],
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // State untuk jam digital
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [topRef, topRevealed] = useReveal();
  const [actRef, actReveal] = useReveal();
  const [annRef, annReveal] = useReveal({ threshold: 0.06 });

  // animated small counters
  const [animCounts, setAnimCounts] = useState({ g: 0, s: 0, m: 0, j: 0 });
  useEffect(() => {
    let raf;
    const duration = 1000, start = performance.now();
    const from = { g: 0, s: 0, m: 0, j: 0 };
    const to = { g: s.totalGuru, s: s.totalSiswa, m: s.totalMapel, j: s.totalJadwal };
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Cubic ease in-out
      setAnimCounts({
        g: Math.round(from.g + (to.g - from.g) * ease),
        s: Math.round(from.s + (to.s - from.s) * ease),
        m: Math.round(from.m + (to.m - from.m) * ease),
        j: Math.round(from.j + (to.j - from.j) * ease),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s.totalGuru, s.totalSiswa, s.totalMapel, s.totalJadwal]);

  // trend timeframe control (visual only; data ideally dari backend)
  const [timeframe, setTimeframe] = useState('4w');
  const trendSiswaData = useMemo(
    () => (s.trendSiswa.length ? s.trendSiswa.map((d, i) => ({ label: d.label ?? `W${i + 1}`, value: Number(d.value ?? 0) })) : []),
    [s.trendSiswa]
  );
  const trendGuruData = useMemo(
    () => (s.trendGuru.length ? s.trendGuru.map((d, i) => ({ label: d.label ?? `W${i + 1}`, value: Number(d.value ?? 0) })) : []),
    [s.trendGuru]
  );

  // tabs: ringkasan tabel
  const [scope, setScope] = useState('kelas'); // kelas | guru
  const [period, setPeriod] = useState('hari'); // hari | bulan

  // activity search
  const [activityQuery, setActivityQuery] = useState('');
  const filteredActivities = latestActivities.filter((a) => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return true;
    return (a.aksi || '').toLowerCase().includes(q) || (a.pengguna?.nama_lengkap || '').toLowerCase().includes(q);
  });

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');

  /* ----------------- UI ----------------- */
  return (
    <AdminLayout user={auth.user} header={isAbsensiMode ? 'Dashboard Absensi' : 'Dashboard'}>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">

        {/* Top Header */}
        <div
          ref={topRef}
          className={`bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all duration-700 ease-out ${
            topRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {getGreeting()}, <span className="text-sky-600">{auth.user?.name ?? auth.user?.nama_lengkap}</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Selamat datang di panel admin {pengaturan?.nama_sekolah ?? 'Sekolah'}. Berikut adalah ringkasan aktivitas {isAbsensiMode ? 'absensi' : 'operasional'} hari ini.
              </p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sistem Online
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {currentDate}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-100 min-w-[90px] justify-center font-mono">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 shadow-sm hover:shadow active:scale-95 transition-all"
                aria-label="Refresh dashboard"
                title="Segarkan Data"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<AcademicCapIcon className="w-6 h-6" />}
            label="Siswa Hadir"
            value={formatNumber(s.kehadiranSiswa.hadir)}
            description={`${pct(s.kehadiranSiswa.hadir, s.kehadiranSiswa.tidakHadir)}% Hari Ini`}
            color="emerald"
          />
          <StatCard
            icon={<AcademicCapIcon className="w-6 h-6" />}
            label="Absen Siswa"
            value={formatNumber(s.kehadiranSiswa.tidakHadir)}
            description="Sakit / Izin / Alfa"
            color="rose"
          />
          <StatCard
            icon={<UserGroupIcon className="w-6 h-6" />}
            label="Guru Hadir"
            value={formatNumber(s.kehadiranGuru.hadir)}
            description={`${pct(s.kehadiranGuru.hadir, s.kehadiranGuru.tidakHadir)}% Hari Ini`}
            color="sky"
          />
          <StatCard
            icon={<UserGroupIcon className="w-6 h-6" />}
            label="Absen Guru"
            value={formatNumber(s.kehadiranGuru.tidakHadir)}
            description="Cuti / Sakit / Dinas"
            color="orange"
          />

          {/* Tambahan khusus mode Full - Baris Kedua */}
          {!isAbsensiMode && (
            <>
              <StatCard icon={<UserGroupIcon className="w-6 h-6" />} label="Total Guru" value={formatNumber(animCounts.g)} description="Terdaftar Aktif" color="violet" />
              <StatCard icon={<AcademicCapIcon className="w-6 h-6" />} label="Total Siswa" value={formatNumber(animCounts.s)} description="Terdaftar Aktif" color="violet" />
              <StatCard icon={<BookOpenIcon className="w-6 h-6" />} label="Mata Pelajaran" value={formatNumber(animCounts.m)} description="Kurikulum Aktif" color="sky" />
              <StatCard icon={<CalendarDaysIcon className="w-6 h-6" />} label="Jadwal Hari Ini" value={formatNumber(animCounts.j)} description="Sesi Pelajaran" color="sky" />
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Kehadiran & Tren */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visualisasi Kehadiran Hari Ini */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <PresenceCard title="Kehadiran Guru" present={s.kehadiranGuru.hadir} absent={s.kehadiranGuru.tidakHadir} accent="blue" />
              <PresenceCard title="Kehadiran Siswa" present={s.kehadiranSiswa.hadir} absent={s.kehadiranSiswa.tidakHadir} accent="green" />
            </div>

            {/* Tren Kehadiran Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Tren Kehadiran</h3>
                    <p className="text-sm text-gray-500">Perbandingan tingkat kehadiran guru & siswa.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="text-sm rounded-lg border-gray-200 bg-gray-50 px-3 py-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
                  >
                    <option value="4w">4 Minggu Terakhir</option>
                    <option value="12w">3 Bulan Terakhir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-sm font-semibold text-gray-700">Siswa</span>
                    </div>
                  </div>
                  <SimpleBarChart data={trendSiswaData.length ? trendSiswaData : [{ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 }]} barColor="#10b981" height={100} />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        <span className="text-sm font-semibold text-gray-700">Guru</span>
                    </div>
                  </div>
                  <SimpleBarChart data={trendGuruData.length ? trendGuruData : [{ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 }]} barColor="#0ea5e9" height={100} />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                 <p className="text-xs text-gray-400">Data diperbarui secara realtime sesuai pencatatan absensi.</p>
              </div>
            </div>

            {/* Sparkline Kinerja Bulanan */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white flex items-center justify-between">
              <div>
                <div className="text-sky-100 text-sm font-medium mb-1">Performa Kehadiran (30 Hari)</div>
                <div className="text-2xl font-bold">Tren Konsisten</div>
                <div className="text-xs text-sky-200 mt-1">Data menunjukkan stabilitas kehadiran yang baik.</div>
              </div>
              <div className="w-1/3 h-16 opacity-80 mix-blend-overlay">
                <Sparkline values={s.sparkLast30.length ? s.sparkLast30 : Array.from({ length: 12 }, () => 50)} stroke="#fff" height={60} />
              </div>
            </div>

            {/* Ringkasan Tabel Detail */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Analisis Detail</h3>
                    <p className="text-sm text-gray-500">Peringkat kehadiran berdasarkan kelas & guru.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Tabs value={scope} onChange={setScope} items={[{ label: 'Per Kelas', value: 'kelas' }, { label: 'Per Guru', value: 'guru' }]} />
                  <Tabs value={period} onChange={setPeriod} items={[{ label: 'Hari Ini', value: 'hari' }, { label: 'Bulan Ini', value: 'bulan' }]} />
                </div>
              </div>

              {scope === 'kelas' ? (
                <DataTable
                  columns={[
                    { key: 'kelas', header: 'Kelas', render: (v) => <span className="font-semibold text-gray-700">{v}</span> },
                    { key: 'hadir', header: 'Hadir', render: (v) => <span className="text-emerald-600 font-medium">{v}</span> },
                    { key: 'tidak_hadir', header: 'Absen', render: (v) => <span className="text-rose-600 font-medium">{v}</span> },
                    { key: 'telat_menit', header: 'Rata Telat', render: (v) => <span className="text-orange-600">{v} m</span> },
                    { key: 'persen', header: 'Rate', render: (v) => <span className={`font-bold ${v >= 90 ? 'text-emerald-600' : v >= 70 ? 'text-orange-600' : 'text-rose-600'}`}>{v}%</span> },
                  ]}
                  rows={(period === 'hari' ? s.perKelasHariIni : s.perKelasBulanIni).map((r) => {
                    const hadir = r.hadir ?? 0;
                    const th = r.tidakHadir ?? r.tidak_hadir ?? 0;
                    return {
                      kelas: r.kelas ?? r.id_kelas ?? '-',
                      hadir,
                      tidak_hadir: th,
                      telat_menit: Math.round(r.telatMenit ?? r.telat_menit ?? 0),
                      persen: pct(hadir, th),
                    };
                  })}
                />
              ) : (
                <DataTable
                  columns={[
                    { key: 'guru', header: 'Nama Guru', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
                    { key: 'hadir', header: 'Hadir', render: (v) => <span className="text-emerald-600">{v}</span> },
                    { key: 'tidak_hadir', header: 'Absen', render: (v) => <span className="text-rose-600">{v}</span> },
                    { key: 'telat_menit', header: 'Telat', render: (v) => <span className="text-orange-600">{v} m</span> },
                    { key: 'persen', header: 'Rate', render: (v) => <span className={`font-bold ${v >= 95 ? 'text-emerald-600' : 'text-rose-600'}`}>{v}%</span> },
                  ]}
                  rows={(period === 'hari' ? s.perGuruHariIni : s.perGuruBulanIni).map((r) => {
                    const hadir = r.hadir ?? 0;
                    const th = r.tidakHadir ?? r.tidak_hadir ?? 0;
                    return {
                      guru: r.guru ?? r.nama_guru ?? '-',
                      hadir,
                      tidak_hadir: th,
                      telat_menit: Math.round(r.telatMenit ?? r.telat_menit ?? 0),
                      persen: pct(hadir, th),
                    };
                  })}
                />
              )}
            </div>
          </div>

          {/* Right Column: Actions & Feed */}
          <div className="space-y-8">
            
            {/* Quick Actions Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-800">Menu Cepat</h4>
                {!isAbsensiMode && (
                  <Link href={route ? route('admin.pengaturan.index') : '#'} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <span className="sr-only">Pengaturan</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href={route ? route('admin.absensi-guru.index') : '#'} className="group p-4 rounded-xl border border-gray-100 hover:border-sky-200 bg-gray-50 hover:bg-sky-50 transition-all duration-200 text-left">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <UserGroupIcon className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-sky-700">Absensi Guru</div>
                  <div className="text-xs text-gray-500 mt-0.5">Input & Rekap</div>
                </Link>
                
                <Link href={route ? route('admin.absensi-siswa.index') : '#'} className="group p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50 hover:bg-emerald-50 transition-all duration-200 text-left">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <AcademicCapIcon className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700">Absensi Siswa</div>
                  <div className="text-xs text-gray-500 mt-0.5">Input & Rekap</div>
                </Link>

                {!isAbsensiMode && (
                  <>
                    <Link href={route ? route('admin.jurnal-mengajar.index') : '#'} className="group p-4 rounded-xl border border-gray-100 hover:border-violet-200 bg-gray-50 hover:bg-violet-50 transition-all duration-200 text-left">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <BookOpenIcon className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-violet-700">Jurnal KBM</div>
                      <div className="text-xs text-gray-500 mt-0.5">Monitoring</div>
                    </Link>
                    
                    <Link href={route ? route('admin.jadwal-mengajar.index') : '#'} className="group p-4 rounded-xl border border-gray-100 hover:border-orange-200 bg-gray-50 hover:bg-orange-50 transition-all duration-200 text-left">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <CalendarDaysIcon className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700">Jadwal</div>
                      <div className="text-xs text-gray-500 mt-0.5">Atur Sesi</div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Activities Feed */}
            <div ref={actRef} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-opacity duration-700 ${actReveal ? 'opacity-100' : 'opacity-0'}`}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-gray-800">Aktivitas Terbaru</h4>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Cari..."
                    value={activityQuery}
                    onChange={(e) => setActivityQuery(e.target.value)}
                    className="text-xs rounded-full border-gray-200 pl-8 pr-3 py-1.5 focus:border-sky-500 focus:ring-sky-500 bg-gray-50"
                  />
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                {filteredActivities.length ? (
                  <div className="space-y-1">
                    {filteredActivities.map((a, i) => (
                      <div key={a.id_log ?? i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="flex-none mt-1">
                          <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold border border-sky-200">
                            {initials(a.pengguna?.nama_lengkap || 'S')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 line-clamp-2">
                            <span className="font-semibold">{a.aksi}</span>
                            <span className="text-gray-500 font-normal"> oleh </span>
                            <span className="font-medium text-gray-700">{a.pengguna?.nama_lengkap ?? 'Sistem'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">{timeAgo(a.waktu)}</span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400">{new Date(a.waktu).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">Tidak ada aktivitas ditemukan.</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <Link href="#" className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center justify-center gap-1">
                    Lihat Semua Aktivitas <ChevronRightIcon className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Announcements Widget */}
            {!isAbsensiMode && announcements.length > 0 && (
              <div ref={annRef} className={`bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl shadow-lg p-5 text-white transition-opacity duration-700 ${annReveal ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <BellIcon className="w-5 h-5" />
                    Pengumuman
                  </h4>
                  <Link href={route ? route('admin.pengumuman.index') : '#'} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">
                    Kelola
                  </Link>
                </div>

                <div className="space-y-3">
                  {announcements.slice(0, 3).map((p) => (
                    <div key={p.id_pengumuman} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-sm font-semibold leading-tight line-clamp-1">{p.judul}</h5>
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/80 whitespace-nowrap">
                            {new Date(p.tanggal_terbit).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">{p.isi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles for specific overrides */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </AdminLayout>
  );
}