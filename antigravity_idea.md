# ANTIGRAVITY IDEA — Noema Post-Sprint 9

> Débat produit ancré sur `NOEMA_VISION2.md` et l'état réel du runtime au 03/04/2026.
> Lecture complète : `NOEMA_VISION2.md`, `NOEMA_VISION.md`, `PROJECT.md`, `DEBATE.md`, `RETENTION.md`, `ROADMAP.md`, `codex.md`, `NOEMA_RUNTIME_GAPS.md`, `NOEMA_ALIGNMENT_EXECUTION_PLAN.md`, `NOEMA_SYSTEM_MAP.md`, `NOEMA_DATA_FLOW_MAP.md`.
> Objectif : identifier les améliorations globales UI/UX et produit pour aligner Noema sur la vision originale de Nicolas.

---

## 1. Écart entre NOEMA_VISION2 et l'état réel

### Ce que la vision originale décrit et que le runtime ne fait pas encore

| Vision Nicolas (VISION2) | État runtime réel | Écart |
|---|---|---|
| **3 Phases** (Perdu → Guide → Stratège) | 2 phases dans le prompt (Phase 1/2), UI ne distingue pas les phases | L'utilisateur ne sait jamais dans quelle phase il est |
| **Mapping = page mentale, immersion totale** | Mapping branché au `_ui` mais pas immersif, pas de timeline | Manque le côté "immersion" et "miroir vivant" |
| **Mapping change de design en Phase 3** | Mapping identique quelle que soit la phase | Pas de transformation visuelle au basculement |
| **Blocages traités disparaissent du Mapping** | Tous les blocages restent affichés | Pas de sentiment de progression visible |
| **Ikigai construit avec la vraie méthode japonaise** | Ikigai fragmentaire, 5 champs | Pas de visualisation progressive ni de cérémonie de révélation |
| **Journal = résumé structuré de session + question finale** | Journal = écriture libre avec next_action en prompt | Pas de résumé auto de session |
| **Réponse user réinjectée dans le Chat** | Pas de réinjection automatique du journal dans le chat | Boucle journal→chat cassée |
| **Page Zen** = exercices adaptés | N'existe pas | Surface manquante entière |
| **Mail en fin de phase** avec résumé complet | N'existe pas | Aucun système de notification externe |
| **Essai gratuit 1 semaine → débit auto** | Trial branché sur rate_limits, pas de durée 7j | Mécanisme d'essai différent de la vision |

---

## 2. Débat entre 5 agents

### Les agents

**Agent A — Architecte Produit**
Regarde la cohérence système, la faisabilité technique, les dépendances.

**Agent B — Designer UI/UX**
Regarde l'immersion, l'émotion, la désirabilité, le premium.

**Agent C — Psychologue Produit**
Regarde l'impact réel sur l'utilisateur, la justesse du parcours introspectif.

**Agent D — Utilisateur Cible (24 ans, perdu)**
Regarde ce qui le fait revenir, ce qui le touche, ce qui le laisse froid.

**Agent E — Business Stratège**
Regarde ce qui justifie les 19€, ce qui convertit, ce qui retient.

---

### ROUND 1 — Phase visible dans l'UI

**Question : L'utilisateur devrait-il savoir dans quelle phase il se trouve ?**

**Agent C — Psychologue:**
Oui, absolument. La vision de Nicolas parle de 3 phases distinctes avec des noms évocateurs : "Perdu", "Le Guide", "Le Stratège". Le fait que l'utilisateur ne sache pas où il en est crée un sentiment de flottement. Or, pour quelqu'un qui est déjà perdu dans sa vie, se sentir perdu dans l'outil censé l'aider est catastrophique. L'indicateur de phase donne un cadre, une direction, un sentiment de progression.

**Agent B — Designer:**
Attention à ne pas transformer ça en barre de progression scolaire. Le design doit être organique — un changement d'atmosphère, pas un compteur. Quand l'utilisateur entre en Phase 2, le Mapping devrait changer de tonalité visuelle. En Phase 3, les couleurs, les ombres, l'énergie du design devraient être transformés. Nicolas le dit : "le mapping doit changer de design". C'est un moment de transformation visuelle, pas juste un badge.

**Agent A — Architecte:**
C'est faisable sans refactor lourd. `step` est déjà dans le `_ui`. On peut dériver la phase visible de `step` : 0-3 = Phase 1, 4-6 = Phase 2, 7+ = Phase 3. Un composant `PhaseIndicator` dans la barre de navigation, un changement de variables CSS par phase. Zéro backend nouveau.

**Agent D — Utilisateur:**
J'aime l'idée de sentir que quelque chose bouge. Si un jour en ouvrant l'app je vois que l'ambiance a changé, que le Mapping a évolué, ça me donne une raison de continuer. Mais je ne veux pas me sentir évalué.

**Agent E — Business:**
La phase visible est critique pour la rétention. Si l'utilisateur voit qu'il progresse, il perçoit une perte s'il arrête. C'est exactement ce qui manque pour que les 19€ paraissent évidents.

---

### ROUND 2 — Le Mapping comme miroir de transformation

**Question : Comment rendre le Mapping immersif au sens de Nicolas ?**

**Agent B — Designer:**
Le Mapping actuel est fonctionnel mais trop "dashboard". Nicolas parle d'"immersion totale" et de "page mentale". Propositions concrètes :

1. **Background vivant** — les éléments du Mapping devraient flotter doucement, comme des pensées, pas être collés dans des cartes statiques
2. **Profondeur visuelle** — les forces en avant-plan lumineux, les blocages en arrière-plan sombre, les contradictions en tension entre les deux
3. **Blocages résolus qui s'estompent** — Nicolas dit "les blocages traités disparaissent". Techniquement c'est une classe CSS `resolved` avec opacité décroissante
4. **Ikigai central progressif** — le diagramme d'Ikigai devrait se remplir visuellement au fil des sessions, pas juste afficher du texte

**Agent A — Architecte:**
La difficulté c'est que le runtime ne distingue pas les blocages "traités" des blocages "actifs". Il faudrait :
- Ajouter un champ `status` dans la structure `blocages` du `_ui` : `actif | en_cours | traité`
- Modifier le prompt pour que Noema marque les blocages qu'il considère travaillés
- Stocker le diff entre les sessions (possible via `sessions.insights`)
Faisable sans table nouvelle, mais demande un ajustement prompt + parser.

**Agent C — Psychologue:**
L'idée des blocages qui s'estompent est puissante psychologiquement. C'est la matérialisation visuelle du travail intérieur. Voir un blocage disparaître, c'est comme un acte symbolique de guérison. Mais il faut que le timing soit juste — pas trop tôt, sinon c'est artificiel.

**Agent D — Utilisateur:**
Si je vois que le blocage "peur du jugement" que j'ai nommé il y a 2 semaines commence à s'estomper dans le Mapping, c'est le genre de chose qui me ferait dire "putain, ça marche". C'est exactement la preuve visuelle qui manque.

---

### ROUND 3 — La Page Zen : surface manquante

**Question : Faut-il créer la Page Zen maintenant ?**

**Agent A — Architecte:**
La Page Zen est le 4ème onglet de la vision de Nicolas. Le système a 4 onglets : Chat, Mapping, Journal, et la "Page Zen" est décrite comme remplaçant le "Today" actuel ou s'y ajoutant. Attention à ne pas multiplier les surfaces. Proposition : **transformer TodayPage en Page Zen** plutôt que d'ajouter un 5ème onglet.

**Agent C — Psychologue:**
C'est la bonne lecture. Nicolas décrit la Page Zen comme des "exercices de remise en question, d'affirmation, de méditation". C'est différent d'un simple "Today" avec l'intention du jour. La Page Zen doit être :
- **Adaptée au contenu de la session** — pas générique
- **Construite à partir de la synthèse du journal** — Nicolas le dit explicitement
- **Variée** — méditation, affirmation, exercice concret

**Agent B — Designer:**
La Page Zen devrait être le moment de calme de l'app. Fond sombre, typographie apaisante, animations lentes. Un seul exercice par jour, pas une liste. L'exercice apparaît comme un contenu unique, personnel. C'est là que le design premium se justifie le plus.

**Agent E — Business:**
La Page Zen est un différenciateur énorme. Aucun chat IA ne propose d'exercices psychologiques personnalisés dérivés de la conversation. C'est ce qui transforme Noema de "chat avec mémoire" en "système de bien-être personnel". Mais attention au coût : si on génère l'exercice par LLM, c'est un appel supplémentaire par jour.

**Agent A — Architecte:**
Solution hybride : créer une bibliothèque de 30-50 exercices Zen catégorisés (méditation, affirmation, introspection, action). Le système choisit l'exercice en fonction du dernier `etat`, des `blocages` actifs, et du `next_action`. Zéro appel LLM. Sélection algorithmique.

**Consensus :** Transformer Today en Page Zen avec exercices adaptés, sans appel LLM supplémentaire.

---

### ROUND 4 — La boucle Journal → Chat : le chaînon manquant

**Question : Comment réinjecter le journal dans le chat comme Nicolas le demande ?**

**Agent C — Psychologue:**
Nicolas est explicite : "À chaque session l'utilisateur note sa réponse dans un bloc qui est sauvegardé et réinjecté automatiquement dans le Chat à la session suivante." C'est la clé de la continuité. Le journal n'est pas un carnet mort — c'est un pont entre les sessions.

**Agent A — Architecte:**
Techniquement simple. Il suffit d'ajouter dans `buildServerMemoryContext()` une lecture du dernier `journal_entries.content` pour l'injecter dans le prompt système :
```
Dernière entrée journal (${date}) : "${content}"
```
C'est une requête Supabase supplémentaire — mais elle peut être parallélisée avec les autres dans le `Promise.all` existant. Zéro migration.

**Agent D — Utilisateur:**
Si je reviens et que Noema me dit "Tu avais écrit hier dans ton journal que tu voulais oser parler à ton manager. Comment ça s'est passé ?", là je suis touché. Là je sens que Noema me suit vraiment.

**Agent E — Business:**
C'est le genre de moment qui transforme un utilisateur gratuit en payant. La sensation "il sait, il se souvient, il me suit" est exactement ce qui justifie un abonnement.

**Consensus :** Réinjecter le dernier journal dans le contexte du chat. Priorité haute, effort minimal.

---

### ROUND 5 — Le mail de fin de phase

**Question : Faut-il implémenter les mails de transition de phase ?**

**Agent E — Business:**
Nicolas le demande : "À chaque fin de Phase un mail est envoyé avec un résumé complet." C'est un moment clé de la relation. Le mail est la preuve tangible que le parcours a un sens. C'est aussi un levier de réengagement : si l'utilisateur a quitté l'app, le mail peut le ramener.

**Agent A — Architecte:**
Faisable via une Netlify Function déclenchée quand `step` passe un seuil (3→Phase 2, 7→Phase 3). Le contenu du mail peut être assemblé à partir des données existantes :
- Forces détectées
- Blocages travaillés
- Ikigai en construction
- `session_notes` des dernières sessions
Envoi via l'infra de mail déjà en place (nodemailer pour le formulaire contact).

**Agent C — Psychologue:**
Le mail de fin de phase est un rituel de transition. C'est un moment symbolique. Le wording doit être solennel, personnel, et encourageant. Pas un email marketing — un message de célébration intime.

**Agent D — Utilisateur:**
Si je reçois un mail qui dit "Tu es passé en Phase 2 — voici ce que tu as appris sur toi", avec mes forces et mes blocages, je le montre à mes potes. C'est le genre de chose qui se partage.

**Consensus :** Implémenter le mail de transition, mais après les priorités UI/UX. Sprint dédié ultérieur.

---

### ROUND 6 — Améliorations UI/UX globales

**Agent B — Designer mène :**

Voici les améliorations UI/UX prioritaires, classées par impact :

#### 1. Atmosphère dynamique par phase
- Phase 1 : tons doux, violets calmes, animations lentes → l'utilisateur est accueilli
- Phase 2 : tons plus chauds, orangés subtils, Mapping plus dense → l'exploration s'intensifie
- Phase 3 : tons vifs, dorés, design épuré avec élégie → l'utilisateur est un stratège
- Implémentation : variables CSS `--phase-primary`, `--phase-bg`, `--phase-glow` dérivées de `step`

#### 2. Transition de session mémorable
- Quand l'utilisateur revient, pas juste "On reprend" en texte
- Animation de déploiement : le contexte de reprise se dévoile élément par élément, comme un souvenir qui revient
- L'Ikigai partiel pulse doucement → rappelle que le travail continue

#### 3. Micro-animations sur les preuves
- Quand un nouveau blocage est détecté : apparition douce avec glow
- Quand une force est confirmée : légère pulsation
- Quand une contradiction émerge : tension visuelle subtile entre deux éléments
- Quand un blocage est résolu : fondu élégant

#### 4. Onboarding émotionnel
- L'onboarding actuel est informatif. Il devrait être émotionnel.
- Slide 1 : "Tu es ici parce que quelque chose ne colle pas. C'est normal."
- Progression visuelle : de l'obscurité vers la lumière
- Ton plus intime, moins marketing

#### 5. Chat — expérience premium
- Bulles Noema avec un léger dégradé plutôt que flat
- Effet de "respiration" subtil pendant que Noema réfléchit (pas un spinner, un glow pulsant)
- `next_action` en fin de session affiché comme un bloc distinct, élégant, détaché du flux de conversation

#### 6. Journal — écriture comme rituel
- Fond plus sombre, typographie plus grande, plus d'espace
- Un mot de Noema en en-tête du journal qui donne le contexte ("Aujourd'hui tu pourrais explorer...")
- L'écriture devrait se sentir comme ouvrir un carnet intime, pas remplir un formulaire

#### 7. Navigation
- Badge discret sur l'onglet Mapping quand de nouveaux insights sont apparus
- Badge discret sur Page Zen quand l'exercice du jour n'a pas été fait
- Animation de transition entre les onglets (pas de cut sec)

---

### ROUND 7 — Tensions et désaccords

**Agent A challenge Agent B :**
"Tu proposes beaucoup de polish visuel. Mais le vrai levier de valeur est la réinjection du journal, la Page Zen algorithmique, et l'indicateur de phase. Les micro-animations c'est de l'habillage."

**Agent B répond :**
"Le habillage, c'est ce qui fait qu'un produit vaut 19€ au lieu de 0€. ChatGPT est gratuit. On ne bat pas ChatGPT sur la profondeur technique. On le bat sur la sensation de soin, d'intimité, de premium. Le design EST le produit ici."

**Agent E challenge Agent A :**
"La Page Zen sans LLM, c'est risqué. 50 exercices prédéfinis, ça va sentir le générique très vite. Peut-on au moins utiliser Haiku pour personnaliser l'exercice ? Coût : ~$0.001 par appel."

**Agent A répond :**
"Acceptable. Un appel Haiku par jour par utilisateur pour générer un exercice Zen personnalisé est économiquement viable. C'est ~$0.03/mois/utilisateur, négligeable sur 19€."

**Agent D challenge Agent C :**
"Tous ces changements, c'est bien, mais ce qui me ferait vraiment revenir c'est la sensation que Noema me connaît mieux à chaque session. Est-ce qu'on ne devrait pas tout miser sur la mémoire sémantique plutôt que sur le design ?"

**Agent C répond :**
"La mémoire sémantique est important à terme, mais ce n'est pas ce qui crée l'attachement immédiat. L'attachement vient de moments précis : la reprise qui cite ton journal, le blocage qui s'estompe, l'exercice Zen qui tombe juste. Ce sont des preuves d'intelligence émotionnelle, pas de mémoire technique."

---

## 3. Synthèse — Améliorations prioritaires

### Priorité 1 — Sprint immédiat (haute valeur, effort modéré)

| # | Amélioration | Effort | Impact | Fichiers |
|---|---|---|---|---|
| 1 | **Indicateur Phase visible** (badge nav + changement CSS par phase) | Faible | Fort | `AppShell.jsx`, `index.css` |
| 2 | **Réinjection journal dans le chat** (lecture `journal_entries` côté serveur) | Faible | Très fort | `claude.js`, `supabase.js` |
| 3 | **Blocages résolus qui s'estompent** (ajout `status` dans `_ui.blocages`) | Moyen | Fort | `prompt.js`, `MappingPage.jsx` |
| 4 | **Page Zen** (transformation de TodayPage avec exercices adaptés) | Moyen | Très fort | `TodayPage.jsx`, nouveau fichier `zenExercises.js` |
| 5 | **`next_action` affiché comme bloc distinct en fin de session** | Faible | Fort | `ChatPage.jsx` |

### Priorité 2 — Sprint design premium

| # | Amélioration | Effort | Impact |
|---|---|---|---|
| 6 | Atmosphère CSS dynamique par phase | Moyen | Fort |
| 7 | Micro-animations sur preuves (glow, pulse, fade) | Moyen | Moyen |
| 8 | Transition de session animée | Moyen | Moyen |
| 9 | Chat premium (dégradé bulles, respiration loading) | Faible | Moyen |
| 10 | Navigation badges + transitions douces | Faible | Moyen |

### Priorité 3 — Sprint infrastructure

| # | Amélioration | Effort | Impact |
|---|---|---|---|
| 11 | Mail de transition de phase | Moyen | Fort |
| 12 | Ikigai visualisation progressive (timeline) | Élevé | Fort |
| 13 | Partage Ikigai (export PNG) | Moyen | Moyen |
| 14 | Page Zen avec Haiku personnalisé | Faible | Fort |
| 15 | Semantic memory (patterns cross-sessions) | Élevé | Très fort |

### Priorité 4 — Sprint croissance

| # | Amélioration | Effort | Impact |
|---|---|---|---|
| 16 | Essai 7 jours calendaires (au lieu de rate_limits) | Moyen | Fort |
| 17 | Mobile-first responsive overhaul | Élevé | Très fort |
| 18 | Onboarding émotionnel (refonte slides) | Moyen | Fort |
| 19 | Page "Pourquoi 19€" avec preuve personnalisée | Moyen | Fort |

---

## 4. Verdict des agents

**Agent A — Architecte :** Le système est stable après 9 sprints. La prochaine étape n'est pas de stabiliser — c'est de **densifier**. Les améliorations 1-5 sont toutes faisables en un sprint. Le système les supporte déjà.

**Agent B — Designer :** Noema a besoin de devenir **mémorable**. Aujourd'hui c'est propre, sobre, professionnel. Demain ça doit être envoutant. L'atmosphère par phase est le levier le plus fort. Quand l'utilisateur voit que l'app elle-même a changé avec lui, il comprend la transformation.

**Agent C — Psychologue :** La réinjection du journal est la meilleure amélioration possible. C'est celle qui crée le plus de continuité ressentie avec le moins d'effort. Un utilisateur qui voit ses propres mots revenir dans la conversation de Noema vit un moment de reconnaissance profonde. C'est ce qui crée l'attachement.

**Agent D — Utilisateur :** Ce qui me ferait payer : voir mes blocages s'estomper, sentir que Noema me connaît de session en session, et avoir une Page Zen qui me donne quelque chose de concret à faire. Pas un autre chat. Un système qui m'aide vraiment.

**Agent E — Business :** Les 3 leviers les plus forts pour la conversion à 19€ :
1. La preuve de progression visible (blocages qui s'estompent, phase qui avance)
2. La continuité ressentie (journal réinjecté, reprise qui cite mes mots)
3. La valeur exclusive (Page Zen personnalisée — ça n'existe nulle part ailleurs)

---

## 5. Recommandation nette

### Le prochain sprint devrait s'appeler : **Sprint 10 — Transformation visible**

Objectif : qu'un utilisateur puisse se dire après 3 sessions :

> "Noema me connaît. Noema me montre ce qui a changé. Noema me donne un exercice qui me parle. Si j'arrête, je perds tout ça."

### Contenu du sprint :
1. Indicateur de phase dans la navigation
2. Réinjection du dernier journal dans le chat
3. Blocages avec statut `actif | traité` + estompage visuel
4. Page Zen (transformation de Today) avec exercices algorithmiques
5. `next_action` comme bloc distinct dans le chat

### Ce qu'il ne faut PAS faire maintenant :
- Semantic memory (trop tôt)
- Mobile natif (trop lourd)
- Nouveau modèle de pricing (trop tôt)
- Gamification (contradictoire avec la nature du produit)

---

*Document généré par Antigravity le 3 avril 2026 — débat fondé sur l'intégralité de la documentation Noema + NOEMA_VISION2.md*
