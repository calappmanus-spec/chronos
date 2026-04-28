import { useState, useEffect } from "react";
import { X, RefreshCw, Check, AlertCircle, Calendar, Trash2, Unlink } from "lucide-react";
import { FF } from "../../theme.js";
import { rgba } from "../../utils.js";
import {
  gcIsConnected, gcStartAuth, gcDisconnect,
  gcListCalendars, gcFetchEvents,
  getGcSyncedCalendars, setGcSyncedCalendars,
} from "../../lib/googleCalendar.js";

const CLIENT_ID_SET = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function GoogleCalendarSync({ T, accent, currentUser, onImportEvents, onClose }) {
  const [connected,   setConnected]   = useState(gcIsConnected);
  const [cals,        setCals]        = useState([]);
  const [synced,      setSynced]      = useState(getGcSyncedCalendars);
  const [loading,     setLoading]     = useState(false);
  const [syncMsg,     setSyncMsg]     = useState("");
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (connected) loadCalendars();
  }, [connected]);

  async function loadCalendars() {
    setLoading(true); setError("");
    const { calendars, error: err } = await gcListCalendars();
    setLoading(false);
    if (err) { setError(err); return; }
    setCals(calendars);
  }

  function toggleCal(id) {
    setSynced(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      setGcSyncedCalendars(next);
      return next;
    });
  }

  async function handleSync() {
    if (!synced.length) { setError("Select at least one calendar to sync."); return; }
    setLoading(true); setError(""); setSyncMsg("");
    let total = 0;
    const allEvents = [];
    for (const calId of synced) {
      const { events, error: err } = await gcFetchEvents(calId, 30, 90, currentUser);
      if (err) { setError(`${calId}: ${err}`); setLoading(false); return; }
      allEvents.push(...events);
      total += events.length;
    }
    if (onImportEvents && allEvents.length) onImportEvents(allEvents);
    setSyncMsg(`Synced ${total} event${total !== 1 ? "s" : ""}`);
    setLoading(false);
    setTimeout(() => setSyncMsg(""), 5000);
  }

  function handleDisconnect() {
    gcDisconnect();
    setConnected(false);
    setCals([]);
    setSynced([]);
    setGcSyncedCalendars([]);
  }

  const ovStyle = {
    position: "fixed", inset: 0, zIndex: 900,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
  };
  const sheetStyle = {
    background: T.bg, border: `1px solid ${T.b1}`, borderRadius: 20,
    width: "min(420px, 94vw)", maxHeight: "80vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
  };

  return (
    <div style={ovStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheetStyle}>
        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.b1}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: rgba("#4285F4", 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Calendar size={18} color="#4285F4" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.t0, ...FF }}>Google Calendar</div>
            <div style={{ fontSize: 11, color: T.t2, ...FF }}>
              {connected ? "Connected — select calendars to sync" : "Connect to import your events"}
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.b1}`, background: "transparent", cursor: "pointer", color: T.t2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {/* Not configured */}
          {!CLIENT_ID_SET && (
            <div style={{ padding: "14px 16px", background: rgba("#F4881A", 0.08), border: `1px solid ${rgba("#F4881A", 0.25)}`, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#F4881A", marginBottom: 4, ...FF }}>Setup Required</div>
              <div style={{ fontSize: 12, color: T.t1, lineHeight: 1.5, ...FF }}>
                Add <code style={{ background: T.bg2, padding: "1px 5px", borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID=your-id</code> to your <code style={{ background: T.bg2, padding: "1px 5px", borderRadius: 4 }}>.env</code> file, then configure your Google Cloud Console project with this redirect URI:
              </div>
              <div style={{ marginTop: 8, padding: "6px 10px", background: T.bg2, borderRadius: 8, fontSize: 11, fontFamily: "monospace", color: T.t1, wordBreak: "break-all" }}>
                {window.location.origin}/oauth/google
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: rgba("#E05555", 0.08), border: `1px solid ${rgba("#E05555", 0.2)}`, borderRadius: 10, marginBottom: 12 }}>
              <AlertCircle size={14} color="#E05555" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#E05555", ...FF }}>{error}</span>
            </div>
          )}

          {/* Not connected */}
          {!connected && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 13, color: T.t2, marginBottom: 20, lineHeight: 1.6, ...FF }}>
                Connect your Google account to import events from Google Calendar into Chronos.
                Your data stays on your device.
              </div>
              <button
                onClick={() => CLIENT_ID_SET ? gcStartAuth() : setError("Add VITE_GOOGLE_CLIENT_ID to .env first")}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 12, border: "none", background: "#4285F4", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", ...FF }}
              >
                <GoogleIcon size={18} />
                Connect Google Calendar
              </button>
            </div>
          )}

          {/* Connected — calendar list */}
          {connected && (
            <>
              {loading && !cals.length && (
                <div style={{ textAlign: "center", padding: 20, color: T.t2, fontSize: 13, ...FF }}>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
                  <div>Loading calendars…</div>
                </div>
              )}

              {cals.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10, ...FF }}>
                    Your Calendars — select to sync
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {cals.map(cal => {
                      const on = synced.includes(cal.id);
                      return (
                        <div key={cal.id}
                          onClick={() => toggleCal(cal.id)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${on ? rgba(cal.color, 0.4) : T.b1}`, background: on ? rgba(cal.color, 0.06) : T.bg1, cursor: "pointer", transition: "all 0.15s" }}
                        >
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: cal.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: on ? 600 : 400, color: T.t0, ...FF }}>
                            {cal.name}
                            {cal.primary && <span style={{ marginLeft: 6, fontSize: 10, color: T.t3 }}>(primary)</span>}
                          </span>
                          {on && <Check size={14} color={cal.color} strokeWidth={2.5} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sync button */}
              {synced.length > 0 && (
                <button onClick={handleSync} disabled={loading}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 11, border: "none", background: loading ? rgba("#4285F4", 0.5) : "#4285F4", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...FF }}>
                  {loading ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={15} />}
                  {loading ? "Syncing…" : `Sync ${synced.length} Calendar${synced.length !== 1 ? "s" : ""}`}
                </button>
              )}

              {syncMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "center" }}>
                  <Check size={14} color="#4AA96C" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, color: "#4AA96C", ...FF }}>{syncMsg}</span>
                </div>
              )}

              {/* Disconnect */}
              <button onClick={handleDisconnect}
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, padding: "8px 12px", borderRadius: 8, border: `1px solid ${rgba("#E05555", 0.3)}`, background: "transparent", color: "#E05555", fontSize: 12, cursor: "pointer", ...FF }}>
                <Unlink size={13} /> Disconnect Google Calendar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.7C34.1 33.5 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.9 0 20-7.9 20-21 0-1.4-.1-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.1 16.3 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.6 5.1 29.6 3 24 3 16.2 3 9.4 7.9 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 45c5.5 0 10.5-1.9 14.4-5.1L32 33.9C29.9 35.3 27.1 36 24 36c-5.6 0-10.3-3.5-12-8.5l-7 5.4C8.9 40.9 15.8 45 24 45z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.7c-.8 2.4-2.4 4.4-4.4 5.8l.1.1 6.4 5C41 36.8 44.5 31 44.5 24c0-1.4-.1-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}
