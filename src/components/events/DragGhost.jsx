import { rgba } from "../../utils.js";

export default function DragGhost({ color, top, height, title, start, end }) {
  return (
    <div style={{
      position: "absolute", top, height: Math.max(height, 22),
      left: "2%", width: "95%",
      background: rgba(color, 0.15), border: `2px dashed ${color}`,
      borderRadius: 8, padding: "4px 8px 4px 11px",
      fontSize: 11, fontWeight: 600, color,
      overflow: "hidden", boxSizing: "border-box",
      zIndex: 10, pointerEvents: "none",
    }}>
      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
      {height > 28 && <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1 }}>{start}–{end}</div>}
    </div>
  );
}
