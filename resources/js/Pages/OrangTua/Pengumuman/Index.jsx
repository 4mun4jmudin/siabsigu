import React, { useMemo } from 'react';
import OrangTuaLayout from '@/Layouts/OrangTuaLayout';
import { Head, Link } from '@inertiajs/react';
import { Megaphone, Calendar, User, Tag, ArrowRight } from 'lucide-react';
import Pagination from '@/Components/Pagination';

// utilities
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const daysAgo = (iso) => {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return 9999;
  }
};

// Featured pengumuman (responsive)
const FeaturedAnnouncement = ({ item }) => {
  const newDays = daysAgo(item.tanggal_terbit);
  const isNew = newDays <= 7;

  return (
    <Link
      href={route('orangtua.pengumuman.show', item.id_pengumuman)}
      className="group block overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg hover:shadow-2xl transition-all duration-200"
      aria-label={`Baca pengumuman: ${item.judul}`}
    >
      <div className="p-5 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-white/20">
            <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-3 justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold leading-tight truncate">{item.judul}</h2>
              <div className="flex items-center gap-2">
                {isNew && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1">
                    BARU
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 text-sm sm:text-base text-white/90 line-clamp-3">
              {item.isi}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-white/90 flex-wrap">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 opacity-90" /> <span className="truncate">{item.pembuat?.nama_lengkap || 'Administrator'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-90" /> <span>{fmtDate(item.tanggal_terbit)}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-medium">
                  Baca Pengumuman <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Card pengumuman (responsive)
const AnnouncementCard = ({ item }) => {
  const newDays = daysAgo(item.tanggal_terbit);
  const isNew = newDays <= 7;
  const targetBg = item.target_level === 'Semua' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800';

  return (
    <article
      role="article"
      aria-labelledby={`judul-${item.id_pengumuman}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden"
    >
      <div className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <Link href={route('orangtua.pengumuman.show', item.id_pengumuman)} className="group">
            <h3 id={`judul-${item.id_pengumuman}`} className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-sky-600 line-clamp-2">
              {item.judul}
            </h3>
          </Link>

          <p className="mt-2 text-sm text-slate-600 line-clamp-3">
            {item.isi}
          </p>

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <User className="w-4 h-4" /> <span className="truncate">{item.pembuat?.nama_lengkap || 'Administrator'}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" /> <span>{fmtDate(item.tanggal_terbit)}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end justify-between gap-3">
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${targetBg}`}>{item.target_level}</span>
            {isNew ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 px-2 py-1 rounded-md">BARU</span>
            ) : (
              <span className="text-xs text-slate-400">{newDays} hari lalu</span>
            )}
          </div>

          <Link href={route('orangtua.pengumuman.show', item.id_pengumuman)} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
            Baca selengkapnya <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default function PengumumanIndex({ auth, pengumuman }) {
  const featured = useMemo(() => (pengumuman.data && pengumuman.data.length > 0 ? pengumuman.data[0] : null), [pengumuman]);
  const list = useMemo(() => (featured ? pengumuman.data.slice(1) : pengumuman.data || []), [pengumuman, featured]);

  return (
    <OrangTuaLayout user={auth.user} header="Pengumuman Sekolah">
      <Head title="Pengumuman" />

      <div className="py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Pengumuman Sekolah</h1>
                <p className="text-xs sm:text-sm text-slate-500">Informasi penting & pengumuman terbaru untuk orang tua/wali</p>
              </div>
            </div>

            {/* <div className="flex items-center gap-2">
              <Link href={route('pengumuman.index')} className="text-sm text-slate-600 hover:text-slate-800">Lihat Semua</Link>
              <Link href={route('pengumuman.create')} className="hidden sm:inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg text-sm shadow">
                Tambah Pengumuman
              </Link>
            </div> */}
          </div>

          {/* Featured */}
          {featured && (
            <div className="mb-6">
              <FeaturedAnnouncement item={featured} />
            </div>
          )}

          {/* Grid list responsive:
              - On small: single column (featured above, list below, sidebar below)
              - On md: two columns (list + sidebar stacked)
              - On lg: three columns (list spans 2 cols, sidebar right)
          */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main list (spans 2 cols on md/lg) */}
            <div className="md:col-span-2 space-y-6">
              {list.length > 0 ? (
                list.map(item => <AnnouncementCard key={item.id_pengumuman} item={item} />)
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-slate-100 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-800">Tidak ada pengumuman tambahan</h3>
                  <p className="text-sm text-slate-500 mt-2">Semua pengumuman terbaru sudah ditampilkan di bagian unggulan.</p>
                </div>
              )}

              <div className="mt-4">
                <Pagination links={pengumuman.links} />
              </div>
            </div>

            {/* Sidebar (sticky di desktop, muncul setelah list pada mobile) */}
            <aside className="md:col-span-1">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Ringkasan</h4>
                  <p className="text-sm text-slate-600">Tampilkan pengumuman terbaru dan penting agar orang tua selalu mendapat info tepat waktu.</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Kategori & Target</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">Semua</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700">Siswa</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700">Guru</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700">Orang Tua</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Tips</h4>
                  <ol className="text-sm text-slate-600 list-decimal list-inside space-y-2">
                    <li>Periksa pengumuman setiap hari kerja.</li>
                    <li>Aktifkan notifikasi untuk info mendesak.</li>
                    <li>Hubungi sekolah jika ada pertanyaan terkait pengumuman.</li>
                  </ol>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </OrangTuaLayout>
  );
}
