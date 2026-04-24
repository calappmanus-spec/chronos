import { PROFILES, LEVELS } from "./constants.js";

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, "0"); }
export function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export const NOW     = new Date();
export const TODAY   = fmtDate(NOW);
export const NOW_H   = NOW.getHours();
export const NOW_M   = NOW.getMinutes();
export const NOW_MIN = NOW_H * 60 + NOW_M;

export function addDays(d, n)   { const r = new Date(d); r.setDate(r.getDate() + n);         return r; }
export function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n);       return r; }
export function addYears(d, n)  { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; }
export function weekStart(d)    { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r; }
export function uid()           { return Math.random().toString(36).slice(2, 8); }
export function toMin(t)        { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; }
export function minToTime(m)    { return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
export function timeToY(t, HH)  { const [h, m] = t.split(":").map(Number); return (h + m / 60) * HH; }

// ─── Profile helpers ──────────────────────────────────────────────────────────
export function getProfile(id) { return PROFILES.find(p => p.id === id) || PROFILES[0]; }

// ─── Color helpers ────────────────────────────────────────────────────────────
export function rgba(hex, op) {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${op})`;
  } catch { return `rgba(128,128,128,${op})`; }
}

// ─── Rewards helpers ──────────────────────────────────────────────────────────
export function getLevel(pts) {
  let lv = LEVELS[0];
  for (const l of LEVELS) { if (pts >= l.min) lv = l; }
  return lv;
}
export function getNextLevel(pts) {
  return LEVELS.find(l => l.min > pts) || null;
}

// ─── Weather code → icon/label ────────────────────────────────────────────────
export function weatherInfo(code) {
  if (code == null) return { icon: "🌡️", label: "—" };
  if (code === 0)   return { icon: "☀️",  label: "Clear" };
  if (code <= 2)    return { icon: "⛅",  label: "Partly Cloudy" };
  if (code <= 3)    return { icon: "☁️",  label: "Overcast" };
  if (code <= 48)   return { icon: "🌫️", label: "Foggy" };
  if (code <= 67)   return { icon: "🌧️", label: "Rain" };
  if (code <= 77)   return { icon: "❄️",  label: "Snow" };
  if (code <= 82)   return { icon: "🌦️", label: "Showers" };
  return { icon: "⛈️", label: "Thunderstorm" };
}
