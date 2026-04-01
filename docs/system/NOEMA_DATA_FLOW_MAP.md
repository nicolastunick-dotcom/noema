# NOEMA DATA FLOW MAP

Document de cartographie approfondie des flux de données réels de Noema.

Base d'analyse:
- code frontend `src/`
- Netlify Functions `netlify/functions/`
- schéma `supabase-schema.sql`
- documentation locale `PROJECT.md`, `NOEMA_SYSTEM_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `docs/appshell-refactor-plan.md`, `RETENTION.md`

Principe:
- `réel` = branché dans le runtime actuel
- `partiel` = présent mais incomplet, incohérent, contournable, ou à effet limité
- `mocké` = surtout visuel / local / sans persistance produit
- `legacy` = reliquat non source de vérité
- `supposé` = inférence plausible mais non démontrée directement par un flux exécuté

## 1. Résumé exécutif

Les données de Noema sont aujourd'hui organisées autour de quatre noyaux réels:
- identité/authentification via Supabase Auth
- décision d'accès via `useSubscriptionAccess()` côté frontend
- coeur produit via `memory`, `sessions`, `rate_limits`, `api_usage`
- support admin/beta via `profiles`, `invites`, `access_codes`

La réalité du système data n'est pas "une base cohérente pilotée par une unique source de vérité". C'est plutôt:
- un accès privé décidé dans `src/App.jsx` à partir d'un hook frontend qui combine `profiles`, `subscriptions`, `sessionStorage` et un bypass email legacy (pré-contrôle UX — le backend est maintenant l'autorité)
- une mémoire produit partagée entre `memory` et `sessions`, avec redondance partielle et usages différents
- ~~des écritures concurrentes client/serveur sur `rate_limits`~~ **RÉSOLU Sprint 1** : le frontend ne touche plus `rate_limits`, seul `claude.js` écrit
- une table `subscriptions` qui porte la vérité payante réelle, mais seulement après webhook Stripe
- des surfaces `Journal` et `Today` encore presque totalement hors base

Ce que les données sont réellement aujourd'hui (post Sprint 1):
- `réel`: `memory`, `sessions`, `rate_limits` (backend uniquement), `subscriptions`, `api_usage`, `profiles` pour l'admin, `invites` avec `user_id` persistant pour la beta, `access_codes` pour un ancien flux de code
- `partiel`: `profiles` comme vrai profil utilisateur, `sessions` comme vraie session live, `api_usage` comme vision admin globale, linkage `invites.user_id` (dépend de la migration SQL en prod)
- `mocké`: persistance `Journal`, persistance `Today`, état post-paiement dans `Success`
- `legacy`: `semantic_memory`, `match_semantic_memory`, une partie de `access_codes`, les commentaires Greffier sur `user_insights` / `ikigai_state`

Les désalignements structurants les plus importants sont (post Sprint 1):
- ~~l'accès à l'app est décidé côté frontend, mais `/.netlify/functions/claude` ne vérifie que le JWT, pas l'abonnement~~ **RÉSOLU Sprint 1**
- ~~`invites` existe dans le runtime, mais pas dans `supabase-schema.sql`~~ **RÉSOLU Sprint 1**
- `sessions` s'appelle session, mais stocke en pratique des snapshots répétés — **cible Sprint 3**
- `memory` stocke plus de champs qu'elle n'en réinjecte réellement au prompt
- l'admin panel annonce des "coûts API totaux" alors que `admin-tools.js` lit seulement l'usage du user courant

## 2. Vue d'ensemble des données

### 2.1 Grandes catégories

Identité et session auth:
- Supabase Auth porte `session`, `user`, signup, login, reset password, OAuth Google, anonymous sign-in
- ces données ne vivent pas dans `supabase-schema.sql`, mais elles pilotent la quasi-totalité des lectures/écritures applicatives

Accès et entitlement (post Sprint 1):
- `subscriptions` porte la vérité d'abonnement payant — vérifiée côté backend dans `claude.js`
- `profiles.is_admin` porte un flag admin — vérifié côté backend dans `claude.js`
- `invites.user_id` porte l'entitlement beta persistant — source de vérité backend depuis Sprint 1
- `sessionStorage.noema_invite` reste un fallback UX pour les utilisateurs existants pas encore liés en DB
- `access_codes` porte encore un flux historique de code d'accès, sans être la vérité d'accès produit

Données coeur produit:
- `memory` = mémoire inter-sessions cumulée + `onboarding_done`
- `sessions` = snapshots de fin de session / autosave
- `rate_limits` = compteur journalier en base
- `api_usage` = journal des appels Anthropic

Données support et opérations:
- `invites` = tokens beta actifs/inactifs
- `profiles` = lookup admin

Données promises mais non branchées:
- `semantic_memory` + RPC `match_semantic_memory`
- une éventuelle table `journal`
- une éventuelle persistance `today`

### 2.2 Frontend / backend / persistance

Frontend (post Sprint 1):
- lit directement Supabase pour `memory`, `sessions`, `profiles`, `subscriptions`, `invites` (own), `access_codes`
- écrit directement Supabase pour `memory`, `sessions`, `access_codes`
- ne lit plus ni n'écrit `rate_limits` (supprimé Sprint 1)
- utilise `sessionStorage` pour l'accès beta invite en fallback — tente la persistance en DB via `validate-invite` avec JWT

Backend Netlify:
- lit/écrit Supabase pour `rate_limits`, `api_usage`, `memory`, `sessions`, `subscriptions`, `profiles`, `invites`, `access_codes`
- ne lit jamais `semantic_memory`

Persistance réelle vs support:
- vérité produit visible: surtout état React local dans `AppShell`, hydraté depuis `sessions` puis mis à jour par le bloc `<_ui>`
- vérité de continuité conversationnelle: surtout `memory`
- vérité d'accès payant: `subscriptions`
- vérité admin: `profiles.is_admin` avec bypass `VITE_ADMIN_EMAIL`
- support / observabilité: `api_usage`

Références:
- `src/App.jsx:39-43`, `src/App.jsx:116-156`, `src/App.jsx:166-207`
- `src/hooks/useSubscriptionAccess.js:21-159`
- `src/pages/AppShell.jsx:90-111`, `src/pages/AppShell.jsx:213-305`
- `supabase-schema.sql:7-198`

## 3. Cartographie des tables

| Table | Rôle réel | Colonnes importantes | Qui lit | Qui écrit | Etat |
|---|---|---|---|---|---|
| `profiles` | lookup du statut admin, pas vrai profil produit | `id`, `is_admin`, `created_at` | `useSubscriptionAccess`, `create-invite`, `admin-tools` | personne dans le runtime lu ici | réel mais partiel |
| `memory` | mémoire inter-sessions + `onboarding_done` | `user_id`, `forces`, `contradictions`, `blocages`, `ikigai`, `session_notes`, `session_count`, `onboarding_done`, `updated_at` | `App.jsx`, `AppShell`, `buildMemoryContext` indirectement | `Onboarding`, `AppShell`, `greffier`, `admin-tools` delete | réel |
| `sessions` | snapshots d'historique et d'état UI | `id`, `user_id`, `ended_at`, `history`, `insights`, `ikigai`, `step`, `session_note` | `AppShell` | `AppShell`, `greffier` si `sessionId` | réel mais mal nommé |
| `rate_limits` | compteur journalier DB pour quotas | `user_id`, `date`, `count` | `AppShell`, `claude.js` | `AppShell`, `claude.js` | réel mais incohérent |
| `access_codes` | ancien système de codes à usage borné | `code`, `expires_at`, `used_by`, `max_uses`, `use_count` | `Login.doCode()` | `Login.doCode()`, `verify-code.js` | partiel / legacy |
| `subscriptions` | vérité de l'accès payant | `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`, `cancel_at_period_end` | `useSubscriptionAccess` | `stripe-webhook.js` | réel |
| `semantic_memory` | vector DB future | `content`, `metadata`, `embedding`, `created_at` | personne | personne | legacy / non branché |
| `api_usage` | journal des tokens et coûts | `user_id`, `model`, `prompt_tokens`, `completion_tokens`, `session_id`, `created_at` | `admin-tools` | `claude.js`, `greffier.js` | réel mais partiel |
| `invites` | tokens d'invitation beta | `id`, `token`, `label`, `created_by`, `created_at`, `active` | `validate-invite.js` | `create-invite.js` | réel mais hors schéma principal |

### 3.1 Notes importantes par table

`profiles`:
- la table existe dans `supabase-schema.sql`, avec `SELECT` public et `UPDATE own`
- aucun flux inspecté ne crée automatiquement une ligne `profiles` au signup
- dans le runtime, `profiles` sert seulement à lire `is_admin`

`memory`:
- porte à la fois l'onboarding (`onboarding_done`) et la mémoire conversationnelle
- `buildMemoryContext()` réinjecte désormais : `session_count`, `session_notes`, `forces`, `contradictions`, `blocages` (3 niveaux), `ikigai` (5 champs), `step` — Sprint 3
- `claude.js` charge la mémoire depuis DB côté serveur via `buildServerMemoryContext()` — ne dépend plus du `memory_context` envoyé par le client
- `AppShell.updateMemoryRef(ui)` enrichit `memoryRef.current` après chaque réponse `_ui`, sans attendre `saveSession()` — le contexte s'accumule mid-session

`sessions`:
- l'UI ne relit que `insights`, `ikigai`, `step` de la dernière ligne
- `history` est stocké mais pas rechargé dans l'interface au bootstrap
- `id` existe, mais n'est pas branché comme session live courante

`rate_limits`:
- la table ne sait compter que par jour
- le frontend et le backend y appliquent des politiques différentes

`access_codes`:
- garde un vrai traçage `used_by` / `use_count`
- ne joue plus le rôle central d'ouverture produit

`subscriptions`:
- aucune écriture client directe
- la ligne n'est créée ou mise à jour qu'après événements Stripe

`api_usage`:
- `session_id` existe au schéma
- `claude.js` n'insère jamais `session_id`
- `greffier.js` l'insère, mais le runtime actuel lui passe `null`

`invites`:
- la table est documentée dans `PROJECT.md`, pas dans `supabase-schema.sql`
- aucun champ d'usage/rédemption n'est prévu

Références:
- `supabase-schema.sql:7-116`
- `supabase-schema.sql:126-198`
- `PROJECT.md:114-126`
- `src/lib/supabase.js:22-56`
- `src/pages/AppShell.jsx:90-111`, `src/pages/AppShell.jsx:272-305`
- `src/pages/Login.jsx:93-140`
- `src/hooks/useSubscriptionAccess.js:64-159`
- `netlify/functions/stripe-webhook.js:46-118`
- `netlify/functions/verify-code.js:41-68`

## 4. Flux de lecture frontend

### 4.1 Auth et garde d'accès

`App.jsx` lit:
- la session auth via `sb.auth.getSession()`
- les changements auth via `sb.auth.onAuthStateChange(...)`
- `memory.onboarding_done` si l'utilisateur a déjà un accès actif

Effet réel:
- la présence d'un utilisateur auth ne suffit pas à entrer dans l'app
- l'utilisateur doit ensuite passer la résolution d'accès de `useSubscriptionAccess()`
- l'absence de ligne `memory` est interprétée comme onboarding non terminé

Références:
- `src/App.jsx:95-114`
- `src/App.jsx:116-156`
- `src/App.jsx:166-207`

### 4.2 Résolution d'accès payant/beta/admin

`useSubscriptionAccess()` lit dans cet ordre logique:
1. rien en base si `VITE_ADMIN_EMAIL` matche déjà l'email du user
2. `profiles.id, is_admin`
3. `sessionStorage.noema_invite`
4. `subscriptions` du user

Ce qui alimente réellement l'UI:
- `access.hasActiveSubscription`
- `access.isAdmin`
- `access.subscription`
- `access.error`

Point important:
- `access_codes` n'est jamais relu ici
- `invites` n'est jamais relu ici non plus; seul le token déjà validé en `sessionStorage` est utilisé

Références:
- `src/hooks/useSubscriptionAccess.js:21-159`
- `src/lib/access.js:57-63`

### 4.3 Bootstrap privé et surfaces chat

`AppShell` lit au montage:
- `memory.*` complet pour `memoryRef`
- la dernière ligne `sessions` avec seulement `insights`, `ikigai`, `step`

L'UI visible consomme ensuite:
- `ChatPage`: `msgs`, `typing`, `input`
- `MappingPage`: `insights`, `ikigai`, `step`
- `AdminPanel`: `history`, `lastGreffierLog`, `accessState`

Effet réel:
- la continuité visible vient d'abord de `sessions`
- la continuité du prompt vient d'abord de `memory`

Références:
- `src/pages/AppShell.jsx:90-111`
- `src/pages/ChatPage.jsx:31-50`, `src/pages/ChatPage.jsx:210-279`
- `src/pages/MappingPage.jsx:294-360`
- `src/components/AdminPanel.jsx:159-172`, `src/components/AdminPanel.jsx:357-440`

### 4.4 Lectures frontend spécialisées

`Login.jsx`:
- lit `access_codes` uniquement dans le flux `doCode()`

`Pricing.jsx`:
- ne lit pas `subscriptions` directement
- relit seulement la session auth avant d'appeler la fonction checkout

`InvitePage.jsx`:
- ne lit pas Supabase directement
- délègue la lecture invite à `validate-invite.js`

`ResetPassword.jsx`:
- ne lit aucune table applicative

`JournalPage.jsx` et `TodayPage.jsx`:
- ne lisent aucune table applicative
- `TodayPage` ne consomme que `user.user_metadata.full_name` ou `user.email`

Références:
- `src/pages/Login.jsx:93-140`
- `src/pages/Pricing.jsx:89-113`
- `src/pages/InvitePage.jsx:17-36`
- `src/pages/ResetPassword.jsx:36-45`
- `src/pages/JournalPage.jsx:23-57`
- `src/pages/TodayPage.jsx:26-44`

## 5. Flux d'écriture frontend

### 5.1 Écritures directes initiées par le client

`Onboarding.jsx`:
- `upsert` `memory { user_id, onboarding_done: true }`

`AppShell.checkRateLimit()`:
- lit `rate_limits`
- puis `upsert` `count + 1`

`AppShell.saveSession()`:
1. `insert` une ligne `sessions`
2. relit `memory`
3. fusionne forces/contradictions/blocages/ikigai/session_notes
4. `upsert` `memory`

`Login.doCode()`:
1. lit `access_codes`
2. appelle `sb.auth.signInAnonymously()`
3. `update` `access_codes.use_count` et `used_by`

`InvitePage` et `useSubscriptionAccess()`:
- écrivent dans `sessionStorage`, pas dans Supabase

`ChatPage`:
- supprime `sessionStorage.noema_invite` à la déconnexion

Références:
- `src/pages/Onboarding.jsx:429-438`
- `src/pages/AppShell.jsx:213-232`
- `src/pages/AppShell.jsx:272-305`
- `src/pages/Login.jsx:93-140`
- `src/pages/InvitePage.jsx:21-35`
- `src/hooks/useSubscriptionAccess.js:95-119`
- `src/pages/ChatPage.jsx:111-125`

### 5.2 Transformations de données réellement appliquées

`memory` depuis `saveSession()`:
- `forces` et `contradictions` sont dédupliquées par `Set`
- `blocages` et `ikigai` sont fusionnés par overwrite superficiel
- `session_notes` est tronqué aux 10 dernières entrées
- `session_count` est incrémenté à chaque sauvegarde

`sessions` depuis `saveSession()`:
- reçoit l'historique brut `history.current`
- reçoit `insights`, `ikigai`, `step` issus de l'état React courant
- reçoit `session_note` venant de `lastSessionNote.current`

`rate_limits` côté client:
- compteur DB incrémenté avant l'appel backend
- fenêtre 30/minute tenue seulement en mémoire locale

Références:
- `src/pages/AppShell.jsx:221-228`
- `src/pages/AppShell.jsx:276-303`

### 5.3 Fragilités réelles des écritures frontend

`réel`:
- autosave `beforeunload` + timer 5 minutes + `newSession()` peuvent produire plusieurs lignes `sessions` pour une même session logique
- `session_count` peut compter des autosaves et non des sessions humaines distinctes
- le merge mémoire côté client peut écraser ou doubler des évolutions écrites en parallèle par le Greffier

`partiel`:
- `Login.doCode()` n'exploite pas explicitement l'erreur de `update access_codes`
- `Onboarding` crée potentiellement une ligne `memory` minimale, avant toute mémoire conversationnelle
- `InvitePage` ne marque aucune consommation d'invite en base

`supposé`:
- l'effet exact des collisions `saveSession()` / `greffier.upsert(memory)` dépend de la chronologie réseau réelle

## 6. Flux d'écriture backend

### 6.1 Fonctions Netlify qui touchent réellement la base

`claude.js`:
1. vérifie le JWT via Supabase admin
2. lit `rate_limits`
3. `upsert` `rate_limits`
4. appelle Anthropic principal
5. `insert` `api_usage`
6. attend `runGreffier()`

`greffier.js`:
1. appelle Anthropic Haiku
2. `insert` `api_usage`
3. `upsert` `memory`
4. `update` `sessions` si `sessionId` existe

`stripe-webhook.js`:
- `upsert` ou `update` `subscriptions` selon le type d'événement Stripe

`create-invite.js`:
- vérifie admin via `profiles` ou `VITE_ADMIN_EMAIL`
- `insert` `invites`

`validate-invite.js`:
- lit `invites`

`verify-code.js`:
- `insert` un nouveau `access_codes` si un admin code serveur est fourni

`admin-tools.js`:
- lit `profiles`
- lit `api_usage`
- `delete` `memory`

`create-checkout-session.js`:
- ne touche pas Supabase hors vérification JWT
- crée seulement une Checkout Session Stripe

Références:
- `netlify/functions/claude.js:32-180`
- `netlify/functions/greffier.js:186-307`
- `netlify/functions/stripe-webhook.js:46-118`
- `netlify/functions/create-invite.js:42-80`
- `netlify/functions/validate-invite.js:35-58`
- `netlify/functions/verify-code.js:41-68`
- `netlify/functions/admin-tools.js:63-166`
- `netlify/functions/create-checkout-session.js:38-71`

### 6.2 Vérité serveur par domaine

Billing:
- la vérité DB n'est écrite qu'au webhook
- le checkout ne crée aucun enregistrement `subscriptions`

Chat:
- le serveur tient son propre quota DB, distinct du client
- le serveur journalise `api_usage`
- le serveur peut enrichir `memory` sans que l'UI visible ne lise directement cette écriture

Admin:
- le serveur décide réellement si un user est admin
- cette décision repose sur `profiles.is_admin` ou un fallback email

Invites:
- le serveur sait créer et valider des tokens
- il ne sait pas les "consommer" ou les lier durablement à un user

### 6.3 Contrôles, validations et risques

`réel`:
- JWT requis pour `claude`, `create-checkout-session`, `create-invite`, `admin-tools`
- signature Stripe requise pour `stripe-webhook`
- `validate-invite` est public

`partiel`:
- `claude.js` ne vérifie jamais `subscriptions`, `profiles`, `invites` ou `access_codes`
- un user authentifié mais sans abonnement actif reste capable de passer côté backend si le frontend est contourné
- `greffier.js` sait mettre à jour `sessions`, mais le runtime principal lui passe `sessionId = null`
- `admin-tools.get-costs` lit seulement `api_usage` du user courant, malgré un libellé "totaux"

`supposé`:
- si `SUPABASE_SERVICE_ROLE_KEY` manque, `claude.js` retombe sur `VITE_SUPABASE_ANON_KEY`; l'effet exact sur les écritures `rate_limits` / `api_usage` dépend alors des permissions effectives

## 7. Vérité de l'accès et du billing

### 7.1 Ordre réel de décision d'accès à l'app

L'accès à `/app/*` est décidé par `App.jsx` + `useSubscriptionAccess()`, pas par le backend chat.

Ordre réel:
1. être authentifié
2. si `VITE_ADMIN_EMAIL` matche, accès accordé
3. sinon, si `profiles.is_admin === true`, accès accordé
4. sinon, si `sessionStorage.noema_invite` est présent et lié à ce user, accès accordé
5. sinon, si une ligne `subscriptions` a `status in ["active", "trialing"]`, accès accordé
6. sinon, redirect `/pricing`
7. si accès accordé, lecture `memory.onboarding_done` pour décider `/onboarding`

Références:
- `src/App.jsx:166-207`
- `src/hooks/useSubscriptionAccess.js:27-159`
- `src/lib/access.js:57-63`

### 7.2 Vérité de `subscriptions`

`subscriptions` est la source de vérité principale du paywall payant:
- lue seulement côté frontend
- écrite seulement côté webhook Stripe
- jugée active uniquement par `status`

Ce que le runtime n'utilise pas pour l'accès:
- `plan`
- `current_period_end`
- `cancel_at_period_end`

Conséquence:
- ces colonnes existent et sont stockées, mais ne pilotent pas aujourd'hui la navigation

Références:
- `src/hooks/useSubscriptionAccess.js:122-149`
- `src/lib/access.js:57-63`
- `netlify/functions/stripe-webhook.js:67-116`

### 7.3 Rôle réel de `profiles`

`profiles` n'est pas un profil produit utilisateur. Dans le runtime actuel:
- on ne lit que `is_admin`
- aucune surface ne lit `created_at`
- aucun flux inspecté ne crée la ligne `profiles` d'un user standard

Conséquence:
- `profiles` est une table d'entitlement admin, pas une base de profil fonctionnel

Références:
- `supabase-schema.sql:7-19`
- `src/hooks/useSubscriptionAccess.js:64-78`
- `netlify/functions/admin-tools.js:79-100`
- `netlify/functions/create-invite.js:53-62`

### 7.4 Vérité de `invites`

Le système invite est réel, mais sa vérité d'accès est hybride:
- vérité serveur minimale: `invites.active`
- vérité d'accès runtime: `sessionStorage.noema_invite`

Ce que le flux fait réellement:
1. `InvitePage` envoie le token à `validate-invite.js`
2. si valide, le token est stocké en `sessionStorage`
3. `useSubscriptionAccess()` rattache ensuite ce token au `user.id` courant dans le navigateur
4. l'accès est accordé tant que ce `sessionStorage` existe pour ce user

Ce qu'il ne fait pas:
- pas de consommation DB
- pas de `redeemed_by`
- pas de quota d'usage
- pas de persistance cross-device

Références:
- `src/pages/InvitePage.jsx:17-35`
- `src/hooks/useSubscriptionAccess.js:95-119`
- `netlify/functions/validate-invite.js:35-58`
- `PROJECT.md:114-126`

### 7.5 Vérité de `access_codes`

`access_codes` reste un flux data réel, mais plus une vérité d'accès produit:
- `verify-code.js` peut générer un code d'accès à partir d'un admin code serveur
- `Login.doCode()` peut le consommer et faire un `signInAnonymously()`
- ensuite, `useSubscriptionAccess()` ne lit jamais `access_codes`

Conséquence:
- un code peut ouvrir une session auth anonyme
- il ne remplace pas `subscriptions`, `profiles` ou `invites` dans le paywall actuel

Références:
- `src/pages/Login.jsx:93-140`
- `netlify/functions/verify-code.js:41-68`
- `src/hooks/useSubscriptionAccess.js:21-159`

## 8. Vérité mémoire / sessions / quotas

### 8.1 `memory`

Rôle réel:
- mémoire inter-sessions injectée au prompt
- stockage cumulatif de `forces`, `contradictions`, `blocages`, `ikigai`
- stockage du statut onboarding

Lectures:
- `App.jsx` lit `onboarding_done`
- `AppShell` lit la ligne complète au bootstrap
- `buildMemoryContext()` transforme une partie de la ligne en texte pour Anthropic

Écritures:
- `Onboarding` crée ou met à jour `onboarding_done`
- `AppShell.saveSession()` merge et upsert
- `greffier.js` upsert silencieusement
- `admin-tools` peut supprimer la ligne

Part important:
- `memory` est bien la vérité de continuité conversationnelle
- elle n'est pas la vérité directe de l'UI Mapping visible

Références:
- `src/App.jsx:132-148`
- `src/lib/supabase.js:22-56`
- `src/pages/AppShell.jsx:93-95`, `src/pages/AppShell.jsx:288-303`
- `src/pages/Onboarding.jsx:429-438`
- `netlify/functions/greffier.js:267-279`
- `netlify/functions/admin-tools.js:150-161`

### 8.2 `sessions`

Rôle réel:
- snapshots de conversation et d'état visuel

Pourquoi ce n'est pas une vraie session live:
- aucun `sessionId` courant n'est maintenu dans `AppShell`
- `saveSession()` fait un `insert`, jamais un `update`
- autosave et `newSession()` produisent plusieurs lignes pour une même expérience humaine
- seul le dernier snapshot est relu

Ce qui est visible ensuite:
- `insights`, `ikigai`, `step` de la dernière ligne

Ce qui est stocké mais peu ou pas réutilisé:
- `history`
- `session_note`
- `id` comme identifiant courant

Références:
- `src/pages/AppShell.jsx:97-107`
- `src/pages/AppShell.jsx:131-146`
- `src/pages/AppShell.jsx:272-305`
- `netlify/functions/greffier.js:281-298`

### 8.3 `rate_limits`

Rôle réel:
- quota journalier par user/date en DB

Politiques concurrentes:
- frontend: 30 messages/minute local + 100/jour en base
- backend: 25/jour en base

Conséquences réelles:
- un vrai message utilisateur peut incrémenter `rate_limits` deux fois
- `openingMessage()` n'incrémente que côté serveur
- la table ne permet pas de distinguer message d'ouverture, message utilisateur, ou tentative refusée

Références:
- `src/pages/AppShell.jsx:213-232`
- `netlify/functions/claude.js:69-103`

### 8.4 `api_usage`

Rôle réel:
- journal des tokens Sonnet et Haiku

Lectures:
- `admin-tools` lit `model`, `prompt_tokens`, `completion_tokens`

Écritures:
- `claude.js` insère une ligne par réponse principale
- `greffier.js` insère une ligne par analyse secondaire

Limite réelle:
- l'admin panel ne montre pas les coûts globaux de la plateforme
- il montre seulement les coûts du user admin courant, via `.eq("user_id", user.id)`

Références:
- `netlify/functions/claude.js:156-165`
- `netlify/functions/greffier.js:243-255`
- `netlify/functions/admin-tools.js:133-147`

### 8.5 `semantic_memory`

Rôle réel:
- aucun dans le runtime actuel

Présence schéma:
- table, index HNSW, RPC `match_semantic_memory()`

Absence runtime:
- aucun import
- aucun `from("semantic_memory")`
- aucun `rpc("match_semantic_memory")`

Etat:
- `legacy` / futur non branché

Références:
- `supabase-schema.sql:122-172`
- recherche repo sur `semantic_memory`

## 9. Données consommées par l'UI

| Surface | Données réellement consommées | Source réelle | Etat |
|---|---|---|---|
| `Login` | états auth + `access_codes` dans `doCode()` | Supabase Auth + table `access_codes` | réel mais legacy |
| `Pricing` | `user`, `accessState`, session auth avant checkout | props + Supabase Auth | réel |
| `Onboarding` | `memory.onboarding_done` en écriture, pas en lecture directe | `App.jsx` + `memory` | réel |
| `ChatPage` | `msgs`, `typing`, `input`, `hasUpdate` | état local `AppShell` | réel |
| `MappingPage` | `insights`, `ikigai`, `step` | état local `AppShell`, hydraté depuis `sessions` puis `_ui` | réel |
| `JournalPage` | `text`, `tags`, prompts statiques | état local seulement | mocké |
| `TodayPage` | `STATIC_DATA`, `firstName`, défi local | hardcodé + `user` auth | mocké |
| `Success` | aucune donnée DB | aucune | mocké |
| `AdminPanel` | `accessState.isAdmin`, `history`, `lastGreffierLog`, coûts, invites fraîchement créées | props + fonctions Netlify | partiel |

### 9.1 Ce qui pilote réellement les écrans

Pilotage réel:
- `MappingPage` dépend de l'état React, pas d'une requête propre
- `ChatPage` dépend de `msgs`, eux-mêmes dérivés de l'appel chat et du parsing `_ui`
- le badge "Mapping mis à jour" dépend d'un heuristique local sur le payload `_ui`

Pilotage absent malgré existence de données:
- `memory` n'est pas affichée directement
- `api_usage` n'alimente pas une surface produit utilisateur
- `subscriptions.current_period_end` et `cancel_at_period_end` ne pilotent aucune UI visible
- `invites` existants en base ne sont pas listés dans `AdminPanel`; seuls les liens créés dans la session courante sont affichés

Références:
- `src/pages/ChatPage.jsx:210-245`
- `src/pages/MappingPage.jsx:294-360`
- `src/components/AdminPanel.jsx:181-207`
- `src/components/AdminPanel.jsx:269-280`
- `src/components/AdminPanel.jsx:385-409`

## 10. Tables / champs / flux partiels ou morts

### 10.1 Non branchés ou morts

- `semantic_memory` et `match_semantic_memory()` existent au schéma, mais n'ont aucun appel runtime
- aucune table `journal` n'existe dans `supabase-schema.sql`
- aucune table `today` ou rituel quotidien n'existe

### 10.2 Partiels ou trompeurs

- `profiles` existe, mais ne sert pas de profil produit complet
- `sessions.id` existe, mais n'est pas un identifiant de session active
- `api_usage.session_id` existe, mais reste essentiellement vide dans le wiring actuel
- `invites` existe, mais sans consommation, sans lien durable user/invite, sans lecture admin de l'existant
- `access_codes` trace un usage réel, mais ne porte plus le vrai droit d'accès à l'app
- `subscriptions` stocke plus d'information que le runtime n'en utilise
- `rate_limits` mélange deux politiques incompatibles dans une seule table

### 10.3 Contradictions schéma / code / docs

- `invites` est documentée dans `PROJECT.md` et utilisée en runtime, mais absente de `supabase-schema.sql`
- `greffier.js` commente encore `user_insights` / `ikigai_state`, alors que la vraie cible est `memory`
- `PROJECT.md` et certaines UI parlent de limites par session, alors que `rate_limits` est structuré par jour
- `Success.jsx` affirme visuellement que l'abonnement est actif, sans relire `subscriptions`
- `Journal` et `Today` sont présentés comme surfaces produit, mais restent sans persistance

Références:
- `PROJECT.md:114-126`
- `supabase-schema.sql:58-64`
- `src/pages/Pricing.jsx:23-38`
- `src/pages/Onboarding.jsx:227-273`
- `src/pages/Success.jsx:103-141`
- `netlify/functions/greffier.js:264-266`

## 11. Vérité des données

### Ce que sont réellement les données de Noema aujourd'hui

Les données de Noema sont aujourd'hui un système hybride où la vérité dépend du domaine:
- vérité d'identité: Supabase Auth
- vérité d'accès payant: `subscriptions`
- vérité admin: `profiles.is_admin` avec fallback email legacy
- vérité d'invitation beta en runtime: `sessionStorage.noema_invite`, pas la base seule
- vérité de continuité conversationnelle: `memory`
- vérité visuelle restaurée du Mapping: dernière ligne `sessions` puis `_ui` du modèle principal
- vérité des quotas: aucune source unique, car `rate_limits` est écrite par deux politiques

Autrement dit:
- Noema ne possède pas encore une couche data unifiée
- plusieurs données sont redondantes parce qu'elles servent des usages différents
- plusieurs tables contiennent plus que ce que l'UI ou le prompt consomment réellement
- l'essentiel de l'expérience visible repose encore sur de l'état local React réhydraté, puis enrichi à l'exécution

Le coeur réel des flux de données est aujourd'hui:
- `src/App.jsx`
- `src/hooks/useSubscriptionAccess.js`
- `src/pages/AppShell.jsx`
- `src/lib/supabase.js`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `netlify/functions/stripe-webhook.js`

## 12. Annexes

### 12.1 Tables critiques

- `memory`
- `sessions`
- `rate_limits`
- `subscriptions`
- `api_usage`
- `profiles`
- `invites`

### 12.2 Fonctions critiques

- `src/hooks/useSubscriptionAccess.js`
- `src/pages/AppShell.jsx`
- `src/lib/supabase.js`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `netlify/functions/stripe-webhook.js`
- `netlify/functions/admin-tools.js`
- `netlify/functions/create-invite.js`
- `netlify/functions/validate-invite.js`
- `netlify/functions/verify-code.js`

### 12.3 Champs critiques

- `memory.onboarding_done`
- `memory.session_count`
- `memory.session_notes`
- `sessions.history`
- `sessions.step`
- `rate_limits.count`
- `subscriptions.status`
- `profiles.is_admin`
- `api_usage.session_id`
- `invites.active`
- `access_codes.use_count`

### 12.4 Incohérences doc / code / schéma

- `invites` hors `supabase-schema.sql`
- absence de table `journal`
- absence de persistance `today`
- accès app décidé côté frontend, pas côté backend chat
- `sessions` nommé comme objet métier plus stable qu'il ne l'est réellement
- `api_usage` "totaux" non globaux dans l'admin

### 12.5 Points à vérifier avant toute future modification

1. Choisir une autorité unique d'accès entre frontend et backend.
2. Décider si `sessions` doit devenir une vraie session live ou rester un système de snapshots.
3. Unifier la politique de quota autour d'une seule règle et d'une seule écriture.
4. Décider si `profiles` doit devenir une vraie table profil ou rester un simple flag admin.
5. Intégrer `invites` dans le schéma principal et décider d'un modèle de consommation.
6. Décider si `memory` doit réellement réinjecter `contradictions` et `blocages`.
7. Clarifier si `api_usage` doit servir une vue utilisateur, une vue admin globale, ou les deux.
8. Décider du sort de `access_codes`.
9. Décider du sort de `semantic_memory`.
10. Brancher ou assumer explicitement l'absence de persistance pour `Journal` et `Today`.
