# NOEMA ALIGNMENT EXECUTION PLAN

Plan d'execution concret pour transformer `NOEMA_ALIGNMENT_PLAN.md` en sequence de modifications directement implementables dans le code sans casser le runtime.

Sources croisees pour ce plan:
- `NOEMA_ALIGNMENT_PLAN.md`
- `NOEMA_RUNTIME_GAPS.md`
- `NOEMA_DATA_FLOW_MAP.md`
- `NOEMA_CHAT_ORCHESTRATION_MAP.md`
- `NOEMA_SYSTEM_MAP.md`
- `PROJECT.md`
- `src/pages/AppShell.jsx`
- `src/constants/prompt.js`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `supabase-schema.sql`

Convention:
- `bloquant` = doit etre fait avant l'etape suivante
- `atomique` = peut etre merge et verifie seul
- `rollback` = point simple de retour arriere si regression

# 1. Strategie d'execution globale

Ordre des blocs (réalisé → à faire) :
1. verrouiller les decisions critiques cote backend ✅ Sprint 1
2. supprimer les doubles verites de quota ✅ Sprint 1
3. figer le contrat `_ui` minimal reel ✅ Sprint 2
4. enrichir la mémoire runtime et côté serveur ✅ Sprint 3 / 3.1 / 3.2
5. introduire une session live minimale ✅ Sprint 4.1 (anticipé)
6. realigner les surfaces UX sur l'etat reel ✅ Sprint 4
7. seulement ensuite brancher `Journal` et `Today` ⏳ Sprint 5

Logique de dependance:
- l'acces backend passe avant tout, parce que `App.jsx` et `useSubscriptionAccess()` filtrent l'UX mais `netlify/functions/claude.js` reste contournable tant qu'il ne verifie pas l'entitlement
- le quota backend passe avant la session live, sinon on deplace juste une incoherence existante dans une nouvelle structure
- le contrat `_ui` doit etre fige avant de donner un vrai `session_id` au Greffier, sinon on branche une session stable sur un dialecte instable
- le nettoyage legacy doit arriver juste apres l'unification `_ui`, quand on sait quels champs et quels fichiers restent verite runtime
- `Success`, `Landing`, `Pricing`, `Onboarding`, `Journal` et `Today` ne doivent etre touches qu'une fois la verite backend et la verite UI stabilisees

Regle d'implementation:
- une migration schema par sprint maximum
- une verite par domaine des la fin de chaque sprint
- aucun sprint ne doit dependre d'une page mockee pour valider son succes
- chaque sprint doit pouvoir etre teste en local et en preprod sans supposer un futur branchement

Pre-requis avant Sprint 1:
- creer une branche de travail dediee a l'alignement
- sauvegarder un export SQL des tables `memory`, `sessions`, `rate_limits`, `subscriptions`
- verifier que `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `ANTHROPIC_API_KEY`, `STRIPE_WEBHOOK_SECRET` sont bien presents dans les environnements de test
- preparer une seed minimale avec 4 cas: user sans entitlement, user abonne actif, admin `profiles.is_admin = true`, beta user invite

# 2. Sprint 1 — Securisation critique ✅ EXÉCUTÉ (01/04/2026)

## Objectif
rendre le systeme non contournable

## Actions

### Acces backend

Etat d'entree:
- `src/App.jsx` et `src/hooks/useSubscriptionAccess.js` decident l'acces visible
- `netlify/functions/claude.js` verifie le JWT mais pas l'entitlement
- l'invite beta repose runtime sur `sessionStorage.noema_invite`

Ordre exact:
1. ajouter une table ou un champ persistant pour l'entitlement beta dans `supabase-schema.sql`
2. brancher `netlify/functions/validate-invite.js` pour lier l'invite a `auth.users.id` au moment de la validation
3. brancher `src/hooks/useSubscriptionAccess.js` pour lire l'entitlement beta depuis Supabase au lieu de `sessionStorage`
4. ajouter dans `netlify/functions/claude.js` une resolution unique d'entitlement:
   - `profiles.is_admin = true`
   - ou `subscriptions.status in ('active', 'trialing')`
   - ou rattachement invite persistant actif
5. retourner `403` avec message explicite si JWT valide mais entitlement absent
6. conserver le pre-controle frontend uniquement pour la navigation UX

Fichiers impactes:
- `netlify/functions/claude.js`
- `src/hooks/useSubscriptionAccess.js`
- `netlify/functions/validate-invite.js`
- `netlify/functions/create-invite.js`
- `supabase-schema.sql`
- possiblement `src/pages/InvitePage.jsx` si le flux de liaison change

Livrable de sprint: ✅
- un utilisateur authentifie sans droit ne peut plus appeler `/.netlify/functions/claude`
- l'acces beta n'est plus porte par `sessionStorage` comme source backend

Etat reel post-execution:
- `claude.js` verifie entitlement dans l'ordre : `profiles.is_admin` → bypass email legacy → `subscriptions.status IN ('active','trialing')` → `invites.user_id = userId AND active = true`
- `validate-invite.js` lie l'invite a `user_id` si JWT fourni (usage 2)
- `useSubscriptionAccess.js` verifie d'abord `invites` en DB, puis sessionStorage en fallback avec persistance fire-and-forget

Limite residuelle:
- la migration SQL (`ALTER TABLE invites ADD COLUMN IF NOT EXISTS user_id`) doit etre executee en prod avant deploiement
- les utilisateurs beta existants seront lies en DB a leur prochaine session (linkage fire-and-forget)
- tant que la migration n'est pas executee : les betas ne passent pas l'entitlement backend

Rollback:
- garder la lecture frontend de `sessionStorage.noema_invite` pendant une seule PR, mais desactivee comme source backend (maintenu : sessionStorage reste en fallback UX pendant Sprint 1, suppression prevue Sprint 2+)

### Quota backend

Etat d'entree:
- `src/pages/AppShell.jsx` incremente `rate_limits` cote client a 100/jour
- `netlify/functions/claude.js` incremente `rate_limits` cote serveur a 25/jour
- `openingMessage()` passe deja uniquement par le serveur

Ordre exact:
1. modifier `src/pages/AppShell.jsx` pour garder seulement le garde-fou local `30/minute`
2. supprimer toute lecture/ecriture frontend de `rate_limits`
3. faire de `netlify/functions/claude.js` l'unique compteur metier
4. conserver temporairement la structure `rate_limits (user_id, date, count)` tant que `session_id` live n'existe pas
5. renommer le message de blocage pour assumer l'etat reel si la limite reste journaliere pendant ce sprint
6. documenter dans `PROJECT.md` que la vraie limite produit n'est pas encore "par session" tant que Sprint 3 n'est pas livre

Fichiers impactes:
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `PROJECT.md`

Livrable de sprint: ✅
- une seule ecriture quota, cote backend
- plus aucun double comptage client/serveur

Etat reel post-execution:
- `checkRateLimit()` dans `AppShell.jsx` est desormais synchrone, sans lecture/ecriture Supabase
- garde-fou local maintenu : 30 messages/minute en memoire uniquement
- `claude.js` reste unique autorite quota : 25 messages/jour, exemption admin, message de cloture journalier assume

Rollback:
- si le blocage backend est trop agressif, ne pas restaurer l'ecriture client; ajuster seulement le seuil serveur

### Tests

Tests backend acces:
- JWT absent -> `401`
- JWT valide + aucun abonnement + aucun admin + aucune invite -> `403`
- JWT valide + `subscriptions.status = active` -> `200`
- JWT valide + `profiles.is_admin = true` -> `200`
- JWT valide + invite persistante active -> `200`

Tests quota:
- 24 appels utilisateur -> `200`
- 25e appel -> reponse de cloture ou blocage attendu selon la regle retenue
- appel apres suppression de l'ecriture frontend -> compteur incremente une seule fois en base
- `openingMessage()` ne cree pas une deuxieme incrementation cote client

Tests de non-regression:
- navigation `/pricing -> /app/chat` reste fonctionnelle pour user payant
- admin panel reste accessible a l'admin
- webhook Stripe continue d'alimenter `subscriptions`

### Risques

- coupure acces beta si la migration invite -> user n'est pas faite avant de retirer `sessionStorage`
- faux negatifs d'entitlement si le webhook Stripe n'a pas encore synchronise `subscriptions`
- support necessaire pour les comptes beta deja invites avant le changement de schema

# 2.1 Sprint 1.1 — Correction race condition bootstrap ✅ EXÉCUTÉ (01/04/2026)

## Symptôme corrigé

Sur les comptes invités (et potentiellement abonnés sur connexions lentes), `openingMessage()` déclenchait
un appel à `/.netlify/functions/claude` avant que l'entitlement soit résolu côté backend.
Résultat : 403 au chargement, puis chat fonctionnel quelques instants plus tard.

## Cause identifiée

Race condition en trois couches :
1. `INITIAL_STATE.loading = false` dans `useSubscriptionAccess` → le hook signalait "pas en cours de chargement"
   avant même que `refresh()` soit lancé. En React, les effets des enfants (AppShell) tirent avant ceux des parents
   (App.jsx/useSubscriptionAccess), donc `openingMessage()` partait avant que `refresh()` démarre.
2. `AppShell.useEffect([user])` ne vérifiait pas `accessState?.loading` → lançait toujours `openingMessage()`
   quelle que soit l'état de résolution de l'entitlement.
3. Pour les comptes sessionStorage-only (première connexion invite), le linkage `invites.user_id` était
   fire-and-forget → `claude.js` ne trouvait pas encore `invites.user_id` quand `openingMessage()` appelait le backend.

## Correctif appliqué

### `src/hooks/useSubscriptionAccess.js`
- `INITIAL_STATE.loading` passe de `false` à `true` : le hook commence toujours en état "en cours de chargement"
- La branche "no user" retourne explicitement `loading: false` (avant elle retournait INITIAL_STATE)
- Le linkage sessionStorage passe de fire-and-forget à `await fetch(...)` : `loading` reste `true`
  jusqu'à confirmation que `invites.user_id` est bien lié en base

### `src/pages/AppShell.jsx`
- Ajout d'un guard `if (accessState?.loading) return` dans `useEffect([user, accessState?.loading])`
- `accessState?.loading` ajouté aux dépendances de l'effet : l'effet se relance quand `loading` passe à `false`

### `src/App.jsx`
- `shouldBlockForChecks` étend sa condition : `(!import.meta.env.DEV && route.page === "app" && user && access.loading)`
- AppShell n'est plus monté du tout en prod tant que l'entitlement n'est pas résolu
- Ceinture + bretelles : même si AppShell se montait, le guard AppShell l'arrêterait

## Ce qui est maintenant vrai

- `openingMessage()` ne part jamais avant que `accessState.loading = false`
- Pour les comptes invités sessionStorage : le linkage `invites.user_id` est confirmé avant la résolution
- `claude.js` trouve l'entitlement → 200 sur le message d'ouverture
- Admin, abonnés, comptes sans droit : comportement identique à avant (pas de régression)
- DEV non impacté (`!import.meta.env.DEV` exclut le blocage App.jsx en local)

## Fichiers modifiés

- `src/hooks/useSubscriptionAccess.js`
- `src/pages/AppShell.jsx`
- `src/App.jsx`

# 2.2 Nettoyage final Sprint 1 ✅ EXÉCUTÉ (01/04/2026)

## Actions

- `src/hooks/useSubscriptionAccess.js` : vérification `res.ok` sur le fetch vers `validate-invite`.
  Si HTTP 4xx/5xx, l'erreur est maintenant loggée (`console.error`) au lieu d'être silencieuse.
  Le flow utilisateur n'est pas interrompu (l'accès frontend est accordé quand même — le catch reste).
- `netlify/functions/validate-invite.js` : commentaire corrigé ligne 64 — `ilike` → `eq` exact,
  avec mention que les tokens sont toujours en majuscules (générés par `create-invite.js`).
- Migration SQL `invites.user_id` exécutée en prod (hors code — action manuelle confirmée).

## Sprint 1 clos

Tous les livrables Sprint 1 sont en production et nettoyés :
- entitlement backend (admin / abonnement / invite)
- quota backend unique
- race condition bootstrap résolue
- linkage `invites.user_id` fonctionnel
- robustesse fetch linkage améliorée
- documentation à jour

**Sprint 2 peut démarrer.**

# 3. Sprint 2 — Unification du contrat `_ui` ✅ EXÉCUTÉ (02/04/2026)

## Objectif
unifier le contrat `_ui` entre prompt, parser, AppShell et Greffier

## Actions

### Contrat `_ui`

Contrat cible unique:

```json
{
  "etat": "exploring | blocked | clarity | regulation",
  "step": 0,
  "forces": [],
  "blocages": {
    "racine": "",
    "entretien": "",
    "visible": ""
  },
  "contradictions": [],
  "ikigai": {
    "aime": "",
    "excelle": "",
    "monde": "",
    "paie": "",
    "mission": ""
  },
  "session_note": "",
  "next_action": ""
}
```

Ordre exact:
1. modifier `src/constants/prompt.js` pour demander exactement ce schema, et rien d'autre
2. modifier `src/utils/helpers.js` si necessaire pour rejeter ou normaliser les payloads `_ui` incomplets
3. modifier `src/pages/AppShell.jsx`:
   - retirer `mode` du runtime
   - garder `step`
   - stocker `next_action` dans l'etat live si la page n'en a pas encore besoin visuellement
4. modifier `netlify/functions/greffier.js` pour parler le meme dialecte minimum:
   - conserver `etat`, `step`, `forces`, `blocages`, `contradictions`, `ikigai`, `session_note`, `next_action`
   - sortir `phase`, `progression`, `conscience`, `ui_insight_type` du contrat runtime visible
5. verifier que `src/pages/MappingPage.jsx` n'utilise que `forces`, `blocages`, `contradictions`, `ikigai`, `step`
6. ne pas brancher encore `JournalPage.jsx` et `TodayPage.jsx`; seulement preparer le champ `next_action` pour Sprint 5

Fichiers impactes:
- `src/constants/prompt.js`
- `src/utils/helpers.js`
- `src/pages/AppShell.jsx`
- `netlify/functions/greffier.js`
- `src/pages/MappingPage.jsx`
- eventuellement `src/components/AdminPanel.jsx` si des logs affichent l'ancien schema

Livrable de sprint:
- prompt principal, parser UI, AppShell et Greffier partagent la meme forme de donnees
- plus aucun champ mort critique dans le runtime visible

Rollback:
- si le Greffier casse, garder la nouvelle verite `_ui` cote modele principal et laisser le Greffier degradable sans bloquer le produit

### Nettoyage legacy

Ordre exact:
1. retirer de `src/pages/AppShell.jsx` les imports et states morts qui ne servent plus apres l'unification `_ui`
2. declasser explicitement `src/constants/prompt-greffier.js` en legacy non runtime dans la doc si le fichier reste en place
3. declasser `src/App.original.jsx` en legacy dans `PROJECT.md` et dans le nouveau plan d'execution
4. supprimer les commentaires qui insinuent encore `user_insights` ou `ikigai_state` comme cibles runtime

Fichiers impactes:
- `src/pages/AppShell.jsx`
- `netlify/functions/greffier.js`
- `PROJECT.md`

### Tests

Tests fonctionnels:
- chaque reponse Noema continue de produire un Mapping visible coherent
- aucun champ `_ui` non consomme n'est requis pour afficher `MappingPage`
- si `_ui` est absent ou invalide, la reponse texte reste visible et l'UI garde son dernier etat stable

Tests de contrat:
- snapshot ou fixture `_ui` valide -> `parseUI()` accepte
- fixture avec `mode`, `phase`, `msg_count`, `phase_ready`, `ikigai_completude` -> ignoree ou rejetee selon la strategie choisie
- `applyUI()` n'attend plus `mode`

### Risques

- regression du Mapping si `step` est mal preserve
- divergence silencieuse si le Greffier continue d'ecrire un schema plus riche dans `memory` ou `sessions`
- faux sentiment d'alignement si `next_action` est stocke sans etre encore branche visuellement

# 3.0 Sprint 3 — Mémoire runtime enrichie ✅ EXÉCUTÉ (02/04/2026)

## Objectif
enrichir la mémoire inter-sessions et la rendre disponible côté serveur dès le premier message de chaque session

## Actions appliquées

### 1. `buildMemoryContext()` enrichi (`src/lib/supabase.js`)
- `blocages`, `contradictions`, `step` ajoutés au contexte mémoire client-side

### 2. `updateMemoryRef(ui)` dans AppShell
- merge live `_ui` → `memoryRef.current` après chaque réponse, sans attendre `saveSession()`
- le contexte s'accumule mid-session : le message suivant bénéficie des insights du message précédent

### 3. Chargement mémoire côté serveur dans `claude.js`
- `buildServerMemoryContext(memRow, lastStep)` construit le contexte mémoire directement en backend
- `claude.js` ne dépend plus du `memory_context` envoyé par le client
- `memory` et `sessions.step` chargés en parallèle (`Promise.all`) — coût latence nul

## Ce qui est maintenant vrai

- la mémoire inter-sessions est chargée côté serveur — le client ne peut plus l'omettre ou la falsifier
- `updateMemoryRef(ui)` garantit que le contexte s'enrichit à chaque message sans attendre l'autosave

## Ce qui reste une limite connue

- `step` n'est pas une colonne de `memory` — il est lu depuis `sessions.step` via une requête séparée

## Fichiers modifiés

- `netlify/functions/claude.js`
- `src/pages/AppShell.jsx`
- `src/lib/supabase.js`

---

# 3.1 Sprint 3.1 — Continuité post-refresh ✅ EXÉCUTÉ (02/04/2026)

## Objectif
améliorer la continuité conversationnelle après refresh sans lancer la session live (Sprint 4.1)

## Cause du bug identifiée

Après refresh :
- le Mapping est correctement réhydraté depuis `sessions.insights`, `sessions.ikigai`, `sessions.step`
- le chat repart avec un contexte appauvri : `claude.js` chargeait `memory` mais pas `sessions.step`, et `session_notes` était une phrase unique souvent perdue sur refresh rapide
- `history.current` est volatile (in-memory, jamais rechargé) — c'est une limite architecturale connue, non adressée dans ce sprint

## Actions appliquées

### 1. `step` réinjecté côté serveur (0 migration SQL)
- `claude.js` charge maintenant `memory` et `sessions.step` en parallèle (`Promise.all`)
- `buildServerMemoryContext(memRow, lastStep)` accepte `lastStep` comme second paramètre
- `step` est inclus dans le contexte système même si la colonne `memory.step` n'existe pas
- Coût latence : nul (requêtes parallèles)

### 2. Autosave 5min → 2min
- `setInterval` dans AppShell passe de `5 * 60 * 1000` à `2 * 60 * 1000`
- Réduit la fenêtre de perte de `session_notes` sur refresh
- `beforeunload` reste en place mais n'est plus la seule protection

### 3. `session_note` enrichi
- La règle dans `src/constants/prompt.js` passe de "une phrase" à "2-3 points clés séparés par ` | `"
- Format : état dominant | découverte principale | ton observé
- Plus d'information narrative par session → meilleure continuité cross-session

### 4. Nettoyage dead code AppShell
- Imports morts supprimés : `buildSystemPrompt`, `fmt`, `StateBadge`, `InsightsPane`, `ProgressPane`, `IkigaiPane`, `SendSVG`
- États morts supprimés : `sideTab`, `setSideTab`, `mobTab`, `setMobTab`
- Styles inutilisés supprimés : `panelStyle`, `placeholderStyle`
- Contrat `_ui` dans `prompt.js` réappliqué après écrasement silencieux par formateur

## Ce qui est maintenant vrai

- après refresh, Claude connaît le `step` du parcours
- les `session_notes` sont sauvegardées toutes les 2min au lieu de 5min
- chaque note capture 2-3 points clés au lieu d'une phrase
- AppShell est allégé de tous ses imports et états morts

## Ce qui reste une limite connue

- `history.current` n'est jamais rechargé → pas de replay de conversation cross-session (adressé si besoin en sprint dédié ultérieur)
- `beforeunload` reste non fiable sur mobile pour async — atténué mais non éliminé par l'autosave 2min
- `memory.step` n'est pas une colonne DB — `step` vient toujours de `sessions.step` au runtime

## Fichiers modifiés

- `netlify/functions/claude.js`
- `src/pages/AppShell.jsx`
- `src/constants/prompt.js`

# 3.2 Mini-sprint coût/perf ✅ EXÉCUTÉ (02/04/2026)

## Objectif
réduire les coûts tokens Anthropic et les coûts Greffier sans modifier l'architecture

## Diagnostic pré-sprint

Deux sources de gaspillage identifiées par audit :
1. `trimHistory()` passait les messages assistant avec leurs blocs `_ui` intacts — environ 160 tokens × nb messages dans la fenêtre, soit jusqu'à ~1 920 tokens inutiles/requête
2. Greffier (Haiku) déclenché à chaque message utilisateur — coût ~$0.0055/appel, soit ~$0.14/session à 25 messages

## Actions appliquées

### Fix 1 — strip `_ui` dans `trimHistory()` (`src/utils/helpers.js`)
- `trimHistory()` mappe les messages assistant et appelle `stripUI(msg.content)` avant envoi
- Justification : les `_ui` passés sont redondants — leur état est déjà consolidé dans le system prompt via `buildServerMemoryContext()`
- Réduction : ~160 tokens × nb messages assistant dans MAX_HISTORY

### Fix 2 — Greffier toutes les 3 requêtes (`netlify/functions/claude.js`)
- Ajout de `userMsgCount = messages.filter(m => m.role === 'user').length`
- `shouldRunGreffier = userMsgCount > 0 && userMsgCount % 3 === 0`
- `greffierPromise` conditionnel : `Promise.resolve(null)` si pas de déclenchement
- Log mis à jour : `[Greffier] déclenchement/skipped — userMsgCount: N`
- Réduction : ~67% du coût Greffier (~$0.09 économisés/session à 25 messages)

## Ce qui est maintenant vrai

- les blocs `_ui` historiques ne consomment plus de tokens input Anthropic
- le Greffier ne tourne qu'aux messages 3, 6, 9, 12, 15, 18, 21, 24
- la mémoire inter-sessions reste complète (Greffier persiste toujours)

## Ce qui reste une limite connue

- sur des sessions courtes (< 3 messages), le Greffier ne tourne pas du tout — acceptable
- `_greffier: null` est renvoyé dans la réponse JSON quand skipped — sans impact

## Fichiers modifiés

- `src/utils/helpers.js`
- `netlify/functions/claude.js`

---

# 4.1. Sprint 4.1 — Session live minimale (anticipée) ✅ EXÉCUTÉ (02/04/2026)

> **Note de reclassification** : ce chantier a été exécuté en avance par rapport au plan produit initial.
> Il stabilise le runtime (`session_id`, upsert `sessions`, `api_usage`) sans toucher aux surfaces produit.
> Il est reclassé en **Sprint 4.1** afin de préserver la cohérence du plan : **Sprint 4** reste le réalignement UX réel (ci-dessous).

## Objectif
introduire un `session_id` live minimal, cohérent et exploitable, sans casser Noema

## Audit pré-sprint (confirmé avant toute modification)

1. **`saveSession()`** : faisait `INSERT` à chaque appel → plusieurs lignes `sessions` par session active (autosave 2min + beforeunload + newSession)
2. **`history.current`** : `useRef` in-memory, volatile, non rechargé après refresh — limite architecturale connue, hors périmètre
3. **`api_usage`** : `claude.js` écrivait sans `session_id`. `greffier.js` écrivait déjà avec `session_id` (colonne existait en schéma)
4. **`greffier.js`** : recevait déjà `sessionId` dans sa signature. `claude.js` lisait déjà `body.session_id || null`. Il manquait que le frontend l'envoie
5. **Table `sessions`** : `id uuid DEFAULT gen_random_uuid() PRIMARY KEY` — compatible upsert sur ID
6. **`api_usage.session_id text`** : colonne existait déjà
7. **Aucun blocage structurel** — 0 migration SQL nécessaire

## Actions appliquées

### 1. Génération du `session_id` frontend (`src/pages/AppShell.jsx`)
- `sessionIdRef = useRef(crypto.randomUUID())` au mount — `useRef` (pas de state, pas de re-render)
- Stable pendant toute la durée de la session active
- Régénéré dans `reset()` : nouvelle session = nouvel identifiant

### 2. Propagation à chaque appel Anthropic (`src/pages/AppShell.jsx`)
- `session_id: sessionIdRef.current` ajouté dans le body de `callAPI()`
- `claude.js` lit déjà `body.session_id || null` — aucune modification backend nécessaire

### 3. `saveSession()` : INSERT → UPSERT (`src/pages/AppShell.jsx`)
- `sessionData` reçoit `id: sessionIdRef.current`
- `sb.from("sessions").insert(...)` → `sb.from("sessions").upsert({...}, { onConflict: "id" })`
- Résultat : une seule ligne par session active, quel que soit le nombre d'autosaves

### 4. `api_usage.session_id` côté Sonnet (`netlify/functions/claude.js`)
- `session_id: sessionId` ajouté à l'écriture `api_usage` dans `claude.js`
- Symétrique avec ce que `greffier.js` faisait déjà

### 5. `greffier.js` — inchangé
- Reçoit déjà `sessionId`, écrit déjà `api_usage.session_id`
- Fait `sessions.update().eq('id', sessionId)` — si la ligne n'existe pas encore (avant le premier autosave), c'est un no-op silencieux, acceptable

### 6. `supabase-schema.sql` — inchangé
- `sessions.id` et `api_usage.session_id` existaient déjà

## Ce qui est maintenant vrai

- chaque conversation active a un `session_id` UUID stable
- ce `session_id` est propagé du frontend → `claude.js` → `greffier.js`
- `claude.js`, `greffier.js` et `api_usage` parlent du même identifiant
- `sessions` n'insère plus plusieurs lignes incohérentes par session active — une seule ligne, mise à jour à chaque autosave
- `api_usage` du modèle principal (Sonnet) est maintenant lié à une session, comme `api_usage` du Greffier l'était déjà

## Ce qui reste une limite connue

- **Reprise cross-refresh** : `history.current` reste volatile. Refresh = nouveau `session_id`, nouvelle ligne `sessions`. La continuité conversationnelle repose toujours sur le `serverMemoryContext` (Sprint 3), pas sur un replay d'historique
- **Greffier avant premier autosave** : `sessions.update(sessionId)` dans le Greffier est un no-op si `saveSession()` n'a pas encore été appelé. En pratique, le Greffier tourne au message 3 et l'autosave toutes les 2min — les sessions courtes peuvent avoir 1-2 no-ops silencieux
- **Quota toujours journalier** : `rate_limits` reste sur `(user_id, date)`. Le quota par session est hors périmètre
- **Reprise cross-refresh volontairement hors périmètre** : recharger `history.current` nécessiterait de stocker et relire l'historique complet + gérer les conflits de session ouverte. Ce sera un sprint dédié si le besoin produit est validé

## Fichiers modifiés

- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`

# 5. Sprint 4 — Réalignement UX réel ✅ EXÉCUTÉ (02/04/2026)

## Objectif
corriger les promesses produit qui dépassent l'état réel du runtime — arrêter de présenter comme branchées des surfaces encore mockées ou partielles

## Actions

Ordre exact:
1. `src/pages/Success.jsx` relit maintenant `subscriptions.status` avant d'afficher une activation confirmee
2. `Success.jsx` affiche un etat "activation en cours" si le webhook Stripe n'a pas encore synchronise la ligne
3. `src/App.jsx` passe bien `user` et `sb` a `Success`
4. `src/pages/Landing.jsx` et `src/pages/Pricing.jsx` ne survendent plus `Journal` / `Today` comme des surfaces deja branchees
5. `src/pages/TodayPage.jsx` assume explicitement un apercu statique
6. `src/pages/JournalPage.jsx` assume explicitement un espace libre statique, sans sauvegarde branchee
7. mettre a jour `PROJECT.md` et les docs systeme pour que la promesse visible colle a l'etat reel post-Sprint 4

Fichiers impactes:
- `src/pages/Success.jsx`
- `src/pages/Landing.jsx`
- `src/pages/Pricing.jsx`
- `src/App.jsx`
- `src/pages/JournalPage.jsx`
- `src/pages/TodayPage.jsx`
- `PROJECT.md`
- `docs/system/NOEMA_RUNTIME_GAPS.md`
- `docs/system/NOEMA_SYSTEM_MAP.md`

Livrable de sprint: ✅
- aucune promesse produit critique ne depasse la realite backend visible
- `Success` ne se contente plus d'un message statique: il relit la verite billing disponible
- `Journal` et `Today` restent non branches aux donnees produit, mais l'UI l'assume explicitement
- `Landing` et `Pricing` n'affichent plus `Journal` / `Today` comme des surfaces deja vivantes

### Tests

Tests UX:
- paiement termine mais webhook en retard -> `Success` affiche attente, pas activation garantie
- user sans donnees `Journal` / `Today` -> UI assume clairement un mode statique / apercu
- la navigation produit reste fluide et ne casse pas le funnel login -> pricing -> checkout -> success -> app

### Risques

- baisse temporaire de promesse marketing
- plus de friction visible en post-checkout si Stripe est lent

## Ce qui est maintenant vrai

- `Success.jsx` lit `subscriptions.status` et distingue un abonnement confirme d'une activation encore en cours
- `App.jsx` fournit a `Success` les dependances necessaires (`user`, `sb`) pour cette verification
- `Landing.jsx` et `Pricing.jsx` n'annoncent plus `Journal` / `Today` comme des briques deja branchees
- `TodayPage.jsx` se presente comme un apercu statique
- `JournalPage.jsx` se presente comme un espace libre statique, avec sauvegarde non implemente

## Ce qui reste partiel apres Sprint 4

- `Success` reste dependant de la synchronisation webhook et d'une simple lecture `subscriptions`, pas d'un pipeline de confirmation plus riche
- `Journal` reste non persiste
- `Today` reste alimente par `STATIC_DATA`
- `next_action` n'est toujours pas consomme par `Journal` ou `Today`
- Sprint 5 reste le premier sprint qui branche reellement la continuite quotidienne a des donnees produit

# 6. Sprint 5 — Journal / Today réels ✅ LIVRÉ

## Objectif
brancher réellement les surfaces Journal et Today sur des données persistantes — cesser les contenus statiques

## Actions

### Journal minimal reel

Ordre exact:
1. ajouter la persistance `journal_entries` dans `supabase-schema.sql`
2. brancher `src/pages/JournalPage.jsx` sur une lecture/ecriture reelle
3. pre-remplir le prompt du journal avec `next_action` de la session ou du snapshot precedent
4. lier chaque entree a `user_id`, `session_id`, `entry_date`

Fichiers impactes:
- `supabase-schema.sql`
- `src/pages/JournalPage.jsx`
- `src/pages/AppShell.jsx`
- eventuelle fonction Netlify dediee si l'ecriture ne doit pas etre directe

### Today reel

Ordre exact:
1. definir la source unique de `Today`:
   - dernier `next_action`
   - etat courant
   - derniere entree journal si elle existe
2. remplacer `STATIC_DATA` dans `src/pages/TodayPage.jsx`
3. brancher un endpoint ou une lecture composee unique pour generer le contenu du jour

Fichiers impactes:
- `src/pages/TodayPage.jsx`
- backend dedie ou selector frontend unique
- `supabase-schema.sql`

Livrable de sprint:
- `Journal` et `Today` cessent d'etre des surfaces statiques

### Tests

Tests Journal:
- sauvegarde d'une entree -> persistence reelle
- reouverture de la page -> entree relue
- suggestion initiale issue de `next_action`

Tests Today:
- `Today` change quand le dernier `next_action` change
- `Today` n'affiche plus de texte statique hors fallback explicite

### Risques

- surconstruire le modele avant de voir l'usage reel
- produire un `Today` artificiel si le journal reste peu alimente

## Ce qui est maintenant vrai

- `journal_entries` existe dans `supabase-schema.sql` avec RLS `FOR ALL USING (auth.uid() = user_id)`
- `sessions` a une colonne `next_action` (migration commentee dans le schema pour les bases existantes)
- `JournalPage` lit l'entree du jour au mount et la reecrit (upsert sur `user_id + entry_date`) a chaque save
- `JournalPage` affiche le `next_action` de la session courante comme prompt principal si disponible, sinon fallback parmi `FALLBACK_PROMPTS`
- `TodayPage` consomme `nextAction` en prop live depuis `AppShell` (sans appel LLM supplementaire)
- `TodayPage` charge la derniere entree journal au mount (Supabase direct) pour afficher `next_action` persiste si la session est terminee
- `TodayPage` n'affiche plus `STATIC_DATA` — fallback honnete "Commence une conversation avec Noema" si aucune donnee
- `AppShell.saveSession()` inclut `next_action` dans l'upsert `sessions`
- `nextActionRef` assure que la valeur correcte est persistee meme lors des appels depuis closures async (beforeunload, setInterval)
- 0 appel LLM supplementaire pour ces deux surfaces

## Ce qui reste partiel apres Sprint 5

- les tags `journal_entries` ne sont pas encore sauvegardés (la UI garde les tags visuels mais ils ne sont pas dans le schema)
- la question du jour dans `TodayPage` reste statique (un seul fallback) hors cas "entree journal du jour"
- `sessions.next_action` necessite une migration SQL manuelle en prod (`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_action text DEFAULT ''`)

## Sprint 5.1 — micro-fix post-audit ✅ EXÉCUTÉ (02/04/2026)

Lacune identifiée lors de l'audit pré-Sprint 6 : `next_action` n'était pas restauré après refresh.

**Fichier modifié :** `src/pages/AppShell.jsx`

**Changements (2 lignes) :**
- `.select("insights,ikigai,step")` → `.select("insights,ikigai,step,next_action")`
- Ajout : `if (last.next_action) setNextAction(last.next_action);` après restauration du step

**Ce qui est maintenant vrai :**
- Après un refresh, `nextAction` est restauré depuis la dernière session sauvegardée
- Today affiche l'intention du jour sans attendre une nouvelle session
- Journal affiche le prompt issu de `next_action` dès l'ouverture de la page
- Aucun nouvel appel LLM, aucune migration SQL requise

## Sprint 6 — Continuité utile & expérience vivante ✅ EXÉCUTÉ (02/04/2026)

## Objectif
rendre `Today` et `Journal` plus habitables, plus guidants et plus actionnables, sans ajouter de backend, sans appel LLM supplémentaire et sans modifier le moteur

## Actions appliquées

### Today
- `Intention du jour` devient le bloc central de la page
- CTA principal visible :
  - `Passer à l'action` → ouvre le Journal si une intention existe
  - `Définir mon intention` → ouvre le Chat si aucune intention n'existe
- fallback honnête si `next_action` absent, sans contenu inventé
- ajout d'un marqueur discret `Jour X de ton parcours`, dérivé du nombre d'entrées `journal_entries`
- remplacement du "défi" avec checkbox par un repère du jour sobre, non gamifié

### Journal
- structure visuelle explicite en 3 niveaux :
  - `Intention du jour`
  - `Réflexion libre`
  - `Ce que tu retiens`
- placeholder de la zone d'écriture clarifié pour guider sans alourdir
- feedback de sauvegarde déplacé inline dans la surface d'écriture :
  - `Prêt à enregistrer`
  - `Enregistrement…`
  - `Entrée enregistrée ✓`
- suppression du toast flottant et du FAB au profit d'un contrôle plus calme et plus premium
- reprise du marqueur `Jour X de ton parcours` dans la page Journal, basé sur la même source

## Fichiers modifies

- `src/pages/TodayPage.jsx`
- `src/pages/JournalPage.jsx`
- `PROJECT.md`
- `docs/system/NOEMA_SYSTEM_MAP.md`
- `docs/system/NOEMA_RUNTIME_GAPS.md`
- `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`

## Ce qui est maintenant vrai

- `TodayPage` rend l'intention visible et immédiatement actionnable sans changer la vérité produit
- l'absence de `next_action` est gérée par un fallback simple et honnête vers le Chat
- `JournalPage` reste techniquement minimal, mais l'expérience est structurée et plus guidante
- la sauvegarde journal reste inchangée côté données, mais son feedback est plus clair et moins agressif
- aucun backend nouveau, aucune table nouvelle, aucun appel LLM supplémentaire, aucun surcoût API

## Tests cibles

Tests Today :
- `next_action` visible clairement si disponible
- fallback clair si `next_action` absent
- CTA principal route vers Journal ou Chat selon le cas
- indicateur `Jour X de ton parcours` cohérent avec `journal_entries`

Tests Journal :
- lecture/écriture `journal_entries` inchangées
- feedback inline correct sur save
- `next_action` bien visible en tête de page
- aucune régression de persistance après refresh

Tests non-regression :
- aucun changement backend
- aucun appel LLM ajouté
- coût API inchangé
- chat et mapping non impactés

## Sprint 7 — Surface continuity + product truth alignment ✅ EXÉCUTÉ (02/04/2026)

## Objectif
rendre visible la continuite deja existante, restaurer la confiance produit sur les surfaces marketing, et fiabiliser le post-paiement sans modifier le moteur

## Actions appliquees

### Chat
- `AppShell` relit maintenant `session_note` en plus de `next_action` dans le dernier snapshot `sessions`
- un etat de reprise UI est derive uniquement de donnees deja existantes :
  - `next_action`
  - `session_note`
  - `insights`
- `ChatPage` affiche un bloc discret :
  - `On reprend` apres refresh / retour avec continuite
  - `On repart d'ici` apres `Nouvelle session`
- le quota actuel est rappele tres simplement dans la surface chat : `25 messages par jour`
- aucun resume LLM supplementaire, aucune nouvelle table, aucun backend ajoute

### Surfaces produit
- `Landing` ne repose plus sur une citation fake ni sur un placeholder video
- `Landing` montre des surfaces reelles / honnetes du produit :
  - chat avec reprise visible
  - Journal
  - Mapping
  - Aujourd'hui
- `Pricing` est realigne :
  - continuite visible au lieu de "memoire illimitee"
  - `Journal` / `Aujourd'hui` annonces comme deja inclus
  - quota reel assume : `25 messages par jour`
- `Onboarding` supprime les promesses trop ambitieuses et parle d'un cadre clair, deja branche

### Success
- `Success` relit legerement `subscriptions.status`
- polling court automatique :
  - 5 verifications espacees de 8 secondes maximum
  - soit 40 secondes de reverification automatique
- ajout d'un bouton `Verifier a nouveau`
- le CTA vers `/app/chat` n'apparait que si l'acces est reellement actif

### Nettoyage
- suppression des faux boutons `settings` / `notifications` dans `TodayPage` et `JournalPage`
- remplacement des `href="#"` de `Pricing` et `Login` par de vraies navigations

## Ce qui est maintenant vrai

- la continuite memoire deja existante devient visible dans la surface chat sans toucher a la logique memoire
- un refresh n'a plus l'effet "chat vide qui redemarre" quand un fil precedent existe deja
- `Nouvelle session` n'ouvre plus sur un vide brut : un etat guide reste visible
- les surfaces marketing ne survendent plus une memoire totale, des features fantomes ou des preuves fictives
- le post-paiement n'envoie plus trop tot vers l'app tant que `subscriptions.status` n'est pas actif

## Tests cibles

Tests Chat :
- retour apres refresh avec `sessions.next_action` -> bloc `On reprend` visible
- clic `Nouvelle session` -> bloc `On repart d'ici` visible
- chat toujours fonctionnel, envoi utilisateur inchangé

Tests Surfaces :
- `Landing` ne contient plus citation fake ni placeholder video
- `Pricing` annonce `Journal` / `Aujourd'hui` comme disponibles et quota journalier
- `Onboarding` ne promet plus de memoire illimitee

Tests Success :
- `subscriptions.status = active` -> CTA app visible
- `subscriptions.status != active` -> pas de CTA app, bouton `Verifier a nouveau` visible
- l'auto-polling s'arrete avant 60 secondes

Tests non-regression :
- aucune requete backend supplementaire cote chat
- aucun appel LLM supplementaire
- `Today` / `Journal` toujours accessibles
- navigation footer toujours fonctionnelle

# 7. Ordre réel d'exécution (état au 02/04/2026)

| # | Chantier | Sprint | Statut |
|---|---|---|---|
| 1 | Entitlement backend + quota unifié | Sprint 1 | ✅ |
| 2 | Race condition bootstrap | Sprint 1.1 | ✅ |
| 3 | Contrat `_ui` unifié | Sprint 2 | ✅ |
| 4 | Mémoire runtime enrichie + server-side | Sprint 3 | ✅ |
| 5 | Continuité post-refresh | Sprint 3.1 | ✅ |
| 6 | Réduction coûts tokens/Greffier | Sprint 3.2 | ✅ |
| 7 | Session live minimale (anticipée) | Sprint 4.1 | ✅ |
| 8 | Réalignement UX réel | Sprint 4 | ✅ |
| 9 | Journal / Today réels | Sprint 5 | ✅ |
| 10 | Continuité utile & expérience vivante | Sprint 6 | ✅ |
| 11 | Surface continuity + product truth alignment | Sprint 7 | ✅ |

Règle de merge (toujours valide) :
- Sprint 4 UX a ete livre apres stabilisation de Sprint 4.1
- Sprint 5 Journal/Today peut demarrer maintenant que Sprint 4 a retire les promesses trompeuses

# 8. Checklist developpeur

Avant validation d'une release d'alignement:
- acces securise cote backend
- entitlement invite persiste en base
- quota unifie sur une seule ecriture
- `_ui` coherent entre prompt, parser, AppShell et Greffier
- aucun champ runtime critique mort ou contradictoire
- `session_id` unique partage par chat, Greffier, quota et `api_usage`
- `memory` = continuite inter-sessions
- `sessions` = session live ou snapshot, mais plus jamais les deux sans distinction
- `Mapping` stable apres 5 conversations de test
- `Success` relit le billing reel
- `Journal` et `Today` sont soit reellement branches, soit explicitement presentes comme non branches
- docs a jour: `PROJECT.md`, `ROADMAP.md`, maps systeme

# 9. Mise a jour obligatoire de PROJECT.md

A ajouter:
- document cree:
  - `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`
- motif:
  - transformer les decisions d'alignement en plan d'execution concret
- utilite:
  - servir de guide etape par etape pour modifier le code sans casser le systeme

Ajouts attendus dans `PROJECT.md`:
- reference du document dans "Documentation maitresse"
- bloc "Document ajoute" avec motif, but, utilite future et ambiguities clarifiees
- ligne de journal projet pour tracer la creation de ce plan d'execution

# 10. Definition de fini

Le plan est considere execute seulement si:
- `claude.js` refuse les users sans entitlement
- le quota metier ne s'ecrit qu'a un seul endroit
- le contrat `_ui` est identique dans les couches critiques
- un `session_id` runtime existe et porte le quota
- les surfaces mockees ne sont plus vendues comme reelles
- `Journal` et `Today` n'utilisent plus de donnees statiques, ou restent explicitement declares non branches
