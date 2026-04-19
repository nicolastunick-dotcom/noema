import { createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NoemaContext — Adapter runtime entre AppShell et les pages/composants UI
//
// RÈGLE CRITIQUE : Ce contexte expose UNIQUEMENT ce dont l'UI a besoin.
// Il ne contient AUCUNE logique métier. Toute la logique reste dans AppShell.
//
// Usage :
//   import { useNoemaRuntime } from "../context/NoemaContext";
//   const { msgs, send, phase, insights } = useNoemaRuntime();
//
// Contract stable :
//   → Ne pas modifier les noms des clés exposées sans audit complet
//   → Ne pas exposer callAPI, parseUI, applyUI, saveSession (internes AppShell)
//   → Ne pas déplacer de logique métier ici
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} NoemaRuntimeValue
 *
 * — State conversationnel
 * @property {Array}   msgs          - Messages affichés [{role, text, time, ...}]
 * @property {boolean} typing        - Noema est en train de répondre
 * @property {string}  input         - Valeur du champ de saisie
 * @property {Function} setInput     - Setter du champ de saisie
 *
 * — State sémantique
 * @property {number}  step          - Progression 0–10
 * @property {string}  etat          - État émotionnel : 'exploring' | 'blocked' | 'clarity'
 * @property {Object}  insights      - {forces[], blocages{racine,entretien,visible}, contradictions[]}
 * @property {Object}  ikigai        - {aime, excelle, monde, paie, mission}
 * @property {string}  nextAction    - Prochaine action concrète
 * @property {string}  sessionNote   - Note de session courante
 *
 * — State de phase (dérivé de step via getPhaseState)
 * @property {Object}  phaseContext  - {id, name, accent, step, overallProgress, navLabel, ...}
 *
 * — State de progression cross-sessions
 * @property {Object}  progressSignals - {recurringForces, recurringBlockages, openLoops, ...}
 * @property {Object}  proofState      - Proof of progress pour l'UI
 * @property {Object}  chatContinuity  - {mode, title, items, detail, meta, prompt}
 * @property {Object}  lastSessionSnapshot - Snapshot de la session précédente
 *
 * — Quota & accès
 * @property {Object|null} quotaState  - {remaining, exhausted, exhaustedMessage, tier}
 * @property {Object|null} accessState - État d'accès résolu par useSubscriptionAccess
 *
 * — Actions
 * @property {Function} send          - (text: string) => void — envoyer un message
 * @property {Function} newSession    - () => void — démarrer une nouvelle session
 * @property {Function} genIkigai     - () => void — déclencher génération Ikigai
 * @property {Function} handleLogout  - () => void — déconnexion
 * @property {Function} changeTab     - (tab: string) => void — changer d'onglet
 *
 * — Navigation
 * @property {Function} onNav         - (path: string) => void — navigation globale
 * @property {Function} onPricing     - () => void — aller à la page pricing
 *
 * — Références DOM (usage interne pages)
 * @property {Object}  taRef          - Ref textarea du chat
 * @property {Object}  msgsRef        - Ref container messages (scroll)
 *
 * — Données utilisateur
 * @property {Object|null} user       - Utilisateur Supabase Auth
 * @property {Object|null} sb         - Client Supabase
 * @property {string}  sessionId      - UUID stable de la session active
 */

export const NoemaContext = createContext(null);

/**
 * Hook principal pour consommer le runtime Noema dans n'importe quel composant
 * enfant d'AppShell.
 *
 * @returns {NoemaRuntimeValue}
 * @throws {Error} si utilisé hors du Provider AppShell
 */
export function useNoemaRuntime() {
  const ctx = useContext(NoemaContext);
  if (!ctx) {
    throw new Error(
      "[Noema] useNoemaRuntime() appelé hors du Provider. " +
      "Ce hook doit être utilisé dans un composant enfant d'AppShell."
    );
  }
  return ctx;
}
