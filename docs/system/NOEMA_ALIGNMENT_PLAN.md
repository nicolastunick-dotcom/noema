# NOEMA ALIGNMENT PLAN

Plan d'alignement stratégique pour transformer les écarts identifiés dans `NOEMA_RUNTIME_GAPS.md` en décisions exécutables.

Base de décision:
- code réel lu dans `src/`, `netlify/functions/`, `supabase-schema.sql`
- documents lus `PROJECT.md`, `ROADMAP.md`, `RETENTION.md`, `NOEMA_SYSTEM_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_RUNTIME_GAPS.md`

Rappel de statut:
- `réel` = branché dans le runtime
- `partiel` = branché mais incomplet ou contradictoire
- `mocké` = visuel ou local, sans vérité produit
- `legacy` = reliquat non source de vérité
- `supposé` = à exclure des décisions

# 1. Résumé exécutif

État actuel du système:
- `réel`: chat, auth, onboarding, `memory`, `sessions`, `subscriptions`, webhook Stripe, Mapping
- `partiel`: accès produit, quotas, Greffier, page `Success`, documentation globale, statut admin/invite
- `mocké`: `Journal`, `Today`, continuité quotidienne visible
- `legacy`: `App.original.jsx`, `prompt-greffier.js`, alias historiques, une partie du contrat `mode`

Problème central:
- Noema n'a pas une vérité par domaine.
- L'accès est décidé côté frontend alors que `claude.js` n'applique pas l'entitlement.
- Le quota produit a plusieurs règles concurrentes.
- `memory`, `sessions`, `_ui`, Greffier et les surfaces `Journal` / `Today` racontent des versions différentes du même système.

Direction d'alignement choisie:
- imposer une seule source de vérité par domaine
- déplacer les décisions critiques côté backend
- réduire le contrat runtime à ce qui est réellement consommé
- assumer explicitement le `mocké` tant qu'il n'est pas branché

# 2. Principe d'alignement global

Règle unique:

> Une vérité par domaine.

| Domaine | Source de vérité unique | État actuel | Couches qui doivent s'y plier |
|---|---|---|---|
| Accès | résolution d'entitlement backend | `partiel` | `App.jsx`, `useSubscriptionAccess()`, `claude.js`, checkout, invite flow |
| Quotas | compteur de session appliqué côté backend | `partiel` | `AppShell.jsx`, `claude.js`, stockage quota |
| Mémoire | table `memory` | `réel` | prompt, Greffier, onboarding, continuité inter-sessions |
| UI state | état live normalisé d'une session courante | `partiel` | `AppShell.jsx`, `MappingPage.jsx`, `JournalPage.jsx`, `TodayPage.jsx`, persistance de session |
| Mapping | bloc `_ui` unique normalisé depuis le modèle principal | `partiel` | prompt, parser UI, AppShell, Mapping, Greffier |
| Billing | table `subscriptions` alimentée par `stripe-webhook.js` | `réel` | paywall, `Success.jsx`, accès backend, admin |

Règle d'application:
- aucune couche frontend ne décide seule d'un droit produit
- aucune surface UI ne dépend d'un champ `_ui` qu'elle ne consomme pas réellement
- aucune documentation ne présente comme `réel` une surface `mockée`
- aucune IA future ne doit déduire un contrat à partir d'un fichier `legacy` ou `supposé`

# 3. Décisions structurantes

### Accès

Décision:
- le backend décide
- le frontend ne fait qu'un pré-contrôle UX

Arbitrage:
- `claude.js` doit vérifier l'entitlement avant l'appel Anthropic
- la résolution d'accès doit reposer sur trois entrées persistées:
  - `subscriptions.status` pour le payant
  - `profiles.is_admin` pour l'admin
  - un rattachement d'invite persistant côté base pour la beta

Conséquence:
- `sessionStorage.noema_invite` cesse d'être une vérité d'accès
- une invite validée doit devenir une donnée serveur lisible par le backend
- un utilisateur authentifié sans entitlement doit recevoir un refus côté serveur, même si le frontend est contourné

### Quotas

Décision:
- règle produit unique: 25 messages utilisateur par session
- application unique: backend

Arbitrage:
- la limite locale `30/minute` reste un garde-fou anti-spam, pas un quota produit
- `rate_limits` ne doit plus porter à la fois une logique client et une logique serveur

Conséquence:
- `AppShell.checkRateLimit()` ne doit plus écrire en base
- `claude.js` devient l'unique compteur métier
- si la notion de session n'est pas encore stable, elle doit être créée avant de continuer à parler de "25 messages par session"

### Memory vs Sessions

Décision:
- `memory` garde la mémoire inter-sessions cumulée
- `sessions` garde l'historique et le snapshot d'une session terminée

Arbitrage:
- `memory` reste la seule mémoire durable réinjectée au prompt
- `sessions` ne doit plus être présenté comme une session live
- le concept métier à renommer immédiatement dans la documentation est "session snapshot"

Conséquence:
- on garde `memory`
- on garde `sessions` à court terme
- on supprime l'ambiguïté sémantique
- on introduit ensuite un vrai `session_id` courant pour la session active

### Prompt vs UI

Décision:
- adapter le prompt et le Greffier au contrat UI utile
- ne pas adapter l'UI à des champs non consommés

Contrat `_ui` unique retenu:

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

Arbitrage:
- `step` est conservé car il alimente déjà `MappingPage`
- `next_action` est conservé car il est nécessaire pour brancher `Journal` et `Today`
- `mode` est supprimé du contrat runtime
- `phase`, `msg_count`, `ikigai_completude`, `phase_ready` sortent du contrat runtime tant qu'aucune surface réelle ne les consomme

Conséquence:
- `prompt.js`, `AppShell.applyUI()`, le parser UI et `greffier.js` doivent parler le même dialecte

### Greffier

Décision:
- Greffier est secondaire et assumé comme tel

Arbitrage:
- il ne pilote pas le Mapping visible
- il ne bloque pas la réponse utilisateur
- il persiste et journalise, mais ne devient pas moteur central tant que le contrat n'est pas unifié

Conséquence:
- la vérité UI reste le `_ui` du modèle principal
- la vérité mémoire reste `memory`
- Greffier peut enrichir et auditer, pas arbitrer

### Journal / Today

Décision:
- `Journal` et `Today` sont assumés `mockés` tant que leur persistance et leur alimentation runtime n'existent pas

Arbitrage:
- on ne les présente plus comme surfaces de continuité réelles avant branchement
- leur branchement vient après l'alignement accès + quotas + `_ui`

Conséquence:
- les textes marketing, onboarding, pricing et succès doivent être réalignés immédiatement
- le branchement réel vient dans une phase dédiée, avec modèle de données explicite

# 4. Plan d'actions priorisé

## PRIORITÉ 1 (critique)

### Action 1 — Faire du backend l'autorité d'accès

Description:
- ajouter une vérification d'entitlement dans `claude.js`
- sortir l'accès beta du `sessionStorage` comme vérité d'accès
- persister le lien utilisateur <-> invite côté base

Fichiers impactés:
- `netlify/functions/claude.js`
- `src/hooks/useSubscriptionAccess.js`
- `netlify/functions/validate-invite.js`
- `netlify/functions/create-invite.js`
- `supabase-schema.sql`

Objectif:
- supprimer la contradiction frontend autoritaire / backend permissif

Risque:
- rupture temporaire pour les beta users si la migration invite est mal préparée

### Action 2 — Unifier le quota produit

Description:
- supprimer la double écriture client/serveur
- appliquer la limite produit uniquement côté backend
- dissocier quota produit et anti-spam local

Fichiers impactés:
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `supabase-schema.sql`
- `PROJECT.md`

Objectif:
- rendre la règle de session compréhensible, vérifiable et non contournable

Risque:
- migration de données et correction de wording si la notion de session live n'est pas encore posée

### Action 3 — Geler le contrat `_ui`

Description:
- définir le schéma unique
- supprimer les champs non consommés du runtime
- supprimer les champs consommés mais non demandés

Fichiers impactés:
- `src/constants/prompt.js`
- `src/pages/AppShell.jsx`
- `src/utils/helpers.js`
- `netlify/functions/greffier.js`
- `src/pages/MappingPage.jsx`
- `src/pages/JournalPage.jsx`
- `src/pages/TodayPage.jsx`

Objectif:
- éliminer le dialecte triple prompt / UI / Greffier

Risque:
- régression visible sur le Mapping si la transition n'est pas traitée atomiquement

### Action 4 — Dire la vérité sur les surfaces mockées

Description:
- retirer de la copie produit ce qui présente `Journal`, `Today` ou `Success` comme déjà branchés
- réaligner la doc projet et la roadmap sur l'état réel

Fichiers impactés:
- `src/pages/Landing.jsx`
- `src/pages/Onboarding.jsx`
- `src/pages/Pricing.jsx`
- `src/pages/Success.jsx`
- `PROJECT.md`
- `ROADMAP.md`

Objectif:
- supprimer la contradiction entre promesse visible et runtime réel

Risque:
- baisse temporaire de promesse marketing, mais gain net de cohérence

## PRIORITÉ 2 (structure)

### Action 5 — Créer une vraie session courante

Description:
- introduire un `session_id` live côté runtime
- faire porter le compteur de session et l'historique courant par cette session
- ne plus utiliser `sessions` comme substitut de session active

Fichiers impactés:
- `src/pages/AppShell.jsx`
- `netlify/functions/claude.js`
- `netlify/functions/greffier.js`
- `supabase-schema.sql`

Objectif:
- rendre enfin vraie la notion de "25 messages par session"

Risque:
- migration délicate entre snapshots historiques et session live

### Action 6 — Réaligner `memory` et `sessions`

Description:
- documenter immédiatement `sessions` comme snapshot
- renommer ensuite le concept puis la table
- limiter `memory` au rôle de mémoire inter-sessions réellement injectée

Fichiers impactés:
- `PROJECT.md`
- `NOEMA_SYSTEM_MAP.md`
- `NOEMA_CHAT_ORCHESTRATION_MAP.md`
- `NOEMA_DATA_FLOW_MAP.md`
- `NOEMA_RUNTIME_GAPS.md`
- `supabase-schema.sql`

Objectif:
- supprimer l'ambiguïté mémoire durable vs archive de session

Risque:
- dette de nomenclature si le renommage logique n'est pas suivi du renommage technique

### Action 7 — Rendre `Success` fidèle au billing réel

Description:
- relire `subscriptions` avant d'afficher une activation confirmée
- afficher un état d'attente si le webhook n'a pas encore synchronisé

Fichiers impactés:
- `src/pages/Success.jsx`
- `src/hooks/useSubscriptionAccess.js`
- `netlify/functions/stripe-webhook.js`

Objectif:
- aligner l'expérience post-paiement avec la seule vérité billing réelle

Risque:
- friction UX courte si la synchronisation Stripe est lente

### Action 8 — Rétablir la parité DEV / production

Description:
- cesser de bypasser `claude.js` en DEV pour les parcours à tester
- tester localement le même pipeline d'accès, de quotas et de contrat `_ui`

Fichiers impactés:
- `src/constants/config.js`
- configuration locale de dev
- documentation projet

Objectif:
- éviter qu'un comportement local contredise le runtime réel

Risque:
- setup local plus contraignant

## PRIORITÉ 3 (expansion)

### Action 9 — Brancher un `Journal` minimal réel

Description:
- créer la persistance dédiée du journal
- préremplir la suggestion depuis `next_action`
- relier chaque entrée à la session ou à la date

Fichiers impactés:
- `src/pages/JournalPage.jsx`
- `src/pages/TodayPage.jsx`
- `src/pages/AppShell.jsx`
- `supabase-schema.sql`

Objectif:
- transformer la continuité promise en continuité réelle

Risque:
- surconstruire le modèle de journal avant d'avoir stabilisé la session

### Action 10 — Brancher un `Today` réel dérivé du système

Description:
- générer `Today` à partir du dernier `next_action`, de l'état courant et du journal
- arrêter toute donnée statique de continuité

Fichiers impactés:
- `src/pages/TodayPage.jsx`
- backend de génération dédié
- `supabase-schema.sql`

Objectif:
- faire de `Today` une surface utile, pas une promesse visuelle

Risque:
- génération artificielle si le journal réel n'existe pas encore

### Action 11 — Préparer l'extension mémoire, pas avant

Description:
- laisser `semantic_memory` hors runtime tant que l'alignement de base n'est pas stabilisé
- ne l'ouvrir qu'après l'unification de l'accès, des sessions et du `_ui`

Fichiers impactés:
- `supabase-schema.sql`
- futurs endpoints mémoire
- documentation

Objectif:
- éviter d'empiler une nouvelle mémoire sur un système encore contradictoire

Risque:
- complexité exponentielle si activé trop tôt

# 5. Simplifications recommandées

Ce qu'on peut supprimer:
- l'écriture frontend dans `rate_limits`
- le champ/runtime `mode` dans `AppShell.jsx`
- les imports legacy non utilisés de `AppShell.jsx`
- `App.original.jsx` du chemin mental du projet
- `prompt-greffier.js` du chemin mental du projet

Ce qu'on peut fusionner:
- la logique d'accès en une résolution unique d'entitlement
- la vérité Mapping et la vérité UI autour d'un seul `_ui`
- la persistance Greffier et la persistance AppShell autour d'un vrai `session_id`

Ce qu'on peut renommer:
- `sessions` en "session snapshots" dans la doc immédiatement
- la future table ou le futur concept live en "session" tout court
- `rate_limits` en quota technique si la règle produit sort de cette table

Objectif:
- réduire la complexité utile avant d'ajouter du produit

# 6. Ce qu'on assume temporairement

Liste explicite:
- `Journal` est `mocké`
- `Today` est `mocké`
- Greffier est `secondaire` et `partiel`
- `sessions` représente des snapshots, pas une session live
- `Success` est `mocké` comme preuve d'activation
- l'accès invite est `partiel` tant qu'il dépend d'un stockage local
- `semantic_memory` est `legacy` et non branché
- le bypass DEV direct vers Anthropic n'est pas une vérité runtime produit

But:
- éviter toute ambiguïté tant que le branchement réel n'existe pas

# 7. Cible après alignement

Noema devient:
- un produit où l'accès est décidé côté serveur
- un système où chaque session a une identité claire
- un chat où la réponse utilisateur et l'état UI partagent un contrat unique
- une mémoire où `memory` garde la continuité et où la session garde l'historique du moment
- un billing où `subscriptions` pilote réellement le paywall et la confirmation post-paiement
- un `Journal` et un `Today` reliés à des données réelles, pas à des textes statiques

Flux cible:
- auth utilisateur
- résolution d'entitlement serveur
- ouverture d'une session courante
- appel `claude.js`
- vérification quota backend
- génération réponse + `_ui` unique
- rendu Chat / Mapping / Journal / Today à partir du même état
- clôture de session
- persistance dans `sessions` et synthèse dans `memory`

Expérience réelle:
- une promesse produit lisible
- un état produit cohérent
- aucune divergence critique entre ce que Noema dit, fait et stocke

# 8. Préparation à l'automatisation (MCP)

Doit être stable avant MCP:
- l'autorité backend d'accès
- la règle unique de quota
- le contrat `_ui` versionné et validé
- la sémantique réelle de `memory` et `sessions`
- le statut explicite de `Journal` et `Today`

Doit être unifié avant MCP:
- `session_id` entre frontend, backend, Greffier et `api_usage`
- la résolution d'entitlement
- le parsing et la validation du bloc `_ui`
- la nomenclature doc / code / schéma

Ne doit surtout pas être automatisé maintenant:
- la génération de `Journal` ou `Today` tant qu'ils restent `mockés`
- l'activation de `semantic_memory`
- les actions billing ou admin sensibles sans validation humaine
- les migrations d'accès, de quotas ou de session lancées par des agents sans garde-fou

# 9. Annexes

## Décisions sensibles

- priorité à la vérité runtime sur la promesse marketing
- priorité à l'autorité backend sur le confort frontend
- priorité au contrat minimal utile sur le contrat riche mais non consommé
- priorité à un Greffier secondaire cohérent sur un Greffier central mal branché

## Zones à risque

- migration de l'accès invite vers une vérité persistée
- transition de quota sans casser l'expérience en cours
- apparition d'un vrai `session_id` dans un système historiquement basé sur snapshots
- réalignement du wording produit après plusieurs documents contradictoires

## Pièges pour futures IA

- `PROJECT.md` mélange historique et état courant
- `ROADMAP.md` décrit un futur, pas le runtime réel
- `App.original.jsx` et `prompt-greffier.js` sont `legacy`
- `sessions` ne signifie pas aujourd'hui "session live"
- `rate_limits` ne doit pas être interprété comme une vérité de quota déjà saine
- `Success.jsx` ne prouve pas l'activation réelle
- `Journal` et `Today` ne doivent pas être traités comme branchés tant que leur persistance n'existe pas
