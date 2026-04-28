import { useState, useEffect, useRef } from "react";
import { ArrowRight, Plus, ChevronLeft } from "lucide-react";
import { rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import { hashPin, verifyPin } from "../../lib/security.js";

const AVATAR_COLORS = [
  "#E05555","#9B5DE5","#0096C7","#F4881A","#2A9D8F","#4AA96C","#6366F1","#EC4899","#E8A020","#14B8A6",
];

function getAccounts() {
  try { return JSON.parse(localStorage.getItem("ch_accounts") || "[]"); } catch { return []; }
}
function saveAccounts(accounts) {
  localStorage.setItem("ch_accounts", JSON.stringify(accounts));
}
function setSession(userId) {
  localStorage.setItem("ch_session", JSON.stringify({ userId, loginAt: new Date().toISOString() }));
}
function clearSession() {
  localStorage.removeItem("ch_session");
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem("ch_session") || "null"); } catch { return null; }
}

// ─── PIN pad ──────────────────────────────────────────────────────────────────
function PinPad({ pin, setPin, maxLen = 6 }) {
  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div>
      {/* Dots */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
        {Array.from({ length: maxLen }, (_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", background: i < pin.length ? "#fff" : "transparent", transition: "background 0.15s" }} />
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 240, margin: "0 auto" }}>
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => {
              if (d === "⌫") setPin(p => p.slice(0, -1));
              else if (d === "") return;
              else if (pin.length < maxLen) setPin(p => p + d);
            }}
            disabled={d === ""}
            style={{ height: 52, borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.15)", background: d === "" ? "transparent" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: d === "⌫" ? 18 : 20, fontWeight: 500, cursor: d === "" ? "default" : "pointer", backdropFilter: "blur(4px)", transition: "background 0.12s", ...FF }}
            onMouseEnter={e => { if (d) e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { if (d) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sign In screen ────────────────────────────────────────────────────────────
function SignInScreen({ accounts, onSuccess, onRegister }) {
  const [selected, setSelected] = useState(null);
  const [pin,      setPin]      = useState("");
  const [error,    setError]    = useState("");
  const verifyingRef = useRef(false); // guard against double-fire in StrictMode

  // Auto-confirm: runs in useEffect so it fires once per pin value, not per render
  useEffect(() => {
    if (!selected || pin.length !== 6 || verifyingRef.current) return;
    const acc = accounts.find(a => a.id === selected);
    if (!acc) return;

    verifyingRef.current = true;
    verifyPin(pin, acc.pin || "").then(ok => {
      verifyingRef.current = false;
      if (!acc.pin || ok) {
        setSession(acc.id);
        onSuccess(acc.id);
      } else {
        setTimeout(() => { setError("Incorrect PIN"); setPin(""); }, 280);
      }
    });
  }, [pin, selected]); // eslint-disable-line

  async function tryLogin() {
    const acc = accounts.find(a => a.id === selected);
    if (!acc) return;
    if (acc.pin) {
      const ok = await verifyPin(pin, acc.pin);
      if (!ok) { setError("Incorrect PIN"); setPin(""); return; }
    }
    setSession(acc.id);
    onSuccess(acc.id);
  }

  const selectedAcc = accounts.find(a => a.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px" }}>
      {selected ? (
        <>
          <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 28, ...FF }}>
            <ChevronLeft size={14} /> Back
          </button>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: selectedAcc?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 10, boxShadow: `0 8px 24px ${rgba(selectedAcc?.color || "#fff", 0.35)}` }}>
            {selectedAcc?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Welcome back, {selectedAcc?.name}</div>
          {selectedAcc?.pin
            ? <>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Enter your PIN</div>
                <PinPad pin={pin} setPin={p => { setPin(p); setError(""); }} />
                {error && <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 14, fontWeight: 600 }}>{error}</div>}
              </>
            : <button onClick={tryLogin} style={{ marginTop: 24, padding: "13px 40px", borderRadius: 14, border: "none", background: selectedAcc?.color, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", ...FF }}>Continue</button>
          }
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24, textAlign: "center" }}>Choose your profile to continue</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => setSelected(acc.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)", ...FF }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: acc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 12px ${rgba(acc.color, 0.4)}` }}>
                  {acc.name[0].toUpperCase()}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{acc.name}</div>
                  {acc.email && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{acc.email}</div>}
                </div>
                <ArrowRight size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: "auto" }} />
              </button>
            ))}
          </div>
          <button onClick={onRegister} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20, padding: "10px 22px", borderRadius: 20, border: "1.5px dashed rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>
            <Plus size={14} /> Add new account
          </button>
        </>
      )}
    </div>
  );
}

// ─── Register screen ───────────────────────────────────────────────────────────
function RegisterScreen({ onSuccess, onBack }) {
  const [step,      setStep]      = useState(0); // 0=info, 1=pin, 2=confirm
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [color,     setColor]     = useState(AVATAR_COLORS[0]);
  const [pin,       setPin]       = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [skipPin,   setSkipPin]   = useState(false);
  const [error,     setError]     = useState("");
  const creatingRef = useRef(false);

  async function createAccount() {
    if (!name.trim() || creatingRef.current) return;
    if (!skipPin && pin !== confirm) { setError("PINs don't match"); setConfirm(""); return; }
    creatingRef.current = true;
    const id = name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString(36);
    const storedPin = skipPin ? "" : await hashPin(pin);
    const acc = { id, name: name.trim(), email: email.trim(), color, pin: storedPin, createdAt: new Date().toISOString() };
    const accounts = getAccounts();
    saveAccounts([...accounts, acc]);
    setSession(id);
    onSuccess(id);
  }

  // Auto-advance confirm PIN — useEffect to guard against StrictMode double-fire
  useEffect(() => {
    if (step !== 2 || confirm.length !== 6) return;
    if (confirm === pin) createAccount();
    else setTimeout(() => { setError("PINs don't match"); setConfirm(""); }, 280);
  }, [confirm, step]); // eslint-disable-line

  const inp = { width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", ...FF };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px", maxWidth: 360, margin: "0 auto", width: "100%" }}>
      {onBack && (
        <button onClick={onBack} style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 28, ...FF }}>
          <ChevronLeft size={14} /> Back
        </button>
      )}

      {step === 0 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Create your profile</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28, textAlign: "center" }}>Personalize your Chronos experience</div>

          <div style={{ width: "100%", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Your name</div>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={inp} />
          </div>
          <div style={{ width: "100%", marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Email (optional)</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
          </div>

          <div style={{ width: "100%", marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Your color</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", boxShadow: color === c ? `0 0 0 2px ${c}` : "none", transition: "all 0.15s" }} />
              ))}
            </div>
          </div>

          <button onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: name.trim() ? color : "rgba(255,255,255,0.2)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed", ...FF }}>
            Continue
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16, boxShadow: `0 8px 24px ${rgba(color, 0.4)}` }}>
            {name[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Set a PIN, {name}?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28, textAlign: "center" }}>Add a 6-digit PIN to secure your profile</div>
          <PinPad pin={pin} setPin={setPin} />
          {pin.length === 6 && (
            <button onClick={() => setStep(2)} style={{ marginTop: 18, width: "100%", maxWidth: 240, padding: "13px 0", borderRadius: 14, border: "none", background: color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", ...FF }}>
              Confirm PIN
            </button>
          )}
          <button onClick={() => { setSkipPin(true); createAccount(); }} style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", ...FF }}>
            Skip — no PIN needed
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Confirm your PIN</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Enter your PIN one more time</div>
          <PinPad pin={confirm} setPin={p => { setConfirm(p); setError(""); }} />
          {error && <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 14, fontWeight: 600 }}>{error}</div>}
        </>
      )}
    </div>
  );
}

// ─── Main AuthScreen ───────────────────────────────────────────────────────────
export default function AuthScreen({ onAuthenticated }) {
  const accounts = getAccounts();
  const [mode, setMode] = useState(accounts.length === 0 ? "register" : "signin");

  const bg = "linear-gradient(145deg,#0d0e18 0%,#1a1a2e 40%,#16213e 100%)";

  return (
    <div style={{ position: "fixed", inset: 0, background: bg, display: "flex", flexDirection: "column", overflowY: "auto", ...FF }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "5%", left: "60%", width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.08)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "70%", width: 240, height: 240, borderRadius: "50%", background: "rgba(224,85,85,0.07)", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Logo + branding */}
      <div style={{ textAlign: "center", padding: "52px 24px 32px", flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#6366F1,#E05555)", marginBottom: 16, boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}>
          <span style={{ fontSize: 34, fontWeight: 100, color: "#fff", letterSpacing: "-3px" }}>C</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 4 }}>Chronos</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: ".3px" }}>Your intelligent life calendar</div>
      </div>

      {/* Mode toggle */}
      {accounts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, flexShrink: 0 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: 3, gap: 2 }}>
            {[{ id:"signin", label:"Sign In" }, { id:"register", label:"Create Account" }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: "7px 18px", borderRadius: 10, border: "none", background: mode === m.id ? "rgba(255,255,255,0.12)" : "transparent", color: mode === m.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 40 }}>
        {mode === "signin"
          ? <SignInScreen accounts={accounts} onSuccess={onAuthenticated} onRegister={() => setMode("register")} />
          : <RegisterScreen onSuccess={onAuthenticated} onBack={accounts.length > 0 ? () => setMode("signin") : null} />
        }
      </div>
    </div>
  );
}

export { getAccounts, setSession, clearSession };
