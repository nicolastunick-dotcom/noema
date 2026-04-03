# Documentation système Noema

Ce dossier est la **source de vérité documentaire technique du projet**.

Il est destiné aux humains et aux agents IA.
Toute modification structurelle du projet doit entraîner la mise à jour des documents concernés ici.

---

## Ordre de lecture recommandé

Le protocole documentaire obligatoire global est défini dans [`MASTER.md`](/Users/nicolas/Projects/Noema/noema-project/MASTER.md), section `6. Protocole documentaire obligatoire pour les IA`.

À l'intérieur du dossier `docs/system/`, l'ordre conseillé reste :

1. [NOEMA_VISION.md](NOEMA_VISION.md)
2. [NOEMA_SYSTEM_MAP.md](NOEMA_SYSTEM_MAP.md)
3. [NOEMA_RUNTIME_GAPS.md](NOEMA_RUNTIME_GAPS.md)
4. [NOEMA_CHAT_ORCHESTRATION_MAP.md](NOEMA_CHAT_ORCHESTRATION_MAP.md)
5. [NOEMA_DATA_FLOW_MAP.md](NOEMA_DATA_FLOW_MAP.md)
6. [NOEMA_ALIGNMENT_PLAN.md](NOEMA_ALIGNMENT_PLAN.md)
7. [NOEMA_ALIGNMENT_EXECUTION_PLAN.md](NOEMA_ALIGNMENT_EXECUTION_PLAN.md)

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

**Résumé** : toute modification touchant l'architecture, l'accès, les quotas, le prompt, l'état `_ui`, le Greffier, le mapping, la mémoire, les sessions, le billing, Journal, Today / `Aujourd'hui` / `Zen` ou une table Supabase doit être accompagnée d'une mise à jour des documents concernés dans ce dossier.
