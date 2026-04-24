import { makeEventColors } from "../../data.js";
import MultiBar from "./MultiBar.jsx";

export default function EventPill({ ev, onClick }) {
  const c = makeEventColors(ev.pids || []);
  const multi = (ev.pids || []).length > 1;
  return (
    <div
      draggable={!ev.allDay}
      onDragStart={e => {
        e.stopPropagation();
        e.dataTransfer.setData("baseId", ev.baseId || ev.id);
        e.dataTransfer.setData("origDate", ev.date);
      }}
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
        {!ev.allDay && <span style={{ opacity: 0.45, fontSize: 9 }}>{ev.start}</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
        {ev.recurring && <span style={{ opacity: 0.3, fontSize: 8 }}>↺</span>}
      </div>
    </div>
  );
}
