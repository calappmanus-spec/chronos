import { useState } from "react";
import { FF } from "../../theme.js";

export default function MoveEventSheet({ ev, T, accent, onMove, onClose }) {
  const [newDate, setNewDate] = useState(ev.date || "");

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 810, backdropFilter: "blur(4px)" }}
    >
      <div className="animate-slide-up" style={{ background: T.card, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 520, boxShadow: `0 -8px 40px ${T.sh}`, paddingBottom: "calc(20px + env(safe-area-inset-bottom))", ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: T.t0, marginBottom: 3 }}>Move Event</div>
        <div style={{ fontSize: 13, color: T.t2, marginBottom: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t2, marginBottom: 6 }}>New Date</div>
        <input
          type="date"
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          style={{ width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10, padding: "10px 12px", color: T.t0, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 18, ...FF }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>
            Cancel
          </button>
          <button
            onClick={() => { if (newDate) { onMove(ev.baseId || ev.id, newDate); onClose(); } }}
            disabled={!newDate || newDate === ev.date}
            style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: newDate && newDate !== ev.date ? accent : "rgba(128,128,128,0.2)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", ...FF }}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
