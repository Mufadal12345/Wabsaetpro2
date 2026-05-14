import { createClient } from "@supabase/supabase-js";

// Note: Values can be configured in .env, but defaults are provided as requested
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zhvwwxossnddrtthkzks.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_oElJPoVECQ4VW5SFVohcrw_tA1hqL-M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
