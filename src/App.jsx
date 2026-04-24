import { useState, useMemo, useEffect, useRef } from "react";
import { Menu, Bell, Bot, ChevronLeft, ChevronRight, X } from "lucide-react";
import { MONTHS, MONTHS_S, SECTIONS } from "./constants.js";
import { TODAY, fmtDate, addDays, addMonths, addYears, weekStart, toMin, minToTime, getProfile, rgba, NOW_MIN, getLevel } from "./utils.js";
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
import SettingsPanel from "./components/panels/SettingsPanel.jsx";

import MiniCalendarOverlay from "./components/overlays/MiniCalendarOverlay.jsx";
import CalendarPanel       from "./components/overlays/CalendarPanel.jsx";
import CalendarGroupModal  from "./components/overlays/CalendarGroupModal.jsx";
import UserSwitcher        from "./components/overlays/UserSwitcher.jsx";
import NotificationsPanel  from "./components/overlays/NotificationsPanel.jsx";
import QuickAdd            from "./components/overlays/QuickAdd.jsx";
import AIAssistantPanel    from "./components/overlays/AIAssistantPanel.jsx";
import EventModal          from "./components/overlays/EventModal.jsx";

import FocusMode from "./components/modes/FocusMode.jsx";
import SleepMode from "./components/modes/SleepMode.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Avatar    from "./components/atoms/Avatar.jsx";

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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,         setView]         = useState("month");
  const [date,         setDate]         = useState(new Date());
  const [events,       setEvents]       = useState(INIT_EVENTS);
  const [tasks,        setTasks]        = useState(INIT_TASKS);
  const [rewards,      setRewards]      = useState(INIT_REWARDS);
  const [modal,        setModal]        = useState(null);
  const [dismissed,    setDismissed]    = useState(new Set());
  const [currentUser,  setCurrentUser]  = useState("jeremy");
  const [section,      setSection]      = useState("calendar");
  const [hidden,       setHidden]       = useState(new Set());
  const [calendars,    setCalendars]    = useState(INIT_CALENDARS);
  const [hiddenCals,   setHiddenCals]   = useState(new Set());
  const [calModal,     setCalModal]     = useState(null); // null | {} for new | cal object for edit
  const [darkMode,     setDarkMode]     = useState(false);
  const [sleepMode,    setSleepMode]    = useState(false);
  const [focusMode,    setFocusMode]    = useState(false);
  const [calBg,        setCalBg]        = useState("transparent");
  const [toasts,       setToasts]       = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [confetti,     setConfetti]     = useState(0);
  const [showMiniCal,  setShowMiniCal]  = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCalPanel, setShowCalPanel] = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showAI,       setShowAI]       = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickDate,    setQuickDate]    = useState(TODAY);

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

  // Load DM Sans font
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
    document.head.appendChild(link);
  }, []);

  const myEvents = useMemo(() => (events || []).filter(e => (e.pids || []).includes(currentUser)), [events, currentUser]);
  const visibleEvents = useMemo(() => myEvents.filter(e => !(e.pids || []).some(p => hidden.has(p))), [myEvents, hidden]);

  function navigate(dir) {
    if (view === "year")       setDate(d => addYears(d, dir));
    else if (view === "month") setDate(d => addMonths(d, dir));
    else if (view === "week")  setDate(d => addDays(d, dir * 7));
    else                        setDate(d => addDays(d, dir));
  }

  const todayUpcoming  = useMemo(() => myEvents.filter(e => e.date === TODAY && !e.allDay && toMin(e.end) > NOW_MIN), [myEvents]);
  const pendingInvites = useMemo(() => (events || []).filter(ev => (ev.pids || []).includes(currentUser) && ev.organizer !== currentUser && (ev.attendees || {})[currentUser] === "pending").length, [events, currentUser]);
  const badge = todayUpcoming.filter(e => !dismissed.has(e.id)).length + pendingInvites;

  function goSection(s) { if (s === "calendar" || SECTIONS.includes(s)) setSection(s); }

  function openNew(ds) { setQuickDate(ds || fmtDate(date)); setShowQuickAdd(true); }
  function openEdit(ev) {
    const base = (events || []).find(e => e.id === (ev.baseId || ev.id) || e.baseId === (ev.baseId || ev.id)) || ev;
    setModal({ ...base, date: ev.date });
  }

  function saveEvent(form) {
    setEvents(es => {
      const existing = es.find(e => e.id === form.id || e.baseId === form.baseId);
      if (existing) return es.map(e => (e.id === form.id || e.baseId === form.baseId) ? form : e);
      return [...es, form];
    });
    setModal(null); setShowQuickAdd(false);
  }

  function deleteEvent(id) { setEvents(es => es.filter(e => e.id !== id && e.baseId !== id)); setModal(null); }

  function acceptInvite(eventId, pid)  { setEvents(es => es.map(e => (e.id === eventId || e.baseId === eventId) ? { ...e, attendees: { ...e.attendees, [pid]: "accepted" } } : e)); }
  function declineInvite(eventId, pid) { setEvents(es => es.map(e => (e.id === eventId || e.baseId === eventId) ? { ...e, attendees: { ...e.attendees, [pid]: "declined" } } : e)); }

  function reschedule(baseId, newDate, ns, ne) {
    setEvents(es => es.map(e => {
      if (e.id !== baseId && e.baseId !== baseId) return e;
      const dur = toMin(e.end) - toMin(e.start);
      const s   = ns || e.start;
      const end = ne || (ns ? minToTime(Math.min(toMin(s) + dur, 23 * 60 + 59)) : e.end);
      return { ...e, date: newDate || e.date, start: s, end };
    }));
  }

  // ── Toast helpers ──
  function addToast(type, title, message, duration) {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, type, title, message, duration }]);
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

  // Special full-screen modes
  if (focusMode) return <FocusMode events={myEvents} accent={accent} onExit={() => setFocusMode(false)} />;
  if (sleepMode) return <SleepMode events={events} onExit={() => setSleepMode(false)} />;

  const isCalendar = section === "calendar";
  const sectionTitles = { meals: "Meal Planner", weather: "Weather", tasks: "Tasks", rewards: "Rewards", settings: "Settings" };
  const calViewProps  = { date, events: visibleEvents, accent, T, reschedule, calBg };

  return (
    <div ref={rootRef} style={{ ...FF, background: T.bg, color: T.t0, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top))", borderBottom: `1px solid ${T.b1}`, background: T.bg1, flexShrink: 0, position: "relative", zIndex: 200 }}>

        <button onClick={() => setShowMiniCal(s => !s)} style={{ width: 32, height: 32, border: `1px solid ${showMiniCal ? rgba(accent, 0.5) : T.b1}`, background: showMiniCal ? rgba(accent, 0.12) : "transparent", borderRadius: 8, cursor: "pointer", color: showMiniCal ? accent : T.t2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Menu size={16} strokeWidth={2} />
        </button>

        {showMiniCal && (
          <MiniCalendarOverlay date={date} setDate={setDate} setView={v => { setView(v); goSection("calendar"); }} events={myEvents} accent={accent} T={T} onClose={() => setShowMiniCal(false)} />
        )}

        {isCalendar && (
          <>
            <div style={{ display: "flex", gap: 1, background: rgba("#000", 0.05), borderRadius: 9, padding: 3 }}>
              {["Day","Week","Month","Year"].map(v => (
                <button key={v} onClick={() => setView(v.toLowerCase())} style={{ background: view === v.toLowerCase() ? rgba(accent, 0.12) : "transparent", border: "none", color: view === v.toLowerCase() ? accent : T.t2, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7, cursor: "pointer", ...FF }}>{v}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button onClick={() => navigate(-1)} style={{ width: 28, height: 28, border: `1px solid ${T.b1}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: T.t2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={15} strokeWidth={2.2} />
              </button>
              <button onClick={() => setDate(new Date())} style={{ fontSize: 11, fontWeight: 600, padding: "4px 8px", border: `1px solid ${T.b1}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: T.t2, ...FF }}>Today</button>
              <button onClick={() => navigate(1)} style={{ width: 28, height: 28, border: `1px solid ${T.b1}`, background: "transparent", borderRadius: 7, cursor: "pointer", color: T.t2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, letterSpacing: "-0.3px", ...FF }}>{getNavLabel(view, date)}</div>
          </>
        )}

        {!isCalendar && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => goSection("calendar")} style={{ display: "flex", alignItems: "center", gap: 5, background: rgba(accent, 0.08), border: `1px solid ${rgba(accent, 0.2)}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: accent, fontSize: 12, fontWeight: 600, ...FF }}><ChevronLeft size={14} /> Calendar</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t0, ...FF }}>{sectionTitles[section] || ""}</div>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => { setShowAI(s => !s); setShowNotifs(false); }} style={{ width: 34, height: 34, border: `1px solid ${showAI ? rgba(accent, 0.5) : T.b1}`, background: showAI ? rgba(accent, 0.12) : "transparent", borderRadius: 9, cursor: "pointer", color: showAI ? accent : T.t2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={17} strokeWidth={1.8} />
          </button>

          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowUserMenu(s => !s); setShowNotifs(false); }} style={{ display: "flex", alignItems: "center", gap: 6, background: showUserMenu ? rgba(accent, 0.12) : rgba(accent, 0.07), border: `1px solid ${rgba(accent, 0.22)}`, borderRadius: 20, padding: "4px 9px 4px 6px", cursor: "pointer" }}>
              <Avatar pid={currentUser} size={18} />
              <span style={{ fontSize: 11, fontWeight: 700, color: accent, ...FF }}>{cu.name}</span>
              <span style={{ fontSize: 9, color: T.t2 }}>▾</span>
            </button>
            {showUserMenu && <UserSwitcher currentUser={currentUser} setCurrentUser={id => { setCurrentUser(id); setShowUserMenu(false); }} T={T} onClose={() => setShowUserMenu(false)} />}
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifs(s => !s); setShowUserMenu(false); }} style={{ width: 34, height: 34, border: `1px solid ${badge > 0 ? rgba(accent, 0.4) : T.b1}`, background: badge > 0 ? rgba(accent, 0.1) : "transparent", borderRadius: 9, cursor: "pointer", color: badge > 0 ? accent : T.t2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {section === "calendar" && view === "month" && <MonthView {...calViewProps} onCell={openNew} onEv={openEdit} />}
        {section === "calendar" && view === "week"  && <WeekView  {...calViewProps} onSlot={openNew} onEv={openEdit} />}
        {section === "calendar" && view === "day"   && <DayView   {...calViewProps} onSlot={openNew} onEv={openEdit} />}
        {section === "calendar" && view === "year"  && <YearView  {...calViewProps} onMonthClick={mi => { setDate(d => new Date(d.getFullYear(), mi, 1)); setView("month"); }} />}

        {section === "meals"    && <MealsPanel T={T} />}
        {section === "weather"  && <WeatherPanel T={T} />}
        {section === "tasks"    && <TasksPanel tasks={tasks} setTasks={setTasks} T={T} accent={accent} onComplete={onTaskComplete} />}
        {section === "rewards"  && <RewardsPanel rewards={rewards} T={T} currentUser={currentUser} accent={accent} activityFeed={activityFeed} onSpend={onSpendPoints} />}
        {section === "settings" && <SettingsPanel darkMode={darkMode} setDarkMode={setDarkMode} sleepMode={sleepMode} setSleepMode={setSleepMode} focusMode={focusMode} setFocusMode={setFocusMode} T={T} calBg={calBg} setCalBg={setCalBg} />}

        {showCalPanel && (
          <CalendarPanel
            calendars={calendars}
            events={events}
            hiddenCals={hiddenCals}
            setHiddenCals={setHiddenCals}
            currentUser={currentUser}
            T={T}
            onClose={() => setShowCalPanel(false)}
            onEditCalendar={cal => setCalModal(cal)}
            onNewCalendar={() => setCalModal({})}
          />
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav section={section} setSection={goSection} showCalPanel={showCalPanel} setShowCalPanel={setShowCalPanel} onNew={() => { goSection("calendar"); openNew(fmtDate(date)); }} accent={accent} T={T} />

      {/* ── Overlays ── */}
      {showQuickAdd && <QuickAdd date={quickDate} currentUser={currentUser} onSave={saveEvent} onClose={() => setShowQuickAdd(false)} T={T} accent={accent} />}
      {showAI && <AIAssistantPanel events={myEvents} date={date} currentUser={currentUser} onClose={() => setShowAI(false)} onAddEvent={ev => { saveEvent(ev); setShowAI(false); }} T={T} accent={accent} />}
      {modal  && <EventModal event={modal} allEvents={events} currentUser={currentUser} calendars={calendars} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)} accent={accent} T={T} />}

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

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global confetti (level-up) */}
      <Confetti trigger={confetti} count={80} />
    </div>
  );
}
