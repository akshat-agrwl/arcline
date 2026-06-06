import { supabase } from "./supabase";

// The whole graph is one document. For signed-in users it's a single JSONB row
// per user (see supabase/schema.sql); anonymous users keep it in localStorage
// until they sign in, at which point it's migrated to their account.
const DEFAULT_EVENTS = [
  { id: "e1", title: "Born",                    note: "the beginning", age: 0,  sat: 56 },
  { id: "e2", title: "Started school",          note: "age 5",         age: 5,  sat: 70 },
  { id: "e3", title: "Most popular in class",   note: "8th grade",     age: 13, sat: 93 },
  { id: "e4", title: "Started college",         note: "age 18",        age: 18, sat: 75 },
  { id: "e5", title: "Low self-esteem",         note: "3rd year",      age: 20, sat: 25 },
  { id: "e6", title: "Started my job",          note: "age 22",        age: 22, sat: 63 },
  { id: "e7", title: "First international trip", note: "today",         age: 25, sat: 90 },
];

export function defaultState() {
  return {
    events: DEFAULT_EVENTS,
    title: "My life, so far",
    subtitle: "how full each chapter felt — drag a point to set the feeling",
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
