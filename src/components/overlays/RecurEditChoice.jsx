import { FF } from "../../theme.js";

export default function RecurEditChoice({ ev, onChoice, onClose, T }) {
  const opts = [
    { key: "this", label: "This event only",  desc: "Only change this one occurrence" },
    { key: "all",  label: "All future events", desc: "Change this and every occurrence after it" },
  ];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 750, backdropFilter: "blur(4px)" }}
    >
      <div className="animate-slide-up" style={{ background: T.card, borderRadius: "20px 20px 0 0", padding: "20px 16px", width: "100%", maxWidth: 520, paddingBottom: "calc(20px + env(safe-area-inset-bottom))", ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "0 auto 18px" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: T.t0, textAlign: "center", marginBottom: 4 }}>Edit Recurring Event</div>
        <div style={{ fontSize: 12, color: T.t2, textAlign: "center", marginBottom: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>

        {opts.map(opt => (
          <button
            key={opt.key}
            onClick={() => onChoice(opt.key)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 16px", marginBottom: 8, background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 12, cursor: "pointer", ...FF }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: T.t0 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: T.t2, marginTop: 3 }}>{opt.desc}</div>
          </button>
        ))}

        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4, ...FF }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
