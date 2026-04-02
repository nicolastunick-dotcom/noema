# NOEMA SYSTEM MAP

Document de cartographie structurelle, fonctionnelle et produit du codebase Noema.

Base d'analyse:
- code du frontend `src/`
- Netlify Functions `netlify/functions/`
- schéma `supabase-schema.sql`
- configs `netlify.toml`, `vite.config.js`, `package.json`
- documentation locale `PROJECT.md`, `ROADMAP.md`, `DEBATE.md`, `RETENTION.md`, `codex.md`, `docs/appshell-refactor-plan.md`

Principe:
- `réel` = branché dans le runtime actuel
- `partiel` = présent mais incomplet, incohérent ou contournable
- `mocké` = surtout visuel / hardcodé
- `mort / legacy` = plus utilisé par le runtime actuel

## 1. Résumé exécutif

Noema n'est pas, dans le code actuel, un "système produit complet d'accompagnement introspectif". C'est surtout:
- une application React/Vite sans `react-router`, routée à la main par `src/App.jsx` et `src/lib/access.js`
- un coeur métier concentré dans `src/pages/AppShell.jsx`
- un chat branché à Anthropic via `netlify/functions/claude.js`
- une mémoire utilisateur persistée dans Supabase via `memory` et des snapshots de sessions via `sessions`
- un paywall Stripe/Supabase réellement branché, mais avec des bypass legacy/admin/invite
- un écran Mapping réellement alimenté
- des écrans `Journal` et `Today` désormais reliés à une couche de preuve et d'impact simple

Etat réel du produit aujourd'hui:
- `réel`: auth, signup, reset password, invite beta, paywall, checkout initiation, webhook Stripe, chat, mémoire, mapping, onboarding, admin panel partiel
- `partiel`: Greffier, billing global, accès admin, accès invitation, cohérence prompt/UI, cohérence docs/code
- `mocké`: offre Pro
- `réel partiel`: Journal (persistance réelle, prompt guidé par `next_action`)
- `réel`: Today (consomme `next_action` live, charge dernière entrée journal, fallback honnête, preuve et impact visibles)
- `réel`: trial layer (essai gratuit journalier via `rate_limits`) et proof layer (assemblage UI local sans LLM)
- `mort / legacy`: `src/App.original.jsx`, plusieurs composants de panneaux latéraux, `src/constants/prompt-greffier.js`, une partie de la logique `access_codes`

Point de vérité produit:
- côté frontend: `src/App.jsx` + `src/lib/access.js` + `src/pages/AppShell.jsx`
- côté backend IA: `netlify/functions/claude.js`
- côté données utilisateur: `memory`, `sessions`, `subscriptions`, `rate_limits`
- côté trial/proof: `src/lib/entitlements.js` + `src/lib/productProof.js`

Limites structurantes:
- le produit raconte encore plusieurs versions de Noema à la fois
- le prompt principal attend une couche `_ui` Phase 1/Phase 2, mais l'UI actuelle n'en consomme qu'une partie
- le Greffier existe réellement, mais n'est pas la source de vérité du Mapping affiché
- les quotas ne sont plus incohérents, mais restent volontairement simples et journaliers
- la notion de "session" persistée est en réalité un snapshot, pas un objet session live stable

## 2. Vue système globale

### 2.1 Architecture runtime

| Couche | Fichiers centraux | Rôle réel | Etat |
|---|---|---|---|
| Routage + garde d'accès | `src/App.jsx`, `src/lib/access.js` | Auth, paywall, onboarding, navigation SPA | réel |
| App privée | `src/pages/AppShell.jsx`, `src/lib/entitlements.js`, `src/lib/productProof.js` | Orchestration chat, mémoire, quota trial/full, preuve produit, save session, tabs | réel |
| UI chat | `src/pages/ChatPage.jsx` | Affichage messages + saisie + essai gratuit + preuve visible + CTA pricing | réel |
| Mapping | `src/pages/MappingPage.jsx` | Lecture visuelle de `insights`, `ikigai`, `step` | réel |
| Journal | `src/pages/JournalPage.jsx` | Lecture/écriture `journal_entries` Supabase, pré-rempli avec `next_action` session | réel (Sprint 5) |
| Today | `src/pages/TodayPage.jsx` | Consomme `next_action` live depuis AppShell + charge dernière entrée journal + expose impact/proof | réel |
| Supabase client | `src/lib/supabase.js` | Client Supabase + construction de contexte mémoire | réel |
| IA principale | `netlify/functions/claude.js` | Vérif JWT, résolution du tier d'accès, quota serveur, appel Anthropic, lancement Greffier | réel |
| Greffier | `netlify/functions/greffier.js` | Extraction secondaire Haiku + écritures DB partielles | partiel |
| Billing | `src/pages/Pricing.jsx`, `create-checkout-session.js`, `stripe-webhook.js` | Checkout + sync abonnement | réel |
| Admin | `src/components/AdminPanel.jsx`, `admin-tools.js` | Outils admin + simulations | partiel |

### 2.2 Trial layer

Le trial layer est maintenant réel et minimal :
- tout utilisateur authentifié sans abonnement actif devient `trial`
- la limite gratuite réutilise `rate_limits`
- le backend reste seule autorité pour le quota
- aucun nouvel objet métier, aucune table nouvelle

### 2.3 Proof layer

Le proof layer est maintenant réel et non génératif :
- `ChatPage` et `TodayPage` affichent maintenant une preuve différentielle
- catégories visibles :
  - `Nouveau`
  - `Confirme`
  - `Revient`
  - `A poursuivre`
- l'assemblage vient uniquement de `insights`, `next_action`, `step` et de la dernière `session` déjà persistée
- `TodayPage` ajoute des indicateurs d'impact depuis `journal_entries` et `sessions`
- `ChatPage` et `TodayPage` affichent aussi un bloc `Depuis ta derniere visite` sans appel LLM
- aucun appel LLM supplémentaire

### 2.4 Frontend / backend / data

Frontend:
- React 18 + Vite
- pas de `react-router`
- style majoritairement inline, avec reste CSS legacy dans `src/styles/app.css`

Backend:
- Netlify Functions en mode serverless
- pas de backend applicatif séparé
- Anthropic et Stripe ne sont appelés que côté fonctions

Data/Auth:
- Supabase Auth pour login/signup/reset/OAuth
- Supabase Postgres pour mémoire, snapshots, quotas, abonnements, invites, coûts API

### 2.5 V1 vs V2

V1:
- monolithe `src/App.original.jsx`
- ancien shell avec side panels réels
- ancien prompt et ancienne logique dev Anthropic (`x-api-key` côté client)
- ancienne logique codes d'accès plus centrale

V2:
- `src/App.jsx` gère l'accès et les routes
- `src/pages/AppShell.jsx` orchestre l'app privée
- pages séparées par surface (`Chat`, `Mapping`, `Journal`, `Today`)
- paywall et onboarding branchés au runtime

Transitions inachevées:
- `src/App.original.jsx` est toujours présent
- `AppShell` importe encore des briques V1 non utilisées
- les alias legacy `/chat`, `/mapping`, `/journal`, `/today` sont encore acceptés
- `prompt-greffier.js` existe mais le runtime utilise un prompt inline différent dans `greffier.js`

## 3. Cartographie des pages

### 3.1 Pages publiques

| Route | Fichier | Rôle réel | Données | APIs | Etat |
|---|---|---|---|---|---|
| `/` | `src/pages/Landing.jsx` | Landing marketing + CTA vers login/pricing/onboarding preview | hardcodées | aucune | statique |
| `/login` | `src/pages/Login.jsx` | login, signup, reset email, OAuth Google, code d'accès | Supabase Auth, `access_codes` | Supabase, `/.netlify/functions/verify-code` | réel, avec branche legacy |
| `/pricing` | `src/pages/Pricing.jsx` | paywall + checkout | `user`, `accessState` | `/.netlify/functions/create-checkout-session` | réel pour mensuel, Pro visuel, surfaces à venir assumées |
| `/onboarding-preview` | `src/pages/Onboarding.jsx` | démo publique des 4 slides | aucune | aucune | démo |
| `/onboarding` | `src/pages/Onboarding.jsx` | onboarding post-abonnement | `memory.onboarding_done` | Supabase | réel |
| `/success` | `src/pages/Success.jsx` | page post-checkout avec verification d'activation | `user`, `subscriptions.status` | Supabase via `sb` client | partiel mais fiable |
| `/invite` | `src/pages/InvitePage.jsx` | validation invite beta + stockage local du token | `sessionStorage` | `/.netlify/functions/validate-invite` | réel mais transitoire |
| `/reset-password` | `src/pages/ResetPassword.jsx` | finalisation reset password | session Supabase recovery | Supabase Auth | réel |
| `/contact` | `src/pages/Contact.jsx` | formulaire contact | form local | `/.netlify/functions/send-contact` | réel |
| `/privacy` | `src/pages/PrivacyPolicy.jsx` | page légale | aucune | aucune | statique |
| `/terms` | `src/pages/TermsOfService.jsx` | page légale | aucune | aucune | statique |
| `/ethical-ai` | `src/pages/EthicalAI.jsx` | manifeste produit | aucune | aucune | statique |

### 3.2 Pages privées

| Route | Fichier | Rôle réel | Données | APIs | Etat |
|---|---|---|---|---|---|
| `/app/chat` | `src/pages/ChatPage.jsx` via `AppShell.jsx` | coeur métier + essai gratuit + preuve visible | `msgs`, `history`, `memory`, `sessions`, `rate_limits`, `quota` | `/.netlify/functions/claude`, Supabase | réel |
| `/app/mapping` | `src/pages/MappingPage.jsx` via `AppShell.jsx` | lecture visuelle du mapping | props issues de `AppShell` | aucune directe | réel mais dépendant du chat |
| `/app/journal` | `src/pages/JournalPage.jsx` via `AppShell.jsx` | journal guidé : lecture/écriture `journal_entries`, prompt `next_action` | `journal_entries`, `next_action` prop, `sessionId` | Supabase direct client | réel (Sprint 5) |
| `/app/today` | `src/pages/TodayPage.jsx` via `AppShell.jsx` | rituel du jour : `next_action` live + dernière entrée journal + impact/proof | `next_action`, `insights`, `step`, `journal_entries`, `sessions`, `quota` | Supabase direct client | réel |

### 3.3 Détails utiles par page

Landing:
- pas de lecture backend
- inclut un placeholder vidéo TODO dans `src/pages/Landing.jsx`
- plus proche d'une page de marque que d'une surface produit

Login:
- la logique `code` existe toujours
- mais l'UI visible ne met plus ce tab en avant
- le code d'accès ne donne plus un vrai accès produit payé

Pricing:
- checkout mensuel branché
- offre Pro présentée mais non branchée
- essai gratuit mentionné explicitement avant paiement
- l'abonnement est présenté comme suite de l'expérience, pas comme prérequis d'entrée
- pour un utilisateur déjà engagé, la page affiche une preuve réelle de valeur construite :
  - jours de suivi
  - fil en cours
  - dernier point travaillé
- le CTA principal n'est plus le même selon le contexte (`Acceder a Noema`, `Garder ce fil vivant`, `Continuer apres l'essai`)
- dépend du webhook pour rendre l'accès réellement actif

Success:
- reçoit `user` et `sb` depuis `App.jsx`
- relit `subscriptions.status`
- affiche un état confirmé ou un état d'activation en cours

Journal (post Sprint 6):
- `FALLBACK_PROMPTS` utilisés si `nextAction` absent
- `next_action` de la session courante affiché comme prompt principal si disponible
- `handleSave()` écrit dans `journal_entries` via Supabase (upsert `user_id + entry_date`)
- entrée du jour rechargée au mount depuis `journal_entries`
- structure UX en 3 niveaux simples: `Intention du jour` -> `Réflexion libre` -> `Ce que tu retiens`
- un lien explicite avec le fil actif est rendu :
  - `Pourquoi cette question revient`
  - `Ce que cette ecriture nourrit`
- feedback de sauvegarde inline, discret, sans toast agressif
- table `journal_entries` dans `supabase-schema.sql` avec RLS

Today (post Sprint 6):
- `nextAction` prop depuis `AppShell` (session live) = intention du jour
- fallback : `next_action` de la dernière entrée `journal_entries`
- charge aussi la dernière `session` persistée pour densifier la reprise
- CTA principal visible : `Passer à l'action` vers le Journal si une intention existe
- si aucune donnée : fallback honnête + CTA chat pour définir l'intention du jour
- question du jour adaptée si entrée journal existe aujourd'hui
- indicateur discret `Jour X de ton parcours` dérivé du nombre d'entrées journal
- repère du jour sobre, sans checkbox ni gamification artificielle
- bloc de preuve visible à partir de `insights`, `next_action`, `step`
- bloc `Depuis ta derniere visite` visible :
  - intention en cours
  - dernier point clarifié
  - ce qu'il reste à reprendre
- indicateurs d'impact sobres :
  - jours de suivi
  - intentions clarifiées
  - fil en cours

## 4. Flux complet du chat

### 4.1 Entrée utilisateur -> réponse affichée

1. `AppShell` hydrate `memory` et la dernière ligne de `sessions`, puis lance `openingMessage()`.
2. `openingMessage()` ajoute en historique un faux message système sous forme de message `user` invisible à l'écran.
   - depuis Sprint 8, ce message d'ouverture ne consomme pas le quota journalier
3. `send(text)` dans `src/pages/AppShell.jsx`:
   - nettoie le texte (`<...>` supprimé, trim, max 2000 chars)
   - appelle `checkRateLimit()`
   - ajoute le message user dans `msgs`
   - ajoute le message user dans `history.current`
   - appelle `callAPI()`
4. `callAPI()`:
   - tronque l'historique via `trimHistory()`
   - construit `memory_context` via `buildMemoryContext(memoryRef.current)`
   - récupère le JWT Supabase
   - POST vers `ANTHROPIC_PROXY`
5. `netlify/functions/claude.js`:
   - vérifie le JWT via Supabase
   - résout le tier d'accès (`trial` / `subscriber` / `invite` / `admin`)
   - applique un quota serveur sur `rate_limits`
   - construit `system = NOEMA_SYSTEM + memory_context`
   - lance `runGreffier()` en parallèle
   - appelle Anthropic Sonnet
   - loggue `api_usage`
   - renvoie `{ content, _greffier, _quota }`
6. Frontend:
   - `parseUI(raw)` extrait `<_ui>...</_ui>`
   - `stripUI(raw)` retire le bloc caché
   - `applyUI(ui)` fusionne l'état visible
   - met à jour la surface trial/proof via `_quota`, `insights`, `next_action`, `step`
   - ajoute la réponse assistant à `msgs`
   - ajoute la réponse brute à `history.current`

### 4.2 Source réelle du mapping affiché

Le Mapping visible n'est pas alimenté par le Greffier.

Source réelle:
- le bloc `<_ui>` demandé à Claude principal dans `src/constants/prompt.js`
- parsé par `src/utils/helpers.js`
- appliqué par `applyUI()` dans `src/pages/AppShell.jsx`

Conséquence:
- l'UI produit dépend surtout de la discipline du modèle principal à produire le bon JSON caché
- le Greffier n'est qu'une couche secondaire de persistance/admin

### 4.3 Incohérences majeures du flux chat

#### A. Le prompt principal et l'UI ne parlent pas exactement le même langage

`prompt.js` demande dans `<_ui>`:
- `phase`
- `msg_count`
- `ikigai_completude`
- `next_action`
- `phase_ready`

`AppShell.applyUI()` lit surtout:
- `etat`
- `mode`
- `step`
- `forces`
- `blocages`
- `contradictions`
- `ikigai`
- `session_note`

Ce que cela implique:
- `mode` et `step` ne sont pas explicitement demandés par le prompt actuel
- `phase`, `msg_count`, `ikigai_completude`, `phase_ready`, `next_action` ne sont pas exploités par l'UI principale
- le contrat prompt/UI est partiellement désaligné

#### B. Le Greffier attend des données que le frontend n'envoie pas

`claude.js` lit:
- `session_id`
- `user_memory`

Mais `AppShell.callAPI()` n'envoie que:
- `model`
- `max_tokens`
- `memory_context`
- `messages`

Conséquences:
- `runGreffier()` reçoit `sessionId = null`
- la branche `sessions.update(...)` du Greffier est en pratique dormante
- le Greffier travaille sans mémoire structurée complète côté input

#### C. La persistance est par snapshot, pas par session vivante

`saveSession()`:
- upsert la même ligne `sessions` pour toute la session live
- upsert `memory`

Il est appelé par:
- `beforeunload`
- `setInterval` toutes les 2 minutes
- `newSession()`

Conséquences:
- une session logique garde le même `session_id` pendant toute sa durée
- `session_count` est incrémenté une seule fois par session live sauvegardée
- l'objet `sessions` reste un snapshot de transcript, mais il est maintenant stabilisé par identifiant

#### D. Les quotas sont doublement incrémentés

Frontend:
- `checkRateLimit()` lit puis upsert `rate_limits`
- limite locale: 30/minute et 100/jour

Backend:
- `claude.js` relit puis upsert `rate_limits`
- limite serveur: 25/jour

Conséquences:
- la même table est incrémentée côté client puis côté serveur
- le compteur journalier peut grimper deux fois par message
- `openingMessage()` incrémente côté serveur sans passer par le quota client
- le plafond effectif côté utilisateur est inférieur à "25 messages/session"

Inference basée sur le code:
- ouverture: +1 côté serveur
- chaque message user: +1 côté client, +1 côté serveur
- un utilisateur peut se faire bloquer autour de 12 tours utilisateur + message d'ouverture, pas 25 tours réels

### 4.4 Rôle exact de `ChatPage`

`src/pages/ChatPage.jsx` n'est pas l'orchestrateur métier.
Son rôle réel:
- rendu des bulles
- textarea et bouton d'envoi
- affichage `NoemaOrb` pendant l'attente
- sanitation HTML via DOMPurify
- déclenchement logout

Toute la logique métier vit dans `AppShell`.

## 5. Greffier / Insights / Ikigai

### 5.1 Où intervient le Greffier

Localisation runtime:
- `netlify/functions/greffier.js`
- lancé depuis `netlify/functions/claude.js`

Le fichier `src/constants/prompt-greffier.js` n'est pas utilisé par le runtime actuel.

### 5.2 Fonctionnement réel

Le Greffier:
- prend les 6 derniers messages
- prend un snapshot de mémoire utilisateur si fourni
- appelle Anthropic Haiku
- attend un JSON structuré différent de celui demandé au prompt principal
- normalise la réponse
- peut upsert `memory`
- peut logguer `api_usage`
- peut mettre à jour `sessions` si `sessionId` existe

### 5.3 Ce qu'il extrait

Schéma Greffier runtime:
- `phase`
- `progression`
- `conscience`
- `forces`
- `blocages`
- `contradictions`
- `ikigai`
- `ui_insight_type`
- `etat`
- `step`
- `session_note`
- `next_action`

### 5.4 Ce qui est réellement utilisé

Réel:
- le Greffier tourne
- il peut écrire `memory`
- il renvoie `_greffier` au frontend

Partiel:
- `_greffier` n'alimente pas le Mapping public
- il sert surtout de log consultable depuis l'admin panel
- `session.update` du Greffier est presque inactive faute de `sessionId`

### 5.5 Ikigai: génération, stockage, affichage

Génération:
- prompt principal demande à Claude de remplir progressivement `ikigai` dans `_ui`
- Greffier peut aussi écrire `ikigai` côté mémoire

Stockage:
- `memory.ikigai`
- `sessions.ikigai`

Affichage:
- `MappingPage.jsx` lit `ikigai` fourni par `AppShell`

Limitations:
- `ikigai_completude` est défini dans le prompt principal, mais non exploité par l'UI
- `next_action` est défini dans le prompt principal et par le Greffier, mais `JournalPage` et `TodayPage` n'en dépendent pas dans le runtime actuel

## 6. Supabase / données

### 6.1 Tables réellement utilisées

| Table | Lecture | Ecriture | Rôle réel | Etat |
|---|---|---|---|---|
| `profiles` | client + fonctions serveur | hors scope courant | admin | réel |
| `memory` | `App.jsx`, `AppShell.jsx` | `AppShell`, `Onboarding`, `greffier` | mémoire inter-sessions + onboarding_done | réel |
| `sessions` | `AppShell` | `AppShell`, `greffier` partiellement | snapshots de conversations | réel mais mal nommé |
| `rate_limits` | `AppShell`, `claude.js` | `AppShell`, `claude.js` | quotas | réel mais incohérent |
| `access_codes` | `Login.jsx` | `Login.jsx`, `verify-code.js` | ancien système de codes | partiel / obsolète |
| `subscriptions` | `useSubscriptionAccess.js` | `stripe-webhook.js` | vérité principale d'accès payant | réel |
| `api_usage` | `admin-tools.js` | `claude.js`, `greffier.js` | suivi tokens/coûts | réel |
| `invites` | `validate-invite.js` | `create-invite.js` | accès beta | réel mais hors schéma principal |
| `semantic_memory` | personne | personne | vector DB future | mort / non branché |

### 6.2 Absences ou trous de schéma

`invites`:
- utilisée en runtime
- absente de `supabase-schema.sql`
- documentée manuellement dans `PROJECT.md`

`journal_entries` (Sprint 5):
- table ajoutée dans `supabase-schema.sql`
- lue et écrite par `JournalPage` directement via le client Supabase
- RLS : `FOR ALL USING (auth.uid() = user_id)`
- upsert sur contrainte `user_id + entry_date`

### 6.3 Auth / sessions / mémoire

Auth:
- email/password: réel
- signup: réel
- Google OAuth: réel côté code, dépend config externe
- reset password: réel
- anonymous sign-in par code: réel techniquement, mais n'ouvre plus l'accès produit

Mémoire:
- `memory` est la mémoire produit structurée
- `buildMemoryContext()` injecte les derniers `session_notes`, `forces`, `ikigai`
- `buildSystemPrompt()` existe, mais n'est pas utilisé dans le flux runtime actuel

Sessions:
- `sessions` ne représente pas un objet session stable avec ID courant
- c'est une table de snapshots d'historiques persistés

### 6.4 Billing / accès

Vérité principale:
- `subscriptions` lue par `useSubscriptionAccess()`

Bypass:
- `VITE_ADMIN_EMAIL`
- `sessionStorage.noema_invite`

Conséquence:
- il n'y a pas un seul point de vérité d'accès
- il y a une vérité principale + deux contournements assumés

### 6.5 `access_codes`: état réel

Le système `access_codes` existe encore, mais n'est plus un vrai mécanisme d'accès produit.

Pourquoi:
- `Login.doCode()` valide le code, signe l'utilisateur anonymement, met à jour `access_codes`
- ensuite `App.jsx` applique toujours le paywall via `useSubscriptionAccess()`
- `useSubscriptionAccess()` ne lit jamais `access_codes`

Conclusion:
- `access_codes` est un reste d'ancienne logique d'accès
- la logique admin qui génère ces codes est encore là
- mais le chemin vers l'app privée n'est plus réellement branché dessus

## 7. Hooks / state

### 7.1 Hook custom central

`src/hooks/useSubscriptionAccess.js`

Responsabilités:
- lecture `profiles`
- fallback admin via `VITE_ADMIN_EMAIL`
- lecture `sessionStorage.noema_invite`
- lecture `subscriptions`
- synthèse `hasActiveSubscription`, `isAdmin`, `subscription`, `profile`

C'est le vrai hook de décision d'accès.

### 7.2 Etat monolithique non extrait

Le reste de l'état métier vit dans `src/pages/AppShell.jsx`:
- messages
- input
- typing
- `mstate`
- `step`
- `insights`
- `ikigai`
- `history`
- `memoryRef`
- autosave
- quota
- opening message

La documentation `docs/appshell-refactor-plan.md` confirme qu'une extraction en hooks était prévue:
- `useNoemaApi`
- `useNoemaRateLimit`
- `useNoemaSession`
- `useNoemaUIState`

Ces hooks n'existent pas aujourd'hui.

### 7.3 State legacy / non utilisé

Dans `AppShell.jsx`, plusieurs états/imports témoignent d'un refactor incomplet:
- `sideTab`
- `mobTab`
- `msgsRef`
- `mode`
- `greffierLogTick`
- imports `StateBadge`, `InsightsPane`, `ProgressPane`, `IkigaiPane`, `SendSVG`, `buildSystemPrompt`

## 8. APIs et intégrations

### 8.1 Anthropic

Réel:
- modèle principal: `claude-sonnet-4-6`
- via `netlify/functions/claude.js`

Réel secondaire:
- Greffier via `claude-haiku-4-5-20251001`

Important:
- en production, le frontend appelle la fonction Netlify
- en DEV, `ANTHROPIC_PROXY` pointe directement vers `https://api.anthropic.com/v1/messages`
- mais `AppShell.callAPI()` n'envoie pas de `x-api-key`

Conclusion:
- le chat local DEV est probablement cassé dans le code actuel
- `App.original.jsx` contenait encore l'ancien comportement DEV avec `VITE_ANTHROPIC_KEY`

### 8.2 Supabase

Rôles exacts:
- Auth
- DB app
- JWT de garde serveur
- RLS

### 8.3 Stripe

Réel:
- création checkout session
- webhook subscriptions
- paywall basé sur `subscriptions`

Partiel:
- plan Pro non branché
- URLs de checkout codées en dur vers la prod (`success_url`, `cancel_url`)

### 8.4 Netlify Functions

| Fonction | Rôle réel | Etat |
|---|---|---|
| `claude.js` | proxy IA principal | réel |
| `greffier.js` | extraction silencieuse secondaire | partiel |
| `admin-tools.js` | reset mémoire + coûts API | réel |
| `create-checkout-session.js` | checkout Stripe | réel |
| `stripe-webhook.js` | sync subscriptions | réel |
| `send-contact.js` | email contact | réel |
| `create-invite.js` | création invite admin | réel |
| `validate-invite.js` | validation invite | réel |
| `verify-code.js` | génération code d'accès depuis code admin | partiel / legacy |

### 8.5 Autres intégrations

Google OAuth:
- branché côté code dans `Login.jsx`
- nécessite config externe

Nodemailer/Gmail:
- branché pour Contact

## 9. Zones mortes / ambiguës / obsolètes

### 9.1 Mort / legacy

- `src/App.original.jsx`
- `src/constants/prompt-greffier.js`
- `src/components/StateBadge.jsx`
- `src/components/InsightsPane.jsx`
- `src/components/ProgressPane.jsx`
- `src/components/IkigaiPane.jsx`
- `stripUIStreaming()` dans `src/utils/helpers.js`
- une partie du système `access_codes`

### 9.2 Ambiguïtés structurelles

- le prompt principal et l'UI n'utilisent pas exactement le même schéma `_ui`
- le Greffier et le prompt Greffier de `src/constants/` ne sont pas alignés
- `sessions` signifie en pratique snapshots, pas session live
- `rate_limits` mélange deux politiques de quota
- `invites` existe hors schéma principal
- l'admin "global" n'est pas global pour les coûts API

### 9.3 Surfaces produit surtout visuelles

- `JournalPage`
- `TodayPage`
- `Success`
- `onboarding-preview`
- offre Pro dans `Pricing`

### 9.4 Incohérences doc/code

ROADMAP:
- promet Journal persistant et Today généré par Noema
- le runtime actuel ne le fait pas

PROJECT:
- décrit `prompt-greffier.js` comme prompt actif
- le runtime utilise un prompt inline différent

## 10. Vérité produit

### 10.1 Ce que Noema est réellement aujourd'hui

Noema est actuellement:
- un produit de chat introspectif payant
- avec mémoire inter-sessions simplifiée
- avec cartographie visuelle dérivée du chat
- avec onboarding, paywall, et instrumentation admin minimale

Ce qu'il n'est pas encore pleinement:
- un compagnon quotidien structuré
- un système journal + rituel réellement branché
- un moteur d'insights unifié où Greffier, Mapping et mémoire utilisent la même vérité
- un produit Phase 1 / Phase 2 cohérent de bout en bout dans le runtime

### 10.2 Ce que le produit prétend être

La copie, le prompt et certaines docs décrivent:
- une progression profonde Phase 1 -> Phase 2
- une mémoire cumulative fine
- un journal guidé
- un rituel quotidien personnalisé
- une continuité produit forte

### 10.3 Ecart réel

L'écart principal est ici:
- la conversation et le paywall sont réels
- la continuité produit hors chat est encore largement incomplète

En pratique, Noema ressemble plus à:
- un coeur chat + mapping + paywall
qu'à:
- une suite introspective complète déjà branchée

## 11. Glossaire

Greffier:
- agent secondaire Haiku lancé en parallèle du chat
- extrait une structure d'insights et peut écrire `memory`
- n'est pas la source principale du Mapping affiché

Ikigai:
- objet structuré avec `aime`, `excelle`, `monde`, `paie`, `mission`
- stocké dans `memory` et `sessions`
- affiché dans `Mapping`

Mapping:
- surface visuelle qui lit `insights`, `ikigai`, `step`
- ne calcule rien elle-même

Journal:
- page de journal actuellement locale et non persistée

Today:
- page de rituel quotidien actuellement locale et non générée

Session:
- dans le code actuel, surtout un snapshot sauvegardé d'historique

Memory:
- résumé inter-sessions persistant dans la table `memory`

Subscription:
- enregistrement Stripe synchronisé dans `subscriptions`
- vérité principale d'accès payant

Invite:
- bypass beta stocké localement via `sessionStorage.noema_invite`

Access code:
- ancien système de code temporaire encore présent, mais plus central pour l'accès produit

## 12. Annexes

### 12.1 Fichiers critiques

Accès / routing:
- `src/App.jsx`
- `src/lib/access.js`
- `src/hooks/useSubscriptionAccess.js`

Chat / mémoire:
- `src/pages/AppShell.jsx`
- `src/pages/ChatPage.jsx`
- `src/utils/helpers.js`
- `src/lib/supabase.js`
- `src/constants/prompt.js`

Backend IA:
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`

Billing / accès:
- `src/pages/Pricing.jsx`
- `netlify/functions/create-checkout-session.js`
- `netlify/functions/stripe-webhook.js`
- `src/pages/InvitePage.jsx`
- `netlify/functions/create-invite.js`
- `netlify/functions/validate-invite.js`

Admin:
- `src/components/AdminPanel.jsx`
- `netlify/functions/admin-tools.js`

Schéma:
- `supabase-schema.sql`

Legacy:
- `src/App.original.jsx`
- `src/constants/prompt-greffier.js`

### 12.2 Variables d'environnement référencées

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
- `DEV`

Backend:
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GMAIL_APP_PASSWORD`
- `ADMIN_CODES`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

### 12.3 Fonctions backend

`claude.js`
- vérifie JWT
- applique quota serveur
- appelle Anthropic
- lance Greffier
- loggue `api_usage`

`greffier.js`
- appelle Haiku
- normalise insights
- peut upsert `memory`
- peut tenter update `sessions`

`admin-tools.js`
- `get-costs`
- `reset-memory`

`create-checkout-session.js`
- crée session Stripe checkout

`stripe-webhook.js`
- sync `subscriptions`

`create-invite.js`
- crée invite beta admin

`validate-invite.js`
- valide token invite

`verify-code.js`
- vérifie code admin et génère access code

`send-contact.js`
- envoie email support

### 12.4 Recommandations pour futures IA

Toujours partir de ces points de vérité:
- `src/App.jsx`
- `src/lib/access.js`
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `supabase-schema.sql`

Ne pas supposer que:
- `Journal` est persisté
- `Today` est généré par Noema
- `Greffier` alimente directement le Mapping affiché
- `prompt-greffier.js` est actif
- `sessions` = session live unique
- `access_codes` ouvre encore réellement l'app

Avant toute évolution produit, vérifier en priorité:
1. alignement prompt `_ui` <-> `applyUI()`
2. stratégie réelle des quotas
3. rôle souhaité du Greffier vs Claude principal
4. vérité unique d'accès (`subscriptions` vs admin legacy vs invite)
5. statut réel de `Journal` et `Today`
