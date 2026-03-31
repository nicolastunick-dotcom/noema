# NOEMA — Contexte Projet

> Ce fichier est le contexte partagé entre Claude Code, Codex, et tous les agents.
> Il doit être lu au début de chaque session et mis à jour à chaque tâche terminée.

---

## Stack technique

- **Frontend** : React + Vite
- **Backend** : Netlify Functions
- **Auth / DB** : Supabase
- **Paiement** : Stripe (intégration en cours)
- **IA** : Anthropic API (Claude Sonnet 4.6 + Haiku 4.5)
- **URL prod** : https://noemaapp.netlify.app
- **GitHub** : https://github.com/nicolastunick-dotcom/noema

---

## Architecture

```
src/pages/
  Landing.jsx          — Page d'accueil publique
  Login.jsx            — Connexion / inscription / code d'accès
  Onboarding.jsx       — 4 slides première utilisation (onboarding_done Supabase)
  Pricing.jsx          — Plans mensuel / Pro (Stripe à brancher)
  PrivacyPolicy.jsx    — Politique de confidentialité (/privacy)
  TermsOfService.jsx   — Conditions d'utilisation (/terms)
  EthicalAI.jsx        — Principes IA éthique (/ethical-ai)
  Contact.jsx          — Formulaire de contact (/contact)
  Success.jsx          — Page post-paiement Stripe (/success)
  AppShell.jsx         — Shell principal : navigation, état global, appel API
  ChatPage.jsx         — Interface de conversation
  MappingPage.jsx      — Mapping psychologique (Ikigai, Forces, Blocages)
  JournalPage.jsx      — Journal guidé
  TodayPage.jsx        — Rituel quotidien

src/constants/
  prompt.js            — Prompt Noema Phase 1 (Guide) / Phase 2 (Stratège)
  prompt-greffier.js   — Prompt Greffier (extraction silencieuse)
  config.js            — Variables publiques (URLs, MAX_HISTORY)

src/lib/
  supabase.js          — Client Supabase, buildMemoryContext, buildSystemPrompt

src/components/
  AdminPanel.jsx       — Panel admin (profiles.is_admin + fallback email transitoire)

netlify/functions/
  claude.js            — Proxy IA principal (auth JWT, rate limit, Greffier)
  greffier.js          — Agent extraction silencieuse (Haiku)
  verify-code.js       — Vérification codes admin côté serveur
  admin-tools.js       — Actions admin sécurisées (coûts API, reset mémoire)
  create-checkout-session.js — Crée une Stripe Checkout Session (auth JWT requis)
```

---

## Ce qui a été fait (historique)

- Refonte frontend complète sur design Stitch (6 écrans)
- Nouveau prompt Noema Phase 1 Guide / Phase 2 Stratège avec ordre de travail
- Greffier réactivé avec modèle `claude-haiku-4-5-20251001`
- Limite 25 messages par session (rate_limits Supabase)
- Onboarding 4 slides première utilisation (champ `onboarding_done` dans `memory`)
- Page Pricing avec plan Mensuel 19€ / Pro bientôt disponible
- Panel Admin : simulation de phase, logs Greffier, coûts API
- Audit sécurité (codex.md) — 3 corrections prioritaires appliquées :
  - Correction 1 : JWT Supabase vérifié côté serveur sur `/claude`
  - Correction 2 : DOMPurify sur `dangerouslySetInnerHTML` dans ChatPage
  - Correction 3 : `VITE_ADMIN_CODES` sorti du bundle → `netlify/functions/verify-code.js`

---

## En cours / Priorités

### 🔴 BUG RÉSOLU — Boucle "Overloaded" Anthropic
`hasOpened.current = false` dans le catch d'`openingMessage` causait une boucle infinie de requêtes Anthropic lors des rechargements HMR (ou si l'API renvoyait 529 Overloaded). Fix : le reset a été supprimé — si l'opening message échoue, il ne réessaie plus automatiquement.

### 🔴 PRIORITÉ 1 — Stripe Checkout ne fonctionne pas
Le code est correct (STRIPE_SECRET_KEY lu depuis process.env, Price ID = price_1TAZhkQh5xN0PliA3dUAqyqP).
**Cause probable : variables manquantes dans Netlify dashboard.**
À vérifier dans Netlify → Site settings → Environment variables :
- `STRIPE_SECRET_KEY` (commence par `sk_live_` ou `sk_test_`)
- `SUPABASE_SERVICE_ROLE_KEY`

### 🟡 PRIORITÉ 2 — Webhook Stripe → table `subscriptions`
Après que Stripe confirme le paiement, créer/mettre à jour la ligne dans `subscriptions` Supabase.
Créer `netlify/functions/stripe-webhook.js` + `STRIPE_WEBHOOK_SECRET` dans env vars.

### 🟡 PRIORITÉ 3 — Autres
- Corrections sécurité restantes (voir `codex.md` priorités 2 et 3)
- Ajouter `GMAIL_APP_PASSWORD` dans Netlify dashboard env vars (envoi formulaire contact)
- Ajouter `VITE_ADMIN_EMAIL=[ADMIN_EMAIL]` dans Netlify dashboard env vars (bypass abonnement admin)

### Système d'invitations beta (FAIT)
Table Supabase `invites` à créer manuellement (SQL ci-dessous).
Admin génère des liens depuis le panel → amis cliquent → accès direct sans paiement.
```sql
CREATE TABLE invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text UNIQUE NOT NULL,
  label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);
```

---

## À ne jamais toucher sans validation explicite

| Fichier | Raison |
|---|---|
| `src/constants/prompt.js` | Prompt soigneusement construit Phase 1/2 |
| `netlify/functions/greffier.js` | Fonctionne, confirmé en logs Netlify |
| `src/lib/supabase.js` | Logique mémoire et contexte — architecture fragile |
| `src/App.jsx` | Routage URL + verrou d'accès récemment mis en place |
| `src/pages/Onboarding.jsx` | Logique `onboarding_done` active en prod |

---

## Journal des tâches

| Date | Agent | Tâche | Statut | Suite |
|---|---|---|---|---|
| 25/03/2026 | Claude Code | Refonte frontend 6 écrans Stitch | ✅ | — |
| 25/03/2026 | Claude Code | Prompt Phase 1/2 + ordre de travail | ✅ | — |
| 25/03/2026 | Claude Code | Greffier réactivé + logs console | ✅ | — |
| 25/03/2026 | Claude Code | Onboarding 4 slides + Supabase | ✅ | — |
| 25/03/2026 | Claude Code | Page Pricing | ✅ | Brancher Stripe |
| 25/03/2026 | Claude Code | Admin panel (simulation, coûts) | ✅ | — |
| 25/03/2026 | Claude Code | Audit sécurité codex.md | ✅ | Priorités 2 et 3 restantes |
| 25/03/2026 | Claude Code | Corrections sécurité priorité 1 (×3) | ✅ | Intégration Stripe |
| 25/03/2026 | Claude Code | Création PROJECT.md | ✅ | Corrections sécurité codex.md |
| 25/03/2026 | Claude Code | Pages légales + contact (4 pages) + routing | ✅ | — |
| 25/03/2026 | Claude Code | Contact : formulaire → send-contact.js (nodemailer Gmail) | ✅ | Ajouter GMAIL_APP_PASSWORD dans Netlify env vars |
| 25/03/2026 | Claude Code | Bypass abonnement pour compte admin ([ADMIN_EMAIL]) via VITE_ADMIN_EMAIL | ✅ | Ajouter VITE_ADMIN_EMAIL dans Netlify env vars |
| 25/03/2026 | Claude Code | Landing : orbe violet pulsant en hero + bouton "Découvrir l'abonnement" déplacé dans la nav | ✅ | — |
| 25/03/2026 | Claude Code | Stripe Checkout : create-checkout-session.js + Success.jsx + routing /success | ✅ | Webhook Stripe → table subscriptions |
| 25/03/2026 | Codex | Migration admin progressive : `profiles.is_admin` + actions sensibles via Netlify Functions | ✅ | Retirer le fallback `VITE_ADMIN_EMAIL` après validation prod |
| 25/03/2026 | Claude Code | Bug 1 fix — colonne `onboarding_done` absente du schéma `memory` (400 Supabase) | ✅ | Exécuter migration SQL dans Supabase dashboard |
| 25/03/2026 | Claude Code | Bug 2 fix — `memory_context` rejeté par Anthropic en DEV → `buildSystemPrompt` direct | ✅ | — |
| 26/03/2026 | Claude Code | Landing : bouton "Comment ça marche" → /onboarding-preview (retour Landing, sans auth) | ✅ | — |
| 26/03/2026 | Claude Code | Pricing : texte bouton → "Commencer votre introspection" | ✅ | — |
| 26/03/2026 | Claude Code | Login : "Oublié ?" → resetPasswordForEmail + ResetPassword.jsx + route /reset-password | ✅ | — |
| 26/03/2026 | Claude Code | Fix page blanche post-confirmation email : redirect landing+user → app ou pricing | ✅ | — |
| 26/03/2026 | Claude Code | Système invitations beta : create-invite.js + validate-invite.js + InvitePage + AdminPanel | ✅ | Créer table `invites` dans Supabase (SQL dans PROJECT.md) |
| 31/03/2026 | Claude Code | NoemaOrb — lettrine N centrée + brume violet clippée + sphère agrandie | ✅ | — |
| 31/03/2026 | Claude Code | Fix boucle "Overloaded" Anthropic — suppression reset hasOpened dans catch | ✅ | — |
| 31/03/2026 | Claude Code | Landing hero paddingTop 192→20px (sphère dès le haut de page) | ✅ | — |

---

> **RÈGLE** : Tout agent qui commence une tâche ajoute une ligne dans le Journal.
> Tout agent qui termine met à jour le statut et indique la suite.
