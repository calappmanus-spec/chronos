import { useState, useMemo } from "react";
import { Trash2, X, CalendarDays } from "lucide-react";
import { PROFILES, FAM_IDS } from "../../constants.js";
import { TODAY, uid, rgba, getProfile } from "../../utils.js";
import { findConflicts, buildAttendees } from "../../data.js";
import { FF } from "../../theme.js";
import Toggle from "../atoms/Toggle.jsx";

export default function EventModal({ event, allEvents, currentUser, calendars = [], onSave, onDelete, onClose, accent, T }) {
  const isNew = !event.id;
  const [form, setForm] = useState({
    title:      event.title      || "",
    date:       event.date       || TODAY,
    start:      event.start      || "09:00",
    end:        event.end        || "10:00",
    pids:       event.pids       || [currentUser],
    organizer:  event.organizer  || currentUser,
    allDay:     event.allDay     || false,
    recurring:  event.recurring  || false,
    recurrence: event.recurrence || { freq: "weekly", until: "" },
    reminders:  event.reminders  || [15],
    important:  event.important  || false,
    attendees:  event.attendees  || {},
  });

  function sf(key, val) { setForm(prev => ({ ...prev, [key]: val })); }
  function togglePid(pid) { sf("pids", form.pids.includes(pid) ? form.pids.filter(p => p !== pid) : [...form.pids, pid]); }
  function toggleReminder(v) { sf("reminders", form.reminders.includes(v) ? form.reminders.filter(r => r !== v) : [...form.reminders, v]); }

  const conflicts = useMemo(() => {
    if (form.allDay || !form.start || !form.end) return [];
    return findConflicts(allEvents, form.date, form.start, form.end, form.pids, event.baseId || event.id);
  }, [form.date, form.start, form.end, form.pids, form.allDay]);

  function doSave() {
    if (!form.title.trim() || !form.pids.length) return;
    const id     = event.id     || uid();
    const baseId = event.baseId || id;
    const att = {};
    form.pids.forEach(p => {
      att[p] = (event.attendees && p in event.attendees) ? event.attendees[p] : (p === form.organizer || FAM_IDS.includes(p)) ? "accepted" : "pending";
    });
    onSave({ ...form, id, baseId, attendees: att });
  }

  const inp = { width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 11px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };
  function FieldLabel({ text }) {
    return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 5, ...FF }}>{text}</div>;
  }
  const isFamilyEvent = form.pids.length > 1 && form.pids.every(p => FAM_IDS.includes(p));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700, backdropFilter: "blur(4px)" }}>
      <div className="animate-pop" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 18, padding: 24, width: 420, maxWidth: "calc(100vw - 20px)", maxHeight: "88vh", overflowY: "auto", boxShadow: `0 20px 60px ${T.sh}`, ...FF }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>{isNew ? "New Event" : "Edit Event"}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isFamilyEvent && <span style={{ fontSize: 10, background: T.purBg, color: T.pur, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>🏠 Family</span>}
            <button onClick={() => sf("important", !form.important)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: `1px solid ${form.important ? "#F4881A" : T.b1}`, background: form.important ? "rgba(244,136,26,0.1)" : "transparent", color: form.important ? "#F4881A" : T.t2, cursor: "pointer", ...FF }}>
              {form.important ? "★ Important" : "☆ Mark"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <FieldLabel text="Title" />
          <input style={{ ...inp, fontSize: 14, fontWeight: 600 }} value={form.title} onChange={e => sf("title", e.target.value)} placeholder="Event title…" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <FieldLabel text="Date" />
          <input style={inp} type="date" value={form.date} onChange={e => sf("date", e.target.value)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg1, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>All Day</span>
          <Toggle on={form.allDay} toggle={() => sf("allDay", !form.allDay)} accent={accent} />
        </div>

        {!form.allDay && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><FieldLabel text="Start" /><input style={inp} type="time" value={form.start} onChange={e => sf("start", e.target.value)} /></div>
            <div><FieldLabel text="End"   /><input style={inp} type="time" value={form.end}   onChange={e => sf("end",   e.target.value)} /></div>
          </div>
        )}

        {conflicts.length > 0 && (
          <div style={{ background: T.ambBg, border: `1px solid ${T.ambBd}`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amb, marginBottom: 5 }}>⚠ Conflict Detected</div>
            {conflicts.map(({ ev, who }) => (
              <div key={ev.id} style={{ fontSize: 11, color: T.t1, marginBottom: 3 }}>
                <span style={{ color: getProfile(who[0]).color, fontWeight: 600 }}>{who.map(p => getProfile(p).name).join(", ")}</span>
                {" has "}<strong style={{ color: T.t0 }}>{ev.title}</strong>{" at "}{ev.start}–{ev.end}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: T.bg1, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.recurring ? 12 : 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>Recurring</span>
            <Toggle on={form.recurring} toggle={() => sf("recurring", !form.recurring)} accent={accent} />
          </div>
          {form.recurring && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <FieldLabel text="Repeat" />
                <select style={inp} value={form.recurrence.freq} onChange={e => sf("recurrence", { ...form.recurrence, freq: e.target.value })}>
                  {["daily","weekly","monthly","yearly"].map(f => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel text="Ends" />
                <input style={inp} type="date" value={form.recurrence.until} onChange={e => sf("recurrence", { ...form.recurrence, until: e.target.value })} />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <FieldLabel text="Reminders" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[{ l:"At time",v:0},{l:"5m",v:5},{l:"15m",v:15},{l:"30m",v:30},{l:"1h",v:60},{l:"1 day",v:1440}].map(r => (
              <button key={r.v} onClick={() => toggleReminder(r.v)} style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: `1px solid ${form.reminders.includes(r.v) ? accent : T.b1}`, background: form.reminders.includes(r.v) ? rgba(accent, 0.12) : "transparent", color: form.reminders.includes(r.v) ? accent : T.t2, cursor: "pointer", ...FF }}>
                {r.l}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar selector */}
        {calendars.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <FieldLabel text="Calendar" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {calendars
                .filter(cal => cal.owner === currentUser || (cal.shared && cal.members.includes(currentUser)))
                .map(cal => {
                  const active = (form.calendarId || calendars[0]?.id) === cal.id;
                  return (
                    <button
                      key={cal.id}
                      onClick={() => sf("calendarId", cal.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${active ? cal.color : T.b1}`, background: active ? `rgba(${parseInt(cal.color.slice(1,3),16)},${parseInt(cal.color.slice(3,5),16)},${parseInt(cal.color.slice(5,7),16)},0.1)` : "transparent", color: active ? cal.color : T.t2, cursor: "pointer", transition: "all 0.15s", ...FF }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cal.color }} />
                      {cal.name}
                    </button>
                  );
                })
              }
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <FieldLabel text="Participants" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {PROFILES.map(p => {
              const on = form.pids.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePid(p.id)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `1px solid ${on ? p.color : T.b1}`, background: on ? rgba(p.color, 0.1) : "transparent", color: on ? p.color : T.t2, cursor: "pointer", ...FF }}>
                  {p.family && "🏠 "}{p.name}
                </button>
              );
            })}
          </div>
          {form.pids.length > 1 && (
            <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg,${form.pids.map(id => getProfile(id).color).join(",")})`, opacity: 0.7 }} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isNew && <button onClick={() => onDelete(event.id)} style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.redBd}`, background: T.redBg, color: T.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, ...FF }}><Trash2 size={13} />Delete</button>}
          <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>Cancel</button>
          <button onClick={doSave} style={{ fontSize: 12, fontWeight: 700, padding: "7px 20px", borderRadius: 8, border: "none", background: accent, color: "#fff", cursor: "pointer", marginLeft: "auto", ...FF }}>
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
