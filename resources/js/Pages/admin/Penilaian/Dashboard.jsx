import React, { useEffect, useMemo, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import AdminPenilaianLayout from "@/Components/layout/AdminPenilaianLayout";
// Recharts
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

/**
 * Dashboard Penilaian – Admin
 * Mengonsumsi API (di-passing dari controller via props.routes):
 *  - routes.summary
 *  - routes.distribution
 *  - routes.trend
 *  - routes.mapelLeaderboard
 *  - routes.kelasLeaderboard
 *  - routes.tuntasBreakdown
 *  - routes.remedialQueue
 *
 * Props dari controller:
 * - options: { tahunAjaran[], semester[], kelas[], mapel[] } => [{value,label}]
 * - filters: { id_tahun_ajaran, semester, id_kelas, id_mapel }
 * - routes:  { summary, distribution, trend, mapelLeaderboard, kelasLeaderboard, tuntasBreakdown, remedialQueue }
 */

export default function Dashboard({ options = {}, filters = {}, routes = {} }) {
  const { props } = usePage();
  const [f, setF] = useState({
    id_tahun_ajaran: filters?.id_tahun_ajaran || "",
    semester: filters?.semester || "",
    id_kelas: filters?.id_kelas || "",
    id_mapel: filters?.id_mapel || "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    summary: null,
    distribution: [],
    trend: [],
    mapel: [],
    kelas: [],
    breakdown: { predikat: {}, tuntas: { ya: 0, tidak: 0 } },
    remedial: [],
  });

  // helper querystring dari filter aktif
  const withQuery = (url) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(f).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      )
    ).toString();
    return qs ? `${url}?${qs}` : url;
  };

  const loadAll = async () => {
    if (!f.id_tahun_ajaran || !f.semester) return;
    setLoading(true);
    try {
      const [
        summaryRes,
        distributionRes,
        trendRes,
        mapelRes,
        kelasRes,
        breakdownRes,
        remedialRes,
      ] = await Promise.all([
        fetch(withQuery(routes.summary)),
        fetch(withQuery(routes.distribution)),
        fetch(withQuery(routes.trend)),
        fetch(withQuery(routes.mapelLeaderboard)),
        fetch(withQuery(routes.kelasLeaderboard)),
        fetch(withQuery(routes.tuntasBreakdown)),
        fetch(withQuery(routes.remedialQueue)),
      ]);

      const [summary, distribution, trend, mapel, kelas, breakdown, remedial] =
        await Promise.all([
          summaryRes.json(),
          distributionRes.json(),
          trendRes.json(),
          mapelRes.json(),
          kelasRes.json(),
          breakdownRes.json(),
          remedialRes.json(),
        ]);

      setData({ summary, distribution, trend, mapel, kelas, breakdown, remedial });
    } catch (e) {
      console.error(e);
      alert("Gagal memuat data dashboard. Coba ulangi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilter = () => {
    loadAll();
  };

  // Pie data (tuntas yes/no)
  const pieData = useMemo(() => {
    return [
      { name: "Tuntas", value: data.breakdown?.tuntas?.ya || 0 },
      { name: "Tidak", value: data.breakdown?.tuntas?.tidak || 0 },
    ];
  }, [data.breakdown]);

  // Predikat series
  const predikatData = useMemo(() => {
    const p = data.breakdown?.predikat || {};
    return ["A", "B", "C", "D"].map((k) => ({ predikat: k, jumlah: p[k] || 0 }));
  }, [data.breakdown]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head title="Dashboard Penilaian – Admin" />
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold">Dashboard Penilaian – Admin</h1>
          <p className="text-gray-600 text-sm">
            Insight nilai, ketercapaian KKM, distribusi, tren, dan antrian remedial.
          </p>
        </header>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <SelectGroup
              label="Tahun Ajaran"
              value={f.id_tahun_ajaran}
              onChange={(v) => setF((s) => ({ ...s, id_tahun_ajaran: v }))}
              options={options.tahunAjaran || []}
            />
            <SelectGroup
              label="Semester"
              value={f.semester}
              onChange={(v) => setF((s) => ({ ...s, semester: v }))}
              options={options.semester || []}
            />
            <SelectGroup
              label="Kelas (opsional)"
              value={f.id_kelas}
              onChange={(v) => setF((s) => ({ ...s, id_kelas: v }))}
              options={options.kelas || []}
            />
            <SelectGroup
              label="Mapel (opsional)"
              value={f.id_mapel}
              onChange={(v) => setF((s) => ({ ...s, id_mapel: v }))}
              options={options.mapel || []}
            />
            <div className="flex items-end">
              <button
                onClick={onApplyFilter}
                className="w-full py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                disabled={loading || !f.id_tahun_ajaran || !f.semester}
                title="Terapkan filter"
              >
                {loading ? "Memuat..." : "Terapkan"}
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          <MetricCard label="Total Siswa" value={fmtNum(data.summary?.total_siswa)} />
          <MetricCard label="Header Nilai" value={fmtNum(data.summary?.total_header)} />
          <MetricCard label="Progress Input" value={pct(data.summary?.completion_pct)} />
          <MetricCard label="Rata-rata" value={fix2(data.summary?.avg_nilai)} />
          <MetricCard label="Median" value={fix2(data.summary?.median)} />
          <MetricCard label="Pass Rate" value={pct(data.summary?.pass_rate_pct)} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <Card title="Distribusi Nilai (Bucket)">
            <ChartDistribution data={data.distribution} />
          </Card>
          <Card title="Tren Bulanan (Rata & Pass Rate)">
            <ChartTrend data={data.trend} />
          </Card>
          <Card title="Tuntas vs Tidak Tuntas">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtNum(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
          <Card title="Leaderboard Mapel (Rata & Pass Rate)">
            <ChartLeaderboard data={data.mapel} xKey="nama_mapel" />
          </Card>
          <Card title="Leaderboard Kelas (Rata & Pass Rate)">
            <ChartLeaderboard data={data.kelas} xKey="nama_kelas" />
          </Card>
        </div>

        {/* Breakdown Predikat & Remedial Queue */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card title="Breakdown Predikat">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={predikatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="predikat" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jumlah" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Antrian Remedial (Terendah ke Tertinggi)">
            <div className="overflow-auto max-h-72">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th text="Siswa" />
                    <Th text="Mapel" />
                    <Th text="Nilai" center />
                    <Th text="KKM" center />
                    <Th text="Gap" center />
                  </tr>
                </thead>
                <tbody>
                  {data.remedial?.length ? (
                    data.remedial.map((r) => (
                      <tr key={r.id_penilaian} className="border-t">
                        <Td text={r.nama_siswa} />
                        <Td text={r.nama_mapel} />
                        <Td text={fix2(r.nilai_akhir)} center />
                        <Td text={fmtNum(r.kkm ?? "-")} center />
                        <Td
                          text={
                            r.gap != null
                              ? (toNumber(r.gap) > 0 ? `-${fix2(r.gap)}` : "0")
                              : "-"
                          }
                          center
                        />
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={5}>
                        Tidak ada data remedial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Layout ---------- */
Dashboard.layout = (page) => (
  <AdminPenilaianLayout title="Dashboard Penilaian – Admin">{page}</AdminPenilaianLayout>
);

/* ---------- Subcomponents ---------- */

function SelectGroup({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <select
        className="w-full border rounded-lg px-3 py-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || "")}
      >
        <option value="">— Pilih —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? "—"}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function ChartDistribution({ data = [] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTrend({ data = [] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="avg_nilai" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="pass_rate_pct" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLeaderboard({ data = [], xKey }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="avg_nilai" name="Rata" />
          <Bar dataKey="pass_rate_pct" name="Pass %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Th({ text, center = false }) {
  return <th className={`p-3 ${center ? "text-center" : "text-left"} whitespace-nowrap`}>{text}</th>;
}
function Td({ text, center = false }) {
  return <td className={`p-3 ${center ? "text-center" : "text-left"} whitespace-nowrap`}>{text}</td>;
}

/* ---------- Utils angka aman ---------- */
function toNumber(v) {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function fix2(n) {
  const x = toNumber(n);
  return Number.isFinite(x) ? x.toFixed(2) : "—";
}
function pct(n) {
  const x = toNumber(n);
  return Number.isFinite(x) ? `${x.toFixed(2)}%` : "—";
}
function fmtNum(n) {
  const x = toNumber(n);
  return Number.isFinite(x) ? x.toLocaleString() : "—";
}
