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

Ordre des blocs:
1. verrouiller les decisions critiques cote backend
2. supprimer les doubles verites de quota
3. figer le contrat `_ui` minimal reel
4. nettoyer le legacy qui trompe le runtime et les futures IA
5. introduire une vraie session live
6. realigner les surfaces UX sur l'etat reel
7. seulement ensuite brancher `Journal` et `Today`

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

# 3. Sprint 2 — Unification du systeme

## Objectif
aligner toutes les couches

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

# 4. Sprint 3 — Stabilisation des sessions

## Objectif
creer une vraie logique de session

## Actions

Ordre exact:
1. etendre `supabase-schema.sql` avec une vraie notion de session live:
   - soit nouvelle table `active_sessions`
   - soit extension de `sessions` avec `started_at`, `status`, `message_count`
2. choisir une cle runtime unique `session_id` creee a l'ouverture de `AppShell`
3. faire envoyer `session_id` depuis `src/pages/AppShell.jsx` a `netlify/functions/claude.js`
4. faire transiter `session_id` vers `netlify/functions/greffier.js`
5. faire ecrire `api_usage.session_id`
6. faire porter le compteur quota metier par cette session live au lieu du couple `(user_id, date)`
7. transformer `saveSession()`:
   - ne plus inserer une nouvelle ligne a chaque autosave
   - mettre a jour la session live courante
   - ne creer un snapshot final qu'a la cloture
8. renommer dans la doc la table ou le concept historique en "session snapshot" tant qu'un renommage technique n'est pas livre

Fichiers impactes:
- `supabase-schema.sql`
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `PROJECT.md`
- `NOEMA_SYSTEM_MAP.md`
- `NOEMA_CHAT_ORCHESTRATION_MAP.md`
- `NOEMA_DATA_FLOW_MAP.md`
- `NOEMA_RUNTIME_GAPS.md`

Livrable de sprint:
- un `session_id` actif existe des l'ouverture du chat
- Greffier, quota, `api_usage` et persistance parlent du meme identifiant
- `sessions` ne sert plus de faux substitut de session live

Rollback:
- garder la structure snapshot actuelle en lecture seule pendant la migration, mais interdire les nouvelles insertions multiples des que la session live est active

### Tests

Tests session:
- ouverture du chat -> creation d'un `session_id`
- 3 messages dans la meme session -> un seul enregistrement live, pas 3 snapshots finaux
- `newSession()` cloture la session courante et en ouvre une nouvelle
- refresh navigateur -> reprise sur la meme session si la strategie choisie le permet, sinon cloture propre et recreation explicite

Tests quota:
- le compteur de session suit `session_id`
- le 26e message utilisateur dans la meme session est bloque
- une nouvelle session repart a zero

Tests persistance:
- `api_usage.session_id` non vide
- Greffier met bien a jour la session courante
- `memory` garde le role de synthese inter-sessions et non de session live

### Risques

- migration delicate entre snapshots existants et sessions live
- conflits entre autosave, fermeture d'onglet et cloture manuelle
- dette de doc si le concept change sans renommage visible dans `PROJECT.md`

# 5. Sprint 4 — Realignement UX reel

## Objectif
corriger les mensonges produit

## Actions

Ordre exact:
1. modifier `src/pages/Success.jsx` pour relire `subscriptions` avant d'afficher une activation confirmee
2. afficher un etat "activation en cours" si le webhook Stripe n'a pas encore synchronise la ligne
3. corriger `src/pages/Landing.jsx`, `src/pages/Pricing.jsx` et `src/pages/Onboarding.jsx` pour ne plus presenter `Journal`, `Today` et la continuite quotidienne comme deja branches
4. ajouter un marquage explicite dans `JournalPage.jsx` et `TodayPage.jsx` si ces surfaces restent mockees a ce stade
5. mettre a jour `PROJECT.md` et `ROADMAP.md` pour que la promesse visible colle a l'etat reel post-Sprint 3

Fichiers impactes:
- `src/pages/Success.jsx`
- `src/pages/Landing.jsx`
- `src/pages/Pricing.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/JournalPage.jsx`
- `src/pages/TodayPage.jsx`
- `PROJECT.md`
- `ROADMAP.md`

Livrable de sprint:
- aucune page ne pretend qu'un branchement existe si la donnee reelle n'est pas lue

### Tests

Tests UX:
- paiement termine mais webhook en retard -> `Success` affiche attente, pas activation garantie
- user sans donnees `Journal` / `Today` -> UI assume clairement un mode en preparation ou prototype
- la navigation produit reste fluide et ne casse pas le funnel login -> pricing -> checkout -> success -> app

### Risques

- baisse temporaire de promesse marketing
- plus de friction visible en post-checkout si Stripe est lent

# 6. Sprint 5 — Extension controlee

## Objectif
ajouter des features propres

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

# 7. Ordre exact d'implementation

1. backend access
2. backend quota
3. `_ui` contract
4. cleanup legacy
5. session system
6. UX fixes
7. feature extension

Regle de merge:
- ne pas lancer 3. `_ui` contract` tant que 1. et 2. ne sont pas verifies en preprod
- ne pas lancer 5. `session system` tant que 3. et 4. n'ont pas stabilise le contrat runtime
- ne pas lancer 7. `feature extension` tant que 6. n'a pas retire les promesses trompeuses

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
