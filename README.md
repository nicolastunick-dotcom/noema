# Noema — Setup & Déploiement

Guide complet pour lancer le projet en local et le déployer sur Netlify.

---

## Structure du projet

```
noema/
├── src/
│   ├── main.jsx          # Entry point React
│   └── App.jsx           # Application complète
├── netlify/
│   └── functions/
│       └── claude.js     # Proxy sécurisé API Anthropic
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── netlify.toml
├── package.json
├── .env.example
└── .gitignore
```

---

## 1. Installation locale

```bash
# Clone ou télécharge le projet
cd noema

# Installe les dépendances
npm install

# Copie le fichier d'environnement
cp .env.example .env.local
```

Remplis `.env.local` avec tes vraies clés :

```
VITE_ANTHROPIC_KEY=sk-ant-...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

```bash
# Lance le serveur de développement
npm run dev
# → http://localhost:5173
```

---

## 2. Supabase — Base de données

Dans ton projet Supabase, ouvre l'éditeur SQL et exécute :

```sql
-- Table messages
create table messages (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  session_id  text not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

-- Table résumés de session (mémoire inter-sessions)
create table session_summaries (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  summary     text not null,
  insights    jsonb,
  ikigai      jsonb,
  created_at  timestamptz default now()
);

-- RLS — chaque utilisateur voit uniquement ses données
alter table messages          enable row level security;
alter table session_summaries enable row level security;

create policy "users_own_messages" on messages
  for all using (auth.uid() = user_id);

create policy "users_own_summaries" on session_summaries
  for all using (auth.uid() = user_id);
```

### Auth Google (optionnel)

Dans Supabase → Authentication → Providers → Google :
- Active Google OAuth
- Renseigne Client ID et Secret depuis Google Cloud Console
- URL de callback : `https://xxxxx.supabase.co/auth/v1/callback`

---

## 3. Déploiement Netlify

### Option A — Interface Netlify (recommandé)

1. Push le projet sur GitHub
2. Va sur [netlify.com](https://netlify.com) → "New site from Git"
3. Sélectionne le repo
4. Les paramètres de build sont lus depuis `netlify.toml` automatiquement
5. Dans **Site settings → Environment variables**, ajoute :

```
ANTHROPIC_API_KEY   = sk-ant-...
VITE_SUPABASE_URL   = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGci...
```

6. Redéploie → c'est en ligne.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init        # lie le projet à Netlify
netlify env:set ANTHROPIC_API_KEY sk-ant-...
netlify env:set VITE_SUPABASE_URL https://xxxxx.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY eyJhbGci...
netlify deploy --prod
```

---

## 4. Variables d'environnement — Résumé

| Variable               | Où                        | Usage                          |
|------------------------|---------------------------|--------------------------------|
| `ANTHROPIC_API_KEY`    | Netlify (serveur)         | Clé API Claude — jamais client |
| `VITE_ANTHROPIC_KEY`   | `.env.local` (dev)        | Proxy Vite local uniquement    |
| `VITE_SUPABASE_URL`    | `.env.local` + Netlify    | URL Supabase                   |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Netlify  | Clé publique Supabase          |

> **Important** : `ANTHROPIC_API_KEY` ne doit JAMAIS avoir le préfixe `VITE_`.
> Elle reste côté serveur dans la Netlify function, jamais exposée au browser.

---

## 5. Domaine personnalisé

Dans Netlify → Domain settings :
1. Ajoute ton domaine (ex: `noema.app`)
2. Mets à jour tes DNS selon les instructions Netlify
3. SSL est automatique (Let's Encrypt)

---

## 6. Prochaines étapes

- [ ] Connecter Stripe pour les paiements (19€/mois et 97€ à vie)
- [ ] Activer la mémoire inter-sessions (table `session_summaries`)
- [ ] Analytics (Plausible recommandé — privacy-first)
- [ ] Email de bienvenue post-inscription (Resend ou Loops)
