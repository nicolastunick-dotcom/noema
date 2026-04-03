# NOEMA — MASTER

> Synthèse canonique au 03/04/2026.
> Sources croisées : `PROJECT.md`, `ROADMAP.md`, `DEBATE.md`, `RETENTION.md`, `codex.md`, `docs/system/NOEMA_VISION.md`, `docs/system/NOEMA_VISION2.md`, `docs/system/NOEMA_SYSTEM_MAP.md`, `docs/system/NOEMA_RUNTIME_GAPS.md`, et le code réellement branché.

---

## 1. Arbitrage entre `NOEMA_VISION.md` et `NOEMA_VISION2.md`

### Ce que dit `NOEMA_VISION2.md`

- C'est la note fondatrice la plus récente.
- Elle fixe l'intention profonde : Noema doit comprendre l'utilisateur en profondeur, traiter les problèmes à la racine, construire un ikigai, puis devenir un stratège durable.
- Elle apporte des intuitions produit fortes : espace safe au départ, chat comme coeur, mapping central, ambition alignée à l'ikigai, cible 18-35 ans en perte de repères.

### Ce que dit `NOEMA_VISION.md`

- C'est la version la plus structurée, la plus complète et la plus exploitable pour piloter le produit.
- Elle transforme l'intuition fondatrice en système cohérent :
  - 4 phases au lieu de 3 blocs plus flous
  - rôle exact du mapping
  - différence entre ce qui est déjà réel et ce qui manque encore
  - ordre de priorité produit

### Arbitrage retenu

- La vision officielle finale garde l'intention de `NOEMA_VISION2.md`.
- La structure officielle retenue est celle de `NOEMA_VISION.md`.
- En pratique :
  - la logique "Perdu -> Guide -> Stratège" est conservée comme lecture émotionnelle du parcours
  - la modélisation produit officielle devient `Voir -> Comprendre -> S'aligner -> Agir`
  - le chat, le mapping, le journal et le rituel du jour restent le coeur officiel
  - l'ikigai reste central
  - la posture "traiter la racine, pas seulement les symptômes" reste non négociable

### Ce qui est retenu comme décision produit complémentaire

- La `Page Zen` est retenue comme évolution officielle de la surface `Aujourd'hui`.
- Concrètement, `Aujourd'hui` devient une base runtime transitoire qui sera transformée en `Zen`, pas une surface à supprimer puis reconstruire de zéro.
- Les emails automatiques de fin de phase ne sont pas retenus comme priorité produit immédiate.
- Le modèle exact "7 jours gratuits puis débit automatique" n'est pas retenu comme vérité officielle actuelle.
- La vérité officielle sur le modèle économique devient :
  - découverte gratuite réelle avant paiement
  - abonnement pour préserver la continuité et approfondir le travail

---

## 2. Vision officielle finale

Noema n'est pas un simple chat introspectif. C'est un système de transformation personnelle qui doit :

- comprendre l'utilisateur en profondeur, dans la durée
- faire émerger forces, blocages, contradictions et direction de vie
- traiter les schémas à la racine
- construire un ikigai vivant, pas décoratif
- aider ensuite l'utilisateur à s'aligner puis à agir

### Parcours officiel

1. `Voir`
Clarifier ce qui est confus, faire émerger les premiers signaux, accueillir sans brusquer.

2. `Comprendre`
Nommer les contradictions, croyances et schémas répétitifs, relier les sessions entre elles.

3. `S'aligner`
Faire émerger une ambition réelle, confronter les projets à l'ikigai, stabiliser une direction juste.

4. `Agir`
Passer à l'action de façon alignée, avec suivi, confrontation douce et continuité mesurable.

### Surfaces officielles

- `Chat` : moteur principal de compréhension et d'accompagnement
- `Mapping` : miroir vivant de ce que Noema comprend
- `Journal` : espace où le fil se dépose, se reformule et se densifie
- `Zen` : évolution de `Aujourd'hui`, surface de continuité calme et personnalisée, nourrie par le chat, le journal, le mapping et l'état intérieur détecté

### Positionnement de `Zen`

`Zen` n'est pas un 5e onglet ajouté au-dessus du produit actuel.
`Zen` remplace progressivement `Aujourd'hui` en gardant tout ce qui marche déjà :

- reprise du fil en cours
- `next_action`
- preuve visible
- impact déjà visible
- continuité avec le journal

Puis `Zen` ajoute ce qui manque dans `NOEMA_VISION2.md` :

- exercice ou rituel adapté
- moment de calme plus immersif
- surface explicitement pensée comme page de recentrage, d'affirmation, de méditation ou de remise en question

### Cible officielle

- 18-35 ans
- personnes perdues, saturées, en décalage avec ce qu'elles vivent
- pas forcément en crise formulée, mais avec le sentiment que "quelque chose n'est pas aligné"

---

## 3. État actuel réel du projet

### Ce qui est réellement branché

| Domaine | État réel au 03/04/2026 |
|---|---|
| Frontend | React 18 + Vite, routage manuel dans `src/App.jsx` |
| Auth | Supabase Auth : login, signup, reset password, Google OAuth côté code |
| Accès produit | Vérification frontend + backend ; `claude.js` valide le JWT et résout un tier d'accès |
| Tiers d'accès | `trial`, `subscriber`, `invite`, `admin` |
| Quotas | Backend autoritaire : `8/jour` en trial, `25/jour` en accès complet ; garde-fou local `30/min` |
| Chat | Réel, branché à Anthropic via `/.netlify/functions/claude` |
| Mémoire | `memory` + snapshots `sessions` réellement lus/écrits |
| Mapping | Réel, alimenté par le bloc `_ui` du modèle principal |
| Journal | Réel, lecture/écriture Supabase dans `journal_entries` |
| Aujourd'hui | Réel, basé sur `next_action`, la dernière session et la dernière entrée journal ; socle de transition vers `Zen` |
| Preuve produit | Réelle, non générative, assemblée localement |
| Billing | Réel : checkout Stripe, webhook Stripe, page `Success` avec relecture de `subscriptions` |
| Onboarding | Réel, piloté par `memory.onboarding_done` |
| Admin | Partiel mais branché : panel admin + `admin-tools.js` |

### Ce qui est partiel

- La phase `Stratège` existe dans le prompt mais pas comme mode UI vraiment visible.
- Le Greffier écrit et enrichit, mais ne pilote pas directement l'UI.
- Le mapping montre surtout un état courant, pas une progression longitudinale.
- Le flux invite est hybride :
  - backend : lecture de `invites`
  - frontend : `useSubscriptionAccess` repose aujourd'hui sur `sessionStorage.noema_invite`
- L'admin garde encore un bypass legacy via `VITE_ADMIN_EMAIL`.
- Le modèle "session" reste surtout un snapshot persistant, pas une entité métier très riche.

### Ce qui n'est pas branché

- `semantic_memory`
- détection explicite des schémas cross-sessions
- `Page Zen` en tant que surface finale nommée et assumée
- emails de fin de phase
- représentation UI explicite et durable du passage en mode `Stratège`

### Santé actuelle du repo

- `npm run build` : passe
- `npm test` : échoue faute de fichiers de test Vitest
- bundle de production : fonctionne, avec un chunk principal volumineux signalé par Vite

---

## 4. Écarts entre la vision officielle et le code

| Vision officielle | Réalité du code aujourd'hui | Écart |
|---|---|---|
| Noema doit devenir visiblement `Guide` puis `Stratège` | le prompt le prévoit, l'UI ne le met presque pas en scène | fort |
| Noema doit ramener les schémas récurrents à la surface | mémoire injectée oui, détection cross-sessions non | fort |
| Le mapping doit devenir un miroir de progression | il reflète surtout l'état courant | fort |
| Le journal et `Zen` doivent prolonger le fil central | `Journal` et `Aujourd'hui` sont déjà reliés, mais `Aujourd'hui` n'est pas encore une vraie surface `Zen` | fort |
| La vérité d'accès doit être unifiée | backend et frontend ne s'appuient pas encore sur la même vérité invite | fort |
| L'autorité admin doit être propre | présence persistante d'un bypass email legacy | moyen |
| La documentation doit décrire une seule vérité | plusieurs `.md` historiques restent partiellement contradictoires | moyen |

### Écart de vision à ne pas sur-prioriser

- les emails de fin de phase, la mémoire sémantique et les extensions "plus tard" ne doivent pas passer avant le coeur :
  - continuité réelle
  - visibilité de phase
  - détection des patterns
  - vérité d'accès unifiée

En revanche, `Zen` n'est plus à traiter comme une extension lointaine.
`Zen` devient l'évolution directe de `Aujourd'hui`.

---

## 5. Priorités, dans l'ordre

1. **Unifier la vérité d'accès**
   Le frontend et le backend doivent reposer sur la même source pour `invite`, `admin` et `subscription`. Tant que ce n'est pas le cas, la continuité produit reste fragile.

2. **Rendre la phase `Stratège` visible dans l'expérience**
   Le produit promet un basculement de posture. Le code l'a dans le prompt, mais l'utilisateur ne le ressent pas encore clairement.

3. **Ajouter une vraie lecture cross-sessions**
   Détecter ce qui revient, ce qui bloque, ce qui s'installe, puis le réinjecter dans le chat, le mapping et le rituel du jour.

4. **Faire du mapping un miroir de progression**
   Historique, persistance des schémas, évolution de l'ikigai, progression dans le parcours.

5. **Transformer `Aujourd'hui` en `Zen` sans perdre le runtime existant**
   Il faut conserver la continuité déjà branchée, puis la densifier en surface `Zen` :
   reprise, exercice adapté, ton plus apaisé, lien plus fort avec le journal.

6. **Renforcer la continuité `Chat -> Journal -> Zen`**
   Le chaînage existe déjà dans `Chat -> Journal -> Aujourd'hui`. Il faut maintenant le rendre plus lisible, plus dense et plus indispensable sous sa forme `Zen`.

7. **Supprimer les reliquats hybrides**
   Admin email legacy, logique invite locale, documentation contradictoire, reliquats legacy qui embrouillent les futurs agents.

8. **Traiter ensuite les extensions**
   `semantic_memory`, emails, sophistication avancée des surfaces, seulement après stabilisation du coeur.

---

## 6. Protocole documentaire obligatoire pour les IA

Cette section est la règle unique.
Toute IA qui travaille sur Noema doit suivre cet ordre de lecture puis cet ordre de mise à jour.

### 6.1 Ordre obligatoire de lecture

1. `MASTER.md`
   Vision finale consolidée, priorités, docs actives, arbitrages.

2. `PROJECT.md`
   État opérationnel réel du projet au moment où l'IA intervient.

3. `docs/system/README.md`
   Point d'entrée de la documentation système.

4. `docs/system/NOEMA_VISION.md`
   Vision produit structurée et exploitable.

5. `docs/system/NOEMA_VISION2.md`
   Notes fondatrices brutes de Nicolas.

6. `docs/system/NOEMA_SYSTEM_MAP.md`
   Cartographie réelle du codebase.

7. `docs/system/NOEMA_RUNTIME_GAPS.md`
   Écarts entre vision, docs et runtime.

8. `docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md`
   Orchestration réelle du coeur chat.

9. `docs/system/NOEMA_DATA_FLOW_MAP.md`
   Sources de vérité data et flux réels.

### 6.2 Docs utiles mais non obligatoires en première lecture

- `docs/system/NOEMA_ALIGNMENT_PLAN.md`
- `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`
- `docs/system/NOEMA_DOCUMENTATION_POLICY.md`
- `antigravity_idea.md`

Ces documents servent à :
- préparer une exécution
- cadrer un refactor
- enrichir la réflexion produit

Ils ne remplacent jamais les 9 lectures obligatoires ci-dessus.

### 6.3 Docs archives ou polluantes si lues comme vérité actuelle

- `ROADMAP.md`
- `DEBATE.md`
- `RETENTION.md`
- `codex.md`
- `docs/appshell-refactor-plan.md`

Règle :
- on peut les lire pour comprendre l'historique
- on ne les utilise jamais pour décider de l'état réel du projet

### 6.4 Ordre obligatoire de mise à jour quand une IA modifie le projet

1. `PROJECT.md`
   Toujours mettre à jour l'état réel si le projet a changé.

2. `MASTER.md`
   À mettre à jour dès qu'un arbitrage produit, une priorité, une vision ou une règle documentaire change.

3. `docs/system/NOEMA_SYSTEM_MAP.md`
   Si la structure réelle du code, des pages, des fonctions ou des vérités runtime change.

4. `docs/system/NOEMA_RUNTIME_GAPS.md`
   Si un écart est réduit, supprimé, déplacé ou nouvellement découvert.

5. `docs/system/NOEMA_VISION.md`
   Si la direction produit officielle change.

6. `docs/system/README.md`
   Si l'ordre de lecture ou le rôle des docs change.

7. `docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md`
   Si l'orchestration chat change.

8. `docs/system/NOEMA_DATA_FLOW_MAP.md`
   Si une source de vérité data change.

### 6.5 Résumé opérationnel

- pour comprendre : lire dans l'ordre 1 -> 9
- pour décider : s'appuyer d'abord sur `MASTER.md`, `PROJECT.md`, `NOEMA_SYSTEM_MAP.md`, `NOEMA_RUNTIME_GAPS.md`
- pour modifier : mettre à jour `PROJECT.md` puis `MASTER.md`, puis les docs système touchées
- ne jamais prendre `ROADMAP.md`, `DEBATE.md`, `RETENTION.md` ou `codex.md` comme source de vérité actuelle

---

## 7. Ce qu'on garde de `NOEMA_VISION2.md`

### À garder tel quel dans l'esprit produit

- Noema doit comprendre l'utilisateur en profondeur, pas seulement converser avec lui.
- Noema doit traiter les problèmes à la racine.
- Le chat reste le coeur du système.
- Le mapping reste central.
- L'ikigai reste une construction progressive majeure.
- Le parcours émotionnel `Perdu -> Guide -> Stratège` reste juste comme lecture vécue.
- La cible 18-35 ans perdue, saturée, en décalage avec sa vraie direction reste la bonne.
- Le journal doit nourrir la continuité.
- La future `Page Zen` est une bonne intuition produit.

### À garder mais en les reformulant

- Les 3 phases de `VISION2` sont gardées comme lecture émotionnelle.
- La structure officielle produit reste cependant :
  - `Voir`
  - `Comprendre`
  - `S'aligner`
  - `Agir`

- La `Page Zen` est gardée, mais pas comme une 5e surface ajoutée.
- Elle devient l'évolution directe de `Aujourd'hui`.

### À ne pas garder comme vérité actuelle

- Le modèle exact `7 jours gratuits puis débit auto`
- La règle `3 messages/jour`
- Le mail de fin de phase comme priorité immédiate
- La `Page Zen` générée automatiquement comme si elle existait déjà
- Le journal comme résumé structuré déjà branché en runtime

---

## 8. Ce qu'on modifie, dans l'ordre

### 1. Transformer `Aujourd'hui` en `Zen`

Objectif :
- garder la base réelle actuelle
- changer la surface, le ton et la fonction produit

On garde :
- `next_action`
- la reprise de session
- la preuve visible
- les stats d'impact
- le lien avec le journal

On ajoute :
- un exercice ou rituel adapté
- un ton plus calme et plus immersif
- une logique de recentrage, affirmation, méditation ou remise en question

### 2. Réinjecter le journal dans le chat

Objectif :
- faire en sorte que Noema reparte aussi de ce que l'utilisateur a écrit, pas seulement de la session chat

Effet attendu :
- continuité beaucoup plus forte
- sensation que Noema "sait vraiment"

### 3. Rendre la phase visible

Objectif :
- que l'utilisateur sente où il en est
- sans en faire une note scolaire

À faire :
- indicateur de phase discret
- atmosphère ou wording qui change selon la phase
- préparation du vrai passage visible au mode `Stratège`

### 4. Faire évoluer le mapping en miroir de progression

Objectif :
- sortir du simple état courant

À ajouter ensuite :
- schémas persistants
- évolution de l'ikigai
- blocages travaillés ou estompés
- lecture plus longitudinale

### 5. Renforcer la boucle `Chat -> Journal -> Zen`

Objectif :
- faire de Noema un système de continuité
- pas juste un bon chat avec mémoire

### 6. Nettoyer les vérités hybrides

À traiter en parallèle ou juste après :
- vérité invite frontend/backend
- admin email legacy
- docs historiques trop présentes

### 7. Garder pour plus tard

- `semantic_memory`
- mails de transition de phase
- sophistication avancée de `Zen`
- surcouches de design plus ambitieuses
