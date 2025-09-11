import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';

/**
 * props:
 *  - riwayatAbsensi: array of { tanggal: 'YYYY-MM-DD', status_kehadiran: 'Hadir'|'Sakit'|'Izin'|'Alfa' }
 *  - weeks = how many weeks to show (default 4)
 */
export default function AttendanceBarChart({ riwayatAbsensi = [], weeks = 4 }) {
  // Helper: parse yyyy-mm-dd -> Date (local)
  const parseDate = (s) => {
    const [y, m, d] = (s || '').split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  // Helper: get start of ISO week (Monday)
  const startOfISOWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay() || 7; // Sunday=0 -> 7
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Build data for last `weeks` weeks
  const chartData = useMemo(() => {
    // target end = today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // compute monday of this week
    const thisWeekStart = startOfISOWeek(today);

    // Create week buckets: newest last
    const buckets = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(thisWeekStart);
      start.setDate(thisWeekStart.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      buckets.push({ start, end, label: `${start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`, hadir: 0, total: 0 });
    }

    // tally riwayatAbsensi into buckets
    riwayatAbsensi.forEach((r) => {
      if (!r || !r.tanggal) return;
      const d = parseDate(r.tanggal);
      d.setHours(0, 0, 0, 0);
      for (let b of buckets) {
        if (d >= b.start && d <= b.end) {
          b.total += 1;
          if ((r.status_kehadiran || '').toLowerCase() === 'hadir') b.hadir += 1;
          break;
        }
      }
    });

    // map to chart-friendly array
    return buckets.map(b => ({
      week: b.label,
      hadir: b.hadir,
      total: b.total,
      rate: b.total > 0 ? Math.round((b.hadir / b.total) * 100) : 0,
    }));
  }, [riwayatAbsensi, weeks]);

  // If no data at all -> show empty data
  const hasData = chartData.some(d => d.total > 0);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">Tren Kehadiran Mingguan</h4>
      <div className="text-xs text-gray-500 mb-3">4 minggu terakhir — jumlah hari hadir per minggu</div>

      {!hasData ? (
        <div className="text-sm text-gray-500 py-6 text-center">Data tidak cukup untuk menampilkan grafik. (Butuh data 30 hari terakhir)</div>
      ) : (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name, props) => {
                  if (name === 'hadir') return [value, 'Hadir (hari)'];
                  if (name === 'total') return [value, 'Total Catatan'];
                  if (name === 'rate') return [`${value}%`, 'Persentase Hadir'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Minggu: ${label}`}
              />
              <Bar dataKey="hadir" name="Hadir" stackId="a" radius={[6,6,0,0]} barSize={18} >
                <LabelList dataKey="hadir" position="top" formatter={(v) => (v > 0 ? v : '')} style={{ fill: '#0f172a', fontSize: 11 }} />
              </Bar>
              <Bar dataKey="total" name="Total" stackId="a" fill="#E6EEF9" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-500">Angka atas batang menunjukkan jumlah hari <strong>Hadir</strong> pada minggu tersebut.</div>
        </div>
      )}
    </div>
  );
}
