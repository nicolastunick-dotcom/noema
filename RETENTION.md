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

---

## Addendum — Débat mis à jour au 02/04/2026 depuis `docs/system/`

> Cette section met à jour le débat initial à partir de `docs/system/NOEMA_SYSTEM_MAP.md`, `docs/system/NOEMA_RUNTIME_GAPS.md`, `docs/system/NOEMA_DATA_FLOW_MAP.md` et `docs/system/NOEMA_ALIGNMENT_EXECUTION_PLAN.md`.

### Ce que les docs système changent dans la lecture rétention

Le diagnostic a évolué.
Le problème principal n'est plus seulement "le coeur du produit tient-il ?"
Le coeur tient mieux qu'avant.

Le nouveau problème est :
"comment transformer un noyau chat + mémoire + mapping plus cohérent en boucle de retour quotidienne ?"

Les docs système montrent en effet que :

- l'accès backend et le quota backend ont été sécurisés
- le contrat `_ui` est en cours d'unification
- la mémoire et la session avancent dans la bonne direction
- mais `Journal`, `Today` et `Success` restent en retard sur le noyau réel

Autrement dit :
la rétention n'est plus bloquée seulement par une promesse cassée.
Elle est maintenant bloquée par une continuité encore incomplètement distribuée dans l'expérience.

---

## Agent 1 — Growth Hacker, version 02/04/2026

### Nouveau diagnostic

Je change mon diagnostic principal.
Avant, je pensais surtout :
"branchez `Journal` et `Today`, sinon Noema reste un beau chat."

Je le pense toujours, mais avec une nuance plus importante :
les docs système montrent que le projet est en train de devenir plus crédible dans son coeur.
Donc le chantier rétention n'est plus seulement un chantier d'invention.
C'est un chantier de distribution de valeur.

La valeur existe davantage qu'avant dans :

- le chat
- la mémoire
- le mapping

Le problème est qu'elle ne déborde pas encore assez dans les surfaces de retour.

### Ce qui devient prioritaire

Pour moi, la priorité absolue rétention devient :

1. rendre `next_action` visible et réutilisable
2. brancher `Journal`
3. dériver `Today` du même état

Pourquoi ?
Parce que la boucle la plus naturelle est déjà là en germe dans le système :

`conversation -> compréhension -> next_action -> retour`

Aujourd'hui, cette boucle se casse après le chat.
La rétention se gagne précisément à cet endroit.

### Ce que je repousse encore

Je repousse encore plus fort qu'avant :

- les effets de glow
- les raffinements hover
- les mécaniques d'essai si elles arrivent avant la continuité réelle

Si on ouvre plus fort le funnel avant d'avoir fermé la boucle de retour, on fera entrer plus de gens dans une expérience qui n'a pas encore son moteur d'habitude.

---

## Agent 2 — Psychologue produit, version 02/04/2026

### Ce que l'évolution change psychologiquement

Les docs système me rassurent sur un point fondamental :
le projet commence à réduire l'écart entre ce qu'il dit et ce qu'il fait.

Pour la rétention, c'est majeur.
Un produit introspectif perd instantanément la confiance s'il semble manipuler la perception ou vendre une profondeur qu'il ne porte pas réellement.

Le fait que l'équipe assume maintenant explicitement que `Journal` et `Today` sont encore mockés est sain.
Ça crée les conditions psychologiques d'une vraie confiance future.

### Ce qui manque encore pour l'attachement

Le lien émotionnel ne se produit pas encore complètement.

Pourquoi ?
Parce que l'utilisateur peut vivre une bonne session, mais il n'habite pas encore une continuité.
Il n'a pas encore :

- un endroit où la session d'hier se transforme en trace
- un endroit où le pas suivant lui revient naturellement
- un rituel quotidien qui soit réellement nourri par ce qu'il a vécu

Le coeur psychologique de la rétention n'est donc pas "plus d'insights".
C'est "plus de continuité ressentie".

### Ma priorité

Je veux que l'évolution du projet reste douce dans sa forme.
Oui à `next_action`.
Oui à `Journal`.
Oui à `Today`.

Mais il faut les brancher comme des espaces de continuité, pas comme des obligations de performance.
Le retour ne doit pas ressembler à :
"tu n'as pas fait ton devoir".
Il doit ressembler à :
"voilà le fil que tu es en train de tisser".

---

## Agent 3 — Product Manager, version 02/04/2026

### Ce que les docs système changent dans ma roadmap

Les docs système me forcent à être plus rigoureux.
Je ne peux plus penser en "features rétention" isolées.
Je dois penser en dépendances.

Le plan d'exécution le montre bien :

1. coeur backend stabilisé
2. contrat `_ui`
3. session live
4. réalignement UX
5. extension `Journal` / `Today`

Donc mon ordre produit rétention change légèrement.

### Nouvel ordre PM

1. finir ce qui rend la session réellement exploitable partout
2. brancher `Journal` à des données vraies
3. brancher `Today` à partir des mêmes données
4. seulement ensuite enrichir la dramaturgie de progression
5. ensuite mobile et acquisition

Pourquoi ce changement ?
Parce qu'un `Journal` branché trop tôt sur un contrat instable créera de la dette produit au lieu de créer de la rétention.

### Ce que je défends le plus fort

Je défends une idée simple :
la prochaine feature rétention n'est pas une feature écran.
C'est un raccordement de système.

Le meilleur investissement n'est pas de dessiner un meilleur `Today`.
C'est de faire en sorte que `Today` dérive vraiment du même état que le chat.

---

## Le nouveau débat

### Growth Hacker -> Product Manager

"Je comprends mieux maintenant pourquoi tu refuses d'ouvrir tous les chantiers en même temps. Les docs système montrent qu'il y a une vraie logique de dépendance. Mais je maintiens que tant que `next_action` ne sort pas du chat, la rétention plafonne."

### Product Manager -> Growth Hacker

"Je suis d'accord. Mais le bon geste n'est pas juste 'ajouter `next_action` à l'écran'. Le bon geste, c'est rendre `next_action` fiable, puis l'utiliser dans `Journal` et `Today`."

### Psychologue produit -> Growth Hacker

"Et je rajoute : si `next_action` devient un simple mécanisme de rappel, on perd l'âme du produit. Il faut que ce soit une continuité personnelle, pas une to-do list."

### Growth Hacker -> Psychologue produit

"Oui. La rétention n'est pas l'habitude vide. C'est le retour vers une conversation qui a laissé une trace."

### Product Manager -> Psychologue produit

"C'est pour ça que les docs système sont utiles. Elles nous empêchent de maquiller une promesse émotionnelle avec une surface qui ne serait pas reliée au vrai état du système."

### Psychologue produit -> Product Manager

"Alors notre règle devrait être simple : aucune surface de continuité ne doit mentir sur sa source de vérité."

---

## Verdict mis à jour

La rétention de Noema n'est plus principalement bloquée par la qualité de la conversation.
Elle est maintenant bloquée par l'absence de continuité visible et fiable après la conversation.

Le projet est en train d'évoluer de manière saine :

- le noyau devient plus cohérent
- la valeur devient plus réelle
- mais la boucle quotidienne n'est pas encore branchée

### Nouveau top 5 rétention

1. **Sortir `next_action` du chat et en faire une donnée réutilisable**
   C'est le pont naturel entre session et retour.

2. **Brancher `Journal` sur des données réelles**
   Pour transformer la session en trace personnelle.

3. **Brancher `Today` sur le même état réel**
   Pour transformer la trace en point de retour quotidien.

4. **Rendre la continuité lisible sans la rendre scolaire**
   Le produit doit accompagner, pas noter.

5. **Accélérer ensuite mobile et acquisition**
   Une fois la boucle de retour réelle stabilisée.

### Formule la plus juste aujourd'hui

Noema n'a plus surtout besoin de "plus d'idées de rétention".
Noema a besoin que son système réel devienne enfin une expérience de continuité visible.
