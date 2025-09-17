// resources/js/Pages/Admin/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

/* ----------------- Hook: reveal on scroll ----------------- */
function useReveal(options = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setRevealed(true);
            obs.unobserve(node);
          }
        });
      },
      options
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [ref.current]);
  return [ref, revealed];
}

/* ----------------- Helpers ----------------- */
const formatNumber = (n = 0) => new Intl.NumberFormat('id-ID').format(n);
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' tahun yang lalu';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' bulan yang lalu';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' hari yang lalu';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' jam yang lalu';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' menit yang lalu';
  return Math.floor(seconds) + ' detik yang lalu';
}

/* ----------------- Charts (SVG) ----------------- */
function SimpleBarChart({ data = [], height = 64, gap = 6, barColor = '#0ea5e9' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = 14;
  const w = data.length * bw + Math.max(0, (data.length - 1) * gap);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} className="block">
      {data.map((d, i) => {
        const x = i * (bw + gap);
        const h = Math.round((d.value / max) * (height - 12));
        const y = height - h;
        return (
          <g key={i} transform={`translate(${x},0)`}>
            <rect
              x={0}
              y={y}
              width={bw}
              height={h}
              rx={4}
              fill={barColor}
              style={{ transition: 'all 600ms cubic-bezier(.2,.9,.2,1)', transformOrigin: 'center bottom' }}
              role="img"
              aria-label={`${d.label}: ${d.value}`}
            />
            <text x={bw / 2} y={height - 1} fontSize="9" textAnchor="middle" fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ values = [], stroke = '#06b6d4', height = 40 }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const w = 120;
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => {
      const ratio = max === min ? 0.5 : (v - min) / (max - min);
      const x = i * step;
      const y = height - ratio * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const last = values[values.length - 1];
  const cy = height - ((max === min ? 0.5 : (last - min) / (max - min)) * (height - 4)) - 2;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} aria-hidden>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * step} cy={cy} r="2.5" fill={stroke} />
    </svg>
  );
}

/* ----------------- UI Small Components ----------------- */
const StatCard = ({ icon, label, value, description }) => (
  <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center gap-4 transform transition-all hover:-translate-y-1 hover:shadow-lg">
    <div className="p-3 rounded-lg bg-gradient-to-br from-sky-50 to-white text-sky-700 border border-sky-100">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-baseline gap-3">
        <div className="text-2xl font-semibold text-gray-800">{value}</div>
        {description && <div className="text-xs text-gray-400">{description}</div>}
      </div>
    </div>
  </div>
);

const PresenceCard = ({ title, present = 0, absent = 0, accent = 'sky' }) => {
  const total = present + absent;
  const pct = total === 0 ? 0 : Math.round((present / total) * 100);
  const accentClass = accent === 'green' ? 'bg-emerald-500' : 'bg-sky-500';
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <div className="text-sm text-gray-500">{total} terdaftar</div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`${accentClass} h-3`} style={{ width: `${pct}%`, transition: 'width 700ms ease' }} />
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span className="font-medium">Hadir: {present}</span>
            <span className="text-red-500">Tidak hadir: {absent}</span>
          </div>
        </div>
        <div className="w-20 text-right">
          <div className="text-2xl font-bold text-gray-800">{pct}%</div>
          <div className="text-xs text-gray-400">Kehadiran</div>
        </div>
      </div>
    </div>
  );
};

/* ----------------- Main Component ----------------- */
export default function Dashboard({ auth, stats = {}, latestActivities = [], announcements = [] }) {
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
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [topRef, topRevealed] = useReveal();
  const [actRef, actReveal] = useReveal();
  const [annRef, annReveal] = useReveal({ threshold: 0.06 });

  // animated small counters
  const [animCounts, setAnimCounts] = useState({ g: 0, s: 0, m: 0, j: 0 });
  useEffect(() => {
    let raf;
    const duration = 700;
    const start = performance.now();
    const from = { g: 0, s: 0, m: 0, j: 0 };
    const to = { g: s.totalGuru, s: s.totalSiswa, m: s.totalMapel, j: s.totalJadwal };
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

  // trend timeframe control (client-only; backend data should be precomputed)
  const [timeframe, setTimeframe] = useState('4w'); // options: 4w, 12w, 30d
  const trendSiswaData = useMemo(
    () => (s.trendSiswa.length ? s.trendSiswa.map((d, i) => ({ label: d.label ?? `W${i + 1}`, value: Number(d.value ?? 0) })) : []),
    [s.trendSiswa]
  );
  const trendGuruData = useMemo(
    () => (s.trendGuru.length ? s.trendGuru.map((d, i) => ({ label: d.label ?? `W${i + 1}`, value: Number(d.value ?? 0) })) : []),
    [s.trendGuru]
  );

  // activity search + small filters
  const [activityQuery, setActivityQuery] = useState('');
  const filteredActivities = latestActivities.filter((a) => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return true;
    return (a.aksi || '').toLowerCase().includes(q) || (a.pengguna?.nama_lengkap || '').toLowerCase().includes(q);
  });

  // helper export action (attempt to open route)
  const handleExport = (type = 'csv') => {
    const url = route ? route('admin.laporan.index', { export: type }) : '#';
    // open in new tab (server should return file)
    window.open(url, '_blank');
  };

  // small utility: initials for avatar
  const initials = (name = '') =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join('');

  return (
    <AdminLayout user={auth.user} header="Dashboard">
      <div className="space-y-6">
        {/* Top Header */}
        <div
          ref={topRef}
          className={`bg-gradient-to-r from-white via-sky-50 to-white rounded-2xl p-6 shadow-md border border-gray-100 transition-transform duration-500 ${
            topRevealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 leading-tight">Dashboard Absensi & Jurnal</h1>
              <p className="mt-1 text-sm text-gray-500">Ringkasan sistem — cepat, jelas, dan dapat ditindaklanjuti.</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <div className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  Sistem aktif
                </div>
                <div>•</div>
                <div className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
                  Pembaruan terakhir: {currentDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-sm text-gray-600 mr-2">
                <div className="font-medium">SMA / SMK IT ALHAWARI</div>
                <div className="text-xs">{currentDate}</div>
              </div>

              <div className="inline-flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm hover:shadow focus:outline-none"
                  aria-label="Export laporan CSV"
                  title="Export laporan CSV"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
                  aria-label="Refresh dashboard"
                  title="Segarkan"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <div className="hidden md:block">
                  <div className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">{initials(auth.user?.name ?? auth.user?.nama_lengkap ?? 'U')}</div>
                    <div className="text-xs text-gray-600">{auth.user?.name ?? auth.user?.nama_lengkap}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<UserGroupIcon className="w-6 h-6" />} label="Total Guru" value={formatNumber(animCounts.g)} description="Guru terdaftar" />
          <StatCard icon={<AcademicCapIcon className="w-6 h-6" />} label="Total Siswa" value={formatNumber(animCounts.s)} description="Siswa terdaftar" />
          <StatCard icon={<BookOpenIcon className="w-6 h-6" />} label="Mata Pelajaran" value={formatNumber(animCounts.m)} description="Mapel aktif" />
          <StatCard icon={<CalendarDaysIcon className="w-6 h-6" />} label="Jadwal / Hari Ini" value={formatNumber(animCounts.j)} description="Sesi terjadwal" />
        </div>

        {/* Main area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: kehadiran & tren */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PresenceCard title="Kehadiran Guru Hari Ini" present={s.kehadiranGuru.hadir} absent={s.kehadiranGuru.tidakHadir} accent="blue" />
              <PresenceCard title="Kehadiran Siswa Hari Ini" present={s.kehadiranSiswa.hadir} absent={s.kehadiranSiswa.tidakHadir} accent="green" />
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Tren Kehadiran</h3>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">Periode</div>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="text-sm rounded-md border px-2 py-1"
                    aria-label="Pilih periode tren"
                    title="Pilih periode tren"
                  >
                    <option value="4w">4 Minggu</option>
                    <option value="12w">12 Minggu</option>
                    <option value="30d">30 Hari</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-600">Siswa (persentase)</div>
                    <div className="text-xs text-gray-500">{timeframe}</div>
                  </div>
                  <SimpleBarChart data={trendSiswaData.length ? trendSiswaData : [{ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 }]} barColor="#10b981" />
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-600">Guru (persentase)</div>
                    <div className="text-xs text-gray-500">{timeframe}</div>
                  </div>
                  <SimpleBarChart data={trendGuruData.length ? trendGuruData : [{ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 }]} barColor="#0ea5e9" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">Ringkasan mingguan — klik Export untuk laporan lengkap.</div>
                <div>
                  <button onClick={() => handleExport('csv')} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm hover:shadow-sm">
                    <ArrowDownTrayIcon className="w-4 h-4 text-sky-600" /> Download CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
              <div>
                <div className="text-sm text-gray-500">Kinerja Kehadiran 30 hari</div>
                <div className="text-lg font-semibold text-gray-800 mt-1">Tren Bulanan</div>
              </div>
              <div className="w-48">
                <Sparkline values={s.sparkLast30.length ? s.sparkLast30 : Array.from({ length: 12 }, (_, i) => Math.round(Math.random() * 80) + 20)} stroke="#0ea5e9" />
              </div>
            </div>
          </div>

          {/* Right: actions, activities, announcements */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Aksi Cepat</h4>
                <Link href={route ? route('admin.pengaturan.index') : '#'} className="text-xs text-sky-600 hover:underline">
                  Pengaturan
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href={route ? route('admin.absensi-guru.index') : '#'} className="p-3 rounded-lg border hover:shadow-sm flex flex-col items-start gap-1 hover:bg-sky-50 transition">
                  <div className="text-sm font-medium flex items-center gap-2"><UserGroupIcon className="w-4 h-4 text-sky-600"/> Absensi Guru</div>
                  <div className="text-xs text-gray-500 mt-1">Kelola absen guru</div>
                </Link>
                <Link href={route ? route('admin.absensi-siswa.index') : '#'} className="p-3 rounded-lg border hover:shadow-sm flex flex-col items-start gap-1 hover:bg-emerald-50 transition">
                  <div className="text-sm font-medium flex items-center gap-2"><AcademicCapIcon className="w-4 h-4 text-emerald-500"/> Absensi Siswa</div>
                  <div className="text-xs text-gray-500 mt-1">Kelola absen siswa</div>
                </Link>
                <Link href={route ? route('admin.jurnal-mengajar.index') : '#'} className="p-3 rounded-lg border hover:shadow-sm flex flex-col items-start gap-1 hover:bg-violet-50 transition">
                  <div className="text-sm font-medium flex items-center gap-2"><BookOpenIcon className="w-4 h-4 text-violet-600"/> Jurnal Mengajar</div>
                  <div className="text-xs text-gray-500 mt-1">Input & verifikasi</div>
                </Link>
                <Link href={route ? route('admin.jadwal-mengajar.index') : '#'} className="p-3 rounded-lg border hover:shadow-sm flex flex-col items-start gap-1 hover:bg-sky-50 transition">
                  <div className="text-sm font-medium flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4 text-sky-600"/> Jadwal</div>
                  <div className="text-xs text-gray-500 mt-1">Kelola jadwal</div>
                </Link>
              </div>
            </div>

            <div ref={actRef} className={`bg-white p-4 rounded-xl shadow-sm transition-opacity duration-500 ${actReveal ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Aktivitas Terbaru</h4>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Cari aktivitas..."
                      value={activityQuery}
                      onChange={(e) => setActivityQuery(e.target.value)}
                      className="text-sm rounded-md border px-8 py-1.5"
                      aria-label="Cari aktivitas"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-3 max-h-60 overflow-auto pr-2">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((a, i) => (
                    <div key={a.id_log ?? i} className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition">
                      <div className="flex-none">
                        <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
                          {initials(a.pengguna?.nama_lengkap || 'S')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-800">
                          <span className="font-medium">{a.aksi}</span>
                          <span className="ml-2 text-xs text-gray-500">oleh {a.pengguna?.nama_lengkap ?? 'Sistem'}</span>
                        </div>
                        <div className="text-xs text-gray-400">{timeAgo(a.waktu)}</div>
                      </div>
                      <div className="text-xs text-gray-400">{new Date(a.waktu).toLocaleTimeString('id-ID')}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Tidak ada aktivitas terbaru.</div>
                )}
              </div>
            </div>

            <div ref={annRef} className={`bg-white p-4 rounded-xl shadow-sm transition-opacity duration-500 ${annReveal ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Pengumuman</h4>
                <Link href={route ? route('admin.pengumuman.index') : '#'} className="text-xs text-sky-600 hover:underline">
                  Kelola
                </Link>
              </div>

              <div className="mt-3 space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 5).map((p) => (
                    <article key={p.id_pengumuman} className="p-3 bg-gradient-to-r from-white via-gray-50 to-white rounded-md border-l-4 border-sky-200">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium text-gray-800">{p.judul}</div>
                        <div className="text-xs text-gray-400">{new Date(p.tanggal_terbit).toLocaleDateString('id-ID')}</div>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{p.isi}</p>
                      <div className="mt-2 text-right">
                        <Link href={route ? route('admin.pengumuman.show', p.id_pengumuman) : '#'} className="text-xs text-sky-600 hover:underline inline-flex items-center gap-1">
                          Baca Selengkapnya <ChevronRightIcon className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Belum ada pengumuman.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* small css helper */}
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </AdminLayout>
  );
}
