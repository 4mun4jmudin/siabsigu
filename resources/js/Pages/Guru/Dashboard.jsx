// resources/js/Pages/Guru/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import GuruLayout from '@/Layouts/GuruLayout';
import {
  Users, BookOpen, Clock, UserCheck, Bell, Calendar as CalendarIcon, Send,
  ChevronDown, ChevronUp, FileDown, FileText, TrendingUp, Crown, Flame
} from 'lucide-react';

// Charts
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement);

/* ---------- UI kecil & util ---------- */
const Card = ({ title, icon: Icon, right, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {(title || Icon || right) && (
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-slate-700" />}
          {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
        </div>
        {right}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const StatPill = ({ label, value, color = 'from-indigo-600 to-sky-500', sub }) => (
  <div className="w-full rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-3 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center font-semibold text-sm`}>
        {(label || ' ')[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-extrabold text-slate-900 leading-6">
          {typeof value === 'number' ? value : (Number(value) || 0)}
        </div>
        {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
      </div>
    </div>
  </div>
);

const Badge = ({ text, tone = 'default' }) => {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    default: 'bg-slate-50 text-slate-700 ring-slate-100',
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${map[tone]}`}>{text}</span>;
};

function statusTone(pct) {
  if (pct >= 90) return 'green';
  if (pct >= 75) return 'yellow';
  return 'red';
}

/* ---------- Donut Kehadiran Guru ---------- */
function DonutKehadiran({ stats = {} }) {
  const dataDonut = useMemo(() => {
    const s = stats?.kehadiran_bulan_ini ?? {};
    const hadir = s.hadir ?? 0;
    const izin = s.izin ?? 0;
    const sakit = s.sakit ?? 0;
    const alfa  = s.alfa ?? 0;
    const dinas = s.dinas_luar ?? 0;

    return {
      labels: ['Hadir', 'Izin', 'Sakit', 'Alfa', 'Dinas Luar'],
      datasets: [{
        data: [hadir, izin, sakit, alfa, dinas],
        backgroundColor: ['#22c55e', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6'],
        borderWidth: 0
      }]
    };
  }, [stats]);

  const options = {
    plugins: { legend: { position: 'bottom' } },
    cutout: '62%'
  };

  // kalau semua nol, tampilkan placeholder teks
  const allZero = (dataDonut.datasets?.[0]?.data || []).every(n => !n);
  if (allZero) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">Belum ada data bulan ini.</div>;
  }

  return <Doughnut data={dataDonut} options={options} />;
}

/* ---------- Bar Kehadiran Siswa per Kelas ---------- */
function BarPerKelas({ items = [] }) {
  const labels = items.map(i => i.kelas || i.namaKelas || 'Kelas');
  const values = items.map(i => Math.round(i.avg_presence_pct ?? i.persentase?.hadir ?? 0));

  if (labels.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">Belum ada data rekap per kelas.</div>;
  }

  const data = {
    labels,
    datasets: [{
      label: '% Hadir',
      data: values,
      backgroundColor: '#0ea5e9'
    }]
  };
  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } }
  };
  return <Bar data={data} options={options} />;
}

/* ---------- Trend Line ---------- */
function TrendLine({ series }) {
  const labels = series?.map(s => s?.bulan || s?.period) ?? [];
  const siswa = series?.map(s => s?.siswa ?? s?.presence_pct_siswa ?? 0) ?? [];
  const guru  = series?.map(s => s?.guru  ?? s?.presence_pct_guru  ?? 0) ?? [];

  if (!labels.length) {
    return <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">Belum ada data tren.</div>;
  }

  const data = {
    labels,
    datasets: [
      { label: 'Guru', data: guru, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.25)', tension: .3, fill: true },
      { label: 'Siswa', data: siswa, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.25)', tension: .3, fill: true }
    ]
  };
  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } }
  };

  return <Line data={data} options={options} />;
}

/* ---------- Jadwal Hari Ini + Jurnal Cepat ---------- */
function TodaySchedule({ jadwal = [] }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    id_jadwal: '',
    status_mengajar: 'Tugas',
    alasan: '',
  });
  const [openId, setOpenId] = useState(null);

  const submitQuick = (e) => {
    e.preventDefault();
    if (!data.id_jadwal) return;
    post(route('guru.jurnal.quick_entry'), {
      preserveScroll: true,
      onSuccess: () => { setOpenId(null); reset(); },
    });
  };

  return (
    <Card title="Absensi Hari Ini" icon={CalendarIcon}>
      <div className="space-y-3">
        {(jadwal ?? []).length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">Tidak ada jadwal mengajar untuk hari ini.</div>
        )}

        {(jadwal ?? []).map(item => {
          const mulai = item?.jam_mulai?.slice(0,5) ?? '--:--';
          const kelas = [item?.kelas?.tingkat, item?.kelas?.jurusan].filter(Boolean).join(' ') || '-';
          const mapel = item?.mata_pelajaran?.nama_mapel ?? '—';

          return (
            <div key={item.id_jadwal} className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-semibold text-sm">
                    {mulai}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{mapel}</p>
                  <p className="text-xs text-slate-500 truncate">{kelas}</p>
                </div>

                <div className="flex gap-2 flex-wrap justify-end mt-2 sm:mt-0 sm:ml-3">
                  <Link
                    href={route('guru.absensi-mapel.show', { id_jadwal: item.id_jadwal })}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition"
                  >
                    <Send className="h-3 w-3" /> Isi Absen Siswa
                  </Link>

                  <Link
                    href={route('guru.absensi-harian.index')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-sky-600 hover:bg-sky-700 text-white transition"
                  >
                    <UserCheck className="h-3 w-3" /> Absen Guru (Masuk/Pulang)
                  </Link>

                  <button
                    onClick={() => { setOpenId(openId === item.id_jadwal ? null : item.id_jadwal); setData('id_jadwal', item.id_jadwal); }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-amber-500 hover:bg-amber-600 text-white transition"
                    aria-expanded={openId === item.id_jadwal}
                  >
                    {openId === item.id_jadwal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Jurnal Cepat (Izin/Tugas)
                  </button>
                </div>
              </div>

              <div className={`px-3 sm:px-4 pb-3 transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${openId === item.id_jadwal ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={submitQuick} className="space-y-2 mt-2">
                  <p className="text-xs text-slate-600">Catat singkat (contoh: rapat dinas atau memberi tugas).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={data.status_mengajar}
                      onChange={e => setData('status_mengajar', e.target.value)}
                      className="col-span-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    >
                      <option value="Tugas">Memberi Tugas</option>
                      <option value="Kosong">Kelas Kosong</option>
                      <option value="Digantikan">Digantikan</option>
                    </select>
                    <input
                      type="text"
                      value={data.alasan}
                      onChange={e => setData('alasan', e.target.value)}
                      placeholder="Alasan singkat (contoh: rapat dinas)"
                      className="col-span-2 text-xs border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                  </div>
                  {errors?.alasan && <div className="text-xs text-rose-600">{errors.alasan}</div>}
                  <div className="flex justify-end">
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
                      {processing ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Mini Riwayat ---------- */
function MiniHistory({ items = [] }) {
  return (
    <Card title="Riwayat Singkat (7 hari terakhir)" icon={Clock} right={
      <Link href={route('guru.laporan.index')} className="text-xs text-sky-700 hover:text-sky-900">Lihat Semua</Link>
    }>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">Tanggal</th>
              <th className="py-2 pr-4">Status Guru</th>
              <th className="py-2 pr-4">Ringkasan Siswa</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).length === 0 && (
              <tr><td colSpan="3" className="py-6 text-center text-slate-500">Belum ada data.</td></tr>
            )}
            {(items ?? []).map((r, idx) => (
              <tr key={r.id || idx} className="border-t">
                <td className="py-2 pr-4">{r.tanggal ?? '-'}</td>
                <td className="py-2 pr-4">
                  <Badge
                    text={r.status_guru ?? '-'}
                    tone={r.status_guru === 'Hadir' ? 'green' : (r.status_guru === 'Izin' || r.status_guru === 'Sakit') ? 'yellow' : (r.status_guru === 'Alfa' ? 'red' : 'default')}
                  />
                </td>
                <td className="py-2 pr-4">{r.ringkasan_siswa ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Rekap Kelas Diampu (placeholder jika belum ada data server) ---------- */
function KelasOverview({ data = [] }) {
  return (
    <Card title="Rekap Kehadiran Siswa (Kelas Diampu)" icon={Users}>
      <div className="space-y-2">
        {(data ?? []).length === 0 && <div className="py-4 text-sm text-slate-500">Belum ada data rekap kelas.</div>}
        {(data ?? []).map((k, i) => {
          const nama = k.kelas || k.namaKelas || `Kelas ${i+1}`;
          const pct  = Math.round(k.avg_presence_pct ?? k.persentase?.hadir ?? 0);
          return (
            <div key={nama} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{nama}</div>
                <div className="text-xs text-slate-500">Hadir: {pct}%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${pct>=90?'bg-emerald-500':pct>=75?'bg-amber-400':'bg-rose-500'}`} style={{width:`${pct}%`}} />
                </div>
                <Badge text={pct >= 90 ? 'Hijau' : pct >= 75 ? 'Kuning' : 'Merah'} tone={statusTone(pct)} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Reminders / Alerts ---------- */
function Reminders({ notifikasi = {}, statusHariIni }) {
  const list = [
    ...(notifikasi?.pengumuman ?? []),
    ...(notifikasi?.peringatanTugas ?? []),
    ...(notifikasi?.deadlineJurnal ?? []),
  ];

  // Tambah reminder otomatis jika belum absen
  if (statusHariIni === 'Belum Absen') {
    list.unshift({
      id: 'rem-belum-absen',
      tipe: 'Reminder',
      judul: 'Anda belum absen hari ini',
      pesan: 'Silakan lakukan absen masuk/pulang.',
      waktu: 'Hari ini',
      tone: 'yellow',
    });
  }

  return (
    <Card title="Reminder / Alert" icon={Bell}>
      <div className="space-y-3">
        {list.length === 0 && <div className="py-4 text-sm text-slate-500">Tidak ada notifikasi.</div>}
        {list.map((n, idx) => (
          <div key={n.id || idx} className="flex items-start gap-3 p-3 rounded-md border border-slate-100">
            <div className="mt-0.5">{n.tone === 'yellow' ? <Flame className="h-4 w-4 text-amber-500" /> : <Bell className="h-4 w-4 text-slate-400" />}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{n.judul ?? n.title ?? 'Info'}</div>
              <div className="text-xs text-slate-600">{n.pesan ?? n.message ?? '-'}</div>
              <div className="text-[11px] text-slate-400 mt-1">{n.waktu ?? '-'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={route('guru.absensi-harian.index')} className="text-xs text-sky-700 hover:text-sky-900">Buka</Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Ranking (opsional; placeholder saja) ---------- */
function RankingBox({ top = [], bottom = [] }) {
  return (
    <Card title="Ranking Kehadiran Siswa" icon={Crown}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-emerald-700 mb-1">Top 5</div>
          <div className="space-y-2">
            {(top ?? []).length === 0 && <div className="text-xs text-slate-500">—</div>}
            {(top ?? []).map((s, i) => (
              <div key={`${s.id || s.nis || i}-top`} className="flex items-center justify-between text-sm">
                <span className="truncate">{i+1}. {s.nama || s.nama_lengkap || '-'}</span>
                <Badge text={`${Math.round(s.pct ?? 0)}%`} tone="green" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-rose-700 mb-1">Bottom 5</div>
          <div className="space-y-2">
            {(bottom ?? []).length === 0 && <div className="text-xs text-slate-500">—</div>}
            {(bottom ?? []).map((s, i) => (
              <div key={`${s.id || s.nis || i}-bottom`} className="flex items-center justify-between text-sm">
                <span className="truncate">{i+1}. {s.nama || s.nama_lengkap || '-'}</span>
                <Badge text={`${Math.round(s.pct ?? 0)}%`} tone="red" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Filter Bulan ---------- */
function FiltersBar({ bulanDefault }) {
  const [bulan, setBulan] = useState(bulanDefault || new Date().toISOString().slice(0,7));
  const apply = () => {
    router.get(route('guru.dashboard'), { bulan }, { preserveScroll: true, preserveState: true });
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
      <div className="text-sm font-medium text-slate-700">Filter:</div>
      <input
        type="month"
        value={bulan}
        onChange={e => setBulan(e.target.value)}
        className="text-sm rounded-md border-slate-300 focus:ring-sky-400 focus:border-sky-400"
      />
      <button onClick={apply} className="text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5">Terapkan</button>
    </div>
  );
}

/* ======================= HALAMAN (sesuai controller: guru, jadwalHariIni, stats, notifikasi) ======================= */
export default function Dashboard({ guru, jadwalHariIni = [], stats = {}, notifikasi = {} }) {
  const { auth } = usePage().props;

  // --- angka aman untuk ditampilkan (hindari error "object as child")
  const kb = stats?.kehadiran_bulan_ini ?? {};
  const hadir = kb.hadir ?? 0;
  const izin  = kb.izin ?? 0;
  const sakit = kb.sakit ?? 0;
  const alfa  = kb.alfa ?? 0;
  const dinas = kb.dinas_luar ?? 0;
  const persen = (typeof kb.persen === 'number') ? kb.persen : (Number(kb.persen) || 0);

  // highlight keterlambatan (jika belum ada di controller → fallback 0/0)
  const lateCount = stats?.late_count ?? 0;
  const lateMinutes = stats?.late_minutes ?? 0;

  // Placeholder (server belum kirim data tambahan)
  const kelasRekap = [];          // ← nanti isi dari API/Controller rekap kelas
  const riwayatSingkat = [];      // ← nanti isi dari API/Controller
  const trendKehadiran = [];      // ← nanti isi dari API/Controller
  const rankingTop = [];          // ← nanti isi dari API/Controller
  const rankingBottom = [];       // ← nanti isi dari API/Controller

  const monthStr = new Date().toISOString().slice(0,7);

  return (
    <GuruLayout header="Dashboard">
      <Head title="Dashboard Guru" />

      {/* Filter periode */}
      <div className="mb-4">
        <FiltersBar bulanDefault={monthStr} />
      </div>

      {/* Quick insights (stat cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <StatPill label="Hadir (bln ini)" value={hadir} color="from-emerald-600 to-emerald-500" sub={`${persen}% dari hari kerja`} />
        <StatPill label="Izin" value={izin} color="from-amber-500 to-yellow-500" />
        <StatPill label="Sakit" value={sakit} color="from-cyan-600 to-sky-500" />
        <StatPill label="Alfa" value={alfa} color="from-rose-600 to-pink-500" />
        <StatPill label="Terlambat" value={lateCount} color="from-violet-600 to-fuchsia-500" sub={`${lateMinutes} menit`} />
      </div>

      {/* Donut + Rekap Kelas + Ekspor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card title="Statistik Kehadiran Pribadi (Bulan Ini)" icon={UserCheck}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="min-h-[220px] flex items-center justify-center">
              <DonutKehadiran stats={stats} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span>Hadir</span><span className="font-semibold">{hadir}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Izin</span><span className="font-semibold">{izin}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Sakit</span><span className="font-semibold">{sakit}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Alfa</span><span className="font-semibold">{alfa}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Dinas Luar</span><span className="font-semibold">{dinas}</span></div>
              <div className="mt-2 text-xs text-slate-500">Rasio hadir: <span className="font-semibold text-slate-800">{persen}%</span></div>
            </div>
          </div>
        </Card>

        <KelasOverview data={kelasRekap} />

        <Card title="Ekspor Cepat" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href={route('guru.laporan.previewPdf', { bulan: monthStr })} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 hover:bg-black text-white px-3 py-2 text-sm">
              <FileDown className="h-4 w-4" /> Cetak PDF
            </Link>
            <Link href={route('guru.laporan.exportExcel', { bulan: monthStr })} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm">
              <FileText className="h-4 w-4" /> Ekspor Excel
            </Link>
          </div>
          <div className="mt-3 text-xs text-slate-500">Periode: <span className="font-semibold">{monthStr}</span></div>
        </Card>
      </div>

      {/* Absensi Hari Ini + Riwayat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <TodaySchedule jadwal={jadwalHariIni} />
        </div>
        <MiniHistory items={riwayatSingkat} />
      </div>

      {/* Reminders */}
      <div className="mt-4">
        <Reminders notifikasi={notifikasi} statusHariIni={stats?.status_hari_ini} />
      </div>

      {/* Bar chart & Trend & Ranking (opsional) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card title="Bar Chart — % Hadir Siswa per Kelas (Bulan Ini)" icon={TrendingUp}>
          <BarPerKelas items={kelasRekap} />
        </Card>

        <Card title="Trend Kehadiran (Guru & Siswa)" icon={TrendingUp}>
          <TrendLine series={trendKehadiran} />
        </Card>

        <RankingBox top={rankingTop} bottom={rankingBottom} />
      </div>
    </GuruLayout>
  );
}
