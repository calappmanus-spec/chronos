import { useState, useMemo, useEffect } from "react";
import { DAYS_L, MONTHS } from "../../constants.js";
import { fmtDate, addDays, pad, weatherInfo, rgba, getProfile } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function SleepMode({ events, onExit }) {
  const [tick, setTick] = useState(new Date());
  const [wx,   setWx]   = useState(null);
  const [dim,  setDim]  = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      const now = new Date();
      setTick(now);
      setDim(now.getHours() >= 21 || now.getHours() < 6);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=35.2271&longitude=-80.8431&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America%2FNew_York&temperature_unit=fahrenheit&forecast_days=2")
      .then(r => r.json()).then(setWx).catch(() => {});
  }, []);

  const h = tick.getHours(), m = tick.getMinutes();
  const h12 = h % 12 || 12, ap = h >= 12 ? "PM" : "AM";
  const dateStr = `${DAYS_L[tick.getDay()]}, ${MONTHS[tick.getMonth()]} ${tick.getDate()}`;
  const tom = fmtDate(addDays(new Date(), 1));

  const tomEvts = useMemo(() => {
    return expandEvents(events, new Date(tom), new Date(tom)).filter(e => e.date === tom);
  }, [events, tom]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#030508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, ...FF, color: "#E8E8F0", opacity: dim ? 0.45 : 1, transition: "opacity 2s" }}>
      <button onClick={onExit} style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
        ✕ Wake
      </button>
      {dim && <div style={{ position: "absolute", top: 20, left: 24, fontSize: 10, color: "rgba(255,255,255,0.2)", ...FF }}>🌙 Dim mode</div>}

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 88, fontWeight: 200, letterSpacing: "-4px", lineHeight: 1, color: "#F0F0F8", ...FF }}>
          {pad(h12)}:{pad(m)}<span style={{ fontSize: 28, fontWeight: 300, marginLeft: 6, opacity: 0.5 }}>{ap}</span>
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", marginTop: 6, ...FF }}>{dateStr}</div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32, width: "100%", maxWidth: 480, padding: "0 24px", boxSizing: "border-box" }}>
        {[{ label: "Today", idx: 0 }, { label: "Tomorrow", idx: 1 }].map(({ label, idx }) => {
          const { icon } = weatherInfo(idx === 0 ? wx?.current?.weather_code : wx?.daily?.weather_code?.[1]);
          return (
            <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 8, ...FF }}>{label}</div>
              {wx ? (
                <>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: idx === 0 ? 22 : 18, fontWeight: 600, color: "#E8E8F0", ...FF }}>
                    {idx === 0 ? `${Math.round(wx.current?.temperature_2m || 0)}°F` : `H:${Math.round(wx.daily?.temperature_2m_max?.[1] || 0)}° L:${Math.round(wx.daily?.temperature_2m_min?.[1] || 0)}°`}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 8, ...FF }}>Loading…</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ width: "100%", maxWidth: 480, padding: "0 24px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10, ...FF }}>Tomorrow's Schedule</div>
        {tomEvts.length === 0
          ? <div style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", textAlign: "center", padding: "12px 0", ...FF }}>Nothing scheduled</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
              {tomEvts.map(ev => {
                const p = getProfile((ev.pids || [])[0] || "jeremy");
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#E0E0EE", ...FF }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", ...FF }}>{ev.allDay ? "All day" : `${ev.start}–${ev.end}`}</div>
                    </div>
                    {ev.important && <span style={{ fontSize: 11, color: "#FFB347" }}>★</span>}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
