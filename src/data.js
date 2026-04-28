import { PROFILES, FAM_IDS } from "./constants.js";
import { fmtDate, addDays, addMonths, addYears, toMin, uid, getProfile, rgba, NOW, TODAY } from "./utils.js";

// ─── Event color helpers ──────────────────────────────────────────────────────
export function makeEventColors(pids) {
  if (!pids || !pids.length) return { bg: "rgba(99,102,241,0.1)", bar: "#6366F1", txt: "#818CF8" };
  if (pids.length === 1) {
    const p = getProfile(pids[0]);
    return { bg: rgba(p.color, 0.13), bar: p.color, txt: p.color };
  }
  return {
    bg:  `linear-gradient(135deg,${pids.map(id => rgba(getProfile(id).color, 0.13)).join(",")})`,
    bar: getProfile(pids[0]).color,
    txt: getProfile(pids[0]).color,
    multi: true,
  };
}

// ─── Attendee builder ─────────────────────────────────────────────────────────
export function buildAttendees(pids, organizer) {
  const att = {};
  pids.forEach(p => {
    att[p] = (p === organizer || FAM_IDS.includes(p)) ? "accepted" : "pending";
  });
  return att;
}

// ─── Recurring event expansion ────────────────────────────────────────────────
export function expandEvents(evs, rangeStart, rangeEnd) {
  const out = [];
  const s = new Date(rangeStart); s.setHours(0, 0, 0, 0);
  const e = new Date(rangeEnd);   e.setHours(23, 59, 59, 999);
  (evs || []).forEach(ev => {
    try {
      const d = new Date(ev.date);
      if (!ev.recurring || !ev.recurrence?.freq) {
        if (d >= s && d <= e) out.push(ev);
        return;
      }
      const freq     = ev.recurrence.freq;
      const interval = Math.max(1, ev.recurrence.interval || 1);
      const days     = ev.recurrence.days || [];
      const until    = ev.recurrence.until ? new Date(ev.recurrence.until) : addYears(e, 1);
      const cap      = until < e ? until : e;
      const evStart  = new Date(ev.date); evStart.setHours(0, 0, 0, 0);

      if (freq === "weekly" && days.length > 0) {
        // Weekly on specific weekdays (0=Sun…6=Sat), repeating every `interval` weeks
        // Find the Sunday at or before evStart
        let weekBase = new Date(evStart);
        weekBase = addDays(weekBase, -weekBase.getDay());
        let n = 0;
        while (weekBase <= cap && n < 1000) {
          for (const dow of [...days].sort((a, b) => a - b)) {
            const candidate = addDays(weekBase, dow);
            if (candidate < evStart) continue;
            if (candidate > cap) break;
            if (candidate >= s) {
              out.push({ ...ev, date: fmtDate(candidate), id: `${ev.baseId || ev.id}_${fmtDate(candidate)}` });
            }
          }
          weekBase = addDays(weekBase, 7 * interval);
          n++;
        }
      } else {
        let cur = new Date(evStart), n = 0;
        while (cur <= cap && n < 400) {
          if (cur >= s) out.push({ ...ev, date: fmtDate(cur), id: `${ev.baseId || ev.id}_${fmtDate(cur)}` });
          cur = freq === "daily"   ? addDays(cur, interval)
              : freq === "weekly"  ? addDays(cur, 7 * interval)
              : freq === "monthly" ? addMonths(cur, interval)
              : addYears(cur, interval);
          n++;
        }
      }
    } catch { /* skip bad events */ }
  });
  return out;
}

// ─── Conflict detection ───────────────────────────────────────────────────────
export function findConflicts(allEvs, date, start, end, pids, excludeBaseId) {
  if (!start || !end || !date || !pids || !pids.length) return [];
  const ns = toMin(start), ne = toMin(end);
  return expandEvents(allEvs, new Date(date), new Date(date)).filter(ev => {
    if (ev.allDay || ev.date !== date) return false;
    const bid = ev.baseId || ev.id;
    if (bid === excludeBaseId || ev.id === excludeBaseId) return false;
    if (ns >= toMin(ev.end) || ne <= toMin(ev.start)) return false;
    return (ev.pids || []).some(p => pids.includes(p));
  }).map(ev => ({ ev, who: (ev.pids || []).filter(p => pids.includes(p)) }));
}

// ─── Event factory ────────────────────────────────────────────────────────────
function seedEvent(fields) {
  const id = uid(), baseId = uid();
  const ev = {
    id, baseId,
    title: "", date: TODAY, start: "09:00", end: "10:00",
    pids: [], organizer: "jeremy",
    allDay: false, recurring: false,
    recurrence: { freq: "weekly", until: "" },
    reminders: [15], important: false,
    ...fields,
  };
  ev.attendees = buildAttendees(ev.pids, ev.organizer);
  return ev;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
export const INIT_EVENTS = [
  seedEvent({ title: "Team Standup",    date: TODAY,                       start: "09:00", end: "09:30", pids: ["jeremy"],               organizer: "jeremy", recurring: true, recurrence: { freq: "daily",  until: "" } }),
  seedEvent({ title: "Client Review",   date: TODAY,                       start: "14:00", end: "15:00", pids: ["alex","jeremy"],        organizer: "alex" }),
  seedEvent({ title: "Parent-Teacher",  date: fmtDate(addDays(NOW, 2)),    start: "15:00", end: "15:30", pids: ["jeremy","sarah"],       organizer: "jeremy", important: true }),
  seedEvent({ title: "Emma Soccer",     date: fmtDate(addDays(NOW, 4)),    start: "10:00", end: "11:00", pids: ["jeremy","sarah","emma"],organizer: "jeremy", important: true }),
  seedEvent({ title: "Sprint Planning", date: fmtDate(addDays(NOW, 1)),    start: "10:00", end: "11:30", pids: ["morgan"],               organizer: "morgan", recurring: true, recurrence: { freq: "weekly", until: "" } }),
  seedEvent({ title: "Family Dinner",   date: fmtDate(addDays(NOW, 5)),    start: "18:00", end: "20:00", pids: ["jeremy","sarah","emma"],organizer: "jeremy", important: true }),
  seedEvent({ title: "Weekly Review",   date: fmtDate(addDays(NOW, 3)),    start: "11:00", end: "12:00", pids: ["jeremy","casey"],       organizer: "jeremy", recurring: true, recurrence: { freq: "weekly", until: "" } }),
  seedEvent({ title: "Deep Work",       date: fmtDate(addDays(NOW, 1)),    start: "13:00", end: "16:00", pids: ["jeremy"],               organizer: "jeremy" }),
  seedEvent({ title: "Emma Recital",    date: fmtDate(addDays(NOW, 14)),   start: "17:00", end: "19:00", pids: ["emma","jeremy","sarah"],organizer: "sarah",  important: true }),
];

export const INIT_TASKS = [
  { id: uid(), title: "Call insurance",    done: false, pri: "high",   due: TODAY,                        owner: "jeremy" },
  { id: uid(), title: "Buy groceries",     done: false, pri: "medium", due: fmtDate(addDays(NOW, 1)),    owner: "sarah"  },
  { id: uid(), title: "Emma's homework",   done: false, pri: "high",   due: fmtDate(addDays(NOW, 2)),    owner: "emma"   },
  { id: uid(), title: "Oil change",        done: false, pri: "low",    due: fmtDate(addDays(NOW, 7)),    owner: "jeremy" },
  { id: uid(), title: "Pay electric bill", done: true,  pri: "high",   due: TODAY,                        owner: "jeremy" },
];

export const INIT_REWARDS = Object.fromEntries(PROFILES.map(p => [p.id, {
  pts:    p.id === "emma" ? 580 : p.id === "jeremy" ? 340 : p.id === "sarah" ? 210 : p.id === "casey" ? 130 : p.id === "alex" ? 90 : 45,
  done:   p.id === "emma" ? 22  : p.id === "jeremy" ? 12  : 3,
  streak: p.id === "emma" ? 5   : p.id === "jeremy" ? 3   : 1,
  famEvs: ["jeremy","sarah","emma"].includes(p.id) ? 2 : 0,
}]));
