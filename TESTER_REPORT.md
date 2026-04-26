# TESTER REPORT — Session 4
**Date :** 2026-04-20
**Agents :** 10 (5 utilisateurs + Designer UX/UI + Développeur Senior + CTO/Architecte + Analyste Produit + Investisseur)
**Score moyen : 5.9/10**

> Session 4 — Audit complet multi-profil. Cinq personas utilisateurs, quatre experts techniques et produit. Premier audit croisant expérience vécue, code, architecture, rétention et économie.

---

## Score par agent

| Agent | Profil | Score | Signal principal |
|-------|--------|-------|-----------------|
| L'Utilisateur Perdu | Étudiant 22 ans, Jour 0 | 5.5/10 | Compteur quota = contradiction structurelle |
| L'Utilisateur Avancé | Thomas, 28 ans, session 10+ | 5.5/10 | Mapping ne distingue pas session 2 de session 11 |
| L'Impatient | Kevin, 19 ans, messages 3-5 mots | 5.5/10 | Risque churn élevé, relance proactive absente |
| L'Anxieux | Post-burn-out, 26 ans | 5.5/10 | "Essai terminé" = espace safe conditionnel au paiement |
| La Perfectionniste | Claire, 35 ans, cadre | 5.5/10 | Corpus "bro performance", Journal statique dès session 7 |
| Designer UX/UI | Audit expérience | 6.0/10 | Ordre onglets inversé, empty states manquants |
| Développeur Senior | Audit code | 6.5/10 | Race condition quota, apiKey dans body HTTP, CORS wildcard |
| CTO/Architecte | Audit scalabilité | 7.5/10 | Solide jusqu'à 10k users, Redis requis avant 1k actifs |
| Analyste Produit | Rétention | 5.5/10 | Journal abandon J14, accountability loop absente |
| Investisseur | Analyse économique | 6.0/10 | Marges solides, zéro anti-abus trial, conversion non mesurée |

**Score moyen : 5.9/10**

---

## Rapports complets

---

### Agent 1 — L'Utilisateur Perdu (22 ans)

**Profil :** Étudiant en fin de master, vague sentiment d'être "en retard sur sa vie", arrive sans objectif précis. Niveau d'engagement : faible à modéré.

**Ce qui fonctionne ✅**
- L'écran Jour 0 est clair, une seule action possible, atmosphère de confiance
- La première question de Noema est excellente ("pas ce que tu devrais faire, ce qui est là")
- Les suggestions rapides de l'empty state sont bien formulées

**Ce qui ne fonctionne pas ❌**
- La pré-amorce automatique (envoyer un message en son nom) vole l'agentivité
- Le compteur de messages visible en permanence sabote la profondeur (mode économie plutôt qu'introspection)
- Le mur de paiement à 15 messages arrive trop tôt — Noema n'a pas eu le temps de créer la confiance

**Friction majeure :** Le compteur de quota transforme une conversation thérapeutique en course contre la montre. L'utilisateur calcule combien de messages il peut "dépenser" au lieu de se laisser aller à l'exploration. C'est l'exact inverse de l'intention.

**Verdict : 5.5/10** — L'intention éditoriale est remarquable mais la mécanique freemium crée une contradiction structurelle entre la promesse (espace safe, pas de pression) et l'interface (compte à rebours visible).

---

### Agent 2 — L'Utilisateur Avancé (28 ans, reconversion)

**Profil :** Thomas, 28 ans, ex-consultant en reconversion, 10 sessions accomplies, Phase 2, cherche continuité et profondeur.

**Ce qui fonctionne ✅**
- La mémoire cross-sessions est architecturalement solide (Greffier + table memory + upsert Supabase)
- La section "Progression vivante" avec récurrence de patterns est pertinente
- L'Ikigai dynamique avec détection d'Harmonie est fort visuellement

**Ce qui ne fonctionne pas ❌**
- ZenRing plafonne à step/6 mais le prompt parle d'étape /10 — incohérence directe visible par l'utilisateur
- Les barres de force calculées par comptage de mots-clés naïf peuvent afficher 20% pour une force présente depuis 8 sessions — perçu comme du théâtre
- Aucune indication temporelle de progression entre sessions — label "Stratège" depuis 5 sessions, rien ne change

**Déception principale :** Thomas ouvre le Mapping à session 11. La page lui dit exactement la même chose qu'à session 7. L'architecture mémoire est réelle, mais l'interface Mapping ne la valorise pas. C'est un écart entre back-end et front-end : la richesse accumulée reste invisible.

**Verdict : 5.5/10** — Architecture mémoire réelle mais interface Mapping ne distingue pas session 2 de session 11. L'utilisateur avancé est le premier à partir parce qu'il est assez expert pour détecter le plafond.

---

### Agent 3 — L'Impatient (19 ans)

**Profil :** Kevin, 19 ans, sans emploi, messages de 3-5 mots, zéro tolérance à la frustration.

**Conversation simulée :**

| Lui | Noema attendue |
|-----|----------------|
| *(pré-amorce auto)* | "Qu'est-ce qui occupe le plus de place dans ta tête ?" |
| "chais pas" | Reflet + 1 question courte (≤5 mots) |
| "le taf" | "Le taf comme problème, ou comme manque ?" |
| "les deux" | "Lequel des deux te pèse le plus ce soir ?" |
| "jsp" *(ferme l'appli)* | — |

**Ce qui fonctionne ✅**
- La règle des 5 mots est bien codée dans le prompt
- La pré-amorce Jour 0 évite le blanc paralysant

**Ce qui ne fonctionne pas ❌**
- Page Aujourd'hui inutile pour Kevin à Jour 0 : cartes de stats vides, question du jour en écriture serif décontextualisée
- Aucune mécanique de relance proactive après abandon — il ferme, l'appli disparaît de sa vie
- Ton serif/italique crée une dissonance de registre avec ses SMS — ressenti comme "une appli pour les gens sérieux, pas pour moi"

**Risque de churn : Élevé**

**Verdict : 5.5/10** — Le prompt est calibré pour lui mais l'interface environnante (Today vide, typographie) l'exclut subtilement. La mécanique de relance proactive après silence est le fix le plus impactant pour ce profil.

---

### Agent 4 — L'Anxieux (26 ans, post-burn-out)

**Profil :** Post-burn-out, fragile, besoin d'espace sans jugement.

**Ce qui le rassure ✅**
- Ton du prompt genuinement doux, interdit le remplissage émotionnel creux
- Écran Jour 0 sobre et non-injonctif
- Message de retour après absence ("L'important c'est que tu sois là") est humain et calibré

**Ce qui l'inquiète ❌**
- Suggestions de démarrage trop cliniques ("comprendre ce qui me freine") — aucune option douce type "je veux juste parler" ou "je suis fatigué"
- Compteur quota visible = autocensure de chaque message : il calcule la dépense, il ne lâche pas prise
- Question du jour sur Today peut être brutalement confrontante avant que toute relation soit établie

**Moment de rupture :** Le champ input qui affiche "Essai du jour terminé". L'espace safe était conditionnel à un paiement. Il ne quitte pas en colère — il quitte en se sentant naïf d'avoir cru que c'était pour lui. Ce départ silencieux est le plus dangereux.

**Verdict : 5.5/10** — Le plus fragile des utilisateurs et le plus susceptible de partir sans bruit. Noema l'accueille bien mais le met à la porte trop tôt, avec trop peu de cérémonie pour l'offboarding freemium.

---

### Agent 5 — La Perfectionniste (35 ans, cadre)

**Profil :** Claire, 35 ans, directrice projets, a lu Frankl/Csikszentmihalyi/Sinek, ne supporte pas le vague.

**Attente vs Réalité :**

| Attente | Réalité |
|---------|---------|
| IA qui s'adapte à son niveau de sophistication | Corpus prompt = Hill, Robbins, Kiyosaki — corpus "bro performance" qu'elle a déjà rejeté |
| Journal qui évolue après 30 sessions | Mêmes 5 FALLBACK_PROMPTS génériques en session 3 ou en session 35 |
| Mapping qui montre des patterns non-évidents | Barres de force à 68% sans explication de leur provenance — perçu comme du théâtre |

**Ce qui fonctionne ✅**
- Structure du prompt réellement sophistiquée (Phase 1/2, ordre de travail, jamais deux questions)
- La continuité inter-sessions est honnête et rare dans le marché

**Ce qui déçoit ❌**
- Corpus de références ciblant le mauvais public — Hill/Robbins sont des repoussoirs pour ce persona, pas des attracteurs
- Journal statique identique de session 1 à session 30 — elle se sent réduite à une base de données non consultée
- Mapping sans interprétation clinique : données sans fils narratifs, barres sans provenance

**Trajectoire :** Claire donne une chance sérieuse — elle paie probablement. Elle abandonne à session 7-9 quand le Journal lui repose la même question décontextualisée pour la cinquième fois. Elle part sans se plaindre, avec la conviction que l'IA "n'est pas encore là".

**Verdict : 5.5/10** — Paradoxe : la perfectionniste est le persona le plus proche de l'utilisateur idéal de Noema (sophistiquée, introspective, long terme) et c'est pourtant elle qui reçoit les contenus les moins adaptés à son profil.

---

### Agent 6 — Designer UX/UI — Audit Expérience

**Note onboarding : 5/10 — Note design system : 7.5/10 — Note globale : 6/10**

**Points forts design ✅**
- Atmosphère visuelle cohérente (blobs phase-réactifs, serif/sans-serif, Framer Motion)
- Phase-awareness omniprésent et cohérent (couleur accent, ZenRing, transitions)
- Empty state Jour 0 bien pensé (page dédiée, CTA unique, pré-amorce active)

**Problèmes UX critiques ❌**

**1. Ordre des onglets — PRIORITÉ ABSOLUE**
Chat est en position 1, Aujourd'hui est en position 4. L'utilisateur découvre l'app par un Chat vide au lieu de Today qui contextualise l'ensemble du produit. Fix : réordonner NAV_TABS, mettre Today en 1er, changer `initialTab`.

**2. Scroll Today — contenu coupé**
`paddingBottom: 80px` insuffisant — le dernier contenu disparaît sous la bottom nav. Fix : `paddingBottom: 120px` minimum.

**3. Input quota épuisé — confusion d'état**
La textarea reste visible et cliquable même quand l'utilisateur est bloqué. L'utilisateur tape, rien ne se passe, il se demande si l'appli est cassée. Fix : remplacer par un composant `UpgradeBar` distinct quand `isBlocked`.

**4. Mapping Jour 0 — wireframe syndrome**
Page entière vide avec orbs génériques. Ressemble à un écran de démo non finalisé. Fix : état "Mapping en construction" global quand `step < 2`, une seule carte centrée avec message d'attente.

**5. Skeleton loaders Today — transition brutale**
Loading state trop discret (juste "Chargement…"), passage blanc visible sur connexion lente. Fix : 3-4 skeleton cards pulsées.

**Empty states manquants :**
- État global Mapping pour `step < 2`
- Skeleton loaders Today
- État "première session en cours" côté UI Chat

**Incohérences design system :**
- Tailles de texte hardcodées dans MappingV2 (hors token)
- Bottom nav couleur fixe, non phase-aware (seul composant qui ne suit pas l'accent)
- `ghostBtn` non partagé — réimplémenté à plusieurs endroits

**Priorité absolue : Réordonner les onglets — Today en premier.** Seul fix qui change structurellement la compréhension du produit dès la première minute, sans toucher au code métier.

---

### Agent 7 — Développeur Senior — Audit Code

**Qualité globale : 6.5/10**

**Risques critiques 🔴**

**1. greffier.js L.339 — apiKey dans le body HTTP**
Si le handler est exposé ou loggé, n'importe quel appelant peut injecter sa propre clé Anthropic et consommer le quota d'un autre compte. Fix : lire exclusivement `process.env.ANTHROPIC_API_KEY`, ne jamais accepter la clé depuis le body.

**2. claude.js L.367 — CORS wildcard `*`**
N'importe quel site tiers peut appeler le handler et consommer le quota utilisateur. Vecteur d'abus non authentifié. Fix : restreindre à l'origine de production exacte (`https://noema.app` ou équivalent).

**3. claude.js L.220 — Race condition quota**
Deux requêtes simultanées (double-tap, réseau lent + retry) peuvent toutes deux lire le compteur sous la limite avant que l'une ne l'incrémente. Résultat : dépassement de quota silencieux. Fix : `UPDATE quota SET count = count + 1 WHERE user_id = $1 AND count < $2 RETURNING count` — incrément atomique SQL.

**Dette technique 🟡**

- `inMemoryUserRateLimit` non persisté entre instances serverless — protection illusoire en production multi-instance
- `buildServerMemoryContext` dupliquée intentionnellement — divergence silencieuse possible si l'une est mise à jour et pas l'autre
- Parsing JSON Greffier fragile (préfixe `{` concaténé manuellement) — échec silencieux si le modèle change de format de sortie
- `TODAY` calculé à l'import module — bug date sur PWA utilisée sans rechargement entre deux jours (session ouverte le soir, rouverte le lendemain)

**Points solides ✅**
- Séparation d'accès pure entre handlers
- Whitelisting strict du payload Anthropic (pas d'injection possible depuis le front)
- Robustesse Greffier : timeout implémenté, erreurs swallowed proprement

**Testabilité : 3.5/10** — Aucun test unitaire sur les fonctions pures (calcul quota, parsing mémoire). Handler non injectable. Impossible de tester le comportement Greffier sans appel réseau réel.

**Recommandation prioritaire : Race condition quota → incrément atomique SQL.** C'est à la fois une fuite de revenus (dépassements gratuits) et un vecteur d'abus.

---

### Agent 8 — CTO/Architecte — Audit Scalabilité

**Note architecture : 7.5/10**

**Capacité par palier :**

| Palier | Faisabilité | Condition |
|--------|-------------|-----------|
| 1 000 users | ✅ Sans changement | — |
| 10 000 users | ⚠️ Avec 2 ajustements | Rate limit persisté + pool DB |
| 100 000 users | ❌ Réécriture partielle | Queue async, cache applicatif, séparation Greffier |

**Risques architecturaux 🔴**

**1. inMemoryUserRateLimit non persistée multi-instances**
En Netlify Functions, chaque instance a sa propre mémoire. La rate limit in-process est invisible aux autres instances. Un utilisateur peut atteindre N fois la limite si N instances existent simultanément. Seuil critique : ~500 users actifs simultanément.

**2. 7-8 roundtrips Supabase par message**
Chaque message déclenche : lecture session, lecture mémoire, lecture quota, écriture message, écriture quota, écriture mémoire (Greffier), écriture session. À partir de ~2 000 users actifs/jour, le pool de connexions Supabase sature. Fix : transactions regroupées, connexion pooler (PgBouncer activé).

**3. Double appel Anthropic synchrone dans la même Function**
Haiku (réponse) + Sonnet (Greffier) en série dans le même handler. Durée totale : 8-15 secondes. À ~1 000 subscribers actifs, les coûts Netlify (facturation à la durée) explosent et les timeouts Function apparaissent. Fix : Greffier en tâche asynchrone découplée (queue ou webhook).

**Décisions solides ✅**
- Séparation frontend/backend propre, zéro couplage
- Modèle Haiku/Sonnet + prompt caching : économie 60-80% sur les tokens contextuels
- Greffier différencié par tier avec timeout résilient — ne bloque jamais la réponse principale

**Prochaine dette avant 1 000 users actifs : Redis/Upstash pour rate limit.** Environ 3€/mois, 20 lignes de code, protection réelle multi-instance. C'est le ratio effort/impact le plus favorable de toute la liste.

---

### Agent 9 — Analyste Produit — Rétention

**Score rétention global : 5.5/10**

**Matrice valeur/risque par surface :**

| Surface | Valeur J1 | Valeur J30 | Valeur M6 | Risque abandon |
|---------|-----------|------------|-----------|----------------|
| Zen/Today | Forte | Moyenne | Faible | Élevé après J30 |
| Chat | Très forte | Forte | Moyenne à forte | Modéré |
| Mapping | Moyenne | Forte | Forte | Faible à moyen |
| Journal | Faible | Moyenne | Faible | Très élevé dès J14 |

**Feature manquante prioritaire : Accountability loop**
Le champ `next_action` est déjà persisté en base. Il suffit de le remonter dans le prompt d'ouverture de session : "La dernière fois tu voulais [X]. L'as-tu fait ?" C'est la boucle qui transforme Noema de journal en coach. Effort d'implémentation : 1 journée. Impact rétention : fort.

**Onglet à risque : Journal (abandon dès J14)**
Aucune mécanique pull. Dépendance totale au Chat pour générer du contenu Journal. Si le Chat ralentit, le Journal devient un historique statique que personne ne consulte.

**Onglet le plus précieux : Mapping**
Attachement identitaire profond. Plus l'utilisateur a de sessions, plus le Mapping lui ressemble, plus le switching cost est élevé. C'est le vrai fossé concurrentiel de Noema — à condition que l'interface le valorise (voir Agent 2).

**3 mécaniques de rétention prioritaires :**

1. **Accountability loop en début de session** — reprendre le `next_action` précédent, demander si c'est fait. Crée la preuve que Noema "se souvient vraiment".
2. **Notification "signal faible" à J3 sans activité** — basée sur le `next_action`, pas sur un streak gamifié. "Tu voulais appeler ton frère. C'est fait ?" — humain, pas comportemental.
3. **"Réveil du Mapping" à session 3** — quand `hasRecurringThemes` passe à `true`, notification ou badge : "Noema a détecté quelque chose qui revient souvent dans tes sessions." Crée l'événement qui justifie le retour.

---

### Agent 10 — Investisseur — Analyse Économique

**Estimation coût subscriber : ~2.50-3.00 €/mois**
**Estimation coût trial actif : ~0.90 €/mois** (coût sans revenu)
**Marges brutes estimées : 81% à 100 abonnés → 84% à 10 000 abonnés**

**Risques économiques 🔴**

**1. Greffier sur Sonnet tous les 2 messages**
Environ 50% des appels de traitement en Sonnet (coût 5× Haiku). Si Anthropic augmente les prix Sonnet de 30%, la marge se compresse immédiatement. Mitigation : basculer Greffier sur Haiku avec prompt renforcé, mesurer la perte de qualité mémoire.

**2. Zéro anti-abus trial**
N comptes email différents = N trials gratuits infinis. Aucune déduplication IP, device, ou fingerprint. À l'échelle, c'est une fuite de revenus non linéaire. Fix minimal : rate limit IP par jour sur la création de compte.

**3. Webhook Stripe sans réconciliation**
Un abonné payant peut rester bloqué en `trial` si le webhook Stripe échoue (timeout, cold start). Il paie, il ne peut pas utiliser. Support coûteux, churne immédiatement à la résolution. Fix : job de réconciliation quotidien Stripe ↔ Supabase.

**Forces ✅**
- Architecture Haiku/Sonnet + prompt caching : décision rare à ce stade, prouve une maturité opérationnelle
- Conversion freemium basée sur l'investissement utilisateur (effet IKEA) — le Mapping devient personnel, difficile d'abandonner
- Pricing annuel intégré dès le lancement — meilleur signal de qualité que mensuel seul

**Question décisive pour le dossier :** Taux de conversion trial → subscriber à J+7 et J+30. Tout le reste est secondaire.

**Verdict :** Pas encore investissable, mais dossier à surveiller dans 60 jours. Conditions de levée : taux de conversion mesuré + correctif anti-abus trial démontré.

---

## Débat Final

---

### Question 1 — Noema tient-elle sa promesse "Tu n'as pas raté ta vie" ?

**Pour (arguments positifs) :**
- La qualité du prompt est genuinement rare. La règle "jamais deux questions", l'interdiction du remplissage émotionnel creux, la sensibilité Phase 1/Phase 2 — ce sont des choix éditoriaux sophistiqués que peu d'apps font.
- La mémoire cross-sessions est réelle et architecturalement honnête. Noema se souvient. C'est une promesse que la majorité des concurrents ne peuvent pas tenir.
- L'Ikigai dynamique et la détection d'Harmonie sont des visuels qui donnent du sens à la durée.

**Contre (arguments critiques) :**
- Cinq personas sur cinq attribuent 5.5/10. Ce n'est pas de la déception — c'est de la frustration de potentiel. Ils voient ce que Noema pourrait être et mesurent l'écart.
- Le compteur de quota visible transforme la conversation en calcul. On ne peut pas promettre "tu n'as pas raté ta vie" tout en affichant "il te reste 8 messages".
- Le corpus de références (Hill, Robbins, Kiyosaki) contredit la promesse éditoriale pour tout utilisateur cultivé. La promesse dit : "je te vois". Le corpus dit : "j'ai lu les mêmes bestsellers que ton manager".
- Le Journal est statique. La promesse implique une évolution. Si session 35 ressemble à session 5, la promesse est trahie en silencio.

**Synthèse :** Noema tient sa promesse dans les premières sessions (Jour 0-3) et dans l'architecture (mémoire réelle). Elle ne la tient pas dans la durée (Journal statique, Mapping figé, corpus inadapté). La promesse est vraie en intention, incomplète en exécution.

---

### Question 2 — Quel est l'onglet le plus dispensable ?

**Journal (consensus majoritaire) :**
- Abandon dès J14 selon l'analyste produit
- Contenu généré statiquement, mêmes FALLBACK_PROMPTS de session 1 à 30
- Aucune mécanique pull — dépend entièrement du Chat pour exister
- Perçu comme "résumé de ce que j'ai déjà dit" sans interprétation ajoutée

**Today (argument minoritaire) :**
- Inutile à Jour 0 (Kevin : cartes vides, question décontextualisée)
- Valeur décroissante après J30 selon la matrice rétention
- MAIS : Today est la surface d'entrée recommandée (priorité #1 UX) — le problème n'est pas l'onglet, c'est sa position et son état vide

**Verdict :** Journal est l'onglet le plus dispensable dans son état actuel. Today est mal positionné mais structurellement nécessaire. Si les ressources sont contraintes, investir dans la profondeur du Chat et du Mapping avant de sauver le Journal.

---

### Question 3 — Quelle est la priorité absolue pour les 30 prochains jours ?

**Arguments pour "corriger le compteur quota" (profils utilisateurs) :**
Cinq personas sur cinq sont affectés. C'est la friction la plus universelle. Un compteur caché ou supprimé ne change rien à la limite technique mais change tout à l'expérience vécue.

**Arguments pour "réordonner les onglets" (UX) :**
Fix de 30 minutes. Impact immédiat sur 100% des nouveaux utilisateurs. Actuellement, chaque nouvel utilisateur arrive sur un Chat vide au lieu de Today qui contextualise le produit.

**Arguments pour "race condition quota" (Dev Senior) :**
Risque de sécurité et fuite de revenus actifs. Deux lignes SQL. Ne pas livrer en production sans ce fix.

**Arguments pour "accountability loop" (Analyste Produit) :**
Feature manquante à fort impact rétention. `next_action` est déjà persisté. Une journée de travail pour changer le taux de J+7.

**Synthèse :** Il n'y a pas une priorité, il y a un bloc de 4 actions qui doivent toutes être faites avant toute autre chose :
1. Race condition quota — sécurité non négociable
2. Réordonner les onglets — impact onboarding immédiat
3. Cacher le compteur quota (ou le déplacer hors du Chat)
4. Accountability loop — rétention J+7

Tout le reste peut attendre 30 jours.

---

## Verdict Final Claude

### Score global : 5.9/10

Ce score reflète un produit qui a une âme rare et une exécution incomplète. Les fondations sont solides (architecture mémoire, prompt sophistiqué, modèle économique viable). Les fissures sont systémiques (interface qui contredit la promesse, rétention non mécanisée, dette technique active).

---

### 10 actions prioritaires (ordre strict)

**1. Race condition quota → incrément atomique SQL**
`UPDATE quota SET count = count + 1 WHERE user_id = $1 AND count < $2 RETURNING count`
Deux lignes. Sécurité et intégrité revenus. Livrer avant toute autre chose.

**2. Réordonner les onglets — Today en position 1**
Modifier `NAV_TABS` et `initialTab`. 30 minutes de travail. Impact : 100% des nouveaux utilisateurs voient Today en premier au lieu d'un Chat vide. Fix structurel le plus impactant per heure investie.

**3. Cacher le compteur quota hors du Chat**
Le compteur peut rester dans les Settings ou dans une modale dédiée. Dans le Chat, il transforme la conversation en calcul. Sa suppression ne change pas la limite — elle change l'intention perçue.

**4. Accountability loop en début de session**
Remonter `next_action` dans le prompt d'ouverture. "La dernière fois tu voulais [X]. L'as-tu fait ?" Une journée d'implémentation. Premier mécanisme qui crée la boucle coach/utilisateur et justifie le retour quotidien.

**5. Fix CORS — restreindre l'origine de production**
Remplacer le wildcard `*` par l'URL de production exacte. Protection immédiate contre le détournement de quota depuis des sites tiers.

**6. Remplacer apiKey dans le body HTTP (greffier.js L.339)**
Lire exclusivement `process.env.ANTHROPIC_API_KEY`. Éliminer le vecteur d'injection de clé externe.

**7. État "Mapping en construction" pour step < 2**
Une seule carte centrée avec message d'attente. Supprime le wireframe syndrome qui érode la confiance des nouveaux utilisateurs avant même la fin de la première session.

**8. Remplacer le textarea bloqué par un composant UpgradeBar**
Quand `isBlocked`, afficher un composant dédié avec CTA upgrade. Supprimer l'état "je tape mais rien ne se passe".

**9. Redis/Upstash pour rate limit persisté multi-instances**
~3€/mois, ~20 lignes de code. Remplacement de l'`inMemoryUserRateLimit`. À implémenter avant de dépasser 500 users actifs simultanément.

**10. Anti-abus trial — rate limit IP création de compte**
Bloquer la création de N comptes email depuis la même IP dans une fenêtre de temps. Fix minimal avant de lancer une acquisition payante.

---

### Ce qui est solide — ne pas toucher

- **Architecture Haiku/Sonnet + prompt caching** — décision d'optimisation rare à ce stade, économie 60-80% sur les tokens, ne pas dégrader
- **Prompt principal** — la sophistication (Phase 1/2, jamais deux questions, interdiction du remplissage creux, règle des 5 mots) est un actif éditorial différenciant
- **Mémoire cross-sessions (Greffier + Supabase)** — l'architecture est solide, le `upsert` avec embeddings est le bon modèle
- **Écran Jour 0 et pré-amorce** — l'empty state dédié avec CTA unique est bien pensé, ne pas complexifier
- **Ikigai dynamique avec détection d'Harmonie** — visuellement fort, attachement identitaire réel
- **Séparation frontend/backend** — propre, sans couplage, facilite les futures évolutions
- **Pricing annuel intégré** — signal de qualité, meilleur LTV, ne pas retirer
- **Timeout Greffier résilient** — ne bloque jamais la réponse principale, pattern correct à conserver

---

*TESTER REPORT Session 4 — 2026-04-20 — 10 agents — Score moyen 5.9/10*
