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
