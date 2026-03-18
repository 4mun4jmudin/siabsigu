import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SkeletonStatCard from '@/Components/SkeletonStatCard';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ClockIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline';

/* ═══════════════════════════════════════════════════════════
   Hook: reveal on scroll (intersection observer)
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
const formatNumber = (n = 0) => new Intl.NumberFormat('id-ID').format(n);
const pct = (a = 0, b = 0) => {
  const t = a + b;
  return t ? Math.round((a / t) * 100) : 0;
};

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + ' tahun lalu';
  interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + ' bulan lalu';
  interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + ' hari lalu';
  interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + ' jam lalu';
  interval = seconds / 60; if (interval > 1) return Math.floor(interval) + ' menit lalu';
  return Math.floor(seconds) + ' detik lalu';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/* ═══════════════════════════════════════════════════════════
   Charts (SVG)
   ═══════════════════════════════════════════════════════════ */
function GroupedBarChart({ dataSiswa = [], dataGuru = [], height = 160 }) {
  const allValues = [...dataSiswa, ...dataGuru].map((d) => Number(d.value || 0));
  const max = Math.max(...allValues, 1);
  const bw = 22; // bar width
  const barGap = 3; // gap between paired bars
  const groupGap = 28; // gap between groups
  const leftPad = 32; // space for Y-axis labels
  const groupW = bw * 2 + barGap;
  const count = Math.max(dataSiswa.length, dataGuru.length);
  const totalW = leftPad + count * groupW + Math.max(0, (count - 1) * groupGap);

  // Y-axis ticks
  const yTicks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${totalW} ${height + 28}`} width="100%" height={height + 28} className="block overflow-visible">
      {/* Y-axis labels & grid lines */}
      {yTicks.map((tick) => {
        const y = height - Math.round((tick / max) * (height - 12));
        return (
          <g key={tick}>
            <text x={leftPad - 8} y={y + 3} fontSize="10" textAnchor="end" fill="#94a3b8" fontWeight="500">{tick}</text>
            <line x1={leftPad} y1={y} x2={totalW} y2={y} stroke="#f1f5f9" strokeWidth="1" />
          </g>
        );
      })}

      {/* Bar groups */}
      {Array.from({ length: count }).map((_, i) => {
        const groupX = leftPad + i * (groupW + groupGap);
        const sv = Number(dataSiswa[i]?.value || 0);
        const gv = Number(dataGuru[i]?.value || 0);
        const sh = Math.round((sv / max) * (height - 12));
        const gh = Math.round((gv / max) * (height - 12));
        const label = dataSiswa[i]?.label || dataGuru[i]?.label || `W${i + 1}`;

        return (
          <g key={i} transform={`translate(${groupX},0)`}>
            {/* Siswa bar (green) */}
            <rect x={0} y={height - sh} width={bw} height={sh} rx={4} fill="#10b981" className="hover:opacity-80 transition-opacity cursor-pointer">
              <title>{`Siswa ${label}: ${sv}`}</title>
            </rect>
            {/* Guru bar (blue) */}
            <rect x={bw + barGap} y={height - gh} width={bw} height={gh} rx={4} fill="#4f72f5" className="hover:opacity-80 transition-opacity cursor-pointer">
              <title>{`Guru ${label}: ${gv}`}</title>
            </rect>
            {/* Label */}
            <text x={groupW / 2} y={height + 16} fontSize="10" textAnchor="middle" fill="#64748b" fontWeight="500">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ percentage = 0, size = 96, strokeWidth = 8, color = '#4f72f5' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xl font-extrabold text-slate-800 tracking-tight">{percentage}%</span>
    </div>
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

/* ═══════════════════════════════════════════════════════════
   Sub-components — Premium SaaS Style
   ═══════════════════════════════════════════════════════════ */
const StatCard = ({ icon, label, value, description, color = 'indigo', trend }) => {
  const themes = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', ring: 'ring-indigo-500/20' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'ring-emerald-500/20' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', ring: 'ring-violet-500/20' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', ring: 'ring-sky-500/20' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', ring: 'ring-rose-500/20' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', ring: 'ring-orange-500/20' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', ring: 'ring-amber-500/20' },
  };
  const t = themes[color] || themes.indigo;

  return (
    <div className="group relative bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 h-full overflow-hidden">
      {/* Subtle gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight tabular-nums">{value}</span>
          </div>
          {description && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {trend === 'up' && <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-500" />}
              {trend === 'down' && <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-rose-500" />}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400'}`}>{description}</span>
            </div>
          )}
        </div>
        <div className={`flex-none p-2.5 rounded-xl ${t.bg} ${t.border} border ring-1 ${t.ring} group-hover:scale-110 transition-transform duration-300`}>
          <span className={t.text}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

const PresenceCard = ({ title, present = 0, absent = 0, accent = 'indigo' }) => {
  const total = present + absent;
  const percentage = pct(present, absent);
  const isBlue = accent === 'blue' || accent === 'indigo';
  const barColor = isBlue ? 'bg-indigo-500' : 'bg-emerald-500';
  const donutColor = isBlue ? '#4f72f5' : '#10b981';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100 h-full flex flex-col hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <h4 className="font-bold text-slate-800 text-base tracking-tight mb-4">{title}</h4>

      {/* Donut Chart */}
      <div className="flex justify-center mb-4">
        <DonutChart percentage={percentage} size={100} strokeWidth={9} color={donutColor} />
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
        <div className={`${barColor} h-2 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          Hadir: {present}
        </span>
        <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
          Absen: {absent}
        </span>
      </div>
    </div>
  );
};

const DataTable = ({ columns = [], rows = [] }) => (
  <div className="overflow-hidden border border-slate-100 rounded-xl">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3.5 text-left font-semibold text-slate-500 whitespace-nowrap first:pl-5 last:pr-5 text-xs uppercase tracking-wider">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap text-slate-700 first:pl-5 last:pr-5">
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400 italic">Belum ada data untuk ditampilkan</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Tabs = ({ value, onChange, items }) => (
  <div className="inline-flex bg-slate-100 p-1 rounded-xl">
    {items.map((it) => (
      <button
        key={it.value}
        onClick={() => onChange(it.value)}
        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${value === it.value
          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
          : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        {it.label}
      </button>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Main Dashboard Component
   ═══════════════════════════════════════════════════════════ */
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

  // State loading skeleton saat mount pertama kali
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulasi loading: skeleton ditampilkan saat pertama kali mount
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timeout);
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
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  // trend timeframe control
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
  const [scope, setScope] = useState('kelas');
  const [period, setPeriod] = useState('hari');

  // activity search
  const [activityQuery, setActivityQuery] = useState('');
  const filteredActivities = latestActivities.filter((a) => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return true;
    return (a.aksi || '').toLowerCase().includes(q) || (a.pengguna?.nama_lengkap || '').toLowerCase().includes(q);
  });

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');

  /* ═════════════════════════════════════════════════════════
     UI — Premium SaaS Design
     ═════════════════════════════════════════════════════════ */
  return (
    <AdminLayout user={auth.user} header={isAbsensiMode ? 'Dashboard Absensi' : 'Dashboard'}>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-12">

        {/* ─────────────────── Greeting Header ─────────────────── */}
        <div
          ref={topRef}
          className={`relative overflow-hidden bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100 transition-all duration-700 ease-out ${topRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-violet-500/[0.03]" />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight tracking-tight">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {auth.user?.name ?? auth.user?.nama_lengkap}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-500 max-w-xl leading-relaxed">
                  Selamat datang di panel admin {pengaturan?.nama_sekolah ?? 'Sekolah'}. Berikut ringkasan aktivitas {isAbsensiMode ? 'absensi' : 'operasional'} hari ini.
                </p>

                {/* Status Badges */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sistem Online
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {currentDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 font-mono min-w-[96px] justify-center tabular-nums">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Link
                  href={route ? route('admin.absensi-siswa.index') : '#'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  Input Absensi
                </Link>
                <Link
                  href={route ? route('admin.laporan.index') : '#'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  <PresentationChartBarIcon className="w-4 h-4" />
                  Lihat Rekap
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center p-2.5 bg-white text-slate-500 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                  aria-label="Refresh dashboard"
                  title="Segarkan Data"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────── Statistics Grid ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(isAbsensiMode ? 4 : 8)].map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={<CheckCircleIcon className="w-5 h-5" />}
                label="Siswa Hadir"
                value={formatNumber(s.kehadiranSiswa.hadir)}
                description={`${pct(s.kehadiranSiswa.hadir, s.kehadiranSiswa.tidakHadir)}% Hari Ini`}
                color="emerald"
                trend="up"
              />
              <StatCard
                icon={<XCircleIcon className="w-5 h-5" />}
                label="Absen Siswa"
                value={formatNumber(s.kehadiranSiswa.tidakHadir)}
                description="Sakit / Izin / Alfa"
                color="rose"
                trend="down"
              />
              <StatCard
                icon={<UserGroupIcon className="w-5 h-5" />}
                label="Guru Hadir"
                value={formatNumber(s.kehadiranGuru.hadir)}
                description={`${pct(s.kehadiranGuru.hadir, s.kehadiranGuru.tidakHadir)}% Hari Ini`}
                color="sky"
                trend="up"
              />
              <StatCard
                icon={<UserGroupIcon className="w-5 h-5" />}
                label="Absen Guru"
                value={formatNumber(s.kehadiranGuru.tidakHadir)}
                description="Cuti / Sakit / Dinas"
                color="orange"
                trend="down"
              />

              {/* Baris Kedua — mode Full */}
              {!isAbsensiMode && (
                <>
                  <StatCard icon={<UserGroupIcon className="w-5 h-5" />} label="Total Guru" value={formatNumber(animCounts.g)} description="Terdaftar Aktif" color="violet" />
                  <StatCard icon={<AcademicCapIcon className="w-5 h-5" />} label="Total Siswa" value={formatNumber(animCounts.s)} description="Terdaftar Aktif" color="indigo" />
                  <StatCard icon={<BookOpenIcon className="w-5 h-5" />} label="Mata Pelajaran" value={formatNumber(animCounts.m)} description="Kurikulum Aktif" color="amber" />
                  <StatCard icon={<CalendarDaysIcon className="w-5 h-5" />} label="Jadwal Hari Ini" value={formatNumber(animCounts.j)} description="Sesi Pelajaran" color="sky" />
                </>
              )}
            </>
          )}
        </div>

        {/* ─────────────────── Smart Insights Banner ─────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 p-6 text-white">
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-none p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Performa Kehadiran • 30 Hari Terakhir</div>
                <div className="text-xl font-bold tracking-tight">Tren Kehadiran Konsisten</div>
                <div className="text-sm text-indigo-200 mt-1">Data menunjukkan stabilitas tingkat kehadiran yang baik sepanjang bulan ini.</div>
              </div>
            </div>
            <div className="w-full sm:w-1/4 h-14 opacity-90">
              <Sparkline values={s.sparkLast30.length ? s.sparkLast30 : Array.from({ length: 12 }, () => 50)} stroke="#fff" height={56} />
            </div>
          </div>
        </div>

        {/* ─────────────────── Main Content Grid ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══ Left Column: Charts & Tables ═══ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Tren Kehadiran + Donut Cards (Grouped Layout) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* LEFT: Grouped Bar Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tren Kehadiran</h3>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="text-sm rounded-xl border-slate-200 bg-slate-50 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-medium text-slate-600"
                  >
                    <option value="4w">4 Minggu Terakhir</option>
                    <option value="12w">3 Bulan Terakhir</option>
                  </select>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-600">Siswa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#4f72f5]" />
                    <span className="text-xs font-semibold text-slate-600">Guru</span>
                  </div>
                </div>

                {/* Grouped Bar Chart */}
                <GroupedBarChart
                  dataSiswa={trendSiswaData.length ? trendSiswaData : [{ label: '1 week', value: 0 }, { label: '2 week', value: 0 }, { label: '3 week', value: 0 }, { label: '4 week', value: 0 }]}
                  dataGuru={trendGuruData.length ? trendGuruData : [{ label: '1 week', value: 0 }, { label: '2 week', value: 0 }, { label: '3 week', value: 0 }, { label: '4 week', value: 0 }]}
                  height={160}
                />

                <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                  <p className="text-xs text-slate-400">Data diperbarui secara realtime sesuai pencatatan absensi.</p>
                </div>
              </div>

              {/* RIGHT: Donut Presence Cards (stacked) */}
              <div className="flex flex-col gap-4">
                <PresenceCard title="Kehadiran Guru" present={s.kehadiranGuru.hadir} absent={s.kehadiranGuru.tidakHadir} accent="blue" />
                <PresenceCard title="Kehadiran Siswa" present={s.kehadiranSiswa.hadir} absent={s.kehadiranSiswa.tidakHadir} accent="green" />
              </div>

            </div>

            {/* Analisis Detail Table */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Analisis Detail</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Peringkat kehadiran berdasarkan kelas & guru.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Tabs value={scope} onChange={setScope} items={[{ label: 'Per Kelas', value: 'kelas' }, { label: 'Per Guru', value: 'guru' }]} />
                  <Tabs value={period} onChange={setPeriod} items={[{ label: 'Hari Ini', value: 'hari' }, { label: 'Bulan Ini', value: 'bulan' }]} />
                </div>
              </div>

              {scope === 'kelas' ? (
                <DataTable
                  columns={[
                    { key: 'kelas', header: 'Kelas', render: (v) => <span className="font-semibold text-slate-700">{v}</span> },
                    { key: 'hadir', header: 'Hadir', render: (v) => <span className="text-emerald-600 font-semibold">{v}</span> },
                    { key: 'tidak_hadir', header: 'Absen', render: (v) => <span className="text-rose-600 font-semibold">{v}</span> },
                    { key: 'telat_menit', header: 'Rata Telat', render: (v) => <span className="text-orange-600">{v} m</span> },
                    {
                      key: 'persen', header: 'Rate', render: (v) => (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${v >= 90 ? 'bg-emerald-50 text-emerald-700' : v >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{v}%</span>
                      )
                    },
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
                    { key: 'guru', header: 'Nama Guru', render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
                    { key: 'hadir', header: 'Hadir', render: (v) => <span className="text-emerald-600 font-semibold">{v}</span> },
                    { key: 'tidak_hadir', header: 'Absen', render: (v) => <span className="text-rose-600 font-semibold">{v}</span> },
                    { key: 'telat_menit', header: 'Telat', render: (v) => <span className="text-orange-600">{v} m</span> },
                    {
                      key: 'persen', header: 'Rate', render: (v) => (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${v >= 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{v}%</span>
                      )
                    },
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

          {/* ═══ Right Column: Quick Actions, Activities, Announcements ═══ */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-slate-800 tracking-tight">Menu Cepat</h4>
                {!isAbsensiMode && (
                  <Link href={route ? route('admin.pengaturan.index') : '#'} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Pengaturan">
                    <Cog6ToothIcon className="w-4 h-4 text-slate-400" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href={route ? route('admin.absensi-guru.index') : '#'} className="group relative overflow-hidden p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all duration-200 text-left">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-200 transition-all duration-200">
                    <UserGroupIcon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Absensi Guru</div>
                  <div className="text-xs text-slate-400 mt-0.5">Input & Rekap</div>
                </Link>

                <Link href={route ? route('admin.absensi-siswa.index') : '#'} className="group relative overflow-hidden p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all duration-200 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-200 transition-all duration-200">
                    <AcademicCapIcon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Absensi Siswa</div>
                  <div className="text-xs text-slate-400 mt-0.5">Input & Rekap</div>
                </Link>

                {!isAbsensiMode && (
                  <>
                    <Link href={route ? route('admin.jurnal-mengajar.index') : '#'} className="group relative overflow-hidden p-4 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 transition-all duration-200 text-left">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-200 transition-all duration-200">
                        <BookOpenIcon className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-slate-700 group-hover:text-violet-700 transition-colors">Jurnal KBM</div>
                      <div className="text-xs text-slate-400 mt-0.5">Monitoring</div>
                    </Link>

                    <Link href={route ? route('admin.jadwal-mengajar.index') : '#'} className="group relative overflow-hidden p-4 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all duration-200 text-left">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-200 transition-all duration-200">
                        <CalendarDaysIcon className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">Jadwal</div>
                      <div className="text-xs text-slate-400 mt-0.5">Atur Sesi</div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Activities Feed */}
            <div ref={actRef} className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-700 ${actReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-800 tracking-tight">Aktivitas Terbaru</h4>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Cari..."
                    value={activityQuery}
                    onChange={(e) => setActivityQuery(e.target.value)}
                    className="text-xs rounded-xl border-slate-200 pl-8 pr-3 py-2 focus:border-indigo-400 focus:ring-indigo-400 bg-slate-50 w-32 focus:w-40 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredActivities.length ? (
                  <div className="space-y-0.5">
                    {filteredActivities.map((a, i) => (
                      <div key={a.id_log ?? i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
                        <div className="flex-none mt-0.5">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-indigo-500/20">
                            {initials(a.pengguna?.nama_lengkap || 'S')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                            <span className="font-semibold text-slate-800">{a.aksi}</span>
                            <span className="text-slate-400"> oleh </span>
                            <span className="font-medium text-indigo-600">{a.pengguna?.nama_lengkap ?? 'Sistem'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">{timeAgo(a.waktu)}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{new Date(a.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 mb-4">
                      <MagnifyingGlassIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Tidak ada aktivitas ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50/80 text-center border-t border-slate-100">
                <Link href={route ? route('admin.log-aktivitas.index') : '#'} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 group/link">
                  Lihat Semua Aktivitas <ChevronRightIcon className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Announcements */}
            {!isAbsensiMode && announcements.length > 0 && (
              <div ref={annRef} className={`relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl shadow-lg shadow-violet-500/20 p-6 text-white transition-all duration-700 ${annReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Decorative */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold flex items-center gap-2 text-base">
                      <BellIcon className="w-5 h-5" />
                      Pengumuman
                    </h4>
                    <Link href={route ? route('admin.pengumuman.index') : '#'} className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
                      Kelola
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {announcements.slice(0, 3).map((p) => (
                      <div key={p.id_pengumuman} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer group/ann">
                        <div className="flex justify-between items-start gap-3">
                          <h5 className="text-sm font-semibold leading-snug line-clamp-1 group-hover/ann:text-white/100">{p.judul}</h5>
                          <span className="text-[10px] bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-white/80 whitespace-nowrap flex-shrink-0">
                            {new Date(p.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1.5 line-clamp-2 leading-relaxed">{p.isi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </AdminLayout>
  );
}