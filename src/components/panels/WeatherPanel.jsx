import { useState, useEffect } from "react";
import { DAYS_L } from "../../constants.js";
import { NOW, NOW_H, addDays, weatherInfo } from "../../utils.js";
import { FF } from "../../theme.js";

export default function WeatherPanel({ T }) {
  const [wx,      setWx]      = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=35.2271&longitude=-80.8431&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=America%2FNew_York&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7")
      .then(r => r.json()).then(d => { setWx(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.t3, fontSize: 14, ...FF }}>Loading weather…</div>;
  if (!wx)     return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.t3, fontSize: 14, ...FF }}>Weather unavailable</div>;

  const { icon: curIcon, label: curLabel } = weatherInfo(wx.current?.weather_code);
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const h = (NOW_H + i) % 24, idx = NOW_H + i;
    if (!wx.hourly || idx >= wx.hourly.time?.length) return null;
    return { h, temp: Math.round(wx.hourly.temperature_2m?.[idx] || 0), code: wx.hourly.weather_code?.[idx], precip: wx.hourly.precipitation_probability?.[idx] || 0 };
  }).filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: "auto", ...FF }}>
      <div style={{ background: "linear-gradient(135deg,#1565C0,#0097A7)", padding: "28px 24px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>Charlotte, NC</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>{curIcon}</div>
          <div>
            <div style={{ fontSize: 52, fontWeight: 200, color: "#fff", lineHeight: 1 }}>{Math.round(wx.current?.temperature_2m || 0)}°F</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{curLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "rgba(255,255,255,0.75)", flexWrap: "wrap" }}>
          <span>Feels {Math.round(wx.current?.apparent_temperature || 0)}°</span>
          <span>H:{Math.round(wx.daily?.temperature_2m_max?.[0] || 0)}° L:{Math.round(wx.daily?.temperature_2m_min?.[0] || 0)}°</span>
          <span>💧{wx.current?.relative_humidity_2m || 0}%</span>
          <span>💨{Math.round(wx.current?.wind_speed_10m || 0)}mph</span>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 12 }}>Next 12 Hours</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
          {hourly.map((h, i) => {
            const { icon: hIcon } = weatherInfo(h.code);
            return (
              <div key={i} style={{ flexShrink: 0, background: T.card, border: `1px solid ${T.b1}`, borderRadius: 12, padding: "10px 12px", textAlign: "center", minWidth: 56 }}>
                <div style={{ fontSize: 10, color: T.t2, marginBottom: 4, ...FF }}>{i === 0 ? "Now" : `${h.h === 0 ? 12 : h.h > 12 ? h.h - 12 : h.h}${h.h < 12 ? "am" : "pm"}`}</div>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{hIcon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t0, ...FF }}>{h.temp}°</div>
                {h.precip > 20 && <div style={{ fontSize: 9, color: "#1565C0", marginTop: 2, ...FF }}>{h.precip}%</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 12 }}>7-Day Forecast</div>
        {Array.from({ length: 7 }, (_, i) => {
          const { icon: dIcon } = weatherInfo(wx.daily?.weather_code?.[i]);
          const hi     = Math.round(wx.daily?.temperature_2m_max?.[i] || 0);
          const lo     = Math.round(wx.daily?.temperature_2m_min?.[i] || 0);
          const precip = wx.daily?.precipitation_probability_max?.[i] || 0;
          const name   = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS_L[addDays(NOW, i).getDay()];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.b0}` }}>
              <div style={{ width: 76, fontSize: 12, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? T.t0 : T.t1, ...FF }}>{name}</div>
              <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>{dIcon}</div>
              <div style={{ width: 32, fontSize: 10, color: "#1565C0", textAlign: "center", ...FF }}>{precip > 15 ? `${precip}%` : ""}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: T.t2, width: 26, textAlign: "right", ...FF }}>{lo}°</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.b0 }}>
                  <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#4FC3F7,#EF5350)", width: `${Math.max(10, Math.min(100, (hi - lo) / 50 * 100))}%` }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.t0, width: 26, ...FF }}>{hi}°</span>
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: "center", paddingTop: 12, fontSize: 10, color: T.t3 }}>Open-Meteo · Charlotte, NC</div>
      </div>
    </div>
  );
}
