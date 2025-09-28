import React, { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import "react-calendar-heatmap/dist/styles.css";

/**
 * Props:
 *  - data: [{date:'YYYY-MM-DD', count:0..100}] atau {tanggal, hadir, total}
 *  - month: 1..12
 *  - year: 4-digit
 *  - selectedClassName: string (nama kelas)
 *  - onDayClick(dateString) optional
 *  - showLegend: boolean
 *  - enableMonthNav: boolean (default: otomatis true jika onChangeMonth ada)
 *  - onChangeMonth: ({month, year}) => void  // untuk tombol prev/next
 *  - showDayNumbers: boolean (default: true)  // tampilkan nomor tanggal di sel
 */
export default function AttendanceHeatmap({
  data = [],
  month,
  year,
  selectedClassName = "Semua Kelas",
  onDayClick = null,
  showLegend = true,
  enableMonthNav,
  onChangeMonth,
  showDayNumbers = true,
}) {
  const now = new Date();
  const y = Number.isInteger(year) ? year : now.getFullYear();
  const m = Number.isInteger(month) ? month : now.getMonth() + 1;

  // range bulan aktif
  const firstOfMonth = new Date(y, m - 1, 1);
  const lastOfMonth = new Date(y, m, 0);

  // grid mulai Senin, akhir Minggu
  const startDow = firstOfMonth.getDay(); // 0=Min..6=Sab
  const offsetToMonday = (startDow + 6) % 7;
  const calendarStart = new Date(firstOfMonth);
  calendarStart.setDate(firstOfMonth.getDate() - offsetToMonday);

  const endDow = lastOfMonth.getDay();
  const offsetToSunday = (7 - endDow) % 7;
  const calendarEnd = new Date(lastOfMonth);
  calendarEnd.setDate(lastOfMonth.getDate() + offsetToSunday);

  const toYMD = (d) => new Date(d).toISOString().slice(0, 10);
  const firstStr = toYMD(firstOfMonth);
  const lastStr = toYMD(lastOfMonth);
  const todayStr = toYMD(now);

  const allDates = useMemo(() => {
    const arr = [];
    for (let d = new Date(calendarStart); d <= calendarEnd; d.setDate(d.getDate() + 1)) {
      arr.push(toYMD(d));
    }
    return arr;
  }, [calendarStart, calendarEnd]);

  // normalisasi data => Map(YYYY-MM-DD => 0..100)
  const normalizedMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(data)) return map;

    data.forEach((it) => {
      if (!it) return;
      const dateKey = String(it.date ?? it.tanggal ?? "").slice(0, 10);
      if (!dateKey) return;

      const hadir = Number(it.hadir ?? it.hadir_count ?? it.present ?? it.value ?? NaN);
      const total = Number(it.total ?? it.jumlah ?? NaN);
      let pct;

      if (!Number.isNaN(hadir) && !Number.isNaN(total) && total > 0) {
        pct = Math.round((hadir / total) * 100);
      } else if (typeof it.count !== "undefined") {
        pct = Math.round(Number(it.count) || 0);
      } else if (!Number.isNaN(hadir)) {
        pct = Math.round(Math.max(0, Math.min(100, hadir)));
      } else {
        pct = 0;
      }

      pct = Math.max(0, Math.min(100, pct));
      map.set(dateKey, pct);
    });

    return map;
  }, [data]);

  // values untuk seluruh grid
  const values = useMemo(
    () => allDates.map((d) => ({ date: d, count: normalizedMap.get(d) ?? 0 })),
    [allDates, normalizedMap]
  );

  // statistik hanya di dalam bulan aktif
  const monthValues = useMemo(
    () => values.filter((v) => v.date >= firstStr && v.date <= lastStr),
    [values, firstStr, lastStr]
  );

  const stats = useMemo(() => {
    const days = monthValues.length;
    const sum = monthValues.reduce((s, v) => s + (v.count || 0), 0);
    const avg = days ? +(sum / days).toFixed(1) : 0;
    const zeroDays = monthValues.filter((v) => v.count === 0).length;
    return { days, avg, zeroDays };
  }, [monthValues]);

  // pewarnaan sel
  const classForValue = (value) => {
    if (!value?.date) return "hm-cell hm-empty";

    const pct = Number(value.count || 0);
    let shade = "hm-empty";
    if (pct >= 95) shade = "hm-s4";
    else if (pct >= 80) shade = "hm-s3";
    else if (pct >= 50) shade = "hm-s2";
    else if (pct > 0) shade = "hm-s1";

    const d = value.date;
    const isOutside = d < firstStr || d > lastStr;

    const dow = new Date(value.date + "T00:00:00").getDay();
    const isWeekend = dow === 0 || dow === 6;

    const isToday = value.date === todayStr;

    return [
      "hm-cell",
      shade,
      isWeekend ? "is-weekend" : "",
      isOutside ? "is-outside" : "",
      isToday ? "is-today" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  // tooltip
  const tooltipDataAttrs = (value) => {
    if (!value?.date) return null;
    const d = new Date(value.date + "T00:00:00");
    const label = d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return {
      "data-tooltip-id": "heatmap-tooltip",
      "data-tooltip-content": `${label} — Kehadiran ${value.count}%`,
    };
  };

  // klik hari
  const handleClick = (value) => {
    if (!value?.date) return;
    if (typeof onDayClick === "function") onDayClick(value.date);
  };

  const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Nav bulan (tampilkan otomatis jika handler disediakan)
  const showNav = typeof onChangeMonth === "function" || enableMonthNav === true;
  const goPrev = () => {
    if (!onChangeMonth) return;
    let nm = m - 1, ny = y;
    if (nm < 1) { nm = 12; ny = y - 1; }
    onChangeMonth({ month: nm, year: ny });
  };
  const goNext = () => {
    if (!onChangeMonth) return;
    let nm = m + 1, ny = y;
    if (nm > 12) { nm = 1; ny = y + 1; }
    onChangeMonth({ month: nm, year: ny });
  };

  const isAllZero = monthValues.every((v) => v.count === 0);

  return (
    <div className="hm-card" role="region" aria-label={`Heatmap Kehadiran ${selectedClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {showNav && (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
              title="Bulan sebelumnya"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Heatmap Kehadiran</h3>
            <div className="text-sm text-gray-500 mt-1">
              {selectedClassName} —{" "}
              {firstOfMonth.toLocaleString("id-ID", { month: "long", year: "numeric" })}
            </div>
          </div>
          {showNav && (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
              title="Bulan berikutnya"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Rata-rata bulan ini</div>
          <div className="text-lg font-semibold text-slate-800">{stats.avg}%</div>
          <div className="text-xs text-gray-400">
            {stats.days} hari • {stats.zeroDays} kosong
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-3 mb-2">
        Warna menunjukkan persentase kehadiran harian. Klik tanggal untuk melihat daftar hadir hari itu.
      </p>

      <div className="hm-heatmap-wrap">
        {isAllZero ? (
          <div className="w-full py-10 text-center text-sm text-gray-500">
            Tidak ada data kehadiran untuk bulan ini.
          </div>
        ) : (
          <CalendarHeatmap
            startDate={calendarStart}
            endDate={calendarEnd}
            values={values}
            showWeekdayLabels={true}
            weekdayLabels={weekdayLabels}
            classForValue={classForValue}
            tooltipDataAttrs={tooltipDataAttrs}
            rectSize={12}
            gutterSize={6}
            /* Tambah nomor tanggal di dalam sel */
            transformDayElement={(el, value) => {
              const date = value?.date;
              if (!date) return el;

              // koordinat rect
              const { x, y, width, height } = el.props ?? {};
              const dayNum = parseInt(date.slice(8, 10), 10);
              const isOutside = date < firstStr || date > lastStr;
              const pct = normalizedMap.get(date) ?? 0;
              const lightText = pct >= 80; // kontras di sel yang gelap

              const tooltipAttrs = tooltipDataAttrs(value) || {};

              return (
                <g {...tooltipAttrs} onClick={() => handleClick(value)}>
                  {el}
                  {showDayNumbers && !isOutside && Number.isFinite(dayNum) && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 3}
                      textAnchor="middle"
                      className={`hm-daynum ${lightText ? "hm-daynum--light" : "hm-daynum--dark"}`}
                    >
                      {dayNum}
                    </text>
                  )}
                </g>
              );
            }}
          />
        )}
      </div>

      {showLegend && (
        <div className="hm-legend" aria-hidden>
          <span className="text-xs text-gray-500">Rendah</span>
          <div className="flex items-center gap-2">
            <span className="hm-square hm-s1" />
            <span className="hm-square hm-s2" />
            <span className="hm-square hm-s3" />
            <span className="hm-square hm-s4" />
          </div>
          <span className="text-xs text-gray-500">Tinggi</span>
          <div className="ml-auto text-xs text-gray-400">Skala: % Kehadiran</div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="hm-mini hm-outline-today" />
          <span>Hari ini</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="hm-mini hm-weekend" />
          <span>Akhir pekan</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="hm-mini hm-outside" />
          <span>Di luar bulan</span>
        </div>
      </div>

      <ReactTooltip id="heatmap-tooltip" place="top" delayShow={60} />
    </div>
  );
}
