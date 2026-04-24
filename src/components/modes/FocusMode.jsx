import { useState, useMemo, useEffect } from "react";
import { DAYS_L, MONTHS } from "../../constants.js";
import { TODAY, NOW_MIN, toMin, pad, rgba } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function FocusMode({ events, accent, onExit }) {
  const [tick, setTick] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(i); }, []);

  const h = tick.getHours(), m = tick.getMinutes();
  const h12 = h % 12 || 12, ap = h >= 12 ? "PM" : "AM";
  const dateStr = `${DAYS_L[tick.getDay()]}, ${MONTHS[tick.getMonth()]} ${tick.getDate()}`;

  const todayEvts = useMemo(() => {
    return expandEvents(events, new Date(), new Date())
      .filter(e => e.date === TODAY && !e.allDay)
      .sort((a, b) => toMin(a.start) - toMin(b.start));
  }, [events]);

  const cur  = todayEvts.find(e => toMin(e.start) <= NOW_MIN && toMin(e.end) > NOW_MIN);
  const next = todayEvts.find(e => toMin(e.start) > NOW_MIN);

  return (
    <div onClick={onExit} style={{ position: "fixed", inset: 0, background: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, ...FF, color: "#fff", cursor: "pointer" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 96, fontWeight: 100, letterSpacing: "-5px", lineHeight: 1, color: "#fff", marginBottom: 4 }}>
          {pad(h12)}:{pad(m)}<span style={{ fontSize: 32, opacity: 0.4, fontWeight: 200, marginLeft: 8 }}>{ap}</span>
        </div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>{dateStr}</div>

        {cur && (
          <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${rgba(accent, 0.4)}`, borderRadius: 18, padding: "20px 36px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8 }}>Happening Now</div>
            <div style={{ fontSize: 28, fontWeight: 300 }}>{cur.title}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{cur.start}–{cur.end}</div>
          </div>
        )}
        {next && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 6 }}>Up Next · {next.start}</div>
            <div style={{ fontSize: 22, fontWeight: 300, color: "rgba(255,255,255,0.85)" }}>{next.title}</div>
          </div>
        )}
        {!cur && !next && <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>Nothing left today</div>}
      </div>
      <div style={{ position: "absolute", bottom: 24, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Tap anywhere to exit</div>
    </div>
  );
}
