import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

// Modern, responsive, and interactive teacher detail page
// - Tabs with keyboard support and animated indicator (framer-motion)
// - Mobile-friendly: tabs collapse to select; tables become card lists on small screens
// - Client-side search + simple pagination for large tables
// - Accessible attributes (aria) and improved visuals

const TABS = [
  { id: 'informasi', label: 'Informasi Umum' },
  { id: 'jadwal', label: 'Jadwal Mengajar' },
  { id: 'riwayat', label: 'Riwayat Absensi' },
  { id: 'jurnal', label: 'Jurnal Mengajar' },
];

const statusColor = {
  Aktif: 'bg-green-100 text-green-800',
  'Tidak Aktif': 'bg-yellow-100 text-yellow-800',
  Pensiun: 'bg-red-100 text-red-800',
};

function formatDateISO(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr || '-';
  }
}

function timeSlice(t) {
  return t ? t.slice(0, 5) : '-';
}

// Small reusable components
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="text-center py-12">
    <p className="text-lg font-semibold text-gray-700">{title}</p>
    <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
  </div>
);

export default function Show({ auth, guru, jadwalMengajar = {}, riwayatAbsensi = [], jurnalMengajar = [] }) {
  const [activeTab, setActiveTab] = useState('informasi');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // keyboard navigation for tabs
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const idx = TABS.findIndex(t => t.id === activeTab);
        if (e.key === 'ArrowRight') setActiveTab(TABS[(idx + 1) % TABS.length].id);
        if (e.key === 'ArrowLeft') setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab]);

  useEffect(() => {
    setPage(1); // reset page when switching tab or query
  }, [activeTab, query]);

  // prepare jadwal in ordered days
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const sortedDays = useMemo(() => {
    return Object.keys(jadwalMengajar || {}).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
  }, [jadwalMengajar]);

  // filtered arrays depending on activeTab
  const filteredAbsensi = useMemo(() => {
    if (!riwayatAbsensi) return [];
    return riwayatAbsensi.filter(a => {
      const q = query.toLowerCase();
      return (
        a.status_kehadiran?.toLowerCase().includes(q) ||
        a.keterangan?.toLowerCase().includes(q) ||
        (a.tanggal && formatDateISO(a.tanggal).toLowerCase().includes(q))
      );
    });
  }, [riwayatAbsensi, query]);

  const filteredJurnal = useMemo(() => {
    if (!jurnalMengajar) return [];
    return jurnalMengajar.filter(j => {
      const q = query.toLowerCase();
      return (
        j.materi_pembahasan?.toLowerCase().includes(q) ||
        j.jadwal_mengajar?.mata_pelajaran?.nama_mapel?.toLowerCase().includes(q) ||
        (j.tanggal && formatDateISO(j.tanggal).toLowerCase().includes(q))
      );
    });
  }, [jurnalMengajar, query]);

  // pagination helpers
  function paginate(arr) {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  }

  // profile avatar fallback
  const avatarUrl = guru.foto_profil
    ? `/storage/${guru.foto_profil}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(guru.nama_lengkap)}&color=7F9CF5&background=EBF4FF&size=256`;

  return (
    <AdminLayout user={auth.user} header={`Detail Guru: ${guru.nama_lengkap}`}>
      <Head title={`Detail ${guru.nama_lengkap}`} />

      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header card */}
        <div className="bg-white shadow-sm sm:rounded-lg">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <img src={avatarUrl} alt={guru.nama_lengkap} className="h-20 w-20 rounded-full object-cover shadow" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{guru.nama_lengkap}</h1>
                  <p className="text-sm text-gray-500">NIP: {guru.nip || '-'}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <Pill className={statusColor[guru.status] || 'bg-gray-100 text-gray-800'}>{guru.status || '-'}</Pill>
                    <Pill className="bg-gray-50 text-gray-600">ID: {guru.id_guru}</Pill>
                    <Pill className="bg-gray-50 text-gray-600">{guru.pengguna?.username ? `Akun: ${guru.pengguna.username}` : 'Tanpa akun'}</Pill>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <Link href={route('admin.guru.index')} className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                  <ArrowLeftIcon className="h-5 w-5" />
                  Kembali
                </Link>
                <Link href={route('admin.guru.edit', guru.id_guru)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500">
                  <PencilIcon className="h-5 w-5" />
                  Edit
                </Link>
              </div>
            </div>

            {/* summary grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Wali Kelas</p>
                <p className="mt-1 font-medium text-gray-800">{guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan || ''}` : 'Bukan wali kelas'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Barcode ID</p>
                <p className="mt-1 font-medium text-gray-800">{guru.barcode_id || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Sidik Jari</p>
                <p className="mt-1 font-medium text-gray-800">{guru.sidik_jari_template ? 'Terdaftar' : 'Belum terdaftar'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & content */}
        <div className="bg-white shadow-sm sm:rounded-lg">
          <div className="p-6">
            {/* Controls: search + mobile selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <label htmlFor="search" className="sr-only">Cari</label>
                <div className="relative">
                  <input
                    id="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                    placeholder="Cari pada tabel (tanggal, mata pelajaran, keterangan)..."
                    aria-label="Cari"
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <nav className="flex space-x-2" role="tablist" aria-label="Tabs">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* mobile select */}
                <div className="sm:hidden">
                  <label htmlFor="mobile-tab" className="sr-only">Pilih tab</label>
                  <select id="mobile-tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="rounded-md border-gray-200">
                    {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Animated underline for desktop tabs */}
            <div className="mt-3 hidden sm:block">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" />
              </motion.div>
            </div>

            {/* Content area */}
            <div className="mt-6">
              {activeTab === 'informasi' && (
                <section aria-labelledby="informasi-heading">
                  <h2 id="informasi-heading" className="sr-only">Informasi Umum</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-600">Detail Pribadi</h3>
                      <dl className="mt-3 space-y-3 text-sm text-gray-700">
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">ID Guru</dt><dd>{guru.id_guru}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Jenis Kelamin</dt><dd>{guru.jenis_kelamin || '-'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Akun Terhubung</dt><dd>{guru.pengguna?.username || 'Tidak terhubung'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Barcode</dt><dd>{guru.barcode_id || '-'}</dd></div>
                      </dl>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-600">Keterangan Teknis</h3>
                      <dl className="mt-3 space-y-3 text-sm text-gray-700">
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Sidik Jari</dt><dd>{guru.sidik_jari_template ? 'Terdaftar' : 'Belum'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Wali Kelas</dt><dd>{guru.kelas_wali ? `${guru.kelas_wali.tingkat} ${guru.kelas_wali.jurusan || ''}` : '—'}</dd></div>
                        <div className="flex justify-between"><dt className="font-medium text-gray-500">Created At</dt><dd>{guru.created_at ? formatDateISO(guru.created_at) : '-'}</dd></div>
                      </dl>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'jadwal' && (
                <section aria-labelledby="jadwal-heading">
                  <h2 id="jadwal-heading" className="sr-only">Jadwal Mengajar</h2>

                  {sortedDays.length === 0 && <EmptyState title="Tidak ada jadwal" subtitle="Belum ada jadwal mengajar yang tersedia." />}

                  {sortedDays.map(hari => (
                    <div key={hari} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{hari}</h3>

                      {/* Responsive rendering: table on md+, cards on sm */}
                      <div className="hidden md:block overflow-x-auto rounded-md border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {jadwalMengajar[hari].map(item => (
                              <tr key={item.id_jadwal} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{timeSlice(item.jam_mulai)} - {timeSlice(item.jam_selesai)}</td>
                                <td className="px-4 py-2 text-sm">{item.mata_pelajaran.nama_mapel}</td>
                                <td className="px-4 py-2 text-sm">{item.kelas.tingkat} {item.kelas.jurusan}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden grid gap-3">
                        {jadwalMengajar[hari].map(item => (
                          <article key={item.id_jadwal} className="p-3 rounded-md border border-gray-100">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="text-sm font-medium">{item.mata_pelajaran.nama_mapel}</p>
                                <p className="text-xs text-gray-500">{item.kelas.tingkat} {item.kelas.jurusan}</p>
                              </div>
                              <div className="text-xs text-gray-600">{timeSlice(item.jam_mulai)} • {timeSlice(item.jam_selesai)}</div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {activeTab === 'riwayat' && (
                <section aria-labelledby="riwayat-heading">
                  <h2 id="riwayat-heading" className="sr-only">Riwayat Absensi</h2>

                  {filteredAbsensi.length === 0 ? (
                    <EmptyState title="Tidak ada data absensi" subtitle="Coba ubah kata kunci pencarian atau cek kembali." />
                  ) : (
                    <>
                      {/* desktop table */}
                      <div className="hidden md:block overflow-x-auto rounded-md border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginate(filteredAbsensi).map(item => (
                              <tr key={item.id_absensi} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{formatDateISO(item.tanggal)}</td>
                                <td className="px-4 py-2 text-sm">{item.status_kehadiran}</td>
                                <td className="px-4 py-2 text-sm">{timeSlice(item.jam_masuk)}</td>
                                <td className="px-4 py-2 text-sm">{timeSlice(item.jam_pulang)}</td>
                                <td className="px-4 py-2 text-sm">{item.keterangan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* mobile cards */}
                      <div className="md:hidden grid gap-3">
                        {paginate(filteredAbsensi).map(item => (
                          <article key={item.id_absensi} className="p-3 rounded-md border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{formatDateISO(item.tanggal)}</p>
                                <p className="text-xs text-gray-500">{item.status_kehadiran} • {timeSlice(item.jam_masuk)} - {timeSlice(item.jam_pulang)}</p>
                              </div>
                              <div className="text-xs text-gray-600">{item.keterangan || '-'}</div>
                            </div>
                          </article>
                        ))}
                      </div>

                      {/* pagination controls */}
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">Menampilkan {Math.min((page - 1) * pageSize + 1, filteredAbsensi.length)}–{Math.min(page * pageSize, filteredAbsensi.length)} dari {filteredAbsensi.length}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 rounded-md border border-gray-200" aria-label="Sebelumnya"><ChevronLeftIcon className="h-4 w-4" /></button>
                          <button onClick={() => setPage(p => p + 1)} className="p-2 rounded-md border border-gray-200" aria-label="Selanjutnya"><ChevronRightIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )}

              {activeTab === 'jurnal' && (
                <section aria-labelledby="jurnal-heading">
                  <h2 id="jurnal-heading" className="sr-only">Jurnal Mengajar</h2>

                  {filteredJurnal.length === 0 ? (
                    <EmptyState title="Tidak ada jurnal" subtitle="Belum ada catatan jurnal mengajar." />
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto rounded-md border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mata Pelajaran</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Materi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginate(filteredJurnal).map(item => (
                              <tr key={item.id_jurnal} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{formatDateISO(item.tanggal)}</td>
                                <td className="px-4 py-2 text-sm">{item.jadwal_mengajar?.mata_pelajaran?.nama_mapel}</td>
                                <td className="px-4 py-2 text-sm">{item.jadwal_mengajar?.kelas?.tingkat} {item.jadwal_mengajar?.kelas?.jurusan}</td>
                                <td className="px-4 py-2 text-sm">{item.materi_pembahasan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden grid gap-3">
                        {paginate(filteredJurnal).map(item => (
                          <article key={item.id_jurnal} className="p-3 rounded-md border border-gray-100">
                            <p className="text-sm font-medium">{formatDateISO(item.tanggal)}</p>
                            <p className="text-xs text-gray-500">{item.jadwal_mengajar?.mata_pelajaran?.nama_mapel} • {item.jadwal_mengajar?.kelas?.tingkat}</p>
                            <p className="mt-2 text-sm">{item.materi_pembahasan || '-'}</p>
                          </article>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">Menampilkan {Math.min((page - 1) * pageSize + 1, filteredJurnal.length)}–{Math.min(page * pageSize, filteredJurnal.length)} dari {filteredJurnal.length}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 rounded-md border border-gray-200" aria-label="Sebelumnya"><ChevronLeftIcon className="h-4 w-4" /></button>
                          <button onClick={() => setPage(p => p + 1)} className="p-2 rounded-md border border-gray-200" aria-label="Selanjutnya"><ChevronRightIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
