# TESTER REPORT — Noema
**Date :** 2026-04-19 · **Session 2** · **7 agents** (6 utilisateurs + 1 audit design premium)

---

## Agent 1 — L'Utilisateur Perdu (Lucas, 22 ans)

**Profil :** Étudiant en L3 psy, légèrement sceptique, arrive sans attente précise depuis une story Instagram.

**Ce qui fonctionne ✅ :**
- La première question de Noema est juste : "Qu'est-ce qui occupe le plus de place dans ta tête en ce moment — pas ce que tu devrais faire, ce qui est là, maintenant ?"
- Les starter prompts dans ChatV2 sont honnêtes et non-productivistes ("Je me sens bloqué sans savoir pourquoi")
- L'esthétique dark / ambient intrigue sans intimider — inattendu dans le bon sens
- La règle des réponses courtes sur les signaux faibles (≤5 mots → 2 phrases max)
- Le message de quota épuisé est humain ("Ce qui s'est précisé ici reste visible. Garder ce fil vivant")
- Règle "jamais je comprends, jamais c'est tout à fait normal" dans le prompt — différenciateur réel

**Ce qui ne fonctionne pas ❌ :**
- TodayV2 est vide et froide pour un nouvel utilisateur — conçue pour les récurrents, pas pour l'arrivée (au Jour 1 : "Commence une conversation pour définir ton intention du jour." = cul-de-sac)
- Navigation à 4 onglets dès le Jour 1 — "Mapping" est totalement incompréhensible sans contexte
- La pill de phase "PERDU" visible en étiquette de l'interface — catégorisation perçue comme diagnostic
- Session "complète" promise à 25 messages vs trial 15 messages/jour — collision de promesses
- Aucun onboarding réel entre inscription et premier chat — Lucas arrive dans ShellV2 sans cadrage

**Ce qui devient redondant après 1 semaine ⚠️ :**
- Question du jour : cycle de 5 questions par phase (dayOfYear % 5) — répétition visible en < 2 semaines
- Les blobs animés — imperceptibles mentalement au Jour 7
- Header "Bonjour · Jour X de ton parcours" sans données évolutives = horloge vide

**Ma recommandation :** TodayV2 doit avoir un état Jour 0 dédié — pas l'interface vide des récurrents. Et le label "PERDU" doit disparaître de l'interface visible : c'est une variable interne, pas un miroir à présenter à quelqu'un en recherche.

**Mon verdict : 6,5/10** — Le moteur conversationnel est remarquable mais l'expérience de premier contact est criblée de frictions évitables.

---

## Agent 2 — L'Utilisateur Avancé (Camille, 28 ans)

**Profil :** Ex-ingénieure en reconversion coaching, 10-12 sessions au compteur, Phase 2/3, cherche de la substance.

**Ce qui fonctionne ✅ :**
- Section "Contradictions détectées" — honnête et rare dans ce type de produit
- "Ombres à dissoudre" avec 3 niveaux (racine, entretien, visible) — lecture réelle du fonctionnement
- Continuité inter-sessions via buildMemoryContext() — c'est ce qui fait vraiment revenir
- Greffier Haiku avec prefill JSON — extrait sans halluciner, normalizeGreffierPayload est défensif
- "Progression vivante" conditionnel sur hasRecurringThemes — n'apparaît que quand il y a des données

**Ce qui ne fonctionne pas ❌ :**
- computeForceStrengths() : cap à 3 sessions → pourcentages toujours artificiellement élevés ; fallback 25+5i est purement décoratif
- Ikigai : cercles taille fixe (66%), "Harmonie détectée" = template string, pas d'analyse réelle
- session_note tronquées à 90 caractères — coupe avant le 2e insight (les notes Greffier sont denses)
- ZenRing calcule step/10 alors que step max Greffier = 6 → jamais plus de 60% — bug silencieux
- Aucune dimension temporelle dans les forces (stable depuis 6 mois ou apparu cette semaine ?)

**Ce qui devient redondant après 1 mois ⚠️ :**
- PulseTiles si progressSignals ne change pas assez rapidement entre les sessions
- Le hero cinématique (blur, scale, 4 blobs, 22-28s loops) — 900ms d'attente pour du connu après 15 visites
- "Harmonie détectée" — template string identique à chaque visite une fois l'ikigai rempli
- Citation finale "Le cartographe de l'esprit..." — statique, jamais changée
- ZenRing + "Session 11 · Le profil s'affine" sans changement de phase visible

**Ma recommandation :** Supprimer les pourcentages de forces ou les remplacer par une timeline d'apparition ("présente depuis session 3"). Étendre session_note à 200 caractères. Corriger le ZenRing pour step/6. Rendre l'ikigai visuellement sensible à sa complétion (taille de cercles proportionnelle aux champs remplis).

**Mon verdict : 6,5/10** — Le moteur est là et il est bon, mais le tableau de bord ment parfois sur la profondeur de ce qu'il mesure.

---

## Agent 3 — Le Sceptique (Thomas, 30 ans)

**Profil :** Développeur fullstack — ne croit pas aux apps de développement personnel, cherche les failles, s'il reste c'est que ça marche vraiment.

**Ce qui fonctionne ✅ :**
- Sécurité backend solide : JWT côté serveur, whitelist champs, rate-limit mémoire 30 req/min
- Mémoire inter-sessions : 4 queries en Promise.all, buildServerMemoryContext couvre les 5 axes
- Greffier robuste : normalizeGreffierPayload défensif, prefill JSON, clampProgression
- Modèle hybride justifié (shouldRunGreffier = userMsgCount % 3 === 0, documenté "~67% réduction")
- progressionSignals.js solide : pickTop avec minCount:2, priorité blockage > contradiction > force

**Ce qui ne fonctionne pas ❌ :**
- Greffier tourne TOUJOURS sur Haiku (greffier.js ligne 2 : HAIKU_MODEL). MODEL_HEAVY=Sonnet est uniquement pour la réponse principale quand shouldRunGreffier=true — pas un vrai hybrid sur la synthèse
- userMemory vient du CLIENT (body.user_memory) alors que la mémoire authoritative est déjà en DB dans memRow — vecteur de divergence et de contamination
- Quota incrémenté AVANT la réponse Anthropic — si Anthropic échoue, le message est brûlé sans réponse
- step non persisté dans memory, lu depuis sessions.step séparément — fragile si la query échoue

**Ce qui est techniquement fragile ⚠️ :**
- Greffier timeout 6000ms — cold start Netlify + double upsert Supabase = limite serrée
- Greffier toutes les 3 interactions — sessions courtes (2-4 msgs) ne déclenchent jamais le Greffier = aucune mise à jour mémoire sur les sessions les plus probables en early adopter
- pickTop minCount:2 — un blocage fort mentionné une seule fois n'est jamais remonté
- Pas de réconciliation entre le bloc `_ui` (prompt) et le Greffier (backend) — deux sources de vérité indépendantes
- MAX_TOKENS_PER_REQUEST=1200 sur Haiku peut couper les réponses longues de Phase 2

**Ma recommandation :** Fix prioritaire — remplacer `body.user_memory` par les données issues de `memRow` dans l'appel runGreffier (fix d'une ligne, supprime un vrai risque d'intégrité). Ajouter un trigger de fin de session qui force une passe Greffier indépendamment du userMsgCount.

**Mon verdict : 6,5/10** — Architecture sérieuse mais 3 bugs de logique réels qui font paraître le produit cassé sur des cas d'usage courants.

---

## Agent 4 — L'Impatient (Axel, 19 ans)

**Profil :** Sans emploi, attention span TikTok — veut une micro-révélation immédiate ou il part.

**Ce qui fonctionne ✅ :**
- Règle 5 mots dans le prompt : "Quelque chose coince ?" + une question courte — exactement juste
- Starter prompts cliquables sans réfléchir (1 tap, c'est parti)
- Mode "welcome" sobre : "Dis-moi ce qui t'occupe l'esprit." — pas d'injonction
- Navigation bottom bar immédiate, Chat visible en premier
- Première question obligatoire bien calibrée pour la Phase 1

**Ce qui ne fonctionne pas ❌ :**
- TodayV2 est un mur de contenu — Axel scrolle 2 secondes et ferme l'app
- Le mot "Rituel" dans le header sonne vieux pour un 19 ans
- Starter "Je veux comprendre ce qui me freine vraiment" — trop analytique, présuppose une intention de travail sur soi qu'Axel n'a pas encore
- Onglet "Mapping" — flou total (icône psychology_alt + mot "Mapping")
- Le prompt Noema prescrit 4 étapes séquentielles avant toute action — Axel sent un parcours imposé

**Ce qui le fera fuir en 30 secondes ⚠️ :**
- Réponse Noema > 4 lignes en session 1, même si elle est belle
- Une seule réponse trop littéraire sur un "jsais pas" — une suffit pour uninstall
- Page "Aujourd'hui" en premier plan ou comme première expérience
- Tout ce qui ressemble à un onboarding ou un formulaire
- "Essai du jour terminé" après 3 échanges sans valeur perçue

**Ma recommandation :** La règle des 5 mots est nécessaire mais pas suffisante. Le vrai problème d'Axel c'est la valeur perçue dans les 60 premières secondes. La session 1 doit lui donner une micro-révélation — Noema doit lui dire quelque chose de précis qu'il n'a pas formulé lui-même. "jsais pas" → observation acérée en 2 phrases. C'est ça qui retient, pas la douceur.

**Mon verdict : 5/10** — La règle des 5 mots est le bon instinct, mais Noema est encore construite pour des gens qui cherchent déjà à se connaître.

---

## Agent 5 — L'Analyste Produit

**Profil :** Growth PM senior, 8 ans sur des apps à fort volume, lit les patterns de rétention dans le code.

**Ce qui fonctionne ✅ :**
- ChatV2 : mécanique de continuité solide (welcome/resume/restart) — pattern de rétention le plus fort
- MappingV2 : surface de valeur accumulée — actif qui s'apprécie avec le temps, anti-churn classique
- TodayV2 : buildReturnVisitState + daysSinceLastSession — friction positive au retour
- JournalV2 : upsert par date propre (onConflict user_id,entry_date), favorise l'écriture récurrente
- Landing : proposition de valeur honnête avec timeline S1/S3/S10, pas de dark pattern

**Ce qui ne fonctionne pas ❌ :**
- JournalV2 sans mémoire longitudinale — aucune relecture des entrées passées, silo complet
- TodayV2 est un hub de redirection, pas un espace propre — rien de ce qui est fait là n'est tracé
- MappingV2 totalement passif — aucun bouton, aucun CTA, aucun lien vers Chat ("musée sans guide")
- Quota bloquant sans "earn more" — mur payant brutal sans warmup ni mécanisme alternatif
- App 100% pull — aucune notification ou signal de retour serveur

**Risques de rétention ⚠️ :**
- **Semaine 1** : 60-70% des trials abandonnent avant conversion (profil vide + mur quota brut)
- **Mois 1** : Journal abandonné en premier — écrire sans jamais relire = écrire dans le vide
- **Mois 6** : Saturation du profil — forces/blocages/ikigai complets = plus de raison articulée de revenir

**Ma recommandation :** Deux leviers à fort impact. Premier : le Journal a besoin de mémoire longitudinale (fil de relecture des 3 dernières entrées + connexion insights Journal → Mapping). Deuxième : rendre MappingV2 actionnable avec un seul CTA par section ("Explorer ce blocage en session") qui ouvre Chat avec contexte pré-rempli — ce lien manquant est le principal risque de rétention à 6 mois.

**Mon verdict : 6/10** — Excellente fondation technique, mais chaque surface vit en silo — le contraire de ce que la landing page promet.

---

## Agent 6 — L'Investisseur

**Profil :** Early-stage SaaS investor, spécialiste unit economics B2C.

**Ce qui fonctionne ✅ :**
- Architecture hybride Haiku/Sonnet — coût réduit de ~67% vs tout-Sonnet
- Cap tokens 1200 sortie — évite les réponses fleuve coûteuses
- Quota journalier enforced backend — pas de dérive côté client
- Prix 19€/mois bien positionné (coaching premium accessible, pas du freemium qui saigne)

**Calculs détaillés :**

```
Tokens input estimés par requête :
  Système NOEMA_SYSTEM : ~1 000 tokens
  serverMemoryContext  : ~800 tokens (utilisateur actif)
  Historique messages  : ~2 000 tokens (24 max)
  Message utilisateur  : ~100 tokens
  TOTAL INPUT          : ~3 900 tokens / Sortie : ~800 tokens

Haiku (2/3 des messages)  : 3 900×0.8$/M + 800×4$/M  = 0.00632$/msg
Sonnet + Greffier (1/3)   : 3 900×3$/M + 800×15$/M + Greffier Haiku = 0.0317$/msg

Coût moyen pondéré    : (2×0.00632 + 0.0317) / 3 = 0.01345$/message
Abonné actif réaliste : 15 jours actifs × 25 msg = 5.04$/mois en API
Revenu net            : ~19.6$/mois (après Stripe)
Marge nette           : 19.6 - 5.04 - 0.75 = ~13.8$/mois → 67% marge brute
```

| Abonnés | MRR | Coûts API/mois | Profit mensuel |
|---------|-----|----------------|----------------|
| 100 | 1 900 € | ~504 $ | ~1 100 € |
| 1 000 | 19 000 € | ~5 040 $ | ~11 000 € |
| 10 000 | 190 000 € | ~50 400 $ | ~110 000 € |

**Risques ⚠️ :**
- Context window creep : coût monte avec la fidélité — les meilleurs clients coûtent le plus
- Pas de tier annuel — 20-30% de revenus laissés sur la table
- Churn B2C 5-8%/mois sans annuel → LTV médian 12-18 mois max
- Pas de cap sur les tokens d'entrée à long terme

**Ma recommandation :** Introduire un abonnement annuel (15€/mois × 12 = 180€) avec remise affichée. Surveiller le coût par utilisateur actif en DB. Le vrai risque n'est pas le prix du token aujourd'hui, c'est l'absence de plafond sur l'historique injecté.

**Mon verdict : 7/10** — Modèle économiquement sain à 67% de marge mais le context window creep est le risque silencieux qui dégradera la marge sur les meilleurs utilisateurs.

---

## Agent 7 — Audit Premium Design System

**Profil :** Design System Lead — a construit des systèmes pour des produits à 500K+ utilisateurs. Références : Linear, Craft, Raycast, Arc Browser.

**Score global de maturité design : 6,5/10**

### Cohérence du système

**Deux systèmes cohabitent sans pont — c'est la fissure principale.**

`tokens.js` est bien construit (hiérarchie de 6 surfaces, typographie complète, motion tokens). Mais `app.css` (V1) définit un système radicalement différent — mode clair (#F7F8FC), accent #5B6CFF — qui contredit directement les tokens V2 (bg #0c0e13, accent #bdc2ff). Chargée globalement, cette CSS crée des conflits.

**Valeurs hardcodées incohérentes :**
- `Login.jsx` utilise `fontFamily: "'Newsreader', serif"` pour le logo — police non importée, différente d'Instrument Serif. **Bug d'identité le plus visible du produit**
- `Login.jsx` redéfinit `const C = {...}` — 22 lignes qui doublonnent les tokens
- `ShellV2.jsx` hardcode `backgroundColor: "#111318"` au lieu de `T.color.surface`
- `MappingV2.jsx` utilise `fontSize: "0.56rem"`, `"0.52rem"`, `"0.5rem"`, `"0.46rem"` (7.36px = illisible)
- **Bug `rgba(${accent}, 0.3)` dans ChatV2.jsx** — accent est hex (#bdc2ff), pas des triplets RGB → couleur hover cassée silencieusement sur les prompts de démarrage

### Typographie

L'échelle T.type est logique, Instrument Serif italic pour les messages Noema est juste.

**Problèmes :**
- L'échelle descend jusqu'à `caption: 0.625rem` mais le code va bien plus bas : 0.46rem (7.36px) non tokénisé
- MappingV2 : textes Ikigai (0.9rem hardcodé), labels sections (0.85rem) — aucun token body/bodySm
- `letterSpacing: "-0.04em"` sur H1 Landing vs `T.type.h1.ls = "-0.02em"` — dérive
- `fontWeight: 300` sur le textarea du chat est premium — à documenter comme `T.type.input`

### Espacement & Layout

- `NAV_HEIGHT = 88` dupliqué dans ShellV2 ET ChatV2 — constante partagée manquante
- JournalV2 `maxWidth: 640` vs ChatV2 et MappingV2 `maxWidth: 720` — incohérence inter-pages
- Padding bottom varie : 120px (Mapping/Journal), 96px (Today), 200px (Chat) — non documenté

### Couleurs & Phases

Le système 3 phases est bien pensé, les PHASE_BG dans ShellV2 sont subtils et justes (transition 2.0s easeInOut = décision premium).

**Problèmes :**
- `T.color.warning = "#ffb68a"` = couleur phase guide — confusion sémantique : un warning en phase perdu s'affiche avec l'accent guide
- `OrbPhase.jsx` définit sa propre `PHASE_PALETTE` indépendante des tokens (`core: "#6e5fff"` vs `T.color.accent.container = "#7886ff"`)
- `accentStrong` non documenté dans tokens.js — vit uniquement dans phaseContext

### Composants & États

**Inputs :**
- Textarea ChatV2 : `border: none`, `outline: none` — **aucun focus ring visible**. L'écriture est l'acte central du produit, il n'a pas de feedback
- Inputs Login : `border: "none"`, pas de focus state — input visuellement mort au focus

**Empty states :**
- MappingV2 : juste un `<p fontStyle="italic">` — aucune illustration, aucun craft
- État de chargement JournalV2 : `<div>Chargement…</div>` sans animation vs TodayV2 qui a un loading animé — incohérence

### Animations & Micro-interactions

**Ce qui est bien :**
- OrbPhase est l'élément le plus abouti — 5 couches, morphing organique, burst de phase. Travail premium
- `cinematic entrance` (blur 12px→0, scale 0.98→1 sur 0.9s) cohérent entre les 3 pages V2
- Stagger sections MappingV2 (delay: i × 0.09) — juste

**Ce qui manque :**
- Transitions de page ShellV2 (`duration: 0.16s, x: 6`) trop rapides et trop subtiles — cible : `duration: 0.24s`, courbe `[0.16, 1, 0.3, 1]`, `x: 12`
- Living atmosphere blobs dupliqués ~100 lignes × 3 pages — composant `<LivingAtmosphere>` à extraire
- PhaseTransitionOverlay et OrbPhase burst non synchronisés (overlay 2.8s, orbe 1.8s)
- Feedback save JournalV2 = juste changement de texte (aucune animation)

### Navigation

- Barre phase label (~27px) au-dessus des tabs crée une zone de clics confuse sur mobile
- `fontSize: "0.58rem"` pour le navLabel = 9.28px (limite de lisibilité)
- Tab indicator `borderRadius: 0` — aucun arrondi, pas premium
- Pas de gestion des swipes horizontaux entre les tabs

### Landing & Onboarding

**Landing — point fort :** parallax scrollytelling, H1 serif italic impactant, OrbPhase hero, `clamp()` responsive. Seul bug : `letterSpacing: "-0.04em"` sur H1 vs token `-0.02em`.

**Login — maillon faible :**
1. Logo en `"'Newsreader', serif"` — police non chargée, fallback générique — **incohérence critique d'identité**
2. Footer en anglais ("Privacy Policy", "© 2024") vs Landing en français ("© 2026")
3. Palette `const C` dupliquée — 22 lignes qui doublonnent les tokens
4. Inputs sans focus state visible
5. Titre `fontSize: "3rem"` non tokénisé

### Tokens manquants

```js
T.type.tiny  = { size: "0.625rem", lh: 1.3,  ls: "0.18em" }  // Remplacer les 0.46→0.56rem
T.type.input = { size: "0.9375rem", lh: 1.6,  weight: 300 }   // Style textarea unifié
T.color.accent.strong  // Documenté dans phaseContext, absent de tokens.js
T.color.phase = {
  perdu:    { accent: "#bdc2ff", bg: "#111318" },
  guide:    { accent: "#ffb68a", bg: "#13100c" },
  stratege: { accent: "#9adfc8", bg: "#0c1312" },
}
T.nav   = { height: 88, phaseBarH: 27 }
T.focus = {
  ring:  (accent) => `0 0 0 2.5px ${accent}55`,
  input: (accent) => `0 0 0 3px ${accent}22`,
}
```

**10 améliorations design prioritaires :**
1. **[CRITIQUE]** Corriger police logo Login → `T.font.serif` italic
2. **[CRITIQUE]** Migrer Login.jsx vers tokens.js, supprimer `const C`, corriger footer (français, © 2026)
3. **[CRITIQUE]** Corriger bug `rgba(${accent}, 0.3)` → `${accent}4d` ou fonction `hexToRgba()`
4. **[IMPORTANT]** Extraire `<LivingAtmosphere glow={} />` en composant partagé (300 lignes × 3 pages)
5. **[IMPORTANT]** Externaliser `NAV_HEIGHT` dans `T.nav.height`
6. **[IMPORTANT]** Focus ring visible sur textarea ChatV2 — `box-shadow: 0 0 0 2px ${accent}66` au focus
7. **[MOYEN]** Ajouter tokens manquants (T.type.tiny, T.type.input, T.focus, T.color.phase, T.nav)
8. **[MOYEN]** Améliorer transitions de page : duration 0.16→0.24, x 6→12, courbe spring
9. **[POLISH]** Arrondir tab indicator navbar : borderRadius 0 → T.radius.sm (8px)
10. **[POLISH]** Empty states MappingV2 : OrbPhase + hint contextuel

**Mon verdict : 6,5/10** — L'intention est premium et l'OrbPhase est du vrai craft, mais le Login brise l'identité au point d'entrée, le bug rgba(hex) est silencieux et visible, et la cohabitation V1/V2 sans pont crée une dette qui s'accumule à chaque PR.

---

## Le Débat Final

### Question 1 — Noema tient-elle sa promesse "Tu n'as pas raté ta vie" ?

**Lucas :** "En session 1, non. Je n'ai pas le temps d'arriver à cette conviction — je touche le mur du quota avant d'avoir senti quoi que ce soit."

**Camille :** "Après 10 sessions, oui — partiellement. Mais le Mapping ment avec ses pourcentages. Ce mensonge doux érode la confiance dans tout le reste."

**Thomas :** "La promesse est dans le prompt système, pas dans l'architecture. Si le Greffier ne tourne pas sur les sessions courtes (< 3 messages), la mémoire ne se construit pas. La promesse dépend d'un bug de fréquence."

**Axel :** "Elle ne se pose même pas pour moi. Je n'ai pas attendu assez longtemps pour y croire ou ne pas y croire."

**Analyste Produit :** "La promesse est vraie à session 3+. Le problème c'est que 60-70% des utilisateurs ne la voient jamais — ils partent avant. La promesse est en retard de deux sessions sur l'expérience réelle."

**Investisseur :** "La promesse est le meilleur actif du produit. C'est la seule proposition de valeur qui justifie 19€/mois dans ce segment. Il faut juste que l'utilisateur y arrive avant de se lasser."

**Verdict :** Noema tient sa promesse **pour les utilisateurs qui arrivent à session 3**. Le problème n'est pas la promesse — c'est le funnel. Il faut réduire drastiquement le temps entre l'inscription et le premier "aha moment".

---

### Question 2 — Quel est l'onglet le plus dispensable ?

- **Lucas :** "Aujourd'hui — au Jour 1, c'est vide et incompréhensible."
- **Camille :** "Journal — j'écris mais je ne relis jamais. Sans mémoire longitudinale, c'est une note perdue."
- **Thomas :** "Aujourd'hui — techniquement un hub de redirection avec du contexte. Ce n'est pas un espace, c'est un panneau de direction."
- **Axel :** "Aujourd'hui et Mapping ex-aequo — l'un sonne vieux, l'autre est incompréhensible."
- **Analyste :** "Journal — il abandonne en premier à mois 1. Sans relecture, écrire dans le vide n'a pas de valeur."
- **Investisseur :** "Le Journal coûte presque rien en API et ancre le comportement quotidien. Le garder."
- **Agent 7 :** "Aujourd'hui est un hub de redirection habillé en espace de rituel. Sans push/widget pour le déclencher, il sera ignoré."

**Verdict :** **"Aujourd'hui" est l'onglet le plus à risque.** Il survivra uniquement si la question du jour devient un vrai point d'entrée journalier (notification push, widget) plutôt qu'une destination à trouver seul. Le Journal survivra si on lui ajoute la relecture.

---

### Question 3 — Quelle est la priorité absolue pour les 30 prochains jours ?

**Lucas + Axel :** "L'expérience Jour 0 et Jour 1. TodayV2 vide + navigation non guidée + label PERDU visible = 60-70% d'abandon avant d'avoir touché la valeur."

**Thomas :** "Corriger le Greffier sur les sessions courtes. Si la mémoire ne se construit pas sur les sessions de 2-4 messages, la promesse de continuité est une fiction."

**Camille + Analyste :** "Rendre MappingV2 actionnable. C'est la surface qui justifie l'abonnement long terme — si elle reste un musée sans guide, la rétention à 6 mois s'effondre."

**Investisseur :** "Ajouter un tier annuel. C'est la décision économique la plus simple avec le plus grand impact immédiat sur le LTV."

**Agent 7 :** "Corriger les 3 bugs critiques : police Login, bug rgba(), footer anglais. Ce sont les seuls bugs visibles par tout utilisateur dès le premier contact."

**Verdict :** Les deux priorités absolues qui s'alignent sur tous les agents sont **(1) l'expérience Jour 0** et **(2) le Greffier sur sessions courtes**. L'une empêche l'abandon avant la valeur, l'autre construit la valeur qui justifie de rester.

---

## Verdict Final — 10 actions dans l'ordre de priorité

### Bloc 1 — Produit & Technique

**1. [CRITIQUE / 48h] Corriger les 3 bugs Login**
Police logo → Instrument Serif italic. Footer → français, © 2026. Supprimer `const C`, migrer vers tokens.js.
*Impact : premier contact brisé pour 100% des nouveaux utilisateurs.*

**2. [CRITIQUE / 48h] Corriger le bug rgba(hex) dans ChatV2**
`rgba(${accent}, 0.3)` → `${accent}4d` ou fonction `hexToRgba(color, alpha)`.
*Impact : couleur hover cassée silencieusement sur les prompts de démarrage.*

**3. [CRITIQUE / 1 semaine] TodayV2 — état Jour 0 dédié**
Si sessionCount === 0 : une phrase, un CTA vers Chat, rien d'autre. Masquer ou vider les sections vides au Jour 1. Masquer le label "PERDU" de l'interface — c'est une variable interne.
*Impact : 60-70% d'abandon sur ce point en période d'essai.*

**4. [URGENT / 1 semaine] Greffier sur sessions courtes**
Ajouter un signal de fin de session côté frontend qui force une passe Greffier indépendamment de `userMsgCount % 3`. Ou baisser le seuil à `% 2`.
*Impact : la mémoire ne se construit pas sur les sessions les plus probables en early adopter.*

**5. [IMPORTANT / 2 semaines] Remplacer `body.user_memory` par `memRow` dans runGreffier**
Une ligne dans claude.js — supprime le vecteur de contamination mémoire client vs serveur.
*Impact : intégrité de la mémoire inter-sessions.*

### Bloc 2 — Design System

**6. [IMPORTANT / 2 semaines] Focus ring sur textarea ChatV2**
`box-shadow: 0 0 0 2px ${accent}66` sur focus.
*Impact : l'acte d'écriture central du produit n'a aucun feedback visuel.*

**7. [IMPORTANT / 2 semaines] Extraire `<LivingAtmosphere />`**
Composant partagé avec props `glow` — élimine ~300 lignes dupliquées dans 3 fichiers.
*Impact : cohérence + maintenabilité.*

**8. [IMPORTANT / 2 semaines] MappingV2 — rendre actionnable**
CTA par section ("Explorer ce blocage en session") → ouvre ChatV2 avec contexte pré-rempli. Corriger ZenRing step/10 → step/6. Étendre session_note à 200 caractères.
*Impact : rétention à 6 mois, passage du "musée" à l'"outil".*

**9. [MOYEN / 3 semaines] Améliorer transitions de page + navbar**
ShellV2 : duration 0.16→0.24s, x 6→12, courbe spring. Tab indicator : borderRadius 0→8px, whileTap sur les icônes. Externaliser NAV_HEIGHT dans T.nav.height.
*Impact : perception de polish premium.*

**10. [MOYEN / 1 mois] Ajouter tier annuel**
180€/an (15€/mois apparent, -21% vs mensuel). Afficher sur Pricing.jsx avec remise calculée.
*Impact : +20-30% de revenus, amélioration LTV significative.*

---

## Maturité Design Actuelle

**Score global : 6,5/10**

| Dimension | Score | Note |
|-----------|-------|------|
| Système de tokens | 7/10 | Bien construit mais pas universel (V1/V2 split) |
| Typographie | 6/10 | Échelle correcte, valeurs non tokénisées < 0.625rem |
| Couleurs & phases | 7/10 | Système 3 phases solide, confusion warning/phase |
| Composants & états | 5/10 | Focus states manquants, bug rgba(), empty states pauvres |
| Animations | 7/10 | OrbPhase excellent, transitions de page trop discrètes |
| Navigation | 6/10 | Fonctionnelle, tab indicator sans arrondi, swipe absent |
| Landing | 8/10 | Point fort, parallax, typographie ambitieuse |
| Login | 3/10 | Police cassée, footer anglais, palette dupliquée |
| Cohérence globale | 5/10 | V1/V2 sans pont, NAV_HEIGHT dupliqué, LivingAtmosphere × 3 |

**Référence cible :** Linear dark mode = 9/10. Noema a l'ambition, l'intention, et l'OrbPhase. Il manque l'exécution systématique — ce que Linear appelle "craft at every pixel".
