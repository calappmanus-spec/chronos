import { getProfile } from "../../utils.js";

export default function MultiBar({ pids }) {
  if (!pids || pids.length <= 1) return null;
  const colors = pids.map(id => getProfile(id).color);
  return (
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
      borderRadius: "3px 0 0 3px",
      background: `linear-gradient(180deg,${colors.join(",")})`,
      zIndex: 1,
    }} />
  );
}
