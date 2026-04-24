/**
 * Unit tests for Group Calendar functionality.
 *
 * Requires Node.js 18+. No dependencies needed.
 *
 * Run:
 *   node --test src/calendar-groups.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Inline pure logic mirrored from constants.js / App.jsx ──────────────────

const CAL_COLORS = [
  "#E05555","#9B5DE5","#0096C7","#F4881A","#2A9D8F",
  "#4AA96C","#E8A020","#D44040","#6366F1","#EC4899",
  "#14B8A6","#F59E0B",
];

const INIT_CALENDARS = [
  { id: "cal_personal", name: "Personal", color: "#6366F1", members: ["jeremy"],                          owner: "jeremy", isDefault: true,  shared: false },
  { id: "cal_family",   name: "Family",   color: "#E05555", members: ["jeremy","sarah","emma"],            owner: "jeremy", isDefault: true,  shared: true  },
  { id: "cal_work",     name: "Work",     color: "#0096C7", members: ["jeremy","alex","morgan","casey"],   owner: "jeremy", isDefault: true,  shared: true  },
];

// Calendar visibility: owner always sees it; shared members see shared calendars
function isCalendarVisible(cal, userId) {
  if (cal.owner === userId) return true;
  return cal.shared && cal.members.includes(userId);
}

// saveCalendar reducer
function saveCalendar(calendars, cal) {
  const exists = calendars.find(c => c.id === cal.id);
  if (exists) return calendars.map(c => c.id === cal.id ? cal : c);
  return [...calendars, cal];
}

// deleteCalendar reducer
function deleteCalendar(calendars, id) {
  return calendars.filter(c => c.id !== id);
}

// toggleMember: can't remove the owner, otherwise toggles presence
function toggleMember(members, pid, owner) {
  if (pid === owner) return members; // owner is immutable
  return members.includes(pid)
    ? members.filter(p => p !== pid)
    : [...members, pid];
}

// Filter events by hidden calendars
function filterVisibleEvents(events, hiddenCals) {
  return events.filter(ev => !hiddenCals.has(ev.calendarId));
}

// getWeeklyChallenges (deterministic by ISO week number)
const CHALLENGE_POOL = [
  { id:"wc1", label:"Task Sprint"     },
  { id:"wc2", label:"Family Time"     },
  { id:"wc3", label:"High Priority"   },
  { id:"wc4", label:"Calendar Master" },
  { id:"wc5", label:"Streak Keeper"   },
  { id:"wc6", label:"Perfect Week"    },
  { id:"wc7", label:"Social Butterfly"},
  { id:"wc8", label:"No Slack"        },
];
function getWeeklyChallenges(isoWeek) {
  const a = isoWeek % CHALLENGE_POOL.length;
  const b = (isoWeek + 3) % CHALLENGE_POOL.length;
  const c = (isoWeek + 6) % CHALLENGE_POOL.length;
  return [CHALLENGE_POOL[a], CHALLENGE_POOL[b], CHALLENGE_POOL[c]];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("INIT_CALENDARS", () => {
  it("seeds exactly 3 default calendars", () => {
    assert.equal(INIT_CALENDARS.length, 3);
  });

  it("every calendar has required fields", () => {
    for (const cal of INIT_CALENDARS) {
      assert.ok(cal.id,      `${cal.name} missing id`);
      assert.ok(cal.name,    `${cal.name} missing name`);
      assert.ok(cal.color,   `${cal.name} missing color`);
      assert.ok(cal.owner,   `${cal.name} missing owner`);
      assert.ok(Array.isArray(cal.members), `${cal.name} members must be array`);
      assert.equal(typeof cal.isDefault, "boolean");
      assert.equal(typeof cal.shared,    "boolean");
    }
  });

  it("Personal calendar is private (shared: false)", () => {
    const personal = INIT_CALENDARS.find(c => c.id === "cal_personal");
    assert.equal(personal.shared, false);
  });

  it("Family and Work calendars are shared", () => {
    const family = INIT_CALENDARS.find(c => c.id === "cal_family");
    const work   = INIT_CALENDARS.find(c => c.id === "cal_work");
    assert.equal(family.shared, true);
    assert.equal(work.shared,   true);
  });

  it("all calendar IDs are unique", () => {
    const ids = INIT_CALENDARS.map(c => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("all members arrays include the owner", () => {
    for (const cal of INIT_CALENDARS) {
      assert.ok(cal.members.includes(cal.owner), `${cal.name}: owner must be in members`);
    }
  });
});

describe("CAL_COLORS", () => {
  it("has exactly 12 color swatches", () => {
    assert.equal(CAL_COLORS.length, 12);
  });

  it("every entry is a valid 7-character hex string", () => {
    for (const c of CAL_COLORS) {
      assert.match(c, /^#[0-9A-Fa-f]{6}$/, `Invalid hex: ${c}`);
    }
  });

  it("all colors are distinct", () => {
    assert.equal(new Set(CAL_COLORS).size, CAL_COLORS.length);
  });
});

describe("isCalendarVisible", () => {
  const personal = INIT_CALENDARS[0]; // shared:false, owner:jeremy
  const family   = INIT_CALENDARS[1]; // shared:true, members:[jeremy,sarah,emma]
  const work     = INIT_CALENDARS[2]; // shared:true, members:[jeremy,alex,morgan,casey]

  it("owner always sees their own private calendar", () => {
    assert.equal(isCalendarVisible(personal, "jeremy"), true);
  });

  it("non-member cannot see a private calendar", () => {
    assert.equal(isCalendarVisible(personal, "sarah"), false);
  });

  it("member of a shared calendar can see it", () => {
    assert.equal(isCalendarVisible(family, "sarah"), true);
    assert.equal(isCalendarVisible(family, "emma"),  true);
  });

  it("non-member cannot see a shared calendar", () => {
    assert.equal(isCalendarVisible(family, "alex"),  false);
    assert.equal(isCalendarVisible(family, "casey"), false);
  });

  it("owner sees their shared calendar even if somehow not in members", () => {
    const orphan = { id: "x", shared: true, members: [], owner: "jeremy" };
    assert.equal(isCalendarVisible(orphan, "jeremy"), true);
  });
});

describe("saveCalendar reducer", () => {
  const base = [...INIT_CALENDARS];

  it("appends a new calendar that doesn't exist yet", () => {
    const newCal = { id: "cal_new", name: "Soccer", color: "#F4881A", members: ["jeremy"], owner: "jeremy", isDefault: false, shared: false };
    const result = saveCalendar(base, newCal);
    assert.equal(result.length, base.length + 1);
    assert.ok(result.find(c => c.id === "cal_new"));
  });

  it("updates an existing calendar in-place", () => {
    const updated = { ...INIT_CALENDARS[0], name: "Personal (renamed)" };
    const result  = saveCalendar(base, updated);
    assert.equal(result.length, base.length);
    assert.equal(result.find(c => c.id === "cal_personal").name, "Personal (renamed)");
  });

  it("does not mutate the original array", () => {
    const copy = [...base];
    saveCalendar(base, { id: "cal_x", name: "X", color: "#fff", members: [], owner: "jeremy", isDefault: false, shared: false });
    assert.equal(base.length, copy.length);
  });

  it("updating preserves all other calendars", () => {
    const updated = { ...INIT_CALENDARS[1], color: "#FFD700" };
    const result  = saveCalendar(base, updated);
    const ids     = result.map(c => c.id).sort();
    const baseIds = base.map(c => c.id).sort();
    assert.deepEqual(ids, baseIds);
  });
});

describe("deleteCalendar reducer", () => {
  const base = [...INIT_CALENDARS];

  it("removes the targeted calendar by id", () => {
    const result = deleteCalendar(base, "cal_family");
    assert.equal(result.length, base.length - 1);
    assert.equal(result.find(c => c.id === "cal_family"), undefined);
  });

  it("leaves all other calendars intact", () => {
    const result = deleteCalendar(base, "cal_work");
    assert.ok(result.find(c => c.id === "cal_personal"));
    assert.ok(result.find(c => c.id === "cal_family"));
  });

  it("is a no-op when id does not exist", () => {
    const result = deleteCalendar(base, "cal_nonexistent");
    assert.equal(result.length, base.length);
  });

  it("does not mutate the original array", () => {
    const original = base.length;
    deleteCalendar(base, "cal_personal");
    assert.equal(base.length, original);
  });
});

describe("toggleMember", () => {
  const owner = "jeremy";
  const base  = ["jeremy", "sarah", "emma"];

  it("adds a member who is not in the list", () => {
    const result = toggleMember(base, "alex", owner);
    assert.ok(result.includes("alex"));
    assert.equal(result.length, base.length + 1);
  });

  it("removes a member who is already in the list", () => {
    const result = toggleMember(base, "sarah", owner);
    assert.equal(result.includes("sarah"), false);
    assert.equal(result.length, base.length - 1);
  });

  it("never removes the owner, even if explicitly toggled", () => {
    const result = toggleMember(base, owner, owner);
    assert.ok(result.includes(owner));
    assert.equal(result.length, base.length);
  });

  it("does not mutate the original members array", () => {
    const copy = [...base];
    toggleMember(base, "alex", owner);
    assert.deepEqual(base, copy);
  });
});

describe("filterVisibleEvents", () => {
  const events = [
    { id: "e1", title: "Standup",   calendarId: "cal_work"     },
    { id: "e2", title: "Dinner",    calendarId: "cal_family"   },
    { id: "e3", title: "Gym",       calendarId: "cal_personal" },
    { id: "e4", title: "No cal",    calendarId: undefined      },
  ];

  it("shows all events when nothing is hidden", () => {
    const result = filterVisibleEvents(events, new Set());
    assert.equal(result.length, events.length);
  });

  it("hides events belonging to a hidden calendar", () => {
    const result = filterVisibleEvents(events, new Set(["cal_work"]));
    assert.equal(result.find(e => e.id === "e1"), undefined);
    assert.equal(result.length, events.length - 1);
  });

  it("hides events from multiple hidden calendars", () => {
    const result = filterVisibleEvents(events, new Set(["cal_work", "cal_family"]));
    assert.equal(result.filter(e => e.calendarId === "cal_work" || e.calendarId === "cal_family").length, 0);
    assert.equal(result.length, 2); // gym + no-cal
  });

  it("keeps events with no calendarId regardless of hidden set", () => {
    const result = filterVisibleEvents(events, new Set(["cal_personal", "cal_work", "cal_family"]));
    assert.ok(result.find(e => e.id === "e4"));
  });
});

describe("getWeeklyChallenges", () => {
  it("always returns exactly 3 challenges", () => {
    for (const week of [1, 10, 17, 24, 52]) {
      assert.equal(getWeeklyChallenges(week).length, 3);
    }
  });

  it("is deterministic — same week always gives same result", () => {
    const a = getWeeklyChallenges(17);
    const b = getWeeklyChallenges(17);
    assert.deepEqual(a.map(c => c.id), b.map(c => c.id));
  });

  it("different weeks usually yield different challenge sets", () => {
    const w1 = getWeeklyChallenges(1).map(c => c.id).join(",");
    const w2 = getWeeklyChallenges(4).map(c => c.id).join(",");
    // week 1 and week 4 differ by 3 steps — guaranteed different set
    assert.notEqual(w1, w2);
  });

  it("all returned challenges exist in the pool", () => {
    const poolIds = new Set(CHALLENGE_POOL.map(c => c.id));
    for (const ch of getWeeklyChallenges(22)) {
      assert.ok(poolIds.has(ch.id), `Unknown challenge id: ${ch.id}`);
    }
  });

  it("no duplicate challenges within the same week", () => {
    for (const week of [0, 3, 7, 14, 51]) {
      const ids = getWeeklyChallenges(week).map(c => c.id);
      assert.equal(new Set(ids).size, ids.length, `Duplicate in week ${week}`);
    }
  });
});
