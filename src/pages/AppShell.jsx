import { useState, useEffect, useRef, useCallback } from "react";
import { sb, buildSystemPrompt } from "../lib/supabase";
import { ANTHROPIC_PROXY } from "../constants/config";
import { QUOTES } from "../constants/prompt";
import { applyTheme, mapEtat } from "../constants/themes";
import { getTime, fmt, parseUI, stripUI, trimHistory } from "../utils/helpers";
import StateBadge    from "../components/StateBadge";
import InsightsPane  from "../components/InsightsPane";
import ProgressPane  from "../components/ProgressPane";
import IkigaiPane    from "../components/IkigaiPane";
import { SendSVG }   from "../components/SVGs";

// ─────────────────────────────────────────────────────────────
// APP SHELL — Composant principal : chat + panneaux latéraux
// Sections :
//   1. STATE & REFS
//   2. OPENING MESSAGE
//   3. EFFECTS (mémoire, thème, scroll)
//   4. API (callAPI)
//   5. UI HANDLER (applyUI)
//   6. RATE LIMIT (checkRateLimit)
//   7. SEND
//   8. SAVE SESSION
//   9. ACTIONS (reset, newSession, genIkigai)
//  10. RENDER
// ─────────────────────────────────────────────────────────────
export default function AppShell({ onNav, user }) {
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
  const [mode,     setMode]     = useState("accueil");

  const history         = useRef([]);
  const lastSessionNote = useRef("");
  const memoryRef       = useRef(null); // toujours à jour même dans les closures async
  const msgsRef         = useRef(null);
  const taRef           = useRef(null);
  const minuteTimestamps = useRef([]);  // rate limiting local (par minute)
  const hasOpened       = useRef(false);

  // ── 2. OPENING MESSAGE ───────────────────────────────────────
  async function openingMessage() {
    if (hasOpened.current) return;
    hasOpened.current = true;
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
      history.current = [];
      hasOpened.current = false;
    }
    setTyping(false);
  }

  // ── 3. EFFECTS ───────────────────────────────────────────────
  useEffect(() => {
    if (!sb || !user) return;
    (async () => {
      const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
      if (memErr) console.error("[Noema] Erreur chargement memory:", memErr);
      if (mem) memoryRef.current = mem;

      const { data: sessions, error: sessErr } = await sb.from("sessions")
        .select("insights,ikigai,step")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(1);
      if (sessErr) console.error("[Noema] Erreur chargement sessions:", sessErr);
      const last = sessions?.[0];
      if (last) {
        if (last.insights) setInsights(i => ({ ...i, ...last.insights }));
        if (last.ikigai)   setIkigai(k => ({ ...k, ...last.ikigai }));
        if (typeof last.step === "number") setStep(last.step);
      }
      await openingMessage();
    })();
  }, [user]);

  useEffect(() => {
    if (user) return;
    openingMessage();
  }, []);

  useEffect(() => { applyTheme(mstate); }, [mstate]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, [msgs, typing]);

  // ── 4. API ───────────────────────────────────────────────────
  async function callAPI() {
    const h = trimHistory(history.current);
    const systemPrompt = buildSystemPrompt(memoryRef.current);
    const headers = { "Content-Type":"application/json", "anthropic-version":"2023-06-01" };
    if (import.meta.env.DEV) {
      headers["x-api-key"] = import.meta.env.VITE_ANTHROPIC_KEY;
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const res = await fetch(ANTHROPIC_PROXY, {
      method:"POST", headers,
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1400, system:systemPrompt, messages:h }),
    });
    if (!res.ok) { const e=await res.json().catch(()=>{}); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
    return (await res.json()).content[0].text;
  }

  // ── 5. UI HANDLER ────────────────────────────────────────────
  function applyUI(ui) {
    if (!ui) return;
    if (ui.session_note) lastSessionNote.current = ui.session_note;
    if (ui.etat) setMstate(mapEtat(ui.etat));
    if (ui.mode) setMode(ui.mode);
    if (typeof ui.step === "number") setStep(s => Math.max(s, ui.step));

    if (ui.forces?.length || ui.contradictions?.length) {
      setInsights(p => ({
        forces: ui.forces?.length ? [...new Set([...p.forces, ...ui.forces])].slice(0, 6) : p.forces,
        blocages: ui.blocages || p.blocages,
        contradictions: ui.contradictions?.length ? [...new Set([...p.contradictions, ...ui.contradictions])].slice(0, 4) : p.contradictions,
      }));
    }
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

  // ── 6. RATE LIMIT ────────────────────────────────────────────
  async function checkRateLimit() {
    const now = Date.now();
    minuteTimestamps.current = minuteTimestamps.current.filter(t => now - t < 60_000);
    if (minuteTimestamps.current.length >= 30) {
      return "Tu envoies trop de messages. Attends une minute avant de continuer.";
    }
    if (sb && user) {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await sb.from("rate_limits").select("count").eq("user_id", user.id).eq("date", today).maybeSingle();
      if (error) console.error("[Noema] Erreur rate_limits lecture:", error);
      const currentCount = data?.count || 0;
      if (currentCount >= 100) return "Tu as atteint ta limite pour aujourd'hui. Reviens demain pour continuer.";
      await sb.from("rate_limits").upsert(
        { user_id: user.id, date: today, count: currentCount + 1 },
        { onConflict: "user_id,date" }
      );
    }
    minuteTimestamps.current.push(now);
    return null;
  }

  // ── 7. SEND ──────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const t = text.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!t || typing) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

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
      const ui    = parseUI(raw);
      const clean = stripUI(raw);
      applyUI(ui);
      const hasUpdate = ui && (
        (ui.forces?.length > 0) || (ui.ikigai && Object.values(ui.ikigai).some(v => v)) ||
        (ui.contradictions?.length > 0) || (ui.blocages?.racine)
      );
      setMsgs(m => [...m, {role:"noema", text:clean, time:getTime(), hasUpdate}]);
      history.current.push({role:"assistant", content:raw});
    } catch(e) {
      setMsgs(m => [...m, {role:"noema", text:"Une erreur est survenue. Réessaie dans un instant.", time:getTime(), isErr:true}]);
      console.error(e);
    }
    setTyping(false);
  }, [typing]);

  // ── 8. SAVE SESSION ──────────────────────────────────────────
  async function saveSession(currentInsights, currentIkigai, currentStep) {
    if (!sb || !user) return;
    if (history.current.length === 0) return;

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

    const { data: mem, error: memErr } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
    if (memErr) console.error("[Noema] Erreur lecture memory:", memErr);
    const notes = [...(mem?.session_notes || []), lastSessionNote.current].filter(Boolean).slice(-10);
    const newMemory = {
      user_id:        user.id,
      updated_at:     new Date().toISOString(),
      forces:         [...new Set([...(mem?.forces || []), ...currentInsights.forces])],
      contradictions: [...new Set([...(mem?.contradictions || []), ...currentInsights.contradictions])],
      blocages:       { ...(mem?.blocages || {}), ...currentInsights.blocages },
      ikigai:         { ...(mem?.ikigai || {}), ...currentIkigai },
      session_notes:  notes,
      session_count:  (mem?.session_count || 0) + 1,
    };
    const { error: upsErr } = await sb.from("memory").upsert(newMemory, { onConflict: "user_id" });
    if (upsErr) console.error("[Noema] Erreur upsert memory:", upsErr);
    else memoryRef.current = newMemory;
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

  async function newSession() { await saveSession(insights, ikigai, step); reset(); }
  function genIkigai() { send("Je veux voir mon Ikigai"); }

  // ── 10. RENDER ───────────────────────────────────────────────
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
      <div className="topbar">
        <button className="tb-logo" onClick={()=>onNav("landing")}>Noema<span>.</span></button>
        <StateBadge state={mstate} mode={mode}/>
        <div className="tb-right">
          <button className="btn-sm" onClick={newSession}>Nouvelle session</button>
          {sb&&<button className="btn-sm" onClick={()=>sb.auth.signOut()}>Déconnexion</button>}
        </div>
      </div>

      <div className="main">
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
