import { useState, useMemo, useEffect } from "react";
import { X, Mic, ArrowRight, Zap } from "lucide-react";
import { fmtDate, uid, rgba } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { parseEventFromText, getDailySummary, getOptimizations } from "../../ai.js";
import { FF } from "../../theme.js";

export default function AIAssistantPanel({ events, date, currentUser, onClose, onAddEvent, T, accent }) {
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [summary,        setSummary]        = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [suggestions,    setSuggestions]    = useState([]);
  const [listening,      setListening]      = useState(false);

  const todayEvts = useMemo(() => {
    return expandEvents(events, new Date(date), new Date(date)).filter(e => e.date === fmtDate(date) && !e.allDay);
  }, [events, date]);

  useEffect(() => {
    setSummaryLoading(true);
    getDailySummary(todayEvts, fmtDate(date)).then(s => { setSummary(s); setSummaryLoading(false); });
  }, [date]);

  async function handleSend() {
    if (!input.trim()) return;
    setLoading(true);
    const parsed = await parseEventFromText(input.trim(), fmtDate(date));
    setLoading(false);
    if (parsed) {
      const id = uid(), baseId = uid();
      onAddEvent({ ...parsed, id, baseId, pids: [currentUser], organizer: currentUser, reminders: [15], important: false, attendees: { [currentUser]: "accepted" }, recurrence: { freq: parsed.recurFreq || "weekly", until: "" }, recurring: parsed.recurring || false });
      setInput("");
    } else {
      setSuggestions(["Couldn't parse that — try: 'Meeting at 3pm' or 'Gym tomorrow 6am'"]);
    }
  }

  async function handleOptimize() {
    setLoading(true);
    const s = await getOptimizations(todayEvts, fmtDate(date));
    setSuggestions(s);
    setLoading(false);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSuggestions(["Voice not supported in this browser"]); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onresult = e => setInput(e.results[0][0].transcript);
    r.onerror  = () => setListening(false);
    r.start();
  }

  const inp = { width: "100%", background: T.bg2, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "9px 12px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 800, backdropFilter: "blur(4px)" }}>
      <div className="animate-slide-up" style={{ background: T.card, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto", boxShadow: `0 -8px 40px ${T.sh}`, paddingBottom: "calc(20px + env(safe-area-inset-bottom))", ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>🤖 AI Assistant</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ background: rgba(accent, 0.08), border: `1px solid ${rgba(accent, 0.2)}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: accent, marginBottom: 6 }}>Today's Summary</div>
          <div style={{ fontSize: 13, color: T.t0, lineHeight: 1.5 }}>{summaryLoading ? "Generating…" : (summary || "No events today.")}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={"Type or speak: \"Gym tomorrow at 6am\"…"} style={{ ...inp, flex: 1, minHeight: 56, resize: "none" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={startVoice} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${listening ? accent : T.b1}`, background: listening ? rgba(accent, 0.15) : "transparent", color: listening ? accent : T.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Mic size={18} /></button>
            <button onClick={handleSend} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: 10, border: "none", background: input.trim() && !loading ? accent : "rgba(128,128,128,0.2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowRight size={18} /></button>
          </div>
        </div>
        {listening && <div style={{ fontSize: 11, color: accent, textAlign: "center", marginBottom: 8, fontWeight: 600 }}>🔴 Listening…</div>}
        {loading   && <div style={{ fontSize: 12, color: T.t2, textAlign: "center", marginBottom: 8 }}>🤖 Processing…</div>}

        <button onClick={handleOptimize} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...FF }}>
          <Zap size={14} /> Optimize Today's Schedule
        </button>

        {suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ background: T.bg1, border: `1px solid ${T.b0}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: T.t0, lineHeight: 1.4 }}>💡 {s}</div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 8 }}>Quick Commands</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Gym tomorrow at 6am", "Team meeting Monday 10am", "Dentist Friday 2pm", "Date night Saturday 7pm"].map(ex => (
            <button key={ex} onClick={() => setInput(ex)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>{ex}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
