import { useState, useEffect, useMemo } from "react";
import { DAYS_L, MONTHS } from "../../constants.js";
import { TODAY, NOW_MIN, toMin, pad } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";

// ─── Breathing phases (4-7-8 technique) ───────────────────────────────────────
const PHASES = [
  { label: "Breathe In",  duration: 4000, scale: 1.45 },
  { label: "Hold",        duration: 7000, scale: 1.45 },
  { label: "Breathe Out", duration: 8000, scale: 0.85 },
];

// ─── Zen palette ──────────────────────────────────────────────────────────────
const ZEN = {
  bg:       "linear-gradient(160deg, #F4EDDF 0%, #EDE5D0 55%, #E4D9C0 100%)",
  bamboo:   "#6B9B6E",
  leaf:     "#4A7C59",
  leafDark: "#355C42",
  stone:    "#8B7355",
  text0:    "#2C2011",
  text1:    "#5C4A2A",
  text2:    "#8B7355",
  text3:    "#B09878",
  card:     "rgba(255,248,235,0.75)",
  border:   "rgba(107,88,55,0.18)",
};

// ─── A single bamboo stalk ────────────────────────────────────────────────────
function BambooStalk({ x, height, width = 14, opacity = 0.55, delay = 0 }) {
  const nodes = Math.floor(height / 60);
  return (
    <div style={{ position: "absolute", bottom: 0, left: x, width, opacity, animation: `bambooSway ${3 + delay}s ease-in-out infinite alternate`, transformOrigin: "bottom center" }}>
      {/* Stalk segments */}
      {Array.from({ length: nodes }, (_, i) => (
        <div key={i}>
          <div style={{ width, height: 55, background: `linear-gradient(90deg, ${ZEN.bamboo} 0%, #8BBD8E 40%, ${ZEN.bamboo} 100%)`, borderRadius: i === 0 ? "4px 4px 0 0" : 0 }} />
          <div style={{ width: width + 4, height: 6, marginLeft: -2, background: ZEN.leafDark, borderRadius: 2 }} />
        </div>
      ))}
      {/* Leaves at top */}
      <BambooLeaves side={Math.random() > 0.5 ? "left" : "right"} color={ZEN.leaf} />
    </div>
  );
}

function BambooLeaves({ side, color }) {
  return (
    <div style={{ position: "absolute", top: -10, [side]: side === "left" ? -28 : -28, display: "flex", flexDirection: "column", gap: 4 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 32, height: 9,
          background: color,
          borderRadius: "50%",
          transform: `rotate(${side === "left" ? -30 - i * 15 : 30 + i * 15}deg) translateX(${i * 4}px)`,
          opacity: 0.7 + i * 0.1,
        }} />
      ))}
    </div>
  );
}

// ─── A ground pebble / stone ──────────────────────────────────────────────────
function Pebble({ x, y, w, h }) {
  return <div style={{ position: "absolute", left: x, bottom: y, width: w, height: h, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, #C8B89A, ${ZEN.stone})`, opacity: 0.55 }} />;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ZenMode({ events, accent, onExit }) {
  const [tick,       setTick]       = useState(new Date());
  const [phaseIdx,   setPhaseIdx]   = useState(0);
  const [showSched,  setShowSched]  = useState(false);

  useEffect(() => {
    const i = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhaseIdx(i => (i + 1) % PHASES.length), PHASES[phaseIdx].duration);
    return () => clearTimeout(t);
  }, [phaseIdx]);

  const phase = PHASES[phaseIdx];
  const h = tick.getHours(), m = tick.getMinutes();
  const h12 = h % 12 || 12, ap = h >= 12 ? "PM" : "AM";
  const dateStr = `${DAYS_L[tick.getDay()]}, ${MONTHS[tick.getMonth()]} ${tick.getDate()}`;

  const todayEvts = useMemo(() => {
    return expandEvents(events, new Date(), new Date())
      .filter(e => e.date === TODAY)
      .sort((a, b) => toMin(a.start || "00:00") - toMin(b.start || "00:00"));
  }, [events]);

  // Stalks layout
  const stalks = [
    { x: "2%",  h: 340, w: 13, op: 0.5,  d: 0   },
    { x: "5%",  h: 280, w: 10, op: 0.4,  d: 0.4 },
    { x: "8%",  h: 400, w: 15, op: 0.6,  d: 0.8 },
    { x: "11%", h: 220, w: 11, op: 0.35, d: 1.2 },
    { x: "88%", h: 360, w: 13, op: 0.5,  d: 0.3 },
    { x: "91%", h: 260, w: 10, op: 0.4,  d: 0.9 },
    { x: "94%", h: 420, w: 16, op: 0.6,  d: 0.2 },
    { x: "97%", h: 200, w: 10, op: 0.3,  d: 1.5 },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: ZEN.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1200, overflow: "hidden", ...FF }}>

      <style>{`
        @keyframes bambooSway {
          from { transform: rotate(-1.5deg); }
          to   { transform: rotate(1.5deg);  }
        }
        @keyframes leafFloat {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.8; }
          50%  { transform: translateY(-8px) rotate(3deg);  opacity: 0.6; }
          100% { transform: translateY(0px) rotate(-2deg);  opacity: 0.8; }
        }
      `}</style>

      {/* Bamboo forest */}
      {stalks.map((s, i) => (
        <BambooStalk key={i} x={s.x} height={s.h} width={s.w} opacity={s.op} delay={s.d} />
      ))}

      {/* Ground pebbles */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: `linear-gradient(180deg, transparent, rgba(139,115,85,0.12))` }} />
      <Pebble x="16%" y={4} w={28} h={16} />
      <Pebble x="22%" y={2} w={18} h={11} />
      <Pebble x="72%" y={5} w={24} h={14} />
      <Pebble x="79%" y={3} w={15} h={9}  />

      {/* Top controls */}
      <button onClick={() => setShowSched(s => !s)} style={{ position: "absolute", top: 18, left: 20, background: ZEN.card, border: `1px solid ${ZEN.border}`, borderRadius: 20, padding: "6px 14px", color: ZEN.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)", ...FF }}>
        {showSched ? "Hide" : "Today"}
      </button>
      <button onClick={onExit} style={{ position: "absolute", top: 18, right: 20, background: ZEN.card, border: `1px solid ${ZEN.border}`, borderRadius: 20, padding: "6px 14px", color: ZEN.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)", ...FF }}>
        Exit Zen
      </button>

      {/* Main content */}
      <div style={{ textAlign: "center", zIndex: 2, padding: "0 20%", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Clock */}
        <div style={{ fontSize: 72, fontWeight: 200, letterSpacing: "-3px", color: ZEN.text0, lineHeight: 1, marginBottom: 4, textShadow: "0 2px 8px rgba(44,32,17,0.08)" }}>
          {pad(h12)}:{pad(m)}<span style={{ fontSize: 20, fontWeight: 300, marginLeft: 8, color: ZEN.text2 }}>{ap}</span>
        </div>
        <div style={{ fontSize: 13, color: ZEN.text2, marginBottom: 36, letterSpacing: ".4px" }}>{dateStr}</div>

        {/* Breathing circle */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          {/* Outermost ring */}
          <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: `1px solid ${ZEN.bamboo}22`, transform: `scale(${phase.scale * 1.35})`, transition: `transform ${phase.duration}ms ease-in-out` }} />
          {/* Middle ring */}
          <div style={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", border: `1.5px solid ${ZEN.bamboo}44`, transform: `scale(${phase.scale * 1.18})`, transition: `transform ${phase.duration}ms ease-in-out` }} />
          {/* Main filled circle */}
          <div style={{
            width: 130, height: 130, borderRadius: "50%",
            background: `radial-gradient(circle at 40% 35%, #8BBD8E 0%, ${ZEN.bamboo} 50%, ${ZEN.leafDark} 100%)`,
            border: `2px solid ${ZEN.bamboo}`,
            boxShadow: `0 8px 32px rgba(75,124,89,0.25), inset 0 2px 8px rgba(255,255,255,0.2)`,
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.duration}ms ease-in-out`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)" }} />
          </div>
        </div>

        {/* Phase label */}
        <div style={{ fontSize: 15, fontWeight: 500, color: ZEN.leaf, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 6 }}>
          {phase.label}
        </div>
        <div style={{ fontSize: 11, color: ZEN.text3, letterSpacing: ".8px" }}>
          {phase.duration / 1000}s · 4-7-8 breathing
        </div>
      </div>

      {/* Schedule panel */}
      {showSched && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(244,237,224,0.92)", backdropFilter: "blur(16px)", borderTop: `1px solid ${ZEN.border}`, padding: "14px 20px 20px", maxHeight: "38vh", overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: ZEN.text3, marginBottom: 10 }}>Today's Schedule</div>
          {todayEvts.length === 0
            ? <div style={{ fontSize: 13, color: ZEN.text3, textAlign: "center", padding: "8px 0" }}>Nothing scheduled — a perfect day</div>
            : todayEvts.map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${ZEN.border}` }}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: ZEN.bamboo, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: ZEN.text0 }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: ZEN.text2 }}>{ev.allDay ? "All day" : `${ev.start} – ${ev.end}`}</div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Bottom hint */}
      {!showSched && (
        <div style={{ position: "absolute", bottom: 20, fontSize: 10, color: ZEN.text3, letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Breathe · Slow down · Be here
        </div>
      )}
    </div>
  );
}
