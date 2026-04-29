import { useMemo, useState } from "react";
import { BADGES_ALL, SHOP_ITEMS, getWeeklyChallenges } from "../../constants.js";
import { getProfiles } from "../../utils.js";
import { rgba, getLevel, getNextLevel } from "../../utils.js";
import { FF } from "../../theme.js";
import Avatar from "../atoms/Avatar.jsx";
import Confetti from "../atoms/Confetti.jsx";

// ISO week number helper
function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Streak multiplier
function streakMultiplier(streak) {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.35;
  if (streak >= 7)  return 1.25;
  if (streak >= 3)  return 1.1;
  return 1;
}

const TABS = ["Overview","Badges","Challenges","Activity","Shop"];

export default function RewardsPanel({ rewards, T, currentUser, accent, activityFeed = [], onSpend, calBg = "transparent", isBgDark = true }) {
  const hasBg = calBg !== "transparent";
  const onBg0 = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0;
  const onBg2 = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;
  const [tab, setTab]           = useState("Overview");
  const [confetti, setConfetti] = useState(0);
  const [purchased, setPurchased] = useState(new Set());
  const [badgeFilter, setBadgeFilter] = useState("All");

  const sorted = useMemo(() => {
    return getProfiles()
      .map(p => ({ ...p, ...(rewards[p.id] || { pts: 0, done: 0, streak: 0, famEvs: 0 }) }))
      .sort((a, b) => b.pts - a.pts);
  }, [rewards]);

  const _empty    = { id: currentUser, name: "You", color: "#6366F1", pts: 0, done: 0, streak: 0, famEvs: 0 };
  const me        = sorted.find(p => p.id === currentUser) || sorted[0] || _empty;
  const lvl       = getLevel(me.pts);
  const nxt       = getNextLevel(me.pts);
  const pct       = nxt ? Math.min(100, Math.round(((me.pts - lvl.min) / (nxt.min - lvl.min)) * 100)) : 100;
  const multiplier = streakMultiplier(me.streak);
  const myBadges  = BADGES_ALL.filter(b => b.check(me));
  const challenges = useMemo(() => getWeeklyChallenges(isoWeek()), []);
  const badgeCategories = ["All", "Tasks", "Streaks", "Social"];
  const filteredBadges = badgeFilter === "All" ? BADGES_ALL : BADGES_ALL.filter(b => b.cat === badgeFilter);

  function handleSpend(item) {
    if (purchased.has(item.id)) return;
    if (me.pts < item.cost) return;
    setPurchased(s => new Set([...s, item.id]));
    onSpend && onSpend(currentUser, item.cost, `Bought: ${item.label}`);
    setConfetti(c => c + 1);
  }

  const inp = { background: "transparent", border: "none", color: T.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 12px", borderRadius: 8, ...FF };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", ...FF }}>
      <Confetti trigger={confetti} count={70} />

      {/* ── Hero card ── */}
      <div
        className="animate-fade-in"
        style={{
          background: `linear-gradient(135deg, ${rgba(lvl.color, 0.28)}, ${rgba(lvl.color, 0.06)})`,
          border: `1px solid ${rgba(lvl.color, 0.35)}`,
          borderRadius: 20, padding: "18px 18px 14px", margin: "12px 12px 0",
          boxShadow: `0 8px 32px ${rgba(lvl.color, 0.15)}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          {/* Avatar + level badge */}
          <div style={{ position: "relative" }}>
            <div
              className="animate-pulse-ring"
              style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${lvl.color}`, pointerEvents: "none" }}
            />
            <Avatar pid={me.id} size={56} />
            <div style={{ position: "absolute", bottom: -5, right: -5, background: lvl.color, color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 7px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }}>{lvl.name}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.t0, marginBottom: 2 }}>{me.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: lvl.color, lineHeight: 1 }}>{me.pts.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: T.t2 }}>pts</span>
            </div>
          </div>
          {/* Streak counter */}
          <div style={{ textAlign: "center" }}>
            <div
              className={me.streak >= 3 ? "animate-fire" : ""}
              style={{ fontSize: 28, lineHeight: 1 }}
            >🔥</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: me.streak >= 7 ? "#FF6B35" : T.t0, lineHeight: 1 }}>{me.streak}</div>
            <div style={{ fontSize: 9, color: T.t2 }}>streak</div>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.t2, marginBottom: 5 }}>
            <span style={{ color: lvl.color, fontWeight: 700 }}>{lvl.name}</span>
            {nxt ? <span>{nxt.name} · {(nxt.min - me.pts).toLocaleString()} pts to go</span> : <span style={{ color: "#FFD700" }}>Max Level 🏆</span>}
          </div>
          <div style={{ height: 7, borderRadius: 4, background: rgba(lvl.color, 0.12), overflow: "hidden" }}>
            <div
              className="progress-bar-fill"
              style={{ "--progress-width": `${pct}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${rgba(lvl.color, 0.8)}, ${lvl.color})`, width: `${pct}%`, boxShadow: `0 0 8px ${rgba(lvl.color, 0.6)}` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {[
            { l: "Tasks",    v: me.done,    icon: "✅" },
            { l: "Streak",   v: me.streak,  icon: "🔥" },
            { l: "Family",   v: me.famEvs,  icon: "🏠" },
            { l: "Multiplier",v: `${multiplier}x`, icon: "⚡" },
          ].map(s => (
            <div key={s.l} style={{ background: rgba(lvl.color, 0.08), borderRadius: 10, padding: "7px 6px", textAlign: "center", border: `1px solid ${rgba(lvl.color, 0.15)}` }}>
              <div style={{ fontSize: 11, marginBottom: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.t0, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 8, color: T.t2, marginTop: 1, textTransform: "uppercase", letterSpacing: ".4px" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {multiplier > 1 && (
          <div style={{ marginTop: 10, background: rgba("#FF6B35", 0.1), border: `1px solid ${rgba("#FF6B35", 0.3)}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#FF6B35", display: "flex", alignItems: "center", gap: 5 }}>
            <span className="animate-fire" style={{ display: "inline-block" }}>🔥</span>
            <strong>{multiplier}× streak bonus active!</strong> Earning {Math.round((multiplier - 1) * 100)}% extra on every task.
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 2, padding: "10px 12px 0", overflowX: "auto", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...inp, background: tab === t ? rgba(accent, 0.15) : "transparent", color: tab === t ? accent : T.t2, border: `1px solid ${tab === t ? rgba(accent, 0.3) : "transparent"}`, flexShrink: 0, transition: "all 0.15s" }}
          >{t}</button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>

        {/* OVERVIEW = leaderboard */}
        {tab === "Overview" && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3, marginBottom: 10 }}>Leaderboard</div>
            {sorted.map((p, i) => {
              const lv   = getLevel(p.pts);
              const isMe = p.id === currentUser;
              const medals = ["🥇","🥈","🥉"];
              return (
                <div
                  key={p.id}
                  className="animate-slide-up hover-lift"
                  style={{ animationDelay: `${i * 0.04}s`, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: isMe ? rgba(accent, 0.08) : T.card, border: `1px solid ${isMe ? rgba(accent, 0.35) : T.b1}`, borderRadius: 13, marginBottom: 6, transition: "all 0.15s" }}
                >
                  <div style={{ fontSize: i < 3 ? 22 : 14, width: 26, textAlign: "center", flexShrink: 0 }}>{i < 3 ? medals[i] : i + 1}</div>
                  <Avatar pid={p.id} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? accent : T.t0 }}>{p.name}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 8, background: rgba(lv.color, 0.18), color: lv.color }}>{lv.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.t2, marginTop: 2 }}>🔥{p.streak} streak · ✅{p.done} tasks</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: lv.color }}>{p.pts.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* BADGES */}
        {tab === "Badges" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
              {badgeCategories.map(cat => (
                <button key={cat} onClick={() => setBadgeFilter(cat)} style={{ ...inp, background: badgeFilter === cat ? rgba(accent, 0.15) : T.bg1, color: badgeFilter === cat ? accent : T.t2, border: `1px solid ${badgeFilter === cat ? rgba(accent, 0.3) : T.b0}`, transition: "all 0.15s", fontSize: 11, padding: "4px 10px" }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.t2 }}>{myBadges.filter(b => filteredBadges.includes(b)).length} / {filteredBadges.length} earned</span>
              <span style={{ fontSize: 10, color: T.t3 }}>Tap earned badges to celebrate 🎉</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {filteredBadges.map((b, i) => {
                const earned = myBadges.includes(b);
                return (
                  <div
                    key={b.id}
                    className={earned ? "hover-lift btn-press" : ""}
                    onClick={() => earned && setConfetti(c => c + 1)}
                    style={{ animationDelay: `${i * 0.03}s`, background: earned ? rgba(accent, 0.1) : T.card, border: `1.5px solid ${earned ? rgba(accent, 0.4) : T.b0}`, borderRadius: 14, padding: "14px 8px", textAlign: "center", opacity: earned ? 1 : 0.38, cursor: earned ? "pointer" : "default", transition: "all 0.18s" }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 5 }}>{b.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: earned ? T.t0 : T.t2, marginBottom: 2 }}>{b.label}</div>
                    <div style={{ fontSize: 8, color: T.t3, lineHeight: 1.3 }}>{b.desc}</div>
                    {earned && (
                      <div style={{ fontSize: 8, color: accent, marginTop: 5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>✓ Earned</div>
                    )}
                    <div style={{ fontSize: 7, color: T.t3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>{b.cat}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHALLENGES */}
        {tab === "Challenges" && (
          <div className="animate-fade-in">
            <div style={{ background: rgba(accent, 0.07), border: `1px solid ${rgba(accent, 0.2)}`, borderRadius: 12, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: T.t1 }}>
              <span style={{ fontWeight: 700, color: accent }}>Week {isoWeek()} challenges</span> — reset every Monday at midnight.
            </div>
            {challenges.map((c, i) => {
              const prog = Math.min(1, (me.done / c.goal) || 0);
              const done = prog >= 1;
              return (
                <div
                  key={c.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.06}s`, background: done ? rgba("#2ECC9A", 0.08) : T.card, border: `1px solid ${done ? rgba("#2ECC9A", 0.35) : T.b1}`, borderRadius: 14, padding: 14, marginBottom: 10 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: done ? rgba("#2ECC9A", 0.15) : rgba(accent, 0.1), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: done ? "#2ECC9A" : T.t0, marginBottom: 1 }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: T.t2 }}>{c.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: done ? "#2ECC9A" : accent }}>+{c.pts}</div>
                      <div style={{ fontSize: 9, color: T.t3 }}>pts</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.b1, overflow: "hidden" }}>
                    <div style={{ "--progress-width": `${prog * 100}%`, height: "100%", borderRadius: 3, background: done ? "#2ECC9A" : `linear-gradient(90deg,${rgba(accent, 0.8)},${accent})`, width: `${prog * 100}%`, transition: "width 0.6s ease", boxShadow: done ? "0 0 8px rgba(46,204,154,0.5)" : "none" }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.t2, marginTop: 5, textAlign: "right" }}>{done ? "✓ Completed!" : `${Math.floor(prog * c.goal)} / ${c.goal} ${c.type}`}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIVITY FEED */}
        {tab === "Activity" && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: T.t3, marginBottom: 10 }}>Recent Activity</div>
            {activityFeed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: T.t3, fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                Complete tasks or earn points to see your activity here.
              </div>
            ) : (
              activityFeed.slice(0, 20).map((item, i) => (
                <div
                  key={i}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.03}s`, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${T.b0}` }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: rgba(accent, 0.1), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{item.icon || "⭐"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.t0 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: T.t3 }}>{item.time}</div>
                  </div>
                  {item.pts && <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>+{item.pts}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* SHOP */}
        {tab === "Shop" && (
          <div className="animate-fade-in">
            <div style={{ background: rgba("#FFD700", 0.08), border: `1px solid ${rgba("#FFD700", 0.25)}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🪙</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFD700" }}>{me.pts.toLocaleString()} points available</div>
                <div style={{ fontSize: 11, color: T.t2 }}>Spend points on cosmetic upgrades</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SHOP_ITEMS.map((item, i) => {
                const canAfford = me.pts >= item.cost;
                const bought    = purchased.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s`, background: bought ? rgba("#FFD700", 0.1) : T.card, border: `1px solid ${bought ? rgba("#FFD700", 0.4) : T.b1}`, borderRadius: 14, padding: "14px 12px", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 30, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: bought ? "#FFD700" : T.t0, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: T.t2, marginBottom: 10, lineHeight: 1.3 }}>{item.desc}</div>
                    <button
                      onClick={() => handleSpend(item)}
                      disabled={!canAfford || bought}
                      className={canAfford && !bought ? "btn-press" : ""}
                      style={{ width: "100%", padding: "7px 0", borderRadius: 9, border: "none", background: bought ? rgba("#FFD700", 0.15) : canAfford ? accent : T.b1, color: bought ? "#FFD700" : canAfford ? "#fff" : T.t3, fontSize: 11, fontWeight: 700, cursor: canAfford && !bought ? "pointer" : "default", transition: "all 0.15s", ...FF }}
                    >
                      {bought ? "✓ Owned" : `🪙 ${item.cost.toLocaleString()} pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
