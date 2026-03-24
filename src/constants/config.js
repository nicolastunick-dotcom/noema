export const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
export const ANTHROPIC_PROXY   = import.meta.env.DEV
  ? "https://api.anthropic.com/v1/messages"
  : "/.netlify/functions/claude";
export const MAX_HISTORY = 24;
export const ADMIN_CODES = (import.meta.env.VITE_ADMIN_CODES || "").split(",").map(c => c.trim()).filter(Boolean);
