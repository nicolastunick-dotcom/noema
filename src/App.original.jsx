import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY= import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
// En dev : proxy Vite → /api/claude
// En prod (Netlify) : /.netlify/functions/claude
const ANTHROPIC_PROXY = import.meta.env.DEV
  ? 'https://api.anthropic.com/v1/messages'
  : '/.netlify/functions/claude';
const MAX_HISTORY      = 24;

// ─────────────────────────────────────────────────────────────
// THEME SYSTEM
// ─────────────────────────────────────────────────────────────
const THEMES = {
  blocked:   { accent:"#F59E0B", soft:"rgba(245,158,11,0.09)",  border:"rgba(245,158,11,0.20)",  glow:"rgba(245,158,11,0.18)",  label:"Bloqué" },
  exploring: { accent:"#8A7CFF", soft:"rgba(138,124,255,0.09)", border:"rgba(138,124,255,0.20)", glow:"rgba(138,124,255,0.18)", label:"En exploration" },
  clarity:   { accent:"#5B6CFF", soft:"rgba(91,108,255,0.09)",  border:"rgba(91,108,255,0.20)",  glow:"rgba(91,108,255,0.18)",  label:"Clarté" },
};

function applyTheme(state) {
  const t = THEMES[state], r = document.documentElement;
  r.style.setProperty("--accent",        t.accent);
  r.style.setProperty("--accent-soft",   t.soft);
  r.style.setProperty("--accent-border", t.border);
  r.style.setProperty("--glow",          t.glow);
}


// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Noema v11 (prompt original intégral)
// + couche UI invisible : balise <_ui> supprimée avant affichage
// ─────────────────────────────────────────────────────────────
const NOEMA_SYSTEM = `Tu es Noema.
Tu n'es pas un assistant IA ordinaire. Tu es un guide d'accompagnement psychologique profond et stratégique. Tu poses les bonnes questions, tu réponds avec précision quand on t'en pose. Tu dis la vérité sans filtre — si l'utilisateur fait fausse route tu le lui dis clairement et directement. Mais tu ne détruis jamais. Tu corriges pour construire, pas pour blesser.
Tu as une philosophie fondamentale : on ne fait pas pousser une plante sur un terreau infertile. Tu travailles d'abord sur ce qui ne va pas, pour pouvoir construire quelque chose qui tient.

---
ACCUEIL
Quand quelqu'un arrive pour la première fois tu dis exactement ceci :
"Stop. Souffle. Vide ton esprit. Dis-moi quand t'es prêt."

---
EXPLORATION DISSIMULÉE
Tu engages une conversation naturelle et chaleureuse. Jamais un formulaire. Jamais une liste de questions. Une vraie conversation. Sans que l'utilisateur s'en rende compte tu explores en profondeur ET tu collectes simultanément TOUTES les données nécessaires pour le bilan ET pour l'Ikigai.

Ce que tu collectes pour le bilan :
- Forces naturelles, talents, victoires passées, ambitions, ce qui le fait vibrer
- Peurs profondes (rejet, abandon, échec, jugement), addictions, blocages répétitifs, problèmes relationnels, dettes, traumatismes, ce qui le freine sans qu'il s'en rende compte

Ce que tu collectes pour l'Ikigai — OBLIGATOIRE pendant l'exploration, jamais après :
- Ce qu'il aime profondément
- Ce pour quoi il est naturellement doué
- Ce dont il pense que le monde a besoin
- Ce pour quoi il pourrait être payé

RÈGLE ABSOLUE : Tu ne poses AUCUNE question supplémentaire au moment de créer l'Ikigai. Zéro. Tu utilises uniquement ce que tu as collecté pendant la conversation. Si une donnée manque, tu synthétises avec ce que tu as.
Tu construis la connaissance progressivement sur plusieurs sessions si nécessaire. Tu n'inventes rien, tu ne sur-interprètes pas.

---
DÉTECTION DES CONTRADICTIONS
Tu surveilles activement les écarts entre ce que l'utilisateur dit vouloir et ce que ses comportements révèlent. Quand tu détectes une contradiction tu la nommes avec bienveillance :
"Je remarque quelque chose. Tu me dis que tu veux X — mais tout ce que tu m'as dit jusqu'ici montre Y. Est-ce que ça te parle ou je me trompe ?"

---
NIVEAU DE CERTITUDE
Tu distingues toujours clairement :
- Ce qui est certain — schéma répété, avéré, confirmé par l'utilisateur
- Ce qui est probable — tendance claire mais pas encore validée
- Ce qui est une hypothèse — impression à vérifier
Tu parles avec l'assurance adaptée à chaque niveau.

---
VALIDATION AVANT AFFIRMATION
Avant de poser un bilan définitif sur un blocage tu vérifies toujours :
"J'ai l'impression que [blocage] influence certaines de tes décisions. Est-ce que ça te parle ?"
Tu n'étiquettes jamais quelqu'un sans sa validation.

---
SYNTHÈSE AVANT BILAN
Avant de livrer le bilan tu annonces ce que tu as compris :
"Je vais te partager ce que je crois comprendre de toi jusqu'ici. Dis-moi si je me trompe sur quelque chose."
L'utilisateur corrige, complète, valide. Ensuite seulement tu livres.

---
CLASSIFICATION ET PRIORITÉS
Tu classes ce que tu as détecté en deux catégories :

FORCES — classées de la plus puissante à la moins développée.

BLOCAGES — classés en trois niveaux :
- Blocage racine : celui qui bloque tout le reste, la source
- Blocage d'entretien : celui qui alimente et maintient les autres problèmes
- Blocage visible : ce que l'utilisateur perçoit lui-même, souvent le symptôme

Tu travailles en priorité sur le blocage racine.

---
BILAN
Tu livres une cartographie complète et honnête :
- Ce qui est fort, dans l'ordre de puissance
- Ce qui freine, dans l'ordre : racine → entretien → visible
- Les contradictions détectées entre désirs et comportements
Tu nommes les choses clairement, sans détour, sans brutalité inutile.

---
PASSAGE À L'ACTION
Tant que les blocages principaux ne sont pas suffisamment clarifiés, tu ne proposes pas de plan d'action ambitieux. Tu ne coaches pas trop tôt. L'action vient après le bilan — jamais avant.

---
PROTOCOLE DE SÉCURITÉ
Si l'utilisateur évoque une détresse grave, des idées suicidaires ou une urgence psychologique — tu arrêtes immédiatement tout accompagnement. Tu l'encourages clairement et avec bienveillance à contacter un professionnel de santé mentale ou une ligne d'écoute. Sa sécurité passe avant tout.

---
SWITCH NATUREL ENTRE LES MODES
Tu passes naturellement entre ces modes selon ce que la conversation demande :

MODE ANALYSE — pendant l'exploration et le bilan. Tu observes, tu écoutes, tu poses des questions ouvertes. Tu ne coaches pas encore.

MODE AUTEUR — tu t'inspires de la logique, du ton et des angles de lecture de l'auteur adapté, sans jamais perdre l'identité centrale de Noema :
- Napoleon Hill → doute sur la capacité à réussir
- Tony Robbins → besoin d'élan et d'action immédiate
- Carol Dweck → croyance que les défauts sont permanents
- Robert Kiyosaki → argent, dettes, liberté financière
- Morgan Housel → besoin de patience et vision long terme
- Ramit Sethi → stratégies concrètes sur l'argent
- Robert Greene → manipulation, mauvais entourage, dynamiques de pouvoir
- Jim Rohn → discipline, habitudes, environnement
Tu n'annonces pas que tu t'inspires d'un auteur. Tu le fais naturellement.

MODE COACH — après le bilan, quand les blocages sont clarifiés et la personne est prête. Tu proposes des actions concrètes adaptées, en commençant toujours par le blocage racine.

MODE RÉGULATION ÉMOTIONNELLE — quand tu détectes une détresse modérée. Tu pauses tout. Respiration guidée, ancrage, stabilisation. Seulement quand la personne va mieux tu reprends.

---
STYLE ET ATMOSPHÈRE
Tu utilises des émojis et des séparateurs visuels avec discernement — jamais en excès, toujours au bon moment. Ils servent à créer une atmosphère chaleureuse dans la conversation. Tu les utilises lors des moments clés : bilan, victoires de l'utilisateur, transitions importantes, Ikigai. Dans les moments intenses ou émotionnels tu restes sobre. Dans les moments de clarté ou de célébration tu peux être plus expressif.

---
IKIGAI — TEXTE DANS LE CHAT UNIQUEMENT
Après le bilan tu demandes : "Je peux te créer quelque chose ?"
Si oui — tu écris l'Ikigai directement dans le message, en texte.

Format exact :

✦ TON IKIGAI ✦

❤️ CE QUE TU AIMES
[données collectées pendant l'exploration]

💡 CE POUR QUOI TU ES DOUÉ
[données collectées pendant l'exploration]

🌍 CE DONT LE MONDE A BESOIN
[données collectées pendant l'exploration]

💰 CE POUR QUOI TU PEUX ÊTRE PAYÉ
[données collectées pendant l'exploration]

──────────────────────────
🌟 TA MISSION DE VIE
[synthèse en une ou deux phrases — claire, personnelle, puissante]
──────────────────────────

RAPPEL ABSOLU : zéro question supplémentaire. Toutes les données viennent de ce qui a été collecté pendant l'exploration.

---
LES DEUX CHEMINS
Tu demandes : "Tu veux qu'on travaille ça ensemble ?"
Si non → mode miroir, conseils ciblés, disponible pour toute conversation.
Si oui → tu expliques pédagogiquement comment le programme se déroulera. Tu choisis le rythme avec l'utilisateur — séances libres ou programmées. Chaque jour une action adaptée, en commençant toujours par le blocage racine.

---
ADAPTATION DU STYLE DE COMMUNICATION
Dès les premiers messages, tu observes silencieusement le style de l'utilisateur : vocabulaire (soutenu, courant, familier), longueur des messages, ton (formel, décontracté, introspectif), usage d'emojis ou non. Tu t'y adaptes naturellement — sans jamais le mentionner. Si l'utilisateur écrit court et direct, tu fais pareil. S'il développe, tu développes. Tu mémorises ce style dans la session_note (ex : "style direct, tutoiement, messages courts") pour le réinjecter à la session suivante.

---
TES LIMITES ET TON RÔLE
Tu restes centré sur l'accompagnement. Si l'utilisateur s'éloigne du cœur du travail tu le recadres avec souplesse, sauf si l'écart est utile à la compréhension de sa situation. Si une conversation tourne en rond tu le dis franchement et tu proposes de passer à l'étape suivante ou de clore la session.

---
FIN DE SESSION ET MÉMOIRE
À la fin de chaque session tu génères un résumé structuré : état émotionnel, avancées, blocages identifiés, contradictions détectées, ce qui a été dit d'important. Tu t'appuies sur ce résumé pour assurer la continuité. Tu compares l'état d'aujourd'hui avec les sessions précédentes et tu fais remarquer l'évolution, même subtile.

---
COUCHE INTERFACE — INVISIBLE POUR L'UTILISATEUR
À la toute fin de chaque réponse, après ton message naturel, tu ajoutes silencieusement ce bloc technique. L'utilisateur ne le voit jamais — il est intercepté et supprimé par l'interface avant affichage. C'est ta façon de faire vivre l'application en parallèle de la conversation.

Tu émets ce bloc JSON dans la balise <_ui> en te basant sur ce que tu as collecté dans la conversation jusqu'ici. Tu mets à jour les champs progressivement — tu ne laisses pas un champ vide si tu as déjà la donnée.

Format OBLIGATOIRE à la fin de chaque message (sans exception) :
<_ui>
{
  "etat": "blocked|exploring|clarity|regulation",
  "mode": "accueil|analyse|auteur|coach|regulation",
  "step": 0,
  "forces": [],
  "blocages": {
    "racine": "",
    "entretien": "",
    "visible": ""
  },
  "contradictions": [],
  "ikigai": {
    "aime": "",
    "excelle": "",
    "monde": "",
    "paie": "",
    "mission": ""
  },
  "session_note": ""
}
</_ui>

Règles pour remplir ce bloc :
- "etat" : état mental détecté de l'utilisateur à cet instant
- "mode" : mode actif (accueil = première réponse, ensuite selon la logique)
- "step" : étape du parcours — 0=accueil, 1=exploration, 2=forces émergentes, 3=blocages identifiés, 4=bilan livré, 5=ikigai créé, 6=action
- "forces" : liste des forces détectées jusqu'ici (strings courts, max 6)
- "blocages" : les trois niveaux — laisse "" si pas encore détecté
- "contradictions" : liste des contradictions repérées (strings courts, max 4)
- "ikigai" : remplis progressivement pendant l'exploration — ne pose JAMAIS de questions supplémentaires pour ça
- "session_note" : une phrase sur l'état de la session + le style de communication observé (ex : "Exploration blocage professionnel — style direct, tutoiement, messages courts")

Ce bloc est technique. Il ne fait pas partie de ta réponse à l'utilisateur. Tu le génères mécaniquement après chaque message, sans l'annoncer, sans en parler.`;

// ─────────────────────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────────────────────
function createSB() {
  if (!SUPABASE_URL || SUPABASE_URL === "YOUR_SUPABASE_URL") {
    console.warn("[Noema] Supabase non configuré — variables manquantes");
    return null;
  }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[Noema] Supabase client créé ✓", SUPABASE_URL);
    return client;
  } catch (e) {
    console.error("[Noema] Erreur création client Supabase:", e);
    return null;
  }
}
const sb = createSB();

function buildSystemPrompt(memory) {
  if (!memory || !memory.session_count) return NOEMA_SYSTEM;
  const notes = (memory.session_notes || []).slice(-6).map(n => `- ${n}`).join("\n");
  const forces = (memory.forces || []).join(", ");
  const ikigai = memory.ikigai || {};
  const ctx = [
    `\n\n---\nMÉMOIRE INTER-SESSIONS (${memory.session_count} session${memory.session_count > 1 ? "s" : ""} précédente${memory.session_count > 1 ? "s" : ""}) :`,
    notes ? `Notes des dernières sessions :\n${notes}` : "",
    forces ? `Forces identifiées jusqu'ici : ${forces}` : "",
    ikigai.aime    ? `Ikigai — ce qu'il aime : ${ikigai.aime}` : "",
    ikigai.excelle ? `Ikigai — ce en quoi il excelle : ${ikigai.excelle}` : "",
    ikigai.monde   ? `Ikigai — besoin du monde : ${ikigai.monde}` : "",
    ikigai.paie    ? `Ikigai — ce pour quoi il peut être payé : ${ikigai.paie}` : "",
    ikigai.mission ? `Ikigai — mission : ${ikigai.mission}` : "",
    "---",
    "Appuie-toi sur ces données pour assurer la continuité. Rappelle l'évolution par rapport aux sessions précédentes quand c'est pertinent.",
  ].filter(Boolean).join("\n");
  return NOEMA_SYSTEM + ctx;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const getTime = () => { const d = new Date(); return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0"); };

function fmt(text) {
  return text.split(/\n\n+/).filter(Boolean).map(p =>
    "<p>"+p.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n/g,"<br/>")+"</p>"
  ).join("");
}

// Parse la balise invisible <_ui> émise par Noema
function parseUI(raw) {
  const m = raw.match(/<_ui>([\s\S]*?)<\/_ui>/);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

// Supprime la balise avant affichage — jamais vue par l'utilisateur
function stripUI(raw) {
  return raw.replace(/<_ui>[\s\S]*?<\/_ui>/g, "").trim();
}

// Cap history
function trimHistory(h) {
  if (h.length <= MAX_HISTORY) return h;
  return [h[0], ...h.slice(-(MAX_HISTORY - 1))];
}

// Mappe l'état Noema → thème visuel
function mapEtat(etat) {
  if (etat === "blocked" || etat === "regulation") return "blocked";
  if (etat === "clarity") return "clarity";
  return "exploring";
}


// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#F7F8FC;--bg2:#EDEEF4;--surface:#FFF;--surface2:#F4F5F9;
  --border:rgba(15,23,42,.08);--border2:rgba(15,23,42,.13);
  --text:#0F172A;--text2:#4A5568;--text3:#94A3B8;
  --r:16px;--rs:10px;
  --accent:#5B6CFF;--accent-soft:rgba(91,108,255,.09);--accent-border:rgba(91,108,255,.20);--glow:rgba(91,108,255,.18);
  --sh-sm:0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04);
  --sh:0 4px 16px rgba(15,23,42,.08),0 1px 4px rgba(15,23,42,.04);
  --sh-lg:0 16px 48px rgba(15,23,42,.12),0 4px 16px rgba(15,23,42,.06);
  --t:300ms cubic-bezier(.4,0,.2,1);
}
html,body,#root{height:100%}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow:hidden}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* ── APP ── */
.app{height:100vh;display:flex;flex-direction:column}
.topbar{height:54px;flex-shrink:0;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:relative;z-index:50}
.tb-logo{font-family:'Instrument Serif',serif;font-size:1.2rem;color:var(--text);background:none;border:none;cursor:pointer;padding:0;letter-spacing:-.01em}
.tb-logo span{color:var(--accent);transition:color var(--t)}
.tb-right{display:flex;align-items:center;gap:10px}
.state-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:100px;font-size:.71rem;font-weight:500;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);transition:all var(--t);letter-spacing:.02em}
.state-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:sdot 2.4s ease-in-out infinite;transition:background var(--t)}
@keyframes sdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
.btn-sm{padding:6px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);font-size:.72rem;color:var(--text2);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t)}
.btn-sm:hover{border-color:var(--border2);color:var(--text)}

/* ── MAIN ── */
.main{flex:1;display:flex;overflow:hidden}

/* ── CHAT ── */
.chat{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.msgs{flex:1;overflow-y:auto;padding:20px 24px 8px;display:flex;flex-direction:column}

/* Welcome */
.welcome{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 20px;gap:14px;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.w-orb{width:60px;height:60px;border-radius:18px;background:var(--surface);box-shadow:var(--sh);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:2px;transition:box-shadow var(--t)}
.w-title{font-family:'Instrument Serif',serif;font-size:1.6rem;font-weight:400;line-height:1.2}
.w-sub{font-size:.85rem;color:var(--text2);line-height:1.65;max-width:260px}
.starters{display:flex;flex-direction:column;gap:7px;width:100%;max-width:340px;margin-top:6px}
.starter{padding:11px 15px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);font-size:.82rem;color:var(--text2);text-align:left;cursor:pointer;transition:all var(--t);font-family:'Plus Jakarta Sans',sans-serif}
.starter:hover{border-color:var(--accent-border);color:var(--text);background:var(--accent-soft);transform:translateX(3px)}

/* Msg */
.mg{margin-bottom:14px;animation:mIn .26s ease}
@keyframes mIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.mr{display:flex;gap:9px}.mr.user{flex-direction:row-reverse}
.mav{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:600;margin-top:2px}
.mr.noema .mav{background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent)}
.mr.user .mav{background:var(--surface2);border:1px solid var(--border);color:var(--text3)}
.mb{display:flex;flex-direction:column;gap:3px;max-width:76%}.mr.user .mb{align-items:flex-end}
.mmeta{font-size:.63rem;color:var(--text3);padding:0 3px;font-weight:500;letter-spacing:.03em}
.bubble{padding:11px 14px;border-radius:13px;font-size:.875rem;line-height:1.78;word-wrap:break-word}
.mr.noema .bubble{background:var(--surface);border:1px solid var(--border);border-top-left-radius:3px;box-shadow:var(--sh-sm);color:var(--text)}
.mr.user .bubble{background:var(--accent);color:white;border-top-right-radius:3px}
.bubble p{margin-bottom:7px}.bubble p:last-child{margin-bottom:0}
.bubble strong{font-weight:600}.bubble em{font-style:italic;opacity:.9}
.bubble.err{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18);color:#DC2626}
.ins-chip{margin-top:8px;padding:9px 12px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:9px;font-size:.77rem;color:var(--text2);line-height:1.55;transition:all var(--t)}
.ins-chip-lbl{font-size:.61rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:4px}

/* Typing */
.typ{display:flex;gap:9px;align-items:center;margin-bottom:14px;animation:mIn .22s ease}
.typ-b{padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:13px;border-top-left-radius:3px;box-shadow:var(--sh-sm);display:flex;gap:4px;align-items:center}
.td{width:5px;height:5px;border-radius:50%;background:var(--text3);animation:tdot 1.2s ease-in-out infinite}
.td:nth-child(2){animation-delay:.17s}.td:nth-child(3){animation-delay:.34s}
@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-4px);opacity:1}}

/* Input */
.inp-area{flex-shrink:0;padding:10px 24px 16px;background:rgba(247,248,252,.92);backdrop-filter:blur(8px);border-top:1px solid var(--border)}
.qrow{display:flex;gap:6px;margin-bottom:9px;flex-wrap:wrap}
.qc{padding:5px 11px;background:var(--surface);border:1px solid var(--border);border-radius:100px;font-size:.71rem;color:var(--text2);cursor:pointer;transition:all var(--t);font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap}
.qc:hover:not(:disabled){border-color:var(--accent-border);color:var(--accent);background:var(--accent-soft)}
.qc:disabled{opacity:.38;cursor:not-allowed}
.qc.sp{border-color:var(--accent-border);color:var(--accent);background:var(--accent-soft)}
.qc.sp:hover:not(:disabled){background:var(--accent);color:white;border-color:var(--accent)}
.irow{display:flex;gap:8px;align-items:flex-end}
textarea{flex:1;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-size:.875rem;outline:none;resize:none;line-height:1.6;min-height:44px;max-height:120px;transition:border-color var(--t),box-shadow var(--t);scrollbar-width:none}
textarea:focus{border-color:var(--accent-border);box-shadow:0 0 0 3px var(--accent-soft)}
textarea::placeholder{color:var(--text3)}
textarea::-webkit-scrollbar{display:none}
textarea:disabled{opacity:.5;cursor:not-allowed}
.send{width:44px;height:44px;border-radius:12px;flex-shrink:0;background:var(--accent);border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--t);opacity:.33}
.send.on{opacity:1}.send.on:hover{transform:translateY(-1px);box-shadow:0 4px 14px var(--glow)}
.send:disabled{cursor:not-allowed;transform:none!important}

/* Side */
.side{width:288px;flex-shrink:0;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.stabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;padding:0 4px}
.stab{flex:1;padding:12px 6px;background:transparent;border:none;border-bottom:2px solid transparent;font-family:'Plus Jakarta Sans',sans-serif;font-size:.71rem;font-weight:500;color:var(--text3);cursor:pointer;transition:all var(--t);margin-bottom:-1px}
.stab.on{color:var(--accent);border-bottom-color:var(--accent)}
.sc{flex:1;overflow-y:auto;padding:14px}
.ic{padding:13px;background:var(--bg);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:10px;transition:all var(--t)}
.ic:hover{border-color:var(--accent-border)}
.ic-lbl{display:flex;align-items:center;gap:5px;font-size:.63rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:7px}
.ic-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0}
.ic-items{display:flex;flex-direction:column;gap:5px}
.ic-item{font-size:.78rem;color:var(--text2);padding:6px 9px;background:var(--surface);border-radius:7px;border:1px solid var(--border);line-height:1.45}
.empty{font-size:.77rem;color:var(--text3);font-style:italic}
.pb{margin-bottom:16px}
.pl{font-size:.73rem;font-weight:500;color:var(--text2);margin-bottom:7px}
.pt{height:5px;background:var(--bg2);border-radius:10px;overflow:hidden;margin-bottom:3px}
.pf{height:100%;border-radius:10px;background:var(--accent);transition:width 1.1s cubic-bezier(.4,0,.2,1),background var(--t)}
.pm{display:flex;justify-content:space-between;font-size:.65rem;color:var(--text3)}
.sl{display:flex;flex-direction:column;gap:5px;margin-top:4px}
.sr{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;border:1px solid transparent;transition:all var(--t)}
.sr.on{background:var(--accent-soft);border-color:var(--accent-border)}
.si{width:26px;height:26px;border-radius:8px;flex-shrink:0;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.75rem;transition:all var(--t)}
.sr.on .si{background:var(--accent-soft);border-color:var(--accent-border)}
.sn{font-size:.78rem;font-weight:500;color:var(--text2);transition:color var(--t)}
.sr.on .sn{color:var(--accent)}
.ss{font-size:.66rem;color:var(--text3);margin-top:1px}
.sk{font-size:.65rem;color:var(--accent);opacity:0;transition:opacity var(--t);flex-shrink:0}
.sr.done .sk{opacity:1}
.ikg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.ikc{padding:13px;background:var(--bg);border:1px solid var(--border);border-radius:var(--rs);transition:all var(--t)}
.ikc:hover{border-color:var(--accent-border)}
.iki{font-size:1.2rem;margin-bottom:7px}
.ikl{font-size:.62rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:5px}
.ikv{font-size:.78rem;color:var(--text2);line-height:1.5}
.ike{font-size:.72rem;color:var(--text3);font-style:italic}
.btn-ikg{width:100%;padding:10px;border-radius:10px;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);font-size:.82rem;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t);text-align:center}
.btn-ikg:hover{background:var(--accent);color:white;border-color:var(--accent)}

/* Bottom nav */
.bnav{display:none;height:58px;flex-shrink:0;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-top:1px solid var(--border);align-items:center;justify-content:space-around;padding:0 6px}
.bni{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;padding:5px 8px;border-radius:10px;background:none;border:none;cursor:pointer;transition:all var(--t)}
.bni.on{background:var(--accent-soft)}
.bni-i{font-size:1.05rem}
.bni-l{font-size:.59rem;font-weight:500;color:var(--text3);font-family:'Plus Jakarta Sans',sans-serif}
.bni.on .bni-l{color:var(--accent)}

/* Modal */
.modal{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;overflow-y:auto;animation:slideUp .28s ease}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
.mh{padding:16px 18px 12px;display:flex;align-items:center;gap:12px;flex-shrink:0;position:sticky;top:0;background:var(--bg);z-index:1;border-bottom:1px solid var(--border)}
.mb-btn{width:32px;height:32px;border-radius:9px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.82rem;color:var(--text2);transition:all var(--t)}
.mb-btn:hover{border-color:var(--border2)}
.mt{font-family:'Instrument Serif',serif;font-size:1.2rem}
.mbody{padding:16px 18px;flex:1}

/* ── LANDING ── */
.land{display:flex;flex-direction:column;background:var(--bg);overflow-y:auto;min-height:100vh}
.lnav{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;flex-shrink:0}
.llogo{font-family:'Instrument Serif',serif;font-size:1.25rem;color:var(--text)}
.llogo-a{color:var(--accent);transition:color var(--t)}
.lnav-r{display:flex;align-items:center;gap:18px}
.llink{font-size:.8rem;color:var(--text2);text-decoration:none;transition:color var(--t)}
.llink:hover{color:var(--text)}
.btn-a{padding:8px 18px;border-radius:10px;background:var(--accent);color:white;border:none;font-size:.8rem;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t)}
.btn-a:hover{transform:translateY(-1px);box-shadow:0 4px 14px var(--glow)}
.hero{padding:80px 28px 60px;max-width:680px;margin:0 auto;text-align:center;width:100%}
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:100px;font-size:.71rem;color:var(--accent);font-weight:500;margin-bottom:26px;letter-spacing:.03em}
.h1{font-family:'Instrument Serif',serif;font-size:clamp(2.1rem,4.8vw,3.4rem);line-height:1.12;letter-spacing:-.02em;margin-bottom:18px}
.h1 em{font-style:italic;color:var(--accent)}
.hsub{font-size:.97rem;color:var(--text2);line-height:1.72;max-width:460px;margin:0 auto 34px}
.hbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-main{padding:13px 26px;background:var(--accent);color:white;border:none;border-radius:12px;font-size:.9rem;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:inline-flex;align-items:center;gap:7px;transition:all var(--t)}
.btn-main:hover{transform:translateY(-2px);box-shadow:0 8px 22px var(--glow)}
.btn-ol{padding:13px 20px;background:var(--surface);border:1px solid var(--border);border-radius:12px;color:var(--text2);font-size:.9rem;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t)}
.btn-ol:hover{border-color:var(--border2);color:var(--text)}
.lsec{padding:72px 28px;max-width:960px;margin:0 auto;width:100%}
.lsec-alt{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.ey{font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;text-align:center}
.sttl{font-family:'Instrument Serif',serif;font-size:clamp(1.5rem,3vw,2.1rem);text-align:center;margin-bottom:36px}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.fc{padding:20px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-sm);transition:all var(--t)}
.fc:hover{transform:translateY(-2px);box-shadow:var(--sh);border-color:var(--accent-border)}
.fi{font-size:1.3rem;margin-bottom:10px}
.fn{font-size:.86rem;font-weight:600;margin-bottom:5px}
.fd{font-size:.77rem;color:var(--text2);line-height:1.6}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:800px;margin:0 auto}
.sp-card{padding:18px;border-radius:var(--rs);border:1px solid}
.sp-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.85rem;margin-bottom:10px}
.sp-name{font-size:.82rem;font-weight:600;margin-bottom:4px}
.sp-desc{font-size:.75rem;color:var(--text2);line-height:1.5}
.pr{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:640px;margin:0 auto}
.pc{padding:26px 22px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);transition:all var(--t)}
.pc.feat{border-color:var(--accent-border);box-shadow:0 0 0 1px var(--accent-border),var(--sh)}
.pe{font-size:.63rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.pn{font-family:'Instrument Serif',serif;font-size:2.3rem;line-height:1;margin-bottom:3px}
.pp{font-size:.73rem;color:var(--text3);margin-bottom:18px}
.pfl{list-style:none;margin-bottom:20px}
.pfl li{font-size:.77rem;color:var(--text2);padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:7px;line-height:1.4}
.pfl li::before{content:'✓';color:var(--accent);font-size:.68rem;flex-shrink:0;margin-top:2px}
.btn-p{width:100%;padding:10px;border-radius:9px;cursor:pointer;font-size:.83rem;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t)}
.btn-p.soft{background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent)}
.btn-p.solid{background:var(--accent);border:1px solid var(--accent);color:white}
.btn-p:hover{transform:translateY(-1px);box-shadow:var(--sh-sm)}
.lfooter{padding:28px;border-top:1px solid var(--border);text-align:center;font-size:.72rem;color:var(--text3)}

/* ── LOGIN ── */
.lw{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px}
.lc{width:100%;max-width:392px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:34px 30px;box-shadow:var(--sh-lg);animation:fadeIn .45s ease}
.ll{font-family:'Instrument Serif',serif;font-size:1.3rem;text-align:center;margin-bottom:4px}
.ll span{color:var(--accent)}
.lt{font-size:.78rem;color:var(--text3);text-align:center;margin-bottom:26px}
.ltabs{display:flex;background:var(--bg2);border-radius:9px;padding:3px;margin-bottom:20px}
.ltab{flex:1;padding:7px;background:transparent;border:none;border-radius:7px;font-size:.79rem;font-family:'Plus Jakarta Sans',sans-serif;color:var(--text3);cursor:pointer;transition:all var(--t)}
.ltab.on{background:var(--surface);color:var(--text);box-shadow:var(--sh-sm)}
.fld{margin-bottom:13px}
.fld label{display:block;font-size:.69rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);margin-bottom:5px}
.fi-input{width:100%;padding:10px 13px;background:var(--bg);border:1px solid var(--border);border-radius:9px;color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;outline:none;transition:all var(--t)}
.fi-input:focus{border-color:var(--accent-border);background:var(--surface);box-shadow:0 0 0 3px var(--accent-soft)}
.fi-input::placeholder{color:var(--text3)}
.pw{position:relative}
.pw .fi-input{padding-right:38px}
.peye{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:.75rem;padding:3px;transition:color var(--t)}
.peye:hover{color:var(--text2)}
.fr{display:flex;justify-content:flex-end;margin-bottom:14px}
.fbtn{font-size:.71rem;color:var(--text3);background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:color var(--t)}
.fbtn:hover{color:var(--accent)}
.btn-auth{width:100%;padding:11px;background:var(--accent);color:white;border:none;border-radius:9px;font-size:.87rem;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all var(--t);margin-bottom:12px}
.btn-auth:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 16px var(--glow)}
.btn-auth:disabled{opacity:.48;cursor:not-allowed;transform:none}
.adiv{display:flex;align-items:center;gap:11px;margin-bottom:12px;font-size:.71rem;color:var(--text3)}
.adiv::before,.adiv::after{content:'';flex:1;height:1px;background:var(--border)}
.btn-g{width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:9px;color:var(--text2);font-size:.83rem;cursor:pointer;transition:all var(--t);display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Plus Jakarta Sans',sans-serif}
.btn-g:hover{border-color:var(--border2);background:var(--surface)}
.amsg{margin-top:11px;padding:9px 12px;border-radius:8px;font-size:.78rem;text-align:center;line-height:1.5}
.amsg.err{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18);color:#DC2626}
.amsg.ok{background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.18);color:#16A34A}
.lback{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:16px;font-size:.75rem;color:var(--text3);background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:color var(--t);width:100%}
.lback:hover{color:var(--accent)}
.code-input-wrap{position:relative;display:flex;align-items:center}
.code-prefix{position:absolute;left:12px;font-size:.87rem;font-weight:600;color:var(--accent);letter-spacing:.05em;pointer-events:none}
.code-input{width:100%;padding:11px 12px 11px 76px;border:1px solid var(--border2);border-radius:9px;font-size:.87rem;font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);letter-spacing:.1em;text-transform:uppercase;outline:none;transition:border-color var(--t)}
.code-input:focus{border-color:var(--accent)}
.code-generated{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:9px;margin-top:10px}
.code-generated span{font-weight:700;letter-spacing:.12em;color:var(--accent);font-size:.95rem}
.code-copy{font-size:.72rem;color:var(--accent);background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600}
.code-hint{font-size:.73rem;color:var(--text3);text-align:center;margin-top:8px;line-height:1.5}

/* Ldots */
.ld{display:inline-flex;gap:4px;align-items:center}
.ld span{display:block;width:5px;height:5px;border-radius:50%;background:currentColor;animation:ldot 1.1s ease-in-out infinite}
.ld span:nth-child(2){animation-delay:.17s}.ld span:nth-child(3){animation-delay:.34s}
@keyframes ldot{0%,80%,100%{transform:scale(.65);opacity:.35}40%{transform:scale(1);opacity:1}}

/* Responsive */
@media(max-width:768px){
  .side{display:none}.bnav{display:flex}
  .msgs{padding:16px 14px 6px}.inp-area{padding:8px 14px 14px}.topbar{padding:0 14px}
  .mb{max-width:85%}
}
@media(max-width:640px){
  .fg,.sg{grid-template-columns:1fr}
  .pr{grid-template-columns:1fr;max-width:380px}
  .hero{padding:52px 18px 40px}.lsec{padding:52px 18px}
  .lnav{padding:0 16px}.llink{display:none}
  .ikg{grid-template-columns:1fr}
}
`;

function injectCSS() {
  if (document.getElementById("nm3")) return;
  const s = document.createElement("style"); s.id="nm3"; s.textContent=CSS;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { icon:"🌱", name:"Exploration",    sub:"Qui tu es vraiment" },
  { icon:"💪", name:"Forces",         sub:"Classées par puissance" },
  { icon:"🔓", name:"Blocages",       sub:"Racine et entretien" },
  { icon:"⚡", name:"Contradictions", sub:"Ce qui freine" },
  { icon:"🌟", name:"Ikigai",         sub:"Ta raison d'être" },
  { icon:"🚀", name:"Action",         sub:"Les premiers pas" },
];

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
const MODE_LABELS = {
  accueil:    "Accueil",
  analyse:    "Analyse",
  auteur:     "Auteur",
  coach:      "Coach",
  regulation: "Régulation",
};

function StateBadge({ state, mode }) {
  return (
    <div className="state-badge">
      <div className="state-dot"/>
      <span>{THEMES[state].label}</span>
      {mode && mode !== "accueil" && (
        <span style={{opacity:.55, fontSize:".65rem"}}>· {MODE_LABELS[mode] || mode}</span>
      )}
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function SendSVG() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL CONTENTS (pure, no side effects)
// ─────────────────────────────────────────────────────────────
function InsightsPane({ insights }) {
  const { forces, blocages, contradictions } = insights;
  const hasBlocages = blocages.racine || blocages.entretien || blocages.visible;
  return (
    <>
      {/* Forces */}
      <div className="ic">
        <div className="ic-lbl"><div className="ic-dot"/>Forces détectées</div>
        <div className="ic-items">
          {forces.length > 0
            ? forces.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Émergent au fil de la conversation</span>}
        </div>
      </div>

      {/* Blocages — 3 niveaux */}
      <div className="ic">
        <div className="ic-lbl"><div className="ic-dot"/>Cartographie des blocages</div>
        {hasBlocages ? (
          <div className="ic-items">
            {blocages.racine    && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"#F59E0B",marginRight:6}}>Racine</span>{blocages.racine}</div>}
            {blocages.entretien && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"#8A7CFF",marginRight:6}}>Entretien</span>{blocages.entretien}</div>}
            {blocages.visible   && <div className="ic-item"><span style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",color:"var(--text3)",marginRight:6}}>Visible</span>{blocages.visible}</div>}
          </div>
        ) : <span className="empty">Identifiés après l'exploration</span>}
      </div>

      {/* Contradictions */}
      <div className="ic">
        <div className="ic-lbl"><div className="ic-dot"/>Contradictions</div>
        <div className="ic-items">
          {contradictions.length > 0
            ? contradictions.map((it,i) => <div className="ic-item" key={i}>{it}</div>)
            : <span className="empty">Détectées quand elles apparaissent</span>}
        </div>
      </div>
    </>
  );
}

function ProgressPane({ step, mentalState }) {
  const pct    = Math.max(Math.round(((step+1)/6)*100), 8);
  const clrPct = mentalState==="clarity" ? 72 : mentalState==="exploring" ? 38 : 12;
  return (
    <>
      <div className="pb">
        <div className="pl">Avancement de session</div>
        <div className="pt"><div className="pf" style={{width:`${pct}%`}}/></div>
        <div className="pm"><span>Étape {step+1}/6</span><span>{pct}%</span></div>
      </div>
      <div className="pb">
        <div className="pl">Clarté mentale</div>
        <div className="pt"><div className="pf" style={{width:`${clrPct}%`}}/></div>
        <div className="pm"><span>État actuel</span><span style={{color:"var(--accent)"}}>{THEMES[mentalState].label}</span></div>
      </div>
      <div className="pl" style={{marginBottom:8}}>Parcours</div>
      <div className="sl">
        {STEPS.map((s,i) => (
          <div className={`sr${i===step?" on":i<step?" done":""}`} key={s.name}>
            <div className="si">{i<step?"✓":s.icon}</div>
            <div style={{flex:1}}><div className="sn">{s.name}</div><div className="ss">{s.sub}</div></div>
            <div className="sk">✓</div>
          </div>
        ))}
      </div>
    </>
  );
}

function IkigaiPane({ ikigai, onGen }) {
  const items = [
    {icon:"❤️",label:"Ce que tu aimes",           k:"aime"},
    {icon:"💡",label:"Ce en quoi tu excelles",    k:"excelle"},
    {icon:"🌍",label:"Ce dont le monde a besoin", k:"monde"},
    {icon:"💰",label:"Ce pour quoi on te paie",   k:"paie"},
  ];
  return (
    <>
      <div className="ikg">
        {items.map(({icon,label,k}) => (
          <div className="ikc" key={k}>
            <div className="iki">{icon}</div>
            <div className="ikl">{label}</div>
            <div className="ikv">{ikigai[k] || <span className="ike">À découvrir</span>}</div>
          </div>
        ))}
      </div>
      {ikigai.mission && (
        <div style={{padding:"13px",background:"var(--accent-soft)",border:"1px solid var(--accent-border)",borderRadius:"var(--rs)",marginBottom:14}}>
          <div style={{fontSize:".62rem",fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"var(--accent)",marginBottom:6}}>🌟 Mission de vie</div>
          <div style={{fontSize:".82rem",color:"var(--text2)",lineHeight:1.65,fontStyle:"italic"}}>{ikigai.mission}</div>
        </div>
      )}
      <button className="btn-ikg" onClick={onGen}>✨ Générer mon Ikigai maintenant</button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING — Page d'accueil marketing
// ─────────────────────────────────────────────────────────────
function Landing({ onNav }) {
  const feats = [
    {icon:"🧠",name:"Introspection guidée",    desc:"Une question à la fois. Une conversation qui va en profondeur."},
    {icon:"🔍",name:"Insights en temps réel",  desc:"Forces, blocages et contradictions identifiés au fil de la conversation."},
    {icon:"🌟",name:"Ikigai personnalisé",     desc:"Construit depuis ta psychologie réelle, pas depuis un template."},
    {icon:"📈",name:"Progression visible",     desc:"Session par session — de bloqué à clarté mentale."},
    {icon:"🔄",name:"Mémoire inter-sessions",  desc:"Noema se souvient. Chaque session s'appuie sur la précédente."},
    {icon:"🎯",name:"Vérité sans filtre",      desc:"Ce dont tu as besoin, avec bienveillance — mais sans complaisance."},
  ];
  const steps = [
    { num:"01", title:"Tu parles. Noema écoute.", desc:"Pas de formulaire, pas de liste de questions. Une vraie conversation — chaleureuse, directe, sans jugement. Tu dis ce que tu portes.", accent:"#8A7CFF" },
    { num:"02", title:"Noema analyse en profondeur.", desc:"Pendant que tu parles, Noema cartographie tes forces, identifie tes blocages racines et repère les contradictions entre ce que tu dis vouloir et ce que tu fais.", accent:"#5B6CFF" },
    { num:"03", title:"Tu te comprends enfin.", desc:"Bilan honnête. Ikigai construit depuis ta réalité. Un plan d'action qui commence là où ça bloque vraiment — pas là où c'est confortable.", accent:"#3B82F6" },
  ];
  const testimonials = [
    { quote:"J'avais l'impression de tourner en rond depuis des années. En une session, Noema a nommé exactement ce qui me bloquait. Je savais, mais je ne voulais pas voir.", name:"Camille R.", role:"26 ans · Reconversion professionnelle" },
    { quote:"Ce n'est pas un chatbot. C'est quelque chose qui te regarde vraiment. Ça m'a dit une vérité que personne autour de moi n'aurait osé formuler.", name:"Thomas M.", role:"31 ans · Entrepreneur" },
    { quote:"Mon Ikigai, je le cherchais depuis 3 ans. Noema l'a construit en une conversation, depuis ce que j'avais dit naturellement. C'était exactement moi.", name:"Léa K.", role:"24 ans · Étudiante" },
  ];
  return (
    <div className="land">
      <nav className="lnav">
        <div className="llogo">Noema<span className="llogo-a">.</span></div>
        <div className="lnav-r">
          <a href="#how"   className="llink">Comment ça marche</a>
          <a href="#feat"  className="llink">Fonctionnalités</a>
          <a href="#price" className="llink">Tarifs</a>
          <button className="btn-a" onClick={() => onNav("login")}>Commencer →</button>
        </div>
      </nav>

      {/* HERO gradient */}
      <div style={{background:"linear-gradient(135deg,#F0F1FF 0%,#F7F4FF 35%,#FFF8F0 70%,#F7F8FC 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-80px",right:"-60px",width:"420px",height:"420px",borderRadius:"50%",background:"radial-gradient(circle,rgba(138,124,255,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"-60px",left:"-40px",width:"360px",height:"360px",borderRadius:"50%",background:"radial-gradient(circle,rgba(91,108,255,0.10) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:720,margin:"0 auto",padding:"100px 28px 80px",textAlign:"center",position:"relative"}}>
          <div className="badge" style={{marginBottom:28}}>◎ Guide d'introspection IA</div>
          <h1 className="h1" style={{marginBottom:22}}>
            Tu n'as pas raté ta vie.<br/>
            <em>Tu ne t'es juste jamais<br/>vraiment connu.</em>
          </h1>
          <p className="hsub" style={{fontSize:"1.02rem",maxWidth:520,margin:"0 auto 38px"}}>
            Noema est un guide psychologique profond propulsé par l'IA. Il pose les bonnes questions, dit la vérité sans filtre — et construit avec toi une carte de qui tu es vraiment.
          </p>
          <div className="hbtns" style={{marginBottom:52}}>
            <button className="btn-main" onClick={() => onNav("login")}>Commencer maintenant →</button>
            <button className="btn-ol"   onClick={() => onNav("app")}>Voir la démo</button>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:48,flexWrap:"wrap"}}>
            {[{val:"1 session",label:"pour un premier bilan complet"},{val:"100%",label:"construit depuis ta réalité"},{val:"0",label:"question de trop"}].map(s => (
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.7rem",color:"#0F172A",lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:".72rem",color:"#94A3B8",marginTop:4,maxWidth:120}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUI EST NOEMA */}
      <div style={{background:"#0F172A",padding:"80px 28px"}}>
        <div style={{maxWidth:760,margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",background:"rgba(138,124,255,0.15)",border:"1px solid rgba(138,124,255,0.25)",borderRadius:"100px",fontSize:".71rem",color:"#8A7CFF",fontWeight:500,marginBottom:28,letterSpacing:".04em"}}>◎ QUI EST NOEMA</div>
          <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(1.8rem,3.5vw,2.6rem)",color:"white",lineHeight:1.2,marginBottom:24}}>
            Pas un assistant.<br/><span style={{color:"#8A7CFF",fontStyle:"italic"}}>Un guide.</span>
          </h2>
          <p style={{fontSize:".97rem",color:"rgba(255,255,255,0.58)",lineHeight:1.85,maxWidth:580,margin:"0 auto 24px"}}>
            Noema ne te donne pas des conseils génériques. Il observe, écoute, et construit une compréhension profonde de qui tu es — tes forces réelles, tes blocages racines, tes contradictions cachées.
          </p>
          <p style={{fontSize:".97rem",color:"rgba(255,255,255,0.58)",lineHeight:1.85,maxWidth:580,margin:"0 auto"}}>
            Sa philosophie : <span style={{color:"rgba(255,255,255,0.85)",fontStyle:"italic"}}>on ne fait pas pousser une plante sur un terreau infertile.</span> Il travaille d'abord sur ce qui ne va pas — pour construire quelque chose qui tient.
          </p>
        </div>
      </div>

      {/* COMMENT ÇA MARCHE */}
      <div id="how" style={{padding:"80px 28px",background:"var(--bg)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div className="ey">Processus</div>
          <div className="sttl">Comment ça marche</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
            {steps.map((s,i) => (
              <div key={i} style={{padding:"28px 24px",background:"white",border:"1px solid var(--border)",borderRadius:"var(--r)",boxShadow:"var(--sh-sm)",position:"relative",overflow:"hidden",transition:"all var(--t)"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=s.accent+"33";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor="var(--border)";}}
              >
                <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,${s.accent},transparent)`}}/>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"3rem",color:s.accent+"22",lineHeight:1,marginBottom:16}}>{s.num}</div>
                <div style={{fontSize:".93rem",fontWeight:600,color:"var(--text)",marginBottom:10,lineHeight:1.35}}>{s.title}</div>
                <p style={{fontSize:".79rem",color:"var(--text2)",lineHeight:1.7}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TÉMOIGNAGES */}
      <div style={{background:"linear-gradient(135deg,#F0F1FF 0%,#F7F8FC 50%,#F4F0FF 100%)",padding:"80px 28px",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div className="ey">Témoignages</div>
          <div className="sttl">Ce que ça change, vraiment</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {testimonials.map((t,i) => (
              <div key={i} style={{padding:"26px 22px",background:"white",border:"1px solid var(--border)",borderRadius:"var(--r)",boxShadow:"var(--sh-sm)",display:"flex",flexDirection:"column",gap:16}}>
                <div style={{fontSize:"1.6rem",color:"var(--accent)",lineHeight:1,opacity:.4}}>"</div>
                <p style={{fontSize:".83rem",color:"var(--text)",lineHeight:1.78,fontStyle:"italic",flex:1}}>{t.quote}</p>
                <div style={{borderTop:"1px solid var(--border)",paddingTop:14}}>
                  <div style={{fontSize:".8rem",fontWeight:600,color:"var(--text)"}}>{t.name}</div>
                  <div style={{fontSize:".71rem",color:"var(--text3)",marginTop:2}}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="lsec" id="feat">
        <div className="ey">Fonctionnalités</div>
        <div className="sttl">Tout ce dont tu as besoin</div>
        <div className="fg">
          {feats.map(f => (
            <div className="fc" key={f.name}>
              <div className="fi">{f.icon}</div>
              <div className="fn">{f.name}</div>
              <p className="fd">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{background:"linear-gradient(135deg,#5B6CFF 0%,#8A7CFF 100%)",padding:"72px 28px",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",color:"white",marginBottom:16,lineHeight:1.2}}>Prêt à te connaître vraiment ?</h2>
          <p style={{fontSize:".92rem",color:"rgba(255,255,255,0.72)",lineHeight:1.7,marginBottom:32}}>La première session suffit pour voir ce que tu portes depuis longtemps.</p>
          <button onClick={() => onNav("login")} style={{padding:"14px 32px",background:"white",color:"#5B6CFF",border:"none",borderRadius:"12px",fontSize:".95rem",fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"all var(--t)"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}
          >Commencer maintenant →</button>
        </div>
      </div>

      {/* PRICING */}
      <div style={{padding:"80px 28px",background:"var(--bg)"}} id="price">
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div className="ey">Accès</div>
          <div className="sttl">Simple et honnête</div>
          <div className="pr">
            <div className="pc">
              <div className="pe">Mensuel</div>
              <div className="pn">€19<span style={{fontSize:"1rem"}}>/mois</span></div>
              <div className="pp">Résiliable à tout moment</div>
              <ul className="pfl">{["Conversations illimitées","Insights en temps réel","Ikigai personnalisé","Mémoire inter-sessions"].map(i=><li key={i}>{i}</li>)}</ul>
              <button className="btn-p soft" onClick={() => onNav("login")}>Commencer</button>
            </div>
            <div className="pc feat">
              <div className="pe">Accès à vie · Recommandé</div>
              <div className="pn">€97</div>
              <div className="pp">Un seul paiement, pour toujours</div>
              <ul className="pfl">{["Tout du mensuel inclus","Accès permanent","Futures fonctionnalités","Priorité support"].map(i=><li key={i}>{i}</li>)}</ul>
              <button className="btn-p solid" onClick={() => onNav("login")}>Accès à vie →</button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{background:"#0F172A",padding:"40px 28px"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.2rem",color:"white"}}>Noema<span style={{color:"#8A7CFF"}}>.</span></div>
          <div style={{fontSize:".72rem",color:"rgba(255,255,255,0.35)",textAlign:"center",flex:1}}>Outil d'exploration personnelle — ne remplace pas un suivi thérapeutique professionnel.</div>
          <div style={{fontSize:".72rem",color:"rgba(255,255,255,0.25)"}}>© 2025 Noema</div>
        </div>
      </div>
    </div>
  );
}
// Charset lisible sans ambiguïtés visuelles (0/O, 1/I/L)
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function genCode() {
  let s = "";
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "NOEMA-" + s;
}
const ADMIN_CODES = (import.meta.env.VITE_ADMIN_CODES || "").split(",").map(c => c.trim()).filter(Boolean);

function Login({ onNav }) {
  const [tab,       setTab]       = useState("login");
  const [f,         setF]         = useState({name:"",email:"",password:""});
  const [show,      setShow]      = useState(false);
  const [load,      setLoad]      = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [code,      setCode]      = useState("");
  const [generated, setGenerated] = useState(null); // code généré affiché à l'admin
  const [copied,    setCopied]    = useState(false);

  const upd = (k,v) => setF(p=>({...p,[k]:v}));
  const sw  = t => { setTab(t); setMsg(null); setGenerated(null); };

  const errMsg = m => {
    if (!m) return "Une erreur est survenue.";
    if (m.includes("Invalid login"))      return "Email ou mot de passe incorrect.";
    if (m.includes("already registered")) return "Cet email est déjà utilisé.";
    if (m.includes("Password"))           return "Mot de passe trop court (8 caractères min).";
    if (m.includes("rate limit"))         return "Trop de tentatives — attends quelques minutes.";
    return m;
  };

  async function doLogin() {
    if (!f.email||!f.password) { setMsg({t:"Remplis tous les champs.",e:true}); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(()=>onNav("app"),800); return; }
    try {
      const {error} = await sb.auth.signInWithPassword({email:f.email,password:f.password});
      if (error) throw error; onNav("app");
    } catch(e) { setLoad(false); setMsg({t:errMsg(e.message),e:true}); }
  }

  async function doSignup() {
    if (!f.name||!f.email||!f.password) { setMsg({t:"Remplis tous les champs.",e:true}); return; }
    if (f.password.length<8) { setMsg({t:"8 caractères minimum.",e:true}); return; }
    setLoad(true); setMsg(null);
    if (!sb) { setTimeout(()=>onNav("app"),800); return; }
    try {
      const {error} = await sb.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.name}}});
      if (error) throw error;
      setLoad(false); setMsg({t:"Vérifie ta boîte mail pour confirmer.",e:false});
    } catch(e) { setLoad(false); setMsg({t:errMsg(e.message),e:true}); }
  }

  async function doCode() {
    const raw = code.trim().toUpperCase().replace(/^NOEMA-/,"");
    const input = raw ? "NOEMA-" + raw : "";
    if (!input) { setMsg({t:"Entre un code d'accès.",e:true}); return; }
    setLoad(true); setMsg(null);

    // Code admin → génère un nouveau code d'accès
    if (ADMIN_CODES.includes(input)) {
      const newCode = genCode();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      if (sb) {
        const {error} = await sb.from("access_codes").insert({ code: newCode, expires_at: expires, max_uses: 1 });
        if (error) { setLoad(false); setMsg({t:"Erreur création code : "+error.message, e:true}); return; }
      }
      setGenerated(newCode);
      setLoad(false);
      return;
    }

    // Code utilisateur → valider dans Supabase
    if (!sb) { setLoad(false); setMsg({t:"Supabase non configuré.",e:true}); return; }
    await new Promise(r => setTimeout(r, 500));
    const now = new Date().toISOString();
    const {data, error} = await sb.from("access_codes")
      .select("id, code, expires_at, max_uses, use_count")
      .eq("code", input)
      .gt("expires_at", now)
      .maybeSingle();

    if (error || !data) { setLoad(false); setMsg({t:"Code invalide ou expiré.",e:true}); return; }
    if (data.use_count >= data.max_uses) { setLoad(false); setMsg({t:"Ce code a déjà été utilisé.",e:true}); return; }

    // Connexion anonyme Supabase
    const {data: authData, error: authErr} = await sb.auth.signInAnonymously();
    if (authErr) { setLoad(false); setMsg({t:"Erreur connexion : "+authErr.message,e:true}); return; }

    // Incrémente use_count + enregistre used_by
    await sb.from("access_codes").update({
      use_count: data.use_count + 1,
      used_by:   authData.user.id,
    }).eq("id", data.id);

    // onAuthStateChange dans Root gère la navigation automatiquement
  }

  const codeReady = code.replace(/^NOEMA-/i,"").length === 5;

  const onEnter = e => {
    if (e.key !== "Enter") return;
    if (tab === "login") doLogin();
    else if (tab === "signup") doSignup();
    else if (tab === "code" && codeReady) doCode();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lw">
      <div className="lc">
        <div className="ll">Noema<span>.</span></div>
        <div className="lt">Ton guide d'introspection</div>
        <div className="ltabs">
          <button className={`ltab${tab==="login"?" on":""}`}   onClick={()=>sw("login")}>Connexion</button>
          <button className={`ltab${tab==="signup"?" on":""}`}  onClick={()=>sw("signup")}>Inscription</button>
          <button className={`ltab${tab==="code"?" on":""}`}    onClick={()=>sw("code")}>Code d'accès</button>
        </div>

        {/* Onglet Connexion / Inscription */}
        {(tab==="login"||tab==="signup") && <>
          {tab==="signup"&&<div className="fld"><label>Prénom</label><input className="fi-input" type="text" placeholder="Ton prénom" value={f.name} onChange={e=>upd("name",e.target.value)} onKeyDown={onEnter}/></div>}
          <div className="fld"><label>Email</label><input className="fi-input" type="email" placeholder="ton@email.com" value={f.email} onChange={e=>upd("email",e.target.value)} onKeyDown={onEnter}/></div>
          <div className="fld"><label>Mot de passe</label>
            <div className="pw">
              <input className="fi-input" type={show?"text":"password"} placeholder={tab==="signup"?"8 caractères minimum":"········"} value={f.password} onChange={e=>upd("password",e.target.value)} onKeyDown={onEnter} autoComplete={tab==="signup"?"new-password":"current-password"}/>
              <button className="peye" type="button" onClick={()=>setShow(v=>!v)}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {tab==="login"&&<div className="fr"><button className="fbtn">Mot de passe oublié ?</button></div>}
          {tab==="signup"&&<div style={{marginBottom:14}}/>}
          <button className="btn-auth" onClick={tab==="login"?doLogin:doSignup} disabled={load}>
            {load?<span className="ld"><span/><span/><span/></span>:tab==="login"?"Continuer →":"Créer mon espace →"}
          </button>
          <div className="adiv">ou</div>
          <button className="btn-g" onClick={async()=>{
            if(!sb){onNav("app");return;}
            await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
          }}><GoogleSVG/> Continuer avec Google</button>
        </>}

        {/* Onglet Code d'accès */}
        {tab==="code" && <>
          <div className="fld">
            <label>Code d'accès</label>
            <div className="code-input-wrap">
              <span className="code-prefix">NOEMA-</span>
              <input
                className="code-input"
                type="text"
                placeholder="X7K2P"
                maxLength={5}
                value={code.replace(/^NOEMA-/i,"")}
                onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                onKeyDown={onEnter}
                autoComplete="off"
              />
            </div>
          </div>
          <button className="btn-auth" onClick={doCode} disabled={load||!codeReady}>
            {load?<span className="ld"><span/><span/><span/></span>:"Accéder →"}
          </button>
          {generated && (
            <div>
              <div className="code-generated">
                <span>{generated}</span>
                <button className="code-copy" onClick={copyCode}>{copied?"Copié !":"Copier"}</button>
              </div>
              <p className="code-hint">Code valable 7 jours · 1 utilisation</p>
            </div>
          )}
          <p className="code-hint" style={{marginTop:12}}>Tu as reçu un code d'accès ? Entre les 5 derniers caractères ci-dessus.</p>
        </>}

        {msg&&<div className={`amsg ${msg.e?"err":"ok"}`}>{msg.t}</div>}
        <button className="lback" onClick={()=>onNav("landing")}>← Retour à l'accueil</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP SHELL — Composant principal : chat + panneaux latéraux
// Sections internes :
//   1. STATE & REFS
//   2. OPENING MESSAGE (premier message automatique)
//   3. EFFECTS (mémoire, thème, scroll)
//   4. API (callAPI)
//   5. UI HANDLER (applyUI)
//   6. RATE LIMIT (checkRateLimit)
//   7. SEND (envoi message utilisateur)
//   8. SAVE SESSION (sauvegarde Supabase)
//   9. ACTIONS (reset, newSession, genIkigai)
//  10. RENDER (JSX)
// ─────────────────────────────────────────────────────────────
function AppShell({ onNav, user }) {
  // ── 1. STATE & REFS ──────────────────────────────────────────
  const [msgs,     setMsgs]     = useState([]);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const [mstate,   setMstate]   = useState("exploring");
  const [step,     setStep]     = useState(0);
  const [sideTab,  setSideTab]  = useState("insights");
  const [mobTab,   setMobTab]   = useState("chat");
  const [insights, setInsights] = useState({forces:[],blocages:{racine:"",entretien:"",visible:""},contradictions:[]});
  const [ikigai,   setIkigai]   = useState({aime:"",excelle:"",monde:"",paie:"",mission:""});
  const [mode,     setMode]     = useState("accueil"); // mode Noema actif

  const history         = useRef([]);
  const lastSessionNote = useRef("");
  const memoryRef        = useRef(null); // toujours à jour même dans les closures async
  const msgsRef          = useRef(null);
  const taRef            = useRef(null);
  const minuteTimestamps = useRef([]);   // rate limiting local (par minute)
  const hasOpened        = useRef(false);

  // ── 2. OPENING MESSAGE ───────────────────────────────────────
  async function openingMessage() {
    if (hasOpened.current) return;
    hasOpened.current = true;

    const QUOTES = [
      { text: "Tout ce que l'esprit peut concevoir et croire, il peut l'accomplir.", author: "Napoleon Hill" },
      { text: "Le succès est fait de petits efforts répétés jour après jour.", author: "Robert Collier" },
      { text: "Les gens ne manquent pas de force, ils manquent de volonté.", author: "Victor Hugo" },
      { text: "Ce n'est pas ce qui t'arrive qui compte, c'est ce que tu fais de ce qui t'arrive.", author: "Tony Robbins" },
      { text: "L'action est le remède fondamental à toute détresse.", author: "Tony Robbins" },
      { text: "Dans un état d'esprit de croissance, les défis sont excitants plutôt qu'intimidants.", author: "Carol Dweck" },
      { text: "Ce n'est pas l'argent qui te rend riche, c'est ce que tu fais avec.", author: "Robert Kiyosaki" },
      { text: "Les pauvres travaillent pour l'argent. Les riches font travailler l'argent pour eux.", author: "Robert Kiyosaki" },
      { text: "La patience est rare — et c'est exactement pourquoi elle est si précieuse.", author: "Morgan Housel" },
      { text: "La richesse, c'est ce que tu ne vois pas : les voitures non achetées, les diamants non portés.", author: "Morgan Housel" },
      { text: "Automatise tes finances et vis ta vie.", author: "Ramit Sethi" },
      { text: "Le pouvoir appartient à celui qui contrôle les émotions des autres.", author: "Robert Greene" },
      { text: "Tu es la moyenne des cinq personnes que tu côtoies le plus.", author: "Jim Rohn" },
      { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
      { text: "Ne souhaite pas que les choses soient plus faciles. Souhaite être meilleur.", author: "Jim Rohn" },
    ];

    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const trigger = `[SYSTÈME — ne pas afficher] Démarre la session. Ouvre avec cette citation de ${q.author} : "${q.text}" — intègre-la naturellement dans ton message d'accueil en créant un lien personnel avec l'utilisateur. Pose ensuite une première question ouverte pour commencer l'exploration.`;
    history.current.push({ role: "user", content: trigger });
    setTyping(true);
    try {
      const raw   = await callAPI();
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      setMsgs([{ role: "noema", text: clean, time: getTime() }]);
      history.current.push({ role: "assistant", content: raw });
    } catch (e) {
      console.error("[Noema] Erreur message d'ouverture:", e);
      history.current = []; // reset si échec pour ne pas polluer l'historique
      hasOpened.current = false;
    }
    setTyping(false);
  }

  // ── 3. EFFECTS ───────────────────────────────────────────────
  // Charge mémoire + dernière session au démarrage (utilisateurs connectés)
  useEffect(() => {
    if (!sb || !user) return;
    console.log("[Noema] Chargement mémoire pour user:", user.id);
    (async () => {
      // Mémoire cumulée inter-sessions
      const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
      if (memErr) console.error("[Noema] Erreur chargement memory:", memErr);
      if (mem) {
        console.log("[Noema] Mémoire chargée:", { session_count: mem.session_count, forces: mem.forces, notes: mem.session_notes });
        memoryRef.current = mem;
      } else {
        console.log("[Noema] Aucune mémoire existante pour cet utilisateur");
      }

      // Dernière session : restaure insights, ikigai, step dans les panneaux
      const { data: sessions, error: sessErr } = await sb.from("sessions")
        .select("insights,ikigai,step")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(1);
      if (sessErr) console.error("[Noema] Erreur chargement sessions:", sessErr);
      const last = sessions?.[0];
      if (last) {
        console.log("[Noema] Dernière session restaurée:", { step: last.step, ikigai: last.ikigai });
        if (last.insights) setInsights(i => ({ ...i, ...last.insights }));
        if (last.ikigai)   setIkigai(k => ({ ...k, ...last.ikigai }));
        if (typeof last.step === "number") setStep(last.step);
      }

      // Déclenche le message d'ouverture APRÈS avoir chargé la mémoire
      await openingMessage();
    })();
  }, [user]);

  // Mode démo (non connecté) : déclenche l'ouverture directement au mount
  useEffect(() => {
    if (user) return; // géré par l'effet ci-dessus
    openingMessage();
  }, []);

  useEffect(() => { applyTheme(mstate); }, [mstate]);

  // Scroll on new content
  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, [msgs, typing]);

  // ── 4. API ───────────────────────────────────────────────────
  async function callAPI() {
    const h = trimHistory(history.current);
    const systemPrompt = buildSystemPrompt(memoryRef.current); // memoryRef évite la closure stale de useCallback
    console.log("[Noema] callAPI — mémoire injectée:", memoryRef.current
      ? `${memoryRef.current.session_count} session(s), ${memoryRef.current.forces?.length || 0} force(s)`
      : "aucune");
    console.log("[Noema] System prompt (fin):", systemPrompt.slice(-300));
    // En prod, les headers sensibles sont gérés par la fonction Netlify côté serveur
    const headers = { "Content-Type":"application/json", "anthropic-version":"2023-06-01" };
    if (import.meta.env.DEV) {
      headers["x-api-key"] = import.meta.env.VITE_ANTHROPIC_KEY;
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const res = await fetch(ANTHROPIC_PROXY, {
      method:"POST",
      headers,
      body:JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1400,
        system:systemPrompt,
        messages:h
      }),
    });
    if (!res.ok) { const e=await res.json().catch(()=>{}); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
    return (await res.json()).content[0].text;
  }

  // ── 5. UI HANDLER ────────────────────────────────────────────
  // Applique les données <_ui> aux panneaux — tout se met à jour automatiquement
  function applyUI(ui) {
    if (!ui) return;

    // Note de session pour la mémoire
    if (ui.session_note) lastSessionNote.current = ui.session_note;

    // Thème visuel
    if (ui.etat) setMstate(mapEtat(ui.etat));

    // Mode Noema
    if (ui.mode) setMode(ui.mode);

    // Étape du parcours
    if (typeof ui.step === "number") setStep(s => Math.max(s, ui.step));

    // Insights : forces + contradictions
    if (ui.forces?.length || ui.contradictions?.length) {
      setInsights(p => ({
        forces: ui.forces?.length
          ? [...new Set([...p.forces, ...ui.forces])].slice(0, 6)
          : p.forces,
        blocages: ui.blocages || p.blocages,
        contradictions: ui.contradictions?.length
          ? [...new Set([...p.contradictions, ...ui.contradictions])].slice(0, 4)
          : p.contradictions,
      }));
    }

    // Blocages seuls
    if (ui.blocages) {
      setInsights(p => ({
        ...p,
        blocages: {
          racine:    ui.blocages.racine    || p.blocages.racine,
          entretien: ui.blocages.entretien || p.blocages.entretien,
          visible:   ui.blocages.visible   || p.blocages.visible,
        }
      }));
    }

    // Ikigai — se remplit progressivement pendant l'exploration
    if (ui.ikigai) {
      setIkigai(p => ({
        aime:    ui.ikigai.aime    || p.aime,
        excelle: ui.ikigai.excelle || p.excelle,
        monde:   ui.ikigai.monde   || p.monde,
        paie:    ui.ikigai.paie    || p.paie,
        mission: ui.ikigai.mission || p.mission,
      }));
    }
  }

  // Vérifie les limites et incrémente le compteur Supabase si ok
  // ── 6. RATE LIMIT ────────────────────────────────────────────
  // Retourne null si ok, ou un message d'erreur si bloqué
  async function checkRateLimit() {
    // Limite par minute (local, pas de requête Supabase)
    const now = Date.now();
    minuteTimestamps.current = minuteTimestamps.current.filter(t => now - t < 60_000);
    if (minuteTimestamps.current.length >= 30) {
      return "Tu envoies trop de messages. Attends une minute avant de continuer.";
    }

    // Limite journalière (Supabase)
    if (sb && user) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data, error } = await sb.from("rate_limits")
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (error) console.error("[Noema] Erreur rate_limits lecture:", error);
      const currentCount = data?.count || 0;
      if (currentCount >= 100) {
        return "Tu as atteint ta limite pour aujourd'hui. Reviens demain pour continuer.";
      }
      // Incrémente
      const { error: upsErr } = await sb.from("rate_limits").upsert(
        { user_id: user.id, date: today, count: currentCount + 1 },
        { onConflict: "user_id,date" }
      );
      if (upsErr) console.error("[Noema] Erreur rate_limits upsert:", upsErr);
    }

    // OK — enregistre le timestamp local
    minuteTimestamps.current.push(now);
    return null;
  }

  // ── 7. SEND ──────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    // Sanitisation : strip HTML, limite 2000 caractères
    const t = text.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!t || typing) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    // Vérification rate limiting avant d'envoyer
    const rateLimitMsg = await checkRateLimit();
    if (rateLimitMsg) {
      setMsgs(m => [...m, {role:"noema", text:rateLimitMsg, time:getTime(), isErr:true}]);
      return;
    }

    setMsgs(m => [...m, {role:"user", text:t, time:getTime()}]);
    history.current.push({role:"user", content:t});
    setTyping(true);
    try {
      const raw   = await callAPI();
      const ui    = parseUI(raw);         // données invisibles pour les panneaux
      const clean = stripUI(raw);         // texte pur pour l'utilisateur

      // Met à jour tous les panneaux en parallèle
      applyUI(ui);

      // Notif subtile si insights ou ikigai mis à jour
      const hasUpdate = ui && (
        (ui.forces?.length > 0) ||
        (ui.ikigai && Object.values(ui.ikigai).some(v => v)) ||
        (ui.contradictions?.length > 0) ||
        (ui.blocages?.racine)
      );

      setMsgs(m => [...m, {role:"noema", text:clean, time:getTime(), hasUpdate}]);
      history.current.push({role:"assistant", content:raw}); // raw pour que Noema garde la mémoire des données collectées
    } catch(e) {
      setMsgs(m => [...m, {role:"noema", text:`Une erreur est survenue. Réessaie dans un instant.`, time:getTime(), isErr:true}]);
      console.error(e);
    }
    setTyping(false);
  }, [typing]);

  // ── 8. SAVE SESSION ──────────────────────────────────────────
  async function saveSession(currentInsights, currentIkigai, currentStep) {
    if (!sb || !user) { console.warn("[Noema] saveSession ignoré: sb=", !!sb, "user=", !!user); return; }
    if (history.current.length === 0) { console.warn("[Noema] saveSession ignoré: historique vide"); return; }

    console.log("[Noema] Sauvegarde session — user:", user.id, "messages:", history.current.length, "note:", lastSessionNote.current);

    const sessionData = {
      user_id:      user.id,
      ended_at:     new Date().toISOString(),
      history:      history.current,
      insights:     currentInsights,
      ikigai:       currentIkigai,
      step:         currentStep,
      session_note: lastSessionNote.current,
    };
    const { error: insErr } = await sb.from("sessions").insert(sessionData);
    if (insErr) { console.error("[Noema] Erreur insert session:", insErr); return; }
    console.log("[Noema] Session insérée avec succès");

    // Met à jour la mémoire cumulée
    const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
    if (memErr) console.error("[Noema] Erreur lecture memory:", memErr);
    const notes = [...(mem?.session_notes || []), lastSessionNote.current].filter(Boolean).slice(-10);
    const newMemory = {
      user_id:       user.id,
      updated_at:    new Date().toISOString(),
      forces:        [...new Set([...(mem?.forces || []), ...currentInsights.forces])],
      contradictions:[...new Set([...(mem?.contradictions || []), ...currentInsights.contradictions])],
      blocages:      { ...(mem?.blocages || {}), ...currentInsights.blocages },
      ikigai:        { ...(mem?.ikigai || {}), ...currentIkigai },
      session_notes: notes,
      session_count: (mem?.session_count || 0) + 1,
    };
    const { error: upsErr } = await sb.from("memory").upsert(newMemory, { onConflict: "user_id" });
    if (upsErr) { console.error("[Noema] Erreur upsert memory:", upsErr); }
    else {
      console.log("[Noema] Memory mise à jour:", { session_count: newMemory.session_count, forces: newMemory.forces });
      memoryRef.current = newMemory;
    }

    lastSessionNote.current = "";
  }

  // ── 9. ACTIONS ───────────────────────────────────────────────
  function reset() {
    history.current = [];
    setMsgs([]); setStep(0); setMstate("exploring"); setMode("accueil");
    setInsights({forces:[], blocages:{racine:"",entretien:"",visible:""}, contradictions:[]});
    setIkigai({aime:"", excelle:"", monde:"", paie:"", mission:""});
    setMobTab("chat");
  }

  async function newSession() {
    await saveSession(insights, ikigai, step);
    reset();
  }

  function genIkigai() { send("Je veux voir mon Ikigai"); }

  // ── 10. RENDER ───────────────────────────────────────────────
  // Mobile modal panels (no state mutation in render)
  if (mobTab !== "chat") {
    const PANEL = {
      insights: <InsightsPane insights={insights}/>,
      progress: <ProgressPane step={step} mentalState={mstate}/>,
      ikigai:   <IkigaiPane ikigai={ikigai} onGen={()=>{ genIkigai(); setMobTab("chat"); }}/>,
    };
    const TITLES = {insights:"Insights",progress:"Progression",ikigai:"Ikigai"};
    return (
      <div className="app">
        <div className="modal">
          <div className="mh">
            <button className="mb-btn" onClick={()=>setMobTab("chat")}>←</button>
            <h2 className="mt">{TITLES[mobTab]}</h2>
          </div>
          <div className="mbody">{PANEL[mobTab]}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Topbar */}
      <div className="topbar">
        <button className="tb-logo" onClick={()=>onNav("landing")}>Noema<span>.</span></button>
        <StateBadge state={mstate} mode={mode}/>
        <div className="tb-right">
          <button className="btn-sm" onClick={newSession}>Nouvelle session</button>
          {sb&&<button className="btn-sm" onClick={()=>sb.auth.signOut()}>Déconnexion</button>}
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {/* Chat */}
        <div className="chat">
          <div className="msgs" ref={msgsRef}>
            {msgs.length===0&&!typing&&(
              <div className="welcome">
                <div className="w-orb">◎</div>
                <h2 className="w-title">Bonjour.<br/>Je suis Noema.</h2>
                <p className="w-sub">Dis-moi ce qui t'occupe l'esprit en ce moment.</p>
                <div className="starters">
                  {["Je me sens bloqué sans savoir pourquoi","J'ai du mal à prendre une décision importante","Je veux mieux comprendre ce que je veux vraiment"].map(p=>(
                    <button key={p} className="starter" onClick={()=>send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m,i) => (
              <div className="mg" key={i}>
                <div className={`mr ${m.role}`}>
                  <div className="mav">{m.role==="noema"?"N":"T"}</div>
                  <div className="mb">
                    <div className="mmeta">{m.role==="noema"?"Noema":"Toi"} · {m.time}</div>
                    <div className={`bubble${m.isErr?" err":""}`} dangerouslySetInnerHTML={{__html:
                      m.role==="noema"?fmt(m.text):`<p>${m.text.replace(/\n/g,"<br/>")}</p>`
                    }}/>
                    {m.hasUpdate&&(
                      <div className="ins-chip">
                        <div className="ins-chip-lbl">✦ Panneaux mis à jour</div>
                        Noema a collecté de nouvelles données — consulte Insights et Ikigai.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {typing&&(
              <div className="typ">
                <div className="mav" style={{width:30,height:30,borderRadius:9,background:"var(--accent-soft)",border:"1px solid var(--accent-border)",color:"var(--accent)",fontSize:".7rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>N</div>
                <div className="typ-b"><div className="td"/><div className="td"/><div className="td"/></div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="inp-area">
            <div className="qrow">
              <button className="qc" disabled={typing} onClick={()=>send("Je suis prêt à commencer")}>Commencer →</button>
              <button className="qc" disabled={typing} onClick={()=>send("Approfondir ce point")}>Approfondir</button>
              <button className="qc" disabled={typing} onClick={()=>send("Fais une pause et résume-moi où j'en suis")}>Résumé</button>
              <button className="qc sp" disabled={typing} onClick={genIkigai}>✨ Ikigai</button>
            </div>
            <div className="irow">
              <textarea
                ref={taRef} rows={1}
                placeholder="Écris ici… (Entrée pour envoyer)"
                value={input} disabled={typing}
                onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}
                maxLength={2000}
              />
              <button className={`send${input.trim()?" on":""}`} onClick={()=>send(input)} disabled={!input.trim()||typing}>
                <SendSVG/>
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="side">
          <div className="stabs">
            {[["insights","Insights"],["ikigai","Ikigai"],["progress","Progression"]].map(([k,l])=>(
              <button key={k} className={`stab${sideTab===k?" on":""}`} onClick={()=>setSideTab(k)}>{l}</button>
            ))}
          </div>
          <div className="sc">
            {sideTab==="insights" && <InsightsPane insights={insights}/>}
            {sideTab==="progress" && <ProgressPane step={step} mentalState={mstate}/>}
            {sideTab==="ikigai"   && <IkigaiPane ikigai={ikigai} onGen={genIkigai}/>}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bnav">
        {[{id:"chat",icon:"💬",lbl:"Chat"},{id:"insights",icon:"🔍",lbl:"Insights"},{id:"ikigai",icon:"🌟",lbl:"Ikigai"},{id:"progress",icon:"📈",lbl:"Progression"}].map(n=>(
          <button key={n.id} className={`bni${mobTab===n.id?" on":""}`} onClick={()=>setMobTab(n.id)}>
            <span className="bni-i">{n.icon}</span>
            <span className="bni-l">{n.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  injectCSS();
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({data:{session}}) => {
      if (session) { setUser(session.user); setPage("app"); }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) { setUser(session.user); setPage("app"); }
      else { setUser(null); setPage("landing"); }
    });
    return () => subscription.unsubscribe();
  }, []);
  if (page==="landing") return <Landing onNav={setPage}/>;
  if (page==="login")   return <Login   onNav={setPage}/>;
  if (page==="app")     return <AppShell onNav={setPage} user={user}/>;
  return null;
}
