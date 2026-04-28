import { useState, useMemo } from "react";
import { Plus, X, Target, Dumbbell, UtensilsCrossed, Briefcase, User, DollarSign, CheckCircle, Edit2, Trash2, Calendar, Flame, Mountain, Sparkles, ChevronRight } from "lucide-react";
import { TODAY, uid, rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import { suggestGoalSupport } from "../../ai.js";

// ─── Time horizons ─────────────────────────────────────────────────────────────
const HORIZONS = [
  { id: "daily",   label: "Daily",   short: "Day",    color: "#4AA96C", Icon: Flame,    desc: "Today's intentions" },
  { id: "weekly",  label: "Weekly",  short: "Week",   color: "#6366F1", Icon: Calendar, desc: "This week's focus"   },
  { id: "monthly", label: "Monthly", short: "Month",  color: "#F4881A", Icon: Target,   desc: "Month-long goals"    },
  { id: "yearly",  label: "Yearly",  short: "Year",   color: "#9B5DE5", Icon: Mountain, desc: "This year's aims"    },
  { id: "5year",   label: "5-Year",  short: "5 Yrs",  color: "#0096C7", Icon: Mountain, desc: "5-year vision"       },
  { id: "10year",  label: "10-Year", short: "10 Yrs", color: "#E05555", Icon: Mountain, desc: "Decade-long dreams"  },
];

// ─── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "fitness",   label: "Fitness",   Icon: Dumbbell,        color: "#6366F1" },
  { id: "nutrition", label: "Nutrition", Icon: UtensilsCrossed, color: "#4AA96C" },
  { id: "work",      label: "Work",      Icon: Briefcase,       color: "#F4881A" },
  { id: "personal",  label: "Personal",  Icon: User,            color: "#9B5DE5" },
  { id: "financial", label: "Financial", Icon: DollarSign,      color: "#E8A020" },
];

const HOR_MAP = Object.fromEntries(HORIZONS.map(h => [h.id, h]));
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const BLANK = { title: "", horizon: "monthly", category: "personal", target: 100, current: 0, unit: "", deadline: "", notes: "" };

// ─── AI Plan Modal ──────────────────────────────────────────────────────────────
function GoalPlanModal({ T, accent, goal, onApply, onClose }) {
  const [loading,  setLoading]  = useState(false);
  const [plan,     setPlan]     = useState(null);
  const [error,    setError]    = useState("");
  const [checked,  setChecked]  = useState({ events: new Set(), tasks: new Set(), meals: new Set(), workouts: new Set() });

  const hor = HOR_MAP[goal.horizon] || HORIZONS[2];
  const cat = CAT_MAP[goal.category] || CATEGORIES[0];

  async function generate() {
    setLoading(true); setError("");
    try {
      const result = await suggestGoalSupport(goal, TODAY);
      setPlan(result);
      // Pre-check everything
      setChecked({
        events:   new Set(result.events.map((_, i) => i)),
        tasks:    new Set(result.tasks.map((_, i) => i)),
        meals:    new Set(Object.keys(result.meals)),
        workouts: new Set(Object.keys(result.workouts)),
      });
    } catch (e) {
      setError(e.message || "Failed — check your AI key in Settings.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(bucket, key) {
    setChecked(c => {
      const s = new Set(c[bucket]);
      s.has(key) ? s.delete(key) : s.add(key);
      return { ...c, [bucket]: s };
    });
  }

  function apply() {
    if (!plan) return;
    onApply({
      events:   plan.events.filter((_, i) => checked.events.has(i)),
      tasks:    plan.tasks.filter((_, i) => checked.tasks.has(i)),
      meals:    Object.fromEntries(Object.entries(plan.meals).filter(([k]) => checked.meals.has(k))),
      workouts: Object.fromEntries(Object.entries(plan.workouts).filter(([k]) => checked.workouts.has(k))),
    });
    onClose();
  }

  const Row = ({ children, checked: on, onToggle }) => (
    <button onClick={onToggle} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${on ? hor.color : T.b1}`, background: on ? rgba(hor.color, 0.06) : "transparent", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 6, ...FF }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${on ? hor.color : T.b2}`, background: on ? hor.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        {on && <CheckCircle size={11} color="#fff" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </button>
  );

  const SectionHead = ({ label, icon, count }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, marginTop: 14 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".6px", textTransform: "uppercase", color: hor.color }}>{icon} {label}</span>
      <span style={{ fontSize: 10, color: T.t3 }}>({count})</span>
    </div>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 850, backdropFilter: "blur(6px)", padding: "16px" }}>
      <div className="animate-pop" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 22, padding: "22px 20px 18px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", ...FF }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${hor.color}, ${cat.color})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>AI Goal Support</div>
              <div style={{ fontSize: 11, color: T.t2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2 }}><X size={17} /></button>
        </div>

        {/* Not yet generated */}
        {!plan && !loading && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.65, marginBottom: 20 }}>
              AI will analyze your goal and create a tailored plan with calendar events, tasks, meals, and workouts to support your progress.
            </div>
            {error && <div style={{ fontSize: 12, color: "#E05555", background: rgba("#E05555", 0.08), borderRadius: 9, padding: "8px 12px", marginBottom: 16 }}>{error}</div>}
            <button onClick={generate} style={{ padding: "12px 28px", borderRadius: 13, border: "none", background: `linear-gradient(135deg, ${hor.color}, ${cat.color})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, ...FF }}>
              <Sparkles size={15} /> Generate Plan
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${rgba(hor.color, 0.2)}`, borderTopColor: hor.color, animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: T.t2 }}>Building your plan…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Plan results */}
        {plan && !loading && (
          <div>
            <div style={{ fontSize: 12, color: T.t2, marginBottom: 2 }}>Select what to add to your calendar, tasks, and fitness tracker:</div>

            {plan.events.length > 0 && (
              <>
                <SectionHead label="Calendar Events" icon="📅" count={plan.events.length} />
                {plan.events.map((ev, i) => (
                  <Row key={i} checked={checked.events.has(i)} onToggle={() => toggle("events", i)}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: T.t2 }}>{ev.date}{ev.start ? ` · ${ev.start}–${ev.end}` : " · All day"}</div>
                    {ev.notes && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{ev.notes}</div>}
                  </Row>
                ))}
              </>
            )}

            {plan.tasks.length > 0 && (
              <>
                <SectionHead label="Tasks" icon="✅" count={plan.tasks.length} />
                {plan.tasks.map((tk, i) => (
                  <Row key={i} checked={checked.tasks.has(i)} onToggle={() => toggle("tasks", i)}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{tk.title}</div>
                    <div style={{ fontSize: 11, color: T.t2 }}>
                      <span style={{ color: tk.priority === "high" ? "#E05555" : tk.priority === "medium" ? "#F4881A" : T.t3, fontWeight: 600, textTransform: "capitalize" }}>{tk.priority}</span>
                      {tk.due && ` · Due ${tk.due}`}
                    </div>
                  </Row>
                ))}
              </>
            )}

            {Object.keys(plan.meals).length > 0 && (
              <>
                <SectionHead label="Optimized Meals" icon="🥗" count={Object.keys(plan.meals).length} />
                {Object.entries(plan.meals).map(([k, v]) => {
                  const [name, note] = v.split("|||");
                  return (
                    <Row key={k} checked={checked.meals.has(k)} onToggle={() => toggle("meals", k)}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{name}</div>
                      <div style={{ fontSize: 11, color: T.t2 }}>{k.replace("|", " · ")}</div>
                      {note && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{note}</div>}
                    </Row>
                  );
                })}
              </>
            )}

            {Object.keys(plan.workouts).length > 0 && (
              <>
                <SectionHead label="Workouts" icon="💪" count={Object.keys(plan.workouts).length} />
                {Object.entries(plan.workouts).map(([k, v]) => {
                  const [name] = v.split("|||");
                  return (
                    <Row key={k} checked={checked.workouts.has(k)} onToggle={() => toggle("workouts", k)}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{name}</div>
                      <div style={{ fontSize: 11, color: T.t2 }}>{k.replace("|", " · ")}</div>
                    </Row>
                  );
                })}
              </>
            )}

            {/* Total selected */}
            {(() => {
              const total = checked.events.size + checked.tasks.size + checked.meals.size + checked.workouts.size;
              return (
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>Cancel</button>
                  <button onClick={apply} disabled={total === 0} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: total > 0 ? `linear-gradient(135deg, ${hor.color}, ${cat.color})` : rgba("#888", 0.2), color: "#fff", fontSize: 13, fontWeight: 700, cursor: total > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...FF }}>
                    <ChevronRight size={15} /> Add {total} item{total !== 1 ? "s" : ""} to Chronos
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Goal modal ────────────────────────────────────────────────────────────────
function GoalModal({ T, accent, goal, defaultHorizon, onSave, onClose }) {
  const [form, setForm] = useState(goal || { ...BLANK, horizon: defaultHorizon || "monthly" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cat = CAT_MAP[form.category];
  const hor = HOR_MAP[form.horizon];
  const inp = { background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 11px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", width: "100%", ...FF };
  const Label = ({ text }) => <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 5 }}>{text}</div>;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 800, backdropFilter: "blur(5px)" }}>
      <div className="animate-pop" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 20, padding: "20px 20px 16px", width: 440, maxWidth: "calc(100vw - 24px)", maxHeight: "92vh", overflowY: "auto", ...FF }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>{goal ? "Edit Goal" : "New Goal"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2, display: "flex" }}><X size={17} /></button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <Label text="Goal title" />
          <input style={{ ...inp, fontSize: 15, fontWeight: 600, padding: "10px 12px" }} value={form.title} onChange={e => f("title", e.target.value)} placeholder="What do you want to achieve?" autoFocus />
        </div>

        {/* Horizon */}
        <div style={{ marginBottom: 14 }}>
          <Label text="Time horizon" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {HORIZONS.map(h => {
              const on = form.horizon === h.id;
              return (
                <button key={h.id} onClick={() => f("horizon", h.id)} style={{ padding: "8px 6px", borderRadius: 10, border: `1.5px solid ${on ? h.color : T.b1}`, background: on ? rgba(h.color, 0.1) : "transparent", color: on ? h.color : T.t2, fontSize: 12, fontWeight: on ? 700 : 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, ...FF }}>
                  <h.Icon size={11} /> {h.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <Label text="Category" />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => {
              const on = form.category === c.id;
              return (
                <button key={c.id} onClick={() => f("category", c.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${on ? c.color : T.b1}`, background: on ? rgba(c.color, 0.1) : "transparent", color: on ? c.color : T.t2, cursor: "pointer", ...FF }}>
                  <c.Icon size={11} /> {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target + Unit + Current */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div><Label text="Target" /><input style={inp} type="number" min="1" value={form.target} onChange={e => f("target", Number(e.target.value) || 1)} /></div>
          <div><Label text="Unit"   /><input style={inp} value={form.unit}   onChange={e => f("unit", e.target.value)} placeholder="km, lbs, days…" /></div>
          <div><Label text="Current"/><input style={inp} type="number" min="0" value={form.current} onChange={e => f("current", Number(e.target.value) || 0)} /></div>
        </div>

        {/* Deadline */}
        <div style={{ marginBottom: 14 }}>
          <Label text="Deadline (optional)" />
          <input style={inp} type="date" value={form.deadline} min={TODAY} onChange={e => f("deadline", e.target.value)} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <Label text="Notes (optional)" />
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical", lineHeight: 1.5 }} value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Why this goal matters to you…" />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>Cancel</button>
          <button
            onClick={() => form.title.trim() && onSave({ ...form, id: goal?.id || uid(), createdAt: goal?.createdAt || TODAY })}
            disabled={!form.title.trim()}
            style={{ flex: 2, padding: "9px 0", borderRadius: 9, border: "none", background: form.title.trim() ? (hor?.color || accent) : rgba("#888",0.2), color: "#fff", fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "not-allowed", ...FF }}
          >
            {goal ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: rgba(color, 0.14), overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, borderRadius: 3, background: color, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────
export default function GoalsPanel({ goals = [], setGoals, T, accent, calBg = "transparent", isBgDark = true, onAddEvents, onAddTasks, setMealData, setWorkoutData }) {
  const hasBg = calBg !== "transparent";
  const onBg0 = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0;
  const onBg2 = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;

  const [activeHorizon, setActiveHorizon] = useState("all");
  const [modal,         setModal]         = useState(false);
  const [editGoal,      setEditGoal]      = useState(null);
  const [updating,      setUpdating]      = useState(null);
  const [deltaVal,      setDeltaVal]      = useState("");
  const [planGoal,      setPlanGoal]      = useState(null);

  // Counts per horizon for badges
  const horizonCounts = useMemo(() => {
    const m = {};
    goals.filter(g => !g.done).forEach(g => { m[g.horizon] = (m[g.horizon] || 0) + 1; });
    return m;
  }, [goals]);

  // Filtered goals
  const filtered = useMemo(() => {
    const list = activeHorizon === "all"
      ? goals
      : activeHorizon === "done"
        ? goals.filter(g => g.done)
        : goals.filter(g => g.horizon === activeHorizon && !g.done);
    return list;
  }, [goals, activeHorizon]);

  // Group by horizon when "all" is selected
  const grouped = useMemo(() => {
    if (activeHorizon !== "all") return null;
    const groups = {};
    filtered.forEach(g => {
      if (!groups[g.horizon]) groups[g.horizon] = [];
      groups[g.horizon].push(g);
    });
    return groups;
  }, [filtered, activeHorizon]);

  const totalActive    = goals.filter(g => !g.done).length;
  const totalCompleted = goals.filter(g => g.done).length;

  function saveGoal(g) {
    setGoals(gs => { const e = gs.find(x => x.id === g.id); return e ? gs.map(x => x.id === g.id ? g : x) : [...gs, g]; });
    setModal(false); setEditGoal(null);
  }

  function deleteGoal(id) { setGoals(gs => gs.filter(g => g.id !== id)); }

  function applyDelta(goal) {
    const delta = parseFloat(deltaVal);
    if (!isNaN(delta)) {
      const next = Math.min(goal.target, Math.max(0, goal.current + delta));
      const done = next >= goal.target;
      setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, current: next, done } : g));
    }
    setUpdating(null); setDeltaVal("");
  }

  const daysLeft = d => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date(TODAY)) / 86400000);
  };

  function GoalCard({ goal }) {
    const hor  = HOR_MAP[goal.horizon] || HORIZONS[0];
    const cat  = CAT_MAP[goal.category] || CATEGORIES[0];
    const pct  = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
    const due  = daysLeft(goal.deadline);
    const over = due !== null && due < 0 && !goal.done;
    const soon = due !== null && due <= 7 && due >= 0 && !goal.done;

    return (
      <div style={{ background: T.bg1, border: `1px solid ${goal.done ? rgba(hor.color, 0.3) : T.b1}`, borderRadius: 14, padding: "14px 16px", opacity: goal.done ? 0.72 : 1, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: hor.color, borderRadius: "14px 0 0 14px" }} />
        <div style={{ paddingLeft: 8 }}>
          {/* Row 1 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: rgba(cat.color, 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <cat.Icon size={14} color={cat.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>{goal.title}</span>
                {goal.done && <CheckCircle size={14} color={hor.color} />}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: hor.color, background: rgba(hor.color, 0.1), padding: "1px 7px", borderRadius: 10, textTransform: "uppercase", letterSpacing: ".4px" }}>{hor.short}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: cat.color, background: rgba(cat.color, 0.08), padding: "1px 7px", borderRadius: 10 }}>{cat.label}</span>
                {goal.deadline && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: over ? "#E05555" : soon ? "#F4881A" : T.t3, background: over ? rgba("#E05555",0.08) : "transparent", padding: "1px 7px", borderRadius: 10 }}>
                    {over ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `${due}d left`}
                  </span>
                )}
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {!goal.done && (
                <button onClick={() => { setUpdating(goal.id); setDeltaVal(""); }} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${rgba(hor.color,0.3)}`, background: rgba(hor.color,0.07), color: hor.color, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", ...FF }}>+</button>
              )}
              <button onClick={() => setPlanGoal(goal)} title="Suggest Plan" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${rgba("#6366F1",0.3)}`, background: rgba("#6366F1",0.07), color: "#6366F1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={12} />
              </button>
              <button onClick={() => { setEditGoal(goal); setModal("edit"); }} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.b1}`, background: "transparent", color: T.t3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={12} />
              </button>
              <button onClick={() => deleteGoal(goal.id)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${rgba("#E05555",0.2)}`, background: "transparent", color: rgba("#E05555",0.6), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Quick-update input */}
          {updating === goal.id && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: T.t2 }}>Log progress:</span>
              <input autoFocus type="number" value={deltaVal} onChange={e => setDeltaVal(e.target.value)} onKeyDown={e => e.key === "Enter" && applyDelta(goal)} style={{ width: 68, padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${hor.color}`, background: T.bg, color: T.t0, fontSize: 13, outline: "none", ...FF }} placeholder="+5" />
              {goal.unit && <span style={{ fontSize: 12, color: T.t2 }}>{goal.unit}</span>}
              <button onClick={() => applyDelta(goal)} style={{ padding: "5px 11px", borderRadius: 7, border: "none", background: hor.color, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...FF }}>Save</button>
              <button onClick={() => setUpdating(null)} style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 12, cursor: "pointer", ...FF }}>✕</button>
            </div>
          )}

          {/* Progress */}
          <ProgressBar pct={pct} color={hor.color} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
            <span style={{ fontSize: 12, color: T.t2 }}>
              {goal.current}{goal.unit ? ` ${goal.unit}` : ""}
              <span style={{ color: T.t3 }}> / {goal.target}{goal.unit ? ` ${goal.unit}` : ""}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? hor.color : T.t1 }}>{pct}%</span>
          </div>
          {goal.notes && <div style={{ fontSize: 11, color: T.t3, marginTop: 5, lineHeight: 1.4 }}>{goal.notes}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: onBg0 }}>Goals</div>
          <div style={{ fontSize: 12, color: onBg2 }}>{totalActive} active · {totalCompleted} completed</div>
        </div>
        <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${rgba(accent,0.35)}`, ...FF }}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {/* Horizon filter tabs */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
        {/* All tab */}
        {[
          { id: "all",  label: "All",  color: accent },
          ...HORIZONS,
          { id: "done", label: "Done", color: T.t3 },
        ].map(h => {
          const on  = activeHorizon === h.id;
          const cnt = h.id === "all" ? totalActive : h.id === "done" ? totalCompleted : (horizonCounts[h.id] || 0);
          return (
            <button key={h.id} onClick={() => setActiveHorizon(h.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${on ? h.color : T.b1}`, background: on ? rgba(h.color, 0.1) : "transparent", color: on ? h.color : T.t2, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", ...FF }}>
              {h.Icon && <h.Icon size={10} />}
              {h.label}
              {cnt > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: on ? rgba(h.color, 0.18) : T.bg2, color: on ? h.color : T.t3, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", color: T.t3 }}>
          <Target size={40} color={rgba(accent, 0.22)} style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.t2, marginBottom: 6 }}>
            {activeHorizon === "done" ? "No completed goals yet" : "No goals in this timeframe"}
          </div>
          {activeHorizon !== "done" && (
            <button onClick={() => setModal(true)} style={{ padding: "9px 22px", borderRadius: 20, border: "none", background: accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 10, ...FF }}>
              Create a Goal
            </button>
          )}
        </div>
      )}

      {/* All view — grouped by horizon */}
      {activeHorizon === "all" && grouped && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {HORIZONS.map(hor => {
            const items = (grouped[hor.id] || []);
            if (items.length === 0) return null;
            return (
              <div key={hor.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: rgba(hor.color, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <hor.Icon size={13} color={hor.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: hor.color }}>{hor.label}</span>
                  <span style={{ fontSize: 10, color: T.t3 }}>{hor.desc}</span>
                  <button onClick={() => { setModal(true); }} style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: 6, border: `1px solid ${rgba(hor.color,0.3)}`, background: "transparent", color: hor.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(g => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            );
          })}
          {/* Done goals in "all" view */}
          {goals.filter(g => g.done).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 8 }}>Completed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {goals.filter(g => g.done).map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single horizon or done view */}
      {activeHorizon !== "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}

      {/* Goal create/edit modal */}
      {(modal === true || modal === "edit") && (
        <GoalModal
          T={T} accent={accent}
          goal={modal === "edit" ? editGoal : null}
          defaultHorizon={activeHorizon !== "all" && activeHorizon !== "done" ? activeHorizon : "monthly"}
          onSave={saveGoal}
          onClose={() => { setModal(false); setEditGoal(null); }}
        />
      )}

      {/* AI plan modal */}
      {planGoal && (
        <GoalPlanModal
          T={T} accent={accent}
          goal={planGoal}
          onApply={({ events, tasks, meals, workouts }) => {
            // Add events
            if (events.length > 0 && onAddEvents) {
              onAddEvents(events.map(ev => ({
                id: uid(), baseId: uid(),
                title: ev.title || "Goal Event",
                date: ev.date || TODAY,
                start: ev.start || "09:00",
                end: ev.end || "10:00",
                allDay: ev.allDay || false,
                notes: ev.notes || `Goal: ${planGoal.title}`,
                pids: [], organizer: null, attendees: {},
                recurring: false, reminders: [], important: false, private: false,
              })));
            }
            // Add tasks
            if (tasks.length > 0 && onAddTasks) {
              onAddTasks(tasks.map(tk => ({
                id: uid(),
                title: tk.title || "Goal Task",
                pri: tk.priority || "medium",
                due: tk.due || "",
                done: false,
                listId: "personal",
                owner: null,
                createdAt: TODAY,
              })));
            }
            // Merge meals
            if (Object.keys(meals).length > 0 && setMealData) {
              setMealData(prev => ({ ...prev, ...meals }));
            }
            // Merge workouts
            if (Object.keys(workouts).length > 0 && setWorkoutData) {
              setWorkoutData(prev => ({ ...prev, ...workouts }));
            }
          }}
          onClose={() => setPlanGoal(null)}
        />
      )}
    </div>
  );
}
