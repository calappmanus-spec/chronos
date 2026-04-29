import { useState, useMemo } from "react";
import { Trash2, X, Lock, MapPin, FileText, Copy, User, Briefcase, Users, Heart, Plane, BookOpen, Sparkles } from "lucide-react";
import { CAL_COLORS } from "../../constants.js";
import { TODAY, uid, rgba, getProfile, getProfiles, toMin, minToTime } from "../../utils.js";
import { findConflicts } from "../../data.js";
import { FF } from "../../theme.js";
import Toggle from "../atoms/Toggle.jsx";

const CATEGORIES = [
  { id: "personal",  Icon: User,      label: "Personal"  },
  { id: "work",      Icon: Briefcase, label: "Work"       },
  { id: "social",    Icon: Users,     label: "Social"     },
  { id: "health",    Icon: Heart,     label: "Health"     },
  { id: "travel",    Icon: Plane,     label: "Travel"     },
  { id: "education", Icon: BookOpen,  label: "Education"  },
];

function getBestTimeSlots(allEvents, date, pids, durationMins = 60) {
  const busy = (allEvents || [])
    .filter(e => e.date === date && !e.allDay && (e.pids || []).some(p => pids.includes(p)))
    .map(e => ({ s: toMin(e.start), e: toMin(e.end) }));
  const slots = [];
  for (let s = 8 * 60; s <= 20 * 60 - durationMins; s += 30) {
    const e = s + durationMins;
    if (!busy.some(b => b.s < e && b.e > s)) slots.push({ start: minToTime(s), end: minToTime(e) });
    if (slots.length >= 3) break;
  }
  return slots;
}

const WEEKDAYS = ["S","M","T","W","T","F","S"];

const QUICK_DURATIONS = [
  { label: "15m", mins: 15 },
  { label: "30m", mins: 30 },
  { label: "1h",  mins: 60 },
  { label: "1.5h",mins: 90 },
  { label: "2h",  mins: 120 },
  { label: "3h",  mins: 180 },
];

function isURL(s) { return /^https?:\/\//i.test(s.trim()); }
function isMeetingURL(s) { return /zoom|meet\.google|teams\.microsoft|webex/i.test(s); }

export default function EventModal({ event, allEvents, currentUser, calendars = [], onSave, onDelete, onClose, accent, T }) {
  const isNew = !event.id;

  const [form, setForm] = useState({
    title:      event.title      || "",
    date:       event.date       || TODAY,
    start:      event.start      || "09:00",
    end:        event.end        || "10:00",
    allDay:     event.allDay     || false,
    location:   event.location   || "",
    notes:      event.notes      || "",
    category:   event.category   || "personal",
    status:     event.status     || "confirmed",
    color:      event.color      || "",
    pids:       event.pids       || [currentUser],
    organizer:  event.organizer  || currentUser,
    recurring:  event.recurring  || false,
    recurrence: event.recurrence || { freq: "weekly", interval: 1, days: [], until: "" },
    reminders:  event.reminders  || [15],
    important:  event.important  || false,
    private:    event.private    || false,
    calendarId: event.calendarId || calendars.find(c => c.owner === currentUser)?.id || "",
    endDate:    event.endDate    || "",
    attendees:  event.attendees  || {},
  });

  function sf(key, val) { setForm(p => ({ ...p, [key]: val })); }
  function togglePid(pid) { sf("pids", form.pids.includes(pid) ? form.pids.filter(p => p !== pid) : [...form.pids, pid]); }
  function toggleReminder(v) { sf("reminders", form.reminders.includes(v) ? form.reminders.filter(r => r !== v) : [...form.reminders, v]); }
  function toggleDay(i) {
    const days = form.recurrence.days || [];
    const next = days.includes(i) ? days.filter(d => d !== i) : [...days, i];
    sf("recurrence", { ...form.recurrence, days: next });
  }
  function applyDuration(mins) {
    const s = toMin(form.start);
    sf("end", minToTime(Math.min(s + mins, 23 * 60 + 59)));
  }

  const conflicts = useMemo(() => {
    if (form.allDay || !form.start || !form.end) return [];
    return findConflicts(allEvents, form.date, form.start, form.end, form.pids, event.baseId || event.id);
  }, [form.date, form.start, form.end, form.pids, form.allDay]);

  function doSave() {
    if (!form.title.trim() || !form.pids.length) return;
    const id     = event.id     || uid();
    const baseId = event.baseId || id;
    const att    = {};
    form.pids.forEach(p => {
      att[p] = (event.attendees && p in event.attendees)
        ? event.attendees[p]
        : p === form.organizer ? "accepted" : "pending";
    });
    onSave({ ...form, id, baseId, attendees: att });
  }

  function doDuplicate() {
    if (!form.title.trim()) return;
    const newId = uid(), newBaseId = uid();
    const att = {};
    form.pids.forEach(p => { att[p] = p === form.organizer ? "accepted" : "pending"; });
    onSave({ ...form, id: newId, baseId: newBaseId, title: form.title + " (copy)", attendees: att });
  }

  const inp = { width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 11px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };
  function Label({ text }) {
    return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 5, ...FF }}>{text}</div>;
  }
  function Section({ children, style }) {
    return <div style={{ background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, ...style }}>{children}</div>;
  }

  const [showSlots, setShowSlots] = useState(false);
  const bestSlots = useMemo(() => {
    if (!showSlots || form.allDay) return [];
    const dur = Math.max(15, toMin(form.end) - toMin(form.start));
    return getBestTimeSlots(allEvents, form.date, form.pids, dur);
  }, [showSlots, form.date, form.pids, form.allDay, form.start, form.end]);

  const isFamilyEvent = false; // family grouping removed — all users are equal
  const locIsURL      = isURL(form.location);
  const locIsMeeting  = isMeetingURL(form.location);
  const currentDur    = toMin(form.end) - toMin(form.start);
  const myCals        = calendars.filter(c => c.owner === currentUser || (c.shared && c.members.includes(currentUser)));

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700, backdropFilter: "blur(5px)" }}
    >
      <div
        className="animate-pop"
        style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 20, padding: "20px 20px 16px", width: 460, maxWidth: "calc(100vw - 16px)", maxHeight: "92vh", overflowY: "auto", boxShadow: `0 24px 64px ${T.sh}`, ...FF }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>{isNew ? "New Event" : "Edit Event"}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isFamilyEvent && <span style={{ fontSize: 10, background: rgba("#E05555",0.1), color: "#E05555", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Family</span>}
            <button onClick={() => sf("private", !form.private)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: `1px solid ${form.private ? "#6366F1" : T.b1}`, background: form.private ? rgba("#6366F1",0.1) : "transparent", color: form.private ? "#6366F1" : T.t2, cursor: "pointer", ...FF }}>
              <Lock size={10} strokeWidth={2.5} /> {form.private ? "Private" : "Public"}
            </button>
            <button onClick={() => sf("important", !form.important)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: `1px solid ${form.important ? "#F4881A" : T.b1}`, background: form.important ? rgba("#F4881A",0.1) : "transparent", color: form.important ? "#F4881A" : T.t2, cursor: "pointer", ...FF }}>
              {form.important ? "★ Important" : "☆ Mark"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2, display: "flex" }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Title ── */}
        <div style={{ marginBottom: 10 }}>
          <input
            autoFocus
            style={{ ...inp, fontSize: 15, fontWeight: 600, padding: "10px 12px" }}
            value={form.title}
            onChange={e => sf("title", e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSave()}
            placeholder="Event title…"
          />
        </div>

        {/* ── Location ── */}
        <div style={{ marginBottom: 10, position: "relative" }}>
          <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <MapPin size={13} color={T.t3} />
          </div>
          <input
            style={{ ...inp, paddingLeft: 30 }}
            value={form.location}
            onChange={e => sf("location", e.target.value)}
            placeholder="Location or meeting URL…"
          />
          {locIsURL && (
            <a href={form.location} target="_blank" rel="noreferrer"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: locIsMeeting ? "#0096C7" : accent, background: locIsMeeting ? rgba("#0096C7",0.1) : rgba(accent,0.1), padding: "2px 8px", borderRadius: 10, textDecoration: "none", ...FF }}>
              {locIsMeeting ? "Join" : "Open"}
            </a>
          )}
        </div>

        {/* ── Date / Time ── */}
        <Section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <div>
              <Label text="Date" />
              <input style={inp} type="date" value={form.date} onChange={e => sf("date", e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, paddingTop: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.t1, ...FF }}>All Day</span>
              <Toggle on={form.allDay} toggle={() => sf("allDay", !form.allDay)} accent={accent} />
            </div>
          </div>
          {form.allDay && (
            <div style={{ marginBottom: 10 }}>
              <Label text="End Date (optional)" />
              <input style={inp} type="date" value={form.endDate || ""} min={form.date} onChange={e => sf("endDate", e.target.value)} />
            </div>
          )}

          {!form.allDay && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                <div><Label text="Start" /><input style={inp} type="time" value={form.start} onChange={e => sf("start", e.target.value)} /></div>
                <div><Label text="End"   /><input style={inp} type="time" value={form.end}   onChange={e => sf("end",   e.target.value)} /></div>
              </div>
              {/* Quick duration chips */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                {QUICK_DURATIONS.map(d => {
                  const active = currentDur === d.mins;
                  return (
                    <button key={d.mins} onClick={() => applyDuration(d.mins)} style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: `1px solid ${active ? accent : T.b1}`, background: active ? rgba(accent,0.12) : "transparent", color: active ? accent : T.t2, cursor: "pointer", ...FF }}>
                      {d.label}
                    </button>
                  );
                })}
                <button onClick={() => setShowSlots(s => !s)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, border: `1px solid ${showSlots ? "#6366F1" : T.b1}`, background: showSlots ? rgba("#6366F1",0.1) : "transparent", color: showSlots ? "#6366F1" : T.t2, cursor: "pointer", marginLeft: "auto", ...FF }}>
                  <Sparkles size={10} /> Best Time
                </button>
              </div>
              {showSlots && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: rgba("#6366F1",0.06), border: `1px solid ${rgba("#6366F1",0.2)}`, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6, letterSpacing: ".4px", textTransform: "uppercase", ...FF }}>Suggested open slots</div>
                  {bestSlots.length === 0
                    ? <div style={{ fontSize: 11, color: T.t2, ...FF }}>No open slots found on this day.</div>
                    : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {bestSlots.map(sl => (
                          <button key={sl.start} onClick={() => { sf("start", sl.start); sf("end", sl.end); setShowSlots(false); }} style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 8, border: `1px solid ${rgba("#6366F1",0.3)}`, background: rgba("#6366F1",0.08), color: "#6366F1", cursor: "pointer", ...FF }}>
                            {sl.start} – {sl.end}
                          </button>
                        ))}
                      </div>
                  }
                </div>
              )}
            </>
          )}
        </Section>

        {/* ── Conflict warning ── */}
        {conflicts.length > 0 && (
          <div style={{ background: rgba("#F4881A",0.08), border: `1px solid ${rgba("#F4881A",0.3)}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F4881A", marginBottom: 5 }}>Scheduling conflict</div>
            {conflicts.map(({ ev, who }) => (
              <div key={ev.id} style={{ fontSize: 11, color: T.t1, marginBottom: 2 }}>
                <span style={{ color: getProfile(who[0]).color, fontWeight: 600 }}>{who.map(p => getProfile(p).name).join(", ")}</span>
                {" — "}<strong>{ev.title}</strong> {ev.start}–{ev.end}
              </div>
            ))}
          </div>
        )}

        {/* ── Notes ── */}
        <div style={{ marginBottom: 10, position: "relative" }}>
          <div style={{ position: "absolute", left: 11, top: 10, pointerEvents: "none" }}>
            <FileText size={13} color={T.t3} />
          </div>
          <textarea
            style={{ ...inp, paddingLeft: 30, minHeight: 68, resize: "vertical", lineHeight: 1.5 }}
            value={form.notes}
            onChange={e => sf("notes", e.target.value)}
            placeholder="Notes, agenda, description…"
          />
        </div>

        {/* ── Category ── */}
        <Section>
          <Label text="Category" />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => {
              const active = form.category === c.id;
              return (
                <button key={c.id} onClick={() => sf("category", c.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `1px solid ${active ? accent : T.b1}`, background: active ? rgba(accent,0.12) : "transparent", color: active ? accent : T.t2, cursor: "pointer", ...FF }}>
                  <c.Icon size={11} strokeWidth={2} /> {c.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Status ── */}
        <Section style={{ marginBottom: 10 }}>
          <Label text="Status" />
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id:"confirmed", label:"Confirmed", color:"#4AA96C" },{ id:"tentative", label:"Tentative", color:"#F4881A" },{ id:"cancelled", label:"Cancelled", color:"#E05555" }].map(s => {
              const active = form.status === s.id;
              return (
                <button key={s.id} onClick={() => sf("status", s.id)} style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: "6px 0", borderRadius: 8, border: `1.5px solid ${active ? s.color : T.b1}`, background: active ? rgba(s.color,0.1) : "transparent", color: active ? s.color : T.t2, cursor: "pointer", ...FF }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Color ── */}
        <Section>
          <Label text="Event Color" />
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {["", ...CAL_COLORS.slice(0,10)].map(col => (
              <button key={col} onClick={() => sf("color", col)} style={{ width: 24, height: 24, borderRadius: "50%", border: form.color === col ? `3px solid ${T.t0}` : `2px solid ${T.b1}`, background: col || T.bg2, cursor: "pointer", outline: "none", boxShadow: form.color === col ? `0 0 0 1px ${col || T.t0}` : "none" }} />
            ))}
          </div>
        </Section>

        {/* ── Recurring ── */}
        <Section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.recurring ? 12 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>Recurring</span>
            <Toggle on={form.recurring} toggle={() => sf("recurring", !form.recurring)} accent={accent} />
          </div>
          {form.recurring && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Freq + interval */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <Label text="Frequency" />
                  <select style={inp} value={form.recurrence.freq} onChange={e => sf("recurrence", { ...form.recurrence, freq: e.target.value })}>
                    {["daily","weekly","monthly","yearly"].map(f => <option key={f} value={f}>{f[0].toUpperCase()+f.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <Label text="Every" />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number" min="1" max="99"
                      style={{ ...inp, width: 60 }}
                      value={form.recurrence.interval || 1}
                      onChange={e => sf("recurrence", { ...form.recurrence, interval: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <span style={{ fontSize: 11, color: T.t2, ...FF }}>
                      {form.recurrence.freq === "daily" ? "days" : form.recurrence.freq === "weekly" ? "wks" : form.recurrence.freq === "monthly" ? "mos" : "yrs"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekday picker for weekly */}
              {form.recurrence.freq === "weekly" && (
                <div>
                  <Label text="On days" />
                  <div style={{ display: "flex", gap: 5 }}>
                    {WEEKDAYS.map((d, i) => {
                      const on = (form.recurrence.days || []).includes(i);
                      return (
                        <button key={i} onClick={() => toggleDay(i)} style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${on ? accent : T.b1}`, background: on ? rgba(accent,0.15) : "transparent", color: on ? accent : T.t2, fontSize: 11, fontWeight: 700, cursor: "pointer", ...FF }}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* End date */}
              <div>
                <Label text="Ends" />
                <input style={inp} type="date" value={form.recurrence.until || ""} onChange={e => sf("recurrence", { ...form.recurrence, until: e.target.value })} />
              </div>
            </div>
          )}
        </Section>

        {/* ── Reminders ── */}
        <Section>
          <Label text="Reminders" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[{l:"At time",v:0},{l:"5m",v:5},{l:"15m",v:15},{l:"30m",v:30},{l:"1h",v:60},{l:"2h",v:120},{l:"1 day",v:1440}].map(r => (
              <button key={r.v} onClick={() => toggleReminder(r.v)} style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: `1px solid ${form.reminders.includes(r.v) ? accent : T.b1}`, background: form.reminders.includes(r.v) ? rgba(accent,0.12) : "transparent", color: form.reminders.includes(r.v) ? accent : T.t2, cursor: "pointer", ...FF }}>
                {r.l}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Calendar ── */}
        {myCals.length > 0 && (
          <Section>
            <Label text="Calendar" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {myCals.map(cal => {
                const active = form.calendarId === cal.id;
                return (
                  <button key={cal.id} onClick={() => sf("calendarId", cal.id)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${active ? cal.color : T.b1}`, background: active ? rgba(cal.color,0.1) : "transparent", color: active ? cal.color : T.t2, cursor: "pointer", ...FF }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: cal.color }} />{cal.name}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Participants ── */}
        <Section>
          <Label text="Participants" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: form.pids.length > 1 ? 8 : 0 }}>
            {getProfiles().map(p => {
              const on = form.pids.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePid(p.id)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, border: `1px solid ${on ? p.color : T.b1}`, background: on ? rgba(p.color,0.1) : "transparent", color: on ? p.color : T.t2, cursor: "pointer", ...FF }}>
                  {p.name}
                </button>
              );
            })}
          </div>
          {form.pids.length > 1 && (
            <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg,${form.pids.map(id => getProfile(id).color).join(",")})`, opacity: 0.6 }} />
          )}
        </Section>

        {/* ── Actions ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {!isNew && (
            <button onClick={() => onDelete(event.id)} style={{ fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid rgba(224,85,85,0.35)`, background: rgba("#E05555",0.07), color: "#E05555", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, ...FF }}>
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button onClick={doDuplicate} disabled={!form.title.trim()} style={{ fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.b1}`, background: "transparent", color: T.t1, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, ...FF }}>
            <Copy size={13} /> Duplicate
          </button>
          <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>
            Cancel
          </button>
          <button onClick={doSave} disabled={!form.title.trim()} style={{ fontSize: 13, fontWeight: 700, padding: "8px 22px", borderRadius: 9, border: "none", background: form.title.trim() ? accent : "rgba(128,128,128,0.2)", color: "#fff", cursor: "pointer", marginLeft: "auto", ...FF }}>
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
