import { supabase } from "./supabase";

// The whole graph is one document. For signed-in users it's a single JSONB row
// per user (see supabase/schema.sql); anonymous users keep it in localStorage
// until they sign in, at which point it's migrated to their account.
// A neutral, illustrative starter arc — meant to be edited/replaced, not to
// describe any real person. Shows the green-up / red-down line at a glance.
const DEFAULT_EVENTS = [
  { id: "e1", title: "Born",            note: "the beginning", age: 0,  sat: 55 },
  { id: "e2", title: "Childhood",       note: "early years",   age: 7,  sat: 74 },
  { id: "e3", title: "School years",    note: "",              age: 15, sat: 58 },
  { id: "e4", title: "A low point",     note: "",              age: 20, sat: 30 },
  { id: "e5", title: "Turning point",   note: "",              age: 24, sat: 66 },
  { id: "e6", title: "Today",           note: "where I am now", age: 28, sat: 82 },
];

export function defaultState() {
  return {
    events: DEFAULT_EVENTS,
    title: "My life, so far",
    subtitle: "how full each chapter felt — tap a moment to edit it",
  };
}

const valid = (s) => s && Array.isArray(s.events) && s.events.length > 0;

// ---- anonymous (pre–sign-in) storage ----
const LOCAL_KEY = "lifegraph.local.v1";

export function loadLocal() {
  try {
    const o = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (valid(o)) return o;
  } catch (e) {}
  return null;
}

export function saveLocal(state) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) {}
}

// ---- authenticated per-user cache (fast paint + offline) ----
const cacheKey = (userId) => `lifegraph.cache.${userId}`;

function readCache(userId) {
  try {
    const o = JSON.parse(localStorage.getItem(cacheKey(userId)));
    if (valid(o)) return o;
  } catch (e) {}
  return null;
}

function writeCache(userId, state) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(state)); } catch (e) {}
}

// Resolve the graph to show right after a user is signed in.
// - If their account already has a graph, that wins (their synced data).
// - If not (first sign-in), seed it from whatever they built anonymously,
//   migrating that local graph up to the account.
export async function resolveForUser(userId) {
  try {
    const { data, error } = await supabase
      .from("graphs")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (valid(data && data.data)) {
      writeCache(userId, data.data);
      return data.data;
    }
    // No account row yet → migrate the anonymous/local graph (or sample arc).
    const seed = loadLocal() || readCache(userId) || defaultState();
    await saveGraph(userId, seed);
    return seed;
  } catch (e) {
    console.warn("resolveForUser: falling back to local cache", e);
    return readCache(userId) || loadLocal() || defaultState();
  }
}

export async function saveGraph(userId, state) {
  writeCache(userId, state);
  try {
    const { error } = await supabase.from("graphs").upsert({
      user_id: userId,
      data: state,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (e) {
    console.error("saveGraph failed (kept in local cache)", e);
  }
}
