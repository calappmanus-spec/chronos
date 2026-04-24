import { useState } from "react";
import { FAM_IDS, CAL_BACKGROUNDS } from "../../constants.js";
import { rgba, getProfile } from "../../utils.js";
import { FF } from "../../theme.js";
import Toggle from "../atoms/Toggle.jsx";

export default function SettingsPanel({ darkMode, setDarkMode, sleepMode, setSleepMode, focusMode, setFocusMode, T, calBg, setCalBg }) {
  const [customHex, setCustomHex] = useState("");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.t0, marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 13, color: T.t2, marginBottom: 20 }}>Customize Chronos.</div>

      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.b0}`, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>Display Modes</div>
        {[
          { icon: "🌙", label: "Night Mode",  desc: "Dark theme throughout the app",          on: darkMode,  set: () => setDarkMode(v => !v),  acc: "#6366F1" },
          { icon: "😴", label: "Sleep Mode",  desc: "Bedside clock, weather & tomorrow",      on: sleepMode, set: () => setSleepMode(v => !v), acc: "#9B5DE5" },
          { icon: "⚡", label: "Focus Mode",  desc: "Minimal display: clock + next event",    on: focusMode, set: () => setFocusMode(v => !v), acc: "#E05555" },
        ].map((item, i, arr) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.b0}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rgba(item.acc, 0.12), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t0, ...FF }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.t2, ...FF }}>{item.desc}</div>
              </div>
            </div>
            <Toggle on={item.on} toggle={item.set} accent={item.acc} />
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 12, ...FF }}>AI Features</div>
        <div style={{ fontSize: 13, color: T.t0, marginBottom: 3, ...FF }}>🤖 AI Event Creation</div>
        <div style={{ fontSize: 11, color: T.t2, marginBottom: 10, ...FF }}>Natural language → events. Tap 🤖 in the top bar or use ⚡ Quick Add.</div>
        <div style={{ fontSize: 13, color: T.t0, marginBottom: 3, ...FF }}>🎤 Voice Control</div>
        <div style={{ fontSize: 11, color: T.t2, marginBottom: 10, ...FF }}>Speak events into the AI panel.</div>
        <div style={{ fontSize: 13, color: T.t0, marginBottom: 3, ...FF }}>⚡ Schedule Optimizer</div>
        <div style={{ fontSize: 11, color: T.t2, ...FF }}>AI finds free blocks and suggests improvements.</div>
      </div>

      {/* Calendar Background Picker */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.b0}`, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>Calendar Background</div>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
            {CAL_BACKGROUNDS.map(bg => {
              const isActive = calBg === bg.value;
              return (
                <div
                  key={bg.id}
                  onClick={() => setCalBg(bg.value)}
                  className="btn-press"
                  style={{
                    height: 48, borderRadius: 10, cursor: "pointer",
                    background: bg.value === "transparent" ? T.bg2 : bg.value,
                    border: `2px solid ${isActive ? "#fff" : "transparent"}`,
                    boxShadow: isActive ? `0 0 0 3px ${rgba("#fff", 0.4)}` : "none",
                    position: "relative", overflow: "hidden", transition: "all 0.15s",
                  }}
                >
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", padding: "2px 4px", fontSize: 7, color: "#fff", fontWeight: 700, textAlign: "center", letterSpacing: ".3px", textTransform: "uppercase", ...FF }}>{bg.label}</div>
                  {isActive && <div style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderRadius: "50%", background: "#fff", boxShadow: "0 0 4px rgba(0,0,0,.5)" }} />}
                </div>
              );
            })}
          </div>
          {/* Custom hex / solid color */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", cursor: "pointer", padding: 2 }}
              onChange={e => setCalBg(e.target.value)}
            />
            <input
              placeholder="#hex or CSS gradient…"
              value={customHex}
              onChange={e => setCustomHex(e.target.value)}
              onKeyDown={e => e.key === "Enter" && customHex.trim() && setCalBg(customHex.trim())}
              style={{ flex: 1, background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "7px 10px", color: T.t0, fontSize: 12, outline: "none", ...FF }}
            />
            <button
              onClick={() => customHex.trim() && setCalBg(customHex.trim())}
              className="btn-press"
              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: T.bg2, color: T.t0, fontSize: 11, fontWeight: 600, cursor: "pointer", ...FF }}
            >Apply</button>
            <button
              onClick={() => { setCalBg("transparent"); setCustomHex(""); }}
              style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 11, cursor: "pointer", ...FF }}
            >Reset</button>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 10, ...FF }}>About</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t0, ...FF }}>Chronos Calendar</div>
        <div style={{ fontSize: 11, color: T.t2, marginTop: 2, ...FF }}>v2.0 · AI-Powered · Family &amp; Team</div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 8, ...FF }}>🏠 Family: {FAM_IDS.map(id => getProfile(id).name).join(", ")}</div>
      </div>
    </div>
  );
}
