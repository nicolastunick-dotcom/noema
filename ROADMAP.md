# 📋 ROADMAP Noema — Mardi 19h
Instructions prêtes à coller dans Claude Code, dans l'ordre exact. Une fois faite → ✅

---

## ✅ FAIT
- Landing page Stitch en place
- Structure propre : App.jsx / pages / components / netlify/functions
- Backend intact : claude.js + greffier.js

---

## 🔴 EN COURS — Reconstruction frontend écran par écran

**Règle absolue : ne jamais toucher au backend. Fichiers protégés : `claude.js`, `greffier.js`, `useNoemaSession`, `useNoemaRateLimit`, `prompt.js`**

### Étape 1 — Login ✅ (à valider)
> "Convertis le code HTML Stitch Login en React dans `src/pages/Login.jsx`. Garde la logique Supabase existante, remplace uniquement le design. Attends ma validation avant de continuer."

### Étape 2 — AppShell + Navigation bas
> "Crée la navigation bas fixe avec 4 onglets : Chat / Mapping / Journal / Aujourd'hui. Icônes : `forum` / `psychology_alt` / `auto_stories` / `light_mode`. L'onglet actif a un fond `#5B6CFF/15` et texte `#bdc2ff`. Les autres sont gris `#454655`. Intègre ça dans `AppShell.jsx` comme base de l'app principale."

### Étape 3 — Onglet Chat
> "Convertis le code HTML Stitch Chat en React dans `src/pages/ChatPage.jsx`. Garde toute la logique existante de `useNoemaApi` et `useNoemaRateLimit`. Remplace uniquement le design. Bulles de messages, zone de saisie, boutons rapides (Commencer / Approfondir / Résumé / Ikigai). Attends ma validation."

### Étape 4 — Onglet Mapping
> "Convertis le code HTML Stitch Mapping en React dans `src/pages/MappingPage.jsx`. Ce panneau affiche les données réelles de la couche `_ui` : forces, blocages, contradictions, ikigai. Connecte les données existantes de `useNoemaSession`. Design exact : diagramme Ikigai visuel, Forces Motrices avec % puissance, Blocages avec criticité, Contradictions, Zen Progress Ring. Attends ma validation."

### Étape 5 — Onglet Journal
> "Convertis le code HTML Stitch Journal en React dans `src/pages/JournalPage.jsx`. Le journal est guidé par Noema — la suggestion en haut vient du champ `next_action` de la couche `_ui`. Zone d'écriture libre. Pistes alternatives en scroll horizontal. Sauvegarde les entrées dans Supabase table `journal` (`user_id`, `date`, `content`, `prompt`, `tags`). Attends ma validation."

### Étape 6 — Onglet Aujourd'hui
> "Convertis le code HTML Stitch Aujourd'hui en React dans `src/pages/TodayPage.jsx`. Contenu généré quotidiennement par Noema via l'API : intention du jour, question de réflexion, défi concret, citation d'auteur. Le bouton 'Répondre dans le journal' ouvre l'onglet Journal avec la question pré-remplie. Checkbox défi cochable. Sauvegarde l'état dans Supabase. Attends ma validation."

---

## 🔴 PRIORITÉ HAUTE — Stripe

> "Intègre Stripe Checkout dans Noema. Produit : Noema Accès Mensuel, Price ID : `price_1TAZhkQh5xN0PliA3dUAqyqP`, 19€/mois. Les boutons CTA de la Landing appellent Stripe Checkout. Après paiement réussi → redirection vers `/app`. Après annulation → retour landing. Netlify Function `create-checkout-session.js` avec `STRIPE_SECRET_KEY`. Ajoute table `subscriptions` dans Supabase : `user_id`, `stripe_customer_id`, `plan`, `status`, `created_at`."

**Clés déjà configurées :**
- `STRIPE_SECRET_KEY` → Netlify Environment Variables ✅
- `VITE_STRIPE_PUBLIC_KEY` → `.env.local` ✅
- Product ID : `prod_U8rQscolFFcsnZ`
- Price ID : `price_1TAZhkQh5xN0PliA3dUAqyqP`

---

## 🔴 PRIORITÉ HAUTE — Système de phases dynamiques

> "Dans l'onglet Mapping, ajoute une section Parcours avec les phases de Noema. Phases fixes de base : Exploration / Mise en lumière / Reconstruction / Action. Phases dynamiques : Noema peut en créer via la couche `_ui` selon ce qu'il détecte. Visualisation en bulles animées flottantes, cliquables. Appuyer sur une bulle ouvre une page détaillée avec bouton retour. Notification discrète en haut à droite quand une nouvelle phase est débloquée : '🔓 Nouvelle phase débloquée — [nom]', disparaît après 5 secondes."

---

## 🟡 PRIORITÉ MOYENNE

### Fin de session intelligente
> "Dans le prompt Noema (`constants/prompt.js`), ajoute : quand la conversation atteint 20-25 messages ou que l'exploration est complète, Noema conclut naturellement en donnant une tâche concrète à faire avant la prochaine session. Dans la couche `_ui` ajouter champ `next_action`. Dans l'onglet Aujourd'hui afficher cette tâche."

### Avatar Noema
> "Dans l'onglet Chat, remplace la lettre N dans les bulles Noema par `public/avatar.png`. Style : 30x30px, borderRadius 9px, objectFit cover."

*Avant : préparer `avatar.png` dans `public/`*

### Favicon
> "Remplace le favicon par `public/favicon.png` dans `index.html`."

*Avant : préparer `favicon.png` 512x512px dans `public/`*

### Google OAuth
> "Vérifie que le bouton Continuer avec Google fonctionne via Supabase OAuth."

*Avant : configurer dans console.cloud.google.com + Supabase Auth Providers*

### Partage Ikigai (feature virale)
> "Dans l'onglet Mapping, ajoute un bouton Partager mon Ikigai qui génère une image PNG exportable avec `html2canvas`. Style dégradé violet/bleu, typographie Instrument Serif."

---

## 🔵 PLUS TARD
- Refactorisation (seulement si nécessaire)
- Dashboard analytics
- Mode mobile natif
- Programme 30 jours

---

## 📝 Infos projet
| Clé | Valeur |
|-----|--------|
| URL prod | `noemaapp.netlify.app` |
| GitHub | `github.com/nicolastunick-dotcom/noema` |
| Supabase | voir Netlify env vars |
| Stripe Product ID | `prod_U8rQscolFFcsnZ` |
| Stripe Price ID | `price_1TAZhkQh5xN0PliA3dUAqyqP` |
| Testeurs | 8 codes envoyés |
| Backend protégé | `claude.js` + `greffier.js` + `useNoemaSession` |

*Mis à jour le 24 mars 2026*
