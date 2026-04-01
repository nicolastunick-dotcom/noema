# RETENTION — Débat entre 3 agents spécialisés

> Simulation de débat entre 3 agents spécialisés en rétention utilisateur.
> Sources lues : `PROJECT.md`, `DEBATE.md`, et la codebase réelle au 01/04/2026.
> Aucune modification de code.

---

## Contexte utile

État réel du produit aujourd'hui :

- `MappingPage` existe déjà et est le module le plus avancé visuellement.
- `JournalPage` existe, mais reste surtout statique.
- `TodayPage` existe, mais reste surtout statique.
- Le chat est le coeur vivant du produit.
- Le mobile n'est pas encore traité comme une fondation produit.
- Stripe est en cours d'intégration, donc un `essai 7 jours` dépend encore d'un tunnel billing propre.

Idées débattues :

1. Mapping évolue selon la phase — Phase 1 blocages visibles, Phase 2 remplacés par actions
2. Effet glow sur les contours de l'écran quand le Mapping se met à jour
3. Journal et Aujourd'hui fonctionnels
4. Résumé de session automatique dans le Journal avec actions Noema
5. Adapter l'app pour mobile
6. Les blocs s'agrandissent au survol
7. Essai 7 jours gratuit

---

## Agent 1 — Growth Hacker

### Ce qui retient vraiment

Pour la rétention pure, les idées les plus puissantes ne sont pas les plus “jolies”, mais celles qui créent une boucle de retour :

- `Journal + Aujourd'hui fonctionnels`
- `Résumé automatique de session avec actions Noema`
- `Mapping évolutif selon la phase`
- `Mobile`

Pourquoi ?

- `Journal + Aujourd'hui` transforment Noema en système de continuité. L'utilisateur ne revient plus “par curiosité”, il revient pour reprendre un fil.
- Le `résumé automatique de session` crée une dette psychologique douce : “je veux voir si ce que j'ai compris hier a bougé aujourd'hui”.
- Le `Mapping évolutif` donne une preuve visuelle de progression. On revient pour constater un changement d'état.
- Le `mobile` augmente la fréquence d'usage dans les moments de flottement réels : transports, soir, pauses.

### Ce qui fait revenir le lendemain

Les vrais déclencheurs J+1 sont :

- une question laissée ouverte
- une action simple à faire aujourd'hui
- une perception de progression

La meilleure boucle de rétention devient donc :

`session -> synthèse -> action -> retour -> nouveau reflet`

### Ce qui crée de l'habitude

L'habitude naît d'un rituel répétable, pas d'un moment spectaculaire :

- ouvrir l'app
- retrouver son contexte
- faire un petit pas
- voir que quelque chose a bougé

### Ce qu'il met en bas de pile

- `Glow` : bon feedback secondaire, pas moteur de rétention.
- `Blocs au survol` : polish desktop, très faible effet sur le retour.
- `Essai 7 jours gratuit` : fort pour l'acquisition, plus faible pour la rétention intrinsèque.

### Désaccord principal

Le Growth Hacker refuse qu'on priorise le packaging commercial ou le polish avant la boucle de valeur quotidienne.

---

## Agent 2 — Psychologue produit

### Ce qui correspond aux besoins psychologiques de la cible 18-35 ans perdue

La cible ne cherche pas seulement “un outil d'IA”. Elle cherche :

- de la clarté
- de la continuité
- le sentiment d'être comprise
- un petit pas faisable

Dans cette logique, les meilleures idées sont :

- `Journal + Aujourd'hui fonctionnels`
- `Mapping qui évolue selon la phase`
- `Résumé automatique de session`
- `Mobile`

### Ce qui crée un lien émotionnel avec Noema

Le lien ne vient pas d'un effet visuel. Il vient de trois choses :

- continuité : Noema se souvient
- justesse : Noema reformule bien
- agence : Noema aide à avancer sans juger

Le `résumé de session` est particulièrement fort parce qu'il fait passer Noema de “chat qui répond” à “guide qui me comprend”.

Le `Mapping par phase` est aussi très juste psychologiquement :

- Phase 1 : nommer le chaos
- Phase 2 : ouvrir une voie d'action

### Ce qui risque de décevoir

- `Glow` trop visible : risque de gadget “AI magic” sans profondeur.
- `Blocs au survol` : faible valeur émotionnelle, presque nulle sur mobile.
- `Trial 7 jours` trop tôt : peut ressembler à une mécanique commerciale avant d'être une expérience utile.
- `Mapping` trop rigide : si l'utilisateur se sent évalué au lieu d'être accompagné, la confiance chute.

### Désaccord principal

Le psychologue produit accepte le `Mapping évolutif`, mais seulement s'il reste souple et non culpabilisant. Il traite le `trial` comme sujet business, pas comme levier de lien émotionnel.

---

## Agent 3 — Product Manager

### Meilleur ratio impact / effort

Le PM distingue clairement les quick wins, les vrais paris produit, et les faux amis.

#### Très bon ratio impact / effort

- `Mapping évolutif selon la phase`
  - Faisable relativement vite si on commence par une logique d'état simple.
  - Bonne preuve de progression.

#### Impact énorme, mais plus lourd

- `Journal + Aujourd'hui fonctionnels`
- `Mobile`
- `Résumé automatique de session`

Ces trois chantiers changent réellement la nature du produit, mais ils demandent plus qu'un simple polish UI.

#### Faible ou secondaire

- `Glow`
- `Blocs au survol`

Ils peuvent améliorer la sensation de qualité, mais ne changent pas la valeur fondamentale.

#### À lancer plus tard

- `Essai 7 jours gratuit`

Le PM le juge potentiellement puissant, mais seulement après stabilisation du billing et de la proposition de valeur. Sinon, on augmente la friction opérationnelle sans augmenter la rétention réelle.

### Ordre d'implémentation recommandé par le PM

1. `Journal / Aujourd'hui fonctionnels`
2. `Mobile first minimum viable`
3. `Mapping qui change selon la phase`
4. `Résumé automatique de session`
5. `Essai 7 jours gratuit`
6. `Glow + hover`

### Désaccord principal

Le PM refuse qu'on traite trop tôt le `trial` ou le polish visuel avant que les surfaces utiles soient branchées à de vraies données.

---

## Le débat

### Growth Hacker -> Product Manager

“Je suis d'accord avec ton ordre global, mais je ne veux pas qu'on se réfugie derrière la lourdeur du chantier. Tant que `Journal` et `Today` restent statiques, Noema ressemble à une très bonne conversation, pas à un produit qui crée une habitude.”

### Product Manager -> Growth Hacker

“Oui, mais je dois aussi protéger l'équipe des chantiers trop vastes. Si on commence par un `Mapping par phase` simple, on peut déjà montrer que Noema évolue sans attendre de refondre toute l'app.”

### Psychologue produit -> Growth Hacker

“Je te suis sur la boucle `session -> synthèse -> action -> retour`, mais attention à ne pas transformer Noema en coach de performance. L'action doit rester douce, proposée, jamais imposée.”

### Growth Hacker -> Psychologue produit

“D'accord. Le point n'est pas de presser l'utilisateur, mais d'éviter qu'il reparte avec une émotion sans suite.”

### Psychologue produit -> Product Manager

“Le `Mapping` évolutif peut être excellent, mais seulement si on le présente comme un miroir vivant, pas comme un score. Sinon on perd la sécurité psychologique qui fait revenir.”

### Product Manager -> Psychologue produit

“Donc on commence simple : progression lisible, transitions douces, pas de logique trop scolaire.”

### Tous contre les idées faibles

Consensus fort sur deux points :

- `Glow` n'est utile qu'en renforcement d'un vrai moment de valeur.
- `Blocs au survol` est du bonus desktop, pas une priorité rétention.

Consensus nuancé sur le `trial 7 jours` :

- bon levier business
- pas un moteur de rétention coeur
- à lancer après stabilisation produit et Stripe

---

## Verdict final

### Top 5 des améliorations à faire en priorité

Classement final croisé par impact rétention + faisabilité réelle :

1. **Journal et Aujourd'hui fonctionnels**
   Parce que c'est le socle de la continuité. Aujourd'hui ces pages existent, mais restent surtout statiques. Les rendre vraiment utiles ferait passer Noema d'un chat inspirant à un compagnon quotidien.

2. **Mapping qui évolue selon la phase**
   C'est le meilleur quick win stratégique. Il montre que Noema ne se contente pas d'écouter : elle fait évoluer une représentation de l'utilisateur. Très bon ratio impact / effort si on commence simple.

3. **Résumé de session automatique dans le Journal avec actions Noema**
   C'est probablement la feature la plus forte pour le retour J+1. Elle transforme une session émotionnelle en trace utile et en prochaine étape.

4. **Adapter l'app pour mobile**
   C'est un multiplicateur de fréquence. Sans mobile fluide, la routine quotidienne reste fragile. Impact énorme, mais chantier plus lourd.

5. **Essai 7 jours gratuit**
   À prioriser après les briques produit ci-dessus. Ce n'est pas ce qui crée l'attachement, mais c'est ce qui réduira la friction d'entrée quand la valeur sera suffisamment visible.

---

## Ce qu'il faut volontairement repousser

- **Glow sur les contours quand le Mapping se met à jour**
  À faire seulement comme couche d'émotion secondaire.

- **Blocs qui s'agrandissent au survol**
  À traiter comme bonus desktop, pas comme feature produit prioritaire.

---

## Recommandation la plus nette

Si l'objectif est vraiment de maximiser la rétention, Noema doit passer de :

“une belle conversation introspective”

à :

“un système de continuité personnelle qui me comprend, me rappelle où j'en suis, et me donne un prochain pas”.

Le meilleur ordre pragmatique est donc :

1. Brancher `Journal` et `Aujourd'hui` à de vraies données
2. Ajouter le `Mapping par phase`
3. Produire un `résumé de session` avec actions
4. Rendre l'expérience `mobile` vraiment fluide
5. Ouvrir ensuite un `essai 7 jours`

