import { useEffect, useState } from "react";

const COLORS = ["#E05555","#9B5DE5","#0096C7","#F4881A","#2A9D8F","#4AA96C","#FFD700","#FF6B6B","#4ECDC4","#45B7D1"];
const SHAPES = ["■","●","▲","★","◆"];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function Confetti({ trigger, count = 60 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const ps = Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      x: randomBetween(5, 95),
      delay: randomBetween(0, 0.8),
      duration: randomBetween(0.9, 1.6),
      size: randomBetween(8, 18),
      rotation: randomBetween(-360, 360),
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 2200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!particles.length) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${p.x}%`,
            color: p.color,
            fontSize: p.size,
            fontWeight: 900,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.shape}
        </div>
      ))}
    </div>
  );
}
