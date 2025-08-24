import React, { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";

/**
 * AttendanceHeatmap
 * Props:
 *  - data: [{date: 'YYYY-MM-DD', count: Number}, ...]  (count = persen 0..100)
 *  - month: 1..12
 *  - year: full year numeric
 *  - selectedClassName: string
 *  - onDayClick(date) optional
 *  - showLegend: boolean
 */

export default function AttendanceHeatmap({
  data = [],
  month,
  year,
  selectedClassName = "Semua Kelas",
  onDayClick = null,
  showLegend = true,
}) {
  const now = new Date();
  const y = Number.isInteger(year) ? year : now.getFullYear();
  const m = Number.isInteger(month) ? month : now.getMonth() + 1;

  // first day of month
  const firstOfMonth = new Date(y, m - 1, 1);

  // start the calendar on Monday for neat columns:
  // getDay(): 0=Sun,1=Mon,... compute offset to Monday (1)
  const dayOfWeek = firstOfMonth.getDay(); // 0..6
  const offsetToMonday = (dayOfWeek + 6) % 7; // 0 if monday, 1 if tuesday, ... 6 if sunday
  const calendarStart = new Date(firstOfMonth);
  calendarStart.setDate(firstOfMonth.getDate() - offsetToMonday);

  // end of month
  const endOfMonth = new Date(y, m, 0);

  // Build full date range from calendarStart to endOfMonth
  const allDates = useMemo(() => {
    const arr = [];
    for (let d = new Date(calendarStart); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d).toISOString().slice(0, 10));
    }
    return arr;
  }, [calendarStart, endOfMonth]);

  // normalize incoming data to map {date: 'YYYY-MM-DD' => count}
  const normalizedMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(data)) return map;
    data.forEach((it) => {
      if (!it) return;
      const date = (it.date ?? it.tanggal ?? "").toString().slice(0, 10);
      if (!date) return;
      // derive percent: support hadir/total or count
      const hadir = Number(it.hadir ?? it.hadir_count ?? it.present ?? it.value ?? 0);
      const total = Number(it.total ?? it.jumlah ?? 0);
      let count = 0;
      if (total > 0) count = Math.round((hadir / total) * 100);
      else if (typeof it.count !== "undefined") count = Math.round(Number(it.count) || 0);
      else count = Math.round(isNaN(hadir) ? 0 : hadir);
      count = Math.max(0, Math.min(100, isNaN(count) ? 0 : count));
      map.set(date, count);
    });
    return map;
  }, [data]);

  // build values array for CalendarHeatmap including zeros for missing dates
  const values = useMemo(() => {
    return allDates.map((d) => ({ date: d, count: normalizedMap.get(d) ?? 0 }));
  }, [allDates, normalizedMap]);

  // stats
  const stats = useMemo(() => {
    const daysWithData = values.length;
    const sum = values.reduce((s, v) => s + (v.count || 0), 0);
    const avg = daysWithData ? +(sum / daysWithData).toFixed(1) : 0;
    const zeroDays = values.filter(v => v.count === 0).length;
    return { days: daysWithData, avg, zeroDays };
  }, [values]);

  // color mapping
  const classForValue = (value) => {
    if (!value) return "color-empty";
    const pct = Number(value.count ?? 0);
    if (pct >= 95) return "color-scale-4";
    if (pct >= 80) return "color-scale-3";
    if (pct >= 50) return "color-scale-2";
    if (pct > 0) return "color-scale-1";
    return "color-empty";
  };

  const tooltipDataAttrs = (value) => {
    if (!value || !value.date) return null;
    const d = new Date(value.date + "T00:00:00");
    const label = d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    return {
      "data-tooltip-id": "heatmap-tooltip",
      "data-tooltip-content": `${label} — Kehadiran ${value.count}%`,
    };
  };

  const handleClick = (value) => {
    if (!value || !value.date) return;
    if (typeof onDayClick === "function") onDayClick(value.date);
  };

  // weekday full names (we still shift them left in CSS so they fit)
  const weekdayLabels = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return (
    <div className="hm-card" role="region" aria-label={`Heatmap Kehadiran ${selectedClassName}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Heatmap Kehadiran</h3>
          <div className="text-sm text-gray-500 mt-1">{selectedClassName} — {firstOfMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Rata-rata</div>
          <div className="text-lg font-semibold text-slate-800">{stats.avg}%</div>
          <div className="text-xs text-gray-400">{stats.days} hari — {stats.zeroDays} hari kosong</div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-3 mb-2">Intensitas warna menunjukkan persentase kehadiran harian. Klik kotak untuk lihat detail.</p>

      <div className="hm-heatmap-wrap" style={{ alignItems: "flex-start" }}>
        {/* CalendarHeatmap includes weekday labels; our CSS moves labels outward.
            We keep weekdayLabels to ensure the library still draws rows.
        */}
        <CalendarHeatmap
          startDate={calendarStart}
          endDate={endOfMonth}
          values={values}
          showWeekdayLabels={true}
          weekdayLabels={weekdayLabels}
          classForValue={classForValue}
          tooltipDataAttrs={tooltipDataAttrs}
          onClick={handleClick}
          rectSize={12}
          gutterSize={6}
        />
      </div>

      {showLegend && (
        <div className="hm-legend" aria-hidden>
          <span className="text-xs text-gray-500">Rendah</span>
          <div className="flex items-center gap-2">
            <div className="hm-square" style={{ background: "var(--hm-1)" }} />
            <div className="hm-square" style={{ background: "var(--hm-2)" }} />
            <div className="hm-square" style={{ background: "var(--hm-3)" }} />
            <div className="hm-square" style={{ background: "var(--hm-4)" }} />
          </div>
          <span className="text-xs text-gray-500">Tinggi</span>
          <div className="ml-auto text-xs text-gray-400">Skala: % Kehadiran</div>
        </div>
      )}

      <ReactTooltip id="heatmap-tooltip" place="top" delayShow={60} />
    </div>
  );
}
