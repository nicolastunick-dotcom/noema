# NOEMA VISION — Modèle de transformation et feuille de route produit

Document d'orientation produit ancré dans le runtime réel.
Produit après lecture complète du codebase, des cartographies système et d'un débat architecture produit.

---

## 1. Ce que Noema est aujourd'hui (ancré dans le code)

Etat post-Sprint 8, 02/04/2026 :

**Coeur réel :**
- Un chat introspectif premium alimenté par Claude Sonnet (Anthropic)
- Un prompt Phase 1 / Phase 2 soigneusement construit (`src/constants/prompt.js`) qui demande à Noema de cartographier forces, blocages, contradictions, ikigai — fragment par fragment, session après session
- Une mémoire inter-sessions persistée dans Supabase (`memory`) chargée côté serveur
- Un Mapping vivant alimenté par le bloc `<_ui>` du modèle principal
- Un Journal branché sur `journal_entries` (lecture/écriture Supabase réelle)
- Un Today consommant `next_action` live + dernière entrée journal
- Un système d'essai gratuit (`trial`) et de preuve produit différentielle (`Nouveau` / `Confirme` / `Revient` / `A poursuivre`)
- Un billing Stripe réel (checkout, webhook, `subscriptions`)
- Un entitlement backend unique (`claude.js`) qui décide de l'accès

**Ce qui reste partiel ou à construire :**
- La Phase 2 (Le Stratège) est décrite dans le prompt mais l'UI ne l'incarne pas encore distinctement
- Le mapping n'a pas de moteur analytique autonome — il dépend entièrement du dernier flux chat
- Le Greffier est secondaire : il enrichit la mémoire et l'observabilité mais ne pilote pas le Mapping visible
- Aucune surface ne détecte explicitement les schémas répétitifs cross-sessions ni ne les ramène à l'utilisateur de façon proactive

---

## 2. La nature cible de Noema : un système de transformation, pas un chat avec mémoire

### Métaphore centrale

> "Tu ne peux pas faire pousser un arbre dans une terre morte."

Noema ne commence pas par pousser l'utilisateur vers ses étoiles.
Il commence par nettoyer le terrain.

Ce n'est pas une application de productivité. Ce n'est pas un journal avec IA.
C'est un système qui accompagne une transformation intérieure réelle :
1. Se comprendre vraiment (qui je suis, d'où viennent mes blocages)
2. Nettoyer ce qui obstrue (croyances, contradictions, comportements répétitifs)
3. Faire émerger une ambition réelle (ikigai vivant, direction claire)
4. Agir et réussir de façon mesurable (coaching d'alignement et d'action)

Cette logique est déjà dans le prompt. Elle n'est pas encore dans les surfaces.

---

## 3. Les 4 phases du parcours utilisateur

Ces phases ne sont pas rigides. Elles se superposent, reviennent, s'entremêlent.
Elles représentent la direction du travail, pas des étapes à cocher.

### Phase 1 — Voir
**Objectif :** clarification, prise de conscience, premiers schémas

Ce qui se passe :
- L'utilisateur commence à nommer ce qu'il ressent vraiment
- Les premières forces et blocages se dessinent
- Les contradictions commencent à apparaître (ce que je dis vs ce que je fais)
- L'ikigai se forme fragment par fragment (jamais complet en Phase 1)

Ce que Noema fait :
- Pose des questions. Ecoute. Accumule silencieusement.
- Ne révèle pas tout ce qu'il détecte — il attend le bon moment
- Cartographie : forces, blocages (racine / entretien / visible), contradictions, ikigai partiel

Indicateurs runtime déjà présents :
- `step` 0-3 dans le bloc `_ui`
- `etat: "exploring"` ou `"blocked"`
- `forces`, `blocages` partiels dans le mapping

### Phase 2 — Comprendre
**Objectif :** contradictions, croyances, comportements répétitifs, nettoyage

Ce qui se passe :
- Les schémas qui reviennent deviennent visibles
- Les croyances limitantes sont nommées (pas juste les symptômes, les racines)
- L'utilisateur comprend pourquoi il fait ce qu'il fait
- Un début de nettoyage se produit : ce qui était refoulé est intégré

Ce que Noema fait :
- Revient subtilement sur ce que l'utilisateur évite
- Confronte doucement les contradictions déjà détectées
- Relie les nouvelles sessions aux patterns identifiés avant
- Ne force pas la percée — il l'accompagne quand elle arrive naturellement

Indicateurs runtime à construire :
- Détection cross-sessions des thèmes récurrents
- Réinjection proactive des contradictions non résolues dans le prompt
- `step` 3-6 dans le bloc `_ui`
- `etat: "blocked"` suivi de `"clarity"` sur plusieurs sessions

### Phase 3 — S'aligner
**Objectif :** ikigai réel, ambition, direction

Ce qui se passe :
- L'ikigai est suffisamment complet pour être utilisable comme boussole
- L'utilisateur peut nommer ce qu'il veut vraiment (pas ce qu'il croit vouloir)
- Une direction claire émerge
- Les blocages principaux ont été travaillés suffisamment pour que l'action soit possible

Ce que Noema fait :
- Bascule en Phase 2 du prompt (Le Stratège) quand les conditions sont réunies
- Consolide l'ikigai avec la personne
- Définit une vision concrète, ancrée dans qui elle est vraiment
- Commence à parler de stratégie personnalisée

Indicateurs runtime déjà présents dans le prompt :
- Condition de basculement Phase 1 → Phase 2 : clarté + compréhension blocages + ikigai solide + énergie prête
- `step` 6-8
- `ikigai` complété sur les 5 dimensions

### Phase 4 — Agir
**Objectif :** coaching d'action, accountability, réussite mesurable

Ce qui se passe :
- Des défis concrets sont donnés à chaque session
- La session suivante vérifie ce qui a été fait
- Les résistances qui émergent face à l'action sont traitées immédiatement
- La progression devient mesurable

Ce que Noema fait :
- Coach d'alignement et de réussite — pas un consultant froid
- Donne des défis ancrés dans l'ikigai réel et les forces réelles
- Confronte sans juger les résistances à l'action
- Ajuste la stratégie quand de nouveaux blocages émergent

Indicateurs runtime déjà présents dans le prompt :
- `next_action` à chaque session (la tâche concrète)
- Vérification début de session Phase 2 : "les blocages sont-ils vraiment intégrés ?"
- `step` 8-10

---

## 4. Le rôle central du mapping

Le mapping n'est pas une visualisation secondaire.
C'est la représentation évolutive du cerveau de l'utilisateur.

Il contient aujourd'hui (runtime réel) :
- `forces` — les forces réelles détectées, pas celles déclarées
- `blocages` : `racine` / `entretien` / `visible` — les 3 niveaux
- `contradictions` — les écarts détectés entre discours et comportement
- `ikigai` : `aime` / `excelle` / `monde` / `paie` / `mission` — construit progressivement
- `step` — position dans le parcours (0 à 10)
- `etat` — état détecté de l'utilisateur à l'instant

Ce qui manque pour en faire un vrai miroir de progression :
- Détection des **comportements répétitifs** cross-sessions (même blocage qui revient)
- Représentation du **niveau d'énergie** au fil du temps
- Cartographie du **rapport aux autres** (ce qui émerge souvent dans les contradictions)
- Un **ikigai évolutif** visible sur plusieurs sessions (pas juste l'état courant)
- Les **schémas persistants** : qu'est-ce qui revient depuis 3 sessions sans être résolu ?

---

## 5. Le rôle du chat comme guide évolutif

Le chat n'est pas une interface de messagerie. C'est l'espace principal de transformation.

Ce qu'il fait déjà :
- Guide Phase 1 : exploration, cartographie silencieuse, questions profondes
- Guide Phase 2 : stratégie personnalisée, défis concrets, confrontation douce
- Mémoire inter-sessions : Noema se souvient et compare l'évolution
- `session_note` : 2-3 points clés qui alimentent la continuité
- `next_action` : une tâche concrète transmise au Journal et à Today

Ce qu'il ne fait pas encore :
- Revenir proactivement sur ce que l'utilisateur évite depuis plusieurs sessions
- Signaler explicitement un schéma répétitif (sans attendre que l'utilisateur en parle)
- Adapter son niveau d'intensité selon l'état détecté sur plusieurs sessions (pas seulement la session courante)
- Proposer un "check-in" en début de session basé sur la `next_action` précédente

---

## 6. Ce qui est déjà là

| Capacité | Etat |
|---|---|
| Guide Phase 1 (exploration, questions, cartographie) | réel |
| Guide Phase 2 (stratège, défis, accountability) | dans le prompt, UI partielle |
| Mémoire inter-sessions (forces, blocages, contradictions, ikigai, step) | réel |
| Mapping vivant alimenté par le chat | réel |
| `next_action` transmis au Journal et Today | réel |
| Journal persisté dans Supabase | réel |
| Today consommant les données réelles | réel |
| Preuve produit différentielle (Nouveau / Confirme / Revient) | réel |
| Trial layer (essai gratuit) | réel |
| Billing Stripe + entitlement backend | réel |

---

## 7. Ce qui manque, dans l'ordre de priorité produit

### Priorité 1 — Faire que Phase 2 existe vraiment dans l'UI

Le prompt décrit la Phase 2 (Le Stratège) avec précision.
L'UI ne la distingue pas encore : pas de signal visuel, pas de changement de posture perceptible.

Ce que ça demande (sans refactor coeur) :
- Ajouter un indicateur Phase 1 / Phase 2 dans le Mapping et/ou la barre de navigation
- Adapter le wording du chat (ton, CTA) selon la phase détectée (`step` >= 7 environ)
- Montrer explicitement à l'utilisateur qu'il a basculé en mode "construction"

### Priorité 2 — Ramener les patterns cross-sessions à la surface

Aujourd'hui la mémoire est injectée dans le prompt côté serveur.
Mais rien ne détecte explicitement "ce blocage revient depuis 3 sessions" et ne le ramène à l'utilisateur.

Ce que ça demande :
- Une logique dans `buildServerMemoryContext` ou dans `claude.js` qui analyse les `session_notes` historiques et les contradictions persistantes
- Ou : une requête sur `sessions.session_note` pour identifier les thèmes récurrents avant de construire le prompt
- Pas de nouveau modèle LLM nécessaire : c'est de la logique de contexte

### Priorité 3 — Mapping comme miroir de progression (pas juste état courant)

Le Mapping affiche l'état actuel. Il ne montre pas l'évolution.

Ce que ça demande :
- Une timeline simple dans MappingPage : `step` au fil des sessions
- Un indicateur "schéma persistant" pour les blocages qui reviennent
- Un ikigai avec indication de "dernière mise à jour" par dimension

### Priorité 4 — Check-in de session basé sur `next_action` précédente

Aujourd'hui Noema commence chaque session en reprenant le contexte mémoire.
Mais il ne vérifie pas explicitement "as-tu fait ce que je t'avais demandé ?"

Ce que ça demande :
- Une modification du prompt d'ouverture (ou de l'`openingMessage`) qui reprend le `next_action` de la session précédente
- Pas de backend nouveau : `next_action` est déjà dans `sessions` et réinjecté dans la mémoire

### Priorité 5 — Semantic memory pour la détection de patterns longs

`semantic_memory` est dans le schéma mais non branchée.
Ce sera utile pour détecter des patterns fins sur de nombreuses sessions.
Mais c'est à construire après les priorités 1-4.

---

## 8. Ce qui peut être transformé sans reconstruire

Ces évolutions ne nécessitent ni refactor coeur, ni nouvelles tables, ni nouveaux LLM :

1. **Prompt d'ouverture avec vérification `next_action`** : modifier `openingMessage()` dans AppShell pour inclure `next_action` précédent dans le premier message système. Zéro migration SQL.

2. **Indicateur Phase 1 / Phase 2 visible** : dériver de `step` >= 7 dans le Mapping ou le header de l'app. Zéro backend.

3. **Session notes cross-sessions dans le contexte** : modifier `buildServerMemoryContext` dans `claude.js` pour charger les 3-5 dernières `session_notes` (déjà dans `sessions`) et les inclure dans le prompt système. Une requête SQL supplémentaire, zéro migration.

4. **Schémas récurrents signalés** : compter en SQL les blocages qui apparaissent dans plusieurs `sessions.insights` successives, les intégrer dans le contexte mémoire. Pas de nouveau LLM.

---

## 9. Ce qu'il ne faut pas faire maintenant

- Ne pas construire `semantic_memory` avant que les priorités 1-4 soient stables
- Ne pas gamifier le parcours (streaks, scores, niveaux) — ça contredit la nature du produit
- Ne pas forcer le basculement Phase 1 / Phase 2 — le prompt dit déjà "tu ne forces jamais ce basculement"
- Ne pas multiplier les surfaces produit avant que le coeur chat soit plus profond
- Ne pas ajouter de résumés LLM supplémentaires sur Journal ou Today — le produit est déjà coûteux en tokens

---

## Annexe — Ancrage dans le runtime réel

Fichiers sources pour chaque affirmation de ce document :

| Affirmation | Source |
|---|---|
| Guide Phase 1 / Phase 2 avec ordre de travail | `src/constants/prompt.js:1-54` |
| Condition de basculement Phase 1 → Phase 2 | `src/constants/prompt.js:27-30` |
| Bloc `_ui` avec `step`, `forces`, `blocages`, `contradictions`, `ikigai`, `session_note`, `next_action` | `src/constants/prompt.js:98-131` |
| Mémoire enrichie côté serveur | `netlify/functions/claude.js` + `src/lib/supabase.js` |
| Journal persisté dans `journal_entries` | `src/pages/JournalPage.jsx:74-80` |
| Today consommant `next_action` live + dernière session | `src/pages/TodayPage.jsx:49-87` |
| Greffier secondaire, non pilote du Mapping | `docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| `sessions` = snapshots, pas session live | `docs/system/NOEMA_ALIGNMENT_PLAN.md:§Memory vs Sessions` |
