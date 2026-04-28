// ─── Supabase integration — lightweight REST client ───────────────────────────
// Offline-first: localStorage is always source of truth.
// When VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set, data silently syncs.
// No npm package needed — uses the Supabase REST + Auth APIs directly.

const BASE_URL = import.meta.env.VITE_SUPABASE_URL  || "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = !!(BASE_URL && ANON_KEY);

// ─── Token management ─────────────────────────────────────────────────────────
const TOKEN_KEY = "ch_sb_token";
const USER_KEY  = "ch_sb_user";

function getToken()    { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; } }
function setToken(t)   { t ? localStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : localStorage.removeItem(TOKEN_KEY); }
function getLocalUser(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
function setLocalUser(u){ u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); }

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  const tok = getToken();
  return {
    "Content-Type": "application/json",
    "apikey": ANON_KEY,
    "Authorization": tok ? `Bearer ${tok.access_token}` : `Bearer ${ANON_KEY}`,
    ...extra,
  };
}

async function sbFetch(path, opts = {}) {
  if (!supabaseEnabled) return { data: null, error: "Supabase not configured" };
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers: { ...authHeaders(), ...(opts.headers || {}) },
    });
    const body = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
    if (!res.ok) return { data: null, error: body?.message || body?.error || `HTTP ${res.status}` };
    return { data: body, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export async function sbSignUp(email, password, name = "") {
  const { data, error } = await sbFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { name } }),
  });
  if (data?.access_token) {
    setToken({ access_token: data.access_token, refresh_token: data.refresh_token });
    setLocalUser({ id: data.user?.id, email, name });
  }
  return { data, error };
}

export async function sbSignIn(email, password) {
  const { data, error } = await sbFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.access_token) {
    setToken({ access_token: data.access_token, refresh_token: data.refresh_token });
    setLocalUser({ id: data.user?.id, email, name: data.user?.user_metadata?.name || "" });
  }
  return { data, error };
}

export async function sbRefreshToken() {
  const tok = getToken();
  if (!tok?.refresh_token) return { error: "No refresh token" };
  const { data, error } = await sbFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: tok.refresh_token }),
  });
  if (data?.access_token) {
    setToken({ access_token: data.access_token, refresh_token: data.refresh_token });
  }
  return { data, error };
}

export function sbSignOut() {
  setToken(null);
  setLocalUser(null);
}

export function sbGetUser() {
  return getLocalUser();
}

export function sbIsSignedIn() {
  return !!(supabaseEnabled && getToken());
}

// ─── REST API helpers ─────────────────────────────────────────────────────────
// Tables: events, tasks, goals, task_lists, user_data
// Schema: id (text PK), user_id (uuid FK), data (jsonb), updated_at (timestamptz)

async function rest(method, table, params = "", bodyOrNull = null) {
  const url = `/rest/v1/${table}${params}`;
  const opts = {
    method,
    headers: authHeaders({ "Prefer": method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal" }),
  };
  if (bodyOrNull) opts.body = JSON.stringify(bodyOrNull);
  return sbFetch(url, opts);
}

function row(item, userId) {
  return {
    id: item.id,
    user_id: userId,
    data: item,
    updated_at: new Date().toISOString(),
  };
}

// ─── Public sync API ──────────────────────────────────────────────────────────
export const sync = {
  async save(table, item) {
    if (!sbIsSignedIn()) return;
    const user = sbGetUser();
    if (!user?.id) return;
    const { error } = await rest("POST", table, "", row(item, user.id));
    if (error) console.warn(`[Chronos Sync] ${table}.save:`, error);
  },

  async remove(table, id) {
    if (!sbIsSignedIn()) return;
    const { error } = await rest("DELETE", table, `?id=eq.${encodeURIComponent(id)}`);
    if (error) console.warn(`[Chronos Sync] ${table}.remove:`, error);
  },

  async pull(table) {
    if (!sbIsSignedIn()) return null;
    const user = sbGetUser();
    if (!user?.id) return null;
    const { data, error } = await rest("GET", table, `?user_id=eq.${user.id}&order=updated_at.desc`);
    if (error) { console.warn(`[Chronos Sync] ${table}.pull:`, error); return null; }
    if (!Array.isArray(data)) return null;
    return data.map(r => r.data).filter(Boolean);
  },

  // Bulk upsert for initial push
  async bulkSave(table, items) {
    if (!sbIsSignedIn() || !items?.length) return;
    const user = sbGetUser();
    if (!user?.id) return;
    const rows = items.map(i => row(i, user.id));
    const { error } = await rest("POST", table, "", rows);
    if (error) console.warn(`[Chronos Sync] ${table}.bulkSave:`, error);
  },

  // Pull everything on sign-in
  async pullAll() {
    const [events, tasks, goals, lists] = await Promise.allSettled([
      this.pull("events"),
      this.pull("tasks"),
      this.pull("goals"),
      this.pull("task_lists"),
    ]);
    return {
      events:  events.status  === "fulfilled" ? events.value  : null,
      tasks:   tasks.status   === "fulfilled" ? tasks.value   : null,
      goals:   goals.status   === "fulfilled" ? goals.value   : null,
      lists:   lists.status   === "fulfilled" ? lists.value   : null,
    };
  },

  // Push everything on sign-in (first-time sync)
  async pushAll(state) {
    const user = sbGetUser();
    if (!user?.id) return;
    await Promise.allSettled([
      this.bulkSave("events",     state.events    || []),
      this.bulkSave("tasks",      state.tasks     || []),
      this.bulkSave("goals",      state.goals     || []),
      this.bulkSave("task_lists", state.taskLists || []),
    ]);
  },
};

// ─── Push notification subscription ──────────────────────────────────────────
// Stores VAPID push subscriptions per user so server can send push messages.
export async function storePushSub(subscription) {
  if (!sbIsSignedIn()) return;
  const user = sbGetUser();
  if (!user?.id) return;
  await rest("POST", "push_subs", "", {
    user_id: user.id,
    endpoint: subscription.endpoint,
    data: subscription.toJSON(),
    updated_at: new Date().toISOString(),
  });
}
