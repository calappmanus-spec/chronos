import { useState, useMemo } from "react";
import { TODAY, NOW_MIN, toMin, rgba, getProfile } from "../../utils.js";
import { FF } from "../../theme.js";

export default function NotificationsPanel({ myEvents, allEvents, currentUser, dismissed, onDismiss, onDismissAll, onAccept, onDecline, accent, T }) {
  const [tab, setTab] = useState("today");

  const todayEvents = useMemo(() => {
    return (myEvents || [])
      .filter(e => e.date === TODAY && !e.allDay)
      .map(ev => {
        const sm = toMin(ev.start), em = toMin(ev.end);
        const status = NOW_MIN >= sm && NOW_MIN <= em ? "now" : NOW_MIN > em ? "past" : "soon";
        return { ...ev, _status: status, _sortMin: sm };
      })
      .filter(e => e._status !== "past")
      .sort((a, b) => a._sortMin - b._sortMin);
  }, [myEvents]);

  const invites = useMemo(() => {
    return (allEvents || []).filter(ev =>
      (ev.pids || []).includes(currentUser) &&
      ev.organizer !== currentUser &&
      (ev.attendees || {})[currentUser] === "pending"
    );
  }, [allEvents, currentUser]);

  const unread = todayEvents.filter(e => !dismissed.has(e.id)).length;

  function formatTime(ev) {
    const diff = toMin(ev.start) - NOW_MIN;
    if (diff <= 0) return "Now";
    return diff < 60 ? `in ${diff}m` : `in ${Math.floor(diff / 60)}h`;
  }

  function tabStyle(id) {
    return { background: tab === id ? rgba(accent, 0.12) : "transparent", border: "none", color: tab === id ? accent : T.t2, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, ...FF };
  }

  return (
    <div style={{ position: "absolute", top: 44, right: 0, width: 300, background: T.pop, border: `1px solid ${T.b1}`, borderRadius: 14, zIndex: 600, overflow: "hidden", boxShadow: `0 12px 40px ${T.sh}` }}>
      <div style={{ display: "flex", gap: 2, padding: "10px 10px 0", borderBottom: `1px solid ${T.b0}` }}>
        <button style={tabStyle("today")} onClick={() => setTab("today")}>
          Today
          {unread > 0 && <span style={{ background: accent, color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 10, fontWeight: 700 }}>{unread}</span>}
        </button>
        <button style={tabStyle("invites")} onClick={() => setTab("invites")}>
          Invites
          {invites.length > 0 && <span style={{ background: T.amb, color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 10, fontWeight: 700 }}>{invites.length}</span>}
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {tab === "today" && (
          todayEvents.length === 0
            ? <div style={{ padding: 28, textAlign: "center", fontSize: 12, color: T.t3, ...FF }}>Nothing scheduled today</div>
            : (
              <>
                {todayEvents.map(ev => (
                  <div key={ev.id} onClick={() => onDismiss(ev.id)} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.b0}`, background: dismissed.has(ev.id) ? "transparent" : rgba(accent, 0.04), cursor: "pointer" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 3, flexShrink: 0 }}>
                      {(ev.pids || []).slice(0, 3).map(pid => <div key={pid} style={{ width: 6, height: 6, borderRadius: "50%", background: getProfile(pid).color }} />)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: dismissed.has(ev.id) ? T.t2 : T.t0, ...FF }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: T.t2, marginTop: 2, ...FF }}>
                        {ev._status === "now" ? <span style={{ color: T.red }}>● Now</span> : <span style={{ color: accent }}>{formatTime(ev)}</span>}
                        {" · "}{ev.start}–{ev.end}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "8px 14px" }}>
                  <button onClick={onDismissAll} style={{ fontSize: 11, color: T.t2, background: "none", border: "none", cursor: "pointer", ...FF }}>Clear all</button>
                </div>
              </>
            )
        )}
        {tab === "invites" && (
          invites.length === 0
            ? <div style={{ padding: 28, textAlign: "center", fontSize: 12, color: T.t3, ...FF }}>No pending invitations</div>
            : invites.map(ev => {
                const org = getProfile(ev.organizer);
                return (
                  <div key={ev.id} style={{ padding: 14, borderBottom: `1px solid ${T.b0}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.t0, marginBottom: 3, ...FF }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: T.t2, marginBottom: 10, ...FF }}>
                      <span style={{ color: org.color, fontWeight: 600 }}>{org.name}</span>
                      {" · "}{ev.date}{!ev.allDay && ` ${ev.start}–${ev.end}`}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onAccept(ev.id, currentUser)} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.grnBd}`, background: T.grnBg, color: T.grn, cursor: "pointer", ...FF }}>✓ Accept</button>
                      <button onClick={() => onDecline(ev.id, currentUser)} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.redBd}`, background: T.redBg, color: T.red, cursor: "pointer", ...FF }}>✕ Decline</button>
                    </div>
                  </div>
                );
              })
        )}
      </div>
    </div>
  );
}
