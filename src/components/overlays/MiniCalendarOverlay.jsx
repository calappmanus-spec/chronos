import { useState, useMemo } from "react";
import { MONTHS_S, DAYS_1 } from "../../constants.js";
import { TODAY, fmtDate, addMonths, pad, rgba } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function MiniCalendarOverlay({ date, setDate, setView, events, accent, T, onClose }) {
  const [nav, setNav] = useState(() => new Date(date));
  const yr = nav.getFullYear();
  const mo = nav.getMonth();
  const firstDay    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();

  const eventDates = useMemo(() => {
    return new Set(expandEvents(events, new Date(yr, mo, 1), new Date(yr, mo + 1, 0)).map(e => e.date));
  }, [events, yr, mo]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ position: "absolute", top: 52, left: 10, zIndex: 600, background: T.pop, border: `1px solid ${T.b1}`, borderRadius: 14, padding: 16, width: 240, boxShadow: `0 12px 40px ${T.sh}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={() => setNav(d => addMonths(d, -1))} style={{ background: "none", border: "none", color: T.t1, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>‹</button>
        <button onClick={() => { setDate(new Date(yr, mo, 1)); setView("month"); onClose(); }} style={{ background: "none", border: "none", color: T.t0, cursor: "pointer", fontSize: 12, fontWeight: 700, ...FF }}>
          {MONTHS_S[mo]} {yr}
        </button>
        <button onClick={() => setNav(d => addMonths(d, 1))} style={{ background: "none", border: "none", color: T.t1, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {DAYS_1.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: T.t3, padding: "2px 0" }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds         = `${yr}-${pad(mo + 1)}-${pad(d)}`;
          const isToday    = ds === TODAY;
          const isSelected = ds === fmtDate(date);
          const hasEvents  = eventDates.has(ds);
          return (
            <div
              key={i}
              onClick={() => { setDate(new Date(yr, mo, d)); setView("day"); onClose(); }}
              style={{ position: "relative", width: 26, height: 26, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", cursor: "pointer", background: isToday ? accent : isSelected ? rgba(accent, 0.12) : "transparent" }}
            >
              <span style={{ fontSize: 10, fontWeight: isToday || isSelected ? 700 : 400, color: isToday ? "#fff" : isSelected ? T.t0 : T.t1 }}>{d}</span>
              {hasEvents && !isToday && (
                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: accent }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
