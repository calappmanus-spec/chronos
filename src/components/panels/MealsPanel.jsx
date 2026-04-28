import { useState } from "react";
import { Bot, UtensilsCrossed, Dumbbell, Sparkles } from "lucide-react";
import { DAYS_S } from "../../constants.js";
import { NOW, TODAY, fmtDate, addDays, weekStart, rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import { generateMealPlan, generateWorkoutPlan, optimizeMealsForWorkout } from "../../ai.js";
import Toggle from "../atoms/Toggle.jsx";

const MEAL_TYPES    = ["Breakfast", "Lunch", "Dinner"];
const WORKOUT_SLOTS = ["Morning", "Afternoon", "Evening"];

// ─── Shared week-grid component ──────────────────────────────────────────────
function WeekGrid({ T, days, rowLabels, data, setData, accentColor }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal]         = useState("");
  const k = (ds, label) => `${ds}|${label}`;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
        <thead>
          <tr>
            <td style={{ width: 82, padding: "6px 8px", fontSize: 10, fontWeight: 700, color: T.t3, textTransform: "uppercase", ...FF }} />
            {days.map(d => {
              const isT = fmtDate(d) === TODAY;
              return (
                <td key={d.toString()} style={{ padding: 6, textAlign: "center", fontSize: 11, fontWeight: 700, color: isT ? T.red : T.t2, borderBottom: `2px solid ${isT ? T.red : T.b0}`, ...FF }}>
                  {DAYS_S[d.getDay()]}
                  <div style={{ fontSize: 18, fontWeight: isT ? 700 : 300, color: isT ? T.red : T.t0, lineHeight: 1.1 }}>{d.getDate()}</div>
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map(label => (
            <tr key={label}>
              <td style={{ padding: "6px 8px", fontSize: 11, fontWeight: 700, color: T.t2, borderTop: `1px solid ${T.b0}`, ...FF }}>{label}</td>
              {days.map(d => {
                const ds = fmtDate(d), ky = k(ds, label), isEd = editing === ky, v = data[ky] || "";
                return (
                  <td key={ds} style={{ padding: 4, borderTop: `1px solid ${T.b0}`, verticalAlign: "top" }}>
                    {isEd
                      ? <input autoFocus value={val} onChange={e => setVal(e.target.value)}
                          onBlur={() => { setData(p => ({ ...p, [ky]: val })); setEditing(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { setData(p => ({ ...p, [ky]: val })); setEditing(null); } }}
                          style={{ width: "100%", padding: "5px 7px", fontSize: 11, background: T.bg1, border: `1.5px solid ${accentColor}`, borderRadius: 6, color: T.t0, outline: "none", boxSizing: "border-box", ...FF }}
                        />
                      : <div onClick={() => { setEditing(ky); setVal(v); }}
                          style={{ minHeight: 36, padding: "5px 7px", borderRadius: 6, background: v ? rgba(accentColor, 0.05) : T.bg1, border: `1px solid ${v ? rgba(accentColor, 0.22) : T.b0}`, cursor: "pointer", fontSize: 11, color: v ? T.t0 : T.t3, lineHeight: 1.4, ...FF }}>
                          {v || "+ Add"}
                        </div>
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── AI Generator modal ──────────────────────────────────────────────────────
function GenModal({ T, title, children, onClose, onGenerate, loading, genMsg, genLabel }) {
  return (
    <div onClick={e => e.target === e.currentTarget && !loading && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 900, backdropFilter: "blur(4px)" }}>
      <div className="animate-slide-up" style={{ background: T.card, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 520, boxShadow: `0 -8px 40px rgba(0,0,0,0.3)`, paddingBottom: "calc(24px + env(safe-area-inset-bottom))", ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 700, color: T.t0, marginBottom: 4 }}><Bot size={20} /> {title}</div>
        <div style={{ fontSize: 13, color: T.t2, marginBottom: 20 }}>Answer a few questions and AI will build your plan.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
        {genMsg && <div style={{ fontSize: 12, color: loading ? T.t2 : "#4AA96C", textAlign: "center", marginTop: 14 }}>{genMsg}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={() => { if (!loading) onClose(); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", ...FF }}>Cancel</button>
          <button onClick={onGenerate} disabled={loading} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: loading ? "rgba(128,128,128,0.2)" : "linear-gradient(135deg,#6366F1,#9B5DE5)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...FF }}>
            <Bot size={14} /> {loading ? "Generating…" : genLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: "#888", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange, T }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(opt => (
        <button key={typeof opt === "string" ? opt : opt.value} onClick={() => onChange(typeof opt === "string" ? opt : opt.value)}
          style={{ padding: "7px 13px", borderRadius: 8, border: `1.5px solid ${value === (typeof opt === "string" ? opt : opt.value) ? "#6366F1" : T.b1}`, background: value === (typeof opt === "string" ? opt : opt.value) ? rgba("#6366F1", 0.12) : "transparent", color: value === (typeof opt === "string" ? opt : opt.value) ? "#6366F1" : T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
          {typeof opt === "string" ? opt : opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
export default function MealsPanel({ T, calBg = "transparent", isBgDark = true, mealData = {}, setMealData, workoutData = {}, setWorkoutData, onAddEvents }) {
  const hasBg = calBg !== "transparent";
  const onBg0 = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0;
  const onBg2 = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;

  const [tab, setTab] = useState("meals"); // "meals" | "workout"
  const days     = Array.from({ length: 7 }, (_, i) => addDays(weekStart(NOW), i));
  const startDate = fmtDate(weekStart(NOW));

  // Meals AI state
  const [showMealGen,  setShowMealGen]  = useState(false);
  const [mealPrefs,    setMealPrefs]    = useState({ people: 2, restrictions: "", preferences: "", days: 7 });
  const [mealLoading,  setMealLoading]  = useState(false);
  const [mealMsg,      setMealMsg]      = useState("");
  const [addToCal,     setAddToCal]     = useState(false);

  // Workout AI state
  const [showWorkGen,  setShowWorkGen]  = useState(false);
  const [workPrefs,    setWorkPrefs]    = useState({ level: "Intermediate", goal: "General Fitness", equipment: "Home Gym", duration: 45, daysPerWeek: 4, limitations: "" });
  const [workLoading,  setWorkLoading]  = useState(false);
  const [workMsg,      setWorkMsg]      = useState("");
  const [addWorkToCal, setAddWorkToCal] = useState(false);

  // Optimize meals for workout
  const [optimizing,   setOptimizing]   = useState(false);

  const inp = { background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 10px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", width: "100%", ...FF };

  async function handleMealGenerate() {
    setMealLoading(true); setMealMsg("");
    const result = await generateMealPlan({ ...mealPrefs, startDate });
    setMealLoading(false);
    if (!result) { setMealMsg("AI couldn't generate a plan. Check your API key in Settings."); return; }
    const newData = { ...mealData };
    const calEvents = [];
    Object.entries(result).forEach(([k, v]) => {
      const parts = k.split("|"); if (parts.length < 2) return;
      const [ds, mealType] = parts;
      const [mealName, recipe] = (v || "").split("|||");
      if (mealName) newData[`${ds}|${mealType}`] = mealName.trim();
      if (addToCal && recipe && onAddEvents) calEvents.push({ id: Math.random().toString(36).slice(2), baseId: Math.random().toString(36).slice(2), title: mealName.trim(), date: ds, allDay: true, start: mealType === "Breakfast" ? "08:00" : mealType === "Lunch" ? "12:00" : "18:00", end: mealType === "Breakfast" ? "09:00" : mealType === "Lunch" ? "13:00" : "19:00", notes: recipe?.trim() || "", category: "health", pids: ["jeremy"], organizer: "jeremy", recurring: false, recurrence: { freq: "weekly", until: "" }, reminders: [], important: false, private: false, attendees: { jeremy: "accepted" } });
    });
    setMealData(newData);
    if (calEvents.length > 0 && onAddEvents) onAddEvents(calEvents);
    setMealMsg(`Meal plan generated! ${Object.keys(result).length} meals added.`);
    setTimeout(() => { setShowMealGen(false); setMealMsg(""); }, 2500);
  }

  async function handleWorkoutGenerate() {
    setWorkLoading(true); setWorkMsg("");
    const result = await generateWorkoutPlan({ ...workPrefs, startDate, days: 7 });
    setWorkLoading(false);
    if (!result) { setWorkMsg("AI couldn't generate a plan. Check your API key in Settings."); return; }
    const newData = { ...workoutData };
    const calEvents = [];
    Object.entries(result).forEach(([k, v]) => {
      const parts = k.split("|"); if (parts.length < 2) return;
      const [ds, slot] = parts;
      const [workoutName, instructions] = (v || "").split("|||");
      if (workoutName) newData[`${ds}|${slot}`] = workoutName.trim();
      if (addWorkToCal && onAddEvents) {
        const startH = slot === "Morning" ? "06:30" : slot === "Afternoon" ? "12:00" : "18:00";
        const endH   = slot === "Morning" ? "07:15" : slot === "Afternoon" ? "12:45" : "18:45";
        calEvents.push({ id: Math.random().toString(36).slice(2), baseId: Math.random().toString(36).slice(2), title: workoutName.trim(), date: ds, allDay: false, start: startH, end: endH, notes: instructions?.trim() || "", category: "health", pids: ["jeremy"], organizer: "jeremy", recurring: false, recurrence: { freq: "weekly", until: "" }, reminders: [30], important: false, private: false, attendees: { jeremy: "accepted" } });
      }
    });
    setWorkoutData(newData);
    if (calEvents.length > 0 && onAddEvents) onAddEvents(calEvents);
    setWorkMsg(`Workout plan generated!`);
    setTimeout(() => { setShowWorkGen(false); setWorkMsg(""); }, 2500);
  }

  async function handleOptimizeMeals() {
    setOptimizing(true);
    const result = await optimizeMealsForWorkout(mealData, workoutData, startDate);
    setOptimizing(false);
    if (!result) { return; }
    setMealData(prev => ({ ...prev, ...result }));
    setTab("meals");
  }

  const hasWorkout = Object.keys(workoutData).length > 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", background: rgba("#000", 0.06), borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { id: "meals",   label: "Meals",   Icon: UtensilsCrossed },
            { id: "workout", label: "Workout", Icon: Dumbbell },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "none", background: tab === t.id ? T.card : "transparent", color: tab === t.id ? onBg0 : onBg2, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.12)" : "none", ...FF }}>
              <t.Icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {tab === "meals" && hasWorkout && (
            <button onClick={handleOptimizeMeals} disabled={optimizing} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 20, border: "none", background: optimizing ? rgba("#2A9D8F",0.3) : "linear-gradient(135deg,#2A9D8F,#4AA96C)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: optimizing ? "not-allowed" : "pointer", ...FF }}>
              <Sparkles size={12} /> {optimizing ? "Optimizing…" : "Optimize for Workout"}
            </button>
          )}
          <button onClick={() => tab === "meals" ? setShowMealGen(true) : setShowWorkGen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#6366F1,#9B5DE5)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...FF }}>
            <Bot size={14} /> {tab === "meals" ? "Meal Plan" : "Workout Plan"}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 13, color: onBg2, marginBottom: 14 }}>
        {tab === "meals" ? "Tap any slot to add a meal." : "Tap any slot to add a workout."}
      </div>

      {/* Grid */}
      {tab === "meals"
        ? <WeekGrid T={T} days={days} rowLabels={MEAL_TYPES}    data={mealData}    setData={setMealData}    accentColor={T.red} />
        : <WeekGrid T={T} days={days} rowLabels={WORKOUT_SLOTS} data={workoutData} setData={setWorkoutData} accentColor="#6366F1" />
      }

      {/* ── Meal Generator Modal ── */}
      {showMealGen && (
        <GenModal T={T} title="AI Meal Plan" onClose={() => setShowMealGen(false)} onGenerate={handleMealGenerate} loading={mealLoading} genMsg={mealMsg} genLabel="Generate Meal Plan">
          <OptionRow label="Servings for how many people?">
            <ChipGroup T={T} options={["1","2","3","4","5","6"]} value={String(mealPrefs.people)} onChange={v => setMealPrefs(p => ({ ...p, people: Number(v) }))} />
          </OptionRow>
          <OptionRow label="Dietary restrictions">
            <input value={mealPrefs.restrictions} onChange={e => setMealPrefs(p => ({ ...p, restrictions: e.target.value }))} placeholder="e.g. vegetarian, gluten-free, dairy-free…" style={inp} />
          </OptionRow>
          <OptionRow label="Cuisine preferences">
            <input value={mealPrefs.preferences} onChange={e => setMealPrefs(p => ({ ...p, preferences: e.target.value }))} placeholder="e.g. Mediterranean, quick 30-min, comfort food…" style={inp} />
          </OptionRow>
          <OptionRow label="Days to plan">
            <ChipGroup T={T} options={[{label:"3 days",value:"3"},{label:"5 days",value:"5"},{label:"7 days",value:"7"}]} value={String(mealPrefs.days)} onChange={v => setMealPrefs(p => ({ ...p, days: Number(v) }))} />
          </OptionRow>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>Add meals to calendar</div>
              <div style={{ fontSize: 11, color: T.t2 }}>Creates all-day events with recipes in notes</div>
            </div>
            <Toggle on={addToCal} toggle={() => setAddToCal(v => !v)} accent="#6366F1" />
          </div>
        </GenModal>
      )}

      {/* ── Workout Generator Modal ── */}
      {showWorkGen && (
        <GenModal T={T} title="AI Workout Plan" onClose={() => setShowWorkGen(false)} onGenerate={handleWorkoutGenerate} loading={workLoading} genMsg={workMsg} genLabel="Generate Workout Plan">
          <OptionRow label="Fitness level">
            <ChipGroup T={T} options={["Beginner","Intermediate","Advanced"]} value={workPrefs.level} onChange={v => setWorkPrefs(p => ({ ...p, level: v }))} />
          </OptionRow>
          <OptionRow label="Primary goal">
            <ChipGroup T={T} options={["Weight Loss","Muscle Gain","Endurance","Flexibility","General Fitness"]} value={workPrefs.goal} onChange={v => setWorkPrefs(p => ({ ...p, goal: v }))} />
          </OptionRow>
          <OptionRow label="Available equipment">
            <ChipGroup T={T} options={["No Equipment","Home Gym","Full Gym"]} value={workPrefs.equipment} onChange={v => setWorkPrefs(p => ({ ...p, equipment: v }))} />
          </OptionRow>
          <OptionRow label="Session duration">
            <ChipGroup T={T} options={[{label:"20 min",value:"20"},{label:"30 min",value:"30"},{label:"45 min",value:"45"},{label:"60 min",value:"60"}]} value={String(workPrefs.duration)} onChange={v => setWorkPrefs(p => ({ ...p, duration: Number(v) }))} />
          </OptionRow>
          <OptionRow label="Days per week">
            <ChipGroup T={T} options={["3","4","5","6"]} value={String(workPrefs.daysPerWeek)} onChange={v => setWorkPrefs(p => ({ ...p, daysPerWeek: Number(v) }))} />
          </OptionRow>
          <OptionRow label="Injuries or limitations (optional)">
            <input value={workPrefs.limitations} onChange={e => setWorkPrefs(p => ({ ...p, limitations: e.target.value }))} placeholder="e.g. bad knees, lower back pain, no jumping…" style={inp} />
          </OptionRow>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>Add workouts to calendar</div>
              <div style={{ fontSize: 11, color: T.t2 }}>Creates timed events with full instructions in notes</div>
            </div>
            <Toggle on={addWorkToCal} toggle={() => setAddWorkToCal(v => !v)} accent="#6366F1" />
          </div>
        </GenModal>
      )}
    </div>
  );
}
