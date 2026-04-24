import { useState } from "react";
import { TODAY, uid } from "../../utils.js";
import { FF } from "../../theme.js";

export default function TasksPanel({ tasks, setTasks, T, accent, onComplete }) {
  const [newTitle, setNewTitle] = useState("");
  const [newPri,   setNewPri]   = useState("medium");
  const [newDue,   setNewDue]   = useState(TODAY);
  const [adding,   setAdding]   = useState(false);

  const priColor = { high: T.red,   medium: T.amb,   low: T.grn   };
  const priBg    = { high: T.redBg, medium: T.ambBg, low: T.grnBg };

  const pending = (tasks || []).filter(t => !t.done).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.pri] - { high: 0, medium: 1, low: 2 }[b.pri]));
  const done    = (tasks || []).filter(t => t.done);

  function addTask() {
    if (!newTitle.trim()) return;
    setTasks(ts => [...ts, { id: uid(), title: newTitle.trim(), done: false, pri: newPri, due: newDue, owner: "jeremy" }]);
    setNewTitle(""); setAdding(false);
  }
  function completeTask(task) {
    setTasks(ts => ts.map(x => x.id === task.id ? { ...x, done: true } : x));
    if (onComplete) onComplete(task);
  }

  const inp = { width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 11px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.t0 }}>Tasks</div>
          <div style={{ fontSize: 12, color: T.t2, marginTop: 2 }}>{pending.length} pending · {done.length} done</div>
        </div>
        <button onClick={() => setAdding(a => !a)} style={{ fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 10, border: "none", background: accent, color: "#fff", cursor: "pointer", ...FF }}>+ New</button>
      </div>

      {adding && (
        <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Task title…" style={{ ...inp, marginBottom: 10, fontSize: 14, fontWeight: 600 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 5 }}>Priority</div>
              <select value={newPri} onChange={e => setNewPri(e.target.value)} style={inp}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 5 }}>Due</div>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addTask} style={{ fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8, border: "none", background: accent, color: "#fff", cursor: "pointer", ...FF }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>Cancel</button>
          </div>
        </div>
      )}

      {pending.length === 0 && !adding && <div style={{ textAlign: "center", padding: "32px 0", color: T.t3, fontSize: 13 }}>All clear! 🎉</div>}

      {pending.map(task => (
        <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: T.card, border: `1px solid ${T.b1}`, borderRadius: 12, marginBottom: 6 }}>
          <button onClick={() => completeTask(task)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${priColor[task.pri]}`, background: "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{task.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: priBg[task.pri], color: priColor[task.pri] }}>{task.pri}</span>
              {task.due && <span style={{ fontSize: 10, color: task.due < TODAY ? T.red : T.t3 }}>Due {task.due === TODAY ? "Today" : task.due}</span>}
            </div>
          </div>
          <button onClick={() => setTasks(ts => ts.filter(x => x.id !== task.id))} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: "2px 4px", fontSize: 14, marginTop: 1 }}>✕</button>
        </div>
      ))}

      {done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3, marginBottom: 10 }}>Completed</div>
          {done.map(task => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.bg1, border: `1px solid ${T.b0}`, borderRadius: 12, marginBottom: 6, opacity: 0.6 }}>
              <button onClick={() => setTasks(ts => ts.map(x => x.id === task.id ? { ...x, done: false } : x))} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: T.grn, cursor: "pointer", flexShrink: 0, color: "#fff", fontSize: 14 }}>✓</button>
              <span style={{ fontSize: 13, color: T.t2, textDecoration: "line-through", flex: 1 }}>{task.title}</span>
              <button onClick={() => setTasks(ts => ts.filter(x => x.id !== task.id))} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
