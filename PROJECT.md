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

## Documentation système

Tous les documents techniques sont centralisés dans [`docs/system/`](docs/system/).

👉 **Point d'entrée** : [`docs/system/README.md`](docs/system/README.md) — ordre de lecture, rôle de chaque document.

| Document | Rôle |
|---|---|
| [`NOEMA_SYSTEM_MAP.md`](docs/system/NOEMA_SYSTEM_MAP.md) | Structure globale du codebase réel |
| [`NOEMA_CHAT_ORCHESTRATION_MAP.md`](docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md) | Moteur conversationnel complet |
| [`NOEMA_DATA_FLOW_MAP.md`](docs/system/NOEMA_DATA_FLOW_MAP.md) | Flux de données réels, tables, sources de vérité |
| [`NOEMA_RUNTIME_GAPS.md`](docs/system/NOEMA_RUNTIME_GAPS.md) | Écarts runtime vs vision vs documentation |
| [`NOEMA_ALIGNMENT_PLAN.md`](docs/system/NOEMA_ALIGNMENT_PLAN.md) | Décisions d'alignement système |
| [`NOEMA_ALIGNMENT_EXECUTION_PLAN.md`](docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md) | Plan d'implémentation sprint par sprint |

**Règle** : toute modification touchant l'architecture, l'accès, les quotas, le prompt, l'état `_ui`, le Greffier, le mapping, la mémoire, les sessions, le billing, Journal, Today ou une table Supabase doit être accompagnée d'une mise à jour des documents concernés dans `docs/system/`. Voir [`NOEMA_DOCUMENTATION_POLICY.md`](docs/system/NOEMA_DOCUMENTATION_POLICY.md) pour le process complet.

---

## Checklist avant validation

- [ ] Code modifié testé (local ou preprod)
- [ ] Docs impactées dans `docs/system/` mises à jour
- [ ] Aucune contradiction créée entre couches
- [ ] Contrat `_ui` cohérent (prompt, parser, AppShell, Greffier)
- [ ] Accès et quotas respectés côté backend
- [ ] Surfaces mockées clairement identifiées (pas vendues comme réelles)
- [ ] Journal des tâches `PROJECT.md` mis à jour

---

### Documentation maîtresse (anciens chemins — redirigés)

Les documents système sont maintenant dans `docs/system/`. Les références ci-dessous sont conservées pour compatibilité historique :

- `docs/system/NOEMA_SYSTEM_MAP.md`
- `docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md`
- `docs/system/NOEMA_DATA_FLOW_MAP.md`
- `docs/system/NOEMA_RUNTIME_GAPS.md`
- `docs/system/NOEMA_ALIGNMENT_PLAN.md`
- `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`

### Ajouts documentaires motivés

- **Document ajouté** : `NOEMA_CHAT_ORCHESTRATION_MAP.md`
- **Motif** : documenter maintenant, dans le bon ordre après `NOEMA_SYSTEM_MAP.md`, le runtime réel du chat de Noema sans repartir des promesses produit, parce que le coeur chat concentre aujourd'hui l'essentiel de la logique métier et reste le principal point de confusion du repo.
- **But** : expliciter de façon exploitable par humains + IA le flux complet `frontend -> état -> backend -> Anthropic -> Greffier -> persistance -> UI`, le rôle réel du prompt système, la vraie source du Mapping, la logique effective de mémoire/sessions/quotas, et les zones où le code branché diverge des docs ou des reliquats V1/V2.
- **Utilité future** : donner aux prochaines IA et aux prochains développeurs un contexte durable avant tout refactor ou toute évolution produit sur `AppShell`, `claude.js`, `greffier.js`, `memory`, `sessions`, `rate_limits`, afin d'éviter de prendre un reliquat legacy ou une doc historique pour la source de vérité runtime.
- **Ambiguïtés clarifiées** : ce document désambiguïse le vrai point d'entrée du chat, la place exacte de `ChatPage`, le fait que le Mapping visible vient du bloc `<_ui>` du modèle principal et non du Greffier, le fait que `sessions` stocke des snapshots et non une session live stable, le désalignement `prompt <-> applyUI <-> Greffier`, et l'incohérence actuelle des quotas client/serveur.

- **Document ajouté** : `NOEMA_DATA_FLOW_MAP.md`
- **Motif** : documenter maintenant, dans la continuité logique de `NOEMA_SYSTEM_MAP.md` puis `NOEMA_CHAT_ORCHESTRATION_MAP.md`, la vérité exacte des données de Noema, parce que le projet mélange aujourd'hui plusieurs sources de vérité selon les domaines (`subscriptions`, `profiles`, `memory`, `sessions`, `rate_limits`, `sessionStorage`, `invites`) et qu'un refactor sans carte data fiable risquerait de consolider de faux contrats implicites.
- **But** : expliciter de façon exploitable par humains + IA quelles tables existent réellement, qui les lit, qui les écrit, dans quel ordre, quelles données pilotent effectivement l'UI, quelles données sont seulement support/admin, quelles redondances existent entre `memory` et `sessions`, où passe la vraie décision d'accès, et quelles divergences persistent entre schéma, code et documentation.
- **Utilité future** : donner aux prochaines IA et aux prochains développeurs un contexte durable avant toute évolution sur l'accès, le billing, la mémoire, les snapshots, les quotas, les invites, l'admin panel ou la persistance future de `Journal` / `Today`, afin d'éviter de prendre une table existante mais non branchée, un champ jamais relu, ou une doc historique pour une vérité runtime.
- **Ambiguïtés clarifiées** : ce document désambiguïse le rôle réel de `memory`, le fait que `sessions` ne représente pas une session live stable, la double écriture de `rate_limits`, la place exacte de `subscriptions` dans le paywall, le rôle limité de `profiles`, le caractère hybride de l'accès invite, l'état obsolète de `access_codes`, l'absence de persistance `Journal` / `Today`, l'absence runtime de `semantic_memory`, et le fait que les "coûts API totaux" admin ne sont pas aujourd'hui des coûts globaux plateforme.

- **Document ajouté** : `NOEMA_RUNTIME_GAPS.md`
- **Motif** : documenter maintenant, après la cartographie système, l'orchestration chat et les flux de données, les écarts structurants entre ce que Noema prétend être et ce que le runtime exécute réellement, parce que le repo contient aujourd'hui plusieurs couches de récit en parallèle (vision produit, roadmap, prompts, surfaces UI, schéma, reliquats V1/V2) et qu'une IA ou un développeur peut très facilement prendre une promesse, un plan ou un fichier legacy pour la source de vérité.
- **But** : expliciter de façon exploitable par humains + IA où se situent précisément les désalignements entre vision produit, documentation, prompts, UI, orchestration, tables, schéma et surfaces visibles, afin de distinguer ce qui est réellement branché, ce qui est seulement partiel, ce qui reste mocké, et ce qui relève du legacy.
- **Utilité future** : donner aux prochaines IA et aux prochains développeurs un contexte durable avant toute évolution sur le contrat `_ui`, le rôle du Greffier, les quotas, l'accès backend/frontend, `Journal`, `Today`, `sessions`, les reliquats V1/V2 ou la documentation globale, afin d'éviter de stabiliser un faux contrat implicite ou de refactorer à partir d'un document historique devenu inexact.
- **Ambiguïtés clarifiées** : ce document désambiguïse l'écart entre `prompt.js` et `applyUI()`, le rôle réel du Greffier par rapport au Mapping visible, la différence entre `memory` et `sessions`, la vérité réelle des quotas, le statut effectivement mocké de `Journal` et `Today`, le caractère hybride de l'accès (`subscriptions`, `profiles`, `invites`, `access_codes`), l'absence runtime de `semantic_memory`, l'effet trompeur de `App.original.jsx`, et les contradictions restantes entre `PROJECT.md`, `ROADMAP.md`, `DEBATE.md`, `codex.md`, le schéma et le runtime.

- **Document ajouté** : `NOEMA_ALIGNMENT_PLAN.md`
- **Motif** :
  > transformer les écarts identifiés dans NOEMA_RUNTIME_GAPS en décisions concrètes pour aligner le système avant toute automatisation ou scaling
- **But** :
  > définir une architecture cohérente avec une source de vérité par domaine
- **Utilité future** :
  > servir de guide pour toute évolution, éviter les incohérences et permettre un usage fiable d’agents IA
- **Ambiguïtés clarifiées** :
  - accès frontend vs backend
  - quotas contradictoires
  - contrat `_ui`
  - rôle du Greffier
  - statut Journal / Today
  - rôle réel de memory vs sessions

- **Document ajouté** : `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`
- **Motif** :
  > transformer les décisions d'alignement en plan d'exécution concret
- **But** :
  > organiser l'ordre réel des modifications code et schéma pour aligner Noema sans casser le système
- **Utilité future** :
  > servir de guide étape par étape pour modifier le code sans casser le système, avec checkpoints testables, dépendances claires et risques explicités
- **Ambiguïtés clarifiées** :
  - ordre réel accès -> quota -> `_ui` -> sessions -> UX -> extensions
  - dépendances entre backend, AppShell, Greffier et schéma
  - moment exact où brancher `session_id`
  - distinction entre stabilisation runtime et extension produit
  - conditions minimales avant de brancher `Journal` et `Today`

---

## Ce qui a été fait (historique)

- Refonte frontend complète sur design Stitch (6 écrans)
- Nouveau prompt Noema Phase 1 Guide / Phase 2 Stratège avec ordre de travail
- Greffier réactivé avec modèle `claude-haiku-4-5-20251001`
- Limite 25 messages par session (rate_limits Supabase)
- Onboarding 4 slides première utilisation (champ `onboarding_done` dans `memory`)
- Page Pricing avec plan Mensuel 19€ / Pro bientôt disponible
- Panel Admin : simulation de phase, logs Greffier, coûts API
- Réponses du chat en bloc (plus de mot à mot), avec temps de réponse optimisé côté frontend/backend
- Débat rétention produit documenté dans `RETENTION.md` (3 angles : growth, psychologie produit, PM)
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

### 🟡 PRIORITÉ 2 — Webhook Stripe → table `subscriptions` ✅ FAIT
`netlify/functions/stripe-webhook.js` créé. Écoute `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
**Reste à faire :**
- Ajouter `STRIPE_WEBHOOK_SECRET` dans Netlify dashboard env vars
- Configurer l'URL webhook dans Stripe Dashboard (voir bas de fichier)

### 🟡 PRIORITÉ 3 — Autres
- Corrections sécurité restantes (voir `codex.md` priorités 2 et 3)
- Ajouter `GMAIL_APP_PASSWORD` dans Netlify dashboard env vars (envoi formulaire contact)
- Ajouter `VITE_ADMIN_EMAIL=[ADMIN_EMAIL]` dans Netlify dashboard env vars (bypass abonnement admin)

### Sprint 1 Alignement (FAIT — migration prod requise)

Accès backend verrouillé et quota unifié côté backend.

**Avant tout déploiement en prod :**
```sql
-- Ajouter user_id à la table invites (déjà créée manuellement)
ALTER TABLE invites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
DROP POLICY IF EXISTS "invites: user read own" ON invites;
CREATE POLICY "invites: user read own" ON invites FOR SELECT USING (auth.uid() = user_id);
```

**Comportement quota (à documenter pour les utilisateurs) :**
La limite produit est 25 messages par jour (journalier). Elle ne sera par session qu'au Sprint 3. Le message de fin de session assume explicitement cet état journalier.

---

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
| 01/04/2026 | Claude Code | Streaming SSE — claude.js retourne text/event-stream, callAPI lit le stream, messages affichés token par token | ✅ | — |
| 01/04/2026 | Claude Code | Paywall App.jsx rétabli — redirect /pricing si pas d'abonnement actif (sauf DEV) | ✅ | — |
| 01/04/2026 | Claude Code | Sécurité invitations — token lié à userId au premier login, nettoyage à la déconnexion | ✅ | — |
| 01/04/2026 | Claude Code | Bypass admin côté serveur pour le rate limit `/claude` via `VITE_ADMIN_EMAIL` | ✅ | Ajouter `VITE_ADMIN_EMAIL` dans Netlify env vars |
| 01/04/2026 | Claude Code | Fix `<_ui>` visible pendant le streaming — filtrage sur chaque chunk | ✅ | — |
| 01/04/2026 | Codex | Durcissement du fix streaming `<_ui>` — accumulation sur flux brut avant `setState` pour éviter les fuites inter-chunks | ✅ | Vérifier visuellement en local / prod |
| 01/04/2026 | Codex | Abandon du streaming mot à mot — retour aux réponses en bloc + Greffier parallélisé + `max_tokens` réduit pour accélérer la réponse | ✅ | Vérifier le ressenti en prod |
| 01/04/2026 | Claude Code | Fix mémoire inter-sessions — C1: autosave `beforeunload` + `setInterval` 5min dans AppShell ; C2: `buildMemoryContext` souple (session_count=0 OK) ; C3: Greffier reçoit `sbAdmin` (était `null`) → persist dans `memory` + `sessions` | ✅ | — |
| 01/04/2026 | Claude Code | Webhook Stripe — `stripe-webhook.js` : checkout.session.completed → upsert subscriptions ; subscription.updated → sync status ; subscription.deleted → cancelled | ✅ | Ajouter `STRIPE_WEBHOOK_SECRET` dans Netlify env vars + configurer URL dans Stripe Dashboard |
| 01/04/2026 | Codex | Débat rétention produit — lecture `PROJECT.md` + `DEBATE.md`, confrontation avec 3 agents spécialisés, synthèse écrite dans `RETENTION.md` | ✅ | Utiliser ce top 5 pour prioriser la roadmap produit |
| 01/04/2026 | Codex | Analyse exhaustive du codebase + cartographie système complète dans `NOEMA_SYSTEM_MAP.md` + référence ajoutée dans `PROJECT.md` | ✅ | Utiliser `NOEMA_SYSTEM_MAP.md` comme document maître pour les futures IA |
| 01/04/2026 | Codex | Cartographie détaillée du coeur chat dans `NOEMA_CHAT_ORCHESTRATION_MAP.md` + mise à jour motivée de `PROJECT.md` | ✅ | Utiliser ce document avant toute modification de `AppShell`, `claude.js`, `greffier.js`, `memory`, `sessions` ou `rate_limits` |
| 01/04/2026 | Codex | Cartographie détaillée des flux de données réels dans `NOEMA_DATA_FLOW_MAP.md` + mise à jour motivée de `PROJECT.md` | ✅ | Utiliser ce document avant toute modification de `subscriptions`, `profiles`, `memory`, `sessions`, `rate_limits`, `api_usage`, `invites`, `access_codes`, `Journal` ou `Today` |
| 01/04/2026 | Codex | Cartographie détaillée des écarts runtime dans `NOEMA_RUNTIME_GAPS.md` + mise à jour motivée de `PROJECT.md` | ✅ | Utiliser ce document avant toute modification des prompts, de `applyUI()`, du Greffier, des quotas, de l'accès, de `Journal`, de `Today`, des surfaces marketing ou des reliquats V1/V2 |
| 01/04/2026 | Codex | Plan d'alignement système dans `NOEMA_ALIGNMENT_PLAN.md` + mise à jour motivée de `PROJECT.md` | ✅ | Utiliser ce document avant toute automatisation, tout refactor d'accès/quotas/mémoire/UI state, et avant de brancher réellement `Journal` ou `Today` |
| 01/04/2026 | Codex | Plan d'exécution séquencé dans `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md` + mise à jour motivée de `PROJECT.md` | ✅ | Utiliser ce document avant de modifier l'accès backend, le quota, le contrat `_ui`, la logique de session, les surfaces UX réelles et le branchement de `Journal` / `Today` |
| 01/04/2026 | Claude Code | Infrastructure documentaire — déplacement NOEMA_*.md → `docs/system/`, création `README.md` + `NOEMA_DOCUMENTATION_POLICY.md`, refonte section Documentation `PROJECT.md` + checklist validation | ✅ | Appliquer la politique documentaire à chaque run touchant un domaine système |
| 01/04/2026 | Claude Code | Sprint 1 Alignement — entitlement backend dans `claude.js` (admin/sub/invite → 403 si absent) + quota backend unifié (suppression rate_limits frontend dans `AppShell`) + `invites.user_id` + linkage `validate-invite` + `useSubscriptionAccess` check DB | ✅ | Avant déploiement : exécuter migration SQL `ALTER TABLE invites ADD COLUMN IF NOT EXISTS user_id` en prod. Puis lancer Sprint 2. |
| 01/04/2026 | Claude Code | Sprint 1.1 Race condition bootstrap — faux 403 sur `openingMessage()` pour comptes invités corrigé : `INITIAL_STATE.loading=true` + guard `accessState?.loading` dans AppShell + linkage sessionStorage invite bloquant (plus fire-and-forget) + `shouldBlockForChecks` étendu à `access.loading` en prod | ✅ | Vérifier en prod : plus de 403 console au chargement pour compte invité. Chat et admin non régressés. |
| 01/04/2026 | Claude Code | Sprint 1 nettoyage final — vérification `res.ok` sur le fetch validate-invite dans `useSubscriptionAccess` (erreur HTTP désormais loggée) + commentaire corrigé dans `validate-invite.js` (ilike → eq exact). Migration SQL `invites.user_id` exécutée en prod. Sprint 1 clos. | ✅ | Sprint 2 peut démarrer. |
| 02/04/2026 | Claude Code | Sprint 2 — unification contrat `_ui` : suppression champs fantômes (`phase`, `msg_count`, `ikigai_completude`, `phase_ready`) du prompt ; ajout `step` dans le template `_ui` ; suppression état `mode` mort dans AppShell ; ajout état `nextAction` ; `applyUI()` aligné sur contrat cible. | ✅ | — |
| 02/04/2026 | Claude Code | Typographie — tracking premium global : `letter-spacing: 0.012em` sur `body` (baseline) + overrides ciblés boutons (.03em), tabs (.025em), nav (.02em), state-badge (.03em), serif display (-.01em). | ✅ | — |
| 02/04/2026 | Claude Code | Sprint 3 — mémoire structurée : (1) `buildMemoryContext()` enrichi avec `blocages`, `contradictions`, `step` ; (2) `updateMemoryRef(ui)` dans AppShell — merge live `_ui` → `memoryRef.current` après chaque message ; (3) `claude.js` charge la mémoire depuis DB côté serveur (`buildServerMemoryContext`) — le backend ne dépend plus du `memory_context` client. | ✅ | — |
| 02/04/2026 | Claude Code | Sprint 3.1 — continuité post-refresh : (1) `claude.js` lit `sessions.step` en parallèle de `memory` et l'injecte dans `buildServerMemoryContext()` — 0 migration SQL ; (2) autosave 5min → 2min pour réduire pertes `session_notes` ; (3) `session_note` enrichi : 2-3 points clés séparés par " | " au lieu d'une phrase ; (4) nettoyage dead code AppShell (imports morts, état mort, styles inutilisés) ; (5) Sprint 2 prompt.js réappliqué après écrasement silencieux par formateur. | ✅ | — |
	
  Document ajouté : NOEMA_RUNTIME_GAPS.md
	•	Motif :
identifier les écarts structurels entre vision, documentation et runtime réel afin d’éviter toute dérive future dans le développement et permettre un alignement systémique avant automatisation
	•	But :
fournir une cartographie exhaustive des contradictions, promesses non branchées et désalignements entre couches du système
	•	Utilité future :
servir de référence pour toute IA ou développeur afin d’éviter les mauvaises hypothèses sur l’état réel du produit
	•	Ambiguïtés clarifiées :
	•	rôle réel du Greffier
	•	statut mocké de Journal / Today
	•	incohérence des quotas
	•	nature snapshot de sessions
	•	désalignement prompt/UI
	•	accès frontend vs backend
---

> **RÈGLE** : Tout agent qui commence une tâche ajoute une ligne dans le Journal.
> Tout agent qui termine met à jour le statut et indique la suite.
