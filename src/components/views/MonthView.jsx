import { useState, useMemo } from "react";
import { DAYS_S } from "../../constants.js";
import { TODAY, fmtDate, rgba } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";
import EventPill from "../events/EventPill.jsx";

export default function MonthView({ date, events, onCell, onEv, reschedule, accent, T, calBg = "transparent" }) {
  const yr = date.getFullYear(), mo = date.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const daysInPrevMonth = new Date(yr, mo, 0).getDate();

  const expanded = useMemo(() => expandEvents(events, new Date(yr, mo - 1, 1), new Date(yr, mo + 1, 14)), [events, yr, mo]);
  const byDate = useMemo(() => {
    const m = {};
    expanded.forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); });
    return m;
  }, [expanded]);

  const [over, setOver] = useState(null);

  const cells = [];
  for (let i = 0; i < firstDay; i++)
    cells.push({ d: daysInPrevMonth - firstDay + 1 + i, inMonth: false, ds: fmtDate(new Date(yr, mo - 1, daysInPrevMonth - firstDay + 1 + i)) });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ d: i, inMonth: true, ds: fmtDate(new Date(yr, mo, i)) });
  for (let i = 1; i <= 42 - cells.length; i++)
    cells.push({ d: i, inMonth: false, ds: fmtDate(new Date(yr, mo + 1, i)) });

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
      {calBg !== "transparent" && <div className="cal-bg-overlay" style={{ background: calBg }} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: T.bg1, borderBottom: `1px solid ${T.b1}` }}>
        {DAYS_S.map(d => (
          <div key={d} style={{ textAlign: "center", padding: "8px 0", fontSize: 10, fontWeight: 700, color: T.t2, letterSpacing: ".6px", textTransform: "uppercase", ...FF }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", flex: 1 }}>
        {cells.map((c, i) => {
          const isToday = c.ds === TODAY;
          const cellEvs = byDate[c.ds] || [];
          const isOver  = over === c.ds;
          return (
            <div
              key={i}
              onClick={() => onCell(c.ds)}
              onDragOver={e => { e.preventDefault(); setOver(c.ds); }}
              onDragLeave={() => setOver(null)}
              onDrop={e => {
                e.preventDefault();
                const baseId   = e.dataTransfer.getData("baseId");
                const origDate = e.dataTransfer.getData("origDate");
                if (baseId && c.ds !== origDate) reschedule(baseId, c.ds, null, null);
                setOver(null);
              }}
              style={{
                borderRight: `1px solid ${T.b0}`, borderBottom: `1px solid ${T.b0}`,
                padding: 6, minHeight: 90, cursor: "pointer",
                background: isOver ? rgba(accent, 0.08) : isToday ? rgba(accent, 0.05) : T.bg,
                opacity: c.inMonth ? 1 : 0.25,
                outline: isOver ? `2px solid ${rgba(accent, 0.35)}` : "none",
                outlineOffset: -2,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, background: isToday ? accent : "transparent" }}>
                <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : T.t2, ...FF }}>{c.d}</span>
              </div>
              {cellEvs.slice(0, 3).map(ev => <EventPill key={ev.id} ev={ev} onClick={onEv} />)}
              {cellEvs.length > 3 && <div style={{ fontSize: 9, color: T.t3, marginTop: 1, ...FF }}>+{cellEvs.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
