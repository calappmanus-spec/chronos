import { PROFILES } from "../../constants.js";
import { rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";

export default function UserSwitcher({ currentUser, setCurrentUser, T, onClose }) {
  return (
    <div style={{ position: "absolute", top: 44, right: 0, background: T.pop, border: `1px solid ${T.b1}`, borderRadius: 14, padding: 8, width: 200, boxShadow: `0 12px 40px ${T.sh}`, zIndex: 600 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: T.t3, padding: "6px 10px 8px", ...FF }}>Switch Calendar</div>
      {PROFILES.map(p => {
        const active = currentUser === p.id;
        return (
          <div key={p.id} onClick={() => { setCurrentUser(p.id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 9, cursor: "pointer", background: active ? rgba(p.color, 0.1) : "transparent" }}>
            <Avatar pid={p.id} size={26} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? p.color : T.t0, ...FF }}>{p.name}</div>
              <div style={{ fontSize: 9, color: T.t3, ...FF }}>{p.family ? "🏠 Family" : "External"}</div>
            </div>
            {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />}
          </div>
        );
      })}
    </div>
  );
}
