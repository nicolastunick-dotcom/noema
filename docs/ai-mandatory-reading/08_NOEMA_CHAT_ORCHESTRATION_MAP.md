# NOEMA CHAT ORCHESTRATION MAP

Document de cartographie approfondie du système chat réel de Noema.

Base d'analyse:
- code frontend `src/`
- Netlify Functions `netlify/functions/`
- schéma `supabase-schema.sql`
- configs `src/constants/config.js`, `vite.config.js`, `netlify.toml`, `package.json`
- documentation locale `PROJECT.md`, `NOEMA_SYSTEM_MAP.md`, `docs/appshell-refactor-plan.md`

Principe:
- `réel` = branché dans le runtime actuel
- `partiel` = présent mais incomplet, incohérent, ou à effet limité
- `mocké` = surtout visuel / local / sans persistance métier
- `legacy` = reste V1/V2 non source de vérité
- `supposé` = inférence plausible mais non démontrée directement par un flux exécuté

## 1. Résumé exécutif

Le système chat de Noema est aujourd'hui un pipeline réellement branché, mais concentré dans très peu de points de vérité:
- entrée produit: `src/App.jsx` + `src/lib/access.js`
- orchestration runtime: `src/pages/AppShell.jsx`
- rendu conversationnel: `src/pages/ChatPage.jsx`
- backend chat: `netlify/functions/claude.js`
- analyse secondaire: `netlify/functions/greffier.js`
- mémoire et snapshots: `memory`, `sessions`, `rate_limits`, `api_usage`

Ce que le système est réellement:
- un chat introspectif authentifié, paywalled côté frontend, branché à Anthropic via Netlify Functions
- une UI visible alimentée par un bloc caché `<_ui>` produit par le modèle principal
- une persistance hybride: `memory` pour le contexte inter-sessions, `sessions` pour des snapshots d'état et d'historique
- un Greffier réellement exécuté, mais surtout utile pour persistance secondaire et observabilité admin

Ce qu'il n'est pas réellement aujourd'hui:
- un système à hooks métier découplés
- un pipeline unifié où prompt principal, UI, Greffier et mapping partagent exactement le même contrat de données
- un runtime cohérent entre DEV et production

Etat global du système chat (post Sprint 4.1) :
- `réel`: accès à `/app/chat`, vérification entitlement backend (admin/sub/invite), envoi utilisateur, proxy Netlify, quota 25/jour backend uniquement, appel Anthropic principal, parsing `_ui`, mapping visible, `session_id` stable par conversation active, autosave upsert sur session live (une seule ligne par session), mémoire inter-sessions, logs Greffier admin, `api_usage.session_id` rempli
- `partiel`: Greffier comme source de vérité, cohérence prompt/UI, exploitation de `memory` complète, DEV runtime
- `legacy`: `src/App.original.jsx`, `src/constants/prompt-greffier.js`, panneaux latéraux V1, imports/états orphelins dans `AppShell`
- `résolu Sprint 1`: double comptage quota client/serveur supprimé ; entitlement backend ajouté ; `invites` formalisée dans le schéma
- `résolu Sprint 1.1`: race condition bootstrap corrigée — `openingMessage()` ne part plus avant résolution entitlement ; linkage invite sessionStorage bloquant avant ouverture chat
- `résolu Sprint 4.1 (anticipé)`: `session_id` UUID généré au mount, propagé à chaque appel, `sessions` passe de INSERT multi-lignes à UPSERT sur ID stable
- `à faire Sprint 4`: réalignement UX réel — Landing / Pricing / Onboarding / Success / Journal / Today alignés sur l'état runtime

## 2. Vue d'ensemble du flux

Pipeline global réel:

1. L'utilisateur atteint `/app/chat` via `src/App.jsx` et `src/lib/access.js`.
2. `App.jsx` vérifie auth, abonnement et onboarding, puis monte `AppShell`. En prod, `shouldBlockForChecks` inclut `access.loading` : AppShell n'est pas monté tant que l'entitlement n'est pas résolu (Sprint 1.1).
3. `AppShell` attend `accessState.loading === false` (guard dans `useEffect`), puis hydrate `memory`, hydrate la dernière ligne `sessions`, puis lance `openingMessage()`.
4. `openingMessage()` injecte un faux message système dans `history.current`, appelle `callAPI()`, parse `_ui`, affiche la réponse nettoyée.
5. Lors d'un vrai envoi utilisateur, `send(text)` nettoie le texte, applique le garde-fou local (30/min), pousse le message dans `msgs` et `history.current`, puis appelle `callAPI()`.
6. `callAPI()` tronque l'historique, récupère le JWT Supabase, envoie un POST JSON vers `ANTHROPIC_PROXY`. `memory_context` est encore envoyé mais ignoré côté serveur depuis Sprint 3.
7. `netlify/functions/claude.js` vérifie le JWT, résout l'entitlement (admin → abonnement → invite), retourne 403 si absent, applique le quota 25/jour (backend uniquement), charge `memory` et `sessions.step` depuis DB en parallèle, construit `system = NOEMA_SYSTEM + buildServerMemoryContext(memRow, lastStep)`, lance `runGreffier()` en parallèle, appelle Anthropic Sonnet, loggue `api_usage`, puis renvoie `{ content, _greffier }`. (Sprint 3 + 3.1)
8. `runGreffier()` appelle Anthropic Haiku sur les 6 derniers messages, normalise son JSON, peut upsert `memory`, peut tenter de mettre à jour `sessions`, puis renvoie un payload surtout utile à l'admin.
9. Le frontend parse `<_ui>` avec `parseUI()`, retire le bloc caché avec `stripUI()`, fusionne l'état visible via `applyUI()`, puis affiche le texte nettoyé dans `ChatPage`.
10. `MappingPage` lit ensuite uniquement l'état React local `insights`, `ikigai`, `step` fourni par `AppShell`.

Fichiers pivot du pipeline:
- `src/App.jsx:39-43, 166-186, 303-312`
- `src/lib/access.js:1-18, 65-121, 156-180`
- `src/pages/AppShell.jsx:66-87, 149-174, 177-210, 235-268, 272-305`
- `src/utils/helpers.js:18-35`
- `netlify/functions/claude.js:32-180`
- `netlify/functions/greffier.js:186-307`

## 3. Point d'entrée frontend

### 3.1 Entrée réelle

Le point d'entrée réel du chat n'est pas `ChatPage`, mais la chaîne suivante:
- `src/App.jsx` route et garde l'accès
- `src/lib/access.js` traduit les chemins en routes internes
- `src/pages/AppShell.jsx` orchestre le runtime métier
- `src/pages/ChatPage.jsx` ne fait que rendre la surface et déclencher `send(input)`

Routes utiles:
- `réel`: `/app/chat`
- `réel`: `/app`
- `legacy accepté`: `/chat`

Références:
- `src/App.jsx:39-43` pour le parsing d'URL
- `src/App.jsx:166-186` pour la garde d'accès privée
- `src/App.jsx:303-312` pour le montage de `AppShell`
- `src/lib/access.js:1-18` pour le mapping des tabs
- `src/lib/access.js:116-121` pour la résolution vers `page: "app"`

### 3.2 Composants et handlers réellement impliqués

`App.jsx`:
- gère `navigate()` et `handleNav()`
- redirige vers `/login` si auth absente
- redirige vers `/pricing` si abonnement inactif
- redirige vers `/onboarding` si `memory.onboarding_done` est faux

`AppShell.jsx`:
- synchronise `initialTab` -> `navTab`
- choisit `ChatPage` quand `activeTab === "chat"`
- contient `openingMessage()`, `callAPI()`, `applyUI()`, `checkRateLimit()`, `send()`, `saveSession()`

`ChatPage.jsx`:
- `handleInput()` met à jour `input` et l'auto-resize
- `handleKeyDown()` envoie au `Enter` sans `Shift`
- les suggestions appellent directement `send(p)`
- le bouton de soumission appelle `send(input)`

### 3.3 Ce qui est branché vs legacy

`réel`:
- `App.jsx` + `useSubscriptionAccess()` + `AppShell` + `ChatPage`

`legacy`:
- `src/App.original.jsx` contient encore une ancienne implémentation monolithique du chat
- `ChatPage` reçoit encore des props commentées mais non exploitées comme `genIkigai` ou `user`

## 4. Gestion d'état

### 4.1 Réalité actuelle

Il n'existe pas de hook métier dédié au chat aujourd'hui.

Hook custom réellement branché:
- `src/hooks/useSubscriptionAccess.js`

Etat métier réel concentré dans `src/pages/AppShell.jsx`:
- `msgs`, `input`, `typing`
- `mstate`, `step`, `mode`
- `insights`, `ikigai`
- `navTab`
- refs `history`, `memoryRef`, `lastSessionNote`, `minuteTimestamps`, `hasOpened`

Références:
- `src/pages/AppShell.jsx:34-60`
- `src/hooks/useSubscriptionAccess.js:18-169`

### 4.2 Hydratation / réhydratation

Ordre réel au montage avec utilisateur:
1. lecture `memory`
2. lecture de la dernière ligne `sessions`
3. restauration UI locale depuis `sessions.insights`, `sessions.ikigai`, `sessions.step`
4. appel `openingMessage()`

Ce que cela implique:
- `memory` sert surtout au prompt via `buildMemoryContext()`
- l'UI visible n'est pas restaurée depuis `memory`, mais depuis `sessions`

Références:
- `src/pages/AppShell.jsx:90-111`
- `src/lib/supabase.js:22-52`

### 4.3 Limites d'état

`partiel`:
- `mode` est mis à jour mais n'a plus de surface visible utile
- `mstate` change le thème via `applyTheme()`, mais les anciens panneaux qui l'exploitaient ne sont plus rendus
- `step` ne peut que monter dans `applyUI()`

`legacy`:
- `sideTab`, `mobTab`, `msgsRef`, `greffierLogTick`
- imports non utilisés: `buildSystemPrompt`, `StateBadge`, `InsightsPane`, `ProgressPane`, `IkigaiPane`, `SendSVG`

Références:
- `src/pages/AppShell.jsx:123-129`
- `src/pages/AppShell.jsx:177-210`
- `src/pages/AppShell.jsx:2-11`

## 5. Endpoint backend du chat

### 5.1 Fonction réellement appelée

Production:
- `ANTHROPIC_PROXY = "/.netlify/functions/claude"`

DEV:
- `ANTHROPIC_PROXY = "https://api.anthropic.com/v1/messages"`

Références:
- `src/constants/config.js:3-5`
- `netlify/functions/claude.js:198-200`

### 5.2 Payload réellement envoyé par le frontend

`AppShell.callAPI()` envoie:
- `model`
- `max_tokens`
- `memory_context`
- `messages`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <JWT Supabase>` si session disponible

Non envoyé aujourd'hui:
- `session_id`
- `user_memory`
- `system`
- `stream`

Références:
- `src/pages/AppShell.jsx:149-164`

### 5.3 Validation serveur réelle

`claude.js`:
- refuse tout sauf `POST`
- exige un bearer token
- vérifie le JWT avec Supabase admin
- refuse si `ANTHROPIC_API_KEY` absente
- applique ensuite un quota serveur

Important:
- le backend ne vérifie pas l'abonnement Stripe
- l'accès payant est imposé côté frontend par `App.jsx`

Références:
- `netlify/functions/claude.js:19-64`
- `src/App.jsx:166-186`

### 5.4 Transformations serveur

`claude.js` ne forwarde pas le body brut.

Champs réellement transmis au modèle principal:
- `model`
- `max_tokens` plafonné à `4096`
- `system = NOEMA_SYSTEM + buildServerMemoryContext(memRow, lastStep)` — Sprint 3.1 : `lastStep` vient de `sessions.step`, pas de `memory.step`
- `messages`
- `stream = false`

Références:
- `netlify/functions/claude.js:105-114`

## 6. Orchestration Anthropic

### 6.1 Modèle principal

`réel`:
- `claude-sonnet-4-6`
- piloté par `netlify/functions/claude.js`

Prompt système réel:
- `NOEMA_SYSTEM` depuis `src/constants/prompt.js`
- concaténé côté serveur avec `memory_context` construit côté client via `buildMemoryContext()`

Références:
- `src/constants/prompt.js:1-137`
- `src/lib/supabase.js:22-56`
- `netlify/functions/claude.js:107-136`

### 6.2 Rôle réel du prompt système

Le prompt principal fait réellement quatre choses:
- définit la persona et la posture Phase 1 / Phase 2
- impose des règles de session et de style conversationnel
- décrit une mémoire inter-sessions injectée par le runtime
- impose surtout la production d'un bloc invisible `<_ui>` à chaque réponse

Le mapping visible dépend principalement de ce contrat `_ui`.

### 6.3 Réponse renvoyée

`claude.js`:
- récupère les blocs `text` d'Anthropic
- concatène en `fullText`
- renvoie `content: fullText`
- ajoute `_greffier: greffierResult`

Références:
- `netlify/functions/claude.js:148-180`

### 6.4 Incohérences Anthropic / runtime

`partiel`:
- le prompt principal demande `phase`, `msg_count`, `ikigai_completude`, `next_action`, `phase_ready`
- l'UI React n'exploite pas la majorité de ces champs

`supposé`:
- le runtime DEV est cassé ou très fragile, car `ANTHROPIC_PROXY` pointe Anthropic direct sans clé client ni proxy Vite

Références:
- `src/constants/prompt.js:98-137`
- `src/pages/AppShell.jsx:177-210`
- `vite.config.js:4-16`
- `src/App.original.jsx:1225-1246`

## 7. Greffier / Insights / Ikigai

### 7.1 Où il vit et quand il tourne

`réel`:
- `netlify/functions/greffier.js`
- déclenché en parallèle par `netlify/functions/claude.js`

Déclenchement:
- `runGreffier({ apiKey, sb, userId, sessionId, history, userMemory })`
- lancé avant l'appel principal Anthropic
- attendu après la réponse principale

Références:
- `netlify/functions/claude.js:117-127`
- `netlify/functions/claude.js:168-174`

### 7.2 Ce qu'il consomme réellement

Le Greffier travaille aujourd'hui avec:
- les 6 derniers messages
- `userId`
- `sessionId = null` dans le wiring actuel
- `userMemory = {}` dans le wiring actuel

Conséquence:
- il n'a pas la mémoire structurée réelle du frontend
- la branche `sessions.update(...)` est pratiquement inactive

Références:
- `netlify/functions/claude.js:117-119`
- `netlify/functions/greffier.js:186-217`
- `netlify/functions/greffier.js:281-298`

### 7.3 Ce qu'il produit réellement

Schéma runtime Greffier:
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

Références:
- `netlify/functions/greffier.js:13-89`
- `netlify/functions/greffier.js:140-183`

### 7.4 Impact réel sur le produit visible

`réel`:
- peut upsert `memory`
- peut logguer `api_usage`
- renvoie `_greffier` au frontend

`partiel`:
- `_greffier` n'alimente pas `insights`, `ikigai` ou `step` côté utilisateur
- il est surtout consultable via `AdminPanel`

`legacy / trompeur`:
- `src/constants/prompt-greffier.js` n'est pas le prompt runtime réel du Greffier

Références:
- `src/pages/AppShell.jsx:169-172`
- `src/pages/AppShell.jsx:391-405`
- `src/components/AdminPanel.jsx:357-359`
- `src/constants/prompt-greffier.js:1-38`

## 8. Persistance Supabase

### 8.1 Tables réellement impliquées dans le chat

| Table | Lecture | Ecriture | Rôle réel | Etat |
|---|---|---|---|---|
| `memory` | `AppShell`, onboarding | `AppShell`, `greffier`, onboarding | mémoire inter-sessions | réel |
| `sessions` | `AppShell` | `AppShell`, `greffier` partiellement | snapshots d'historique et d'état UI | réel mais mal nommé |
| `rate_limits` | `AppShell`, `claude.js` | `AppShell`, `claude.js` | quotas | réel mais incohérent |
| `api_usage` | `admin-tools.js` | `claude.js`, `greffier.js` | coûts/tokens | réel |
| `semantic_memory` | personne | personne | mémoire vectorielle future | legacy / non branché |

Références:
- `supabase-schema.sql:22-70`
- `supabase-schema.sql:126-198`

### 8.2 Ordre réel des opérations

Bootstrap:
1. `memory` lue
2. dernière `sessions` lue
3. UI hydratée depuis `sessions`
4. ouverture déclenchée

Envoi utilisateur:
1. quota client sur `rate_limits`
2. push dans `history.current`
3. appel backend
4. quota serveur sur `rate_limits`
5. appel Sonnet
6. appel Greffier en parallèle
7. log `api_usage`
8. retour frontend

Fin de session / autosave:
1. insert `sessions`
2. relecture `memory`
3. fusion dans `memory`
4. upsert `memory`

Références:
- `src/pages/AppShell.jsx:90-111`
- `src/pages/AppShell.jsx:213-232`
- `src/pages/AppShell.jsx:272-305`
- `netlify/functions/claude.js:69-180`
- `netlify/functions/greffier.js:243-299`

### 8.3 Ce qui est réellement sauvegardé

`sessions`:
- `history`
- `insights`
- `ikigai`
- `step`
- `session_note`
- `ended_at`

`memory`:
- `forces`
- `contradictions`
- `blocages`
- `ikigai`
- `session_notes`
- `session_count`

Point important:
- `buildMemoryContext()` réinjecte désormais `contradictions` et `blocages` dans le prompt principal

Références:
- `src/pages/AppShell.jsx:276-300`
- `src/lib/supabase.js:22-52`

## 9. Effets UI / Mapping / surfaces dépendantes

### 9.1 Source réelle du Mapping

Le Mapping visible n'est pas alimenté directement par le Greffier ni par une requête propre à `MappingPage`.

Source réelle:
- le bloc `<_ui>` demandé au modèle principal
- `parseUI()` dans `src/utils/helpers.js`
- `applyUI()` dans `src/pages/AppShell.jsx`
- props `insights`, `ikigai`, `step` passées à `MappingPage`

Références:
- `src/constants/prompt.js:95-137`
- `src/utils/helpers.js:18-25`
- `src/pages/AppShell.jsx:177-210`
- `src/pages/AppShell.jsx:351-360`

### 9.2 Ce qui alimente réellement l'UI

`ChatPage`:
- affiche `msgs`
- indique `typing`
- affiche un bloc `Depuis ta derniere visite` quand une dernière `session` existe
- montre une micro-preuve lisible (`Intention clarifiee`, `Blocage precise`, `Force confirmee`, etc.) au lieu du badge vague `✦ Mapping mis à jour`

`MappingPage`:
- lit uniquement `insights`, `ikigai`, `step`

`JournalPage`:
- lit / ecrit `journal_entries`
- relie maintenant l'ecriture au fil actif via `Pourquoi cette question revient` et `Ce que cette ecriture nourrit`

`TodayPage`:
- lit la derniere `session` et la derniere entree `journal_entries`
- affiche impact, preuve differentielle et reprise `Depuis ta derniere visite`
- `STATIC_DATA`, prénom utilisateur et navigation vers Journal

Références:
- `src/pages/ChatPage.jsx:210-279`
- `src/pages/MappingPage.jsx:294-320`
- `src/pages/JournalPage.jsx:23-52`
- `src/pages/TodayPage.jsx:26-44`

### 9.3 Branché / non branché

`réel`:
- mapping des forces
- blocages
- contradictions
- ikigai
- progression par `step`

`partiel`:
- badge "Mapping mis à jour" ne détecte pas tous les changements possibles
- `mode` n'a plus de rendu visible

`mocké`:
- Journal
- Today

`legacy`:
- `InsightsPane`, `ProgressPane`, `IkigaiPane`, `StateBadge`

## 10. Quotas / limites / garde-fous

### 10.1 Quotas réellement appliqués

Côté frontend:
- 30 messages / minute en mémoire locale
- 100 messages / jour dans `rate_limits`

Côté backend:
- 25 messages / jour dans `rate_limits`
- bypass si email = `VITE_ADMIN_EMAIL`

Références:
- `src/pages/AppShell.jsx:213-232`
- `netlify/functions/claude.js:7-8`
- `netlify/functions/claude.js:69-103`

### 10.2 Conséquence réelle

`inférence basée sur le code`:
- un envoi utilisateur peut incrémenter `rate_limits` côté client puis côté serveur
- `openingMessage()` passe par le backend, mais pas par `checkRateLimit()`
- la limite effective perçue utilisateur peut être inférieure à ce que racontent les textes de prompt ou l'admin panel

### 10.3 Garde-fous réels

`réel`:
- sanitation HTML via DOMPurify dans `ChatPage`
- JWT Supabase requis côté serveur
- prompt impose une conduite de session et un protocole de sécurité verbal

`partiel`:
- pas de validation forte de la structure `messages`
- pas de vérité unique de quota

Références:
- `src/pages/ChatPage.jsx:233`
- `netlify/functions/claude.js:32-64`
- `src/constants/prompt.js:57-71`

## 11. Fragilités / legacy / ambiguïtés

### 11.1 Désalignements majeurs

1. Trois contrats de métadonnées concurrents:
- `_ui` du prompt principal
- schéma réellement lu par `applyUI()`
- schéma Greffier runtime

2. Session live — résolue (Sprint 4.1 anticipé) :
- `session_id` UUID généré au mount, propagé à chaque appel Anthropic
- `sessions` utilise maintenant un upsert sur cet ID — une seule ligne par session active
- `api_usage.session_id` rempli côté Sonnet et Greffier
- Limite restante : refresh = nouveau `session_id` (reprise cross-refresh hors périmètre)

3. Quotas contradictoires:
- client `100/jour`
- serveur `25/jour`

4. Mémoire partiellement réinjectée:
- `blocages` et `contradictions` sont stockés mais pas réinjectés au prompt principal

5. DEV runtime incohérent:
- appel direct Anthropic sans clé frontend actuelle

### 11.2 Best-effort silencieux

- si `_ui` est invalide, la réponse texte reste affichée mais l'UI ne se met pas à jour
- si le Greffier échoue, le produit visible continue sans symptôme utilisateur fort
- `saveSession()` et `checkRateLimit()` tolèrent des erreurs DB sans rollback

### 11.3 Branches legacy trompeuses

- `src/App.original.jsx`
- `src/constants/prompt-greffier.js`
- `docs/appshell-refactor-plan.md`
- imports/états orphelins dans `AppShell`

### 11.4 Ambiguïtés produit réelles

- "session" signifie désormais une vraie session live (Sprint 4.1) mais le refresh la recrée — pas de reprise cross-refresh pour l'instant
- "mapping mis à jour" ne signifie pas que le Greffier a écrit quelque chose
- "25 messages par session" dans le prompt ne correspond pas clairement à l'implémentation runtime
- l'écran vide après `newSession()` n'est pas le même comportement que l'ouverture initiale pilotée par prompt

## 12. Vérité système

### Ce qu'est réellement le système chat de Noema aujourd'hui

Noema est aujourd'hui:
- un système de conversation introspective orchestré par `AppShell`
- avec un modèle principal Anthropic qui porte à la fois le texte visible et le payload UI invisible
- avec une mémoire inter-sessions simplifiée injectée au prompt
- avec un Greffier secondaire qui persiste et observe plus qu'il ne pilote l'UI
- avec un mapping visible dérivé du bloc `_ui`, pas d'un moteur analytique autonome côté frontend

Ce qu'il prétend aussi être dans certains textes ou reliquats:
- un système phase 1 / phase 2 parfaitement cohérent
- un moteur Greffier aligné avec la vérité UI
- un suivi de session stable et progressif

L'écart réel:
- la conversation existe vraiment
- l'orchestration existe vraiment
- la persistance existe vraiment
- mais les contrats de données, les quotas et la notion de session restent structurellement désalignés

Centre nerveux réel:
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `src/constants/prompt.js`
- `src/lib/supabase.js`
- `netlify/functions/greffier.js`

## 13. Annexes

### 13.1 Fichiers critiques

- `src/App.jsx`
- `src/lib/access.js`
- `src/hooks/useSubscriptionAccess.js`
- `src/pages/AppShell.jsx`
- `src/pages/ChatPage.jsx`
- `src/pages/MappingPage.jsx`
- `src/utils/helpers.js`
- `src/lib/supabase.js`
- `src/constants/prompt.js`
- `src/constants/config.js`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `netlify/functions/admin-tools.js`
- `supabase-schema.sql`

### 13.2 Variables d'environnement repérées

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
- `DEV`

Backend:
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

### 13.3 Fonctions backend majeures

`netlify/functions/claude.js`
- vérification JWT
- quota serveur
- composition du prompt système
- appel Anthropic principal
- déclenchement Greffier
- log `api_usage`

`netlify/functions/greffier.js`
- appel Anthropic Haiku
- normalisation JSON
- upsert `memory`
- tentative update `sessions`
- log `api_usage`

`netlify/functions/admin-tools.js`
- lecture coûts API
- reset mémoire

### 13.4 Flux résumé

Ouverture:
- hydrate `memory`
- hydrate `sessions`
- injecte un faux message système
- appelle `claude`
- parse `_ui`
- affiche la réponse nettoyée

Envoi:
- sanitize input
- quota client
- append historique
- appel backend
- quota serveur
- Sonnet + Greffier
- parse `_ui`
- update UI locale

Persistance:
- autosave `beforeunload`
- autosave 5 minutes
- `newSession()`

### 13.5 Points à vérifier avant toute future modification

1. Aligner le contrat `_ui` du prompt principal avec `applyUI()`
2. Choisir une seule autorité de quota
3. Décider si `sessions` doit devenir une vraie session live ou rester un snapshot
4. Décider si le Greffier doit nourrir l'UI visible ou rester un moteur de persistance/admin
5. Corriger le wiring `session_id` / `user_memory`
6. Clarifier le runtime DEV
7. Décider du sort de `App.original.jsx` et `prompt-greffier.js`
