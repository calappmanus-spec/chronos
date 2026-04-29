import { useState, useRef } from "react";
import { Eye, EyeOff, Plus, ChevronLeft, ArrowRight, Check } from "lucide-react";
import { rgba } from "../../utils.js";
import { FF } from "../../theme.js";
import { hashPin, verifyPin } from "../../lib/security.js";

// ─── Password strength ─────────────────────────────────────────────────────────
function passStrength(p) {
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}
const STRENGTH_LABEL = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLOR = ["", "#E05555", "#F4881A", "#E8A020", "#4AA96C", "#0096C7"];

const AVATAR_COLORS = [
  "#E05555","#9B5DE5","#0096C7","#F4881A","#2A9D8F","#4AA96C","#6366F1","#EC4899","#E8A020","#14B8A6",
];

// ─── localStorage helpers ──────────────────────────────────────────────────────
export function getAccounts() {
  try { return JSON.parse(localStorage.getItem("ch_accounts") || "[]"); } catch { return []; }
}
function saveAccounts(accounts) {
  localStorage.setItem("ch_accounts", JSON.stringify(accounts));
}
export function setSession(userId) {
  localStorage.setItem("ch_session", JSON.stringify({ userId, loginAt: new Date().toISOString() }));
}
export function clearSession() {
  localStorage.removeItem("ch_session");
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem("ch_session") || "null"); } catch { return null; }
}

// ─── Shared input style ────────────────────────────────────────────────────────
const baseInp = {
  width: "100%", background: "rgba(255,255,255,0.08)",
  border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12,
  padding: "13px 16px", color: "#fff", fontSize: 14, outline: "none",
  boxSizing: "border-box", transition: "border 0.15s",
};
const focusBorder = "rgba(99,102,241,0.7)";

// ─── Password field ────────────────────────────────────────────────────────────
function PasswordField({ value, onChange, placeholder = "Password", autoFocus, showStrength }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const str = showStrength ? passStrength(value) : 0;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...baseInp, ...FF, paddingRight: 44, borderColor: focused ? focusBorder : "rgba(255,255,255,0.15)" }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center" }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: str >= i ? STRENGTH_COLOR[str] : "rgba(255,255,255,0.12)", transition: "background 0.2s" }} />
            ))}
          </div>
          {str > 0 && <div style={{ fontSize: 10, color: STRENGTH_COLOR[str], marginTop: 3, fontWeight: 600, ...FF }}>{STRENGTH_LABEL[str]}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Sign In screen ────────────────────────────────────────────────────────────
function SignInScreen({ accounts, onSuccess, onRegister }) {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const signingRef = useRef(false);

  const selectedAcc = accounts.find(a => a.id === selected);

  async function handleLogin(e) {
    e?.preventDefault();
    if (!selectedAcc || signingRef.current) return;

    // Account with no password — log straight in
    if (!selectedAcc.pin) {
      setSession(selectedAcc.id);
      onSuccess(selectedAcc.id);
      return;
    }

    if (!password) { setError("Password required"); return; }
    signingRef.current = true;
    setLoading(true);
    const ok = await verifyPin(password, selectedAcc.pin);
    signingRef.current = false;
    setLoading(false);

    if (ok) {
      setSession(selectedAcc.id);
      onSuccess(selectedAcc.id);
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  }

  // Account picker
  if (!selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 24px" }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20, textAlign: "center" }}>Choose your profile</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
          {accounts.map(acc => (
            <button key={acc.id} onClick={() => { setSelected(acc.id); setError(""); setPassword(""); }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)", textAlign: "left", ...FF }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: acc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 16px ${rgba(acc.color, 0.4)}` }}>
                {(acc.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{acc.name}</div>
                {acc.email && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{acc.email}</div>}
              </div>
              <ArrowRight size={16} color="rgba(255,255,255,0.3)" />
            </button>
          ))}
        </div>
        <button onClick={onRegister} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, padding: "10px 22px", borderRadius: 20, border: "1.5px dashed rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>
          <Plus size={14} /> Add new account
        </button>
      </div>
    );
  }

  // Password entry
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 24px", maxWidth: 360, margin: "0 auto" }}>
      <button onClick={() => { setSelected(null); setPassword(""); setError(""); }}
        style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 28, ...FF }}>
        <ChevronLeft size={14} /> Back
      </button>

      {/* Avatar */}
      <div style={{ width: 68, height: 68, borderRadius: 22, background: selectedAcc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12, boxShadow: `0 8px 28px ${rgba(selectedAcc.color, 0.4)}` }}>
        {(selectedAcc.name || "?")[0].toUpperCase()}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Welcome back</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>{selectedAcc.name}</div>

      {selectedAcc.pin ? (
        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          <PasswordField value={password} onChange={v => { setPassword(v); setError(""); }} placeholder="Password" autoFocus />
          {error && <div style={{ fontSize: 12, color: "#FF6B6B", fontWeight: 600, textAlign: "center", ...FF }}>{error}</div>}
          <button type="submit" disabled={loading || !password}
            style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: password && !loading ? `linear-gradient(135deg, ${selectedAcc.color}, #6366F1)` : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: password && !loading ? "pointer" : "not-allowed", ...FF }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      ) : (
        <button onClick={handleLogin} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${selectedAcc.color}, #6366F1)`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", ...FF }}>
          Continue →
        </button>
      )}
    </div>
  );
}

// ─── Register screen ───────────────────────────────────────────────────────────
function RegisterScreen({ onSuccess, onBack }) {
  const [step,    setStep]    = useState(0); // 0=info, 1=password
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [color,   setColor]   = useState(AVATAR_COLORS[0]);
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const creatingRef = useRef(false);

  const [nameFocused,  setNameFocused]  = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  function validateEmail(e) { return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  async function createAccount() {
    if (creatingRef.current) return;
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!validateEmail(email.trim())) { setError("Enter a valid email"); return; }
    if (pass.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (pass !== confirm) { setError("Passwords don't match"); setConfirm(""); return; }

    const accounts = getAccounts();
    if (accounts.find(a => a.email?.toLowerCase() === email.trim().toLowerCase())) {
      setError("An account with this email already exists"); return;
    }

    creatingRef.current = true;
    setLoading(true);
    const id = name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString(36);
    const storedPin = await hashPin(pass);
    const acc = { id, name: name.trim(), email: email.trim(), color, pin: storedPin, createdAt: new Date().toISOString() };
    saveAccounts([...accounts, acc]);
    setSession(id);
    onSuccess(id);
  }

  const inpStyle = (focused) => ({
    ...baseInp, ...FF,
    borderColor: focused ? focusBorder : "rgba(255,255,255,0.15)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "0 24px", maxWidth: 380, margin: "0 auto", width: "100%" }}>
      {onBack && (
        <button onClick={onBack} style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 24, ...FF }}>
          <ChevronLeft size={14} /> Back
        </button>
      )}

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[0,1].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? "#6366F1" : "rgba(255,255,255,0.15)", transition: "all 0.25s" }} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Create your account</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 28, textAlign: "center" }}>Set up your Chronos profile</div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6, ...FF }}>Full name *</div>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name"
                onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}
                style={inpStyle(nameFocused)}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6, ...FF }}>Email *</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                style={inpStyle(emailFocused)}
              />
            </div>

            {/* Avatar color */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10, ...FF }}>Avatar color</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AVATAR_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{ width: 34, height: 34, borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", boxShadow: color === c ? `0 0 0 2px ${c}` : "none", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {color === c && <Check size={14} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 12, fontWeight: 600, ...FF }}>{error}</div>}

          <button onClick={() => { setError(""); if (!name.trim() || !email.trim()) { setError("Name and email are required"); return; } if (!validateEmail(email.trim())) { setError("Enter a valid email"); return; } setStep(1); }}
            style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", marginTop: 24, background: name.trim() && email.trim() ? `linear-gradient(135deg, ${color}, #6366F1)` : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", ...FF }}>
            Continue →
          </button>
        </>
      )}

      {step === 1 && (
        <>
          {/* Avatar preview */}
          <div style={{ width: 64, height: 64, borderRadius: 20, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 12, boxShadow: `0 8px 24px ${rgba(color, 0.4)}` }}>
            {name[0]?.toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Set your password</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 28, textAlign: "center" }}>Minimum 6 characters</div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6, ...FF }}>Password</div>
              <PasswordField value={pass} onChange={v => { setPass(v); setError(""); }} placeholder="Password" autoFocus showStrength />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6, ...FF }}>Confirm password</div>
              <PasswordField value={confirm} onChange={v => { setConfirm(v); setError(""); }} placeholder="Confirm password" />
            </div>
          </div>

          {error && <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 12, fontWeight: 600, textAlign: "center", ...FF }}>{error}</div>}

          <button onClick={createAccount} disabled={loading || pass.length < 6}
            style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", marginTop: 24, background: pass.length >= 6 && !loading ? `linear-gradient(135deg, ${color}, #6366F1)` : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: pass.length >= 6 && !loading ? "pointer" : "not-allowed", ...FF }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <button onClick={() => { setStep(0); setError(""); }} style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", ...FF }}>
            ← Back
          </button>
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
      <div style={{ position: "fixed", top: "5%", left: "60%", width: 340, height: 340, borderRadius: "50%", background: "rgba(99,102,241,0.07)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "70%", width: 260, height: 260, borderRadius: "50%", background: "rgba(224,85,85,0.06)", filter: "blur(70px)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", padding: "48px 24px 32px", flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#6366F1,#E05555)", marginBottom: 16, boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}>
          <span style={{ fontSize: 34, fontWeight: 100, color: "#fff", letterSpacing: "-3px" }}>C</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 4 }}>Chronos</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", letterSpacing: ".3px" }}>Your intelligent life calendar</div>
      </div>

      {/* Mode toggle */}
      {accounts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, flexShrink: 0 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 3, gap: 2 }}>
            {[{ id:"signin", label:"Sign In" }, { id:"register", label:"New Account" }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ padding: "7px 20px", borderRadius: 10, border: "none", background: mode === m.id ? "rgba(255,255,255,0.12)" : "transparent", color: mode === m.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", ...FF }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 48 }}>
        {mode === "signin"
          ? <SignInScreen accounts={accounts} onSuccess={onAuthenticated} onRegister={() => setMode("register")} />
          : <RegisterScreen onSuccess={onAuthenticated} onBack={accounts.length > 0 ? () => setMode("signin") : null} />
        }
      </div>
    </div>
  );
}
