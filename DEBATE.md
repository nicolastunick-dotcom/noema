# DEBATE — Noema : trois regards analytiques

> Simulation de débat entre trois agents. Aucune modification de code.
> Données sources : PROJECT.md, codex.md, codebase au 01/04/2026.

---

## Agent 1 — L'Investisseur

### Viabilité financière

**Le modèle à 19 €/mois est-il le bon prix ?**

19 €/mois est défendable, mais fragile. C'est le prix d'un abonnement Spotify Premium. Pour ce tarif, l'utilisateur attend une valeur perçue claire et constante. Le problème : la valeur de Noema est intangible (clarté mentale, progression personnelle) et difficile à mesurer semaine après semaine. Ce n'est pas le prix qui est mauvais — c'est la justification du prix qui n'est pas encore assez visible dans le produit.

---

**Coûts réels (estimations basées sur la codebase)**

Modèles utilisés :
- Réponses chat : Claude Sonnet 4.6 → ~$3/MTok input, ~$15/MTok output
- Greffier (extraction silencieuse) : Claude Haiku 4.5 → ~$0.80/MTok input, ~$4/MTok output

Estimation par message utilisateur :
- Input Sonnet : ~800 tokens (system prompt + historique + message) → $0.0024
- Output Sonnet : ~600 tokens → $0.009
- Greffier (1 appel tous les 3 messages) : ~$0.002/3 → $0.00067
- **Total par message : ~$0.012**

Profils d'usage mensuel :

| Profil | Messages/jour | Messages/mois | Coût API/mois |
|--------|--------------|---------------|---------------|
| Léger (1–2 j/sem) | 3 | 90 | ~$1.08 |
| Moyen (quotidien) | 7 | 210 | ~$2.52 |
| Intensif (max) | 25 | 750 | ~$9.00 |

Note : le rate limit à 25 messages/jour est un plafond de protection efficace. Sans lui, un utilisateur obsessionnel pourrait coûter $30+/mois.

---

**Marges nettes (après Stripe ~2.9% + €0.30)**

Revenu net par abonné : ~€18.10 ≈ $19.55

| Profil | Coût API | Marge brute | Marge % |
|--------|----------|-------------|---------|
| Léger  | $1.08    | ~$18.47     | 94%     |
| Moyen  | $2.52    | ~$17.03     | 87%     |
| Intensif | $9.00  | ~$10.55     | 54%     |

---

**Break-even infrastructure**

| Poste | Coût mensuel |
|-------|-------------|
| Netlify Pro (>125k invocations) | $19 |
| Supabase Pro (>500MB / >50k MAU) | $25 |
| Domaine | ~€1 |
| **Total infra** | **~$45/mois** |

Break-even infra seul : **3 abonnés**.
Break-even viable (salaire fondateur minimal) : dépend du contexte, mais 50–80 abonnés couvrent ~€1000/mois.

---

**Projections à 100 / 500 / 1000 abonnés (usage moyen)**

| Abonnés | Revenu brut | Coût API | Infra | Stripe | Bénéfice net | Marge |
|---------|------------|----------|-------|--------|--------------|-------|
| 100 | €1,900 | $252 | $45 | $61 | ~€1,450 | 76% |
| 500 | €9,500 | $1,260 | $100 | $305 | ~€7,500 | 79% |
| 1,000 | €19,000 | $2,520 | $200 | $609 | ~€14,900 | 78% |

---

**Risques financiers**

1. **Webhook Stripe manquant** : la table `subscriptions` n'est pas automatiquement maintenue. Un abonnement annulé peut rester actif en base — accès gratuit post-résiliation. C'est une fuite de revenu directe. Pire encore : un utilisateur qui paie ne voit probablement pas son accès s'activer, ce qui tue la conversion à zéro.

2. **Concentration sur Sonnet 4.6** : si Anthropic augmente ses tarifs ou si les utilisateurs intensifs représentent 20%+ de la base, les marges se compriment. Envisager de basculer les messages courts sur Haiku et réserver Sonnet aux moments clés.

3. **Absence d'essai gratuit / freemium** : 19€/mois sans possibilité de tester = taux de conversion structurellement bas depuis la landing. La landing actuelle ne convertit probablement pas à plus de 1–2% des visiteurs.

4. **Churn invisible** : sans analytics comportementaux (pas de Mixpanel, Amplitude ou même PostHog visible dans la codebase), impossible de savoir pourquoi les gens partent. On ne peut pas corriger ce qu'on ne mesure pas.

**Verdict investisseur** : Le modèle économique est sain sur le papier — 78–87% de marge nette à usage moyen est excellent pour un SaaS. Mais le produit n'a pas encore les instruments de mesure pour piloter la croissance. Et le webhook Stripe manquant crée une probabilité non nulle que le taux de conversion soit literalement 0% en ce moment.

---

## Agent 2 — L'Utilisateur cible (25 ans, se sent perdu)

### Ce que je ressens en utilisant Noema

**Est-ce que ça me parle ?**

Oui, l'intention me touche. Je me suis déjà senti dépassé, sans savoir par où commencer. L'idée d'un guide qui me connaît, qui se souvient de ce que j'ai dit la semaine dernière, et qui m'aide à voir plus clair — c'est exactement ce que je cherche parfois. Pas un thérapeute que je ne peux pas me payer, pas ChatGPT qui repart de zéro à chaque conversation.

Mais entre l'intention et l'expérience réelle, il y a un fossé.

---

**Est-ce que je paierais 19€/mois ?**

Honnêtement : peut-être. Sous conditions.

Je paie déjà Spotify (10€), Netflix (17€), parfois une appli de méditation (8€). 19€ c'est dans la fourchette haute de ce que j'accepte pour quelque chose de numérique. Mais pour justifier ce tarif, j'ai besoin de ressentir la valeur dans la première semaine. Si après 3 sessions je ne vois pas de différence dans ma façon de me sentir ou de penser, je résilie.

Ce qui me ferait payer sans hésiter : voir que Noema se souvient de ce que j'ai dit il y a 10 jours, fait le lien avec ce que je dis aujourd'hui, et me propose une perspective que je n'aurais pas eue seul.

---

**Ce qui me ferait rester**

- La mémoire qui fonctionne vraiment (le bug reporté dans PROJECT.md est donc critique pour moi)
- Le sentiment d'être compris, pas juste "analysé"
- Des insights concrets, pas des platitudes ("tu dois t'écouter davantage" → inutile)
- Une progression visible : est-ce que j'avance ? Sur quoi ? Comment ?
- La confidentialité perçue : je dois avoir confiance que mes pensées ne sont pas lues ou vendues

---

**Ce qui me ferait partir**

- Si Noema répond toujours la même chose quel que soit ce que je dis
- Si le chat plante ou met 30 secondes à répondre
- Si je recharge la page et Noema ne se souvient plus de rien (= le bug mémoire actuel)
- Si la page pricing s'affiche alors que je suis déjà abonné (= friction perçue comme un bug)
- Si l'interface me semble froide, clinique, générique

---

**Ce qui manque**

1. **Preuve sociale** : je veux lire ce que d'autres personnes ont vécu. Pas des témoignages corporate — des vrais retours, bruts, imparfaits. Je veux voir que ça a aidé quelqu'un qui me ressemble.

2. **Un vrai onboarding émotionnel** : actuellement, on me demande des infos mais je ne sais pas vraiment pourquoi. Je veux comprendre ce que Noema va faire avec ça, ce que je vais en retirer concrètement.

3. **Un tableau de bord personnel** : est-ce que je progresse ? Quels sujets est-ce que j'explore ? Ça donnerait un sentiment de valeur accumulée — quelque chose que je perdrais si je résiliait.

4. **Une période d'essai** : 7 jours gratuits, ou 5 sessions. Sans ça, 19€ c'est un pari. Et je ne mise pas facilement sur quelque chose que je ne connais pas.

5. **Mobile** : j'ai envie d'utiliser ça dans les transports, avant de dormir, dans ces moments de flottement. Pas forcément devant mon ordi.

**Verdict utilisateur** : Je suis la cible. Le concept est juste. Mais l'exécution doit être au niveau de la promesse — et pour l'instant, le bug mémoire tue la valeur principale du produit. Si ça fonctionnait vraiment bien (mémoire réelle, insights qui s'accumulent, progression visible), je resterais probablement des mois. Sinon, je retourne sur ChatGPT avec un prompt système.

---

## Agent 3 — Le CTO

### Architecture — ce qui tient et ce qui ne tient pas

**Ce qui est solide**

- Stack React/Vite + Netlify Functions + Supabase est parfaitement adaptée au stade actuel (0→1000 users). Pas de sur-ingénierie, pas de dette architecturale majeure.
- Le streaming SSE est correctement implémenté : `claude.js` → `text/event-stream` → `AppShell` reader avec `stripUIStreaming` sur chaque chunk.
- Le rate limiting serveur via table `rate_limits` Supabase, avec bypass admin, est une bonne base.
- Le Greffier sur Haiku 4.5 est la décision architecturale la plus intelligente du projet : même résultat d'extraction pour ~10x moins cher que Sonnet 4.6.
- JWT vérifié côté serveur via `sbAdmin.auth.getUser(token)` : sécurité de base correcte.

---

**Points de rupture techniques**

**1. Bug racine mémoire : Greffier sans Supabase**

Selon PROJECT.md Correction 3 (en cours) : le Greffier recevait `sb: null` depuis sa création. Ce qui signifie que toutes les extractions (ikigai, forces, blocages, insights, thèmes récurrents) n'ont jamais été persistées dans Supabase. La mémoire long-terme de Noema était structurellement vide depuis le premier déploiement. C'est le bug racine qui explique 90% des retours sur la mémoire — pas un bug d'affichage, pas un bug de chargement, mais une absence totale d'écriture.

**2. buildMemoryContext trop restrictif**

La condition `if (!memory || !memory.session_count) return ""` dans `src/lib/supabase.js` signifie que si une ligne `memory` existe mais que `session_count` est `null` ou `0` (ce qui est le cas pour un nouvel utilisateur ou après un bug d'écriture Greffier), le contexte mémoire injecté dans le prompt était une chaîne vide. Noema démarrait chaque session sans aucun contexte personnel, même quand des données existaient partiellement en base.

**3. Sécurité — surface d'attaque non résolue**

D'après codex.md, plusieurs vulnérabilités restent ouvertes :

| Vulnérabilité | Gravité | Statut |
|---------------|---------|--------|
| XSS via `dangerouslySetInnerHTML` + `fmt()` sans DOMPurify strict | Élevé | Non résolu |
| RLS `access_codes` trop permissive (lecture publique + update any) | Élevé | Non résolu |
| Absence de Content-Security-Policy | Moyen | Non résolu |
| Contrôle admin côté client (email hardcodé) | Moyen | Partiellement atténué |
| Modèle Anthropic et taille messages non bornés côté serveur | Moyen | Non résolu |

Le risque le plus concret à court terme : si `fmt()` produit du HTML non prévu et que `DOMPurify` a un edge case, un prompt injection depuis le modèle Anthropic pourrait exécuter du JS dans le navigateur. Peu probable, mais non mitigé.

**4. Webhook Stripe manquant = flux paiement cassé**

La table `subscriptions` est lue par `useSubscriptionAccess.js` pour décider si l'utilisateur a accès. Mais aucune Netlify Function n'écoute les events Stripe pour écrire dans cette table. Le flux actuel après paiement :

```
Stripe checkout.session.completed
    → webhook → ❌ (fonction inexistante)
    → table subscriptions → jamais mise à jour
    → utilisateur redirigé vers /success
    → useSubscriptionAccess lit subscriptions → ligne inexistante
    → redirect vers /pricing
    → 🔄 loop
```

Un utilisateur qui paie est bloqué en boucle pricing → success → pricing. C'est un P0.

**5. Scalabilité Netlify Functions**

Cold starts : 300–800ms à la première invocation après inactivité. Pour le streaming SSE, le délai initial est perceptible. À 1000 users actifs simultanément, Netlify scale correctement (serverless), mais chaque cold start double le temps de réponse perçu. Solution à terme : migrer vers une instance persistante (Railway, Render) ou utiliser Netlify Edge Functions pour la latence.

**6. Absence de monitoring**

Aucun outil de monitoring (Sentry, Logtail, Datadog) n'est visible dans la codebase ou PROJECT.md. Les crashs silencieux de `claude.js` sont découverts par l'utilisateur, pas par une alerte. En prod, un 502 peut se produire pendant des heures sans que personne le sache. Le `console.log('[claude] requête reçue:')` récemment ajouté est un début, mais c'est du debug, pas du monitoring.

---

**Le Greffier + Sonnet est-il viable à grande échelle ?**

À 1000 abonnés avec usage moyen (7 messages/jour) :
- Sonnet 4.6 : 1000 × 210 messages × $0.0114 = ~$2,394/mois
- Greffier Haiku 4.5 : ~$500/mois (1 appel/3 messages)
- **Total API : ~$2,900/mois**
- Revenu brut : ~€19,000/mois
- **Marge après API + infra : ~78%**

Oui, c'est viable. Le choix Haiku pour le Greffier est la décision architecturale la plus impactante du projet sur la rentabilité.

**Verdict CTO** : L'architecture est correcte pour un MVP. Les deux bugs critiques (Greffier sans Supabase + buildMemoryContext trop strict) sont en cours de correction et expliquent pourquoi le produit ne délivrait pas encore sa promesse. Le risque technique prioritaire à court terme est le webhook Stripe (P0 sur la conversion) et le XSS potentiel (P1 sur la sécurité). Le scaling technique ne pose pas de problème avant 5000+ users actifs.

---

## Le Débat — Frictions entre agents

**Investisseur → Utilisateur** : "Tu dis que tu paierais si la mémoire fonctionnait. Mais sans période d'essai, tu n'as jamais eu l'occasion de voir la mémoire fonctionner avant de payer. C'est un problème de funnel, pas uniquement de produit."

**Utilisateur → CTO** : "Si le Greffier n'a jamais écrit dans Supabase, ça veut dire que Noema ne se souviendrait de rien même avec la mémoire corrigée ? Donc le produit tel qu'il existait avant les corrections actuelles ne délivrait pas encore sa promesse principale ?"

**CTO → Utilisateur** : "Exactement. Les 3 corrections en cours (autosave + buildMemoryContext souple + Greffier→Supabase) constituent le vrai MVP. Avant leur déploiement et validation, le produit était une démo convaincante, pas encore un produit."

**CTO → Investisseur** : "Le webhook Stripe manquant est plus grave que n'importe quel problème de marge. Un utilisateur qui paie et ne peut pas accéder ne reviendra jamais — et ne laissera pas un avis positif non plus. Le taux de conversion réel pourrait être 0% non pas parce que le produit est mauvais, mais parce que le tuyau paiement→accès est cassé."

**Investisseur → CTO** : "Le produit fonctionne pour les utilisateurs en invitation beta (accès direct sans Stripe). Ça prouve que l'expérience peut convaincre — il faut juste réparer le tuyau. 48h de développement sur le webhook, et le problème de conversion disparaît."

**Utilisateur → Investisseur** : "Même si le webhook est réparé, je n'achète pas sans essai. Montre-moi 3 sessions gratuites. Si ça me parle, je paie sans hésiter. Si vous ne proposez pas d'essai, vous m'obligez à prendre un risque que je ne veux pas prendre pour un produit que je ne connais pas."

---

## Verdict final

### Le projet peut-il fonctionner ?

**Oui — mais le produit livrable n'existe pas encore tout à fait.**

L'idée est juste, le marché existe, l'économie est saine. Mais Noema fait actuellement une promesse (mémoire persistante, guide qui se souvient de toi) qu'il ne tient pas techniquement, à cause de trois bugs cumulés dont l'un (Greffier sans Supabase) est présent depuis le début. Ce n'est pas un problème de vision — c'est un problème d'exécution en cours de résolution.

Une fois les corrections C1/C2/C3 validées en production, Noema sera pour la première fois capable de tenir sa promesse principale. C'est à ce moment-là, et pas avant, qu'il sera pertinent d'investir dans la croissance.

---

### Les 3 changements les plus importants à faire maintenant

**1. Fermer la boucle Stripe — webhook `stripe-webhook.js` (priorité absolue, 48h)**

Créer `netlify/functions/stripe-webhook.js` qui écoute `checkout.session.completed` et `customer.subscription.updated/deleted`, et écrit dans `subscriptions`. Sans ça, le flux paiement→accès est cassé et le taux de conversion réel est proche de zéro. C'est le P0 du projet.

**2. Valider la mémoire de bout en bout après les corrections C1/C2/C3 (cette semaine)**

Tester manuellement en production : démarrer une session, parler 10 minutes, recharger la page, vérifier que Noema se souvient. Puis attendre 24h et revenir. Ce test est le critère de "produit livré". Avant ce test passé en prod, le produit ne délivre pas encore sa promesse centrale.

**3. Ajouter une période d'essai (7 jours ou 5 sessions) (cette semaine)**

Sans essai, le taux de conversion restera structurellement bas. Techniquement : un statut `trialing` dans Stripe avec `trial_period_days: 7` à la création de la checkout session, et une lecture de `trial_end` dans `useSubscriptionAccess` pour accorder l'accès pendant la période. L'impact sur la conversion sera immédiat et mesurable. C'est aussi le seul moyen de prouver la valeur mémoire à un utilisateur avant qu'il sorte sa carte.

---

> Ce document est une analyse de situation au 01/04/2026.
> Il ne remplace pas une validation marché réelle.
> Sources : PROJECT.md, codex.md, codebase Noema.

---

## Addendum — Débat mis à jour au 02/04/2026 depuis `docs/system/`

> Cette section ne remplace pas le débat initial.
> Elle le met à jour à partir de `docs/system/NOEMA_SYSTEM_MAP.md`, `docs/system/NOEMA_RUNTIME_GAPS.md`, `docs/system/NOEMA_CHAT_ORCHESTRATION_MAP.md`, `docs/system/NOEMA_DATA_FLOW_MAP.md` et `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`.

### Ce qui a réellement changé depuis le premier débat

- l'accès n'est plus seulement filtré côté frontend : `claude.js` vérifie maintenant l'entitlement
- le quota produit n'est plus écrit à la fois par le client et le serveur
- le contrat `_ui` a commencé à être unifié entre prompt et AppShell
- la mémoire est davantage branchée côté runtime qu'au moment du premier débat
- le projet est moins "cassé silencieusement" qu'avant, mais il n'est pas encore cohérent de bout en bout

En revanche, les docs système rappellent aussi que :

- `Journal` et `Today` restent majoritairement mockés
- `Success` n'est toujours pas une preuve fiable d'activation
- la notion de session reste jeune et encore incomplète
- une partie de la documentation globale et du legacy continue de raconter un autre Noema

---

## Agent 1 — L'Investisseur, version 02/04/2026

### Comment je lis l'évolution du projet

La lecture `docs/system/` change mon diagnostic. Le projet n'est plus au stade "promesse séduisante avec tuyauterie cassée". Il est en train de devenir un vrai produit exploitable, mais il n'a pas encore terminé sa mue.

Le point le plus rassurant est l'évolution de la vérité système :

- l'accès critique a été déplacé côté backend
- le quota a une seule autorité
- le coût Greffier a été réduit
- le projet documente enfin ses contradictions au lieu de les masquer

Pour un investisseur, ce n'est pas anecdotique. Cela signifie que l'équipe ne fait pas seulement des features ; elle réduit le risque structurel.

### Ce qui devient plus crédible

Le modèle économique devient plus crédible précisément parce que le runtime devient plus cohérent.

Avant, un abonnement actif ne garantissait pas une expérience cohérente.
Maintenant, la valeur commence à être défendable :

- le chat tient mieux sa mémoire
- l'accès est moins contournable
- le produit commence à avoir une source de vérité par domaine

Autrement dit : on sort du stade "démo bluffante" pour entrer dans le stade "système exploitable".

### Ce qui reste préoccupant

Le principal risque a changé.

Ce n'est plus seulement "est-ce que le tuyau est cassé ?"
C'est maintenant :
"est-ce que le produit accumule une valeur visible assez vite pour justifier 19€ ?"

Et sur ce point, les docs système sont claires :

- `Mapping` est la seule surface vraiment vivante
- `Journal` et `Today` ne convertissent pas encore la mémoire en habitude
- `Success` n'aligne pas encore la promesse billing avec la vérité runtime

Donc financièrement, Noema s'améliore comme système, mais pas encore comme machine à rétention.

### Nouveau verdict investisseur

Le projet évolue dans la bonne direction.
La trajectoire est meilleure qu'au 01/04/2026 parce qu'on voit une discipline d'alignement apparaître.

Mais je n'investis pas encore dans la croissance agressive.
J'investis dans la consolidation de trois preuves :

1. preuve de continuité réelle entre sessions
2. preuve de valeur quotidienne via `Journal` / `Today`
3. preuve d'activation post-paiement sans ambiguïté

Tant que ces trois preuves ne sont pas visibles dans le produit, la croissance risque d'amplifier une incohérence au lieu d'amplifier une valeur.

---

## Agent 2 — L'Utilisateur cible, version 02/04/2026

### Ce que je sentirais aujourd'hui

Si je me base sur les docs système, Noema commence à ressembler davantage à ce qu'il promet.

Avant, j'avais l'impression qu'on me vendait un guide intime alors que beaucoup de choses reposaient encore sur des illusions d'interface.
Aujourd'hui, j'ai plutôt l'impression que le coeur devient sérieux :

- l'accès paraît plus fiable
- la mémoire paraît moins cosmétique
- le Mapping paraît moins décoratif

Ça change beaucoup psychologiquement.
Je peux accepter qu'un produit soit encore en construction.
J'accepte moins qu'il me fasse croire qu'il est déjà plus abouti qu'il ne l'est.

### Ce qui me donnerait davantage confiance

Le changement le plus important n'est pas technique pour moi.
C'est le fait que le projet commence à dire la vérité sur lui-même.

Les docs système assument que :

- `Journal` est encore mocké
- `Today` est encore mocké
- `Success` n'est pas encore une vraie confirmation

Cette honnêteté augmente ma confiance.
Parce qu'elle laisse penser que ce qui marche vraiment est en train d'être consolidé.

### Ce qui me frustrerait encore

Même avec les progrès récents, la partie la plus émotionnellement importante n'est pas encore là :

- je ne retrouve pas encore ma continuité quotidienne dans des surfaces utiles
- je n'ai pas encore un "fil de vie" clair entre le chat, le journal et aujourd'hui
- la promesse de rituel reste plus forte que le rituel lui-même

Donc comme utilisateur, je dirais :
"Je commence à croire au moteur, mais je n'habite pas encore le produit."

### Nouveau verdict utilisateur

Le projet évolue bien.
Je ne le vois plus comme une simple belle conversation.
Je commence à le voir comme un futur compagnon sérieux.

Mais pour que je reste, il faut que l'évolution se rende visible dans l'expérience :

1. ce que j'ai compris hier doit reparaître aujourd'hui
2. ce que Noema me donne comme `next_action` doit vivre quelque part
3. je dois sentir que l'app avance avec moi, pas seulement que le chat me répond bien

---

## Agent 3 — Le CTO, version 02/04/2026

### Ce qui me rassure dans l'évolution

Les docs système montrent un changement de maturité technique.
L'équipe n'est plus seulement en train d'ajouter des briques.
Elle est en train de reprendre le contrôle des invariants.

C'est visible sur quatre axes :

1. autorité backend sur l'accès
2. autorité backend sur le quota
3. réduction du dialecte `_ui`
4. introduction d'une logique de session plus explicite

Ce sont des changements de structure, pas des correctifs cosmétiques.

### Ce qui reste techniquement incomplet

Le projet n'a pas encore terminé sa transition vers une architecture cohérente.
Les docs le montrent très bien :

- `Journal` et `Today` ne sont pas encore branchés à la donnée réelle
- `Success` ne lit pas encore la vérité billing
- le runtime porte encore du legacy capable d'induire en erreur
- toutes les docs n'ont pas encore été réalignées au même niveau de précision

Le risque n'est donc plus un P0 unique.
Le risque est désormais un "faux sentiment de complétude".

Autrement dit :
le coeur va mieux, mais l'enveloppe produit peut encore raconter une histoire plus finie que le système réel.

### Mon point technique le plus important

Le prochain vrai saut de qualité ne vient pas d'un nouveau modèle IA.
Il vient de la couture entre les couches.

Aujourd'hui, le chat, la mémoire et le mapping forment enfin un noyau plus cohérent.
Le prochain enjeu est d'étendre ce noyau vers :

- `session_id` vraiment utile partout
- `next_action` réellement consommé
- `Journal` et `Today` dérivés de la même vérité

Si cette couture réussit, Noema cesse d'être un ensemble de surfaces.
Il devient un système produit.

### Nouveau verdict CTO

Techniquement, le projet évolue mieux que beaucoup de MVPs à ce stade.
Non pas parce qu'il est "presque fini", mais parce qu'il commence à corriger ses fondations avant d'empiler de nouvelles promesses.

Le danger principal n'est plus la faisabilité.
C'est la discipline :
continuer à fermer les écarts système avant de réouvrir un cycle d'expansion produit.

---

## Nouveau débat — Comment Noema est en train d'évoluer

**Investisseur → CTO** : "Ce que j'aime dans `docs/system/`, c'est que le projet n'essaie plus de faire croire que tout est réel. Mais ça veut dire aussi que la prochaine croissance devra être financée par la cohérence, pas par le storytelling."

**CTO → Investisseur** : "Exactement. La valeur du projet n'augmente pas seulement parce qu'on ajoute des features. Elle augmente parce que chaque domaine a enfin une vérité plus claire."

**Utilisateur → CTO** : "Je vois le progrès du système. Mais tant que `Journal` et `Today` ne vivent pas avec mes vraies données, je sentirai encore une frontière entre le coeur du produit et le reste."

**CTO → Utilisateur** : "C'est précisément le prochain cap. Le moteur n'est plus le plus gros problème. Le problème maintenant, c'est la propagation de cette vérité dans toute l'expérience."

**Investisseur → Utilisateur** : "Donc si je traduis ton ressenti : avant, Noema était intéressant mais fragile. Maintenant, il devient crédible, mais pas encore indispensable."

**Utilisateur → Investisseur** : "Oui. Je peux croire à son potentiel plus qu'avant. Mais l'habitude quotidienne ne naît pas encore, parce que la continuité ne m'est pas encore rendue visible."

**CTO → Investisseur** : "C'est pour ça que les prochains sprints ne doivent pas être choisis comme des idées isolées. Ils doivent être choisis comme des raccordements de vérité entre mémoire, session, journal et today."

---

## Verdict mis à jour

Le projet n'est plus en train de simplement "s'améliorer".
Il est en train de changer de nature.

Il passe progressivement de :

"MVP conversationnel prometteur, mais partiellement contradictoire"

à :

"noyau produit cohérent, encore entouré de surfaces inachevées"

La meilleure lecture de son évolution aujourd'hui est donc la suivante :

- le coeur système progresse plus vite que les surfaces visibles
- la crédibilité technique augmente
- la crédibilité produit augmente moins vite, parce que `Journal`, `Today` et `Success` n'ont pas encore rattrapé le noyau
- la prochaine valeur ne viendra pas d'une nouvelle idée brillante, mais de l'alignement final entre les couches déjà présentes

---

## Débat expérimental — 5 jeunes de 18 à 28 ans

> Débat purement expérimental.
> Il ne s'agit ni d'une étude utilisateur, ni d'un panel représentatif, ni d'une validation marché.
> C'est une simulation qualitative destinée à faire émerger des tensions produit à partir des mêmes sujets de débat que dans le reste du document.
> Sources de contexte : `PROJECT.md` et `docs/system/`.

### Sujets conservés

Les 5 agents débattent des mêmes sujets de fond :

- est-ce que Noema devient un produit crédible ou reste une promesse
- est-ce que la valeur perçue justifie un abonnement
- est-ce que l'évolution actuelle du projet donne envie de revenir
- qu'est-ce qui manque encore pour transformer une bonne conversation en vrai compagnon
- quels éléments du produit paraissent réels, partiels ou encore trop "maquettés"

---

## Agent A — 18 ans, terminale, perdu entre études et identité

### Ce que je vois

Moi, ce qui me parle dans Noema, c'est moins le côté "performance" que le côté "je peux enfin mettre des mots sur ce que je ressens".

Si je lis les docs système, je vois que le projet devient plus sérieux dans son moteur.
Ça me rassure un peu.
Mais si j'ouvre l'app et que `Journal` ou `Today` ressemblent encore à des écrans jolis mais vides, je vais sentir tout de suite le décalage.

### Est-ce que j'y crois ?

J'y crois plus qu'à un chatbot random.
Mais je n'y crois pas encore comme à un espace qui m'accompagne vraiment tous les jours.

Pour moi, le vrai test serait :

- est-ce qu'il se souvient vraiment de ce que j'ai dit la semaine dernière ?
- est-ce qu'il me redonne un fil quand je reviens ?
- est-ce qu'il me comprend mieux qu'un simple prompt ChatGPT ?

### Ce qui me ferait revenir

- retrouver une trace claire de ce que j'ai compris
- voir que l'app avance avec moi
- sentir que ce n'est pas juste un "chat profond" mais un endroit où mon histoire s'accumule

---

## Agent B — 21 ans, étudiant, utilise déjà ChatGPT tous les jours

### Mon filtre immédiat

Je compare Noema à ChatGPT presque automatiquement.
Donc si Noema veut exister, il faut qu'il ait un avantage net.

D'après `docs/system/`, cet avantage commence à apparaître dans :

- la mémoire plus structurée
- le mapping
- la volonté d'avoir une vérité produit par domaine

Ça, c'est intéressant.
Mais tant que `Journal` et `Today` ne sont pas branchés, l'avantage reste surtout conceptuel.

### Est-ce que je paie ?

Pas tout de suite.
Pas tant que je n'ai pas senti une vraie différence d'expérience.

Je pourrais payer si je vois ça :

- session 1 : il m'aide à clarifier quelque chose
- session 2 : il reprend vraiment ce fil
- session 3 : il me montre une évolution visible quelque part

Sinon, honnêtement, je retourne vers l'outil déjà installé dans ma tête : ChatGPT + mes notes.

### Mon diagnostic

Noema est en train de devenir plus défendable techniquement.
Mais son différenciateur n'est pas encore assez visible dans l'expérience entière.

---

## Agent C — 24 ans, jeune actif, anxieux mais pragmatique

### Ce qui m'intéresse

Je m'en fiche un peu de la beauté du produit si, derrière, il m'aide vraiment à avancer.

Les docs système me donnent l'impression qu'il y a enfin une discipline :

- accès sécurisé
- quota cohérent
- contrat `_ui` qui se resserre
- travail sur la session

Ça me plaît.
Parce que ça veut dire que le projet arrête de courir dans tous les sens.

### Ce qui me manque encore

Le problème, c'est que la partie qui changerait ma vie au quotidien n'est pas encore là.

Le moment où je me dirais "ok, j'ouvre Noema ce matin", ce n'est pas à cause du backend.
C'est parce que :

- `Today` me donne un point d'entrée réel
- `Journal` garde ce que j'ai traversé
- le chat me reconnecte à un fil déjà vivant

Donc oui, le projet évolue bien.
Mais il évolue d'abord là où moi je ne le vois pas encore assez.

---

## Agent D — 26 ans, créatif freelance, attiré par les produits sensibles

### Ce que je ressens

Je suis très sensible au ton d'un produit.
Et le danger de Noema, ce serait de devenir trop "système" et de perdre son âme.

Ce que j'aime dans l'évolution actuelle, c'est qu'elle ne consiste pas juste à rajouter des features.
Elle consiste à aligner la promesse avec la réalité.

Ça, c'est élégant.

### Ce que je redoute

Je redoute deux choses :

1. que le produit devienne trop utilitaire
2. que les futures surfaces de continuité ressemblent à de la productivité déguisée

Si `next_action` devient une petite injonction froide, Noema perdra sa singularité.
Si, au contraire, `Journal` et `Today` deviennent des espaces où la conversation se dépose vraiment, alors là il peut devenir très fort.

### Mon verdict

Le projet évolue dans la bonne direction à condition de ne pas sacrifier sa texture émotionnelle au moment où il se structure.

---

## Agent E — 28 ans, déjà en thérapie, exigeant sur la profondeur

### Mon niveau d'exigence

Je ne cherche pas juste un outil de réflexion.
Je cherche quelque chose qui m'aide à tenir une continuité intérieure entre les moments de lucidité.

Donc je vois très bien la valeur potentielle de Noema.
Mais je suis aussi le plus dur avec lui.

### Ce que les docs système me font penser

Elles me donnent une impression positive :
le projet devient plus honnête.
Il reconnaît ce qui est encore mocké.
Il reconnaît ce qui est partiel.
Il reconnaît où se trouvent les contradictions.

Cette lucidité augmente ma confiance.

### Ce qui manque pour que je m'attache

Il me manque encore la preuve que le produit peut contenir un vrai parcours.

Pas juste :
"voici une bonne session".

Mais :

- voici ce qu'on a traversé
- voici ce qui a changé
- voici où tu en es aujourd'hui

Tant que cette couche n'est pas visible dans `Journal` et `Today`, je vois surtout un coeur prometteur, pas encore un compagnon complet.

---

## Le débat entre les 5 jeunes

**Agent B → Agent A** : "Je te suis sur le besoin d'être compris, mais si la différence avec ChatGPT n'est pas visible en trois sessions, la plupart des gens de notre âge ne resteront pas."

**Agent A → Agent B** : "Oui, mais la différence ne se joue pas juste sur l'intelligence de réponse. Elle se joue sur la sensation que l'app me connaît vraiment."

**Agent C → Agent D** : "Je suis d'accord avec toi sur le risque d'un produit trop froid. Mais s'il ne devient pas plus structuré, il reste juste poétique sans tenir dans le temps."

**Agent D → Agent C** : "Je veux la structure, pas la sécheresse. Si Noema se transforme en coach de tâches, il perd tout ce qui le rend désirable."

**Agent E → Tous** : "Le point central, c'est qu'on voit mieux le progrès du moteur que le progrès de la continuité vécue. Les docs système me rassurent, mais l'expérience quotidienne doit maintenant rattraper le backend."

**Agent B → Agent E** : "C'est exactement ça. Le coeur devient crédible, mais le différenciateur n'est pas encore distribué partout."

**Agent A → Tous** : "En fait, on dit tous presque la même chose : on commence à croire au projet, mais on n'habite pas encore son rythme."

---

## Verdict expérimental

Le consensus expérimental entre ces 5 profils serait :

- le projet évolue dans la bonne direction
- le sérieux du noyau devient perceptible
- la confiance augmente parce que le projet dit plus clairement la vérité sur son état
- mais la continuité visible n'a pas encore rattrapé la cohérence système

### Ce qu'ils considéreraient comme les 5 priorités les plus crédibles

1. rendre `next_action` réellement vivant hors du chat
2. brancher `Journal` sur de vraies données
3. brancher `Today` sur le même état réel
4. rendre la progression visible sans transformer Noema en outil de productivité
5. montrer rapidement la différence concrète avec ChatGPT sur 2 ou 3 retours d'usage

### Formule finale du groupe expérimental

Noema n'est plus perçu comme une simple idée élégante.
Il commence à être perçu comme un vrai projet en train de se densifier.

Mais pour des jeunes de 18 à 28 ans, le passage décisif sera celui-ci :

passer de

"il me répond bien"

à

"il me suit vraiment"
