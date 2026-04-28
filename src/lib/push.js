// ─── Push Notification Management ────────────────────────────────────────────
// Handles Web Push subscriptions and schedules in-app + background reminders.
// Falls back gracefully if Notification API is unavailable.

import { storePushSub, supabaseEnabled } from "./supabase.js";

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// ─── Native Notification helper ───────────────────────────────────────────────
export function showNotification(title, body, opts = {}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    // Prefer service worker notification (works when app is backgrounded)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: opts.tag || title,
        data: opts.data || {},
      });
    } else {
      new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", ...opts });
    }
  } catch (e) {
    console.warn("[Chronos Push] showNotification:", e.message);
  }
}

// ─── Scheduled reminders ──────────────────────────────────────────────────────
// Maps "eventId:reminderMins" → timeout ID for cleanup.
const _scheduled = new Map();

export function scheduleReminder(event, minutesBefore, onFire) {
  const key   = `${event.id}:${minutesBefore}`;
  const evMs  = getEventMs(event);
  if (!evMs) return;

  const fireAt = evMs - minutesBefore * 60_000;
  const delay  = fireAt - Date.now();
  if (delay < 0 || delay > 7 * 24 * 3600 * 1000) return; // max 1-week lookahead

  // Clear any existing timer for this key
  clearReminder(event.id, minutesBefore);

  const label = minutesBefore === 0 ? "Starting now" : `Starting in ${minutesBefore} min`;
  const timer = setTimeout(() => {
    showNotification(event.title, label, { tag: key, data: { eventId: event.id } });
    if (onFire) onFire(event, minutesBefore);
    _scheduled.delete(key);
  }, delay);

  _scheduled.set(key, timer);
}

export function clearReminder(eventId, minutesBefore) {
  const key = `${eventId}:${minutesBefore}`;
  const t   = _scheduled.get(key);
  if (t) { clearTimeout(t); _scheduled.delete(key); }
}

export function clearAllReminders() {
  for (const t of _scheduled.values()) clearTimeout(t);
  _scheduled.clear();
}

function getEventMs(event) {
  if (event.allDay || !event.date || !event.start) return null;
  const [h, m] = event.start.split(":").map(Number);
  const d = new Date(event.date);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// ─── Bulk schedule from event list ───────────────────────────────────────────
export function scheduleAllReminders(events, currentUser, onFire) {
  clearAllReminders();
  const today     = new Date();
  const weekOut   = new Date(today.getTime() + 7 * 24 * 3600_000);
  const todayStr  = today.toISOString().slice(0, 10);
  const weekStr   = weekOut.toISOString().slice(0, 10);

  const upcoming = (events || []).filter(ev => {
    if (!(ev.pids || []).includes(currentUser)) return false;
    if (ev.allDay || !ev.reminders?.length) return false;
    return ev.date >= todayStr && ev.date <= weekStr;
  });

  for (const ev of upcoming) {
    for (const mins of ev.reminders) {
      scheduleReminder(ev, mins, onFire);
    }
  }
}

// ─── Web Push subscription (for background push via server) ──────────────────
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(b64) {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64.length + (4 - b64.length % 4) % 4, "=");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY) return { error: "VAPID_PUBLIC_KEY not configured" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { error: "Push not supported in this browser" };
  }

  const perm = await requestNotificationPermission();
  if (perm !== "granted") return { error: "Notification permission denied" };

  try {
    const reg  = await navigator.serviceWorker.ready;
    const sub  = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    // Persist to Supabase if configured
    if (supabaseEnabled) await storePushSub(sub);
    localStorage.setItem("ch_push_sub", JSON.stringify(sub.toJSON()));
    return { sub };
  } catch (e) {
    return { error: e.message };
  }
}

export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    localStorage.removeItem("ch_push_sub");
  } catch (e) {
    console.warn("[Chronos Push] unsubscribe:", e.message);
  }
}

export function getPushSubscription() {
  try { return JSON.parse(localStorage.getItem("ch_push_sub") || "null"); } catch { return null; }
}
