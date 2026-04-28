import { useEffect, useState } from "react";
import { FF } from "../../theme.js";

const ICONS = { success: "✅", error: "❌", info: "ℹ️", reward: "⭐", warning: "⚠️" };
const COLORS = {
  success: { bg: "rgba(46,204,154,0.15)", border: "rgba(46,204,154,0.4)", text: "#2ECC9A" },
  error:   { bg: "rgba(224,96,96,0.15)",  border: "rgba(224,96,96,0.4)",  text: "#E06060" },
  info:    { bg: "rgba(91,106,232,0.15)", border: "rgba(91,106,232,0.4)", text: "#8090F0" },
  reward:  { bg: "rgba(255,215,0,0.15)",  border: "rgba(255,215,0,0.4)",  text: "#FFD700" },
  warning: { bg: "rgba(232,160,32,0.15)", border: "rgba(232,160,32,0.4)", text: "#E8A020" },
};

function ToastItem({ toast, onRemove }) {
  const [leaving, setLeaving] = useState(false);
  const c = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), toast.duration ?? 3200);
    const t2 = setTimeout(() => onRemove(toast.id), (toast.duration ?? 3200) + 280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={leaving ? "animate-toast-out" : "animate-toast-in"}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: c.bg, border: `1px solid ${c.border}`,
        borderRadius: 12, padding: "11px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        maxWidth: 320, ...FF,
        cursor: "pointer",
      }}
      onClick={() => { setLeaving(true); setTimeout(() => onRemove(toast.id), 280); }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[toast.type] || ICONS.info}</span>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 1 }}>{toast.title}</div>}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{toast.message}</div>
      </div>
      {toast.action && (
        <button
          onClick={e => { e.stopPropagation(); toast.action.fn(); setLeaving(true); setTimeout(() => onRemove(toast.id), 280); }}
          style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.text, cursor: "pointer", ...FF }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed", bottom: 80, right: 16,
      display: "flex", flexDirection: "column-reverse", gap: 8,
      zIndex: 9000, pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
