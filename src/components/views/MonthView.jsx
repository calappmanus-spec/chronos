import { useState, useMemo } from "react";
import { DAYS_S } from "../../constants.js";
import { TODAY, fmtDate, rgba } from "../../utils.js";
import { expandEvents, makeEventColors } from "../../data.js";
import { FF } from "../../theme.js";
import EventPill from "../events/EventPill.jsx";

export default function MonthView({ date, events, tasks = [], onCell, onEv, reschedule, onLongPress, accent, T, calBg = "transparent", isBgDark = true }) {
  const yr = date.getFullYear(), mo = date.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const daysInPrevMonth = new Date(yr, mo, 0).getDate();

  const expanded = useMemo(() => expandEvents(events, new Date(yr, mo - 1, 1), new Date(yr, mo + 1, 14)), [events, yr, mo]);

  // Multi-day all-day events (have an endDate beyond their start)
  const multiEvs = useMemo(() => expanded.filter(e => e.allDay && e.endDate && e.endDate > e.date), [expanded]);
  // Single-day events (timed or single all-day)
  const singleEvs = useMemo(() => expanded.filter(e => !(e.allDay && e.endDate && e.endDate > e.date)), [expanded]);

  const byDate = useMemo(() => {
    const m = {};
    singleEvs.forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); });
    return m;
  }, [singleEvs]);

  const tasksByDate = useMemo(() => {
    const m = {};
    (tasks || []).filter(t => t.due && !t.done).forEach(t => { if (!m[t.due]) m[t.due] = []; m[t.due].push(t); });
    return m;
  }, [tasks]);

  const [over, setOver] = useState(null);

  // Build 42 cells
  const cells = [];
  for (let i = 0; i < firstDay; i++)
    cells.push({ d: daysInPrevMonth - firstDay + 1 + i, inMonth: false, ds: fmtDate(new Date(yr, mo - 1, daysInPrevMonth - firstDay + 1 + i)) });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ d: i, inMonth: true, ds: fmtDate(new Date(yr, mo, i)) });
  for (let i = 1; i <= 42 - cells.length; i++)
    cells.push({ d: i, inMonth: false, ds: fmtDate(new Date(yr, mo + 1, i)) });

  // Split into 6 weeks
  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));

  // Compute span bar assignments for a given week row
  function getSpanBars(week) {
    const wds = week.map(c => c.ds);
    const wStart = wds[0], wEnd = wds[6];
    const weekMulti = multiEvs.filter(e => e.date <= wEnd && (e.endDate || e.date) >= wStart);
    const assigned = [];
    weekMulti.forEach(ev => {
      const sc = wds.indexOf(ev.date);
      const ec = wds.indexOf(ev.endDate);
      const startCol = sc < 0 ? 0 : sc;
      const endCol   = ec < 0 ? 6 : ec;
      const continuesLeft  = ev.date < wStart;
      const continuesRight = ev.endDate > wEnd;
      let track = 0;
      while (assigned.some(a => a.track === track && !(a.endCol < startCol || a.startCol > endCol))) track++;
      const base = makeEventColors(ev.pids || []);
      const barColor = ev.color || ev.calColor || base.bar;
      assigned.push({ ev, startCol, endCol, track, continuesLeft, continuesRight, barColor });
    });
    return assigned;
  }

  const hasBg      = calBg !== "transparent";
  const gridBorder = hasBg ? (isBgDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)")  : T.b0;
  const hdrBg      = hasBg ? (isBgDark ? "rgba(0,0,0,0.25)"       : "rgba(0,0,0,0.05)") : T.bg1;
  const hdrBorder  = hasBg ? (isBgDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)")  : T.b1;
  const hdrLabel   = hasBg ? (isBgDark ? "rgba(255,255,255,0.6)"  : "rgba(0,0,0,0.45)") : T.t2;
  const dateColor  = hasBg ? (isBgDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)") : T.t2;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: hdrBg, borderBottom: `1px solid ${hdrBorder}`, flexShrink: 0 }}>
        {DAYS_S.map(d => (
          <div key={d} style={{ textAlign: "center", padding: "8px 0", fontSize: 10, fontWeight: 700, color: hdrLabel, letterSpacing: ".6px", textTransform: "uppercase", ...FF }}>{d}</div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => {
        const spanBars = getSpanBars(week);
        const maxTrack = spanBars.reduce((m, b) => Math.max(m, b.track), -1);
        const barsH = maxTrack >= 0 ? (maxTrack + 1) * 22 + 2 : 0;

        return (
          <div key={wi} style={{ display: "flex", flex: 1, position: "relative", minHeight: 80 + barsH }}>

            {/* Multi-day span bars (absolutely positioned over the whole row) */}
            {barsH > 0 && (
              <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: barsH, zIndex: 3, pointerEvents: "none" }}>
                {spanBars.map(({ ev, startCol, endCol, track, continuesLeft, continuesRight, barColor }) => (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEv(ev); }}
                    style={{
                      position: "absolute",
                      top: track * 22,
                      left:  `calc(${startCol / 7 * 100}% + ${continuesLeft  ? 0 : 2}px)`,
                      width: `calc(${(endCol - startCol + 1) / 7 * 100}% - ${(continuesLeft ? 0 : 2) + (continuesRight ? 0 : 2)}px)`,
                      height: 18,
                      background: rgba(barColor, 0.18),
                      borderLeft: continuesLeft ? "none" : `3px solid ${barColor}`,
                      borderRadius: continuesLeft ? (continuesRight ? "0" : "0 6px 6px 0") : (continuesRight ? "6px 0 0 6px" : "6px"),
                      display: "flex", alignItems: "center",
                      paddingLeft: continuesLeft ? 6 : 8,
                      fontSize: 10, fontWeight: 600, color: barColor,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      pointerEvents: "auto", cursor: "pointer", ...FF,
                    }}
                  >
                    {!continuesLeft && (ev.important ? "★ " : "") + ev.title}
                  </div>
                ))}
              </div>
            )}

            {/* Day cells */}
            {week.map(c => {
              const isToday = c.ds === TODAY;
              const cellEvs   = byDate[c.ds] || [];
              const cellTasks = tasksByDate[c.ds] || [];
              const isOver    = over === c.ds;

              return (
                <div
                  key={c.ds}
                  onClick={() => onCell(c.ds)}
                  onDragOver={e => { e.preventDefault(); setOver(c.ds); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={e => {
                    e.preventDefault();
                    const baseId = e.dataTransfer.getData("baseId");
                    const origDate = e.dataTransfer.getData("origDate");
                    if (baseId && c.ds !== origDate) reschedule(baseId, c.ds, null, null);
                    setOver(null);
                  }}
                  style={{
                    flex: 1,
                    borderRight:  `1px solid ${gridBorder}`,
                    borderBottom: `1px solid ${gridBorder}`,
                    boxSizing: "border-box",
                    padding: "6px 4px 4px",
                    paddingTop: barsH > 0 ? barsH + 32 : 6,
                    position: "relative",
                    cursor: "pointer",
                    background: isOver ? rgba(accent, 0.15) : isToday ? rgba(accent, hasBg ? 0.18 : 0.05) : (hasBg ? "transparent" : T.bg),
                    opacity: c.inMonth ? 1 : 0.28,
                    outline: isOver ? `2px solid ${rgba(accent, 0.35)}` : "none",
                    outlineOffset: -2,
                    overflow: "hidden",
                  }}
                >
                  {/* Date number circle */}
                  <div style={{ position: "absolute", top: 6, left: 4, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? accent : "transparent" }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : dateColor, ...FF }}>{c.d}</span>
                  </div>

                  {/* Event pills */}
                  {cellEvs.slice(0, 2).map(ev => <EventPill key={ev.id} ev={ev} onClick={onEv} onLongPress={onLongPress} />)}
                  {cellEvs.length > 2 && <div style={{ fontSize: 9, color: T.t3, marginTop: 1, ...FF }}>+{cellEvs.length - 2} more</div>}

                  {/* Task chips */}
                  {cellTasks.slice(0, 2).map(t => (
                    <div key={t.id} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: rgba("#F4881A", 0.13), color: "#F4881A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1, ...FF }}>
                      ✓ {t.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
