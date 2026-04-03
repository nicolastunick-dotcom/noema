# NOEMA — État Projet

> État opérationnel réel au 03/04/2026.
> Ce fichier ne sert plus d'archive longue. Il décrit où en est réellement le projet aujourd'hui.

---

## Documents à lire en premier

L'ordre obligatoire de lecture et de mise à jour est défini dans `MASTER.md`, section `6. Protocole documentaire obligatoire pour les IA`.

Les deux premiers documents à ouvrir restent :

- `MASTER.md`
- `PROJECT.md`

Les documents suivants ne sont pas des sources de vérité opérationnelles :

- `ROADMAP.md`
- `DEBATE.md`
- `RETENTION.md`
- `codex.md`

Ils restent utiles comme historique, audit ou matière de réflexion, mais pas comme état produit exact.

---

## Résumé exécutif

Noema est aujourd'hui un produit réel, déjà monétisable techniquement, centré sur :

- un chat introspectif branché à Anthropic
- un mapping psychologique alimenté par le `_ui` du modèle
- un journal réellement persisté
- une page `Aujourd'hui` réellement reliée au fil en cours, qui sert désormais de base à la future `Page Zen`
- un système d'accès avec trial, abonnement, invite et admin
- un checkout Stripe et un webhook déjà branchés

Le projet n'est plus une maquette.
Son principal retard n'est plus l'absence de briques, mais l'écart entre :

- la vision officielle
- la visibilité produit de cette vision
- certaines vérités techniques encore hybrides

---

## État réel par domaine

| Domaine | État | Notes |
|---|---|---|
| App publique | réel | landing, login, pricing, onboarding preview, pages légales, contact |
| App privée | réel | `Chat`, `Mapping`, `Journal`, `Aujourd'hui` via `AppShell` |
| Routage | réel | routage manuel dans `src/App.jsx` |
| Auth | réel | Supabase Auth, email/password, reset password, Google OAuth côté code |
| Onboarding | réel | basé sur `memory.onboarding_done` |
| Chat | réel | appel backend `claude.js`, mémoire et snapshots branchés |
| Mapping | réel mais dépendant du chat | pas de moteur autonome, pas de progression historique |
| Journal | réel | `journal_entries` lecture/écriture Supabase |
| Aujourd'hui | réel | relié à `next_action`, dernière session et dernier journal ; doit évoluer en `Zen` |
| Trial | réel | tout utilisateur authentifié sans abonnement actif devient `trial` |
| Quota | réel | backend autoritaire : `8/jour` trial, `25/jour` full |
| Billing | réel | checkout, webhook, `subscriptions`, page `Success` |
| Invites | partiel | backend sur table `invites`, frontend encore sur `sessionStorage` |
| Admin | partiel | `profiles.is_admin` + fallback email legacy |
| Greffier | partiel | enrichit mémoire/observabilité, ne pilote pas directement l'UI |
| Phase Stratège visible | partiel | présente dans le prompt, peu visible dans l'UI |
| `semantic_memory` | non branché | table et RPC présentes, runtime absent |
| Tests automatisés | absents | `npm test` ne trouve aucun fichier de test |

---

## Ce qui est vrai aujourd'hui

### Produit

- Le coeur de Noema est déjà la boucle `Chat -> next_action -> Journal -> Aujourd'hui`.
- Le mapping visible vient du modèle principal, pas du Greffier.
- Le journal n'est plus une simple promesse : il persiste réellement.
- `Aujourd'hui` n'est plus statique : il consomme des données réelles.
- La prochaine évolution produit retenue est : `Aujourd'hui` devient `Zen` sans perdre ce runtime.
- L'abonnement sert à continuer l'expérience après la découverte gratuite.

### Technique

- `claude.js` vérifie le JWT et décide du tier d'accès côté backend.
- Le quota quotidien est décidé côté backend.
- `sessions` et `memory` sont réellement relus et mis à jour.
- `Success` revalide `subscriptions.status`.
- Le build production passe.

### Prudence

- Le frontend et le backend n'utilisent pas encore exactement la même vérité pour les invites.
- Le bypass admin par email legacy existe encore.
- Le repo contient encore des reliquats legacy :
  - `src/App.original.jsx`
  - `src/constants/prompt-greffier.js`

---

## Écarts majeurs encore ouverts

1. **Phase produit vs phase visible**
Le prompt sait déjà opérer en logique `Guide/Stratège`, mais l'utilisateur ne voit pas encore clairement ce basculement.

2. **Cross-session trop faible**
La mémoire existe, mais Noema ne ramène pas encore explicitement les schémas récurrents à l'écran.

3. **Mapping encore trop instantané**
Il affiche surtout l'état courant et pas encore une vraie progression dans le temps.

4. **`Aujourd'hui` n'est pas encore `Zen`**
La base de continuité est là, mais la surface ne propose pas encore le vrai moment de recentrage, d'exercice adapté ou de calme personnalisé décrit dans `NOEMA_VISION2.md`.

5. **Accès encore hybride**
Le backend vérifie `invites` en base, mais le frontend s'appuie encore sur `sessionStorage` pour la logique invite.

6. **Documentation encore éclatée**
Les docs système sont utiles, mais plusieurs `.md` historiques peuvent encore induire en erreur si on ne lit pas `MASTER.md` et `docs/system/`.

---

## Priorités actuelles

1. Unifier complètement la vérité d'accès entre frontend et backend.
2. Rendre la phase `Stratège` visible dans l'UI.
3. Ajouter une vraie détection des patterns cross-sessions.
4. Transformer le mapping en miroir de progression.
5. Transformer `Aujourd'hui` en `Zen` en gardant la continuité déjà branchée.
6. Renforcer encore la continuité entre `Chat`, `Journal` et `Zen`.
7. Supprimer les reliquats hybrides et legacy qui brouillent la lecture du système.

---

## Vérification rapide

- `npm run build` : OK
- `npm test` : KO, aucun test présent

---

## Règle de mise à jour

Toute modification touchant :

- l'accès
- les quotas
- le prompt
- le `_ui`
- le Greffier
- `memory`
- `sessions`
- Stripe
- Journal
- Aujourd'hui
- une table Supabase

doit mettre à jour :

- `PROJECT.md`
- `MASTER.md` si la vision, l'état global ou les priorités changent
- les documents concernés dans `docs/system/`
