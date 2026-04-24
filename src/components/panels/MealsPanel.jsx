import { useState } from "react";
import { DAYS_S } from "../../constants.js";
import { NOW, TODAY, fmtDate, addDays, weekStart, rgba } from "../../utils.js";
import { FF } from "../../theme.js";

export default function MealsPanel({ T }) {
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart(NOW), i));
  const meals = ["Breakfast", "Lunch", "Dinner"];
  const [data,    setData]    = useState({});
  const [editing, setEditing] = useState(null);
  const [val,     setVal]     = useState("");
  const key = (ds, m) => `${ds}|${m}`;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.t0, marginBottom: 4 }}>Meal Planner</div>
      <div style={{ fontSize: 13, color: T.t2, marginBottom: 20 }}>Tap any slot to add a meal.</div>
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
            {meals.map(meal => (
              <tr key={meal}>
                <td style={{ padding: "6px 8px", fontSize: 11, fontWeight: 700, color: T.t2, borderTop: `1px solid ${T.b0}`, ...FF }}>{meal}</td>
                {days.map(d => {
                  const ds = fmtDate(d), k = key(ds, meal), isEd = editing === k, v = data[k] || "";
                  return (
                    <td key={ds} style={{ padding: 4, borderTop: `1px solid ${T.b0}`, verticalAlign: "top" }}>
                      {isEd
                        ? <input autoFocus value={val} onChange={e => setVal(e.target.value)}
                            onBlur={() => { setData(prev => ({ ...prev, [k]: val })); setEditing(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { setData(prev => ({ ...prev, [k]: val })); setEditing(null); } }}
                            style={{ width: "100%", border: `1px solid ${T.red}`, borderRadius: 6, padding: "5px 7px", fontSize: 11, outline: "none", boxSizing: "border-box", background: T.bg1, color: T.t0, ...FF }}
                          />
                        : <div onClick={() => { setEditing(k); setVal(v); }}
                            style={{ minHeight: 36, padding: "5px 7px", borderRadius: 6, background: v ? rgba(T.red, 0.05) : T.bg1, border: `1px solid ${v ? rgba(T.red, 0.2) : T.b0}`, cursor: "pointer", fontSize: 11, color: v ? T.t0 : T.t3, ...FF }}>
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
    </div>
  );
}
