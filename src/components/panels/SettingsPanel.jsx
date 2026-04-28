import { useState, useRef } from "react";
import { ChevronDown, MapPin, Download, Upload, Smartphone, KeyRound, Eye, EyeOff, Moon, Sunset, Zap, Bot, CalendarClock, Utensils, Sparkles, Users, Wind, MonitorOff, Cloud, RefreshCw, Calendar } from "lucide-react";
import { FAM_IDS, CAL_BACKGROUNDS } from "../../constants.js";
import { rgba, getProfile } from "../../utils.js";
import { FF } from "../../theme.js";
import Toggle from "../atoms/Toggle.jsx";
import { downloadIcal, importFromIcal } from "../../lib/ical.js";
import { sbIsSignedIn, sbSignIn, sbSignUp, sbSignOut, sbGetUser, sync, supabaseEnabled } from "../../lib/supabase.js";
import { gcIsConnected, gcStartAuth, gcDisconnect } from "../../lib/googleCalendar.js";

export default function SettingsPanel({ darkMode, setDarkMode, sleepMode, setSleepMode, focusMode, setFocusMode, zenMode, setZenMode, screensaver, setScreensaver, T, calBg, setCalBg, isBgDark = true, weatherLocation = "Charlotte, NC", setWeatherLocation, pwaPrompt, setPwaPrompt, onImportEvents, allEvents = [], onShowGoogleSync }) {
  const hasBg = calBg !== "transparent";
  const onBg0 = hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0;
  const onBg2 = hasBg ? (isBgDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)") : T.t2;

  const [customHex,  setCustomHex]  = useState("");
  const [bgOpen,     setBgOpen]     = useState(false);
  const [locDraft,   setLocDraft]   = useState(weatherLocation);
  const [importMsg,  setImportMsg]  = useState("");
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("ch_ai_provider") || "anthropic");
  const [aiKey,      setAiKey]      = useState(() => localStorage.getItem("ch_ai_key") || "");
  const [aiKeyDraft, setAiKeyDraft] = useState("");
  const [showKey,    setShowKey]    = useState(false);
  const [aiSaveMsg,  setAiSaveMsg]  = useState("");
  // Supabase
  const [sbEmail,    setSbEmail]    = useState("");
  const [sbPass,     setSbPass]     = useState("");
  const [sbMsg,      setSbMsg]      = useState("");
  const [sbLoading,  setSbLoading]  = useState(false);
  const [sbSignedIn, setSbSignedIn] = useState(() => sbIsSignedIn());
  const [gcConn,     setGcConn]     = useState(() => gcIsConnected());
  const icsRef = useRef(null);

  const hasKey = aiKey.length > 8;
  const currentBg = CAL_BACKGROUNDS.find(b => b.value === calBg);

  function saveAIKey() {
    const k = aiKeyDraft.trim();
    if (!k) return;
    localStorage.setItem("ch_ai_key", k);
    localStorage.setItem("ch_ai_provider", aiProvider);
    setAiKey(k);
    setAiKeyDraft("");
    setAiSaveMsg("saved");
    setTimeout(() => setAiSaveMsg(""), 3000);
  }
  function clearAIKey() {
    localStorage.removeItem("ch_ai_key");
    setAiKey("");
    setAiKeyDraft("");
    setAiSaveMsg("removed");
    setTimeout(() => setAiSaveMsg(""), 3000);
  }

  const inp = { background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 8, padding: "8px 10px", color: T.t0, fontSize: 12, outline: "none", boxSizing: "border-box", ...FF };
  const SectionLabel = ({ text }) => (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 12, ...FF }}>{text}</div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, ...FF }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: onBg0, marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 13, color: onBg2, marginBottom: 20 }}>Customize Chronos.</div>

      {/* ── Display Modes ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.b0}`, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>Display Modes</div>
        {[
          { Icon: Moon,       label: "Night Mode",   desc: "Dark theme throughout the app",         on: darkMode,    set: () => setDarkMode(v => !v),    acc: "#6366F1" },
          { Icon: Sunset,     label: "Sleep Mode",   desc: "Bedside clock, weather & tomorrow",     on: sleepMode,   set: () => setSleepMode(v => !v),   acc: "#9B5DE5" },
          { Icon: Zap,        label: "Focus Mode",   desc: "Minimal display — clock + next event",  on: focusMode,   set: () => setFocusMode(v => !v),   acc: "#E05555" },
          { Icon: Wind,       label: "Zen Mode",     desc: "Breathing guide + ambient display",      on: zenMode,     set: () => setZenMode(v => !v),     acc: "#2A9D8F" },
          { Icon: MonitorOff, label: "Screensaver",  desc: "Auto-activates after 5 min idle",        on: screensaver, set: () => setScreensaver(v => !v), acc: "#F4881A" },
        ].map((item, i, arr) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.b0}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: rgba(item.acc, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.Icon size={17} color={item.acc} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t0, ...FF }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.t2, ...FF }}>{item.desc}</div>
              </div>
            </div>
            <Toggle on={item.on} toggle={item.set} accent={item.acc} />
          </div>
        ))}
      </div>

      {/* ── App Theme ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.b0}`, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>App Theme</div>
        <div style={{ padding: 14 }}>
          <button onClick={() => setBgOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: calBg === "transparent" ? T.bg2 : calBg, border: `1px solid ${T.b1}`, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600, color: T.t0, ...FF }}>{currentBg?.label ?? "Custom"}</span>
            <ChevronDown size={14} color={T.t2} style={{ transform: bgOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease", flexShrink: 0 }} />
          </button>
          {bgOpen && (
            <div style={{ marginTop: 6, border: `1px solid ${T.b1}`, borderRadius: 10, overflow: "hidden" }}>
              {CAL_BACKGROUNDS.map((bg, i) => {
                const isActive = calBg === bg.value;
                return (
                  <div key={bg.id} onClick={() => { setCalBg(bg.value); setBgOpen(false); setCustomHex(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: isActive ? rgba(T.t0, 0.06) : T.bg1, borderBottom: i < CAL_BACKGROUNDS.length - 1 ? `1px solid ${T.b0}` : "none", cursor: "pointer" }}>
                    <div style={{ width: 28, height: 22, borderRadius: 6, background: bg.value === "transparent" ? T.bg2 : bg.value, border: `1px solid ${T.b1}`, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? T.t0 : T.t1, ...FF }}>{bg.label}</span>
                    {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.t0, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <input type="color" style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", cursor: "pointer", padding: 2, flexShrink: 0 }} onChange={e => { setCalBg(e.target.value); setBgOpen(false); }} />
            <input placeholder="#hex or CSS gradient…" value={customHex} onChange={e => setCustomHex(e.target.value)} onKeyDown={e => e.key === "Enter" && customHex.trim() && setCalBg(customHex.trim())} style={{ flex: 1, ...inp }} />
            <button onClick={() => customHex.trim() && setCalBg(customHex.trim())} className="btn-press" style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: T.bg2, color: T.t0, fontSize: 11, fontWeight: 600, cursor: "pointer", ...FF }}>Apply</button>
            <button onClick={() => { setCalBg("transparent"); setCustomHex(""); setBgOpen(false); }} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 11, cursor: "pointer", ...FF }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Weather Location ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
        <SectionLabel text="Weather Location" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <MapPin size={14} color={T.t2} style={{ flexShrink: 0 }} />
          <input value={locDraft} onChange={e => setLocDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && setWeatherLocation && setWeatherLocation(locDraft)} placeholder="City, State or City, Country" style={{ flex: 1, ...inp }} />
          <button onClick={() => setWeatherLocation && setWeatherLocation(locDraft)} className="btn-press" style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: T.bg2, color: T.t0, fontSize: 11, fontWeight: 600, cursor: "pointer", ...FF }}>Save</button>
        </div>
        <div style={{ fontSize: 10, color: T.t3, marginTop: 8, ...FF }}>Location display only — weather uses GPS coordinates</div>
      </div>

      {/* ── Calendar Import / Export ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
        <SectionLabel text="Calendar Import &amp; Export" />
        <input ref={icsRef} type="file" accept=".ics" style={{ display: "none" }} onChange={e => {
          const file = e.target.files?.[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            const evs = importFromIcal(ev.target.result);
            if (onImportEvents) { onImportEvents(evs); setImportMsg(`Imported ${evs.length} event${evs.length !== 1 ? "s" : ""}`); }
            setTimeout(() => setImportMsg(""), 4000);
            e.target.value = "";
          };
          reader.readAsText(file);
        }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => icsRef.current?.click()} className="btn-press"
            style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "10px 0", borderRadius: 10, border: `1px dashed ${T.b1}`, background: "transparent", color: T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
            <Download size={14} /> Import .ics
          </button>
          <button onClick={() => downloadIcal(allEvents)} className="btn-press"
            style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "10px 0", borderRadius: 10, border: `1px solid ${T.b1}`, background: T.bg1, color: T.t1, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
            <Upload size={14} /> Export .ics
          </button>
        </div>
        {importMsg && <div style={{ fontSize: 11, color: T.t2, marginTop: 8, textAlign: "center", ...FF }}>{importMsg}</div>}
        <div style={{ fontSize: 10, color: T.t3, marginTop: 8, ...FF }}>Export all {allEvents.length} event{allEvents.length !== 1 ? "s" : ""} to a standard .ics file</div>
      </div>

      {/* ── Google Calendar ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Calendar size={14} color="#4285F4" />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>Google Calendar</div>
          {gcConn && <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(66,133,244,0.12)", color: "#4285F4", ...FF }}>Connected</div>}
        </div>
        {gcConn ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onShowGoogleSync?.()} className="btn-press"
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "10px 0", borderRadius: 10, border: "none", background: "#4285F4", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...FF }}>
              <RefreshCw size={13} /> Sync Now
            </button>
            <button onClick={() => { gcDisconnect(); setGcConn(false); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 12, cursor: "pointer", ...FF }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={() => { gcStartAuth(); }} className="btn-press"
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center", padding: "11px 0", borderRadius: 10, border: "none", background: "#4285F4", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", ...FF }}>
            <Calendar size={14} /> Connect Google Calendar
          </button>
        )}
        <div style={{ fontSize: 10, color: T.t3, marginTop: 8, ...FF }}>
          Import events from Google Calendar. Requires VITE_GOOGLE_CLIENT_ID in .env
        </div>
      </div>

      {/* ── Cloud Sync (Supabase) ── */}
      {supabaseEnabled && (
        <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Cloud size={14} color="#6366F1" />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>Cloud Sync</div>
            {sbSignedIn && <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(99,102,241,0.12)", color: "#6366F1", ...FF }}>Syncing</div>}
          </div>
          {sbSignedIn ? (
            <div>
              <div style={{ fontSize: 12, color: T.t1, marginBottom: 10, ...FF }}>
                Signed in as <strong>{sbGetUser()?.email}</strong>
              </div>
              <button onClick={async () => { sbSignOut(); setSbSignedIn(false); setSbMsg("Signed out"); }} style={{ fontSize: 11, color: "#E05555", background: "none", border: `1px solid ${rgba("#E05555", 0.3)}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", ...FF }}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="email" placeholder="Email" value={sbEmail} onChange={e => setSbEmail(e.target.value)}
                style={{ ...inp, width: "100%" }} />
              <input type="password" placeholder="Password" value={sbPass} onChange={e => setSbPass(e.target.value)}
                style={{ ...inp, width: "100%" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  setSbLoading(true); setSbMsg("");
                  const { error } = await sbSignIn(sbEmail, sbPass);
                  setSbLoading(false);
                  if (error) { setSbMsg(typeof error === "string" ? error : error.message || "Sign in failed"); }
                  else { setSbSignedIn(true); setSbMsg("Signed in!"); setSbEmail(""); setSbPass(""); }
                }} disabled={sbLoading || !sbEmail || !sbPass} className="btn-press"
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...FF }}>
                  {sbLoading ? "…" : "Sign In"}
                </button>
                <button onClick={async () => {
                  setSbLoading(true); setSbMsg("");
                  const { error } = await sbSignUp(sbEmail, sbPass);
                  setSbLoading(false);
                  if (error) { setSbMsg(typeof error === "string" ? error : error.message || "Sign up failed"); }
                  else { setSbSignedIn(true); setSbMsg("Account created!"); setSbEmail(""); setSbPass(""); }
                }} disabled={sbLoading || !sbEmail || !sbPass} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", color: T.t0, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
                  {sbLoading ? "…" : "Sign Up"}
                </button>
              </div>
              {sbMsg && <div style={{ fontSize: 11, color: sbMsg.includes("!") ? "#4AA96C" : "#E05555", ...FF }}>{sbMsg}</div>}
            </div>
          )}
        </div>
      )}

      {/* ── PWA Install ── */}
      {pwaPrompt && (
        <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
          <SectionLabel text="Install App" />
          <button onClick={async () => { pwaPrompt.prompt(); const { outcome } = await pwaPrompt.userChoice; if (outcome === "accepted") setPwaPrompt?.(null); }} className="btn-press"
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center", padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366F1,#9B5DE5)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", ...FF }}>
            <Smartphone size={15} /> Add Chronos to Home Screen
          </button>
        </div>
      )}

      {/* ── AI Provider & Features ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <KeyRound size={14} color={T.t2} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, ...FF }}>AI Provider</div>
          <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: hasKey ? "rgba(74,169,108,0.12)" : "rgba(244,136,26,0.12)", color: hasKey ? "#4AA96C" : "#F4881A", ...FF }}>
            {hasKey ? "Connected" : "No key"}
          </div>
        </div>

        {/* Provider picker */}
        <div style={{ display: "flex", background: T.bg1, borderRadius: 10, padding: 3, marginBottom: 12, gap: 2 }}>
          {[
            { id: "anthropic", label: "Claude", sub: "Anthropic", color: "#F4881A" },
            { id: "openai",    label: "ChatGPT", sub: "OpenAI",   color: "#4AA96C" },
          ].map(p => {
            const active = aiProvider === p.id;
            return (
              <button key={p.id} onClick={() => { setAiProvider(p.id); localStorage.setItem("ch_ai_provider", p.id); }}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "none", background: active ? rgba(p.color, 0.18) : "transparent", cursor: "pointer", textAlign: "left", ...FF }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? p.color : T.t2 }}>{p.label}</div>
                <div style={{ fontSize: 10, color: active ? rgba(p.color, 0.7) : T.t3 }}>{p.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Saved key row */}
        {hasKey && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: rgba("#4AA96C", 0.07), border: `1px solid ${rgba("#4AA96C", 0.2)}`, borderRadius: 8, marginBottom: 10 }}>
            <KeyRound size={12} color="#4AA96C" />
            <span style={{ fontSize: 11, color: T.t1, flex: 1, ...FF }}>Key ending in …{aiKey.slice(-4)}</span>
            <button onClick={clearAIKey} style={{ fontSize: 10, color: "#E05555", background: "none", border: "none", cursor: "pointer", ...FF }}>Remove</button>
          </div>
        )}

        {/* Key input */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input type={showKey ? "text" : "password"} placeholder={hasKey ? "Paste new key to replace…" : `Paste your ${aiProvider === "anthropic" ? "Anthropic" : "OpenAI"} API key…`}
              value={aiKeyDraft} onChange={e => setAiKeyDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && saveAIKey()}
              style={{ ...inp, width: "100%", padding: "8px 36px 8px 10px" }} />
            <button onClick={() => setShowKey(v => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.t3, display: "flex" }}>
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button onClick={saveAIKey} disabled={!aiKeyDraft.trim()} className="btn-press"
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: aiKeyDraft.trim() ? (aiProvider === "anthropic" ? "#F4881A" : "#4AA96C") : "rgba(128,128,128,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, ...FF }}>
            Save
          </button>
        </div>
        <div style={{ fontSize: 11, color: T.t2, marginBottom: aiSaveMsg ? 6 : 0, ...FF }}>
          Get your key at{" "}
          <a href={aiProvider === "anthropic" ? "https://console.anthropic.com" : "https://platform.openai.com/api-keys"} target="_blank" rel="noreferrer" style={{ color: aiProvider === "anthropic" ? "#F4881A" : "#4AA96C", ...FF }}>
            {aiProvider === "anthropic" ? "console.anthropic.com" : "platform.openai.com"}
          </a>
        </div>
        {aiSaveMsg && <div style={{ fontSize: 11, color: aiSaveMsg === "saved" ? "#4AA96C" : T.t2, marginTop: 6, ...FF }}>Key {aiSaveMsg} {aiSaveMsg === "saved" ? "— AI features are now active" : ""}</div>}

        {/* AI Features grid */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.b0}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: T.t3, marginBottom: 10, ...FF }}>What your key unlocks</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { Icon: Bot,          label: "AI Event Creation",    desc: "Natural language to events" },
              { Icon: Utensils,     label: "Meal Planner AI",      desc: "Weekly meals with recipes"  },
              { Icon: Sparkles,     label: "Schedule Optimizer",   desc: "Smarter scheduling tips"    },
              { Icon: CalendarClock,label: "Smart Time Slots",     desc: "Best time suggestions"      },
            ].map(({ Icon, label, desc }) => (
              <div key={label} style={{ padding: "10px 11px", background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <Icon size={13} color={hasKey ? "#6366F1" : T.t3} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: hasKey ? T.t0 : T.t2, ...FF }}>{label}</span>
                </div>
                <div style={{ fontSize: 10, color: T.t3, ...FF }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── About ── */}
      <div style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: 16, padding: "14px 16px" }}>
        <SectionLabel text="About" />
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t0, ...FF }}>Chronos Calendar</div>
        <div style={{ fontSize: 11, color: T.t2, marginTop: 2, ...FF }}>v2.0 · AI-Powered · Family & Team</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.t3, marginTop: 8, ...FF }}>
          <Users size={12} color={T.t3} />
          Family: {FAM_IDS.map(id => getProfile(id).name).join(", ")}
        </div>
      </div>
    </div>
  );
}

