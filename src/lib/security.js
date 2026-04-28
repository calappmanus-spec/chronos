// ─── Security utilities ───────────────────────────────────────────────────────
// PIN hashing · input sanitization · rate limiting · validation

// ─── PIN Hashing (Web Crypto SHA-256) ─────────────────────────────────────────
const HASH_SALT = "chronos_v2_pin_2026";

export async function hashPin(pin) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin + HASH_SALT));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin, stored) {
  if (!stored) return false;
  // Backward compat: legacy plaintext 6-digit PINs stored before hashing
  if (stored.length <= 6 && /^\d+$/.test(stored)) return pin === stored;
  const computed = await hashPin(pin);
  return computed === stored;
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
const HTML_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" };

export function sanitize(value, maxLen = 500) {
  if (value == null) return "";
  return String(value).replace(/[&<>"']/g, c => HTML_MAP[c]).trim().slice(0, maxLen);
}

export function sanitizeEvent(ev) {
  if (!ev) return ev;
  return {
    ...ev,
    title:    sanitize(ev.title    || "Untitled", 200),
    notes:    sanitize(ev.notes    || "",         2000),
    location: sanitize(ev.location || "",          300),
  };
}

export function sanitizeTask(task) {
  if (!task) return task;
  return { ...task, title: sanitize(task.title || "Task", 200), notes: sanitize(task.notes || "", 1000) };
}

// ─── AI Rate Limiter ──────────────────────────────────────────────────────────
// Per-session in-memory tracking. 20 calls/min, 150 calls/hour.
const _calls = [];
const MAX_PER_MIN  = 20;
const MAX_PER_HOUR = 150;

export function checkRateLimit() {
  const now = Date.now();
  // Purge calls older than 1 hour
  while (_calls.length && now - _calls[0] > 3_600_000) _calls.shift();

  const inLastMin = _calls.filter(t => now - t < 60_000).length;

  if (inLastMin >= MAX_PER_MIN) {
    const oldest = _calls.find(t => now - t < 60_000);
    const waitSec = Math.ceil((60_000 - (now - oldest)) / 1000);
    throw new Error(`Too many AI requests — wait ${waitSec}s and try again.`);
  }
  if (_calls.length >= MAX_PER_HOUR) {
    throw new Error("Hourly AI request limit reached. Try again in an hour.");
  }

  _calls.push(now);
}

// ─── Content Validation ───────────────────────────────────────────────────────
export function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return !isNaN(new Date(s).getTime());
}

export function isValidTime(s) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// ─── Safe localStorage wrappers ───────────────────────────────────────────────
export function safeLoad(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("[Chronos] localStorage write failed:", key, e.message);
    return false;
  }
}
