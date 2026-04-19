# TESTER REPORT — Noema
**Date :** 2026-04-19 · **Session 3** · **8 agents** (6 utilisateurs + 1 analyste prompt/phases + 1 expert sémantique)

> Session 3 — Analyse post-correctifs. Tous les agents ont lu le code réel.

---

## Agent 1 — Lucas (Utilisateur Perdu, Jour 0-1)

**Profil :** Étudiant en psycho, 22 ans, légèrement sceptique. Arrive depuis une story Instagram.

**Ce qui fonctionne ✅**
- TodayV2 Jour 0 : early return propre, condition `sessionCount === 0` solide, CTA vers Chat présent
- Label "Exploration · Phase 1" remplace "PERDU" — psychologiquement beaucoup moins chargé
- TRIAL_DAILY_LIMIT à 15 — la limite de 8 était absurde, 15 donne le temps d'arriver à quelque chose
- Onboarding Slide 2 : cartes Chat/Mapping/Journal lisibles, descriptions sans corporate speak
- Slide 3 : bullets anti-clichés ("Pas de diagnostic / Pas de conseil standard / Pas d'objectif imposé") — désamorce les résistances

**Ce qui ne fonctionne pas ❌**
- Écran Jour 0 sans prénom — `firstName` est calculé mais non utilisé dans l'early return. Premier moment où Noema s'adresse à moi et elle ne sait pas qui je suis
- "Chaque session compte" en Slide 2 — je n'ai encore eu aucune session. Cette accroche n'a aucun ancrage dans mon vécu
- "Ta première question t'attend" en Slide 4 sans livrable : j'arrive dans le Chat et Noema ne m'a pas encore parlé. La promesse est creuse
- Pas de pré-amorce Chat depuis le CTA Jour 0 — l'interface s'ouvre vide, sans message d'ouverture
- Durée d'une session non mentionnée — l'ambiguïté temporelle crée de l'évitement

**Ce qui devient redondant après 1 semaine ⚠️**
- Slides 3 et 4 de l'onboarding — pertinentes au Jour 0, sans valeur de re-lecture
- Le label "Exploration · Phase 1" peut devenir anxiogène si la progression est invisible sur 10+ sessions

**Ma recommandation :** Injecter le prénom dans l'écran Jour 0. Pré-amorcer le Chat avec un message d'ouverture de Noema quand on arrive depuis ce CTA. Ce sont deux lignes de code, et elles changent tout.

**Mon verdict : 6,5/10**

---

## Agent 2 — Camille (Utilisatrice Avancée, 10+ sessions)

**Profil :** Ex-ingénieure en reconversion coaching. Cherche de la profondeur et détecte immédiatement si un dashboard ment.

**Ce qui fonctionne ✅**
- `computeForceStrengths()` : calcul sur données réelles, fallback progressif honnête, plafond 95% sage
- Ikigai dynamique (42%-72%) : logique de taille lisible, indicateurs de complétion honnêtes
- `buildHarmonieText()` : texte personnel basé sur les données réelles, non-générique
- `buildProgressSignals()` : fonctions pures, priorité blocages > contradictions > forces — bonne sémantique coaching
- ZenRing step/6 : corrigé, plus de bug de progression
- Empty states avec CTA : invite à la session plutôt que le vide mort
- Historique "Ton parcours" : timeline propre, date + note, pas d'over-engineering

**Ce qui ne fonctionne pas ❌**
- Barres de blocage hardcodées : `BLOCAGE_CONFIG` avec barW à 85%/50%/30% fixes. Un blocage apparu une seule fois lit "85% — Critique". Le problème qu'on a corrigé sur les forces existe toujours sur les blocages
- Titre "Harmonie détectée" toujours affiché même quand ikigaiFilledCount < 2 — le titre JSX n'est pas conditionnel, seul le contenu intérieur l'est. Mensonge d'en-tête visible
- `getStepLabel()` sans accents : "Stratege", "Premiere", "precedente" dans les strings — visible à l'écran
- `buildMovementSummary()` basée sur delta de step opaque — l'utilisateur ne peut pas vérifier ce chiffre
- PastEntryCard non expandable : annoncée comme telle dans les notes, mais c'est une liste statique sans toggle

**Ce qui devient redondant après 1 mois ⚠️**
- ZenRing à 100% depuis longtemps sans mécanisme de cycle
- CTA "Explorer en session →" partout une fois les sections remplies — bruit commercial dans un espace psychologique
- `buildHarmonieText()` : 3 patterns limités, texte identique à chaque visite une fois l'ikigai stable

**Ma recommandation :** Trois correctifs urgents — barres de blocage dynamiques (même logique que forces), titre "Harmonie détectée" conditionnel, PastEntryCard expandable livrée.

**Mon verdict : 6,5/10**

---

## Agent 3 — Thomas (Sceptique Technique)

**Profil :** Développeur fullstack, 30 ans. Cherche les failles réelles.

**Ce qui fonctionne ✅**
- `memRow` remplace `body.user_memory` dans `runGreffier` — vecteur de contamination mémoire fermé
- Greffier `/2` effectif — se déclenche aux messages 2, 4, 6...
- Hybride Haiku/Sonnet implémenté, tiering MAX_TOKENS non bypassable par le client
- `pickTop minCount = 1` : les signaux apparaissent dès la 1ère session
- Sécurité entitlements : résolution complète côté backend

**Ce qui ne fonctionne pas ❌**
- Commentaire trompeur sur MODEL_HEAVY : le commentaire dit "Sonnet lors des synthèses Greffier" mais Sonnet est utilisé pour la RÉPONSE principale, Haiku pour la SYNTHÈSE. C'est l'inverse. Pas un bug bloquant, mais une confusion architecturale documentée à tort
- `greffier.js` ignore MODEL_HEAVY — le modèle n'est pas passé en paramètre, le Greffier hardcode toujours Haiku
- Race condition latente sur le quota — lecture → calcul → upsert sans transaction. Deux requêtes simultanées peuvent bypasser la limite

**Ce qui est techniquement fragile ⚠️**
- Greffier bloque la réponse finale malgré le parallélisme apparent — `await greffierPromise` ligne 292 attend jusqu'à 5,9s après la réponse Sonnet
- Prefill `{` dans le Greffier — parsing fragile si Haiku génère un commentaire avant l'accolade
- `normalizeBloom` peut déclencher un bloom sur un blocage déjà en mémoire — la déduplication est demandée au modèle, pas garantie par le code
- Sessions sans `session_id` → Greffier skip silencieux sans log
- `inMemoryUserRateLimit` Map non bornée — fuite mémoire progressive en prod

**Ma recommandation :** Corriger le commentaire MODEL_HEAVY, borner la Map rate limit, logger un warning quand session_id est absent.

**Mon verdict : 6,5/10**

---

## Agent 4 — Analyste Produit (Rétention)

**Profil :** Growth PM senior, 8 ans sur des apps à fort volume.

**Ce qui fonctionne ✅**
- JournalV2 PastEntryCard : mémoire longitudinale enfin présente, bon emplacement (dans l'écran d'écriture)
- TodayV2 Jour 0 : cold start traité, CTA clair
- Messages de retour `daysSinceLastSession` : humains, non-culpabilisants, réduisent le non-retour après absence courte
- MappingV2 CTA "Explorer en session →" sur Forces ET Blocages — bons endroits pour déclencher une session
- Pricing "Personal value card" : stats personnalisées avant le paywall, levier de conversion réel

**Ce qui ne fonctionne pas ❌**
- "Ton parcours" sans empty state pour les nouveaux — disparaît silencieusement sans données
- PastEntryCard inexistant au Jour 1 — le premier jour, l'utilisateur ne voit aucune promesse de mémoire
- `daysSinceLastSession` calculé sur `lastJournalEntry?.entry_date` au lieu de `latestSession?.ended_at` — si l'utilisateur fait une session sans journal, le message de retour ne s'affiche jamais
- Offre annuelle potentiellement bloquée si `VITE_STRIPE_PRICE_ANNUAL` non défini en prod

**Risques de rétention ⚠️**
- **Semaine 2** : Mapping vide si < 3-4 sessions dans les 14 premiers jours — l'utilisateur ne comprend pas que c'est de sa faute
- **Mois 1** : Journal déconnecté du Chat en navigation directe — devient un simple éditeur de texte sans contexte
- **Mois 3** : Pas de nudge actif entre sessions — tout le mécanisme de retour est passif, l'utilisateur doit revenir seul
- Paywall à J3-J5 sans "mur doux" (compteur de messages restants contextuel)

**Ma recommandation :** Corriger daysSinceLastSession, ajouter empty state sur "Ton parcours", ajouter un message de réactivation dans le Journal.

**Mon verdict : 6,5/10**

---

## Agent 5 — Analyste Prompt & Phases (NOUVEAU)

**Profil :** Expert en accompagnement thérapeutique et design de produits conversationnels. Références : CNV, ACT, questionnement socratique.

### Verdict de premier niveau

L'impression de l'utilisateur est **partiellement fondée**. Noema ne fait pas *que* poser des questions — il y a une architecture de progression réelle. Mais le prompt a des lacunes thérapeutiques significatives : il manque de **techniques d'intervention actives** pour le moment où un blocage est nommé. L'outil sait *cartographier*, mais pas encore *travailler*.

**Ce qui fonctionne ✅**
- Architecture de progression Phase 1/2 définie, ordre de travail logique
- Accountability Phase 2 : "consolider", "confronter", "détecter" — verbes opérationnels présents
- Règle 5 mots bien câblée
- Bloc `<_ui>` : détection à 3 niveaux (racine / entretien / visible) — sophistiqué

**Ce qui ne fonctionne pas ❌**

**Problème central — Phase 1, étape 3 :**
```
"1. COMPRENDRE D'ABORD — Juste des questions et de l'écoute."
"3. TRAVAILLER LES BLOCAGES — tu accompagnes la personne à les comprendre et les dépasser progressivement."
```
"Juste des questions et de l'écoute" est prescriptif et exclusif. Il n'y a **aucun verbe opérationnel** sur *comment* travailler un blocage. "Comprendre et dépasser progressivement" est une intention, pas une instruction thérapeutique.

**Techniques absentes du prompt :**
- Validation émotionnelle préalable avant d'explorer
- Reflet confrontant (reformulation qui met la contradiction au centre)
- Test de réalité / questionnement socratique dirigé sur une croyance identifiée
- Distinction désir/besoin (CNV)
- Projection temporelle (ACT)
- Exercice en session (pas juste en clôture)
- Permission de nommer une croyance limitante explicitement

**Différenciation des phases insuffisante :** Les phases se différencient dans le tempo et le ton, mais pas dans les techniques d'intervention. La Phase 1 n'a aucun verbe d'action concret sur les blocages contrairement à la Phase 2.

**Règle de discrétion trop restrictive :** "Tu ne révèles pas tout ce que tu détectes" s'applique aussi aux croyances limitantes centrales — ce qui empêche le travail en profondeur.

**5 blocs de prompt à implémenter :**

**BLOC A — Remplacement étape 3 Phase 1 :**
```
3. TRAVAILLER LES BLOCAGES — Quand une racine est identifiée, tu n'enchaînes pas
sur une nouvelle question. Tu travailles :
   a) Tu valides d'abord l'état émotionnel sans l'analyser immédiatement.
   b) Tu proposes un reflet confrontant : reformulation qui met la contradiction
      au centre, sans juger. La personne répond au reflet, pas à une question.
   c) Tu testes la croyance limitante en la nommant et posant UNE question de réalité.
      ("Tu dis que tu n'as pas ta place là. Est-ce qu'il y a une seule situation
      où ce n'était pas vrai ?")
   d) Parfois tu proposes une micro-expérience en session : "Complète cette phrase :
      'Ce que j'ai vraiment peur de perdre si j'avance, c'est...'" — sans analyse
      immédiate.
```

**BLOC B — Permission de nommer :**
```
Tu ne révèles pas tout ce que tu détectes — mais quand un blocage racine est clair
et confirmé sur plusieurs échanges, tu le nommes. Pas comme un diagnostic, comme
une observation partagée : "J'entends quelque chose qui revient souvent — est-ce
que je peux le mettre en mots ?" Puis tu le nommes simplement. C'est un acte
thérapeutique, pas une violation de discrétion.
```

**BLOC C — Réponse aux blocages actifs (transversal) :**
```
Quand la personne exprime un blocage, une peur ou une résistance : tu ne sautes
pas à une question d'exploration. Tu valides d'abord ("C'est un endroit difficile
à regarder."), puis tu choisis entre :
  — un reflet confrontant
  — une question de réalité ciblée sur la croyance identifiée
  — une micro-expérience en session
  — le silence relatif (2 phrases max, tu laisses)
"Qu'est-ce qui se passe pour toi avec ça ?" n'est pas du travail — c'est du
remplissage. Ne jamais poser une question générale sur un blocage spécifique.
```

**BLOC D — Accountability Phase 2 renforcée :**
```
1. CONSOLIDER — Au début de chaque session Phase 2, tu reprends le blocage racine.
Tu poses une question de vérification concrète : "La dernière fois, on avait
identifié X comme frein central. Depuis, est-ce que tu as vu ce frein se
manifester ?" Si oui, tu travailles le blocage avant de passer à l'action.
Tu confrontes sans juger : "Tu m'as dit que tu allais faire X. Tu ne l'as pas
fait. Qu'est-ce qui s'est passé exactement ?" Et tu restes là jusqu'à ce que
la vraie raison soit nommée.
```

**BLOC E — Distinction désir/besoin :**
```
Quand tu explores les blocages liés aux choix de vie ou à l'identité
professionnelle, tu distingues désir et besoin. Quand tu sens que la personne
confond les deux, tu poses : "Si tu atteignais exactement ce que tu décris là —
est-ce que tu te sentirais vraiment à ta place ?" La réponse est souvent la clé
du blocage réel.
```

**Priorité d'implémentation :** C → A → B → D → E

**Mon verdict : BLOC C est la modification la plus impactante — effet immédiat sur toutes les sessions, toutes phases confondues.**

---

## Agent 6 — Expert Sémantique

**Profil :** Expert NLP, pipelines embedding+pgvector en production sur Supabase.

**Pertinence :** Réelle mais conditionnelle. La valeur est haute pour les utilisateurs >15 sessions, nulle pour les nouveaux. L'approche fréquence actuelle est suffisante jusqu'à ~15 sessions par utilisateur.

**Cas d'usage non couverts par la fréquence :**
- Même blocage formulé différemment sur 2 sessions → zéro match actuel, similarité cosinus ~0.87
- Ikigai fragmenté ("ce qui m'anime" / "ma passion" / "ce qui me fait vibrer") → 3 entrées séparées, non agrégées
- Émergence thématique lente sur 4 mois → aucune session ne dépasse minCount seule

**Architecture complète proposée :**
- Table `session_embeddings` avec pgvector (1536 dims, index HNSW)
- Modèle : `text-embedding-3-small` OpenAI ($0.02/M tokens, excellent en français)
- Génération : fire-and-forget à la fin de chaque run Greffier
- Intégration : `buildServerMemoryContextWithSemantic()` — requête cosinus sur le dernier message utilisateur, résultats injectés dans le contexte

**Complexité : 3/5 — Valeur : 3.5/5**

**Recommandation : PRÉMATURÉ maintenant. Implémenter en Q3/Q4 quand la base aura suffisamment de sessions par compte.**

**Alternative immédiate (Option B — 80% de la valeur, 0% d'infrastructure) :**
Ajouter dans `GREFFIER_SYSTEM` :
```
RÈGLE DE DÉDUPLICATION :
Avant d'ajouter une force, un blocage ou une contradiction aux listes existantes,
vérifie si le concept est déjà présent sous une formulation différente.
Si c'est sémantiquement équivalent, conserve la formulation la plus claire et
n'ajoute pas de doublon. Tu es le gardien de la cohérence de la mémoire.
```
C'est 3 lignes dans le prompt Greffier, zéro infrastructure.

---

## Agent 7 — Axel (Impatient, 19 ans)

**Profil :** Sans emploi, attention span TikTok. Micro-révélation en 60 secondes ou il part.

**Ce qui fonctionne ✅**
- Règle 5 mots bien câblée — Axel tape "je sais pas", il ne reçoit pas un roman
- Welcome message honnête : "Bonjour. / Dis-moi ce qui t'occupe l'esprit."
- Starter prompts cliquables, directs, sur ce qui bloque vraiment
- État Jour 0 épuré : une phrase, un sous-titre, un bouton

**Ce qui ne fonctionne pas ❌**
- Onboarding 4 slides : trop long. Slide 2 = mur d'information (3 modes + 3 phases + labels)
- "Ta première question t'attend" — du teasing sans livrable
- "Commencer ma première session" — trop formel. "Parle à Noema maintenant" ferait le job
- "Étape 1 sur 4" en footer — amplifie l'effort perçu dès le départ

**Ce qui le ferait fuir en 30 secondes ⚠️**
- Slide 2 de l'onboarding est le point de rupture — architecture avant valeur
- Le mot "Mapping" dans Slide 2 — "bilan RH" pour Axel
- Le mot "Rituel" dans TodayV2 header
- Absence de micro-révélation dans les 30 premières secondes

**Ma recommandation :** Supprimer la Slide 2 ou la réduire à 1 phrase. Changer le CTA Jour 0. Masquer le compteur d'étapes.

**Mon verdict : 5,5/10**

---

## Agent 8 — Investisseur

**Profil :** Early-stage SaaS investor, unit economics B2C.

**Ce qui fonctionne ✅**
- Marge brute défendable : 67-71% à toutes les échelles
- Tier annuel : meilleur move de cette itération (+184% LTV si renouvellement tient)
- Architecture hybride Haiku/Sonnet correcte

**Risques économiques ⚠️**
- **Coût trial × 3** : 15 msgs/jour + Greffier /2 → ~7 Greffiers/session trial. La session trial coûte ~$0,320 vs ~$0,274 pour un abonné. Si taux de conversion < 5%, le CAC explose
- **50% des messages sur Sonnet** : chaque message pair déclenche MODEL_HEAVY pour la réponse principale → coût × 5-8x sur ces appels
- **Prompt caching non implémenté** : le system prompt NOEMA + mémoire (~2 500 tokens) est renvoyé à chaque appel. Le cache Anthropic réduirait les coûts input de 60-80%
- **Tier annuel trésorerie inversée** : 180€ encaissés, 12 mois de service à fournir avec coûts croissants

**Calculs révisés :**

| Composant | Coût/session abonné (12 msgs) |
|---|---|
| Haiku × 6 | $0,041 |
| Sonnet × 6 | $0,207 |
| Greffier Haiku × 6 | $0,026 |
| **Total** | **~$0,274/session** |

| Abonnés | MRR | Coûts | Marge brute |
|---|---|---|---|
| 100 | 1 900 € | ~620 € | 67% |
| 1 000 | 19 000 € | ~5 800 € | 69% |
| 10 000 | 190 000 € | ~55 000 € | 71% |

**LTV mix cible (30% annuel / 70% mensuel) : 147,5 € vs 95 € en 100% mensuel → +55%**

**Ma recommandation :**
1. Limiter le Greffier à `/3` pour les trials, garder `/2` pour les abonnés
2. Implémenter le prompt caching Anthropic — ROI immédiat le plus élevé disponible
3. Mettre l'offre annuelle en position par défaut dans le toggle Pricing

**Mon verdict : 6,5/10**

---

## Le Débat Final — Session 3

### Question 1 — Le correctif le plus impactant de cette session ?

- **Lucas :** "La limite à 15 messages. Je peux enfin tester quelque chose avant d'être bloqué."
- **Camille :** "computeForceStrengths(). Le tableau de bord arrête de mentir sur les forces. Mais les blocages mentent encore."
- **Thomas :** "memRow dans runGreffier. C'était le seul vrai bug d'intégrité — fermé proprement."
- **Axel :** "Rien de visible pour moi. Tout ce qui a changé est sous le capot ou après la session 3."
- **Analyste Produit :** "PastEntryCard. Le Journal a enfin une raison de revenir."
- **Investisseur :** "Le tier annuel. +55% sur le LTV moyen si le mix se construit bien."
- **Analyste Prompt :** "Aucun des correctifs ne touche au problème central — le prompt. Noema cartographie mieux mais ne travaille toujours pas."
- **Expert Sémantique :** "La mémoire est plus intègre. La sémantique attendra."

### Question 2 — Quelle est la prochaine modification la plus urgente ?

- **Lucas + Axel :** "Le prénom dans le Jour 0 et le CTA renommé. Deux lignes."
- **Thomas :** "Borner la Map rate limit. Une ligne. Et logger les sessions sans session_id."
- **Camille :** "Les barres de blocage dynamiques. Le tableau de bord ment encore sur la moitié de ses données."
- **Analyste Prompt :** "BLOC C dans le prompt. Effet immédiat, toutes sessions, zéro infra."
- **Investisseur :** "Prompt caching Anthropic. ROI le plus élevé disponible maintenant."
- **Analyste Produit :** "Corriger daysSinceLastSession sur latestSession.ended_at."

### Question 3 — Noema est-elle prête pour la croissance ?

**Lucas :** "Pour des gens comme moi qui cherchent déjà quelque chose — oui, si l'onboarding est raccourci."
**Thomas :** "Techniquement quasi prête. La Map non bornée est le seul vrai risque de scalabilité."
**Analyste Produit :** "Pas encore. Le produit retient les utilisateurs investis. Pas encore les hésitants."
**Investisseur :** "Le modèle économique tient. Mais le coût trial non maîtrisé peut surprendre à 5 000 trials/mois."
**Analyste Prompt :** "Tant que Noema pose des questions sans travailler les blocages, la rétention à M3 sera structurellement limitée. C'est le correctif prioritaire absolu."

**Verdict final :** Noema est prête pour une croissance prudente. Les fondations techniques sont solides. Le prompt est le plafond de verre — c'est lui qui déterminera si les utilisateurs qui restent 30 jours restent 6 mois.

---

## Verdict Final — 10 actions Session 3

### Bloc 1 — Prompt (impact immédiat, zéro infrastructure)

**1. [CRITIQUE / 48h] BLOC C — Réponse aux blocages actifs**
Ajouter dans "TA FAÇON DE PARLER" la règle sur comment répondre quand un blocage est exprimé : validation → reflet confrontant / question de réalité / micro-expérience / silence. Interdire "Qu'est-ce qui se passe pour toi avec ça ?" sur un blocage spécifique.
*Impact : chaque session, toutes phases, immédiat.*

**2. [CRITIQUE / 48h] BLOC A — Remplacement étape 3 Phase 1**
Remplacer "tu accompagnes à comprendre et dépasser progressivement" par des verbes opérationnels : validation émotionnelle, reflet confrontant, test de croyance, micro-expérience.
*Impact : Phase 1 cesse d'être un tunnel de questions.*

**3. [CRITIQUE / 48h] BLOC B — Permission de nommer**
Autoriser Noema à nommer un blocage racine confirmé sur plusieurs échanges.
*Impact : débloque le travail en profondeur, construit la confiance.*

### Bloc 2 — Dashboard & UX

**4. [IMPORTANT / 1 semaine] Barres de blocage dynamiques**
Même traitement que `computeForceStrengths()` — calculer les pourcentages depuis la fréquence réelle, pas les valeurs hardcodées 85%/50%/30%.
*Impact : MappingV2 arrête de mentir sur les blocages.*

**5. [IMPORTANT / 1 semaine] Titre "Harmonie détectée" conditionnel**
Masquer ou renommer le titre quand `ikigaiFilledCount < 2`. "Ikigai en construction" ou masqué.
*Impact : supprime un mensonge d'en-tête visible par tous les utilisateurs.*

**6. [IMPORTANT / 1 semaine] Prénom + pré-amorce Chat depuis Jour 0**
Injecter `firstName` dans l'écran Jour 0. Ouvrir le Chat avec un message de Noema déjà écrit quand on arrive depuis ce CTA.
*Impact : premier contact personnalisé, promesse de Slide 4 tenue.*

### Bloc 3 — Technique & Économie

**7. [IMPORTANT / 1 semaine] Greffier /3 pour les trials**
Garder `/2` pour les abonnés, passer à `/3` pour les trials. Réduction du coût trial de ~30%.
*Impact : économique direct, réduit le risque si conversion basse.*

**8. [IMPORTANT / 2 semaines] Prompt caching Anthropic**
Activer le cache Anthropic sur le préfixe system + mémoire (~2 500 tokens renvoyés à chaque appel).
*Impact : réduction 60-80% des coûts input — ROI le plus élevé disponible.*

**9. [MOYEN / 2 semaines] Correctifs techniques mineurs**
- Borner `inMemoryUserRateLimit` Map (> 10 000 entrées → clear)
- Logger warning quand `session_id` absent et Greffier actif
- Corriger `daysSinceLastSession` sur `latestSession.ended_at`
- Corriger les accents dans `getStepLabel()` / `buildMovementSummary()`

**10. [MOYEN / 1 mois] Déduplication sémantique Greffier (Option B)**
Ajouter la règle de déduplication sémantique dans `GREFFIER_SYSTEM` — 3 lignes, zéro infrastructure, résout 80% du problème de doublon entre sessions.
*Réserver la vraie recherche vectorielle pour Q3/Q4.*

---

## Maturité Produit Session 3

**Score global : 7/10** (+0,5 vs Session 2)

| Dimension | S2 | S3 | Delta |
|---|---|---|---|
| Prompt & Coaching | 5/10 | 5/10 | = (non touché) |
| Backend & Mémoire | 6/10 | 7.5/10 | +1.5 |
| Dashboard (Mapping) | 5/10 | 6.5/10 | +1.5 |
| Expérience Jour 0 | 3/10 | 6.5/10 | +3.5 |
| Rétention longitudinale | 4/10 | 6/10 | +2 |
| Modèle économique | 6/10 | 7/10 | +1 |
| Design System | 6.5/10 | 7/10 | +0.5 |

**Plafond de verre identifié :** Le prompt système est la limite de croissance actuelle. La mémoire est intègre, le dashboard est honnête, l'onboarding est correct — mais si Noema ne fait que cartographier sans travailler les blocages, la rétention à M3 plafonnera structurellement. C'est la priorité absolue de la Session 4.
