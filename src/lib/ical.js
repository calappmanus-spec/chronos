// ─── iCal (.ics) import & export ─────────────────────────────────────────────
// Full RFC 5545-compliant parser + generator. No external dependencies.

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }

function nowStamp() {
  const n = new Date();
  return `${n.getUTCFullYear()}${pad(n.getUTCMonth()+1)}${pad(n.getUTCDate())}T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`;
}

// iCal line folding: max 75 octets, continuation lines prefixed with a space
function foldLine(key, value) {
  const raw = `${key}:${String(value).replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")}`;
  if (raw.length <= 75) return raw;
  const chars = [...raw];
  const out = [];
  let line = "";
  for (const c of chars) {
    if (line.length >= 74) { out.push(line); line = " " + c; }
    else line += c;
  }
  if (line) out.push(line);
  return out.join("\r\n");
}

function toIcalDT(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split("-");
  const [h, mi]   = (timeStr || "00:00").split(":");
  return `${y}${mo}${d}T${h}${mi}00`;
}

// ── Export ────────────────────────────────────────────────────────────────────
export function exportToIcal(events, calName = "Chronos") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Chronos//Chronos Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
    "X-WR-TIMEZONE:America/New_York",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine("UID", `${ev.id || ev.baseId || Math.random().toString(36)}@chronos.app`));
    lines.push(`DTSTAMP:${nowStamp()}`);
    lines.push(foldLine("SUMMARY", ev.title || "Untitled"));

    if (ev.allDay) {
      const d = ev.date.replace(/-/g, "");
      lines.push(`DTSTART;VALUE=DATE:${d}`);
      // DTEND for all-day is exclusive (next day)
      const next = new Date(ev.date);
      next.setDate(next.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${next.toISOString().slice(0,10).replace(/-/g,"")}`);
    } else {
      lines.push(`DTSTART:${toIcalDT(ev.date, ev.start)}`);
      lines.push(`DTEND:${toIcalDT(ev.date, ev.end || ev.start)}`);
    }

    if (ev.notes)    lines.push(foldLine("DESCRIPTION", ev.notes));
    if (ev.location) lines.push(foldLine("LOCATION",    ev.location));
    if (ev.url)      lines.push(foldLine("URL",         ev.url));
    if (ev.important) lines.push("PRIORITY:1");

    if (ev.recurring && ev.recurrence?.freq) {
      const f = ev.recurrence.freq.toUpperCase();
      let rrule = `FREQ=${f}`;
      if (ev.recurrence.interval > 1) rrule += `;INTERVAL=${ev.recurrence.interval}`;
      if (ev.recurrence.until) rrule += `;UNTIL=${ev.recurrence.until.replace(/-/g, "")}`;
      lines.push(`RRULE:${rrule}`);
    }

    // Alarms / reminders
    for (const mins of (ev.reminders || [])) {
      lines.push("BEGIN:VALARM");
      lines.push("TRIGGER:-PT" + mins + "M");
      lines.push("ACTION:DISPLAY");
      lines.push(foldLine("DESCRIPTION", `Reminder: ${ev.title}`));
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcal(events, filename = "chronos-export.ics") {
  const content = exportToIcal(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Import ────────────────────────────────────────────────────────────────────
function unfold(text) {
  // RFC 5545: CRLF + SPACE/TAB is a continuation of the previous line
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function unescape(str) {
  return str
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function getField(block, key) {
  // Handles params like DTSTART;TZID=... or DTSTART;VALUE=DATE:
  const re = new RegExp(`^${key}(?:;[^:]*)?:(.+)$`, "im");
  const m  = block.match(re);
  return m ? unescape(m[1].trim()) : "";
}

function parseIcalDate(dtstr) {
  if (!dtstr) return { date: "", time: "09:00", allDay: true };
  // Strip TZID param if present in value (should be handled by getField but just in case)
  const clean = dtstr.replace(/^TZID=[^:]+:/, "").trim();
  const allDay = clean.length === 8 || clean.includes("VALUE=DATE");
  const raw    = clean.replace(/VALUE=DATE:/, "");
  const ds     = raw.replace(/T.*$/, "");
  const ts     = raw.includes("T") ? raw.slice(9, 13) : "0000";
  return {
    date:   `${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`,
    time:   `${ts.slice(0,2)}:${ts.slice(2,4)}`,
    allDay: allDay || raw.length <= 8,
  };
}

export function importFromIcal(icsText, defaultUser = "jeremy") {
  const events = [];
  const text   = unfold(icsText || "");
  const blocks = text.split(/BEGIN:VEVENT/i).slice(1);

  for (const block of blocks) {
    const title    = getField(block, "SUMMARY")     || "Imported Event";
    const dtstart  = getField(block, "DTSTART");
    const dtend    = getField(block, "DTEND");
    const desc     = getField(block, "DESCRIPTION");
    const location = getField(block, "LOCATION");
    const uid      = getField(block, "UID");

    if (!dtstart) continue;

    const s = parseIcalDate(dtstart);
    const e = parseIcalDate(dtend || dtstart);

    // Ensure end > start for timed events
    let endTime = e.allDay ? s.time : e.time;
    if (!s.allDay) {
      const [sh, sm] = s.time.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin   = eh * 60 + em;
      if (endMin <= startMin) endTime = `${pad(Math.min(sh + 1, 23))}:${pad(sm)}`;
    }

    const id = (uid || Math.random().toString(36).slice(2)).replace(/[^a-z0-9_-]/gi, "").slice(0, 32);
    events.push({
      id, baseId: id,
      title, date: s.date, start: s.time, end: endTime,
      allDay:  s.allDay,
      notes:   desc    || "",
      location: location || "",
      pids: [defaultUser], organizer: defaultUser,
      recurring: false,
      recurrence: { freq: "weekly", interval: 1, days: [], until: "" },
      reminders: [15],
      important: false, private: false,
      attendees: { [defaultUser]: "accepted" },
    });
  }

  return events;
}
