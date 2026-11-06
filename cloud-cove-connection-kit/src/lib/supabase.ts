import { createClient } from "@supabase/supabase-js";

// Publishable (public) key — safe to ship to the browser. Data is protected by RLS.
const url = import.meta.env["VITE_SUPABASE_URL"] || "https://uibdxjuisozexfwkuljq.supabase.co";
const key =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] || "sb_publishable_Hzob2qyg5Sk3z6ZLNuLQ8w_WQGad0eT";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: typeof window !== "undefined",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
