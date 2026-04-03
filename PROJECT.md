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
| Mapping | réel | depend du chat mais affiche maintenant une trajectoire visible et une premiere couche de progression cross-sessions |
| Journal | réel | `journal_entries` lecture/écriture Supabase |
| Aujourd'hui | réel evolutif | relie a `next_action`, derniere session et dernier journal ; embarque un premier rituel `Zen` |
| Trial | réel | tout utilisateur authentifié sans abonnement actif devient `trial` |
| Quota | réel | backend autoritaire : `8/jour` trial, `25/jour` full |
| Billing | réel | checkout, webhook, `subscriptions`, page `Success` |
| Invites | partiel | `sessionStorage` transporte encore le token, mais l'acces `invite` n'est plus accorde sans confirmation backend/base |
| Admin | réel | `profiles.is_admin` est la source de vérité runtime |
| Greffier | partiel | enrichit mémoire/observabilité, ne pilote pas directement l'UI |
| Phase Stratège visible | réel initial | lecture emotionnelle derivee de `step`, visible dans `AppShell`, `Chat` et `Mapping`, encore a densifier |
| `semantic_memory` | non branché | table et RPC présentes, runtime absent |
| Tests automatisés | absents | `npm test` ne trouve aucun fichier de test |

---

## Ce qui est vrai aujourd'hui

### Produit

- Le coeur de Noema est déjà la boucle `Chat -> next_action -> Journal -> Aujourd'hui`.
- Le mapping visible vient du modèle principal, pas du Greffier.
- Le journal n'est plus une simple promesse : il persiste réellement.
- `Aujourd'hui` n'est plus statique : il consomme des données réelles.
- La phase actuelle est maintenant visible dans l'experience, meme si elle reste encore legere.
- Une lecture cross-sessions alimente maintenant le prompt, le mapping et `Aujourd'hui`, avec une premiere trajectoire visible.
- La prochaine évolution produit retenue est : `Aujourd'hui` devient `Zen` sans perdre ce runtime.
- L'abonnement sert à continuer l'expérience après la découverte gratuite.

### Technique

- `claude.js` vérifie le JWT et décide du tier d'accès côté backend.
- Le quota quotidien est décidé côté backend.
- `sessions` et `memory` sont réellement relus et mis à jour.
- `Success` revalide `subscriptions.status`.
- Le build production passe.

### Prudence

- Le flux invite n'accorde plus l'acces depuis `sessionStorage` seul, mais depend encore du linkage `invites.user_id` en base.
- Le statut admin repose maintenant sur `profiles.is_admin`.
- Le repo contient encore des reliquats legacy :
  - `src/App.original.jsx`
  - `src/constants/prompt-greffier.js`

---

## Écarts majeurs encore ouverts

1. **Phase visible encore trop légère**
Le produit montre maintenant une lecture emotionnelle `Perdu -> Guide -> Stratege`, mais la bascule reste encore plus signalee qu'incarnee.

2. **Cross-session encore trop léger**
Noema commence a faire remonter une trajectoire et des motifs recurrents, mais la lecture reste encore simple et peu proactive.

3. **Mapping encore insuffisamment longitudinal**
Une couche de progression existe, mais le mapping reste encore majoritairement centre sur l'etat courant.

4. **`Aujourd'hui` n'est encore qu'un premier `Zen`**
La surface propose maintenant un premier rituel adapte, mais elle n'incarne pas encore completement la page `Zen` de `NOEMA_VISION2.md`.

5. **Accès encore transitoire**
Le frontend ne donne plus l'invite sans confirmation backend, mais le flux depend encore de `invites.user_id` en prod.

6. **Documentation encore éclatée**
Les docs système sont utiles, mais plusieurs `.md` historiques peuvent encore induire en erreur si on ne lit pas `MASTER.md` et `docs/system/`.

---

## Priorités actuelles

1. Finaliser la vérité d'accès en prod (`invites.user_id` + verification des admins dans `profiles.is_admin`).
2. Approfondir la détection des patterns cross-sessions.
3. Transformer le mapping en miroir de progression.
4. Transformer `Aujourd'hui` en `Zen` en gardant la continuité déjà branchée.
5. Renforcer encore la continuité entre `Chat`, `Journal` et `Zen`.
6. Approfondir la phase visible dans toute l'expérience.
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
