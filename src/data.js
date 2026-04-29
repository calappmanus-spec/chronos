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
    att[p] = p === organizer ? "accepted" : "pending";
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
export const INIT_EVENTS  = [];
export const INIT_TASKS   = [];
export const INIT_REWARDS = {};
