import { CalendarDays, UtensilsCrossed, CloudSun, Plus, CheckSquare, Target, Settings } from "lucide-react";
import { NAV_H } from "../constants.js";
import { rgba } from "../utils.js";
import { FF } from "../theme.js";

const ITEMS = [
  { id: "calendars", label: "Calendar", Icon: CalendarDays },
  { id: "meals",     label: "Fitness",  Icon: UtensilsCrossed },
  { id: "weather",   label: "Weather",  Icon: CloudSun },
  null,
  { id: "tasks",     label: "Tasks",    Icon: CheckSquare },
  { id: "goals",     label: "Goals",    Icon: Target },
  { id: "settings",  label: "Settings", Icon: Settings },
];

export default function BottomNav({ section, setSection, showCalPanel, setShowCalPanel, onNew, accent, T, calBg = "transparent", darkMode = false, isBgDark = true }) {
  const hasBg     = calBg !== "transparent";
  const navBorder = hasBg ? (isBgDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)") : T.b1;
  const inactiveColor = hasBg ? (isBgDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)") : T.t2;
  const activeColor   = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : accent;
  return (
    <div style={{ height: NAV_H, background: hasBg ? "transparent" : T.bg1, borderTop: `1px solid ${navBorder}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 4px", paddingBottom: "env(safe-area-inset-bottom)", flexShrink: 0 }}>
      {ITEMS.map((item, i) => {
        if (item === null) {
          return (
            <button key="add" onClick={onNew} className="btn-press" style={{ width: 48, height: 48, borderRadius: 14, background: accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: `0 4px 16px ${rgba(accent, 0.4)}`, marginBottom: 8 }}>
              <Plus size={22} strokeWidth={2.5} />
            </button>
          );
        }

        const isCalBtn = item.id === "calendars";
        const active   = isCalBtn ? (section === "calendar") : (section === item.id);

        return (
          <button
            key={item.id}
            onClick={() => {
              if (isCalBtn) {
                if (section !== "calendar") { setSection("calendar"); setShowCalPanel(false); }
                else { setShowCalPanel(s => !s); }
              } else {
                setSection(item.id);
                setShowCalPanel(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: active ? rgba(accent, hasBg ? 0.2 : 0.1) : "none", border: active ? `1px solid ${rgba(accent, hasBg ? 0.35 : 0.2)}` : "1px solid transparent", cursor: "pointer", color: active ? activeColor : inactiveColor, padding: "5px 8px", borderRadius: 10, transition: "all 0.15s", ...FF }}
          >
            <item.Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, ...FF }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
