# NOEMA — Mise en pause

> Rédigé le 29/04/2026. Ce fichier documente l'état exact du projet au moment où le développement est mis en pause.
> Il sert de point de reprise pour une future session, humaine ou IA.

---

## 1. Ce qu'est Noema

Noema est un système de transformation personnelle, pas un simple chat.

Son but : comprendre l'utilisateur en profondeur sur la durée — faire émerger forces, blocages, contradictions, construire un ikigai vivant, puis l'aider à s'aligner et à agir.

Parcours officiel : `Voir → Comprendre → S'aligner → Agir`
Lecture émotionnelle vécue : `Perdu → Guide → Stratège`

Cible : 18-35 ans, perdus ou en décalage avec leur vraie direction. Pas forcément en crise formulée.

Surfaces : `Chat` (coeur) · `Mapping` (miroir) · `Journal` (dépôt du fil) · `Aujourd'hui / Zen` (rituel de continuité)

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite, sans react-router, routage manuel |
| Hosting | Netlify (fonctions serverless + headers sécurité) |
| Backend IA | Netlify Functions (Node.js) → Anthropic API |
| Modèle principal | claude-sonnet-4-6 |
| Modèle secondaire | claude-haiku-4-5-20251001 (Greffier) |
| Auth + DB | Supabase (Auth email/password + Google OAuth + Postgres + RLS) |
| Billing | Stripe (checkout + webhook) |
| Email | Nodemailer/Gmail (contact uniquement) |
| Design system | Framer Motion + styles inline + `src/design-system/tokens.js` |

**URL prod :** `noemaapp.netlify.app`
**GitHub :** `github.com/nicolastunick-dotcom/noema`

---

## 3. Architecture réelle

### Fichiers critiques (ne jamais modifier sans relire)

```
src/App.jsx                          → routage + garde d'accès
src/lib/access.js                    → logique de résolution d'accès
src/hooks/useSubscriptionAccess.js   → hook central trial/sub/invite/admin
src/pages/AppShell.jsx               → orchestrateur de l'app privée (état monolithique)
src/constants/prompt.js              → prompt principal envoyé à Claude
netlify/functions/claude.js          → proxy IA principal (auth JWT + quota + Anthropic)
netlify/functions/greffier.js        → agent secondaire Haiku (mémoire + log admin)
supabase-schema.sql                  → schéma DB de référence
src/design-system/tokens.js          → design system centralisé
```

### Pages publiques

| Route | Fichier | État |
|---|---|---|
| `/` | `Landing.jsx` | statique, réaligné avec l'état réel |
| `/login` | `Login.jsx` | réel (email/password + Google OAuth + reset) |
| `/pricing` | `Pricing.jsx` | réel (mensuel branché, annuel, Pro visuel seulement) |
| `/onboarding-preview` | `Onboarding.jsx` | démo publique, non branché |
| `/onboarding` | `Onboarding.jsx` | réel, piloté par `memory.onboarding_done` |
| `/success` | `Success.jsx` | partiel (relit `subscriptions.status`, dépend du webhook) |
| `/invite` | `InvitePage.jsx` | réel mais transitoire (sessionStorage + confirm backend) |
| `/reset-password` | `ResetPassword.jsx` | réel |
| `/contact` | `Contact.jsx` | réel (Nodemailer) |
| `/privacy`, `/terms`, `/ethical-ai` | pages légales | statiques |

### Pages privées (via AppShell)

| Route | Fichier | État |
|---|---|---|
| `/app/chat` | `ChatPage.jsx` | réel — coeur du produit |
| `/app/mapping` | `MappingPage.jsx` | réel — alimenté par `_ui` du chat |
| `/app/journal` | `JournalPage.jsx` | réel — lecture/écriture Supabase `journal_entries` |
| `/app/today` | `TodayPage.jsx` | réel — consomme `next_action` live + dernière session + journal |

### Admin

| Route | Fichier | État |
|---|---|---|
| `/admin` | `AdminDashboard.jsx` | partiel mais fonctionnel |

Accès : `user.email === VITE_ADMIN_EMAIL` OU `profiles.is_admin = true`.
Sections : Vue d'ensemble (6 cards live) · Utilisateurs (table searchable) · Revenus (MRR/ARR) · Actions rapides (invite, broadcast) · Navigation libre (`?adminpreview=1`).

---

## 4. État réel par domaine

### Ce qui est réellement branché (réel)

| Domaine | Vérité |
|---|---|
| Auth | Supabase Auth : login, signup, reset password, Google OAuth (côté code) |
| Accès | Backend autoritaire : `claude.js` vérifie le JWT et résout le tier (`trial` / `subscriber` / `invite` / `admin`) |
| Quotas | Backend seul fait autorité : 8/jour en trial, 25/jour en accès complet |
| Chat | Appel Anthropic via `/.netlify/functions/claude`, mémoire lue/écrite, Greffier lancé toutes les 2 interactions |
| Mémoire | `memory` + snapshots `sessions` : `forces`, `blocages`, `contradictions`, `ikigai`, `step`, `session_notes` lus et injectés dans le prompt |
| Mapping | Alimenté par le bloc `<_ui>` du modèle principal, parsé par `applyUI()` dans AppShell |
| Journal | Lecture/écriture réelle dans `journal_entries` Supabase (upsert `user_id + entry_date`) |
| Aujourd'hui | Consomme `next_action` live depuis AppShell + dernière entrée journal + dernière session persistée |
| Trial | Tout utilisateur authentifié sans abonnement actif = `trial` |
| Billing | Checkout Stripe réel, webhook sync `subscriptions`, page Success relit `subscriptions.status` |
| Onboarding | Piloté par `memory.onboarding_done` |
| Phase visible | Lecture émotionnelle de `step` visible dans AppShell, ChatPage, MappingPage |
| Cross-sessions | Trajectoire visible injectée dans le prompt, le mapping et Today (heuristique) |
| Proof layer | Preuve différentielle `Nouveau / Confirmé / Revient / À poursuivre` dans Chat et Today |
| Continuité | Bloc `Depuis ta dernière visite` dans Chat et Today (assemblage local, sans LLM) |
| Pricing toggle | Mensuel 19 €/mois · Annuel 180 €/an (−21 %) |
| État Jour 0 | Écran d'accueil dédié dans TodayV2 si `sessionCount === 0` |
| LivingAtmosphere | Composant partagé, remplace ~180 lignes dupliquées dans Mapping, Journal, Today |
| Design system | `src/design-system/tokens.js` : `T.type.tiny`, `T.type.input`, `T.color.phase`, `T.nav`, `focusRing` |
| Admin panel | Dashboard `/admin` avec données live |

### Ce qui est partiel

| Domaine | Vérité |
|---|---|
| Greffier | Tourne, enrichit `memory`, loggue pour l'admin — mais ne pilote pas le Mapping visible |
| Phase incarnée | La bascule `Guide → Stratège` est signalée visuellement mais pas encore profondément incarnée dans toute l'UX |
| Cross-sessions | La lecture existe (trajectoire, motifs) mais reste heuristique, pas systématique |
| Mapping longitudinal | Une couche `Progression vivante` existe, mais le Mapping reste centré sur l'état courant |
| Aujourd'hui / Zen | Un premier rituel Zen adapté à la phase existe, mais `Aujourd'hui` n'est pas encore pleinement la `Page Zen` de la vision |
| Accès invite | `sessionStorage` transporte encore le token, mais l'accès n'est plus accordé sans confirmation backend via `invites.user_id` |
| Admin | Panel fonctionnel, mais `broadcast` nécessite un backend, et les coûts API ne sont pas globaux |
| Billing | Checkout + webhook réels, mais Success dépend encore de la synchronisation webhook Stripe |

### Ce qui n'est pas branché (non branché / legacy)

| Domaine | Vérité |
|---|---|
| `semantic_memory` | Table et RPC présentes dans le schéma, runtime absent |
| Offre Pro | Visible dans Pricing, non branchée |
| `src/App.original.jsx` | Legacy V1 — ne pas utiliser comme référence |
| `src/constants/prompt-greffier.js` | Legacy — le runtime utilise un prompt inline dans `greffier.js` |
| `access_codes` | Existe encore en base, mais n'ouvre plus réellement l'accès produit |
| Emails de fin de phase | Pas implémentés |
| `buildSystemPrompt()` | Existe dans `supabase.js`, mais pas utilisé dans le runtime actuel |
| Tests automatisés | `npm test` échoue : aucun fichier de test Vitest |

---

## 5. Tables Supabase

| Table | Rôle réel | État |
|---|---|---|
| `profiles` | Admin (`is_admin`) | réel |
| `memory` | Mémoire inter-sessions structurée | réel |
| `sessions` | Snapshots de conversations (upsert par `session_id`) | réel |
| `rate_limits` | Quotas journaliers (backend seul) | réel |
| `subscriptions` | Vérité d'accès payant (sync Stripe webhook) | réel |
| `journal_entries` | Journal persisté (upsert `user_id + entry_date`) | réel |
| `api_usage` | Suivi tokens/coûts | réel |
| `invites` | Accès beta (hors schéma principal — `supabase-schema.sql` à vérifier) | partiel |
| `access_codes` | Ancien système de codes | legacy |
| `semantic_memory` | Mémoire vectorielle future | non branché |

---

## 6. Fonctions Netlify

| Fichier | Rôle | État |
|---|---|---|
| `claude.js` | Proxy IA principal (JWT + tier + quota + Anthropic + Greffier) | réel |
| `greffier.js` | Agent secondaire Haiku (mémoire + log) | partiel |
| `create-checkout-session.js` | Checkout Stripe | réel |
| `stripe-webhook.js` | Sync subscriptions | réel |
| `create-invite.js` | Création invite beta admin | réel |
| `validate-invite.js` | Validation token invite | réel |
| `admin-tools.js` | `get-costs` + `reset-memory` | réel |
| `send-contact.js` | Email contact (Nodemailer) | réel |
| `verify-code.js` | Vérification code admin | legacy / partiel |
| `broadcast-message.js` | Broadcast utilisateurs | UI présente, backend à terminer |

---

## 7. Variables d'environnement requises

### Frontend (`.env.local` ou Netlify UI)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLIC_KEY
VITE_ADMIN_EMAIL
```

### Backend (Netlify Environment Variables)
```
ANTHROPIC_API_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GMAIL_APP_PASSWORD
ADMIN_CODES
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

## 8. Incohérences techniques connues

### A. Contrat `_ui` désaligné entre prompt et UI
Le prompt principal (`prompt.js`) demande dans `<_ui>` : `phase`, `msg_count`, `ikigai_completude`, `next_action`, `phase_ready`.
`applyUI()` dans AppShell consomme : `etat`, `mode`, `step`, `forces`, `blocages`, `contradictions`, `ikigai`, `session_note`.
→ Les champs `mode` et `step` ne sont pas explicitement demandés dans le prompt actuel. Les champs `phase`, `msg_count`, `ikigai_completude`, `phase_ready` ne sont pas consommés par l'UI principale.

### B. Quotas potentiellement doublés
Le client lit encore `rate_limits` côté local (garde-fou 30/min). Le backend en est l'autorité. Il peut y avoir double-incrément.
→ En pratique, le backend seul bloque. Le frontend ne fait plus d'upsert post-Sprint 1.

### C. Greffier sans `sessionId`
`claude.js` envoie `sessionId = null` au Greffier. La branche `sessions.update()` du Greffier est donc en pratique dormante.

### D. `invites` hors schéma principal
La table `invites` est utilisée en runtime mais son état dans `supabase-schema.sql` est à vérifier (migration `user_id` à confirmer en prod).

### E. Reliquats legacy dans AppShell
`AppShell.jsx` contient des imports inutilisés (`StateBadge`, `InsightsPane`, `ProgressPane`, `IkigaiPane`, `SendSVG`, `buildSystemPrompt`) et des états orphelins (`sideTab`, `mobTab`, `mode`, `greffierLogTick`).

### F. DEV local cassé pour le chat
En mode `vite dev`, `ANTHROPIC_PROXY` pointe vers l'API Anthropic directe, mais `AppShell.callAPI()` n'envoie pas de `x-api-key`. Le chat en local pur (hors `netlify dev`) est probablement non fonctionnel.

---

## 9. Derniers commits

```
14309c8  feat(chat): Caveat handwriting on all messages, larger sizes
3860a9f  feat: add UI redesign skills
1f34e6b  feat: replace Satoshi with Figtree + Caveat handwriting for Noema messages
b590174  feat: vision2 runtime — tester session 4, fixes UX/backend/perf
bee832a  feat: prompt coaching actif + CTA Jour 0 + optimisations backend
c681dff  feat: vision2 runtime — design system, UX audit fixes, Stripe annual
8b82985  docs: remove redundant system planning docs
ea1cf35  feat: advance noema runtime toward vision2
```

---

## 10. Ce qui reste à faire (priorités à la reprise)

Dans l'ordre de priorité selon `MASTER.md` :

1. **Finaliser la vérité d'accès invite en prod**
   → Exécuter la migration SQL `invites.user_id` en prod (commentée dans `supabase-schema.sql`).
   → Vérifier que tous les comptes admin attendus ont bien `profiles.is_admin = true`.

2. **Approfondir la lecture cross-sessions**
   → Le socle existe dans le prompt, le mapping et Today. Rendre la lecture plus précise, plus proactive, moins heuristique.

3. **Faire du Mapping un vrai miroir de progression**
   → Ajouter : historique, évolution de l'ikigai, blocages travaillés ou estompés, lecture longitudinale.

4. **Transformer `Aujourd'hui` en `Zen`**
   → Garder tout le runtime branché (`next_action`, reprise de session, proof layer, lien journal).
   → Ajouter : exercice ou rituel adapté, ton plus calme et immersif, logique de recentrage / affirmation.

5. **Renforcer la boucle `Chat → Journal → Zen`**
   → Réinjecter le journal dans le contexte chat. Rendre Noema capable de repartir de ce que l'utilisateur a écrit.

6. **Approfondir la phase visible**
   → Rendre le passage `Guide → Stratège` perceptible dans toute l'UX, pas seulement signaletique.

7. **Nettoyer les reliquats hybrides**
   → Supprimer `src/App.original.jsx`, `src/constants/prompt-greffier.js`.
   → Nettoyer les imports/états orphelins dans `AppShell.jsx`.
   → Aligner le contrat `_ui` entre `prompt.js` et `applyUI()`.

8. **Extensions — plus tard**
   → `semantic_memory`, emails de fin de phase, offre Pro, sophistication avancée de Zen.

---

## 11. Santé du projet au moment de la pause

```
npm run build   → OK (chunk principal volumineux signalé par Vite, non bloquant)
npm test        → KO — aucun fichier de test Vitest présent
npm run lint    → à vérifier
```

Le build de production passe. L'app est déployable sur Netlify dans son état actuel.

---

## 12. Pour reprendre

1. Lire dans l'ordre : `MASTER.md` → `PROJECT.md` → `docs/system/README.md` → les 7 docs système.
2. Ne jamais utiliser `ROADMAP.md`, `DEBATE.md`, `RETENTION.md`, `codex.md` comme sources de vérité d'état.
3. Ne jamais considérer `src/App.original.jsx` ou `src/constants/prompt-greffier.js` comme runtime actuel.
4. Points de vérité runtime : `src/App.jsx` · `src/lib/access.js` · `src/pages/AppShell.jsx` · `netlify/functions/claude.js` · `supabase-schema.sql`.
5. La prochaine évolution produit est `Aujourd'hui → Zen` sans perdre le runtime déjà branché.
