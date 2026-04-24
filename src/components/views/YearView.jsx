import { useMemo } from "react";
import { MONTHS, DAYS_1 } from "../../constants.js";
import { TODAY, fmtDate, pad, rgba, getProfile } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function YearView({ date, events, onMonthClick, accent, T, calBg = "transparent" }) {
  const yr = date.getFullYear();
  const expanded = useMemo(() => expandEvents(events, new Date(yr, 0, 1), new Date(yr, 11, 31)), [events, yr]);
  const byDate = useMemo(() => {
    const m = {};
    expanded.forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); });
    return m;
  }, [expanded]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: 16, overflowY: "auto", flex: 1, position: "relative", background: calBg !== "transparent" ? calBg : undefined }}>
      {Array.from({ length: 12 }, (_, mi) => {
        const fd  = new Date(yr, mi, 1).getDay();
        const dim = new Date(yr, mi + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < fd; i++) cells.push(null);
        for (let d = 1; d <= dim; d++) cells.push(d);
        return (
          <div key={mi} onClick={() => onMonthClick(mi)} style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 14, padding: 14, cursor: "pointer" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 8, ...FF }}>{MONTHS[mi]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
              {DAYS_1.map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: T.t3, paddingBottom: 2, ...FF }}>{d}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const ds = `${yr}-${pad(mi + 1)}-${pad(d)}`;
                const isToday = ds === TODAY;
                const evs = byDate[ds] || [];
                return (
                  <div key={i} style={{ position: "relative", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: isToday ? accent : "transparent", margin: "0 auto" }}>
                    <span style={{ fontSize: 9, color: isToday ? "#fff" : T.t1, fontWeight: isToday ? 700 : 400, ...FF }}>{d}</span>
                    {evs.length > 0 && !isToday && (
                      <div style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 1 }}>
                        {evs.slice(0, 2).map((ev, ii) => (
                          <div key={ii} style={{ width: 3, height: 3, borderRadius: "50%", background: getProfile((ev.pids || [])[0] || "jeremy").color }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
