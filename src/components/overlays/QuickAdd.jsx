import { useState, useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import { uid } from "../../utils.js";
import { parseEventFromText } from "../../ai.js";
import { FF } from "../../theme.js";

export default function QuickAdd({ date, currentUser, onSave, onClose, onMoreOptions, T, accent }) {
  const [mode,      setMode]      = useState("quick");
  const [title,     setTitle]     = useState("");
  const [start,     setStart]     = useState("09:00");
  const [end,       setEnd]       = useState("10:00");
  const [aiText,    setAiText]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");
  const titleRef = useRef(null);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 60); }, []);

  const [isPrivate, setIsPrivate] = useState(false);

  function handleQuickSave() {
    if (!title.trim()) return;
    const id = uid(), baseId = uid();
    const att = { [currentUser]: "accepted" };
    onSave({ id, baseId, title: title.trim(), date, start, end, pids: [currentUser], organizer: currentUser, allDay: false, recurring: false, recurrence: { freq: "weekly", until: "" }, reminders: [15], important: false, private: isPrivate, attendees: att });
  }

  async function handleAISave() {
    if (!aiText.trim()) return;
    setAiLoading(true); setAiError("");
    const parsed = await parseEventFromText(aiText.trim(), date);
    setAiLoading(false);
    if (!parsed) { setAiError("Couldn't parse that. Try: \"Gym tomorrow at 6am\""); return; }
    const id = uid(), baseId = uid();
    onSave({ id, baseId, title: parsed.title || aiText.trim(), date: parsed.date || date, start: parsed.start || "09:00", end: parsed.end || "10:00", allDay: parsed.allDay || false, recurring: parsed.recurring || false, recurrence: { freq: parsed.recurFreq || "weekly", until: "" }, pids: [currentUser], organizer: currentUser, reminders: [15], important: false, attendees: { [currentUser]: "accepted" } });
  }

  const inp = { width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "9px 12px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 800, backdropFilter: "blur(4px)" }}>
      <div className="animate-slide-up" style={{ background: T.card, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 520, boxShadow: `0 -8px 40px ${T.sh}`, paddingBottom: "calc(20px + env(safe-area-inset-bottom))", ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", background: T.bg1, borderRadius: 10, padding: 3, marginBottom: 16, gap: 2 }}>
          {[{ id: "quick", label: "⚡ Quick Add" }, { id: "ai", label: "🤖 AI Create" }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: mode === m.id ? accent : "transparent", color: mode === m.id ? "#fff" : T.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>{m.label}</button>
          ))}
        </div>
        {mode === "quick" && (
          <>
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickSave()} placeholder="Event title…" style={{ ...inp, fontSize: 16, fontWeight: 600, marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, letterSpacing: ".5px", textTransform: "uppercase" }}>Start</div>
                <input type="time" value={start} onChange={e => setStart(e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.t2, marginBottom: 4, letterSpacing: ".5px", textTransform: "uppercase" }}>End</div>
                <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={() => setIsPrivate(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, border: `1px solid ${isPrivate ? "#6366F1" : T.b1}`, background: isPrivate ? "rgba(99,102,241,0.1)" : "transparent", color: isPrivate ? "#6366F1" : T.t2, cursor: "pointer", ...FF }}>
                <Lock size={10} strokeWidth={2.5} /> {isPrivate ? "Private" : "Public"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>Cancel</button>
              <button onClick={handleQuickSave} disabled={!title.trim()} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: title.trim() ? accent : "rgba(128,128,128,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", ...FF }}>Add Event</button>
            </div>
            {onMoreOptions && (
              <button
                onClick={() => onMoreOptions({ title: title.trim(), date, start, end, private: isPrivate })}
                style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}
              >
                More options →
              </button>
            )}
          </>
        )}
        {mode === "ai" && (
          <>
            <textarea autoFocus value={aiText} onChange={e => setAiText(e.target.value)} placeholder={"Try: \"Gym tomorrow at 6am\"\n\"Team call every Monday at 10\"\n\"Dentist Friday 2pm\""} style={{ ...inp, minHeight: 80, resize: "none", marginBottom: 10, lineHeight: 1.5 }} />
            {aiError && <div style={{ fontSize: 11, color: T.red, marginBottom: 8 }}>{aiError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>Cancel</button>
              <button onClick={handleAISave} disabled={!aiText.trim() || aiLoading} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: aiText.trim() && !aiLoading ? accent : "rgba(128,128,128,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", ...FF }}>
                {aiLoading ? "🤖 Thinking…" : "🤖 Create Event"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
