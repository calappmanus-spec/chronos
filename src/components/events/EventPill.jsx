import { makeEventColors } from "../../data.js";
import MultiBar from "./MultiBar.jsx";

const CAT_ICON = { personal: "👤", work: "💼", social: "🎉", health: "💪", travel: "✈️", education: "📚" };

export default function EventPill({ ev, onClick, onLongPress }) {
  const base = makeEventColors(ev.pids || []);
  const c = ev.color
    ? { bg: ev.color + "22", bar: ev.color, txt: ev.color }
    : ev.calColor
    ? { bg: ev.calColor + "22", bar: ev.calColor, txt: ev.calColor }
    : base;
  const multi = !ev.color && !ev.calColor && (ev.pids || []).length > 1;

  // Long press for mobile move
  let lpTimer = null;
  function handleTouchStart(e) {
    lpTimer = setTimeout(() => { e.preventDefault(); onLongPress && onLongPress(ev); }, 500);
  }
  function handleTouchEnd() { clearTimeout(lpTimer); }
  return (
    <div
      draggable={!ev.allDay}
      onDragStart={e => {
        e.stopPropagation();
        e.dataTransfer.setData("baseId", ev.baseId || ev.id);
        e.dataTransfer.setData("origDate", ev.date);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={e => { e.stopPropagation(); onClick(ev); }}
      className="event-pill-hover btn-press"
      style={{ position: "relative", marginBottom: 2, cursor: "grab" }}
    >
      <MultiBar pids={ev.pids || []} />
      <div style={{
        fontSize: 10, fontWeight: 500,
        padding: `2px 5px 2px ${multi ? 9 : 5}px`,
        borderRadius: 5, background: c.bg, color: c.txt,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        borderLeft: multi ? "none" : `3px solid ${c.bar}`,
        display: "flex", alignItems: "center", gap: 3,
      }}>
        {ev.important && <span style={{ fontSize: 8 }}>★</span>}
        {ev.category && CAT_ICON[ev.category] && <span style={{ fontSize: 8, opacity: 0.7 }}>{CAT_ICON[ev.category]}</span>}
        {!ev.allDay && <span style={{ opacity: 0.45, fontSize: 9 }}>{ev.start}</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
        {ev.private && <span style={{ fontSize: 8, opacity: 0.5 }}>🔒</span>}
        {ev.recurring && <span style={{ opacity: 0.3, fontSize: 8 }}>↺</span>}
      </div>
    </div>
  );
}
