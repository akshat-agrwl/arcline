import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  console.warn(
    "Supabase is not configured. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

// detectSessionInUrl (default true) lets supabase-js pick up the OAuth
// redirect tokens automatically when Google sends the user back.
export const supabase = createClient(url || "http://localhost", anonKey || "public-anon-key");
