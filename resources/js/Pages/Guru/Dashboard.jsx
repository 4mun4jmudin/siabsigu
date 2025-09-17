// resources/js/Pages/Guru/Dashboard.jsx
import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import {
  Users,
  BookOpen,
  Clock,
  UserCheck,
  Bell,
  Calendar as CalendarIcon,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * StatCard
 * - Mobile: icon on top, content below (vertical)
 * - Desktop: icon left, content right (horizontal)
 * - Ensures text wraps and doesn't overflow.
 */
const StatCard = ({ title, value, Icon, description, gradient = 'from-indigo-600 to-sky-500' }) => {
  return (
    <div className="w-full rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 min-h-[96px]">
        <div className={`flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title: allow wrapping on mobile */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight whitespace-normal break-words">
              {title}
            </h4>
          </div>

          <div className="mt-2 flex items-baseline gap-3">
            <div className="text-2xl sm:text-2xl font-extrabold text-slate-900">{value ?? 0}</div>
            <div className="text-xs sm:text-sm text-slate-500 truncate whitespace-normal">{description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* TodaySchedule component updated for responsive layout */
const TodaySchedule = ({ jadwal }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    id_jadwal: '',
    status_mengajar: 'Tugas',
    alasan: '',
  });

  const [openId, setOpenId] = useState(null);

  const toggleOpen = (id) => {
    if (openId === id) {
      setOpenId(null);
      reset();
    } else {
      setOpenId(id);
      setData('id_jadwal', id);
    }
  };

  const submitQuick = (e) => {
    e.preventDefault();
    post(route('guru.jurnal.quick_entry'), {
      preserveScroll: true,
      onSuccess: () => {
        setOpenId(null);
        reset();
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Jadwal Hari Ini &amp; Jurnal Cepat</h3>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {jadwal && jadwal.length > 0 ? (
          jadwal.map((item) => (
            <div key={item.id_jadwal} className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* time circle */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-semibold text-sm">
                    {item.jam_mulai?.slice(0, 5) ?? '-'}
                  </div>
                </div>

                {/* main info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.mata_pelajaran?.nama_mapel ?? '—'}</p>
                  <p className="text-xs text-slate-500 truncate">{item.kelas?.tingkat ?? ''} {item.kelas?.jurusan ?? ''}</p>
                </div>

                {/* actions */}
                <div className="flex gap-2 flex-wrap justify-end mt-2 sm:mt-0 sm:ml-3">
                  <Link
                    href={route('guru.jurnal.create', { id_jadwal: item.id_jadwal })}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition w-full sm:w-auto justify-center"
                  >
                    <Send className="h-3 w-3" /> Isi Jurnal
                  </Link>

                  <button
                    onClick={() => toggleOpen(item.id_jadwal)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-amber-500 hover:bg-amber-600 text-white transition w-full sm:w-auto justify-center"
                    aria-expanded={openId === item.id_jadwal}
                  >
                    {openId === item.id_jadwal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Izin/Tugas
                  </button>
                </div>
              </div>

              {/* collapsible */}
              <div className={`px-3 sm:px-4 pb-3 transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${openId === item.id_jadwal ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={submitQuick} className="space-y-2 mt-2">
                  <p className="text-xs text-slate-600">Catat singkat (contoh: rapat dinas atau beri tugas ke siswa).</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={data.status_mengajar}
                      onChange={(e) => setData('status_mengajar', e.target.value)}
                      className="col-span-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    >
                      <option value="Tugas">Memberi Tugas</option>
                      <option value="Kosong">Kelas Kosong</option>
                    </select>

                    <input
                      type="text"
                      value={data.alasan}
                      onChange={(e) => setData('alasan', e.target.value)}
                      placeholder="Alasan singkat (contoh: Rapat dinas)"
                      className="col-span-2 text-xs border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                  </div>

                  {errors.alasan && <div className="text-xs text-rose-600">{errors.alasan}</div>}

                  <div className="flex justify-end">
                    <PrimaryButton size="sm" disabled={processing}>
                      {processing ? 'Mengirim...' : 'Kirim'}
                    </PrimaryButton>
                  </div>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">Tidak ada jadwal mengajar untuk hari ini.</div>
        )}
      </div>
    </div>
  );
};

/* Announcements compact */
const Announcements = ({ announcements }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-4 border-b">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-900">Pengumuman</h3>
      </div>
    </div>

    <div className="p-3 sm:p-4 max-h-[520px] overflow-y-auto space-y-3">
      {announcements && announcements.length > 0 ? (
        announcements.map((a) => (
          <div key={a.id_pengumuman} className="p-3 rounded-md bg-white border border-gray-100 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 truncate">{a.judul}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.isi}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{a.pembuat?.nama_lengkap || 'Admin'}</span>
              <span>{new Date(a.tanggal_terbit).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="py-6 text-center text-sm text-slate-500">Tidak ada pengumuman baru.</div>
      )}
    </div>
  </div>
);

export default function Dashboard({ auth, guru, jadwalHariIni, stats, pengumuman }) {
  return (
    <GuruLayout user={auth.user} header="Dashboard">
      <Head title="Dashboard Guru" />

      {/* Statistik: mobile 2×2, desktop 4 kolom */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4 mt-2">
        <StatCard title="Total Kelas" value={stats?.total_kelas ?? 0} Icon={Users} description="Jumlah kelas yang diampu" gradient="from-indigo-600 to-sky-500" />
        <StatCard title="Mata Pelajaran" value={stats?.total_mapel ?? 0} Icon={BookOpen} description="Jumlah mapel" gradient="from-emerald-500 to-teal-500" />
        <StatCard title="Jam Mengajar / minggu" value={stats?.total_jam_seminggu ?? 0} Icon={Clock} description="Total jam per minggu" gradient="from-yellow-500 to-orange-500" />
        <StatCard title="Status Kehadiran (hari ini)" value={stats?.status_hari_ini ?? 'Hadir'} Icon={UserCheck} description="Ringkasan absensi" gradient="from-rose-500 to-pink-500" />
      </section>

      {/* Konten bawah: jadwal + pengumuman */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodaySchedule jadwal={jadwalHariIni} />
        </div>
        <div className="lg:col-span-1">
          <Announcements announcements={pengumuman} />
        </div>
      </div>
    </GuruLayout>
  );
}
