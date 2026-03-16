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
