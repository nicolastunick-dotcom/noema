export default function Landing({ onNav }) {
  const feats = [
    {icon:"🧠",name:"Introspection guidée",    desc:"Une question à la fois. Une conversation qui va en profondeur."},
    {icon:"🔍",name:"Insights en temps réel",  desc:"Forces, blocages et contradictions identifiés au fil de la conversation."},
    {icon:"🌟",name:"Ikigai personnalisé",     desc:"Construit depuis ta psychologie réelle, pas depuis un template."},
    {icon:"📈",name:"Progression visible",     desc:"Session par session — de bloqué à clarté mentale."},
    {icon:"🔄",name:"Mémoire inter-sessions",  desc:"Noema se souvient. Chaque session s'appuie sur la précédente."},
    {icon:"🎯",name:"Vérité sans filtre",      desc:"Ce dont tu as besoin, avec bienveillance — mais sans complaisance."},
  ];
  const steps = [
    { num:"01", title:"Tu parles. Noema écoute.", desc:"Pas de formulaire, pas de liste de questions. Une vraie conversation — chaleureuse, directe, sans jugement.", accent:"#8A7CFF" },
    { num:"02", title:"Noema analyse en profondeur.", desc:"Pendant que tu parles, Noema cartographie tes forces, identifie tes blocages racines et repère les contradictions.", accent:"#5B6CFF" },
    { num:"03", title:"Tu te comprends enfin.", desc:"Bilan honnête. Ikigai construit depuis ta réalité. Un plan d'action qui commence là où ça bloque vraiment.", accent:"#3B82F6" },
  ];
  const testimonials = [
    { quote:"J'avais l'impression de tourner en rond depuis des années. En une session, Noema a nommé exactement ce qui me bloquait.", name:"Camille R.", role:"26 ans · Reconversion professionnelle" },
    { quote:"Ce n'est pas un chatbot. C'est quelque chose qui te regarde vraiment. Ça m'a dit une vérité que personne n'aurait osé formuler.", name:"Thomas M.", role:"31 ans · Entrepreneur" },
    { quote:"Mon Ikigai, je le cherchais depuis 3 ans. Noema l'a construit en une conversation, depuis ce que j'avais dit naturellement.", name:"Léa K.", role:"24 ans · Étudiante" },
  ];
  // --- CODEX CHANGE START ---
  // Codex modification - add a pricing benefits list that matches the product's
  // actual capabilities and sits beneath the pricing cards.
  const pricingBenefits = [
    "Conversations illimitées",
    "Analyse psychologique",
    "Détection des blocages racines",
    "Construction progressive de l'Ikigai",
    "Mémoire inter-sessions",
  ];
  // --- CODEX CHANGE END ---

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

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,#F0F1FF 0%,#F7F4FF 35%,#FFF8F0 70%,#F7F8FC 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-80px",right:"-60px",width:"420px",height:"420px",borderRadius:"50%",background:"radial-gradient(circle,rgba(138,124,255,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"-60px",left:"-40px",width:"360px",height:"360px",borderRadius:"50%",background:"radial-gradient(circle,rgba(91,108,255,0.10) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:720,margin:"0 auto",padding:"100px 28px 80px",textAlign:"center",position:"relative"}}>
          <div className="badge" style={{marginBottom:28}}>◎ Guide d'introspection IA</div>
          <h1 className="h1" style={{marginBottom:22}}>
            Tu n'as pas raté ta vie.<br/>
            <em>Tu ne t'es juste jamais<br/>vraiment connu.</em>
          </h1>
          {/* --- CODEX CHANGE START --- */}
          <p style={{fontSize:".98rem",maxWidth:560,margin:"0 auto 12px",color:"var(--text2)",lineHeight:1.75}}>
            Noema est une IA d'accompagnement psychologique qui t'aide à comprendre tes forces, tes blocages et la direction de ta vie.
          </p>
          {/* --- CODEX CHANGE END --- */}
          <p className="hsub" style={{fontSize:"1.02rem",maxWidth:520,margin:"0 auto 38px"}}>
            Une conversation profonde pour voir plus clair, sans détour et sans faux-semblants.
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

      {/* --- CODEX CHANGE START --- */}
      {/* Codex modification - add a focused landing section that clarifies the
          three core layers Noema helps reveal, using the existing visual tone. */}
      <div style={{padding:"0 28px 80px",background:"var(--bg)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div className="ey">Révélations</div>
          <div className="sttl">Ce que Noema révèle</div>
          <div className="fg">
            {[
              {
                title:"Forces naturelles",
                desc:"Ce qui est déjà vivant en toi, même quand tu ne le vois pas encore clairement.",
              },
              {
                title:"Blocages racines",
                desc:"Ce qui freine en profondeur tes choix, ton élan et ta stabilité intérieure.",
              },
              {
                title:"Contradictions",
                desc:"L'écart entre ce que tu veux consciemment et ce que tes schémas racontent vraiment.",
              },
            ].map((item, index) => (
              <div
                className="fc"
                key={item.title}
                style={{padding:"24px 22px", background:index===1 ? "linear-gradient(180deg,#FFFFFF 0%,#F8F7FF 100%)" : undefined}}
              >
                <div style={{fontSize:".64rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--accent)",marginBottom:14}}>
                  0{index + 1}
                </div>
                <div style={{fontSize:".94rem",fontWeight:600,color:"var(--text)",marginBottom:10,lineHeight:1.35}}>
                  {item.title}
                </div>
                <p style={{fontSize:".8rem",color:"var(--text2)",lineHeight:1.72}}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* --- CODEX CHANGE END --- */}

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
          {/* --- CODEX CHANGE START --- */}
          <div style={{marginTop:26,padding:"18px 20px",background:"white",border:"1px solid var(--border)",borderRadius:"var(--r)",boxShadow:"var(--sh-sm)",textAlign:"left"}}>
            <div style={{fontSize:".68rem",fontWeight:700,letterSpacing:".11em",textTransform:"uppercase",color:"var(--accent)",marginBottom:14,textAlign:"center"}}>
              Bénéfices inclus
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px 18px"}}>
              {pricingBenefits.map((benefit) => (
                <div key={benefit} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:".8rem",color:"var(--text2)",lineHeight:1.6}}>
                  <span style={{color:"var(--accent)",fontWeight:700,marginTop:1}}>✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          {/* --- CODEX CHANGE END --- */}
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
