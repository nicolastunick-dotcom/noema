-- ─────────────────────────────────────────────────────────────
-- NOEMA — Supabase Schema
-- Coller dans : Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

-- Historique de chaque session de conversation
CREATE TABLE IF NOT EXISTS sessions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  ended_at    timestamptz,
  history     jsonb DEFAULT '[]',
  insights    jsonb DEFAULT '{}',
  ikigai      jsonb DEFAULT '{}',
  step        integer DEFAULT 0,
  session_note text DEFAULT ''
);

-- Mémoire cumulée inter-sessions (une ligne par utilisateur)
CREATE TABLE IF NOT EXISTS memory (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  updated_at     timestamptz DEFAULT now(),
  forces         text[] DEFAULT '{}',
  contradictions text[] DEFAULT '{}',
  blocages       jsonb DEFAULT '{}',
  ikigai         jsonb DEFAULT '{}',
  session_notes  text[] DEFAULT '{}',
  session_count  integer DEFAULT 0
);

-- Row Level Security : chaque utilisateur ne voit que ses données
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: user access" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "memory: user access" ON memory
  FOR ALL USING (auth.uid() = user_id);

-- Compteurs de rate limiting (un par utilisateur par jour)
CREATE TABLE IF NOT EXISTS rate_limits (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       date NOT NULL DEFAULT current_date,
  count      integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits: user access" ON rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- Codes d'accès temporaires
CREATE TABLE IF NOT EXISTS access_codes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by    uuid REFERENCES auth.users(id),
  max_uses   integer DEFAULT 1,
  use_count  integer DEFAULT 0
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour valider un code (avant auth)
CREATE POLICY "access_codes: read" ON access_codes
  FOR SELECT USING (true);

-- Mise à jour réservée aux utilisateurs authentifiés (après anon sign-in)
CREATE POLICY "access_codes: update" ON access_codes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insertion réservée aux admins via service_role (pas côté client)
-- Pour insérer des codes : utiliser le dashboard Supabase ou une fonction Edge
