import { supabase } from "./supabase";

// The whole graph is one document. We store it as a single JSONB row per user
// (see supabase/schema.sql) — there is no query we ever run across events, so
// normalizing them into tables would be pure overhead.
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

const cacheKey = (userId) => `lifegraph.cache.${userId}`;

function readCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (raw) {
      const o = JSON.parse(raw);
      if (o && o.events && o.events.length) return o;
    }
  } catch (e) {}
  return null;
}

function writeCache(userId, state) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(state));
  } catch (e) {}
}

// Server is the source of truth. We mirror to localStorage so a reload paints
// instantly and the app still works offline. On network failure we fall back
// to the cache, then to the sample arc.
export async function loadGraph(userId) {
  const cached = readCache(userId);
  try {
    const { data, error } = await supabase
      .from("graphs")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data && data.data && data.data.events && data.data.events.length) {
      writeCache(userId, data.data);
      return data.data;
    }
    // No row yet (first sign-in): seed with cache if present, else the sample arc.
    return cached || defaultState();
  } catch (e) {
    console.warn("loadGraph: falling back to local cache", e);
    return cached || defaultState();
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
