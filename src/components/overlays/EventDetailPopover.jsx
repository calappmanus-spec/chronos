import { getProfile, rgba, toMin } from "../../utils.js";
import { makeEventColors } from "../../data.js";
import { MapPin, FileText, Edit2, Trash2, Copy, X, Calendar, Clock, Move } from "lucide-react";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";

const CAT_ICON = { personal: "👤", work: "💼", social: "🎉", health: "💪", travel: "✈️", education: "📚" };
const STATUS_COL = { confirmed: "#4AA96C", tentative: "#F4881A", cancelled: "#E05555" };

function fmtAMPM(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
function fmtFullDate(ds) {
  try { return new Date(ds + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
  catch { return ds; }
}

export default function EventDetailPopover({ ev, T, accent, onEdit, onDelete, onDuplicate, onMove, onClose }) {
  const base = makeEventColors(ev.pids || []);
  const barColor = ev.color || ev.calColor || base.bar;
  const dur = (!ev.allDay && ev.start && ev.end) ? toMin(ev.end) - toMin(ev.start) : null;
  const durLabel = dur == null ? null : dur < 60 ? `${dur}m` : dur % 60 === 0 ? `${dur / 60}h` : `${Math.floor(dur / 60)}h ${dur % 60}m`;
  const isURL = s => /^https?:\/\//i.test((s || "").trim());
  const isMeeting = s => /zoom|meet\.google|teams\.microsoft|webex/i.test(s || "");

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 750, backdropFilter: "blur(4px)" }}
    >
      <div className="animate-pop" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 20, width: 340, maxWidth: "calc(100vw - 24px)", boxShadow: `0 20px 60px ${T.sh}`, overflow: "hidden", ...FF }}>
        <div style={{ height: 4, background: barColor }} />

        <div style={{ padding: "16px 16px 14px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
                {ev.category && CAT_ICON[ev.category] && <span style={{ fontSize: 13 }}>{CAT_ICON[ev.category]}</span>}
                {ev.important && <span style={{ fontSize: 11, color: "#F4881A" }}>★</span>}
                {ev.private   && <span style={{ fontSize: 10, color: T.t3 }}>🔒</span>}
                {ev.recurring && <span style={{ fontSize: 10, color: T.t3 }}>↺</span>}
                {ev.status && ev.status !== "confirmed" && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: rgba(STATUS_COL[ev.status] || "#aaa", 0.12), color: STATUS_COL[ev.status] || T.t2 }}>{ev.status}</span>
                )}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.t0, lineHeight: 1.25 }}>{ev.title}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2, padding: 2, flexShrink: 0, display: "flex" }}>
              <X size={15} />
            </button>
          </div>

          {/* Date */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: T.t1, fontSize: 12, ...FF }}>
            <Calendar size={13} color={T.t3} style={{ flexShrink: 0 }} />
            <span>
              {fmtFullDate(ev.date)}
              {ev.allDay && ev.endDate && ev.endDate !== ev.date ? ` – ${fmtFullDate(ev.endDate)}` : ""}
            </span>
          </div>

          {/* Time */}
          {!ev.allDay && ev.start && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: T.t1, fontSize: 12, ...FF }}>
              <Clock size={13} color={T.t3} style={{ flexShrink: 0 }} />
              <span>{fmtAMPM(ev.start)} – {fmtAMPM(ev.end)}{durLabel ? ` · ${durLabel}` : ""}</span>
            </div>
          )}

          {/* Location */}
          {ev.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, ...FF }}>
              <MapPin size={13} color={T.t3} style={{ flexShrink: 0 }} />
              {isURL(ev.location)
                ? <a href={ev.location} target="_blank" rel="noreferrer" style={{ color: isMeeting(ev.location) ? "#0096C7" : accent, fontWeight: 600, textDecoration: "none", ...FF }}>
                    {isMeeting(ev.location) ? "Join meeting" : "Open link"}
                  </a>
                : <span style={{ color: T.t1 }}>{ev.location}</span>}
            </div>
          )}

          {/* Notes */}
          {ev.notes && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <FileText size={13} color={T.t3} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: T.t1, lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 64, overflow: "hidden", WebkitMaskImage: "linear-gradient(to bottom,#000 40%,transparent 100%)" }}>
                {ev.notes}
              </div>
            </div>
          )}

          {/* Participants */}
          {(ev.pids || []).length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(ev.pids || []).map(pid => {
                const p = getProfile(pid);
                const status = (ev.attendees || {})[pid];
                return (
                  <div key={pid} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: rgba(p.color, 0.09), color: p.color, ...FF }}>
                    <Avatar pid={pid} size={13} />{p.name}
                    {status && <span style={{ opacity: 0.55 }}>{status === "accepted" ? "✓" : status === "declined" ? "✗" : "?"}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", borderTop: `1px solid ${T.b0}` }}>
          {[
            { icon: <Trash2 size={14} />, label: "Delete",    color: "#E05555", action: () => { onDelete(ev.baseId || ev.id); onClose(); } },
            { icon: <Move size={14} />,   label: "Move",      color: T.t1,      action: () => { onMove(ev); onClose(); } },
            { icon: <Copy size={14} />,   label: "Duplicate", color: T.t1,      action: () => { onDuplicate(ev); onClose(); } },
            { icon: <Edit2 size={14} />,  label: "Edit",      color: accent,    action: () => { onEdit(ev); onClose(); } },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 6px", background: "transparent", border: "none", borderLeft: i > 0 ? `1px solid ${T.b0}` : "none", cursor: "pointer", color: btn.color, fontSize: 10, fontWeight: 600, ...FF }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
