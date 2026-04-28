import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { MONTHS_S } from "../../constants.js";
import { getProfile, rgba } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

export default function SearchPanel({ events, onSelect, onClose, T, accent }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const allExpanded = useMemo(() =>
    expandEvents(events, new Date(2024, 0, 1), new Date(2028, 11, 31)),
  [events]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allExpanded
      .filter(e => e.title?.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q))
      .sort((a, b) => a.date < b.date ? 1 : -1)
      .slice(0, 25);
  }, [allExpanded, query]);

  function fmtDate(ds) {
    const d = new Date(ds + "T00:00:00");
    return `${MONTHS_S[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", zIndex: 800, backdropFilter: "blur(6px)" }}
    >
      <div style={{ background: T.card, borderRadius: "0 0 22px 22px", maxHeight: "78vh", display: "flex", flexDirection: "column", boxShadow: `0 12px 48px rgba(0,0,0,0.25)` }}>

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${T.b0}` }}>
          <Search size={18} color={accent} strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Escape" && onClose()}
            placeholder="Search events…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: T.t0, fontWeight: 500, ...FF }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2, display: "flex" }}>
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.b1}`, borderRadius: 8, cursor: "pointer", color: T.t2, fontSize: 12, fontWeight: 600, padding: "4px 10px", ...FF }}>
            Cancel
          </button>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {!query && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: T.t3, fontSize: 13, ...FF }}>
              Type to search your events
            </div>
          )}
          {query && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: T.t3, fontSize: 13, ...FF }}>
              No events matching <strong style={{ color: T.t1 }}>"{query}"</strong>
            </div>
          )}
          {results.map((ev, i) => {
            const p = getProfile((ev.pids || [])[0] || "jeremy");
            return (
              <div
                key={ev.id + i}
                onClick={() => { onSelect(ev); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", cursor: "pointer",
                  borderBottom: `1px solid ${T.b0}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = rgba(T.t0, 0.04)}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: ev.color || p.color, flexShrink: 0, boxShadow: `0 0 5px ${rgba(ev.color || p.color, 0.5)}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.t0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...FF }}>
                    {ev.important && <span style={{ color: "#F4881A", marginRight: 4 }}>★</span>}
                    {ev.private && <span style={{ marginRight: 4 }}>🔒</span>}
                    {ev.title}
                    {ev.recurring && <span style={{ marginLeft: 5, opacity: 0.4, fontSize: 11 }}>↺</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.t2, marginTop: 2, ...FF }}>
                    {fmtDate(ev.date)}{ev.start && ` · ${ev.start}–${ev.end}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
