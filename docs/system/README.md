# Documentation système Noema

Ce dossier est la **source de vérité documentaire technique du projet**.

Il est destiné aux humains et aux agents IA.
Toute modification structurelle du projet doit entraîner la mise à jour des documents concernés ici.

---

## Ordre de lecture recommandé

Pour comprendre Noema en 5 minutes :

1. [NOEMA_SYSTEM_MAP.md](NOEMA_SYSTEM_MAP.md) — structure globale du codebase réel
2. [NOEMA_VISION.md](NOEMA_VISION.md) — nature cible de Noema, 4 phases, ce qui est là vs ce qui manque
3. [NOEMA_CHAT_ORCHESTRATION_MAP.md](NOEMA_CHAT_ORCHESTRATION_MAP.md) — moteur conversationnel (AppShell → claude.js → Greffier → Supabase)
4. [NOEMA_DATA_FLOW_MAP.md](NOEMA_DATA_FLOW_MAP.md) — flux de données réels (tables, lectures, écritures, vérités d'accès)
5. [NOEMA_RUNTIME_GAPS.md](NOEMA_RUNTIME_GAPS.md) — écarts entre vision produit et runtime réel
6. [NOEMA_ALIGNMENT_PLAN.md](NOEMA_ALIGNMENT_PLAN.md) — décisions d'alignement système
7. [NOEMA_ALIGNMENT_EXECUTION_PLAN.md](NOEMA_ALIGNMENT_EXECUTION_PLAN.md) — plan d'implémentation séquencé, sprint par sprint (inclut Sprint 9-13)

---

## Rôle de chaque document

| Document | Rôle |
|---|---|
| `NOEMA_SYSTEM_MAP.md` | Cartographie structurelle, fonctionnelle et produit — pages, fonctions, tables, état réel vs mocké |
| `NOEMA_VISION.md` | Nature cible de Noema — 4 phases du parcours, rôle du mapping, ce qui est déjà là, ce qui manque, dans quel ordre aller |
| `NOEMA_CHAT_ORCHESTRATION_MAP.md` | Flux complet du chat : frontend → AppShell → claude.js → Anthropic → Greffier → Supabase → UI |
| `NOEMA_DATA_FLOW_MAP.md` | Tables Supabase, qui lit quoi, qui écrit quoi, sources de vérité par domaine |
| `NOEMA_RUNTIME_GAPS.md` | Désalignements entre prompts, UI, schéma, code et documentation — ce qui est branché vs mocké vs legacy |
| `NOEMA_ALIGNMENT_PLAN.md` | Décisions prises pour unifier les vérités système avant automatisation et scaling |
| `NOEMA_ALIGNMENT_EXECUTION_PLAN.md` | Plan d'exécution sprint par sprint avec ordre exact, fichiers impactés, tests et risques |

---

## Règle documentaire

Voir [NOEMA_DOCUMENTATION_POLICY.md](NOEMA_DOCUMENTATION_POLICY.md) pour le process complet.

**Résumé** : toute modification touchant l'architecture, l'accès, les quotas, le prompt, l'état `_ui`, le Greffier, le mapping, la mémoire, les sessions, le billing, Journal, Today ou une table Supabase doit être accompagnée d'une mise à jour des documents concernés dans ce dossier.
