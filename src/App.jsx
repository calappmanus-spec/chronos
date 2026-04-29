import { useState, useMemo, useEffect, useRef } from "react";
import { Menu, Bell, Bot, Search, ChevronLeft, ChevronRight, X, Sparkles, LogOut } from "lucide-react";
import { MONTHS, MONTHS_S, SECTIONS, CAL_BACKGROUNDS } from "./constants.js";
import { TODAY, fmtDate, addDays, addMonths, addYears, weekStart, toMin, minToTime, getProfile, rgba, NOW_MIN, getLevel, weatherInfo } from "./utils.js";
import { LIGHT, DARK, FF } from "./theme.js";
import { INIT_EVENTS, INIT_TASKS, INIT_REWARDS } from "./data.js";
import { INIT_CALENDARS } from "./constants.js";
import ToastContainer from "./components/atoms/Toast.jsx";
import Confetti from "./components/atoms/Confetti.jsx";

import MonthView from "./components/views/MonthView.jsx";
import WeekView  from "./components/views/WeekView.jsx";
import DayView   from "./components/views/DayView.jsx";
import YearView  from "./components/views/YearView.jsx";

import MealsPanel    from "./components/panels/MealsPanel.jsx";
import WeatherPanel  from "./components/panels/WeatherPanel.jsx";
import TasksPanel    from "./components/panels/TasksPanel.jsx";
import RewardsPanel  from "./components/panels/RewardsPanel.jsx";
import GoalsPanel    from "./components/panels/GoalsPanel.jsx";
import SettingsPanel from "./components/panels/SettingsPanel.jsx";

import MiniCalendarOverlay from "./components/overlays/MiniCalendarOverlay.jsx";
import CalendarPanel       from "./components/overlays/CalendarPanel.jsx";
import CalendarGroupModal  from "./components/overlays/CalendarGroupModal.jsx";
import UserSwitcher        from "./components/overlays/UserSwitcher.jsx";
import NotificationsPanel  from "./components/overlays/NotificationsPanel.jsx";
import QuickAdd            from "./components/overlays/QuickAdd.jsx";
import AIAssistantPanel    from "./components/overlays/AIAssistantPanel.jsx";
import EventModal          from "./components/overlays/EventModal.jsx";
import EventDetailPopover      from "./components/overlays/EventDetailPopover.jsx";
import MoveEventSheet          from "./components/overlays/MoveEventSheet.jsx";
import ScheduleOptimizerPanel  from "./components/overlays/ScheduleOptimizerPanel.jsx";
import SearchPanel         from "./components/overlays/SearchPanel.jsx";
import RecurEditChoice     from "./components/overlays/RecurEditChoice.jsx";

import FocusMode       from "./components/modes/FocusMode.jsx";
import SleepMode       from "./components/modes/SleepMode.jsx";
import ScreensaverMode from "./components/modes/ScreensaverMode.jsx";
import ZenMode         from "./components/modes/ZenMode.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Avatar    from "./components/atoms/Avatar.jsx";
import AuthScreen, { getSession, clearSession } from "./components/auth/AuthScreen.jsx";
import GoalsOnboarding from "./components/overlays/GoalsOnboarding.jsx";
import GoogleCalendarSync from "./components/overlays/GoogleCalendarSync.jsx";
import { sync, sbIsSignedIn } from "./lib/supabase.js";
import { scheduleAllReminders } from "./lib/push.js";
import { gcHandleCallback, gcIsConnected } from "./lib/googleCalendar.js";

// ─── Date label helper ────────────────────────────────────────────────────────
function getNavLabel(view, date) {
  const y = date.getFullYear(), m = date.getMonth();
  if (view === "year")  return `${y}`;
  if (view === "month") return `${MONTHS[m]} ${y}`;
  if (view === "week") {
    const ws = weekStart(date), we = addDays(ws, 6);
    if (ws.getMonth() === we.getMonth()) return `${MONTHS[m]} ${ws.getDate()}–${we.getDate()}, ${y}`;
    return `${MONTHS_S[ws.getMonth()]} ${ws.getDate()} – ${MONTHS_S[we.getMonth()]} ${we.getDate()}, ${y}`;
  }
  return `${MONTHS[m]} ${date.getDate()}, ${y}`;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? new Set(JSON.parse(v)) : fallback; }
  catch { return fallback; }
}

// ─── Cloud merge helper: combine local + remote, remote wins on conflict ──────
function mergeById(local, remote) {
  if (!remote?.length) return local;
  const map = new Map((local || []).map(i => [i.id, i]));
  remote.forEach(r => map.set(r.id, r));
  return Array.from(map.values());
}

// ─── App ──────────────────────────────────────────���──────────────────���────────
export default function App() {
  // ── Auth ──
  const [session, setSession] = useState(() => getSession());
  const [showGoalsOnboarding, setShowGoalsOnboarding] = useState(false);

  const [view,          setView]          = useState("month");
  const [date,          setDate]          = useState(new Date());
  const [events,        setEvents]        = useState(() => ls("ch_events", INIT_EVENTS));
  const [tasks,         setTasks]         = useState(() => ls("ch_tasks",  INIT_TASKS));
  const [rewards,       setRewards]       = useState(() => ls("ch_rewards", INIT_REWARDS));
  const [mealData,      setMealData]      = useState(() => ls("ch_meals", {}));
  const [workoutData,   setWorkoutData]   = useState(() => ls("ch_workouts", {}));
  const [goals,         setGoals]         = useState(() => ls("ch_goals", []));
  const [taskLists,     setTaskLists]     = useState(() => ls("ch_tasklists", [
    { id: "personal", name: "Personal", color: "#6366F1" },
    { id: "work",     name: "Work",     color: "#F4881A" },
    { id: "home",     name: "Home",     color: "#4AA96C" },
  ]));
  const [modal,         setModal]         = useState(null);
  const [recurChoice,   setRecurChoice]   = useState(null);
  const [dismissed,     setDismissed]     = useState(new Set());
  const [currentUser,   setCurrentUser]   = useState(() => {
    // Prefer the session userId so the logged-in account drives everything
    const sess = getSession();
    if (sess?.userId) return sess.userId;
    // Fall back to first account in localStorage, or a generic id
    try {
      const accs = JSON.parse(localStorage.getItem("ch_accounts") || "[]");
      if (accs.length) return accs[0].id;
    } catch { /* ignore */ }
    return ls("ch_user", "user");
  });
  const [section,       setSection]       = useState("calendar");
  const [hidden,        setHidden]        = useState(new Set());
  const [calendars,     setCalendars]     = useState(() => ls("ch_calendars", INIT_CALENDARS));
  const [hiddenCals,    setHiddenCals]    = useState(() => lsSet("ch_hcals", new Set()));
  const [calModal,      setCalModal]      = useState(null);
  const [darkMode,      setDarkMode]      = useState(() => ls("ch_dark", false));
  const [sleepMode,     setSleepMode]     = useState(false);
  const [focusMode,     setFocusMode]     = useState(false);
  const [calBg,         setCalBg]         = useState(() => ls("ch_calbg", "transparent") || "transparent");
  const [visiblePeople, setVisiblePeople] = useState(() => lsSet("ch_vpeople", new Set()));
  const [weatherLocation, setWeatherLocation] = useState(() => ls("ch_wloc", "Charlotte, NC") || "Charlotte, NC");
  const [weatherCoords,   setWeatherCoords]   = useState(() => ls("ch_coords", { lat: 35.2271, lon: -80.8431 }));
  const [pwaPrompt,     setPwaPrompt]     = useState(null);
  const [toasts,        setToasts]        = useState([]);
  const [activityFeed,  setActivityFeed]  = useState([]);
  const [confetti,      setConfetti]      = useState(0);
  const [showMiniCal,   setShowMiniCal]   = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [showCalPanel,  setShowCalPanel]  = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showAI,        setShowAI]        = useState(false);
  const [showOptimizer,    setShowOptimizer]    = useState(false);
  const [showGoogleSync,   setShowGoogleSync]   = useState(false);
  const [screensaver,      setScreensaver]      = useState(false);
  const [zenMode,          setZenMode]          = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);
  const [showQuickAdd,  setShowQuickAdd]  = useState(false);
  const [quickDate,     setQuickDate]     = useState(TODAY);
  const [detailEv,      setDetailEv]      = useState(null);
  const [moveSheet,     setMoveSheet]     = useState(null);
  const [undoState,     setUndoState]     = useState(null);
  const swipeX = useRef(null);

  const T      = useMemo(() => darkMode ? DARK : LIGHT, [darkMode]);
  const cu     = getProfile(currentUser);
  const accent = cu.color;

  const rootRef    = useRef(null);
  const mcTimerRef = useRef(null);

  // Auto-close mini cal after 10 min
  useEffect(() => {
    if (showMiniCal) {
      clearTimeout(mcTimerRef.current);
      mcTimerRef.current = setTimeout(() => setShowMiniCal(false), 600000);
    }
    return () => clearTimeout(mcTimerRef.current);
  }, [showMiniCal]);

  // Close popovers on outside click
  useEffect(() => {
    function handler(e) {
      if (!rootRef.current || rootRef.current.contains(e.target)) return;
      setShowNotifs(false); setShowUserMenu(false); setShowCalPanel(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Persist state to localStorage ──
  useEffect(() => { localStorage.setItem("ch_events",    JSON.stringify(events)); },    [events]);
  useEffect(() => { localStorage.setItem("ch_tasks",     JSON.stringify(tasks)); },     [tasks]);
  useEffect(() => { localStorage.setItem("ch_rewards",   JSON.stringify(rewards)); },   [rewards]);
  useEffect(() => { localStorage.setItem("ch_meals",     JSON.stringify(mealData)); },    [mealData]);
  useEffect(() => { localStorage.setItem("ch_workouts",  JSON.stringify(workoutData)); }, [workoutData]);
  useEffect(() => { localStorage.setItem("ch_goals",     JSON.stringify(goals)); },       [goals]);
  useEffect(() => { localStorage.setItem("ch_tasklists", JSON.stringify(taskLists)); },   [taskLists]);
  useEffect(() => { localStorage.setItem("ch_calendars", JSON.stringify(calendars)); }, [calendars]);
  useEffect(() => { localStorage.setItem("ch_dark",      JSON.stringify(darkMode)); },  [darkMode]);
  useEffect(() => { localStorage.setItem("ch_calbg",     calBg); },                    [calBg]);
  useEffect(() => { localStorage.setItem("ch_user",      currentUser); },               [currentUser]);
  useEffect(() => { localStorage.setItem("ch_wloc",      weatherLocation); },           [weatherLocation]);
  useEffect(() => { localStorage.setItem("ch_coords",    JSON.stringify(weatherCoords)); }, [weatherCoords]);

  // ── Geolocation: get real coordinates once on very first load ──
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const stored = ls("ch_coords", null);
    if (stored) return; // already have real coords
    navigator.geolocation.getCurrentPosition(
      pos => setWeatherCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {} // silently fall back to Charlotte default
    );
  }, []); // eslint-disable-line

  // ── Geocode text location → lat/lon via Open-Meteo (free, no key needed) ──
  async function geocodeLocation(locationText) {
    try {
      const q   = encodeURIComponent(locationText.trim());
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`);
      const d   = await res.json();
      const hit = d?.results?.[0];
      if (hit) {
        setWeatherCoords({ lat: hit.latitude, lon: hit.longitude });
        return true;
      }
    } catch { /* fall back silently */ }
    return false;
  }

  function handleSaveLocation(text) {
    setWeatherLocation(text);
    geocodeLocation(text);
  }
  useEffect(() => { localStorage.setItem("ch_hcals",   JSON.stringify([...hiddenCals])); },    [hiddenCals]);
  useEffect(() => { localStorage.setItem("ch_vpeople", JSON.stringify([...visiblePeople])); }, [visiblePeople]);

  // ── Supabase background sync (fire-and-forget, no UI impact) ──
  useEffect(() => {
    if (!sbIsSignedIn()) return;
    events.forEach(ev => sync.save("events", ev));
  }, [events]); // eslint-disable-line
  useEffect(() => {
    if (!sbIsSignedIn()) return;
    tasks.forEach(t => sync.save("tasks", t));
  }, [tasks]); // eslint-disable-line
  useEffect(() => {
    if (!sbIsSignedIn()) return;
    goals.forEach(g => sync.save("goals", g));
  }, [goals]); // eslint-disable-line
  useEffect(() => {
    if (!sbIsSignedIn()) return;
    taskLists.forEach(l => sync.save("task_lists", l));
  }, [taskLists]); // eslint-disable-line

  // ── Google OAuth callback handler ──
  useEffect(() => {
    const url  = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (code && window.location.pathname === "/oauth/google") {
      gcHandleCallback(code, state).then(() => {
        window.history.replaceState({}, "", "/");
        setShowGoogleSync(true);
      });
    }
  }, []); // eslint-disable-line

  // ── PWA install prompt ──
  useEffect(() => {
    const handler = e => { e.preventDefault(); setPwaPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Idle screensaver (5 min of no interaction) ──
  const idleRef = useRef(null);
  useEffect(() => {
    const reset = () => {
      clearTimeout(idleRef.current);
      if (!focusMode && !sleepMode && !zenMode) {
        idleRef.current = setTimeout(() => setScreensaver(true), 5 * 60 * 1000);
      }
    };
    const events = ["mousemove","mousedown","keydown","touchstart","scroll","wheel"];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(idleRef.current);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [focusMode, sleepMode, zenMode]);

  // ── Request notification permission once ──
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Live clock (updates every minute) ──
  const [nowTime, setNowTime] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNowTime(new Date());
    // Align to next minute boundary for clean ticks
    const msUntilNextMin = 60000 - (Date.now() % 60000);
    const t0 = setTimeout(() => { tick(); const iv = setInterval(tick, 60000); return () => clearInterval(iv); }, msUntilNextMin);
    return () => clearTimeout(t0);
  }, []);
  const clockStr = nowTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // ── Current weather (lightweight fetch, shared with DayView) ──
  const [weatherCurrent, setWeatherCurrent] = useState(null);
  useEffect(() => {
    const { lat, lon } = weatherCoords;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature&timezone=auto&temperature_unit=fahrenheit`)
      .then(r => r.json()).then(d => setWeatherCurrent(d?.current || null)).catch(() => {});
  }, [weatherCoords]);

  // Load DM Sans font
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
    document.head.appendChild(link);
  }, []);

  const myEvents = useMemo(() => (events || []).filter(e => (e.pids || []).includes(currentUser)), [events, currentUser]);

  // ── Push notification scheduling (reschedule when events change) ──
  useEffect(() => {
    scheduleAllReminders(myEvents, currentUser);
  }, [myEvents, currentUser]); // eslint-disable-line

  const visibleEvents = useMemo(() => {
    return (events || []).filter(e => {
      const isParticipant = (e.pids || []).includes(currentUser);
      const organizer = e.organizer || (e.pids || [])[0];
      if (isParticipant) {
        if (e.calendarId && hiddenCals.has(e.calendarId)) return false;
        if ((e.pids || []).some(p => p !== currentUser && hidden.has(p))) return false;
        return true;
      }
      if (!organizer || !visiblePeople.has(organizer)) return false;
      if (e.private) return false;
      return true;
    }).map(e => {
      // Attach calendar color for inheritance
      const cal = calendars.find(c => c.id === e.calendarId);
      return cal ? { ...e, calColor: cal.color } : e;
    });
  }, [events, currentUser, hidden, hiddenCals, visiblePeople, calendars]);

  function navigate(dir) {
    if (view === "year")       setDate(d => addYears(d, dir));
    else if (view === "month") setDate(d => addMonths(d, dir));
    else if (view === "week")  setDate(d => addDays(d, dir * 7));
    else                        setDate(d => addDays(d, dir));
  }

  const todayUpcoming  = useMemo(() => myEvents.filter(e => e.date === TODAY && !e.allDay && toMin(e.end) > NOW_MIN), [myEvents]);
  const pendingInvites = useMemo(() => (events || []).filter(ev => (ev.pids || []).includes(currentUser) && ev.organizer !== currentUser && (ev.attendees || {})[currentUser] === "pending").length, [events, currentUser]);
  const badge = todayUpcoming.filter(e => !dismissed.has(e.id)).length + pendingInvites;

  function goSection(s) {
    if (s === "calendar" || SECTIONS.includes(s)) {
      setSection(s);
      if (s === "goals") handleGoalsSection();
    }
  }

  function openNew(ds) {
    const d = ds || fmtDate(date);
    setQuickDate(d);
    openFullCreate({ date: d });
  }
  function openFullCreate(partial = {}) {
    const d = partial.date || quickDate || fmtDate(date);
    setShowQuickAdd(false);
    setModal({
      date: d, start: "09:00", end: "10:00",
      pids: [currentUser], organizer: currentUser,
      allDay: false, recurring: false,
      recurrence: { freq: "weekly", interval: 1, days: [], until: "" },
      reminders: [15], important: false, private: false,
      attendees: { [currentUser]: "accepted" },
      ...partial,
    });
  }
  // Show read-only detail popover first; Edit button inside it opens modal
  function openDetail(ev) { setDetailEv(ev); }

  function openEdit(ev) {
    setDetailEv(null);
    if (ev.recurring) {
      setRecurChoice(ev);
    } else {
      const base = (events || []).find(e => e.id === (ev.baseId || ev.id) || e.baseId === (ev.baseId || ev.id)) || ev;
      setModal({ ...base, date: ev.date });
    }
  }

  function duplicateEvent(ev) {
    const newId = Math.random().toString(36).slice(2);
    const att = {};
    (ev.pids || []).forEach(p => { att[p] = "accepted"; });
    const dup = { ...ev, id: newId, baseId: newId, title: ev.title + " (copy)", attendees: att };
    setEvents(es => [...es, dup]);
    addToast("success", "Duplicated", dup.title, 3000);
  }

  function handleRecurChoice(type, ev) {
    setRecurChoice(null);
    const base = (events || []).find(e => e.id === (ev.baseId || ev.id) || e.baseId === (ev.baseId || ev.id)) || ev;
    if (type === "this") {
      // Edit as a standalone one-off event for this date only
      setModal({ ...base, date: ev.date, id: ev.id + "_ex", baseId: ev.id + "_ex", recurring: false, recurrence: { freq: "weekly", until: "" } });
    } else {
      // Edit all — standard behavior
      setModal({ ...base, date: ev.date });
    }
  }

  function saveEvent(form) {
    setEvents(es => {
      const existing = es.find(e => e.id === form.id || e.baseId === form.baseId);
      if (existing) return es.map(e => (e.id === form.id || e.baseId === form.baseId) ? form : e);
      return [...es, form];
    });
    setModal(null); setShowQuickAdd(false);
  }

  function deleteEvent(id) {
    const snapshot = [...events];
    setUndoState({ events: snapshot });
    setEvents(es => es.filter(e => e.id !== id && e.baseId !== id));
    setModal(null);
    setDetailEv(null);
    addToast("info", "Event deleted", "Restore it below", 5000, () => {
      setEvents(snapshot);
      setUndoState(null);
    });
  }

  function doUndo() {
    if (!undoState) return;
    setEvents(undoState.events);
    setUndoState(null);
    addToast("success", "Undone", "Event restored");
  }

  function acceptInvite(eventId, pid)  { setEvents(es => es.map(e => (e.id === eventId || e.baseId === eventId) ? { ...e, attendees: { ...e.attendees, [pid]: "accepted" } } : e)); }
  function declineInvite(eventId, pid) { setEvents(es => es.map(e => (e.id === eventId || e.baseId === eventId) ? { ...e, attendees: { ...e.attendees, [pid]: "declined" } } : e)); }

  function reschedule(baseId, newDate, ns, ne) {
    const snapshot = [...events];
    setUndoState({ events: snapshot });
    setEvents(es => es.map(e => {
      if (e.id !== baseId && e.baseId !== baseId) return e;
      const dur = toMin(e.end) - toMin(e.start);
      const s   = ns || e.start;
      const end = ne || (ns ? minToTime(Math.min(toMin(s) + dur, 23 * 60 + 59)) : e.end);
      return { ...e, date: newDate || e.date, start: s, end };
    }));
    if (newDate) addToast("info", "Event moved", "Restore it below", 4000, () => {
      setEvents(snapshot);
      setUndoState(null);
    });
  }

  // ── Toast helpers ──
  function addToast(type, title, message, duration, actionFn, actionLabel) {
    const id = Math.random().toString(36).slice(2);
    const action = actionFn ? { label: actionLabel || "Undo", fn: actionFn } : undefined;
    setToasts(ts => [...ts, { id, type, title, message, duration, action }]);
  }
  function removeToast(id) { setToasts(ts => ts.filter(t => t.id !== id)); }

  function onTaskComplete(task) {
    const basePts = { high: 30, medium: 20, low: 10 }[task.pri] || 10;
    const owner   = task.owner || currentUser;
    const r       = rewards[owner] || { pts: 0, done: 0, streak: 0, famEvs: 0 };
    // streak multiplier
    const mult = r.streak >= 30 ? 1.5 : r.streak >= 14 ? 1.35 : r.streak >= 7 ? 1.25 : r.streak >= 3 ? 1.1 : 1;
    const pts  = Math.round(basePts * mult);
    const prevLvl = getLevel(r.pts);
    const newPts  = r.pts + pts;
    const newLvl  = getLevel(newPts);
    const leveledUp = newLvl.name !== prevLvl.name;

    setRewards(rv => ({ ...rv, [owner]: { ...(rv[owner] || {}), pts: newPts, done: (r.done || 0) + 1 } }));

    // Activity feed
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActivityFeed(f => [{ icon: task.pri === "high" ? "🔥" : "✅", label: `Completed: ${task.title}`, pts, time: timeStr }, ...f].slice(0, 30));

    // Toasts
    addToast("success", "Task Done!", `+${pts} pts${mult > 1 ? ` (${mult}× streak bonus!)` : ""}`);
    if (leveledUp) {
      addToast("reward", `Level Up! 🎉`, `You reached ${newLvl.name}!`, 5000);
      setConfetti(c => c + 1);
    }
  }

  // ── Calendar group handlers ──
  function saveCalendar(cal) {
    setCalendars(cs => {
      const exists = cs.find(c => c.id === cal.id);
      return exists ? cs.map(c => c.id === cal.id ? cal : c) : [...cs, cal];
    });
    setCalModal(null);
    addToast("success", cal.name, cal.id.startsWith("cal_") && !INIT_CALENDARS.find(c => c.id === cal.id) ? "Calendar created" : "Calendar updated");
  }
  function deleteCalendar(id) {
    setCalendars(cs => cs.filter(c => c.id !== id));
    setCalModal(null);
    addToast("info", "Calendar removed", "");
  }

  function onSpendPoints(userId, cost, label) {
    setRewards(rv => {
      const r = rv[userId] || { pts: 0, done: 0, streak: 0, famEvs: 0 };
      if (r.pts < cost) return rv;
      return { ...rv, [userId]: { ...r, pts: r.pts - cost } };
    });
    const now = new Date();
    setActivityFeed(f => [{ icon: "🪙", label, pts: null, time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...f].slice(0, 30));
  }

  // ── Apply schedule changes from optimizer ──
  function applyScheduleChanges({ newEvents, rescheduled, deleted }) {
    const snapshot = [...events];
    setUndoState({ events: snapshot });
    setEvents(es => {
      let next = [...es];
      // Add new events
      next = [...next, ...newEvents];
      // Reschedule by title match
      rescheduled.forEach(p => {
        next = next.map(e => {
          if (!e.title.toLowerCase().includes(p.eventTitle.toLowerCase())) return e;
          return { ...e, ...(p.newDate ? { date: p.newDate } : {}), ...(p.newStart ? { start: p.newStart } : {}), ...(p.newEnd ? { end: p.newEnd } : {}) };
        });
      });
      // Delete by title match
      deleted.forEach(p => {
        next = next.filter(e => !e.title.toLowerCase().includes(p.eventTitle.toLowerCase()) || e.date !== p.date);
      });
      return next;
    });
    const total = newEvents.length + rescheduled.length + deleted.length;
    addToast("success", "Changes applied", `${total} change${total !== 1 ? "s" : ""} made`, 5000, () => {
      setEvents(snapshot);
      setUndoState(null);
    });
  }

  // ── Auth guard ──
  if (!session) {
    return (
      <AuthScreen
        onAuthenticated={async id => {
          setSession({ userId: id });
          setCurrentUser(id);
          // Pull any cloud data for this user (fire-and-forget, silently merges)
          const pulled = await sync.pullAll();
          if (pulled.events?.length)  setEvents(es   => mergeById(es,    pulled.events));
          if (pulled.tasks?.length)   setTasks(ts    => mergeById(ts,    pulled.tasks));
          if (pulled.goals?.length)   setGoals(gs    => mergeById(gs,    pulled.goals));
          if (pulled.lists?.length)   setTaskLists(ls => mergeById(ls,  pulled.lists));
        }}
      />
    );
  }

  // ── Goals onboarding trigger (first time visiting Goals tab) ──
  function handleGoalsSection() {
    const onboarded = localStorage.getItem("ch_goals_onboarded");
    if (!onboarded && goals.length === 0) {
      setShowGoalsOnboarding(true);
    }
  }

  function handleGoalsOnboardingComplete(newGoals) {
    setGoals(gs => [...gs, ...newGoals]);
    setShowGoalsOnboarding(false);
  }

  // ── Logout ──
  function handleLogout() {
    clearSession();
    setSession(null);
    setCurrentUser("user"); // reset to generic default
  }

  // Special full-screen modes
  if (screensaver) return <ScreensaverMode events={myEvents} weatherCurrent={weatherCurrent} accent={accent} onExit={() => setScreensaver(false)} />;
  if (zenMode)     return <ZenMode events={myEvents} accent={accent} onExit={() => setZenMode(false)} />;
  if (focusMode)   return <FocusMode events={myEvents} accent={accent} onExit={() => setFocusMode(false)} />;
  if (sleepMode)   return <SleepMode events={events} coords={weatherCoords} onExit={() => setSleepMode(false)} />;

  const isCalendar = section === "calendar";
  const sectionTitles = { meals: "Fitness", weather: "Weather", tasks: "Tasks", goals: "Goals", rewards: "Rewards", settings: "Settings" };
  const hasBg    = calBg !== "transparent";
  const isBgDark = CAL_BACKGROUNDS.find(b => b.value === calBg)?.dark ?? true; // custom colors default to dark
  const tbText0  = hasBg ? (isBgDark ? "#fff"                   : "#1a1a2e") : T.t0;
  const tbText2  = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;
  const tbBorder = hasBg ? (isBgDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)") : T.b1;
  const calViewProps  = { date, events: visibleEvents, tasks, accent, T, reschedule, calBg, isBgDark, onLongPress: ev => setMoveSheet(ev) };

  return (
    <div ref={rootRef} style={{ ...FF, background: calBg !== "transparent" ? calBg : T.bg, backgroundSize: "cover", backgroundAttachment: "fixed", color: T.t0, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top))", borderBottom: `1px solid ${calBg !== "transparent" ? "rgba(255,255,255,0.1)" : T.b1}`, background: calBg !== "transparent" ? "transparent" : T.bg1, flexShrink: 0, position: "relative", zIndex: 200 }}>

        <button onClick={() => setShowMiniCal(s => !s)} style={{ width: 32, height: 32, border: `1px solid ${showMiniCal ? rgba(accent, 0.5) : tbBorder}`, background: showMiniCal ? rgba(accent, 0.2) : "transparent", borderRadius: 8, cursor: "pointer", color: showMiniCal ? tbText0 : tbText2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Menu size={16} strokeWidth={2} />
        </button>

        {showMiniCal && (
          <MiniCalendarOverlay date={date} setDate={setDate} setView={v => { setView(v); goSection("calendar"); }} events={myEvents} accent={accent} T={T} onClose={() => setShowMiniCal(false)} />
        )}

        {isCalendar && (
          <>
            <div style={{ display: "flex", gap: 1, background: hasBg ? "rgba(255,255,255,0.1)" : rgba("#000", 0.05), borderRadius: 9, padding: 3 }}>
              {["Day","Week","Month","Year"].map(v => (
                <button key={v} onClick={() => setView(v.toLowerCase())} style={{ background: view === v.toLowerCase() ? rgba(accent, 0.2) : "transparent", border: "none", color: view === v.toLowerCase() ? (hasBg ? "#fff" : accent) : tbText2, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7, cursor: "pointer", ...FF }}>{v}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button onClick={() => navigate(-1)} style={{ width: 28, height: 28, border: `1px solid ${tbBorder}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: tbText2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={15} strokeWidth={2.2} />
              </button>
              <button onClick={() => setDate(new Date())} style={{ fontSize: 11, fontWeight: 600, padding: "4px 8px", border: `1px solid ${tbBorder}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: tbText2, ...FF }}>Today</button>
              <button onClick={() => navigate(1)} style={{ width: 28, height: 28, border: `1px solid ${tbBorder}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: tbText2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: hasBg ? tbText0 : accent, letterSpacing: "-0.3px", ...FF }}>{getNavLabel(view, date)}</div>
          </>
        )}

        {!isCalendar && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => goSection("calendar")} style={{ display: "flex", alignItems: "center", gap: 5, background: hasBg ? (isBgDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)") : rgba(accent, 0.08), border: `1px solid ${hasBg ? tbBorder : rgba(accent, 0.2)}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: tbText0, fontSize: 12, fontWeight: 600, ...FF }}><ChevronLeft size={14} /> Calendar</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: tbText0, ...FF }}>{sectionTitles[section] || ""}</div>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {/* Live clock */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: hasBg ? tbText0 : accent, letterSpacing: "-0.3px", lineHeight: 1.1, ...FF }}>{clockStr}</span>
            {weatherCurrent && (
              <span style={{ fontSize: 10, color: tbText2, letterSpacing: "-0.1px", ...FF }}>
                {weatherInfo(weatherCurrent.weather_code).icon} {Math.round(weatherCurrent.temperature_2m)}°
              </span>
            )}
          </div>
          <button onClick={() => { setShowSearch(s => !s); setShowNotifs(false); setShowUserMenu(false); setShowAI(false); }} style={{ width: 34, height: 34, border: `1px solid ${showSearch ? rgba(accent, 0.5) : tbBorder}`, background: showSearch ? rgba(accent, 0.2) : "transparent", borderRadius: 9, cursor: "pointer", color: showSearch ? tbText0 : tbText2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={16} strokeWidth={2} />
          </button>
          <button onClick={() => { setShowOptimizer(s => !s); setShowAI(false); setShowNotifs(false); }} title="Schedule Optimizer" style={{ width: 34, height: 34, border: `1px solid ${showOptimizer ? rgba("#6366F1", 0.5) : tbBorder}`, background: showOptimizer ? rgba("#6366F1", 0.2) : "transparent", borderRadius: 9, cursor: "pointer", color: showOptimizer ? "#fff" : tbText2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} strokeWidth={1.8} color={showOptimizer ? "#9B5DE5" : undefined} />
          </button>
          <button onClick={() => { setShowAI(s => !s); setShowNotifs(false); setShowOptimizer(false); }} style={{ width: 34, height: 34, border: `1px solid ${showAI ? rgba(accent, 0.5) : tbBorder}`, background: showAI ? rgba(accent, 0.2) : "transparent", borderRadius: 9, cursor: "pointer", color: showAI ? tbText0 : tbText2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={17} strokeWidth={1.8} />
          </button>

          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowUserMenu(s => !s); setShowNotifs(false); }} style={{ display: "flex", alignItems: "center", gap: 6, background: showUserMenu ? rgba(accent, 0.12) : rgba(accent, 0.07), border: `1px solid ${rgba(accent, 0.22)}`, borderRadius: 20, padding: "4px 9px 4px 6px", cursor: "pointer" }}>
              <Avatar pid={currentUser} size={18} />
              <span style={{ fontSize: 11, fontWeight: 700, color: accent, ...FF }}>{cu.name}</span>
              <span style={{ fontSize: 9, color: T.t2 }}>▾</span>
            </button>
            {showUserMenu && <UserSwitcher currentUser={currentUser} setCurrentUser={id => { setCurrentUser(id); setShowUserMenu(false); }} T={T} onClose={() => setShowUserMenu(false)} onLogout={handleLogout} />}
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs(s => !s); setShowUserMenu(false); }} style={{ width: 34, height: 34, border: `1px solid ${badge > 0 ? rgba(accent, 0.4) : tbBorder}`, background: badge > 0 ? rgba(accent, 0.15) : "transparent", borderRadius: 9, cursor: "pointer", color: badge > 0 ? tbText0 : tbText2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Bell size={17} strokeWidth={badge > 0 ? 2.2 : 1.8} />
              {badge > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: pendingInvites > 0 ? T.amb : accent, color: "#fff", fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.bg1}` }}>{badge}</div>}
            </button>
            {showNotifs && (
              <NotificationsPanel
                myEvents={myEvents} allEvents={events} currentUser={currentUser}
                dismissed={dismissed}
                onDismiss={id => setDismissed(s => new Set([...s, id]))}
                onDismissAll={() => setDismissed(new Set(todayUpcoming.map(e => e.id)))}
                onAccept={acceptInvite} onDecline={declineInvite}
                accent={accent} T={T}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}
        onTouchStart={e => { swipeX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (swipeX.current === null) return;
          const dx = e.changedTouches[0].clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) > 60 && section === "calendar") navigate(dx < 0 ? 1 : -1);
        }}
      >
        {section === "calendar" && view === "month" && <MonthView {...calViewProps} onCell={openNew} onEv={openDetail} />}
        {section === "calendar" && view === "week"  && <WeekView  {...calViewProps} onSlot={openNew} onEv={openDetail} />}
        {section === "calendar" && view === "day"   && <DayView   {...calViewProps} onSlot={openNew} onEv={openDetail} weatherCurrent={weatherCurrent} />}
        {section === "calendar" && view === "year"  && <YearView  {...calViewProps} onMonthClick={mi => { setDate(d => new Date(d.getFullYear(), mi, 1)); setView("month"); }} />}

        {section === "meals"    && <MealsPanel T={T} calBg={calBg} isBgDark={isBgDark} mealData={mealData} setMealData={setMealData} workoutData={workoutData} setWorkoutData={setWorkoutData} onAddEvents={evs => setEvents(es => [...es, ...evs])} currentUser={currentUser} />}
        {section === "weather"  && <WeatherPanel T={T} calBg={calBg} isBgDark={isBgDark} location={weatherLocation} coords={weatherCoords} />}
        {section === "tasks"    && <TasksPanel tasks={tasks} setTasks={setTasks} lists={taskLists} setLists={setTaskLists} T={T} accent={accent} calBg={calBg} isBgDark={isBgDark} />}
        {section === "goals"    && <GoalsPanel goals={goals} setGoals={setGoals} T={T} accent={accent} calBg={calBg} isBgDark={isBgDark} onAddEvents={evs => setEvents(es => [...es, ...evs])} onAddTasks={tks => setTasks(ts => [...ts, ...tks])} setMealData={setMealData} setWorkoutData={setWorkoutData} />}
        {section === "rewards"  && <RewardsPanel rewards={rewards} T={T} currentUser={currentUser} accent={accent} activityFeed={activityFeed} onSpend={onSpendPoints} calBg={calBg} isBgDark={isBgDark} />}
        {section === "settings" && <SettingsPanel darkMode={darkMode} setDarkMode={setDarkMode} sleepMode={sleepMode} setSleepMode={setSleepMode} focusMode={focusMode} setFocusMode={setFocusMode} zenMode={zenMode} setZenMode={setZenMode} screensaver={screensaver} setScreensaver={setScreensaver} T={T} calBg={calBg} setCalBg={setCalBg} isBgDark={isBgDark} weatherLocation={weatherLocation} setWeatherLocation={handleSaveLocation} pwaPrompt={pwaPrompt} setPwaPrompt={setPwaPrompt} onImportEvents={evs => setEvents(es => [...es, ...evs])} allEvents={visibleEvents} onShowGoogleSync={() => setShowGoogleSync(true)} />}

        {showCalPanel && (
          <CalendarPanel
            calendars={calendars}
            events={events}
            hiddenCals={hiddenCals}
            setHiddenCals={setHiddenCals}
            visiblePeople={visiblePeople}
            setVisiblePeople={setVisiblePeople}
            currentUser={currentUser}
            T={T}
            onClose={() => setShowCalPanel(false)}
            onEditCalendar={cal => setCalModal(cal)}
            onNewCalendar={() => setCalModal({})}
          />
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav section={section} setSection={goSection} showCalPanel={showCalPanel} setShowCalPanel={setShowCalPanel} onNew={() => { goSection("calendar"); openNew(fmtDate(date)); }} accent={accent} T={T} calBg={calBg} darkMode={darkMode} isBgDark={isBgDark} />

      {/* ── Overlays ── */}
      {showSearch && <SearchPanel events={visibleEvents} onSelect={ev => { openDetail(ev); }} onClose={() => setShowSearch(false)} T={T} accent={accent} />}
      {showOptimizer && <ScheduleOptimizerPanel events={visibleEvents} date={date} currentUser={currentUser} onApplyChanges={applyScheduleChanges} onClose={() => setShowOptimizer(false)} T={T} accent={accent} />}
      {recurChoice && <RecurEditChoice ev={recurChoice} onChoice={type => handleRecurChoice(type, recurChoice)} onClose={() => setRecurChoice(null)} T={T} accent={accent} />}
      {showQuickAdd && <QuickAdd date={quickDate} currentUser={currentUser} onSave={saveEvent} onClose={() => setShowQuickAdd(false)} onMoreOptions={openFullCreate} T={T} accent={accent} />}
      {showAI && <AIAssistantPanel events={myEvents} date={date} currentUser={currentUser} onClose={() => setShowAI(false)} onAddEvent={ev => { saveEvent(ev); setShowAI(false); }} T={T} accent={accent} />}
      {modal  && <EventModal event={modal} allEvents={events} currentUser={currentUser} calendars={calendars} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)} accent={accent} T={T} />}
      {detailEv && (
        <EventDetailPopover
          ev={detailEv}
          T={T} accent={accent}
          onEdit={openEdit}
          onDelete={deleteEvent}
          onDuplicate={duplicateEvent}
          onMove={ev => setMoveSheet(ev)}
          onClose={() => setDetailEv(null)}
        />
      )}
      {moveSheet && (
        <MoveEventSheet
          ev={moveSheet}
          T={T} accent={accent}
          onMove={(baseId, newDate) => reschedule(baseId, newDate, null, null)}
          onClose={() => setMoveSheet(null)}
        />
      )}

      {/* Calendar group create/edit modal */}
      {calModal !== null && (
        <CalendarGroupModal
          calendar={calModal?.id ? calModal : null}
          currentUser={currentUser}
          onSave={saveCalendar}
          onDelete={deleteCalendar}
          onClose={() => setCalModal(null)}
          T={T}
          accent={accent}
        />
      )}

      {/* Goals onboarding wizard */}
      {showGoalsOnboarding && (
        <GoalsOnboarding
          T={T} accent={accent}
          onComplete={handleGoalsOnboardingComplete}
        />
      )}

      {/* Google Calendar sync */}
      {showGoogleSync && (
        <GoogleCalendarSync
          T={T} accent={accent}
          currentUser={currentUser}
          onImportEvents={evs => {
            // Merge: skip any event whose googleEventId already exists
            setEvents(es => {
              const existingIds = new Set(es.map(e => e.googleEventId).filter(Boolean));
              const fresh = evs.filter(e => !existingIds.has(e.googleEventId));
              return [...es, ...fresh];
            });
            addToast("success", "Google Calendar synced", `${evs.length} events imported`);
          }}
          onClose={() => setShowGoogleSync(false)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global confetti (level-up) */}
      <Confetti trigger={confetti} count={80} />
    </div>
  );
}
