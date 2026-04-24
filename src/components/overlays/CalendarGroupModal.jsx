import { useState } from "react";
import { X, Trash2, Users, Share2, Lock } from "lucide-react";
import { PROFILES, CAL_COLORS } from "../../constants.js";
import { rgba, uid } from "../../utils.js";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";

export default function CalendarGroupModal({ calendar, currentUser, onSave, onDelete, onClose, T, accent }) {
  const isNew = !calendar?.id;
  const [name,    setName]    = useState(calendar?.name    || "");
  const [color,   setColor]   = useState(calendar?.color   || CAL_COLORS[0]);
  const [members, setMembers] = useState(calendar?.members || [currentUser]);
  const [shared,  setShared]  = useState(calendar?.shared  ?? true);

  function toggleMember(pid) {
    if (pid === currentUser) return; // can't remove yourself
    setMembers(m => m.includes(pid) ? m.filter(p => p !== pid) : [...m, pid]);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id:        calendar?.id || `cal_${uid()}`,
      name:      name.trim(),
      color,
      members,
      owner:     calendar?.owner || currentUser,
      isDefault: calendar?.isDefault ?? false,
      shared,
    });
  }

  const inp = { width: "100%", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "9px 12px", color: T.t0, fontSize: 13, outline: "none", boxSizing: "border-box", ...FF };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 800, backdropFilter: "blur(4px)" }}
    >
      <div
        className="animate-pop"
        style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 20, padding: 24, width: 380, maxWidth: "calc(100vw - 24px)", maxHeight: "88vh", overflowY: "auto", boxShadow: `0 24px 64px ${T.sh}`, ...FF }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>{isNew ? "New Calendar" : "Edit Calendar"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex", alignItems: "center" }}><X size={18} /></button>
        </div>

        {/* Calendar preview pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: rgba(color, 0.1), border: `1px solid ${rgba(color, 0.3)}`, borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 8px ${rgba(color, 0.7)}` }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: color }}>{name || "Calendar name…"}</span>
          {shared
            ? <Share2 size={13} style={{ marginLeft: "auto", color: T.t2 }} />
            : <Lock size={13} style={{ marginLeft: "auto", color: T.t2 }} />
          }
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 5, ...FF }}>Name</div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Soccer Team, Book Club…"
            style={inp}
          />
        </div>

        {/* Color swatches */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 8, ...FF }}>Color</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="btn-press"
                style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${color === c ? "#fff" : "transparent"}`, boxShadow: color === c ? `0 0 0 2px ${c}` : "none", cursor: "pointer", transition: "all 0.15s" }}
              />
            ))}
          </div>
        </div>

        {/* Sharing toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg1, borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {shared ? <Share2 size={15} color={T.t1} /> : <Lock size={15} color={T.t1} />}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t0, ...FF }}>{shared ? "Shared Calendar" : "Private Calendar"}</div>
              <div style={{ fontSize: 10, color: T.t2, ...FF }}>{shared ? "Members can view & edit events" : "Only you can see this calendar"}</div>
            </div>
          </div>
          <button
            onClick={() => setShared(s => !s)}
            style={{ width: 36, height: 20, borderRadius: 10, background: shared ? color : "rgba(128,128,128,0.22)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
          >
            <div style={{ position: "absolute", top: 3, left: shared ? 17 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
          </button>
        </div>

        {/* Members */}
        {shared && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t2, marginBottom: 8, display: "flex", alignItems: "center", gap: 5, ...FF }}>
              <Users size={11} /> Members ({members.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PROFILES.map(p => {
                const on  = members.includes(p.id);
                const isMe = p.id === currentUser;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleMember(p.id)}
                    className="btn-press"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 6px", borderRadius: 20, border: `1.5px solid ${on ? color : T.b1}`, background: on ? rgba(color, 0.1) : "transparent", cursor: isMe ? "default" : "pointer", transition: "all 0.15s", ...FF }}
                  >
                    <Avatar pid={p.id} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: on ? color : T.t2 }}>{p.name}{isMe ? " (you)" : ""}</span>
                  </button>
                );
              })}
            </div>
            {/* Member avatar strip */}
            {members.length > 0 && (
              <div style={{ display: "flex", marginTop: 10, gap: -4 }}>
                {members.map((pid, i) => (
                  <div key={pid} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: members.length - i, border: `2px solid ${T.card}`, borderRadius: "50%" }}>
                    <Avatar pid={pid} size={22} />
                  </div>
                ))}
                <span style={{ marginLeft: 8, fontSize: 11, color: T.t2, alignSelf: "center" }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isNew && !calendar?.isDefault && (
            <button
              onClick={() => onDelete(calendar.id)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.redBd}`, background: T.redBg, color: T.red, cursor: "pointer", ...FF }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, cursor: "pointer", ...FF }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="btn-press"
            style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "8px 20px", borderRadius: 9, border: "none", background: name.trim() ? color : T.b1, color: name.trim() ? "#fff" : T.t3, cursor: name.trim() ? "pointer" : "default", transition: "all 0.15s", ...FF }}
          >
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
