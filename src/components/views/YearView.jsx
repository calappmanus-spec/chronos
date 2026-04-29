import { useMemo } from "react";
import { MONTHS, DAYS_1 } from "../../constants.js";
import { TODAY, fmtDate, pad, rgba, getProfile } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function YearView({ date, events, onMonthClick, accent, T, calBg = "transparent" }) {
  const yr = date.getFullYear();

  const expanded = useMemo(
    () => expandEvents(events, new Date(yr, 0, 1), new Date(yr, 11, 31)),
    [events, yr]
  );

  const byDate = useMemo(() => {
    const m = {};
    expanded.forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); });
    return m;
  }, [expanded]);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 10,
      padding: "12px 14px",
      overflowY: "auto",
      flex: 1,
      background: calBg !== "transparent" ? calBg : undefined,
      alignContent: "start",
    }}>
      {Array.from({ length: 12 }, (_, mi) => {
        const fd   = new Date(yr, mi, 1).getDay();   // weekday of 1st
        const dim  = new Date(yr, mi + 1, 0).getDate(); // days in month
        const cells = [];
        for (let i = 0; i < fd; i++) cells.push(null);
        for (let d = 1; d <= dim; d++) cells.push(d);

        return (
          <div
            key={mi}
            onClick={() => onMonthClick(mi)}
            style={{
              background: T.card,
              border: `1px solid ${T.b1}`,
              borderRadius: 14,
              padding: "12px 10px 10px",
              cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.15)`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Month name */}
            <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 8, ...FF }}>{MONTHS[mi]}</div>

            {/* Day-of-week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 2 }}>
              {DAYS_1.map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: T.t3, paddingBottom: 3, ...FF }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 1 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const ds = `${yr}-${pad(mi + 1)}-${pad(d)}`;
                const isToday = ds === TODAY;
                const evs = byDate[ds] || [];
                const dotColor = evs.length > 0
                  ? getProfile((evs[0].pids || [])[0]).color
                  : accent;

                return (
                  <div
                    key={ds}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: isToday ? accent : "transparent",
                      minWidth: 0,
                    }}
                  >
                    <span style={{
                      fontSize: 9,
                      lineHeight: 1,
                      color: isToday ? "#fff" : T.t1,
                      fontWeight: isToday ? 700 : 400,
                      ...FF,
                    }}>
                      {d}
                    </span>
                    {evs.length > 0 && !isToday && (
                      <div style={{
                        position: "absolute",
                        bottom: 1,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: dotColor,
                      }} />
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
