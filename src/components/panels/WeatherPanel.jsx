import { useState, useEffect, useMemo } from "react";
import { DAYS_L } from "../../constants.js";
import { NOW, NOW_H, addDays, weatherInfo, rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import { Wind, Droplets, Eye, Activity, Sun, Thermometer, CloudRain } from "lucide-react";

// ─── Wellness metrics ─────────────────────────────────────────────────────────
function wellnessScore(temp, code, humidity, precip) {
  let score = 0;
  if (temp >= 65 && temp <= 78) score += 40;
  else if (temp >= 55 && temp <= 85) score += 28;
  else if (temp >= 45 && temp <= 90) score += 14;
  else score += 4;
  if (code <= 2) score += 35;
  else if (code <= 3) score += 25;
  else if (code <= 48) score += 14;
  else if (code <= 67) score += 5;
  else score += 0;
  if (precip < 20) score += 15;
  else if (precip < 50) score += 7;
  if (humidity >= 35 && humidity <= 65) score += 10;
  else if (humidity < 80) score += 5;
  return Math.min(100, score);
}

function activityTip(score, code, temp) {
  if (score >= 82) return { icon: Activity, text: "Excellent for outdoor exercise", color: "#4AA96C" };
  if (score >= 65) return { icon: Activity, text: "Good for a walk or light activity", color: "#2A9D8F" };
  if (score >= 45) return { icon: Activity, text: "Consider a light indoor workout", color: "#F4881A" };
  if (code >= 95) return { icon: CloudRain, text: "Storm conditions — rest day recommended", color: "#9B5DE5" };
  return { icon: Activity, text: "Best to stay indoors today", color: "#E05555" };
}

// ─── Wellness score ring ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#4AA96C" : score >= 60 ? "#2A9D8F" : score >= 40 ? "#F4881A" : "#E05555";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: ".5px" }}>score</span>
      </div>
    </div>
  );
}

// ─── Metric chip ──────────────────────────────────────────────────────────────
function MetricChip({ Icon, value, label, accent = "rgba(255,255,255,0.9)" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "10px 12px", flex: 1 }}>
      <Icon size={16} color={accent} strokeWidth={1.8} />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", ...FF }}>{value}</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: ".5px", ...FF }}>{label}</span>
    </div>
  );
}

// ─── Hourly bar ───────────────────────────────────────────────────────────────
function HourlyCard({ h, temp, code, precip, isNow, T }) {
  const { icon } = weatherInfo(code);
  const label = isNow ? "Now" : `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? "am" : "pm"}`;
  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: isNow ? rgba("#2A9D8F", 0.12) : T.bg1, border: `1px solid ${isNow ? rgba("#2A9D8F", 0.35) : T.b1}`, borderRadius: 14, padding: "10px 12px", minWidth: 58, ...FF }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: isNow ? "#2A9D8F" : T.t2 }}>{label}</span>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.t0 }}>{temp}°</span>
      {precip > 20 && <span style={{ fontSize: 9, fontWeight: 600, color: "#4A90D9" }}>{precip}%</span>}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function WeatherPanel({ T, calBg = "transparent", isBgDark = true, location = "Charlotte, NC", coords = { lat: 35.2271, lon: -80.8431 } }) {
  const [wx,      setWx]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("today"); // "today" | "week"

  useEffect(() => {
    setLoading(true);
    const { lat, lon } = coords;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`)
      .then(r => r.json()).then(d => { setWx(d); setLoading(false); }).catch(() => setLoading(false));
  }, [coords]);

  const score = useMemo(() => {
    if (!wx?.current) return 0;
    return wellnessScore(
      wx.current.temperature_2m,
      wx.current.weather_code,
      wx.current.relative_humidity_2m,
      wx.daily?.precipitation_probability_max?.[0] || 0
    );
  }, [wx]);

  const tip = useMemo(() => {
    if (!wx?.current) return null;
    return activityTip(score, wx.current.weather_code, wx.current.temperature_2m);
  }, [score, wx]);

  const hourly = useMemo(() => {
    if (!wx?.hourly) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const idx = NOW_H + i;
      if (idx >= (wx.hourly.time?.length || 0)) return null;
      return { h: (NOW_H + i) % 24, temp: Math.round(wx.hourly.temperature_2m?.[idx] || 0), code: wx.hourly.weather_code?.[idx], precip: wx.hourly.precipitation_probability?.[idx] || 0, isNow: i === 0 };
    }).filter(Boolean);
  }, [wx]);

  const heroGradient = useMemo(() => {
    if (!wx?.current) return "linear-gradient(145deg,#2A9D8F,#4AA96C)";
    const c = wx.current.weather_code;
    if (c <= 1)  return "linear-gradient(145deg,#2A7FC0,#4AA96C)";  // clear → blue-green
    if (c <= 3)  return "linear-gradient(145deg,#3D8FA8,#4A8FA8)";  // cloudy → blue-grey
    if (c <= 48) return "linear-gradient(145deg,#4A6A8A,#5A7A9A)";  // fog → slate
    if (c <= 67) return "linear-gradient(145deg,#3A5A8A,#4A6AA0)";  // rain → deep blue
    return       "linear-gradient(145deg,#4A4A7A,#5A5A9A)";          // storm → dark
  }, [wx]);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, ...FF }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${rgba("#2A9D8F",0.2)}`, borderTop: `3px solid #2A9D8F`, animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: T.t2 }}>Fetching your wellness forecast…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!wx) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: T.t2, ...FF }}>
      <CloudRain size={36} color={rgba("#2A9D8F",0.4)} />
      <div style={{ fontSize: 14 }}>Weather unavailable</div>
    </div>
  );

  const cur = wx.current;
  const { icon: curIcon, label: curLabel } = weatherInfo(cur?.weather_code);
  const hi = Math.round(wx.daily?.temperature_2m_max?.[0] || 0);
  const lo = Math.round(wx.daily?.temperature_2m_min?.[0] || 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", ...FF }}>

      {/* ── Hero card ── */}
      <div style={{ background: heroGradient, padding: "28px 22px 22px", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        {/* Location */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>{location}</div>

        {/* Temp + score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{curIcon}</span>
            <div>
              <div style={{ fontSize: 58, fontWeight: 200, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}>{Math.round(cur?.temperature_2m || 0)}°</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{curLabel}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>H:{hi}° · L:{lo}° · Feels {Math.round(cur?.apparent_temperature || 0)}°</div>
            </div>
          </div>
          <ScoreRing score={score} />
        </div>

        {/* Wellness tip */}
        {tip && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "9px 14px", marginBottom: 16 }}>
            <tip.icon size={14} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{tip.text}</span>
          </div>
        )}

        {/* Metric row */}
        <div style={{ display: "flex", gap: 8 }}>
          <MetricChip Icon={Droplets}    value={`${cur?.relative_humidity_2m || 0}%`} label="Humidity" />
          <MetricChip Icon={Wind}        value={`${Math.round(cur?.wind_speed_10m || 0)}mph`} label="Wind" />
          <MetricChip Icon={Sun}         value={cur?.uv_index !== undefined ? `${Math.round(cur.uv_index)}` : "—"} label="UV Index" />
          <MetricChip Icon={Thermometer} value={`${Math.round(cur?.apparent_temperature || 0)}°`} label="Feels Like" />
        </div>
      </div>

      {/* ── Tab toggle ── */}
      <div style={{ display: "flex", background: T.bg1, borderBottom: `1px solid ${T.b1}`, padding: "0 20px" }}>
        {[{ id:"today", label:"Today" }, { id:"week", label:"7-Day" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 18px", background: "none", border: "none", borderBottom: tab === t.id ? `2px solid #2A9D8F` : "2px solid transparent", color: tab === t.id ? "#2A9D8F" : T.t2, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: -1, ...FF }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Today view ── */}
      {tab === "today" && (
        <div style={{ padding: "18px 16px" }}>
          {/* Hourly strip */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3, marginBottom: 10 }}>Hourly</div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {hourly.map((h, i) => <HourlyCard key={i} {...h} T={T} />)}
          </div>

          {/* Wellness breakdown */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3, margin: "18px 0 10px" }}>Wellness Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              {
                label: "Air Comfort",
                value: (cur?.relative_humidity_2m >= 35 && cur?.relative_humidity_2m <= 65) ? "Comfortable" : cur?.relative_humidity_2m > 65 ? "Humid" : "Dry",
                color: (cur?.relative_humidity_2m >= 35 && cur?.relative_humidity_2m <= 65) ? "#4AA96C" : "#F4881A",
                icon: Droplets,
                note: `${cur?.relative_humidity_2m || 0}% humidity`,
              },
              {
                label: "UV Exposure",
                value: (cur?.uv_index || 0) <= 2 ? "Low" : (cur?.uv_index || 0) <= 5 ? "Moderate" : (cur?.uv_index || 0) <= 7 ? "High" : "Very High",
                color: (cur?.uv_index || 0) <= 2 ? "#4AA96C" : (cur?.uv_index || 0) <= 5 ? "#F4881A" : "#E05555",
                icon: Sun,
                note: `Index ${Math.round(cur?.uv_index || 0)} — ${(cur?.uv_index || 0) > 5 ? "use SPF" : "no action needed"}`,
              },
              {
                label: "Wind Comfort",
                value: (cur?.wind_speed_10m || 0) < 10 ? "Calm" : (cur?.wind_speed_10m || 0) < 20 ? "Breezy" : "Windy",
                color: (cur?.wind_speed_10m || 0) < 10 ? "#4AA96C" : (cur?.wind_speed_10m || 0) < 20 ? "#2A9D8F" : "#F4881A",
                icon: Wind,
                note: `${Math.round(cur?.wind_speed_10m || 0)} mph`,
              },
              {
                label: "Outdoor Score",
                value: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor",
                color: score >= 80 ? "#4AA96C" : score >= 60 ? "#2A9D8F" : score >= 40 ? "#F4881A" : "#E05555",
                icon: Activity,
                note: `${score}/100 wellness score`,
              },
            ].map(m => (
              <div key={m.label} style={{ background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: rgba(m.color, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <m.icon size={13} color={m.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.t2, textTransform: "uppercase", letterSpacing: ".4px" }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginBottom: 2 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: T.t3 }}>{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Week view ── */}
      {tab === "week" && (
        <div style={{ padding: "18px 16px" }}>
          <div style={{ background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 16, overflow: "hidden" }}>
            {Array.from({ length: 7 }, (_, i) => {
              const { icon: dIcon } = weatherInfo(wx.daily?.weather_code?.[i]);
              const dhi     = Math.round(wx.daily?.temperature_2m_max?.[i] || 0);
              const dlo     = Math.round(wx.daily?.temperature_2m_min?.[i] || 0);
              const precip  = wx.daily?.precipitation_probability_max?.[i] || 0;
              const uvMax   = Math.round(wx.daily?.uv_index_max?.[i] || 0);
              const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS_L[addDays(NOW, i).getDay()];
              const ds      = wellnessScore(dhi, wx.daily?.weather_code?.[i] || 0, 50, precip);
              const dsColor = ds >= 80 ? "#4AA96C" : ds >= 60 ? "#2A9D8F" : ds >= 40 ? "#F4881A" : "#E05555";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < 6 ? `1px solid ${T.b0}` : "none" }}>
                  <div style={{ width: 80, fontSize: 12, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? T.t0 : T.t1 }}>{dayName}</div>
                  <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{dIcon}</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: T.t3, width: 28, textAlign: "right" }}>{dlo}°</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.b0, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${rgba("#4A90D9",0.6)},${rgba("#F4881A",0.8)})`, width: `${Math.max(12, Math.min(100, (dhi - dlo) / 40 * 100))}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.t0, width: 28 }}>{dhi}°</span>
                  </div>
                  <div style={{ width: 28, textAlign: "right" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: dsColor }}>{ds}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: T.t3, textAlign: "center", marginTop: 12 }}>Wellness score shown per day · Open-Meteo</div>
        </div>
      )}
    </div>
  );
}
