import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavbarV2 from "../components/NavbarV2";
import NoemaLogo from "../components/NoemaLogo";
import "../styles/v2-app.css";

export default function LandingV2({ onNav }) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const testimonials = [
    { quote: "J'avais l'impression de tourner en rond depuis des années. En une session, Noema a nommé exactement ce qui me bloquait.", name: "Camille R.", role: "26 ans · Reconversion professionnelle" },
    { quote: "Ce n'est pas un chatbot. C'est quelque chose qui te regarde vraiment. Ça m'a dit une vérité que personne n'aurait osé formuler.", name: "Thomas M.", role: "31 ans · Entrepreneur" },
    { quote: "Mon Ikigai, je le cherchais depuis 3 ans. Noema l'a construit en une conversation, depuis ce que j'avais dit naturellement.", name: "Léa K.", role: "24 ans · Étudiante" },
  ];

  useEffect(() => {
    // Intro timing
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 2800); // Temps d'affichage du gros logo
    
    // Testimonial timer
    const slideTimer = setInterval(() => {
      if (!showIntro) {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }
    }, 6000);
    
    return () => {
      clearTimeout(introTimer);
      clearInterval(slideTimer);
    };
  }, [testimonials.length, showIntro]);

  return (
    <div className="v2-root-body" style={{ overflowY: "auto", overflowX: "hidden", height: "100vh" }}>
      <div className="v2-ambient-mesh" />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          >
            <NoemaLogo size={140} />
          </motion.div>
        ) : (
          <motion.div
            key="landing-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* NAV */}
            <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <NavbarV2 
          onNav={onNav}
          rightControls={
            <>
              <button style={{ background: "transparent", border: "none", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", cursor: "pointer", fontWeight: 500 }} onClick={() => onNav("login")}>Connexion</button>
              <button
                style={{ background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", padding: "0.6rem 1.25rem", borderRadius: "100px", fontFamily: "var(--font-sans)", fontWeight: 500, cursor: "pointer" }}
                onClick={() => onNav("login")}
              >
                Essayer Noema →
              </button>
            </>
          }
        />
      </div>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ maxWidth: 800, margin: "0 auto", padding: "80px 28px 60px", textAlign: "center", position: "relative", zIndex: 10 }}
      >
        <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "100px", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "28px", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          L'introspection devient visuelle
        </div>
        <h1 className="cormorant-font" style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", lineHeight: 1.1, marginBottom: "24px", color: "var(--color-text-primary)", fontWeight: 500 }}>
          Tu n'as pas raté ta vie.<br />
          <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontWeight: 400 }}>Tu ne t'es juste jamais<br />vraiment connu.</span>
        </h1>
        <p style={{ fontSize: "1.15rem", maxWidth: 600, margin: "0 auto 40px", color: "var(--color-text-secondary)", lineHeight: 1.6, fontFamily: "var(--font-sans)" }}>
          Une plateforme d'introspection qui cartographie ta psychologie en temps réel, sans détour et sans faux-semblants.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "50px" }}>
          <button
            style={{ background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", padding: "18px 36px", borderRadius: "100px", fontSize: "1.05rem", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
            onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
            onClick={() => onNav("login")}
          >
            Commencer ta première session →
          </button>
        </div>
      </motion.div>

      {/* VIDEO / DEMO SECTION */}
      <div style={{ padding: "20px 28px 80px", position: "relative", zIndex: 10 }}>
         <div className="v2-glass-card" style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem", borderRadius: "24px", border: "0.5px solid rgba(230, 194, 128, 0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.1), inset 0 0 20px rgba(255,255,255,0.5)" }}>
            <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(0,0,0,0.8)", borderRadius: "16px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "3rem" }}>▶</span>
                <span className="cormorant-font" style={{ fontSize: "1.5rem", letterSpacing: "0.05em" }}>Découvrir la méthode Noema</span>
              </div>
            </div>
         </div>
      </div>

      {/* REVIEWS SLIDER SECTION */}
      <div style={{ padding: "80px 28px", position: "relative", zIndex: 10, background: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 className="cormorant-font" style={{ fontSize: "2.5rem", marginBottom: "3rem", color: "var(--color-text-primary)" }}>Ils ont trouvé leur clarté.</h2>
          
          <div style={{ position: "relative", height: "180px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
              >
                <div className="cormorant-font" style={{ fontSize: "1.75rem", fontStyle: "italic", color: "var(--color-text-primary)", lineHeight: 1.4, marginBottom: "1.5rem" }}>
                  "{testimonials[currentTestimonial].quote}"
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{testimonials[currentTestimonial].name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{testimonials[currentTestimonial].role}</div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "2rem" }}>
            {testimonials.map((_, i) => (
              <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === currentTestimonial ? "var(--color-text-primary)" : "rgba(0,0,0,0.1)", transition: "background 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* PRICING SECTION */}
      <div style={{ padding: "100px 28px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <h2 className="cormorant-font" style={{ fontSize: "3rem", marginBottom: "1rem" }}>Ton introspection a un prix.</h2>
          <p style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", marginBottom: "4rem" }}>Choisis comment tu souhaites écrire ton histoire.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "center" }}>
            
            {/* PLAN PRO */}
            <div className="v2-glass-card" style={{ padding: "3rem 2rem", position: "relative", overflow: "hidden", border: "1px solid rgba(230, 194, 128, 0.5)", boxShadow: "0 20px 40px rgba(230, 194, 128, 0.1), inset 0 0 20px rgba(255,255,255,0.5)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "8px", background: "linear-gradient(90deg, #E6C280, #D4AF37)", color: "#fff", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Le plus populaire</div>
              
              <h3 className="cormorant-font" style={{ fontSize: "2.2rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Noema Pro</h3>
              <div style={{ fontSize: "2.5rem", fontWeight: 600, marginBottom: "2rem", display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
                19€ <span style={{ fontSize: "1rem", color: "var(--color-text-muted)", fontWeight: 400 }}>/mois</span>
              </div>
              
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 3rem 0", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[ "Conversations illimitées", "Cartographie psychologique V2", "Miroir des blocages et forces", "Validation de ton Ikigai" ].map((b, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "#D4AF37" }}>✓</span> {b}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => window.open('https://buy.stripe.com/test_...', '_blank')} 
                style={{ width: "100%", background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", padding: "16px", borderRadius: "12px", fontSize: "1.05rem", fontWeight: 600, cursor: "pointer", transition: "transform 0.2s" }}
                onMouseOver={(e) => e.target.style.transform = "scale(1.03)"}
                onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              >
                Commencer
              </button>
            </div>

            {/* PLAN NOVA */}
            <div className="v2-glass-card" style={{ padding: "3rem 2rem", opacity: 0.6, filter: "grayscale(0.8)", cursor: "not-allowed" }}>
              <h3 className="cormorant-font" style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Noema Nova</h3>
              <div style={{ fontSize: "2.5rem", fontWeight: 600, marginBottom: "2rem", display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
                49<span style={{ fontSize: "1.5rem" }}>,99€</span> <span style={{ fontSize: "1rem", color: "var(--color-text-muted)", fontWeight: 400 }}>/mois</span>
              </div>
              
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 3rem 0", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "var(--color-text-secondary)" }}>
                  <span>✨</span> <strong>Tout Noema Pro +</strong>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "var(--color-text-secondary)" }}>
                  <span>🧠</span> <div><strong>Agent dédié</strong> & Accompagnement Ikigai Total continu</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "var(--color-text-secondary)" }}>
                  <span>📈</span> Suivi proactif des objectifs
                </li>
              </ul>
              
              <button disabled style={{ width: "100%", background: "rgba(0,0,0,0.05)", color: "var(--color-text-muted)", border: "1px solid rgba(0,0,0,0.1)", padding: "16px", borderRadius: "12px", fontSize: "1.05rem", fontWeight: 600, cursor: "not-allowed" }}>
                Bientôt disponible
              </button>
            </div>

          </div>
        </div>
      </div>

            {/* FOOTER */}
            <div style={{ padding: "60px 28px", borderTop: "1px solid rgba(0,0,0,0.1)", position: "relative", zIndex: 10, marginTop: "40px" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div className="serif-font" style={{ fontSize: "1.2rem", color: "var(--color-text-primary)", letterSpacing: "0.2em" }}>NOEMA</div>
                <div style={{ fontSize: ".85rem", color: "var(--color-text-muted)", textAlign: "center", flex: 1 }}>Outil d'exploration personnelle — ne remplace pas un suivi thérapeutique professionnel.</div>
                <div style={{ fontSize: ".85rem", color: "var(--color-text-muted)" }}>© 2026 Noema</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
