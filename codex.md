## [2026-03-25 17:29 CET]

### Objectif
Mettre en place un vrai verrou d'acces payant entre la landing, la page pricing, la page login et l'application, avec verification d'abonnement centralisee et redirections propres.

### Fichiers modifies
- src/App.jsx
- src/lib/access.js
- src/hooks/useSubscriptionAccess.js
- src/pages/AppShell.jsx
- src/pages/Landing.jsx
- src/pages/Login.jsx
- src/pages/Pricing.jsx
- supabase-schema.sql
- codex.md

### Modifications effectuees
Creation d'un routage URL leger base sur `window.location.pathname` pour supporter `/`, `/pricing`, `/login`, `/onboarding`, `/app/chat`, `/app/mapping`, `/app/journal`, `/app/today` ainsi que les acces directs. Ajout d'une couche de verification d'abonnement centralisee via `useSubscriptionAccess`, branchee sur la table Supabase `subscriptions`, avec redirection automatique vers `login` si l'utilisateur n'est pas connecte et vers `pricing` si l'utilisateur n'a pas d'abonnement `active` ou `trialing`. Synchronisation des onglets internes avec l'URL via `AppShell`, mise a jour du flow `Login` pour ne plus ouvrir directement l'app apres connexion, adaptation de `Pricing` pour relier proprement connexion et futur checkout, ajout d'un CTA premium centre en haut de la landing vers la page pricing, et extension du schema local avec la table `subscriptions` et ses policies de lecture.

### Raisonnement
Le projet n'avait pas de vrai routage, donc un simple etat React ne suffisait pas pour securiser les acces directs par URL. La logique de garde a ete concentree dans `App.jsx` pour eviter les conditions eparpillees entre les pages, tandis que la verification d'abonnement a ete isolee dans un hook dedie afin de garder une source de verite unique et maintenable. Le systeme a ete pense en fail-closed: en cas d'absence de session, d'absence d'abonnement actif ou d'echec de verification, l'utilisateur n'entre pas dans l'application.

### Impact
- Les pages publiques restent accessibles librement: landing, pricing, login.
- Toute tentative d'acces a l'espace interne sans abonnement actif est maintenant bloquee et redirigee proprement.
- Une simple connexion ne donne plus acces au chat ou aux pages internes.
- Les URLs internes peuvent etre ouvertes directement sans contourner le verrou.
- L'application est preparee pour brancher Stripe sur une table `subscriptions` sans rearchitecturer le gate.

### A verifier / TODO
- Brancher le webhook Stripe pour inserer et maintenir la table `subscriptions` avec les statuts reels (`active`, `trialing`, `past_due`, `canceled`, etc.).
- Ajouter eventuellement une Netlify Function `create-checkout-session` pour transformer le placeholder pricing en vrai checkout.
- Verifier que la base distante contient bien la table `subscriptions` et la colonne `onboarding_done` dans `memory`, car le schema local n'incluait pas encore explicitement cette partie.
- Valider en environnement reel le flux OAuth Google + redirection retour vers la bonne URL interne.

## [2026-03-25 17:34 CET]

### Objectif
Corriger un cas limite de redirection pour eviter une boucle potentielle autour de `/onboarding` lors d'un acces direct suivi d'une connexion.

### Fichiers modifies
- src/App.jsx
- codex.md

### Modifications effectuees
Remplacement de la cible post-auth/post-abonnement afin qu'elle pointe toujours vers une route interne `/app/*` valide, meme quand la demande initiale provenait de `/onboarding`. Le callback de fin d'onboarding utilise maintenant cette cible normalisee.

### Raisonnement
`/onboarding` est une etape transitoire, pas une destination finale. Si elle reste memorisee comme cible post-login, elle peut provoquer une navigation inutile ou une boucle apres verification de l'etat d'onboarding. Normaliser la cible finale vers `/app/*` ferme proprement ce trou.

### Impact
- Les acces directs a `/onboarding` restent bloques tant que l'utilisateur n'est pas connecte et abonne.
- Une fois les verifications passees, la navigation de sortie retombe toujours sur une vraie page interne de l'application.

### A verifier / TODO
- Revalider le flux complet: visiteur -> `/onboarding` -> login -> verification abonnement -> onboarding -> `/app/chat`.

## [2026-03-25 17:42 CET]

### Type
Audit de sécurité

### Objectif
Cartographier l'architecture de Noema et identifier, sans modifier le code, les failles potentielles, les mauvaises pratiques de sécurité, les secrets exposés, les routes sensibles, les points d'entrée exploitables et les risques de contournement d'authentification, d'autorisation et de paywall.

### Périmètre analysé
- routes
- auth
- abonnement
- frontend
- backend
- variables d’environnement
- base de données
- paiements
- fichiers de configuration

### Fichiers inspectés
- .env.local
- .gitignore
- index.html
- netlify.toml
- vite.config.js
- README.md
- ROADMAP.md
- src/App.jsx
- src/constants/config.js
- src/lib/supabase.js
- src/lib/access.js
- src/hooks/useSubscriptionAccess.js
- src/pages/AppShell.jsx
- src/pages/ChatPage.jsx
- src/pages/Login.jsx
- src/pages/Landing.jsx
- src/pages/Pricing.jsx
- src/pages/Onboarding.jsx
- src/components/AdminPanel.jsx
- src/utils/helpers.js
- netlify/functions/claude.js
- netlify/functions/greffier.js
- supabase-schema.sql
- dist/assets/index-BYschfxm.js

### Vulnérabilités ou risques identifiés
- Niveau de gravité: critique
  Description du risque: la Netlify Function `/.netlify/functions/claude` agit comme un proxy Anthropic public, sans authentification serveur ni contrôle d'abonnement.
  Cause probable: l'endpoint accepte tout POST, applique `Access-Control-Allow-Origin: *`, et ne vérifie ni session Supabase ni statut d'abonnement avant d'appeler Anthropic.
  Impact possible: contournement complet du paywall, consommation frauduleuse de crédits API, automatisation d'abus depuis n'importe quel site tiers, déni de service financier.
  Surface d’exposition: [netlify/functions/claude.js](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js), en particulier [claude.js#L17](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L17), [claude.js#L38](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L38) et [claude.js#L120](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L120).

- Niveau de gravité: critique
  Description du risque: la limitation serveur annoncée n'est pas réellement active pour les appels frontend actuels.
  Cause probable: le frontend n'envoie ni `user_id`, ni `session_id`, ni jeton d'auth au backend lors des appels IA.
  Impact possible: absence de rate limit effectif, absence de traçabilité fiable, possibilité d'appels illimités même pour un utilisateur non payé ou non connecté.
  Surface d’exposition: [src/pages/AppShell.jsx#L121](/Users/nicolas/Projects/Noema/noema-project/src/pages/AppShell.jsx#L121) à [src/pages/AppShell.jsx#L132](/Users/nicolas/Projects/Noema/noema-project/src/pages/AppShell.jsx#L132), comparé à [netlify/functions/claude.js#L38](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L38) à [netlify/functions/claude.js#L64](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L64).

- Niveau de gravité: élevé
  Description du risque: présence d'un sink XSS direct dans le chat via injection HTML non échappée.
  Cause probable: `fmt()` transforme le texte en HTML sans échapper les balises, puis `dangerouslySetInnerHTML` l'injecte dans le DOM.
  Impact possible: exécution de JavaScript dans le navigateur si un utilisateur ou le modèle parvient à faire afficher du HTML malveillant, vol de session Supabase, exfiltration de données affichées, pivot vers d'autres actions utilisateur.
  Surface d’exposition: [src/pages/ChatPage.jsx#L231](/Users/nicolas/Projects/Noema/noema-project/src/pages/ChatPage.jsx#L231) et [src/utils/helpers.js#L8](/Users/nicolas/Projects/Noema/noema-project/src/utils/helpers.js#L8).

- Niveau de gravité: élevé
  Description du risque: des secrets live sensibles sont présents dans `.env.local`, y compris des clés qui ne devraient jamais être exposées au navigateur ni cohabiter dans un fichier de dev frontend.
  Cause probable: stockage local de `VITE_ANTHROPIC_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `VITE_ADMIN_CODES` et autres secrets opérationnels dans un même fichier.
  Impact possible: fuite de clés live si le poste est compromis, si le fichier est partagé, ou si le mode dev expose `VITE_ANTHROPIC_KEY` au navigateur; compromission Stripe/OpenAI/Anthropic; abus admin.
  Surface d’exposition: [.env.local](/Users/nicolas/Projects/Noema/noema-project/.env.local). Fuite confirmée localement, non confirmée dans les fichiers suivis Git au moment de l'audit.

- Niveau de gravité: élevé
  Description du risque: un code d'administration effectif est embarqué dans le bundle client.
  Cause probable: utilisation de `VITE_ADMIN_CODES` côté frontend; la valeur active est compilée dans le JS produit.
  Impact possible: découverte triviale du mécanisme admin côté client, tentative d'abus du flux de génération de codes d'accès, affaiblissement global du modèle de confiance.
  Surface d’exposition: [src/constants/config.js#L7](/Users/nicolas/Projects/Noema/noema-project/src/constants/config.js#L7), [src/pages/Login.jsx#L90](/Users/nicolas/Projects/Noema/noema-project/src/pages/Login.jsx#L90), confirmation dans [dist/assets/index-BYschfxm.js](/Users/nicolas/Projects/Noema/noema-project/dist/assets/index-BYschfxm.js).

- Niveau de gravité: élevé
  Description du risque: la table `access_codes` est trop permissive selon le schéma local.
  Cause probable: politique RLS de lecture publique totale et politique d'update accordée à n'importe quel utilisateur authentifié, y compris anonyme, sans restriction par ligne.
  Impact possible: énumération de tous les codes, lecture des expirations et compteurs, sabotage ou consommation forcée de codes, perturbation du système d'accès.
  Surface d’exposition: [supabase-schema.sql#L72](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L72) à [supabase-schema.sql#L90](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L90), et usage client dans [src/pages/Login.jsx#L102](/Users/nicolas/Projects/Noema/noema-project/src/pages/Login.jsx#L102) à [src/pages/Login.jsx#L120](/Users/nicolas/Projects/Noema/noema-project/src/pages/Login.jsx#L120).

- Niveau de gravité: moyen
  Description du risque: l'interface admin repose sur un contrôle client par email hardcodé.
  Cause probable: le composant admin s'affiche si `user.email === ADMIN_EMAIL`, sans vérification serveur ni rôle Supabase à ce niveau.
  Impact possible: surface admin fragile, fausse impression de protection, exposition du compte admin ciblé et du mécanisme d'activation.
  Surface d’exposition: [src/components/AdminPanel.jsx#L7](/Users/nicolas/Projects/Noema/noema-project/src/components/AdminPanel.jsx#L7) et [src/components/AdminPanel.jsx#L182](/Users/nicolas/Projects/Noema/noema-project/src/components/AdminPanel.jsx#L182).

- Niveau de gravité: moyen
  Description du risque: absence de Content-Security-Policy explicite et d'en-têtes renforcés complémentaires.
  Cause probable: `netlify.toml` ne définit pas de CSP ni de HSTS explicite; `index.html` n'ajoute pas non plus de politique restrictive.
  Impact possible: aggravation de l'impact d'un XSS, surface accrue pour chargements inattendus de scripts/ressources, défense en profondeur insuffisante.
  Surface d’exposition: [netlify.toml](/Users/nicolas/Projects/Noema/noema-project/netlify.toml) et [index.html](/Users/nicolas/Projects/Noema/noema-project/index.html).

- Niveau de gravité: moyen
  Description du risque: la fonction `claude` accepte un `model` client arbitraire et des messages arbitrairement longs.
  Cause probable: absence de liste blanche stricte côté serveur sur les modèles autorisés et absence de bornes sur la taille des `messages`.
  Impact possible: hausse de coûts, contournement d'intentions produit, surcharge serveur/API, comportements non maîtrisés.
  Surface d’exposition: [netlify/functions/claude.js#L67](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L67) à [netlify/functions/claude.js#L78](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L78).

- Niveau de gravité: moyen
  Description du risque: la vérification d'abonnement repose bien sur Supabase côté frontend, mais la chaîne de vérité paiement reste incomplète.
  Cause probable: absence de webhook Stripe, d'endpoint de checkout, et de synchronisation serveur documentée dans le code actuel; la table `subscriptions` est lue mais aucun backend ne la maintient.
  Impact possible: statuts d'accès obsolètes, abonnements non révoqués ou non activés correctement, confiance excessive dans un état base potentiellement manuel.
  Surface d’exposition: [src/hooks/useSubscriptionAccess.js#L36](/Users/nicolas/Projects/Noema/noema-project/src/hooks/useSubscriptionAccess.js#L36), [src/App.jsx#L150](/Users/nicolas/Projects/Noema/noema-project/src/App.jsx#L150), absence de code Stripe dans `netlify/functions/` et `src/`.

- Niveau de gravité: faible
  Description du risque: la table `profiles` est publiquement lisible.
  Cause probable: politique RLS `FOR SELECT USING (true)`.
  Impact possible: fuite de métadonnées `is_admin` et `created_at` si des UUID utilisateur sont connus ou devinés.
  Surface d’exposition: [supabase-schema.sql#L7](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L7) à [supabase-schema.sql#L19](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L19).

- Niveau de gravité: faible
  Description du risque: retour d'erreurs backend relativement bavard.
  Cause probable: renvoi direct de `err.message` et de messages upstream au client.
  Impact possible: aide à la reconnaissance technique, divulgation de détails de configuration ou d'états internes.
  Surface d’exposition: [netlify/functions/claude.js#L113](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L113) à [netlify/functions/claude.js#L117](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L117).

### Secrets ou données sensibles exposés
- Clé Supabase anon confirmée dans le bundle frontend et dans le code client. C'est attendu pour Supabase, mais cela devient dangereux car certaines politiques RLS sont trop ouvertes.
- Code admin `NOEMA-1234` confirmé dans le bundle de production. Exposition confirmée.
- `VITE_ANTHROPIC_KEY` live confirmée dans `.env.local`. Exposition confirmée localement; non confirmée dans le bundle de production courant.
- `STRIPE_SECRET_KEY` live confirmée dans `.env.local`. Exposition confirmée localement; non confirmée dans les fichiers Git inspectés.
- `OPENAI_API_KEY` live confirmée dans `.env.local`. Exposition confirmée localement; non confirmée dans les fichiers Git inspectés.
- `VITE_STRIPE_PUBLIC_KEY` live confirmée dans `.env.local`. Clé publique par nature, moins critique, mais usage live en environnement de dev à surveiller.
- `SUPABASE_SERVICE_ROLE_KEY` non trouvé dans les fichiers inspectés. Pas d'exposition confirmée dans le repo audité.
- `.env.local` n'est pas suivi par Git d'après l'état courant (`git ls-files`), ce qui réduit le risque de fuite historique dans le dépôt actuel, sans permettre de conclure sur l'intégralité de l'historique distant.

### Recommandations de correction
- Priorité 1
  Bloquer immédiatement l'accès public non authentifié à `/.netlify/functions/claude`.
- Priorité 1
  Exiger une authentification serveur vérifiable pour chaque appel IA et revalider côté serveur le statut d'abonnement avant tout appel modèle.
- Priorité 1
  Supprimer tout rendu HTML non échappé dans le chat ou introduire une sanitation stricte côté affichage.
- Priorité 1
  Retirer `VITE_ADMIN_CODES` du frontend et supprimer toute logique admin basée sur des secrets client.
- Priorité 1
  Corriger les policies RLS de `access_codes` pour empêcher la lecture globale et l'update arbitraire.
- Priorité 2
  Sortir toutes les clés live inutiles de `.env.local` et régénérer les secrets critiques exposés localement si le poste ou le fichier a pu être partagé.
- Priorité 2
  Introduire une CSP stricte et renforcer les headers HTTP.
- Priorité 2
  Ajouter une liste blanche côté serveur sur les modèles autorisés et borner la taille des requêtes IA.
- Priorité 2
  Mettre en place un vrai flux Stripe serveur: checkout session, webhook, synchronisation fiable de `subscriptions`.
- Priorité 3
  Remplacer le contrôle admin par des rôles Supabase/serveur réels.
- Priorité 3
  Réduire la verbosité des erreurs renvoyées au client.
- Priorité 3
  Réévaluer la policy publique de `profiles`.

### Modifications effectuées
Aucune modification du code effectuée à ce stade.
Audit uniquement. En attente de validation utilisateur.

### Plan d’action proposé
- Étape 1
  Fermer l'endpoint IA public et imposer auth + vérification d'abonnement côté serveur.
- Étape 2
  Corriger le sink XSS du chat et ajouter une CSP.
- Étape 3
  Retirer tous les secrets et codes admin côté client, puis faire rotation des clés sensibles exposées localement.
- Étape 4
  Durcir les policies RLS `access_codes` et réauditer l'ensemble des tables exposées via la clé anon.
- Étape 5
  Mettre en place le flux Stripe complet côté serveur avec webhook et synchronisation de `subscriptions`.
- Étape 6
  Réaliser un second audit de validation après corrections.

### À valider avant exécution
- Désactivation ou refonte de `/.netlify/functions/claude`
- Refonte du rendu HTML du chat
- Suppression du système `VITE_ADMIN_CODES`
- Durcissement des RLS Supabase sur `access_codes` et éventuelles autres tables
- Rotation des clés live présentes dans `.env.local`
- Implémentation du backend Stripe/webhook

## [2026-03-25 17:49 CET]

### Type
Audit de sécurité (mode prudence)

### Objectif
Produire un audit de sécurité approfondi avec classification du risque et plan de correction, sans toucher au backend, aux fonctions Netlify, à l'auth, à l'abonnement, à Stripe, à Supabase ou à la logique centrale de Noema.

### Périmètre analysé
- routes
- frontend
- backend
- auth
- abonnement
- base de données
- variables d’environnement
- paiements

### Vulnérabilités identifiées

#### [Proxy IA public sans contrôle serveur]

- Gravité: critique
- Zone: backend / abonnement / infra
- Description: `/.netlify/functions/claude` peut être appelé sans authentification serveur forte ni validation d'abonnement.
- Impact: contournement du paywall, abus de consommation Anthropic, coût financier, automatisation cross-site.
- Surface d’attaque: [netlify/functions/claude.js](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L17), [netlify/functions/claude.js](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L38), [netlify/functions/claude.js](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L120)

#### [Rate limiting serveur non effectif]

- Gravité: critique
- Zone: backend / abonnement
- Description: le frontend n'envoie pas les champs nécessaires pour déclencher la logique serveur de limitation et de traçabilité.
- Impact: appels IA potentiellement illimités, absence de contrôle réel par utilisateur, contournement pratique du gating économique.
- Surface d’attaque: [src/pages/AppShell.jsx](/Users/nicolas/Projects/Noema/noema-project/src/pages/AppShell.jsx#L121), [netlify/functions/claude.js](/Users/nicolas/Projects/Noema/noema-project/netlify/functions/claude.js#L42)

#### [Injection HTML dans le chat]

- Gravité: élevé
- Zone: frontend
- Description: le texte affiché dans le chat est converti en HTML puis injecté avec `dangerouslySetInnerHTML` sans échappement préalable.
- Impact: XSS, vol de session, exfiltration de données affichées, actions utilisateur détournées dans le navigateur.
- Surface d’attaque: [src/pages/ChatPage.jsx](/Users/nicolas/Projects/Noema/noema-project/src/pages/ChatPage.jsx#L231), [src/utils/helpers.js](/Users/nicolas/Projects/Noema/noema-project/src/utils/helpers.js#L8)

#### [Secrets live présents localement]

- Gravité: élevé
- Zone: infra / frontend
- Description: `.env.local` contient plusieurs secrets live sensibles, dont des clés qui ne devraient jamais être exposées à un runtime navigateur ou cohabiter avec des variables `VITE_`.
- Impact: compromission de comptes Stripe / OpenAI / Anthropic si fuite locale, partage, capture d'écran, poste compromis ou mauvais usage en dev.
- Surface d’attaque: [.env.local](/Users/nicolas/Projects/Noema/noema-project/.env.local)

#### [Code admin embarqué dans le bundle]

- Gravité: élevé
- Zone: frontend / auth
- Description: un code d'administration effectif est compilé côté client via `VITE_ADMIN_CODES`.
- Impact: découverte triviale du mécanisme admin, faiblesse structurelle du flux d'accès spécial, potentiel d'abus du système de génération de codes.
- Surface d’attaque: [src/constants/config.js](/Users/nicolas/Projects/Noema/noema-project/src/constants/config.js#L7), [src/pages/Login.jsx](/Users/nicolas/Projects/Noema/noema-project/src/pages/Login.jsx#L90), [dist/assets/index-BYschfxm.js](/Users/nicolas/Projects/Noema/noema-project/dist/assets/index-BYschfxm.js)

#### [RLS trop permissive sur access_codes]

- Gravité: élevé
- Zone: base de données / auth
- Description: le schéma local autorise une lecture publique globale de `access_codes` et une mise à jour par tout utilisateur authentifié, y compris anonyme.
- Impact: énumération des codes, sabotage, consommation forcée, fuite d'informations sur expirations et usages.
- Surface d’attaque: [supabase-schema.sql](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L72), [src/pages/Login.jsx](/Users/nicolas/Projects/Noema/noema-project/src/pages/Login.jsx#L105)

#### [Contrôle admin uniquement côté client]

- Gravité: moyen
- Zone: frontend / auth
- Description: l'affichage du panneau admin repose sur un email hardcodé dans l'interface.
- Impact: mécanisme fragile, exposition du compte admin ciblé, séparation insuffisante entre interface et autorisation réelle.
- Surface d’attaque: [src/components/AdminPanel.jsx](/Users/nicolas/Projects/Noema/noema-project/src/components/AdminPanel.jsx#L7), [src/components/AdminPanel.jsx](/Users/nicolas/Projects/Noema/noema-project/src/components/AdminPanel.jsx#L182)

#### [Absence de CSP stricte]

- Gravité: moyen
- Zone: frontend / infra
- Description: aucune Content-Security-Policy explicite n'est définie.
- Impact: un XSS réussi aurait un impact plus fort, sans couche de défense navigateur.
- Surface d’attaque: [netlify.toml](/Users/nicolas/Projects/Noema/noema-project/netlify.toml), [index.html](/Users/nicolas/Projects/Noema/noema-project/index.html)

#### [Validation paiement incomplète côté architecture]

- Gravité: moyen
- Zone: abonnement / paiements / backend
- Description: le frontend lit `subscriptions`, mais aucun flux Stripe complet n'est présent dans le code pour garantir une synchronisation robuste du statut.
- Impact: accès potentiellement désynchronisés, erreurs d'état d'abonnement, confiance excessive dans une table qui n'est pas automatiquement maintenue par le code actuel.
- Surface d’attaque: [src/hooks/useSubscriptionAccess.js](/Users/nicolas/Projects/Noema/noema-project/src/hooks/useSubscriptionAccess.js#L36), [src/App.jsx](/Users/nicolas/Projects/Noema/noema-project/src/App.jsx#L150), absence de webhook Stripe dans `netlify/functions/`

#### [Profiles publiquement lisible]

- Gravité: faible
- Zone: base de données
- Description: la policy locale de `profiles` autorise la lecture publique.
- Impact: fuite limitée de métadonnées liées aux comptes et à `is_admin`.
- Surface d’attaque: [supabase-schema.sql](/Users/nicolas/Projects/Noema/noema-project/supabase-schema.sql#L7)

### Classification des corrections

- Proxy IA public sans contrôle serveur
  Niveau de risque de modification: élevé
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Rate limiting serveur non effectif
  Niveau de risque de modification: élevé
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Injection HTML dans le chat
  Niveau de risque de modification: faible à moyen
  Peut être corrigé sans risque: oui, mais seulement via correction frontend locale très ciblée

- Secrets live présents localement
  Niveau de risque de modification: moyen
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Code admin embarqué dans le bundle
  Niveau de risque de modification: moyen
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- RLS trop permissive sur access_codes
  Niveau de risque de modification: élevé
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Contrôle admin uniquement côté client
  Niveau de risque de modification: moyen
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Absence de CSP stricte
  Niveau de risque de modification: faible à moyen
  Peut être corrigé sans risque: oui, mais à valider car une CSP mal calibrée peut casser le chargement de ressources

- Validation paiement incomplète côté architecture
  Niveau de risque de modification: élevé
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

- Profiles publiquement lisible
  Niveau de risque de modification: élevé
  Peut être corrigé sans risque: non
  → À implémenter par Claude Code

### Corrections proposées
- Priorité 1
  Sécuriser côté serveur l'endpoint IA et le couplage auth + abonnement.
- Priorité 1
  Corriger le rendu HTML du chat pour supprimer le vecteur XSS.
- Priorité 1
  Retirer tout secret ou code admin côté frontend.
- Priorité 1
  Durcir les accès base de données les plus exposés (`access_codes`, `profiles` si nécessaire).
- Priorité 2
  Mettre en place un vrai flux Stripe serveur avec webhook et synchronisation robuste.
- Priorité 2
  Ajouter une CSP stricte et réviser les headers HTTP.
- Priorité 3
  Refaire un audit après corrections pour valider qu'aucune régression n'a été introduite.

### Modifications effectuées
- Aucune modification critique effectuée
- Aucune modification backend effectuée
- Aucune modification auth / abonnement / Stripe / Supabase effectuée
- Mise à jour documentaire uniquement dans `codex.md`

### Plan d’action recommandé
- Étape 1 (sécurisation critique)
  Fermer la surface serveur exploitable: endpoint IA, contrôle d'abonnement côté serveur, limitation réelle.
- Étape 2
  Supprimer les vecteurs frontend directs: XSS, secrets/codes embarqués.
- Étape 3
  Corriger les points sensibles d'architecture: RLS, admin, Stripe/webhook.
- Étape 4
  Ajouter la défense en profondeur: CSP, réduction de verbosité, audit de validation.

### À implémenter par Claude Code
- Sécurisation de `/.netlify/functions/claude`
- Vérification serveur de session et d'abonnement
- Durcissement du rate limiting côté serveur
- Suppression du système `VITE_ADMIN_CODES`
- Refonte du flux admin
- Modifications Supabase / RLS
- Intégration Stripe/webhook/subscriptions
- Toute modification Netlify functions
- Toute modification backend
- Toute modification auth / abonnement / sécurité serveur

### À vérifier / TODO
- Valider si les clés live présentes localement ont pu être partagées ou exposées hors poste.
- Vérifier si une ancienne version du frontend a déjà embarqué `VITE_ANTHROPIC_KEY`.
- Vérifier la base Supabase réelle, qui peut différer du schéma local.
- Vérifier l'historique Git distant pour confirmer l'absence de fuite passée de secrets.
- Traiter l'arbre Git actuellement déjà sale avec prudence avant toute intervention de correction.
