export const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
// Appel direct à la fonction Netlify — fonctionne en dev (netlify dev :8888)
// et en production sans dépendre du redirect /api/* de netlify.toml.
export const ANTHROPIC_PROXY   = "/.netlify/functions/claude";
export const MAX_HISTORY = 24;
