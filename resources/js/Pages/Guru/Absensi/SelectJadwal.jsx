import React, { useMemo, useState } from 'react';
import GuruLayout from '@/Layouts/GuruLayout';
import { Head, Link } from '@inertiajs/react';
import { Clock, Book, Building, Search, ChevronRight } from 'lucide-react';


export default function SelectJadwal({ auth, jadwalHariIni = [] }) {
  const [q, setQ] = useState('');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // helper: bikin Date object untuk jam (menggunakan tanggal hari ini)
  const makeDateFromTime = (timeStr) => {
    // timeStr diharapkan format "HH:mm" atau "HH:mm:ss"
    if (!timeStr) return null;
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    const d = new Date();
    d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    return d;
  };

  // helper: status jadwal relatif ke waktu sekarang
  const getStatus = (jadwal) => {
    const now = new Date();
    const start = makeDateFromTime(jadwal.jam_mulai);
    const end = makeDateFromTime(jadwal.jam_selesai);

    if (!start || !end) {
      return { code: 'unknown', label: 'Waktu tidak lengkap' };
    }

    if (now >= start && now <= end) {
      // Sedang berlangsung
      const minsLeft = Math.ceil((end - now) / 60000);
      return { code: 'ongoing', label: 'Sedang berlangsung', extra: `${minsLeft} menit tersisa` };
    }

    if (now < start) {
      // Akan mulai
      const minsTo = Math.ceil((start - now) / 60000);
      if (minsTo < 60) {
        return { code: 'upcoming', label: `Mulai dalam ${minsTo} menit` };
      } else {
        const hours = Math.floor(minsTo / 60);
        const mins = minsTo % 60;
        return { code: 'upcoming', label: `Mulai dalam ${hours}j ${mins}m` };
      }
    }

    // now > end
    return { code: 'finished', label: 'Telah selesai' };
  };

  // Filter berdasarkan query: cari di nama mapel atau kelas atau jam
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jadwalHariIni;
    return jadwalHariIni.filter((j) => {
      const kelasName =
        (j.kelas?.tingkat ? `${j.kelas.tingkat} ${j.kelas.jurusan || ''}` : j.kelas?.nama_lengkap) || '';
      const mapel = j.mata_pelajaran?.nama_mapel || j.mapel?.nama_mapel || '';
      return (
        kelasName.toLowerCase().includes(term) ||
        mapel.toLowerCase().includes(term) ||
        (j.jam_mulai || '').includes(term) ||
        (j.jam_selesai || '').includes(term)
      );
    });
  }, [q, jadwalHariIni]);

  return (
    <GuruLayout user={auth.user} header="Pilih Jadwal Absensi">
      <Head title="Pilih Jadwal" />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Pilih Jadwal untuk Absensi</h2>
              <p className="text-sm text-slate-500 mt-1">{formattedDate}</p>
            </div>

            <div className="w-full sm:w-96">
              <label htmlFor="search" className="sr-only">Cari jadwal</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  id="search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari mata pelajaran, kelas atau jam..."
                  className="block w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            {jadwalHariIni === undefined ? (
              <div className="py-12 text-center text-slate-500">Memuat jadwal...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500">Tidak ada jadwal yang cocok.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((jadwal) => {
                  const kelasName =
                    (jadwal.kelas?.tingkat ? `${jadwal.kelas.tingkat} ${jadwal.kelas.jurusan || ''}` : jadwal.kelas?.nama_lengkap) ||
                    'Kelas tidak tersedia';
                  const mapelName = jadwal.mata_pelajaran?.nama_mapel || jadwal.mapel?.nama_mapel || 'Tanpa Mapel';
                  const start = jadwal.jam_mulai ? jadwal.jam_mulai.substring(0, 5) : '-';
                  const end = jadwal.jam_selesai ? jadwal.jam_selesai.substring(0, 5) : '-';
                  const status = getStatus(jadwal);

                  return (
                    <article
                      key={jadwal.id_jadwal}
                      tabIndex={0}
                      aria-labelledby={`jadwal-${jadwal.id_jadwal}`}
                      className="relative group rounded-xl border border-slate-100 p-4 hover:shadow-lg transition-shadow bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                            <Building className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 id={`jadwal-${jadwal.id_jadwal}`} className="text-sm font-semibold text-slate-900">
                              {kelasName}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                              <Book className="h-4 w-4 text-slate-400" />
                              <span>{mapelName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                                status.code === 'ongoing'
                                  ? 'bg-green-100 text-green-800'
                                  : status.code === 'upcoming'
                                  ? 'bg-amber-100 text-amber-800'
                                  : status.code === 'finished'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <div className="mt-2 text-sm font-mono text-slate-700">{start} — {end}</div>
                          {status.extra && <div className="mt-1 text-xs text-slate-400">{status.extra}</div>}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          {/* Jika Anda memiliki info pengajar membantu, tampilkan */}
                          {/* <div>Guru: {jadwal.guru?.nama_lengkap || '-'}</div> */}
                          <div>{jadwal.ruang ? `Ruang: ${jadwal.ruang}` : ''}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Tombol Primary: Mulai Absensi */}
                          <Link
                            href={route('guru.absensi-mapel.show', { id_jadwal: jadwal.id_jadwal })}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              status.code === 'ongoing'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md hover:from-green-700'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            title="Buka halaman absensi"
                          >
                            <span>{status.code === 'ongoing' ? 'Mulai Absensi' : 'Buka'}</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </GuruLayout>
  );
}
