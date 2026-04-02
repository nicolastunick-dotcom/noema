# NOEMA RUNTIME GAPS

Document de cartographie approfondie des écarts structurels entre vision, documentation et runtime réel de Noema.

Base d'analyse:
- code frontend `src/`
- Netlify Functions `netlify/functions/`
- schéma `supabase-schema.sql`
- documentation locale `PROJECT.md`, `ROADMAP.md`, `DEBATE.md`, `RETENTION.md`, `codex.md`, `docs/appshell-refactor-plan.md`
- cartographies existantes `NOEMA_SYSTEM_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_DATA_FLOW_MAP.md`

Principe:
- `réel` = branché dans le runtime actuel
- `partiel` = présent mais incomplet, incohérent, contournable, ou à effet limité
- `mocké` = surtout visuel / local / sans persistance produit
- `legacy` = reliquat non source de vérité
- `supposé` = inférence plausible mais non démontrée directement par un flux exécuté

## 1. Résumé exécutif

Noema ne souffre pas seulement d'un "écart entre ambition et exécution". Il souffre surtout d'un écart entre plusieurs vérités concurrentes:
- une vérité marketing et onboarding qui promet continuité quotidienne, mémoire infinie, journal guidé et rituel personnalisé
- une vérité prompt/orchestration où le modèle principal doit produire un bloc `<_ui>` plus riche que ce que l'UI consomme réellement
- une vérité runtime où l'expérience vivante repose surtout sur `App.jsx`, `AppShell.jsx`, `claude.js`, `memory`, `sessions` et `subscriptions`
- une vérité documentaire où certains fichiers sont maintenant précis (`NOEMA_SYSTEM_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_DATA_FLOW_MAP.md`), alors que d'autres décrivent encore un état antérieur ou un futur non branché

Les écarts structurants les plus importants sont aujourd'hui:
- ~~l'accès produit est décidé côté frontend, alors que `/.netlify/functions/claude` ne vérifie pas l'abonnement, seulement le JWT~~ **RÉSOLU Sprint 1** : `claude.js` vérifie maintenant l'entitlement (admin / subscription / invite) et retourne 403 si absent
- ~~le quota s'écrit en double, client ET serveur~~ **RÉSOLU Sprint 1** : le frontend ne lit/écrit plus `rate_limits`, seul `claude.js` est autorité quota
- ~~le contrat `_ui` du prompt principal ne correspond pas au contrat réellement consommé par `applyUI()`~~ **RÉSOLU Sprint 2**
- `Journal` et `Today` sont présentés dans la roadmap, le landing, l'onboarding et le pricing comme surfaces utiles de continuité, alors qu'ils restent presque entièrement statiques — **cible Sprint 5**
- ~~`sessions` donne l'impression d'une session métier stable, mais le runtime l'utilise comme système de snapshots répétés~~ **RÉSOLU Sprint 4.1 (anticipé)** : upsert sur `session_id`, une seule ligne par session active
- le repo contient encore des reliquats V1/V2 (`App.original.jsx`, `prompt-greffier.js`, alias legacy, imports orphelins) capables de tromper une IA qui ne lirait pas les bons points de vérité
- plusieurs documents historiques (`ROADMAP.md`, `DEBATE.md`, parties de `PROJECT.md`, parties de `codex.md`) décrivent un Noema plus cohérent, plus branché ou plus ancien que le runtime actuel

Ce que Noema est réellement aujourd'hui (post Sprint 4.1) :
- `réel`: auth, accès backend verrouillé (entitlement admin/sub/invite), quota backend unique, chat, mémoire inter-sessions, snapshots, Mapping, onboarding, admin panel partiel
- `partiel`: Greffier comme moteur secondaire de persistance, billing post-checkout (Success mocké), `invites.user_id` linkage (migration à exécuter en prod), documentation globale du projet
- `mocké`: `Journal`, `Today`, état confirmé de `Success`, partie du discours "rituel quotidien" et "journal guidé par Noema"
- `legacy`: `App.original.jsx`, `prompt-greffier.js`, une partie de `access_codes`, les commentaires Greffier sur `user_insights` / `ikigai_state`

Écart résiduel Sprint 1 :
- `invites.user_id` : la colonne doit être ajoutée en prod via la migration SQL (commentée dans `supabase-schema.sql`)
- les utilisateurs beta existants (sessionStorage invite) seront liés en DB lors de leur prochaine session via le fire-and-forget dans `useSubscriptionAccess.js`
- tant que la migration n'est pas exécutée, le check invite dans `claude.js` ne trouve rien → accès refusé pour les betas → risque à gérer avant déploiement

## 2. Vue d'ensemble des écarts

### 2.1 Grandes familles de désalignement

Vision produit vs runtime:
- le projet parle d'un compagnon introspectif complet, avec continuité quotidienne et progression visible
- le runtime livre surtout un chat + un Mapping localement hydraté + une mémoire inter-sessions partielle

Documentation vs code:
- certaines docs décrivent le futur souhaité
- d'autres décrivent un état passé déjà dépassé
- très peu de docs, hors cartographies récentes, décrivent strictement la vérité runtime actuelle

Prompt vs UI / orchestration:
- le prompt principal impose un schéma `_ui`
- `applyUI()` en exploite seulement une partie et attend aussi des champs que le prompt actuel ne demande pas
- le Greffier inline parle encore un troisième dialecte

Modèle de données vs runtime:
- le schéma contient `semantic_memory` non branché
- ~~le runtime utilise `invites` sans l'avoir dans `supabase-schema.sql`~~ **RÉSOLU Sprint 1** : `invites` formalisée dans le schéma avec colonne `user_id` + RLS + migration commentée
- la roadmap promet `journal` / `today` sans tables ni requêtes runtime correspondantes

Surfaces visibles vs branchement réel:
- `Mapping` est réellement alimenté
- `Journal` et `Today` sont surtout visuels
- `Success` affirme plus que ce qu'il vérifie

Legacy vs source de vérité:
- des reliquats V1/V2 restent présents et plausibles
- leur simple présence peut faire dérailler une IA qui lit trop vite le repo

### 2.2 Où se trouvent les contradictions les plus importantes

- `src/constants/prompt.js` vs `src/pages/AppShell.jsx`
- `src/App.jsx` / `src/hooks/useSubscriptionAccess.js` vs `netlify/functions/claude.js`
- `ROADMAP.md` / `RETENTION.md` / `src/pages/Landing.jsx` / `src/pages/Onboarding.jsx` vs `src/pages/JournalPage.jsx` / `src/pages/TodayPage.jsx`
- `supabase-schema.sql` vs `netlify/functions/create-invite.js` / `validate-invite.js`
- `src/App.original.jsx` / `src/constants/prompt-greffier.js` vs runtime V2 réel

Références:
- `src/App.jsx:166-207`
- `src/hooks/useSubscriptionAccess.js:21-159`
- `src/pages/AppShell.jsx:149-210`
- `netlify/functions/claude.js:32-119`
- `ROADMAP.md:20-39`, `ROADMAP.md:57-58`
- `supabase-schema.sql:97-198`

## 3. Vision produit vs runtime réel

### 3.1 Ce que Noema promet

Le projet promet explicitement:
- un guide qui "se souvient de tout d'une session à l'autre" (`src/constants/prompt.js:68-71`, `src/pages/Onboarding.jsx:267-272`)
- des sessions limitées à 25 messages et naturellement clôturées avec une action concrète (`src/constants/prompt.js:57-66`, `src/pages/Onboarding.jsx:227-246`)
- un `Journal` guidé par `next_action` et sauvegardé dans Supabase (`ROADMAP.md:29-30`)
- un `Aujourd'hui` généré chaque jour par Noema, persisté et relié au journal (`ROADMAP.md:32-33`)
- une progression visible via cartographie psychique, journal guidé, rituel personnalisé (`src/pages/Landing.jsx:603-614`, `src/pages/Pricing.jsx:23-38`)
- une activation d'abonnement claire après paiement (`src/pages/Success.jsx:103-140`)

### 3.2 Ce que le runtime exécute réellement

Mémoire (état après Sprint 3):
- `buildMemoryContext()` réinjecte désormais `forces`, `contradictions`, `blocages` (3 niveaux), `ikigai` (5 champs), `session_notes`, `session_count`, `step`
- `blocages` et `contradictions` sont maintenant inclus dans le prompt principal
- `memoryRef.current` est mis à jour en live après chaque réponse `_ui` via `updateMemoryRef()` — le contexte s'enrichit au fil de la session sans attendre `saveSession()`
- `claude.js` charge la mémoire depuis DB côté serveur (`buildServerMemoryContext`) — ne dépend plus du `memory_context` client
- la promesse "mémoire infinie" reste `partielle` mais nettement moins creuse

Clôture de session:
- le prompt demande une tâche concrète en fin de session
- mais `next_action` n'est ni affiché dans `JournalPage` ni dans `TodayPage`
- la limitation réelle n'est pas une simple règle "25 messages maximum"

Continuité quotidienne:
- `JournalPage` ne lit ni `next_action`, ni `memory`, ni `sessions`, ni une table `journal`
- `TodayPage` n'appelle aucune API Noema et n'utilise qu'un prénom dérivé de `user`

Mapping:
- c'est la surface la plus proche de la promesse
- mais elle dépend du bloc `_ui` du modèle principal, pas d'un moteur analytique unifié

Billing:
- le checkout et le webhook existent
- la page `Success` ne vérifie rien en base
- la confirmation visuelle post-paiement reste donc `mockée`

### 3.3 Écarts par domaine

| Domaine | Vision / promesse | Runtime réel | Etat |
|---|---|---|---|
| Mémoire | continuité totale | `forces`, `blocages`, `contradictions`, `ikigai`, `step` injectés — mid-session live via `updateMemoryRef` | réel (Sprint 3) |
| Guide quotidien | journal guidé + rituel du jour | deux pages statiques | mocké |
| Cartographie | miroir vivant de progression | Mapping branché au `_ui` | réel mais partiel |
| Paiement -> accès | activation claire après paiement | vérité dans `subscriptions`, mais `Success` ne vérifie pas | partiel |
| Session | 25 messages / session | 25/jour serveur, 100/jour client + 30/min local | contradictoire |
| Phase 2 | bascule guide -> stratège | prompt la décrit, UI ne l'incarne presque pas | partiel |

Références:
- `src/constants/prompt.js:57-66`, `src/constants/prompt.js:95-137`
- `src/lib/supabase.js:22-52`
- `src/pages/JournalPage.jsx:23-57`
- `src/pages/TodayPage.jsx:26-44`
- `src/pages/MappingPage.jsx:294-420`
- `src/pages/Success.jsx:103-140`

## 4. Documentation vs code

### 4.1 Docs alignées

`NOEMA_SYSTEM_MAP.md`:
- aligne correctement les surfaces réelles, la place du chat, l'état mocké de `Journal` et `Today`, et la persistance `memory` / `sessions`

`NOEMA_CHAT_ORCHESTRATION_MAP.md`:
- aligne correctement la source réelle du Mapping, le rôle secondaire du Greffier, le problème `session_id` / `user_memory`, et la réalité du pipeline chat

`NOEMA_DATA_FLOW_MAP.md`:
- aligne correctement la vérité d'accès, la réalité de `subscriptions`, l'état de `memory`, `sessions`, `rate_limits`, `invites`, `access_codes`, `semantic_memory`

### 4.2 Docs partiellement alignées

`PROJECT.md`:
- utile comme journal projet et point d'entrée
- `partiel` parce qu'il mélange historique, état actuel et tâches encore "en cours"
- exemples:
  - "Paiement : Stripe (intégration en cours)" alors que checkout + webhook existent déjà (`PROJECT.md:13`, `netlify/functions/create-checkout-session.js:55-67`, `netlify/functions/stripe-webhook.js:45-128`)
  - "Limite 25 messages par session" alors que le runtime applique plusieurs règles concurrentes (`PROJECT.md:85`, `src/pages/AppShell.jsx:213-232`, `netlify/functions/claude.js:69-103`)
  - "Système d'invitations beta (FAIT) / table à créer manuellement" alors que le runtime l'utilise déjà mais hors schéma principal (`PROJECT.md:121-133`, `supabase-schema.sql:1-198`)

`RETENTION.md`:
- juste sur le constat "Journal / Today statiques"
- `partiel` parce qu'il raisonne volontairement en priorisation produit, pas en vérité runtime détaillée

`docs/appshell-refactor-plan.md`:
- utile pour comprendre l'intention de découpage
- `partiel` parce que les hooks mentionnés n'existent pas encore

### 4.3 Docs obsolètes

`ROADMAP.md`:
- promet `useNoemaSession`, `useNoemaRateLimit`, `journal` en base, `Today` généré par l'API, `next_action` affiché dans `Today`
- ces contrats n'existent pas dans le runtime courant

`DEBATE.md`:
- parle encore du webhook Stripe comme absent
- décrit le streaming SSE comme architecture active
- ces deux points sont dépassés par le code actuel

`codex.md`:
- certaines alertes restent utiles, notamment sur `access_codes` et `profiles`
- mais plusieurs constats sont obsolètes, par exemple l'absence de JWT côté appels chat

### 4.4 Docs trompeuses

Trompeuses par excès de futur:
- `ROADMAP.md` peut faire croire que `Journal`, `Today` et `next_action` sont déjà dans le contrat produit actuel

Trompeuses par inertie historique:
- `DEBATE.md` et `codex.md` peuvent faire croire que le runtime chat actuel est encore celui d'avant les correctifs de fin mars / début avril

Trompeuses par mélange état/historique:
- `PROJECT.md` est indispensable, mais ne suffit pas seul à reconstruire la vérité runtime sans les cartographies récentes

Références:
- `PROJECT.md:8-16`, `PROJECT.md:80-123`
- `ROADMAP.md:15`, `ROADMAP.md:23-33`, `ROADMAP.md:57-58`
- `DEBATE.md:80-88`, `DEBATE.md:157-160`, `DEBATE.md:188-202`
- `codex.md:103-162`
- `docs/appshell-refactor-plan.md:6-39`

## 5. Prompt vs UI / orchestration

### 5.1 Prompt principal vs `applyUI()`

Le prompt principal exige dans `<_ui>`:
- `etat`
- `phase`
- `msg_count`
- `forces`
- `blocages`
- `contradictions`
- `ikigai`
- `ikigai_completude`
- `next_action`
- `session_note`
- `phase_ready`

`applyUI()` consomme réellement:
- `session_note`
- `etat`
- `mode`
- `step`
- `forces`
- `blocages`
- `contradictions`
- `ikigai`

Écart réel:
- `mode` et `step` sont attendus par l'UI, mais ne sont pas demandés par le prompt actuel
- `phase`, `msg_count`, `ikigai_completude`, `next_action`, `phase_ready` sont demandés par le prompt, mais pas exploités par l'UI principale

### 5.2 Bloc `_ui` vs surfaces visibles

`MappingPage` lit:
- `insights.forces`
- `insights.blocages`
- `insights.contradictions`
- `ikigai`
- `step`

`JournalPage` ne lit pas:
- `next_action`
- `session_note`
- `ikigai_completude`

`TodayPage` ne lit pas:
- `next_action`
- `phase_ready`
- `msg_count`
- `session_note`

Conséquence:
- le prompt parle à un produit plus large que l'UI branchée actuelle

### 5.3 Prompt Greffier vs Greffier runtime

`src/constants/prompt-greffier.js`:
- exporte un prompt Greffier jamais importé
- attend `blocages` sous forme de liste dans le JSON d'exemple
- nomme les champs Ikigai `bon_at`, `monde_besoin`, `paye_pour`

`netlify/functions/greffier.js`:
- utilise un prompt inline différent
- produit `phase`, `progression`, `conscience`, `ui_insight_type`, `step`, `next_action`
- normalise vers un schéma encore différent du prompt inutilisé

Conséquence:
- il existe trois contrats concurrents:
  - prompt principal `_ui`
  - prompt Greffier inutilisé
  - Greffier runtime inline

### 5.4 Rôle réel du Greffier

Ce que son nom et sa présence peuvent laisser croire:
- un moteur analytique central qui nourrit le Mapping et les surfaces produit

Ce qu'il fait réellement:
- appel Haiku parallèle
- log admin
- upsert `memory`
- update `sessions` seulement si `sessionId` existe, ce qui n'arrive pas dans le wiring actuel
- aucune alimentation directe du Mapping visible

Références:
- `src/constants/prompt.js:95-137`
- `src/pages/AppShell.jsx:177-210`
- `src/pages/MappingPage.jsx:294-420`
- `src/pages/JournalPage.jsx:23-57`
- `src/pages/TodayPage.jsx:26-31`
- `src/constants/prompt-greffier.js:1-38`
- `netlify/functions/greffier.js:6-89`, `netlify/functions/greffier.js:140-183`, `netlify/functions/greffier.js:186-307`

## 6. Modèle de données vs runtime

### 6.1 Tables présentes mais non branchées

`semantic_memory` et `match_semantic_memory()`:
- présents dans `supabase-schema.sql`
- absents des lectures/écritures runtime
- `legacy` / futur non branché

### 6.2 Tables utilisées mais absentes du schéma principal

`invites`:
- utilisée par `create-invite.js` et `validate-invite.js`
- documentée dans `PROJECT.md`
- absente de `supabase-schema.sql`

### 6.3 Structures promises mais absentes

`journal`:
- promise explicite de `ROADMAP.md`
- aucune table dans `supabase-schema.sql`
- aucune requête dans `JournalPage.jsx`

Persistance `today`:
- promise explicite de `ROADMAP.md`
- aucune table
- aucune lecture/écriture dédiée

### 6.4 Noms trompeurs

`sessions`:
- nom de session métier stable
- usage réel de snapshots d'état / autosave / fin de session

`profiles`:
- nom de profil utilisateur riche
- usage réel quasi limité à `is_admin`

`rate_limits`:
- nom de quota unifié
- usage réel de compteur journalier écrit par deux politiques différentes

### 6.5 Structures partielles

`memory`:
- stocke `forces`, `contradictions`, `blocages`, `ikigai`, `session_notes`, `onboarding_done`
- le prompt principal ne relit qu'une partie de ces données

`api_usage.session_id`:
- colonne présente
- `claude.js` n'insère pas de `session_id`
- `greffier.js` l'insère avec `sessionId = null`

`subscriptions`:
- stocke plus que ce que `useSubscriptionAccess()` utilise pour la navigation

`access_codes`:
- vraie lecture/écriture runtime
- plus source de vérité d'accès produit

Références:
- `supabase-schema.sql:22-46`
- `supabase-schema.sql:58-117`
- `supabase-schema.sql:122-198`
- `netlify/functions/create-invite.js:70-80`
- `netlify/functions/validate-invite.js:35-58`
- `src/pages/JournalPage.jsx:23-57`
- `src/pages/TodayPage.jsx:26-44`
- `src/lib/supabase.js:22-52`
- `netlify/functions/claude.js:156-165`
- `netlify/functions/greffier.js:243-251`

## 7. Surfaces visibles vs branchement réel

| Surface | Ce qu'elle laisse croire | Ce qu'elle fait réellement | Niveau de branchement |
|---|---|---|---|
| Landing | produit complet de continuité introspective | marketing + promesses de `Journal` / cartographie / accompagnement | partiel |
| Pricing | accès mensuel + surfaces complètes | checkout mensuel réel, plan Pro visuel seulement | partiel |
| Success | abonnement activé et prêt | message statique, pas de relecture `subscriptions` | mocké |
| Chat | coeur produit vivant | surface la plus réellement branchée | réel |
| Mapping | miroir analytique de progression | consomme l'état React alimenté par `<_ui>` | réel mais dépendant du chat |
| Journal | journal guidé par Noema | prompts statiques, save local visuel | mocké |
| Today | rituel personnalisé du jour | `STATIC_DATA` + prénom user | mocké |
| AdminPanel | pilotage admin global | simulations locales + quelques appels admin réels, coûts non globaux | partiel |

### 7.1 Surface par surface

Landing:
- vend une cartographie psychique, un journal guidé et un produit de continuité
- ne permet pas de vérifier qu'ils sont branchés

Pricing:
- liste `Journal guide` et `Rituel personnalise` comme features du plan mensuel
- ces surfaces ne sont pas réellement branchées aux données produit

Success:
- texte affirmatif "Ton abonnement est activé"
- aucun fetch, aucune vérification Supabase, aucune lecture de `accessState`

Mapping:
- lit bien des données runtime
- mais ces données viennent du dernier flux chat, pas d'un moteur autonome ni d'une requête dédiée

Journal:
- suggestion de Noema statique
- tags statiques
- bouton save purement visuel

Today:
- intention, question, défi, citation statiques
- bouton vers Journal sans préremplissage

Références:
- `src/pages/Landing.jsx:603-614`, `src/pages/Landing.jsx:658-669`
- `src/pages/Pricing.jsx:23-38`
- `src/pages/Success.jsx:103-140`
- `src/pages/AppShell.jsx:351-387`
- `src/pages/JournalPage.jsx:23-57`
- `src/pages/TodayPage.jsx:26-31`, `src/pages/TodayPage.jsx:111-129`

## 8. Reliquats legacy / V1 / V2

### 8.1 Reliquats principaux

`src/App.original.jsx`:
- contient une ancienne implémentation monolithique
- porte un ancien prompt plus proche de `applyUI()` actuel
- garde l'ancien contrat `mode` / `step` / `regulation`
- contient aussi l'ancien comportement DEV Anthropic direct

`src/constants/prompt-greffier.js`:
- semble être la source du prompt Greffier
- n'est jamais importé
- décrit un schéma différent du Greffier runtime réel

Alias legacy de routes:
- `/chat`, `/mapping`, `/journal`, `/today` sont encore acceptés
- ils entretiennent la continuité V1/V2

AppShell V2 avec restes V1:
- imports inutilisés `buildSystemPrompt`, `StateBadge`, `InsightsPane`, `ProgressPane`, `IkigaiPane`, `SendSVG`
- états orphelins `sideTab`, `mobTab`, `mode`, `greffierLogTick`

### 8.2 Ce qui peut tromper une future IA

- croire que `App.original.jsx` décrit encore la vérité runtime
- croire que `prompt-greffier.js` pilote le Greffier
- croire que `mode` / `step` sont encore demandés par le prompt actuel
- croire qu'il existe un hook `useNoemaSession` ou `useNoemaRateLimit` parce que la roadmap et le plan de refactor en parlent
- croire que `access_codes` ouvre encore vraiment l'app

### 8.3 Ce qui devrait être supprimé, archivé ou explicitement marqué

À archiver ou documenter:
- `src/App.original.jsx`
- `src/constants/prompt-greffier.js`

À clarifier avant toute suppression:
- aliases legacy de routes
- imports/états orphelins de `AppShell.jsx`
- rôle restant de `access_codes`

Références:
- `src/App.original.jsx:11-13`
- `src/App.original.jsx:190-229`
- `src/constants/prompt-greffier.js:1-38`
- `src/lib/access.js:8-18`
- `src/pages/AppShell.jsx:2-11`, `src/pages/AppShell.jsx:39-45`, `src/pages/AppShell.jsx:53-54`

## 9. Contradictions critiques

### 9.1 Critique

1. Accès payant décidé côté frontend, mais backend chat non aligné
- `App.jsx` et `useSubscriptionAccess()` bloquent l'entrée produit sans abonnement actif
- `claude.js` vérifie seulement le JWT
- un contournement frontend permet encore d'atteindre le backend chat

2. Vérité des quotas incompatible selon les couches
- prompt + onboarding + pricing racontent 25 messages max
- le client bloque à 30/min et 100/jour
- le serveur bloque à 25/jour
- la même table `rate_limits` porte des sens différents

3. Contrat prompt/UI non aligné
- le prompt principal émet des champs clés non consommés
- l'UI dépend de `mode` et `step`, absents du prompt actuel
- le Mapping repose donc sur un contrat implicite, pas sur un contrat unique explicite

### 9.2 Importante

1. `Journal` et `Today` sont vendus comme briques coeur de continuité mais restent statiques

2. `sessions` est nommé comme un objet métier stable alors qu'il sert surtout de snapshots

3. Le Greffier paraît central mais ne nourrit pas directement l'UI produit

4. La documentation générale du projet reste hétérogène entre état passé, état actuel et futur souhaité

### 9.3 Secondaire

1. `profiles` s'appelle profil mais sert surtout d'entitlement admin

2. `Success` affirme l'activation sans preuve runtime

3. `api_usage` "totaux" admin ne sont pas globaux plateforme

4. `invites` est réel mais hybride, local et hors schéma principal

### 9.4 Cosmétique

1. l'offre Pro est visible alors qu'elle n'est pas branchée

2. plusieurs labels UI donnent un sentiment de produit plus fini que le runtime

Références:
- `src/App.jsx:166-207`
- `src/hooks/useSubscriptionAccess.js:95-149`
- `netlify/functions/claude.js:32-103`
- `src/pages/AppShell.jsx:213-232`
- `src/constants/prompt.js:57-66`, `src/constants/prompt.js:98-137`
- `src/pages/Pricing.jsx:23-38`
- `src/pages/Success.jsx:114-140`
- `netlify/functions/admin-tools.js:133-147`

## 10. Vérité actuelle de Noema

Noema est aujourd'hui:
- un chat introspectif premium, accessible après auth et entitlement frontend
- une mémoire inter-sessions `partielle`, basée sur `memory`
- un système de snapshots `sessions` qui sert plus à restaurer l'UI qu'à représenter une session métier
- un Mapping vivant, mais dépendant du bloc `_ui` du modèle principal
- un Greffier secondaire, utile surtout pour enrichir la mémoire et l'observabilité admin
- un billing techniquement branché côté checkout/webhook, mais encore partiellement incohérent côté surfaces utilisateur
- un produit qui montre déjà sa forme cible, sans encore avoir aligné ses promesses, ses docs, ses prompts, ses surfaces et ses tables autour d'une vérité unique

Autrement dit:
- Noema n'est pas encore un système complet de continuité quotidienne
- Noema est déjà un coeur chat réel entouré de surfaces plus avancées dans le discours que dans le branchement

## 11. Priorités d'alignement

### 11.1 À corriger d'abord

1. Aligner l'autorité d'accès entre frontend et backend chat
2. Unifier la politique de quotas et son écriture
3. Aligner le contrat `_ui` entre `prompt.js`, `applyUI()` et les surfaces qui dépendent réellement du Mapping

### 11.2 À clarifier dans la documentation d'abord

1. Statut réel de `Journal` et `Today`
2. Statut réel du Greffier
3. Signification réelle de `sessions`
4. Statut legacy de `App.original.jsx` et `prompt-greffier.js`

### 11.3 À assumer explicitement

1. `Journal` et `Today` sont pour l'instant des surfaces mockées
2. `memory` n'est pas une mémoire exhaustive réinjectée telle quelle
3. `profiles` n'est pas un profil produit complet
4. `access_codes` n'est plus la vérité d'accès principale

### 11.4 À débrancher / supprimer

1. `prompt-greffier.js` si aucune réutilisation n'est prévue
2. les imports / états orphelins de `AppShell.jsx`
3. les ambiguïtés laissées par `App.original.jsx` si le fichier reste sans statut explicite

### 11.5 À garder pour plus tard

1. `semantic_memory`
2. une vraie persistance `journal`
3. une vraie génération quotidienne `today`
4. une UI Phase 2 cohérente avec le prompt

## 12. Annexes

### 12.1 Fichiers les plus trompeurs

- `ROADMAP.md`
- `DEBATE.md`
- `codex.md`
- `src/App.original.jsx`
- `src/constants/prompt-greffier.js`
- `src/pages/Success.jsx`

### 12.2 Termes les plus trompeurs

- `sessions`
- `profiles`
- `rate_limits`
- `Journal guidé`
- `Rituel personnalisé`
- `Mémoire infinie`
- `coûts API totaux`

### 12.3 Zones à risque pour futures IA

- prendre `ROADMAP.md` pour l'état d'implémentation
- prendre `App.original.jsx` pour la source de vérité prompt/UI
- croire que le Greffier alimente le Mapping visible
- croire que `Journal` et `Today` sont déjà branchés parce qu'ils existent visuellement
- croire que `subscriptions` suffit à sécuriser le backend chat

### 12.4 Check-list avant modification du projet

1. Vérifier si la vérité métier visée est frontend, backend, prompt, UI locale ou base.
2. Vérifier si le changement touche `memory`, `sessions` ou les deux.
3. Vérifier si `prompt.js`, `applyUI()` et `MappingPage` parlent toujours du même contrat.
4. Vérifier si la surface modifiée est réellement branchée ou seulement mockée.
5. Vérifier si un fichier legacy (`App.original.jsx`, `prompt-greffier.js`) risque d'être pris à tort pour référence.
6. Vérifier si `PROJECT.md`, `ROADMAP.md` ou `DEBATE.md` décrivent un état déjà dépassé.
7. Vérifier si la modification change la vérité d'accès, la vérité de quota, ou seulement l'affichage.
8. Vérifier si le schéma local couvre réellement toutes les tables utilisées en runtime.
