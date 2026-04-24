import { useMemo } from "react";
import { X, Eye, EyeOff, Pencil, Plus, Share2, Lock, Users } from "lucide-react";
import { NAV_H } from "../../constants.js";
import { rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";

export default function CalendarPanel({ calendars, events, hiddenCals, setHiddenCals, currentUser, T, onClose, onEditCalendar, onNewCalendar }) {
  const countsByCalendar = useMemo(() => {
    const c = {};
    (calendars || []).forEach(cal => {
      c[cal.id] = (events || []).filter(e => e.calendarId === cal.id).length;
    });
    return c;
  }, [calendars, events]);

  // Calendars visible to current user
  const myCalendars = (calendars || []).filter(cal =>
    cal.owner === currentUser || (cal.shared && cal.members.includes(currentUser))
  );

  return (
    <div className="animate-slide-up" style={{ position: "fixed", bottom: NAV_H, left: 0, width: 300, background: T.pop, border: `1px solid ${T.b1}`, borderTopRightRadius: 20, zIndex: 500, boxShadow: `6px -6px 40px ${T.sh}`, maxHeight: "70vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: `1px solid ${T.b0}` }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.t0, ...FF }}>My Calendars</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex" }}><X size={16} /></button>
      </div>

      {/* Calendar list */}
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
        {myCalendars.map(cal => {
          const isHidden = hiddenCals.has(cal.id);
          const canEdit  = cal.owner === currentUser;
          return (
            <div
              key={cal.id}
              className="animate-fade-in"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", transition: "background 0.12s" }}
            >
              {/* Color dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: isHidden ? T.t3 : cal.color,
                flexShrink: 0, transition: "background 0.15s",
                boxShadow: isHidden ? "none" : `0 0 6px ${rgba(cal.color, 0.6)}`,
              }} />

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isHidden ? T.t2 : T.t0, ...FF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cal.name}</span>
                  {cal.isDefault && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: T.b0, color: T.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>default</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {cal.shared
                    ? <Share2 size={9} color={T.t3} />
                    : <Lock size={9} color={T.t3} />
                  }
                  <span style={{ fontSize: 10, color: T.t3, ...FF }}>{countsByCalendar[cal.id] || 0} events</span>
                  {cal.shared && (
                    <div style={{ display: "flex", gap: -3, marginLeft: 3 }}>
                      {cal.members.slice(0, 3).map((pid, i) => (
                        <div key={pid} style={{ marginLeft: i > 0 ? -4 : 0, border: `1.5px solid ${T.pop}`, borderRadius: "50%" }}>
                          <Avatar pid={pid} size={14} />
                        </div>
                      ))}
                      {cal.members.length > 3 && <span style={{ fontSize: 9, color: T.t3, marginLeft: 4 }}>+{cal.members.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit */}
              {canEdit && (
                <button
                  onClick={() => onEditCalendar(cal)}
                  style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.12s" }}
                >
                  <Pencil size={13} />
                </button>
              )}

              {/* Eye toggle */}
              <button
                onClick={() => setHiddenCals(s => { const n = new Set(s); isHidden ? n.delete(cal.id) : n.add(cal.id); return n; })}
                style={{ background: "none", border: "none", color: isHidden ? T.t3 : cal.color, cursor: "pointer", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
              >
                {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          );
        })}

        {myCalendars.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 16px", color: T.t3, fontSize: 12, ...FF }}>No calendars yet</div>
        )}
      </div>

      {/* New calendar button */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.b0}` }}>
        <button
          onClick={onNewCalendar}
          className="btn-press"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", borderRadius: 10, border: `1px dashed ${T.b1}`, background: "transparent", color: T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", ...FF }}
        >
          <Plus size={14} /> New Calendar
        </button>
      </div>
    </div>
  );
}
