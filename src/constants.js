export const PROFILES = [
  { id: "jeremy", name: "Jeremy", color: "#E05555", family: true  },
  { id: "sarah",  name: "Sarah",  color: "#9B5DE5", family: true  },
  { id: "emma",   name: "Emma",   color: "#0096C7", family: true  },
  { id: "alex",   name: "Alex",   color: "#F4881A", family: false },
  { id: "morgan", name: "Morgan", color: "#2A9D8F", family: false },
  { id: "casey",  name: "Casey",  color: "#4AA96C", family: false },
];
export const FAM_IDS = PROFILES.filter(p => p.family).map(p => p.id);

export const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MONTHS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS_S   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const DAYS_1   = ["S","M","T","W","T","F","S"];
export const DAYS_L   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const HOURS    = Array.from({ length: 24 }, (_, i) => i);

export const HH     = 54;  // px per hour in time views
export const NAV_H  = 64;  // bottom nav height

export const SECTIONS = ["calendar","meals","weather","tasks","rewards","settings"];

export const LEVELS = [
  { min: 0,    name: "Starter",  color: "#9898B8" },
  { min: 100,  name: "Bronze",   color: "#CD7F32" },
  { min: 300,  name: "Silver",   color: "#A8A9AD" },
  { min: 600,  name: "Gold",     color: "#FFD700" },
  { min: 1000, name: "Platinum", color: "#7BD1F7" },
  { min: 1500, name: "Diamond",  color: "#9B5DE5" },
];

export const BADGES = [
  { id: "b1", icon: "🎯", label: "First Task",   desc: "Complete 1 task",     check: s => s.done >= 1   },
  { id: "b2", icon: "⭐", label: "5 Tasks",      desc: "Complete 5 tasks",    check: s => s.done >= 5   },
  { id: "b3", icon: "🌟", label: "10 Tasks",     desc: "Complete 10 tasks",   check: s => s.done >= 10  },
  { id: "b4", icon: "🔥", label: "3-Day Streak", desc: "3 day task streak",   check: s => s.streak >= 3 },
  { id: "b5", icon: "🏠", label: "Family First", desc: "Attend family event", check: s => s.famEvs >= 1 },
];

export const PRI_PTS = { high: 30, medium: 20, low: 10 };

// ─── Extended badges (15 across 3 categories) ─────────────────────────────
export const BADGES_ALL = [
  // Tasks
  { id:"t1", icon:"🎯", label:"First Task",     desc:"Complete your first task",     cat:"Tasks",   check: s => s.done >= 1   },
  { id:"t2", icon:"⭐", label:"5 Tasks",         desc:"Complete 5 tasks",             cat:"Tasks",   check: s => s.done >= 5   },
  { id:"t3", icon:"🌟", label:"10 Tasks",        desc:"Complete 10 tasks",            cat:"Tasks",   check: s => s.done >= 10  },
  { id:"t4", icon:"💎", label:"25 Tasks",        desc:"Complete 25 tasks",            cat:"Tasks",   check: s => s.done >= 25  },
  { id:"t5", icon:"👑", label:"50 Tasks",        desc:"Complete 50 tasks — Legend!",  cat:"Tasks",   check: s => s.done >= 50  },
  // Streaks
  { id:"s1", icon:"🔥", label:"3-Day Streak",   desc:"3 consecutive days of tasks",  cat:"Streaks", check: s => s.streak >= 3  },
  { id:"s2", icon:"🔥🔥",label:"7-Day Streak",  desc:"One full week of tasks",       cat:"Streaks", check: s => s.streak >= 7  },
  { id:"s3", icon:"💥", label:"14-Day Streak",  desc:"Two weeks straight!",          cat:"Streaks", check: s => s.streak >= 14 },
  { id:"s4", icon:"🚀", label:"30-Day Streak",  desc:"An entire month — incredible",  cat:"Streaks", check: s => s.streak >= 30 },
  // Social
  { id:"f1", icon:"🏠", label:"Family First",   desc:"Attend a family event",         cat:"Social",  check: s => s.famEvs >= 1  },
  { id:"f2", icon:"❤️", label:"Family Hero",    desc:"Attend 5 family events",        cat:"Social",  check: s => s.famEvs >= 5  },
  { id:"f3", icon:"🤝", label:"Team Player",    desc:"Attend 3 team events",          cat:"Social",  check: s => s.done >= 3    },
  { id:"f4", icon:"📅", label:"Organizer",      desc:"Reach 100 points",             cat:"Social",  check: s => s.pts >= 100   },
  { id:"f5", icon:"🎖️", label:"All-Star",       desc:"Reach Gold level (600 pts)",   cat:"Social",  check: s => s.pts >= 600   },
  { id:"f6", icon:"🏆", label:"Legend",         desc:"Reach Diamond level (1500 pts)",cat:"Social",  check: s => s.pts >= 1500  },
];

// ─── Shop items (spend points on cosmetics) ───────────────────────────────
export const SHOP_ITEMS = [
  { id:"sh1", icon:"🎨", label:"Neon Theme",      desc:"Unlock neon calendar skin",         cost: 200  },
  { id:"sh2", icon:"🌌", label:"Galaxy Theme",     desc:"Unlock galaxy calendar skin",        cost: 350  },
  { id:"sh3", icon:"⭐", label:"Gold Avatar Ring", desc:"Gold ring on your avatar",           cost: 150  },
  { id:"sh4", icon:"🚀", label:"Priority Badge",   desc:"Show a 🚀 next to your name",        cost: 300  },
  { id:"sh5", icon:"🎵", label:"Sound Effects",    desc:"Task complete chime",                cost: 100  },
  { id:"sh6", icon:"✨", label:"Confetti Always",  desc:"Confetti on every task complete",    cost: 500  },
];

// ─── Default calendar groups ─────────────────────────────────────────────
export const CAL_COLORS = [
  "#E05555","#9B5DE5","#0096C7","#F4881A","#2A9D8F",
  "#4AA96C","#E8A020","#D44040","#6366F1","#EC4899",
  "#14B8A6","#F59E0B",
];

function calUid() { return Math.random().toString(36).slice(2,8); }
export const INIT_CALENDARS = [
  { id: "cal_personal", name: "Personal",  color: "#6366F1", members: ["jeremy"],                         owner: "jeremy", isDefault: true,  shared: false },
  { id: "cal_family",   name: "Family",    color: "#E05555", members: ["jeremy","sarah","emma"],           owner: "jeremy", isDefault: true,  shared: true  },
  { id: "cal_work",     name: "Work",      color: "#0096C7", members: ["jeremy","alex","morgan","casey"], owner: "jeremy", isDefault: true,  shared: true  },
];

// ─── Calendar background presets ─────────────────────────────────────────
export const CAL_BACKGROUNDS = [
  { id:"default",   label:"Default",       value:"transparent" },
  { id:"cosmos",    label:"Cosmos",        value:"radial-gradient(ellipse at top, #1a1a3e 0%, #0d0e18 70%)" },
  { id:"aurora",    label:"Aurora",        value:"linear-gradient(135deg, #0d1b2a 0%, #1b2838 40%, #0f3d2e 100%)" },
  { id:"sunset",    label:"Sunset",        value:"linear-gradient(160deg, #2d1b3d 0%, #1a0a2e 40%, #3d1a1a 100%)" },
  { id:"ocean",     label:"Ocean",         value:"linear-gradient(180deg, #0a1628 0%, #0d2340 50%, #0a1628 100%)" },
  { id:"forest",    label:"Forest",        value:"linear-gradient(135deg, #0d1f0f 0%, #132b15 60%, #0d1f0f 100%)" },
  { id:"rose",      label:"Rose Quartz",   value:"linear-gradient(135deg, #2a1520 0%, #3d1f2e 60%, #1a0d18 100%)" },
  { id:"arctic",    label:"Arctic",        value:"linear-gradient(180deg, #0e1f2e 0%, #152436 50%, #0a1520 100%)" },
  { id:"ember",     label:"Ember",         value:"linear-gradient(160deg, #1f0d00 0%, #2e1500 50%, #1a0800 100%)" },
  { id:"lavender",  label:"Lavender",      value:"linear-gradient(135deg, #1a1030 0%, #251545 60%, #150e28 100%)" },
  { id:"light",     label:"Snow",          value:"linear-gradient(160deg, #f0f2f8 0%, #e8ecf5 100%)" },
  { id:"mint",      label:"Mint",          value:"linear-gradient(160deg, #e8f5f0 0%, #d4ede6 100%)" },
];

// ─── Weekly challenges (seeded from ISO week number) ─────────────────────
export function getWeeklyChallenges(isoWeek) {
  const pool = [
    { id:"wc1", icon:"✅", label:"Task Sprint",     desc:"Complete 5 tasks this week",          pts: 75,  goal: 5,  type:"tasks"  },
    { id:"wc2", icon:"🏠", label:"Family Time",     desc:"Attend 2 family events this week",    pts: 80,  goal: 2,  type:"famEvs" },
    { id:"wc3", icon:"⚡", label:"High Priority",   desc:"Complete 3 high-priority tasks",     pts: 90,  goal: 3,  type:"highPri"},
    { id:"wc4", icon:"📅", label:"Calendar Master", desc:"Create 3 new events this week",       pts: 60,  goal: 3,  type:"events" },
    { id:"wc5", icon:"🔥", label:"Streak Keeper",   desc:"Keep your streak alive all week",     pts: 100, goal: 7,  type:"streak" },
    { id:"wc6", icon:"🌟", label:"Perfect Week",    desc:"Complete a task every day this week", pts: 150, goal: 7,  type:"daily"  },
    { id:"wc7", icon:"🤝", label:"Social Butterfly",desc:"Invite someone to 2 events",          pts: 70,  goal: 2,  type:"invites"},
    { id:"wc8", icon:"💪", label:"No Slack",        desc:"Clear all pending tasks by Friday",   pts: 120, goal: 1,  type:"clear"  },
  ];
  // Pick 3 deterministically from the pool based on the week number
  const a = isoWeek % pool.length;
  const b = (isoWeek + 3) % pool.length;
  const c = (isoWeek + 6) % pool.length;
  return [pool[a], pool[b], pool[c]];
}
