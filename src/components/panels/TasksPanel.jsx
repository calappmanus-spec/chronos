import { useState, useMemo } from "react";
import { Plus, X, Edit2, Trash2, List, CheckCircle2 } from "lucide-react";
import { TODAY, uid, rgba } from "../../utils.js";
import { FF } from "../../theme.js";

const DEFAULT_LISTS = [
  { id: "personal", name: "Personal", color: "#6366F1" },
  { id: "work",     name: "Work",     color: "#F4881A" },
  { id: "home",     name: "Home",     color: "#4AA96C" },
];

const LIST_COLORS = ["#6366F1","#E05555","#F4881A","#4AA96C","#9B5DE5","#0096C7","#2A9D8F","#E8A020"];

// ─── New list modal ────────────────────────────────────────────────────────────
function NewListModal({ T, accent, onSave, onClose }) {
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(LIST_COLORS[0]);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, backdropFilter: "blur(4px)" }}>
      <div className="animate-pop" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 18, padding: "20px 20px 16px", width: 320, maxWidth: "calc(100vw - 32px)", ...FF }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.t0, marginBottom: 14 }}>New List</div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && onSave({ id: uid(), name: name.trim(), color })} placeholder="List name…" style={{ width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "9px 12px", color: T.t0, fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box", marginBottom: 14, ...FF }} />
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
          {LIST_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: color === c ? `3px solid ${T.t0}` : "2px solid transparent", cursor: "pointer", boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>Cancel</button>
          <button onClick={() => name.trim() && onSave({ id: uid(), name: name.trim(), color })} disabled={!name.trim()} style={{ flex: 2, padding: "8px 0", borderRadius: 9, border: "none", background: name.trim() ? color : rgba("#888",0.2), color: "#fff", fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed", ...FF }}>
            Create List
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task add form ──────────────────────────────────────────────────────────────
function AddTaskForm({ T, accent, lists, activeListId, onAdd, onCancel }) {
  const [title,  setTitle]  = useState("");
  const [pri,    setPri]    = useState("medium");
  const [due,    setDue]    = useState(TODAY);
  const [listId, setListId] = useState(activeListId !== "all" ? activeListId : (lists[0]?.id || "personal"));
  const inp = { background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 10px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", width: "100%", ...FF };

  function submit() {
    if (!title.trim()) return;
    onAdd({ id: uid(), title: title.trim(), done: false, pri, due, listId, owner: "jeremy", createdAt: TODAY });
    setTitle("");
  }

  const activeList = lists.find(l => l.id === listId);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Task title…" style={{ ...inp, marginBottom: 10, fontSize: 14, fontWeight: 600 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 4 }}>Priority</div>
          <select value={pri} onChange={e => setPri(e.target.value)} style={{ ...inp, fontSize: 12 }}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 4 }}>Due</div>
          <input type="date" value={due} onChange={e => setDue(e.target.value)} style={{ ...inp, fontSize: 12 }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 4 }}>List</div>
          <select value={listId} onChange={e => setListId(e.target.value)} style={{ ...inp, fontSize: 12 }}>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} style={{ fontSize: 12, fontWeight: 700, padding: "7px 18px", borderRadius: 8, border: "none", background: activeList?.color || accent, color: "#fff", cursor: "pointer", ...FF }}>Add Task</button>
        <button onClick={onCancel} style={{ fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function TasksPanel({ tasks, setTasks, lists: propLists, setLists: propSetLists, T, accent, calBg = "transparent", isBgDark = true }) {
  const hasBg = calBg !== "transparent";
  const onBg0 = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0;
  const onBg2 = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;

  // Lists state (fall back to internal if not provided)
  const [internalLists, setInternalLists] = useState(DEFAULT_LISTS);
  const lists    = propLists    || internalLists;
  const setLists = propSetLists || setInternalLists;

  const [activeList,  setActiveList]  = useState("all");
  const [adding,      setAdding]      = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [showDone,    setShowDone]    = useState(false);

  const priColor = { high: T.red, medium: T.amb, low: T.grn };
  const priBg    = { high: T.redBg, medium: T.ambBg, low: T.grnBg };

  const allTasks = tasks || [];

  const filtered = useMemo(() => {
    const base = activeList === "all" ? allTasks : allTasks.filter(t => t.listId === activeList);
    const pending = base.filter(t => !t.done).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.pri] - { high: 0, medium: 1, low: 2 }[b.pri]));
    const done    = base.filter(t => t.done);
    return { pending, done };
  }, [allTasks, activeList]);

  const listCounts = useMemo(() => {
    const m = { all: allTasks.filter(t => !t.done).length };
    lists.forEach(l => { m[l.id] = allTasks.filter(t => t.listId === l.id && !t.done).length; });
    return m;
  }, [allTasks, lists]);

  function addTask(task) {
    setTasks(ts => [...ts, task]);
    setAdding(false);
  }

  function completeTask(task) {
    // Reward points are disabled for now — just mark done
    setTasks(ts => ts.map(x => x.id === task.id ? { ...x, done: true } : x));
  }

  function deleteList(id) {
    setLists(ls => ls.filter(l => l.id !== id));
    setTasks(ts => ts.map(t => t.listId === id ? { ...t, listId: lists[0]?.id || "personal" } : t));
    if (activeList === id) setActiveList("all");
  }

  const activeListObj = lists.find(l => l.id === activeList);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: onBg0 }}>Tasks</div>
          <div style={{ fontSize: 12, color: onBg2, marginTop: 2 }}>{filtered.pending.length} pending · {filtered.done.length} done</div>
        </div>
        <button onClick={() => setAdding(a => !a)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 10, border: "none", background: activeListObj?.color || accent, color: "#fff", cursor: "pointer", ...FF }}>
          <Plus size={14} /> New Task
        </button>
      </div>

      {/* Lists tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
        {/* All tab */}
        {[{ id: "all", name: "All", color: accent }, ...lists].map(l => {
          const on  = activeList === l.id;
          const cnt = listCounts[l.id] || 0;
          return (
            <div key={l.id} style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <button onClick={() => setActiveList(l.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${on ? l.color : T.b1}`, background: on ? rgba(l.color, 0.1) : "transparent", color: on ? l.color : T.t2, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", ...FF }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                {l.name}
                {cnt > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: on ? rgba(l.color,0.18) : T.bg2, color: on ? l.color : T.t3, borderRadius: 10, padding: "1px 5px" }}>{cnt}</span>}
              </button>
              {/* Delete list button (not "all") */}
              {l.id !== "all" && on && lists.length > 1 && (
                <button onClick={() => deleteList(l.id)} style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: rgba("#E05555",0.12), color: "#E05555", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2 }}>✕</button>
              )}
            </div>
          );
        })}
        {/* New list button */}
        <button onClick={() => setShowNewList(true)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20, border: `1px dashed ${T.b1}`, background: "transparent", color: T.t3, fontSize: 11, fontWeight: 600, cursor: "pointer", ...FF }}>
          <List size={11} /> New List
        </button>
      </div>

      {/* Add task form */}
      {adding && (
        <AddTaskForm
          T={T} accent={accent}
          lists={lists}
          activeListId={activeList}
          onAdd={addTask}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Empty state */}
      {filtered.pending.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "28px 0", color: T.t3, fontSize: 13 }}>
          <CheckCircle2 size={32} color={rgba(accent, 0.2)} style={{ margin: "0 auto 10px" }} />
          <div>All clear! Great work.</div>
        </div>
      )}

      {/* Pending tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.pending.map(task => {
          const list = lists.find(l => l.id === task.listId);
          return (
            <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: T.card, border: `1px solid ${T.b1}`, borderRadius: 12, position: "relative", overflow: "hidden" }}>
              {/* List color strip */}
              {list && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: list.color, borderRadius: "12px 0 0 12px" }} />}
              <button onClick={() => completeTask(task)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${priColor[task.pri]}`, background: "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = rgba(priColor[task.pri], 0.15)}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              />
              <div style={{ flex: 1, paddingLeft: list ? 4 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{task.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: priBg[task.pri], color: priColor[task.pri], textTransform: "uppercase" }}>{task.pri}</span>
                  {list && <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: rgba(list.color, 0.1), color: list.color }}>{list.name}</span>}
                  {task.due && <span style={{ fontSize: 10, color: task.due < TODAY ? T.red : T.t3 }}>Due {task.due === TODAY ? "Today" : task.due}</span>}
                </div>
              </div>
              <button onClick={() => setTasks(ts => ts.filter(x => x.id !== task.id))} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", padding: "2px 4px", fontSize: 14, marginTop: 1 }}>✕</button>
            </div>
          );
        })}
      </div>

      {/* Completed section */}
      {filtered.done.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowDone(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3 }}>Completed ({filtered.done.length})</span>
            <span style={{ fontSize: 10, color: T.t3 }}>{showDone ? "▾" : "▸"}</span>
          </button>
          {showDone && filtered.done.map(task => {
            const list = lists.find(l => l.id === task.listId);
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.bg1, border: `1px solid ${T.b0}`, borderRadius: 12, marginBottom: 5, opacity: 0.62 }}>
                <button onClick={() => setTasks(ts => ts.map(x => x.id === task.id ? { ...x, done: false } : x))} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: T.grn, cursor: "pointer", flexShrink: 0, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✓
                </button>
                <span style={{ fontSize: 13, color: T.t2, textDecoration: "line-through", flex: 1 }}>{task.title}</span>
                {list && <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 10, background: rgba(list.color, 0.1), color: list.color }}>{list.name}</span>}
                <button onClick={() => setTasks(ts => ts.filter(x => x.id !== task.id))} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* New list modal */}
      {showNewList && (
        <NewListModal
          T={T} accent={accent}
          onSave={l => { setLists(ls => [...ls, l]); setShowNewList(false); setActiveList(l.id); }}
          onClose={() => setShowNewList(false)}
        />
      )}
    </div>
  );
}
