# NOEMA - DIRECTIVES ARCHITECTURE ET PRODUIT

## Vision Produit
- SaaS d'accompagnement psychologique profond (Deep Coaching).
- Concept : "On ne fait pas pousser une graine dans un terreau infertile".
- Structure : 10 sessions majeures (1/semaine), divisées en sous-sessions quotidiennes.
- L'Ikigai complet n'est révélé qu'à la Session 8.

## Architecture Technique
- Front-end : React + Vite. Doit être un "Dashboard d'évolution" et pas juste un chat.
- Back-end : Orchestrateur de flux. Ne doit pas être un simple passe-plat.
- API IA : Utilise Claude (Anthropic). Doit générer une réponse texte + un bloc JSON technique caché.
- Base de Données : Hybride (PostgreSQL pour le relationnel, Vector DB pour la mémoire sémantique).

## Règles de Développement (Critique)
1. TOUTE réponse de l'IA doit inclure un bloc JSON structuré (voir prompt.js) pour mettre à jour l'interface.
2. Le Front-end doit intercepter ce JSON pour animer l'Ikigai et l'état mental sans que l'utilisateur voie le code.
3. Sécurité : L'IA doit avoir des garde-fous stricts sur la santé mentale.
4. Mémoire : Implémenter un système de résumé (Summarization) pour éviter l'explosion des tokens.

## Améliorations suggérées par l'Expert
- Remplacer le "simple chat" par une machine à états (XState).
- Créer une "Shadow Memory" (table Insights) pour stocker les hypothèses de l'IA.
- UI : Style "Glass-Introspection" avec mesh gradients et animations fluides.