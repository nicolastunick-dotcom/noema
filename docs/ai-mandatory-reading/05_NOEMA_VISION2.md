# NOEMA — Vision Officielle
*Retranscription fidèle des notes manuscrites de Nicolas Tunick*

---

## 1/ Genèse

Noema, cette idée m'est venue après un long moment de solitude. Étant dans une phase compliquée de ma vie où je ne me suis pas réellement écouté et la surinformation TikTok. Je me suis dit je ne suis pas le seul, j'ai donc eu l'idée de créer une solution à ça : NOEMA.

Noema est une appli qui, dans ma vision, c'est pas une IA comme les autres. Elle analyse, décortique, comprend, se souvient. En clair pour chaque client son but est d'abord et de tout comprendre de l'utilisateur comme un psy. Il met en valeur les compétences, les blocages, les contradictions au fur et à mesure. En parallèle un Ikigai est créé grâce aux données récoltées.

Noema doit traiter tous les problèmes à la racine.

---

## 2/ La Vision — Les 3 Phases

### Phase 1 — Perdu
Noema accueille. Elle comprend qui est là et pourquoi. Espace safe. Pas de questions profondes. Elle commence à collecter silencieusement.

### Phase 2 — Le Guide
Noema explore en profondeur. Elle détecte les schémas toxiques, peurs, blocages. Elle avance par le biais d'exercices spécifiques à chaque utilisateur.

Une fois que Noema détecte que l'utilisateur a travaillé et guéri de ses schémas toxiques, peurs, blocages etc., Noema passe en Phase 3.

### Phase 3 — Le Stratège
En Phase 3 Noema est différent, il agit comme un conseiller/coach de développement personnel et financier chevronné.

En quelque sorte il cherche l'ambition de l'user, il veut connaître ses projets, ses rêves etc. L'Ikigai en construction depuis Phase 2 doit être disponible et présenté à l'user comme ce que Noema a interprété de l'user.

Si les projets et ambitions de l'user sont alignés à l'Ikigai alors il faut aider l'user à obtenir cette version de lui.

Si projet ≠ Ikigai alors questionné à propos et aligné sur l'Ikigai.

La Phase 3 ne se termine pas. Noema peut toujours traiter les problèmes en Phase 3.

---

## 3/ La Cible

18-35 ans en quête de réponses et n'ayant pas le temps ni les moyens de faire appel à un psy ou autre.

Peu importe la situation — en poste, au chômage, étudiant. Ce qui les unit c'est leur ressenti : ils font quelque chose mais ce n'est pas ce qu'ils veulent vraiment. Ils savent qu'il manque quelque chose mais ils n'arrivent pas à mettre le doigt dessus. Ils sont perdus sans forcément le formuler.

---

## 4/ Le Produit

### Structure — 4 onglets principaux

**1) Le Chat**

C'est le cœur, c'est lui qui fait tourner l'appli. J'utilise une API Anthropic pour le Chat. Lors du Chat Noema collecte les données pour construire le mapping. Les 4 onglets doivent travailler ensemble. Un Greffier est mis en place pour alléger le travail.

**2) Le Mapping**

C'est la page mentale, l'immersion doit être totale. Doit apparaître les forces, les blocages, les comportements toxiques, schémas répétitifs, découvertes etc... qui sont découverts grâce au Chat.

- Phase 1 : Noema accueille, comprend qui est là et pourquoi
- Phase 2 : exploration profonde. Le mapping fonctionne pleinement. C'est ce qui permet à l'user de voir la vérité en face
- Phase 3 : le mapping doit changer de design. Un message central "Bienvenue en Phase 3" et le menu doit afficher d'autres blocs — ambitions, mindset, etc. L'Ikigai doit être disponible dans cette phase

Le mapping doit changer d'apparence en Phase 3 mais l'user doit avoir la possibilité de le revisiter quand même. Car même en Phase 3 le Greffier enregistre.

Les blocages traités disparaissent du Mapping pour ne pas le surcharger.

L'Ikigai doit se construire grâce à la vraie méthode japonaise.

**3) Le Journal**

Le Journal doit fonctionner comme ça :

Chat fin de conv → mapping → Journal : résumé structuré de la session avec des conseils et une question finale.

À chaque session l'utilisateur note sa réponse dans un bloc qui est sauvegardé et réinjecté automatiquement dans le Chat à la session suivante.

Quand le journal résume → réponse user. Synthèse résumé + réponse → Page Zen adaptée (par une API ou gratuit si possible).

Ou si journal non rempli par user → mapping → Page Zen.

**4) Page Zen**

Cette page est sensée être une page dédiée à des exercices de remise en question, d'affirmation, de méditation etc.

Elle est construite comme telle : quand le journal résume, la synthèse résumé + réponse génère une Page Zen adaptée à l'utilisateur.

---

## Mémoire

Noema fonctionne par mémoire grâce à Supabase. Sessions + Phase.

À chaque fin de Phase un mail est envoyé avec un résumé complet du travail effectué grâce au résumé par sessions généré.

---

## 5/ Décisions

- Noema coûte 19€/mois
- Un essai gratuit d'1 semaine doit être mis en place
- Si user prend l'abonnement : débiter auto après 7 jours
- Si un user ne souhaite pas payer : user peut envoyer 3 messages/jour mais mapping et journal uniquement
- Si abonné : accès complet

---

## 6/ Journal de Bord

L'évolution du projet est disponible dans PROJECT.md et tous les autres documents en .md

---

## 7/ Roadmap Rêvée

D'ici 1 à 3 ans je veux que Noema soit devenue une appli avec 200 000 abonnés avec de nouvelles features etc.

Je veux rendre l'appli utile et travailler avec des plateformes comme la Mission Locale, Pôle Emploi etc afin d'y intégrer Noema.

Objectif : je veux faire en sorte de maîtriser les coûts API et toutes meilleures options que celles déjà implantées sont les bienvenues.

---

*Document créé le 3 avril 2026 — vision originale de Nicolas Tunick*
