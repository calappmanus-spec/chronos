export default function Toggle({ on, toggle, accent = "#6366F1" }) {
  return (
    <div onClick={toggle} style={{
      width: 36, height: 20, borderRadius: 10, flexShrink: 0,
      background: on ? accent : "rgba(128,128,128,0.22)", cursor: "pointer", position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 17 : 3,
        width: 14, height: 14, borderRadius: "50%",
        background: "#fff", transition: "left .18s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}
