import { useMemo, useState } from "react";
import { X, Eye, EyeOff, Pencil, Plus, Share2, Lock, ChevronDown, Users } from "lucide-react";
import { NAV_H } from "../../constants.js";
import { rgba, getProfile, getProfiles } from "../../utils.js";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";

export default function CalendarPanel({
  calendars, events, hiddenCals, setHiddenCals,
  visiblePeople, setVisiblePeople,
  currentUser, T, onClose, onEditCalendar, onNewCalendar
}) {
  const [peopleOpen, setPeopleOpen] = useState(false);

  const countsByCalendar = useMemo(() => {
    const c = {};
    (calendars || []).forEach(cal => {
      c[cal.id] = (events || []).filter(e => e.calendarId === cal.id).length;
    });
    return c;
  }, [calendars, events]);

  // Calendars owned by or shared with current user (excluding "Work" type multi-member ones
  // — those are replaced by the People section)
  const myCalendars = (calendars || []).filter(cal =>
    cal.owner === currentUser || (cal.shared && cal.members.includes(currentUser))
  );

  // All other profiles (not the current user)
  const otherProfiles = getProfiles().filter(p => p.id !== currentUser);

  function togglePerson(pid) {
    setVisiblePeople(s => {
      const n = new Set(s);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });
  }

  function toggleCal(calId) {
    setHiddenCals(s => {
      const n = new Set(s);
      n.has(calId) ? n.delete(calId) : n.add(calId);
      return n;
    });
  }

  return (
    <div className="animate-slide-up" style={{
      position: "fixed", bottom: NAV_H, left: 0, width: 300,
      background: T.pop, border: `1px solid ${T.b1}`,
      borderTopRightRadius: 20, zIndex: 500,
      boxShadow: `6px -6px 40px ${T.sh}`,
      maxHeight: "75vh", display: "flex", flexDirection: "column"
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: `1px solid ${T.b0}` }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.t0, ...FF }}>My Calendars</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>

        {/* ── My Calendars ── */}
        {myCalendars.map(cal => {
          const isHidden = hiddenCals.has(cal.id);
          const canEdit  = cal.owner === currentUser;
          return (
            <div key={cal.id} className="animate-fade-in"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px" }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: isHidden ? T.t3 : cal.color, flexShrink: 0,
                boxShadow: isHidden ? "none" : `0 0 6px ${rgba(cal.color, 0.6)}`,
                transition: "background 0.15s",
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isHidden ? T.t2 : T.t0, ...FF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cal.name}
                  </span>
                  {cal.isDefault && (
                    <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: T.b0, color: T.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>default</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {cal.shared ? <Share2 size={9} color={T.t3} /> : <Lock size={9} color={T.t3} />}
                  <span style={{ fontSize: 10, color: T.t3, ...FF }}>{countsByCalendar[cal.id] || 0} events</span>
                </div>
              </div>

              {canEdit && (
                <button onClick={() => onEditCalendar(cal)}
                  style={{ background: "none", border: "none", color: T.t2, cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}>
                  <Pencil size={13} />
                </button>
              )}

              <button onClick={() => toggleCal(cal.id)}
                style={{ background: "none", border: "none", color: isHidden ? T.t3 : cal.color, cursor: "pointer", display: "flex", padding: 4, borderRadius: 6 }}>
                {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          );
        })}

        {/* ── People ── */}
        <div style={{ margin: "6px 14px 0" }}>
          {/* Dropdown trigger */}
          <button
            onClick={() => setPeopleOpen(o => !o)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", background: T.bg1, border: `1px solid ${T.b1}`,
              borderRadius: peopleOpen ? "10px 10px 0 0" : 10,
              cursor: "pointer", outline: "none", transition: "border-radius 0.15s",
            }}
          >
            <Users size={14} color={T.t2} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 700, color: T.t1, letterSpacing: ".3px", textTransform: "uppercase", ...FF }}>
              People
            </span>
            {visiblePeople.size > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: rgba(T.t0, 0.08), color: T.t0, padding: "1px 7px", borderRadius: 10 }}>
                {visiblePeople.size} on
              </span>
            )}
            <ChevronDown size={13} color={T.t2}
              style={{ transform: peopleOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease", flexShrink: 0 }} />
          </button>

          {/* People list */}
          {peopleOpen && (
            <div style={{ border: `1px solid ${T.b1}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
              {otherProfiles.map((p, i) => {
                const isOn = visiblePeople.has(p.id);
                return (
                  <div key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px",
                      background: isOn ? rgba(p.color, 0.06) : T.bg1,
                      borderBottom: i < otherProfiles.length - 1 ? `1px solid ${T.b0}` : "none",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                    onClick={() => togglePerson(p.id)}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar pid={p.id} size={26} />
                      {isOn && (
                        <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: p.color, border: `1.5px solid ${T.bg1}` }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isOn ? T.t0 : T.t1, ...FF }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.t3, ...FF }}>{p.family ? "Family" : "Work"}</div>
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: isOn ? p.color : "transparent",
                      border: `2px solid ${isOn ? p.color : T.b1}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", flexShrink: 0,
                    }}>
                      {isOn && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {myCalendars.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 16px", color: T.t3, fontSize: 12, ...FF }}>No calendars yet</div>
        )}
      </div>

      {/* New calendar button */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.b0}` }}>
        <button
          onClick={onNewCalendar}
          className="btn-press"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", borderRadius: 10, border: `1px dashed ${T.b1}`, background: "transparent", color: T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}
        >
          <Plus size={14} /> New Calendar
        </button>
      </div>
    </div>
  );
}
