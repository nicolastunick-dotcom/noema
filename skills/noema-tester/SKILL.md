name: noema-tester

# SKILL — Noema Tester Agents

## Rôle
Ce skill lance plusieurs agents qui testent Noema comme de vrais utilisateurs. Chaque agent a un profil, une mission, et rend un verdict. À la fin un débat synthétise tout.

## Comment l'activer
Dis à Claude Code : 'Lance le skill noema-tester'

## Les 6 agents

**Agent 1 — L'Utilisateur Perdu (22 ans, étudiant)**
Profil : se sent perdu, ne sait pas ce qu'il veut, arrive sur Noema sans attentes claires.
Mission : tester la Phase 1. Est-ce que Noema l'accueille vraiment ? Est-ce que c'est safe ? Est-ce qu'il revient le lendemain ?
Questions : Le premier message de Noema donne-t-il envie de continuer ? La limite de 25 messages frustre-t-elle ou libère-t-elle ?

**Agent 2 — L'Utilisateur Avancé (28 ans, en reconversion)**
Profil : a déjà fait 10 sessions, est en Phase 2, cherche de la profondeur.
Mission : tester le Mapping. Les forces/blocages correspondent-ils à ce qu'il a dit ? L'Ikigai se construit-il logiquement ?
Questions : Le Mapping lui apprend-il quelque chose sur lui-même ? Les blocages traités disparaissent-ils ?

**Agent 3 — Le Sceptique (30 ans, développeur)**
Profil : ne croit pas aux apps de développement personnel, cherche à trouver les failles.
Mission : tester la cohérence technique et logique. Noema répète-t-elle ? Se contredit-elle ? La mémoire fonctionne-t-elle vraiment ?
Questions : Noema se souvient-elle d'une session à l'autre ? Le Greffier extrait-il correctement ?

**Agent 4 — L'Impatient (19 ans, sans emploi)**
Profil : veut des résultats rapides, peu de patience, envoie des messages courts.
Mission : tester la résistance de Noema aux utilisateurs peu engagés. Noema s'adapte-t-elle aux réponses courtes ?
Questions : Noema relance-t-elle bien ? La Page Zen est-elle utile pour lui ?

**Agent 5 — L'Analyste Produit**
Profil : pas un utilisateur — un expert produit qui évalue la rétention.
Mission : analyser chaque onglet. Chat, Mapping, Journal, Page Zen. Après 1 semaine, 1 mois, 6 mois — qu'est-ce qui devient redondant ? Qu'est-ce qui manque ? Qu'est-ce qui devrait être supprimé ou amélioré ?
Questions : Quel onglet a le plus de valeur ? Lequel risque d'être abandonné ? Quelle feature manque vraiment ?

**Agent 6 — L'Investisseur**
Profil : analyse la viabilité à long terme.
Mission : à 100, 1000, 10 000 abonnés — est-ce que ça tient ? Les coûts API explosent-ils ? Le modèle freemium convertit-il ?
Questions : Quel est le vrai CAC estimé ? Le churn sera-t-il élevé ? 200 000 abonnés en 3 ans est-ce réaliste ?

## Format de sortie de chaque agent

### [Nom de l'agent]
**Profil :** ...
**Ce qui fonctionne ✅ :** ...
**Ce qui ne fonctionne pas ❌ :** ...
**Ce qui est redondant après X temps ⚠️ :** ...
**Ma recommandation :** ...
**Mon verdict /10 :** ...

## Le Débat Final
Après les 6 rapports, les agents débattent sur 3 questions :
1. Noema tient-elle sa promesse 'Tu n'as pas raté ta vie' ?
2. Quel est l'onglet le plus dispensable ?
3. Quelle est la priorité absolue pour les 30 prochains jours ?

Claude donne ensuite son verdict final — 5 actions concrètes dans l'ordre de priorité.

## Output
Tout est écrit dans `TESTER_REPORT.md` avec la date du test.
Ne modifier aucun fichier de code.
