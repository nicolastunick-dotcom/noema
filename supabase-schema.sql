-- ─────────────────────────────────────────────────────────────
-- NOEMA — Supabase Schema
-- Coller dans : Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

-- Profils Utilisateurs (avec statut Admin)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  is_admin    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read access" ON profiles
  FOR SELECT USING (true); -- Public read to let the edge function check admin status easily

CREATE POLICY "profiles: update own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

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
  session_note text DEFAULT '',
  next_action  text DEFAULT ''  -- Sprint 5 : action concrète de fin de session
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
  session_notes   text[] DEFAULT '{}',
  session_count   integer DEFAULT 0,
  onboarding_done boolean DEFAULT false
);

-- Row Level Security : chaque utilisateur ne voit que ses données
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: user access" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "memory: user access" ON memory
  FOR ALL USING (auth.uid() = user_id);

-- Compteurs de quota journalier (essai gratuit + accès complet, un par utilisateur par jour)
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

-- Abonnements Stripe / source de vérité d'accès payant
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id     text,
  stripe_subscription_id text UNIQUE,
  plan                   text DEFAULT 'noema_monthly',
  status                 text NOT NULL DEFAULT 'incomplete',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean DEFAULT false,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: user read own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- MÉMOIRE SÉMANTIQUE (VECTOR DB)
-- ─────────────────────────────────────────────────────────────

-- 1. Activer l'extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Créer la table des fragments de mémoire sémantique
CREATE TABLE IF NOT EXISTS semantic_memory (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL, -- Le souvenir, insight, ou citation
  metadata    jsonb DEFAULT '{}', -- Source (session_id), date, contexte...
  embedding   vector(1536), -- Dimension pour text-embedding-3-small (OpenAI)
  created_at  timestamptz DEFAULT now()
);

-- 3. Activer le Row Level Security
ALTER TABLE semantic_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semantic_memory: user access" ON semantic_memory
  FOR ALL USING (auth.uid() = user_id);

-- 4. Optimiser la recherche par similarité (Cosinus) avec un index HNSW
CREATE INDEX ON semantic_memory USING hnsw (embedding vector_cosine_ops);

-- 5. Créer la procédure stockée (RPC) pour la recherche de similarité
CREATE OR REPLACE FUNCTION match_semantic_memory (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    semantic_memory.id,
    semantic_memory.content,
    semantic_memory.metadata,
    1 - (semantic_memory.embedding <=> query_embedding) AS similarity
  FROM semantic_memory
  WHERE semantic_memory.user_id = p_user_id
    AND 1 - (semantic_memory.embedding <=> query_embedding) > match_threshold
  ORDER BY semantic_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- INVITATIONS BETA
-- Table créée manuellement le 26/03/2026 — formalisée Sprint 1
-- user_id = lien persistant entre le token et l'utilisateur
-- (source de vérité accès beta côté backend depuis Sprint 1)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text UNIQUE NOT NULL,
  label       text,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  active      boolean DEFAULT true,
  user_id     uuid REFERENCES auth.users(id)  -- null = invite pas encore liée à un compte
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire l'invite liée à son compte
-- (utilisé par useSubscriptionAccess pour vérifier l'accès beta en DB)
DROP POLICY IF EXISTS "invites: user read own" ON invites;
CREATE POLICY "invites: user read own" ON invites
  FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- MIGRATION Sprint 1 — à exécuter si invites existait déjà en prod
-- ─────────────────────────────────────────────────────────────
-- ALTER TABLE invites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
-- DROP POLICY IF EXISTS "invites: user read own" ON invites;
-- CREATE POLICY "invites: user read own" ON invites FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- DASHBOARD ADMIN: SUIVI CONSOMMATION TOKEN (API USAGE)
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- JOURNAL — Entrées quotidiennes (Sprint 5)
-- Une entrée par utilisateur par jour (upsert sur user_id + entry_date)
-- next_action : dernière action concrète donnée par Noema en fin de session
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id   text,                          -- UUID de la session chat liée (nullable)
  entry_date   date NOT NULL DEFAULT current_date,
  content      text NOT NULL DEFAULT '',
  next_action  text DEFAULT '',               -- copie du next_action de la session
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries: user access" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- MIGRATION Sprint 5 — ajouter next_action dans sessions
-- À exécuter si la table sessions existe déjà en prod
-- ─────────────────────────────────────────────────────────────
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_action text DEFAULT '';

-- ─────────────────────────────────────────────────────────────
-- DASHBOARD ADMIN: SUIVI CONSOMMATION TOKEN (API USAGE)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage: insert own" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_usage: admin read all" ON api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
