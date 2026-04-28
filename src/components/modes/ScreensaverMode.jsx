import { useState, useMemo, useEffect } from "react";
import { DAYS_L, MONTHS } from "../../constants.js";
import { TODAY, NOW_MIN, toMin, pad, fmtDate, addDays, rgba, weatherInfo } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function ScreensaverMode({ events, weatherCurrent, accent, onExit }) {
  const [tick,   setTick]   = useState(new Date());
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });

  // Smooth clock tick
  useEffect(() => {
    const i = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Slow drift animation — content gently floats around screen
  useEffect(() => {
    function newTarget() {
      setTarget({ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 40 });
    }
    newTarget();
    const i = setInterval(newTarget, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(function animate() {
      setOffset(prev => ({
        x: prev.x + (target.x - prev.x) * 0.003,
        y: prev.y + (target.y - prev.y) * 0.003,
      }));
      requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(id);
  }, [target]);

  const h = tick.getHours(), m = tick.getMinutes(), s = tick.getSeconds();
  const h12 = h % 12 || 12, ap = h >= 12 ? "PM" : "AM";
  const dateStr = `${DAYS_L[tick.getDay()]}, ${MONTHS[tick.getMonth()]} ${tick.getDate()}`;
  const tomorrow = fmtDate(addDays(new Date(), 1));

  const upcoming = useMemo(() => {
    const today = expandEvents(events, new Date(), new Date())
      .filter(e => e.date === TODAY && !e.allDay && toMin(e.end) > NOW_MIN)
      .sort((a, b) => toMin(a.start) - toMin(b.start));
    const tom = expandEvents(events, new Date(tomorrow), new Date(tomorrow))
      .filter(e => e.date === tomorrow)
      .sort((a, b) => toMin(a.start || "00:00") - toMin(b.start || "00:00"));
    return { today: today.slice(0, 2), tomorrow: tom.slice(0, 2) };
  }, [events]);

  const wx = weatherCurrent;
  const secondDeg = s * 6;

  return (
    <div
      onClick={onExit}
      style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg,#0a0a14 0%,#090910 50%,#0d0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, cursor: "pointer", overflow: "hidden", ...FF }}
    >
      {/* Ambient glow blobs */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: rgba(accent, 0.04), top: "10%", left: "20%", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: rgba("#6366F1", 0.035), bottom: "15%", right: "15%", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Drifting content */}
      <div style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 0.1s linear", textAlign: "center", maxWidth: 480, padding: 24, pointerEvents: "none" }}>

        {/* Time */}
        <div style={{ fontSize: 90, fontWeight: 100, letterSpacing: "-6px", lineHeight: 0.9, color: "rgba(255,255,255,0.92)", marginBottom: 2, textShadow: `0 0 40px ${rgba(accent, 0.2)}` }}>
          {pad(h12)}:{pad(m)}
          <span style={{ fontSize: 28, fontWeight: 200, letterSpacing: "0", marginLeft: 10, opacity: 0.4 }}>{ap}</span>
        </div>

        {/* Date */}
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 32, letterSpacing: ".5px" }}>{dateStr}</div>

        {/* Weather badge */}
        {wx && (() => {
          const { icon } = weatherInfo(wx.weather_code);
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 18, fontWeight: 200, color: "rgba(255,255,255,0.7)" }}>{Math.round(wx.temperature_2m)}°F</span>
            </div>
          );
        })()}

        {/* Events */}
        {upcoming.today.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Today</div>
            {upcoming.today.map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 14px", marginBottom: 6, textAlign: "left" }}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: rgba(accent, 0.7), flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{ev.start} – {ev.end}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {upcoming.tomorrow.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Tomorrow</div>
            {upcoming.tomorrow.map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "9px 14px", marginBottom: 6, textAlign: "left" }}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{ev.allDay ? "All day" : `${ev.start} – ${ev.end}`}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tap hint */}
      <div style={{ position: "absolute", bottom: 24, fontSize: 10, color: "rgba(255,255,255,0.1)", letterSpacing: "1px", textTransform: "uppercase" }}>
        Tap anywhere to wake
      </div>
    </div>
  );
}
