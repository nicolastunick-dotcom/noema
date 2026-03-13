# NOEMA – Development Tasks

Project: Noema  
Type: SaaS web application  
Stack: React + Vite + Supabase + Netlify Functions

Goal:
Create a stable V1 of Noema and prepare the product for monetization.

---

## Development Rules

1. Never modify existing logic unless necessary.
2. When Codex modifies code, it must clearly mark the modification.

Example:

// --- CODEX CHANGE START ---
// Codex modification – reason of the change
...code...
// --- CODEX CHANGE END ---

3. Do not remove existing features without explanation.
4. Prefer minimal changes instead of rewriting entire files.
5. Always explain what files were modified.

---

## Current Priority Tasks

### Priority 1 — Fix landing page scroll

Problem:
The landing page exists but the page does not scroll.

Likely causes:
- CSS rule `overflow: hidden`
- `height: 100vh`
- layout wrapper blocking scroll

Files to inspect:

src/pages/Landing.jsx  
src/pages/AppShell.jsx  
src/styles/app.css

Goal:
Allow the landing page to scroll vertically so hidden sections appear.

---

### Priority 2 — Landing page sections

Verify that the following sections exist and appear when scrolling:

- Hero section
- How it works
- Noema phases
- What Noema detects
- Testimonials
- Pricing

If sections exist but are hidden, fix layout or CSS.

---

### Priority 3 — Stripe integration

Implement Stripe payments.

Plans:
- Monthly subscription: 19€
- Lifetime access: 97€

Requirements:

- Use Stripe Checkout
- Redirect user after payment
- Activate access in Supabase
- Create a `subscriptions` table in Supabase

Use environment variables:

VITE_STRIPE_PUBLIC_KEY (frontend)  
STRIPE_SECRET_KEY (Netlify functions)

---

### Priority 4 — Session ending system

Add intelligent session endings in Noema conversations.

When a conversation reaches ~20 messages:
- Noema proposes one action before next session.

Store the action in the UI layer as:

next_action

Display it in the Progress panel.

---

### Priority 5 — Minor UI improvements

- Replace chat avatar letter with image
- Add favicon
- Verify Google OAuth login
- Add Ikigai share feature

---

## Instructions for Codex

Before making changes:

1. Analyze the relevant files
2. Explain the cause of the issue
3. Propose a fix
4. Apply minimal modifications
5. Mark all modifications with CODEX CHANGE comments