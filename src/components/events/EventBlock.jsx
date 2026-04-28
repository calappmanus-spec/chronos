import { makeEventColors } from "../../data.js";
import { rgba } from "../../utils.js";
import MultiBar from "./MultiBar.jsx";

export default function EventBlock({ ev, top, height, onClick, onMouseDown, onLongPress, faded }) {
  const base = makeEventColors(ev.pids || []);
  const c = ev.color
    ? { bg: ev.color + "22", bar: ev.color, txt: ev.color }
    : ev.calColor
    ? { bg: ev.calColor + "22", bar: ev.calColor, txt: ev.calColor }
    : base;
  const multi = !ev.color && !ev.calColor && (ev.pids || []).length > 1;

  let lpTimer = null;
  function handleTouchStart(e) {
    lpTimer = setTimeout(() => { e.preventDefault(); onLongPress && onLongPress(ev); }, 500);
  }
  function handleTouchEnd() { clearTimeout(lpTimer); }
  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onMouseDown && onMouseDown(e, ev); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
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
