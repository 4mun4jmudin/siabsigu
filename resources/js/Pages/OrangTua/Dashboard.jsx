import React, { useMemo, useState } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Book,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Megaphone,
  Clock,
  Menu,
  Flag,
} from 'lucide-react';
import AttendanceTrendChart from './Partials/AttendanceTrendChart';

// theme
import { useTheme } from '../../ThemeProvider';
import ThemeToggle from '../../components/ThemeToggle';

const StatCard = ({ label, value, icon, colorClass }) => (
  <div
    role="region"
    aria-label={`${label} statistik`}
    className={`flex items-center gap-4 rounded-2xl bg-white p-4 sm:p-5 shadow-md border border-slate-100`}
  >
    <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${colorClass} shadow-sm`}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight">{value}</div>
      <div className="text-xs sm:text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  </div>
);

const AttendanceStatusTag = ({ status }) => {
  const statusMap = {
    Hadir: 'bg-emerald-100 text-emerald-800',
    Sakit: 'bg-amber-100 text-amber-800',
    Izin: 'bg-sky-100 text-sky-800',
    Alfa: 'bg-rose-100 text-rose-800',
    Belum: 'bg-slate-100 text-slate-800',
  };
  const color = statusMap[status] || statusMap.Belum;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${color}`}
      aria-label={`Status kehadiran: ${status}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${color.includes('emerald') ? 'bg-emerald-500' : color.includes('amber') ? 'bg-amber-500' : color.includes('sky') ? 'bg-sky-500' : color.includes('rose') ? 'bg-rose-500' : 'bg-slate-400'}`} />
      <span className="whitespace-nowrap">{status}</span>
    </span>
  );
};

export default function Dashboard({
  auth,
  siswa,
  absensiHariIni,
  riwayatAbsensi = [],
  absensiSummary = {},
  persentaseKehadiran = 0,
  pengumuman = [],
  jadwalHariIni = [],
  trenKehadiran = [],
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [openAnnouncements, setOpenAnnouncements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [openReportModal, setOpenReportModal] = useState(false);

  // Theme: jika ThemeProvider belum ada, fallback ke tema netral default.
  const themeCtx = useTheme ? useTheme() : null;
  const theme = (themeCtx && themeCtx.theme) || {
    primary: 'bg-emerald-500',
    primaryText: 'text-white',
    primarySoftBg: 'bg-emerald-50',
    accent: 'bg-sky-500',
    danger: 'bg-rose-500',
    ring: 'ring-emerald-300',
    cardBorder: 'border-slate-100',
    mutedText: 'text-slate-500',
    avatarRing: 'ring-emerald-50',
    dotPrimary: 'bg-emerald-500',
  };

  // helper: derive text color for soft bg from primary (emerald -> text-emerald-700, orange -> text-orange-700)
  const deriveHue = (bgClass) => {
    const m = bgClass.match(/bg-([a-z]+)-/);
    return m ? m[1] : 'emerald';
  };
  const primaryHue = deriveHue(theme.primary);
  const primaryTextOnSoft = `text-${primaryHue}-700`;

  const totalCounts = useMemo(
    () => ({
      hadir: absensiSummary.hadir || 0,
      sakit: absensiSummary.sakit || 0,
      izin: absensiSummary.izin || 0,
      alfa: absensiSummary.alfa || 0,
    }),
    [absensiSummary]
  );

  if (!siswa) {
    return (
      <OrangTuaLayout user={auth.user} header="Dashboard">
        <Head title="Dashboard Orang Tua" />
        <div className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-slate-700">Akun Anda belum terhubung dengan data siswa. Silakan hubungi administrator sekolah.</p>
            </div>
          </div>
        </div>
      </OrangTuaLayout>
    );
  }

  return (
    <OrangTuaLayout user={auth.user} header="Dashboard">
      <Head title="Dashboard Orang Tua" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Top: profile + quick stats */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 rounded-2xl bg-white p-4 sm:p-5 shadow-md flex items-center gap-4">
              <img
                className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ${theme.avatarRing}`}
                src={
                  siswa.foto_profil_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.nama_lengkap)}&background=14b8a6&color=fff`
                }
                alt={siswa.nama_lengkap}
              />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  Halo, Wali dari <span className="font-extrabold">{siswa.nama_panggilan || siswa.nama_lengkap}</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-0.5">NIS: {siswa.nis}</div>
                <div className="text-xs sm:text-sm text-slate-500">
                  Kelas: {siswa.kelas.tingkat} {siswa.kelas.jurusan}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs">
                  <Link
                    href={route('orangtua.profile.show')}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${theme.primarySoftBg} ${primaryTextOnSoft} hover:brightness-95`}
                  >
                    <User className="w-4 h-4" /> Lihat Profil
                  </Link>

                  <button
                    onClick={() => setOpenAnnouncements(true)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100`}
                  >
                    <Megaphone className="w-4 h-4" /> Pengumuman
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              <StatCard
                label="Hadir (30 hari)"
                value={totalCounts.hadir}
                icon={<CheckCircle className="w-6 h-6 text-white" />}
                colorClass={theme.primary}
              />
              <StatCard
                label="Izin"
                value={totalCounts.izin}
                icon={<AlertTriangle className="w-6 h-6 text-white" />}
                colorClass={theme.accent}
              />
              <StatCard
                label="Alfa"
                value={totalCounts.alfa}
                icon={<XCircle className="w-6 h-6 text-white" />}
                colorClass={theme.danger}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
                  <div className="flex gap-2 w-max items-center">
                    {[
                      { id: 'overview', label: 'Overview', icon: Book },
                      { id: 'attendance', label: 'Kehadiran', icon: CheckCircle },
                      { id: 'schedule', label: 'Jadwal', icon: Clock },
                      { id: 'history', label: 'Riwayat', icon: Calendar },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus-visible:${theme.ring}
                            ${activeTab === tab.id ? `${theme.primary} text-white ring-1 ${theme.ring}` : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          aria-pressed={activeTab === tab.id}
                        >
                          <Icon className={`${activeTab === tab.id ? 'text-white' : 'text-slate-400'} w-4 h-4`} />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Date + Report button + ThemeToggle */}
              <div className="ml-3 flex items-center gap-2">
                <div className="text-xs text-slate-500 hidden sm:block">{new Date().toLocaleDateString('id-ID')}</div>

                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-full bg-white p-2 text-slate-600 shadow-sm sm:hidden"
                  aria-label="Menu"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="hidden sm:inline-block">
                  <ThemeToggle />
                </div>

                <button
                  onClick={() => setOpenReportModal(true)}
                  className={`inline-flex items-center gap-2 rounded-full ${theme.primary} px-3 py-2 text-xs font-medium text-white shadow-sm hover:brightness-95 focus:outline-none focus-visible:${theme.ring}`}
                  aria-label="Laporkan Masalah"
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">Laporkan Masalah</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Kehadiran Hari Ini compact */}
                    <div className={`rounded-lg ${theme.primarySoftBg} ${theme.cardBorder} p-3 sm:p-4`}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-slate-800">Kehadiran Hari Ini</div>
                          {absensiHariIni ? (
                            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                              <div className="text-sm sm:text-base text-slate-800 font-medium">{absensiHariIni.status_kehadiran}</div>
                              <div className="text-sm text-slate-600">Masuk: <strong>{absensiHariIni.jam_masuk?.slice(0,5) || '-'}</strong></div>
                              {absensiHariIni.jam_pulang && <div className="text-sm text-slate-600">Pulang: <strong>{absensiHariIni.jam_pulang.slice(0,5)}</strong></div>}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-slate-600">Belum melakukan absensi hari ini.</div>
                          )}
                        </div>

                        <div className="ml-3 shrink-0">
                          <AttendanceStatusTag status={absensiHariIni?.status_kehadiran || 'Belum'} />
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800">Tren Kehadiran</h3>
                        <div className="text-xs text-slate-500">(30 hari terakhir)</div>
                      </div>
                      <div className="mt-3 h-56 sm:h-64">
                        <AttendanceTrendChart chartData={trenKehadiran} />
                      </div>
                    </div>

                    {/* Recent history */}
                    <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800">Riwayat Terakhir</h3>
                        <button onClick={() => setShowAllHistory((s) => !s)} className="text-xs text-slate-600 hover:underline">
                          {showAllHistory ? 'Tampilkan sedikit' : 'Lihat semua'}
                        </button>
                      </div>

                      <ul className="mt-3 space-y-2">
                        {(showAllHistory ? riwayatAbsensi : riwayatAbsensi.slice(0, 5)).map((a) => (
                          <li key={a.id_absensi} className="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-50">
                            <div className="flex items-center gap-3 min-w-0">
                              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-800 truncate">{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                <div className="text-xs text-slate-500 truncate">{a.jam_masuk?.slice(0,5) || 'Tidak masuk'}</div>
                              </div>
                            </div>

                            <div className="shrink-0"><AttendanceStatusTag status={a.status_kehadiran} /></div>
                          </li>
                        ))}
                        {riwayatAbsensi.length === 0 && <div className="text-sm text-slate-500">Belum ada riwayat absensi.</div>}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* KPI Ring */}
                    <div className="rounded-lg bg-white p-4 sm:p-5 text-center shadow">
                      <div className="text-sm sm:text-base text-slate-500">Tingkat Kehadiran</div>
                      <div className="mt-3">
                        <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36">
                          <svg viewBox="0 0 36 36" className="w-full h-full" aria-hidden>
                            <path className="text-slate-200" strokeWidth="3" stroke="#e6edf2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"/>
                            <path className="text-emerald-500" strokeWidth="3" stroke="#059669" strokeLinecap="round" strokeDasharray={`${persentaseKehadiran}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"/>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center"><div className="text-2xl sm:text-3xl font-semibold text-slate-900">{persentaseKehadiran}%</div></div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>Hadir: <strong>{totalCounts.hadir}</strong></div>
                          <div>Sakit: <strong>{totalCounts.sakit}</strong></div>
                          <div>Izin: <strong>{totalCounts.izin}</strong></div>
                          <div>Alfa: <strong>{totalCounts.alfa}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Pengumuman compact */}
                    <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-800">Pengumuman</h3>
                        <button onClick={() => setOpenAnnouncements(true)} className="text-xs text-slate-600">Selengkapnya</button>
                      </div>

                      <ul className="mt-3 space-y-2 text-sm">
                        {pengumuman.slice(0, 3).map((p) => (
                          <li key={p.id_pengumuman} className="">
                            <button onClick={() => setSelectedAnnouncement(p)} className="w-full text-left text-slate-700 hover:text-emerald-600">{p.judul}</button>
                            <div className="text-xs text-slate-400">{new Date(p.tanggal_terbit).toLocaleDateString('id-ID')}</div>
                          </li>
                        ))}
                        {pengumuman.length === 0 && <div className="text-xs text-slate-400">Belum ada pengumuman.</div>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">Detail Kehadiran</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Jumlah Hari Hadir</div>
                        <div className="text-xl font-semibold text-slate-800">{totalCounts.hadir}</div>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Jumlah Alfa</div>
                        <div className="text-xl font-semibold text-slate-800">{totalCounts.alfa}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                    <AttendanceTrendChart chartData={trenKehadiran} />
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">Jadwal Pelajaran Hari Ini</h3>
                    <div className="mt-3 space-y-2">
                      {jadwalHariIni.length > 0 ? jadwalHariIni.map((jadwal) => (
                        <div key={jadwal.id_jadwal} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700"><Clock className="w-4 h-4" /></div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{jadwal.mapel.nama_mapel}</div>
                              <div className="text-xs text-slate-500">{jadwal.guru.nama_lengkap}</div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">{jadwal.jam_mulai.slice(0,5)}</div>
                        </div>
                      )) : <div className="text-sm text-slate-500">Tidak ada jadwal.</div>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-3 sm:p-4 shadow">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">Riwayat Absensi</h3>
                    <div className="mt-3 space-y-2">
                      {riwayatAbsensi.length > 0 ? riwayatAbsensi.map((a) => (
                        <div key={a.id_absensi} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="flex items-center gap-3">
                            <div className="text-slate-500"><Calendar className="w-5 h-5" /></div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                              <div className="text-xs text-slate-500">{a.jam_masuk?.slice(0,5) || 'Tidak masuk'}</div>
                            </div>
                          </div>
                          <div><AttendanceStatusTag status={a.status_kehadiran} /></div>
                        </div>
                      )) : <div className="text-sm text-slate-500">Belum ada riwayat absensi.</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Announcement modal */}
      {openAnnouncements && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenAnnouncements(false)} />
          <div className="relative mx-4 mb-4 w-full max-w-2xl rounded-lg bg-white p-4 shadow-lg sm:mb-0 sm:py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Pengumuman</h4>
              <button onClick={() => setOpenAnnouncements(false)} className="text-slate-500">Tutup</button>
            </div>
            <div className="mt-3 space-y-3 max-h-80 overflow-auto">
              {pengumuman.length > 0 ? pengumuman.map((p) => (
                <div key={p.id_pengumuman} className="rounded-md border p-3 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{p.judul}</div>
                      <div className="text-xs text-slate-400">{new Date(p.tanggal_terbit).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div>
                      <button onClick={() => setSelectedAnnouncement(p)} className="text-xs text-emerald-600">Lihat</button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 line-clamp-3">{p.isi}</div>
                </div>
              )) : <div className="text-sm text-slate-500">Belum ada pengumuman.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Small detail modal for selected announcement */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedAnnouncement(null)} />
          <div className="relative mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedAnnouncement.judul}</h3>
                <div className="text-xs text-slate-400">{new Date(selectedAnnouncement.tanggal_terbit).toLocaleDateString('id-ID')}</div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-slate-500">Tutup</button>
            </div>

            <div className="mt-4 text-sm text-slate-700">{selectedAnnouncement.isi}</div>
          </div>
        </div>
      )}

      {/* Report modal: feature in development */}
      {openReportModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenReportModal(false)} />
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-50 p-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-lg font-semibold text-slate-800">Laporkan Masalah — Sedang Dalam Pengembangan</h4>
                <p className="mt-2 text-sm text-slate-600">Fitur pelaporan masalah sedang kami kembangkan. Untuk bantuan segera, silakan hubungi admin sekolah.</p>

                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => setOpenReportModal(false)} className="rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">Tutup</button>
                  <a href="mailto:admin@sekolah.example" className="rounded-md px-3 py-2 text-sm bg-emerald-600 text-white hover:brightness-95">Hubungi Admin</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* hide scrollbar for horizontal tab on webkit browsers but keep accessibility */
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        /* small utility for line-clamp fallback */
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </OrangTuaLayout>
  );
}
