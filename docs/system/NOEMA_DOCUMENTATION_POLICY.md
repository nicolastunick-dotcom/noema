# NOEMA — Politique documentaire

## Objectif

Garantir que le projet reste compréhensible, fiable et pilotable par IA à tout moment.

Un document à jour vaut mieux qu'une analyse laborieuse du code. Un désalignement entre la doc et le runtime est une dette cognitive qui coûte du temps à chaque agent et chaque développeur.

---

## Règle principale

**Toute évolution du système doit mettre à jour la documentation concernée dans le même run.**

Pas de PR ouverte sans docs à jour si un domaine listé ci-dessous est touché.

---

## Domaines à surveiller

Chaque modification touchant l'un de ces domaines déclenche une obligation documentaire :

| Domaine | Documents concernés |
|---|---|
| Architecture générale (pages, routes, fonctions) | `NOEMA_SYSTEM_MAP.md` |
| Accès / auth / invites / paywall | `NOEMA_SYSTEM_MAP.md`, `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_RUNTIME_GAPS.md` |
| Quotas (rate_limits, compteurs) | `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| Prompt principal (`prompt.js`) | `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_RUNTIME_GAPS.md` |
| État UI (`_ui`, `applyUI`, `parseUI`) | `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_RUNTIME_GAPS.md` |
| Greffier (`greffier.js`) | `NOEMA_CHAT_ORCHESTRATION_MAP.md`, `NOEMA_RUNTIME_GAPS.md` |
| Mapping (forces, blocages, ikigai) | `NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| Mémoire inter-sessions (`memory`) | `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| Sessions (live / snapshot) | `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| Billing / Stripe / `subscriptions` | `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_SYSTEM_MAP.md` |
| Journal / Today | `NOEMA_SYSTEM_MAP.md`, `NOEMA_RUNTIME_GAPS.md` |
| Tables Supabase | `NOEMA_DATA_FLOW_MAP.md`, `NOEMA_SYSTEM_MAP.md` |

---

## Process obligatoire

À chaque modification d'un domaine ci-dessus :

1. **Identifier** les documents impactés dans le tableau ci-dessus
2. **Mettre à jour** ces documents dans le même run (pas après)
3. **Mettre à jour** `PROJECT.md` : journal des tâches + section Documentation système si un nouveau document est créé
4. **Expliquer le motif** dans le journal : pourquoi ce changement, qu'est-ce qui change

---

## Quelle section modifier dans quel document

| Type de changement | Document |
|---|---|
| Nouvelle page, nouvelle fonction, nouvelle table | `NOEMA_SYSTEM_MAP.md` |
| Changement de flux runtime (appel, ordre, logique) | `NOEMA_DATA_FLOW_MAP.md` ou `NOEMA_CHAT_ORCHESTRATION_MAP.md` |
| Découverte ou résolution d'une incohérence | `NOEMA_RUNTIME_GAPS.md` |
| Décision d'architecture ou de design | `NOEMA_ALIGNMENT_PLAN.md` |
| Ajout d'une étape au plan d'implémentation | `NOEMA_ALIGNMENT_EXECUTION_PLAN.md` |

---

## Gestion du legacy

- Tout fichier non utilisé dans le runtime actuel doit être **marqué `legacy`** dans sa doc de référence
- Un fichier legacy n'est jamais supprimé sans vérification explicite qu'aucun code vivant ne s'y réfère
- Ne jamais laisser une IA deviner à partir de code obsolète : indiquer explicitement `mort / legacy` dans `NOEMA_SYSTEM_MAP.md`

Fichiers actuellement identifiés comme legacy ou partiels :
- `src/App.original.jsx` — legacy, pas branché dans le runtime
- `src/constants/prompt-greffier.js` — potentiellement redondant, à valider
- `src/pages/JournalPage.jsx` — surface mockée, pas de persistance réelle
- `src/pages/TodayPage.jsx` — surface mockée, pas de persistance réelle

---

## Règle de cohérence

Avant de lancer une modification :

1. Lire `docs/system/README.md` pour situer le domaine
2. Lire le(s) document(s) concerné(s) pour comprendre l'état actuel
3. Modifier le code
4. Mettre à jour les docs dans la foulée

**Ne jamais modifier le code sans avoir lu la doc correspondante.**
**Ne jamais fermer un run sans avoir mis à jour la doc si un domaine listé est touché.**
