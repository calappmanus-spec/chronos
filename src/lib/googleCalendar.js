// ─── Google Calendar integration ─────────────────────────────────────────────
// OAuth 2.0 PKCE flow for SPAs — no client secret needed.
// Requires VITE_GOOGLE_CLIENT_ID in .env
// User must add their domain as an authorized redirect URI in Google Cloud Console.

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/oauth/google` : "";
const SCOPES       = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

const TOKEN_KEY = "ch_gc_token";
const PKCE_KEY  = "ch_gc_pkce";

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
async function sha256(plain) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(plain));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function randomBase64(len = 43) {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "").slice(0, len);
}

// ─── Token management ─────────────────────────────────────────────────────────
function getGcToken()  { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; } }
function setGcToken(t) { t ? localStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : localStorage.removeItem(TOKEN_KEY); }

export function gcIsConnected() {
  const tok = getGcToken();
  if (!tok) return false;
  return tok.expiresAt > Date.now();
}

export function gcDisconnect() {
  setGcToken(null);
  localStorage.removeItem(PKCE_KEY);
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────
export async function gcStartAuth() {
  if (!CLIENT_ID) return { error: "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env" };

  const verifier  = randomBase64(64);
  const challenge = await sha256(verifier);
  const state     = randomBase64(16);

  localStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    response_type:         "code",
    scope:                 SCOPES,
    code_challenge:        challenge,
    code_challenge_method: "S256",
    state,
    access_type:           "offline",
    prompt:                "consent",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Called when the OAuth redirect returns to /oauth/google?code=...&state=...
export async function gcHandleCallback(code, returnedState) {
  const pkce = JSON.parse(localStorage.getItem(PKCE_KEY) || "null");
  if (!pkce) return { error: "No PKCE state — restart auth" };
  if (pkce.state !== returnedState) return { error: "State mismatch — possible CSRF" };

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
      code_verifier: pkce.verifier,
    }),
  });

  const data = await res.json();
  if (data.error) return { error: data.error_description || data.error };

  setGcToken({
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  });
  localStorage.removeItem(PKCE_KEY);
  return { ok: true };
}

async function gcRefresh() {
  const tok = getGcToken();
  if (!tok?.refreshToken) return false;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      refresh_token: tok.refreshToken,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) { gcDisconnect(); return false; }
  setGcToken({
    accessToken:  data.access_token,
    refreshToken: tok.refreshToken,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  });
  return true;
}

async function gcFetch(path, opts = {}) {
  let tok = getGcToken();
  if (!tok) return { data: null, error: "Not connected" };
  if (tok.expiresAt <= Date.now()) {
    const ok = await gcRefresh();
    if (!ok) return { data: null, error: "Token expired — reconnect Google Calendar" };
    tok = getGcToken();
  }
  try {
    const res  = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${tok.accessToken}`, "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: body?.error?.message || `HTTP ${res.status}` };
    return { data: body, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// ─── Calendar list ─────────────────────────────────────────────────────────────
export async function gcListCalendars() {
  const { data, error } = await gcFetch("/users/me/calendarList");
  if (error) return { calendars: [], error };
  return {
    calendars: (data.items || []).map(c => ({
      id:    c.id,
      name:  c.summary,
      color: c.backgroundColor || "#6366F1",
      primary: !!c.primary,
    })),
    error: null,
  };
}

// ─── Fetch events ─────────────────────────────────────────────────────────────
function gcEventToChronos(gev, calId, defaultUser) {
  const start = gev.start?.dateTime || gev.start?.date || "";
  const end   = gev.end?.dateTime   || gev.end?.date   || start;
  const allDay = !gev.start?.dateTime;
  const dateStr = start.slice(0, 10);
  const startTime = allDay ? "00:00" : start.slice(11, 16);
  const endTime   = allDay ? "01:00" : end.slice(11, 16);
  const id = `gc_${gev.id}`.replace(/[^a-z0-9_]/gi, "_").slice(0, 40);

  return {
    id, baseId: id,
    title:     gev.summary || "Google Event",
    date:      dateStr,
    start:     startTime,
    end:       endTime,
    allDay,
    notes:     gev.description || "",
    location:  gev.location    || "",
    url:       gev.htmlLink     || "",
    pids:      [defaultUser],
    organizer: defaultUser,
    recurring: !!gev.recurrence,
    recurrence: { freq: "weekly", interval: 1, days: [], until: "" },
    reminders: [],
    important: false,
    private:   gev.visibility === "private",
    attendees: { [defaultUser]: "accepted" },
    googleCalId:   calId,
    googleEventId: gev.id,
  };
}

export async function gcFetchEvents(calendarId = "primary", daysBack = 30, daysAhead = 90, defaultUser = "jeremy") {
  const tMin = new Date(Date.now() - daysBack  * 86400_000).toISOString();
  const tMax = new Date(Date.now() + daysAhead * 86400_000).toISOString();
  const params = new URLSearchParams({
    timeMin: tMin,
    timeMax: tMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "500",
  });

  const { data, error } = await gcFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  if (error) return { events: [], error };
  const events = (data.items || [])
    .filter(e => e.status !== "cancelled")
    .map(e => gcEventToChronos(e, calendarId, defaultUser));
  return { events, error: null };
}

// ─── Create event in Google Calendar ─────────────────────────────────────────
export async function gcCreateEvent(chronosEvent, calendarId = "primary") {
  const body = {
    summary:     chronosEvent.title,
    description: chronosEvent.notes    || "",
    location:    chronosEvent.location || "",
    start: chronosEvent.allDay
      ? { date: chronosEvent.date }
      : { dateTime: `${chronosEvent.date}T${chronosEvent.start}:00`, timeZone: "America/New_York" },
    end: chronosEvent.allDay
      ? { date: chronosEvent.date }
      : { dateTime: `${chronosEvent.date}T${chronosEvent.end}:00`,   timeZone: "America/New_York" },
  };
  return gcFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── Delete event in Google Calendar ─────────────────────────────────────────
export async function gcDeleteEvent(googleEventId, calendarId = "primary") {
  return gcFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`, {
    method: "DELETE",
  });
}

// ─── Sync state helpers ───────────────────────────────────────────────────────
const SYNC_KEY = "ch_gc_sync";

export function getGcSyncState() {
  try { return JSON.parse(localStorage.getItem(SYNC_KEY) || "{}"); } catch { return {}; }
}

export function setGcSyncState(state) {
  localStorage.setItem(SYNC_KEY, JSON.stringify({ ...getGcSyncState(), ...state }));
}

export function getGcSyncedCalendars() {
  return getGcSyncState().calendars || [];
}

export function setGcSyncedCalendars(cals) {
  setGcSyncState({ calendars: cals });
}
