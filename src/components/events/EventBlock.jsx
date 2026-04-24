import { makeEventColors } from "../../data.js";
import { rgba } from "../../utils.js";
import MultiBar from "./MultiBar.jsx";

export default function EventBlock({ ev, top, height, onClick, onMouseDown, faded }) {
  const c = makeEventColors(ev.pids || []);
  const multi = (ev.pids || []).length > 1;
  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onMouseDown && onMouseDown(e, ev); }}
      onClick={e => { e.stopPropagation(); !faded && onClick(ev); }}
      style={{
        position: "absolute", top, height: Math.max(height, 22),
        left: "2%", width: "95%",
        background: c.bg, borderRadius: 8,
        padding: "4px 8px 4px 11px",
        fontSize: 11, fontWeight: 600, color: c.txt,
        overflow: "hidden", cursor: faded ? "grabbing" : "grab",
        boxSizing: "border-box", zIndex: 2,
        opacity: faded ? 0.28 : 1, userSelect: "none",
        border: `1px solid ${rgba(c.bar, 0.18)}`,
      }}
    >
      <MultiBar pids={ev.pids || []} />
      {!multi && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "3px 0 0 3px", background: c.bar }} />
      )}
      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {ev.important && "★ "}{ev.title}{ev.recurring && " ↺"}
      </div>
      {height > 32 && (
        <div style={{ fontSize: 9, opacity: 0.55, marginTop: 1, fontWeight: 400 }}>{ev.start}–{ev.end}</div>
      )}
    </div>
  );
}
