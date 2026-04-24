import { getProfile, rgba } from "../../utils.js";

export default function Avatar({ pid, size = 24 }) {
  const p = getProfile(pid);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: rgba(p.color, 0.15), border: `1.5px solid ${p.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 700, color: p.color, flexShrink: 0,
    }}>
      {p.name[0]}
    </div>
  );
}
