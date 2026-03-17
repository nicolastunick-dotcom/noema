import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNoemaApi } from "../../hooks/useNoemaApi";
import { sb } from "../../lib/supabase";
import AnimatedMessage from "../components/messages/AnimatedMessage";
import GlassCardV2 from "../components/GlassCardV2";
import ConscienceSidebarV2 from "../components/Panes/ConscienceSidebarV2";
import IkigaiPaneV2 from "../components/Panes/IkigaiPaneV2";
import NavbarV2 from "../components/NavbarV2";
import AdminStats from "../components/AdminStats";
import { parseUI, stripUI } from "../../utils/helpers";
import "../styles/v2-app.css";

export default function AppShellV2({ onNav, user }) {
  // 1. Session & History state
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [currentMessage, setCurrentMessage] = useState(null);
  const [localHistory, setLocalHistory] = useState([]); // Visual only
  const [inputValue, setInputValue] = useState("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("conscience"); // "conscience" | "ikigai"
  const [insights, setInsights] = useState({ forces: [], blocages: {}, contradictions: [] });
  const [ikigai, setIkigai] = useState({});
  const [bloomType, setBloomType] = useState(null);
  const [sessionIndex, setSessionIndex] = useState(1);
  const messagesEndRef = useRef(null);

  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 850);
    checkMobile(); // initial check
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mémoire inter-sessions : chargement au démarrage depuis Supabase
  useEffect(() => {
    if (!sb || !user) return;
    (async () => {
      const { data: mem } = await sb.from("memory").select("*").eq("user_id", user.id).maybeSingle();
      if (!mem) return;
      if (Array.isArray(mem.forces) || mem.blocages || mem.contradictions) {
        setInsights({
          forces: mem.forces || [],
          blocages: mem.blocages || {},
          contradictions: mem.contradictions || []
        });
      }
      if (mem.ikigai && Object.keys(mem.ikigai).length > 0) {
        setIkigai(mem.ikigai);
      }
      if (typeof mem.session_count === "number" && mem.session_count > 0) {
        setSessionIndex(mem.session_count + 1);
      }
    })();
  }, [user]);

  // 2. Custom hooks
  // useNoemaApi returns the raw async function callAPI
  const callAPI = useNoemaApi({ user, sessionId, message: currentMessage });

  // 3. Sync initialization & auto-scroll
  useEffect(() => {
    if (localHistory.length === 0) {
      setCurrentMessage("START_SESSION");
    }
  }, [localHistory.length]);

  useEffect(() => {
    if (currentMessage && !isApiLoading) {
      triggerAPI();
    }
  }, [currentMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localHistory]);

  // 4. API Orchestration
  const triggerAPI = async () => {
    const msg = currentMessage;
    setCurrentMessage(null); // release lock
    setIsApiLoading(true);

    if (msg !== "START_SESSION") {
      setLocalHistory((prev) => [...prev, { role: "user", content: msg }]);
    }

    try {
      const responseText = await callAPI();
      // The backend successfully processed this, update local visual state
      if (responseText) {
        const ui = parseUI(responseText);
        const cleanText = stripUI(responseText);

        if (ui) {
          setInsights(prev => ({
            forces: ui.forces || prev.forces,
            blocages: { ...prev.blocages, ...ui.blocages },
            contradictions: ui.contradictions || prev.contradictions
          }));
          if (ui.ikigai) {
            setIkigai(prev => ({ ...prev, ...ui.ikigai }));
          }
          if (ui.ui_insight_type) {
            setBloomType(ui.ui_insight_type);
            setTimeout(() => setBloomType(null), 4000); // Effet visuel pendant 4 secondes
          }
        }

        setLocalHistory((prev) => [...prev, { role: "assistant", content: cleanText }]);
      }
    } catch (e) {
      console.error("API Call failed:", e);
      setLocalHistory((prev) => [...prev, { role: "assistant", content: "Une erreur est survenue de mon côté. Peux-tu répéter ?" }]);
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isApiLoading) return;
    setCurrentMessage(inputValue.trim());
    setInputValue("");
  };

  const onEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 5. Layout rendering
  return (
    <div className="v2-root-body v2-app-container">
      {/* Dynamic Ambient Background */}
      <div className="v2-ambient-mesh" />

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobile && isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "88%", maxWidth: "420px", zIndex: 50, background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", padding: "1.5rem", display: "flex", flexDirection: "column" }}
            >
               <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", marginTop: "3rem" }}>
                 <button onClick={() => setActiveTab("conscience")} style={{ flex: 1, padding: "0.8rem", background: activeTab === "conscience" ? "rgba(0,0,0,0.05)" : "transparent", color: activeTab === "conscience" ? "var(--color-text-primary)" : "var(--color-text-muted)", border: "1px solid", borderColor: activeTab === "conscience" ? "rgba(0,0,0,0.1)" : "transparent", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>Conscience</button>
                 <button onClick={() => setActiveTab("ikigai")} style={{ flex: 1, padding: "0.8rem", background: activeTab === "ikigai" ? "rgba(0,0,0,0.05)" : "transparent", color: activeTab === "ikigai" ? "var(--color-text-primary)" : "var(--color-text-muted)", border: "1px solid", borderColor: activeTab === "ikigai" ? "rgba(0,0,0,0.1)" : "transparent", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>Ikigai</button>
               </div>
               
               <div style={{ flex: 1, overflowY: "auto" }}>
                 <AnimatePresence mode="wait">
                   {activeTab === "conscience" && (
                     <motion.div key="consc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                       <ConscienceSidebarV2 insights={insights} sessionIndex={sessionIndex} />
                     </motion.div>
                   )}
                   {activeTab === "ikigai" && (
                     <motion.div key="iki" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                       <IkigaiPaneV2 ikigai={ikigai} onGen={() => setCurrentMessage("Je veux voir mon Ikigai")} />
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(0,0,0,0.05)", border: "none", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-primary)", fontSize: "1.2rem", zIndex: 60 }}
              >
                ✕
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Layout wrapper for 2 columns */}
      <div style={{ display: "flex", gap: "2rem", height: "100%", width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "var(--spacing-md)" }}>

        {/* Main Conversation Column */}
        <motion.main
          className={`v2-main-column ${bloomType ? `insight-${bloomType}` : ''}`}
          style={{
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minWidth: "400px"
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <NavbarV2 
            onNav={onNav}
            style={{ marginBottom: "var(--spacing-lg)" }}
            rightControls={
              <>
                {isMobile && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    style={{ background: "var(--glass-bg)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "100px", padding: "8px 16px", color: "var(--color-text-primary)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  >
                    <span>✨</span> Miroir
                  </button>
                )}
                <button
                  onClick={() => onNav("landing")}
                  style={{ background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                >
                  Fermer
                </button>
              </>
            }
          />

          {/* Scrollable Messages Area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingRight: "10px", marginBottom: "var(--spacing-md)" }}>
            <AnimatePresence initial={false}>
              {localHistory.map((msg, i) => (
                <AnimatedMessage
                  key={i}
                  message={msg.content}
                  isUser={msg.role === "user"}
                  isLatest={i === localHistory.length - 1}
                />
              ))}

              {isApiLoading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", fontStyle: "italic", marginLeft: "1rem" }}
                >
                  Noema réfléchit...
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <GlassCardV2 delay={0.4} style={{ padding: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <textarea
                className="v2-input-area"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={onEnter}
                placeholder="Que ressens-tu aujourd'hui ?"
                rows={1}
                style={{
                  flex: 1,
                  resize: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: "0.8rem 1rem",
                  fontSize: "1rem"
                }}
                disabled={isApiLoading}
              />
              <motion.button
                onClick={handleSend}
                disabled={!inputValue.trim() || isApiLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: inputValue.trim() ? "var(--color-text-primary)" : "rgba(0,0,0,0.06)",
                  color: inputValue.trim() ? "var(--color-bg-base)" : "rgba(0,0,0,0.3)",
                  border: "none",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  margin: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.3s, color 0.3s"
                }}
              >
                ↑
              </motion.button>
            </div>
          </GlassCardV2>
        </motion.main>

        {/* Dashboard Sidebar Column (Desktop Only) */}
        {!isMobile && (
          <motion.aside
            style={{
              flex: 0.8,
              height: "100%",
              minWidth: "350px",
              maxWidth: "450px",
              display: "flex",
              flexDirection: "column"
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
             <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
               <button onClick={() => setActiveTab("conscience")} style={{ flex: 1, padding: "0.8rem", background: activeTab === "conscience" ? "rgba(0,0,0,0.05)" : "transparent", color: activeTab === "conscience" ? "var(--color-text-primary)" : "var(--color-text-muted)", border: "1px solid", borderColor: activeTab === "conscience" ? "rgba(0,0,0,0.1)" : "transparent", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, transition: "all 0.3s" }}>Conscience</button>
               <button onClick={() => setActiveTab("ikigai")} style={{ flex: 1, padding: "0.8rem", background: activeTab === "ikigai" ? "rgba(0,0,0,0.05)" : "transparent", color: activeTab === "ikigai" ? "var(--color-text-primary)" : "var(--color-text-muted)", border: "1px solid", borderColor: activeTab === "ikigai" ? "rgba(0,0,0,0.1)" : "transparent", borderRadius: "12px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, transition: "all 0.3s" }}>Ikigai</button>
             </div>
             
             <div style={{ flex: 1, minHeight: 0 }}>
                <AnimatePresence mode="wait">
                   {activeTab === "conscience" && (
                     <motion.div key="consc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} style={{ height: "100%" }}>
                       <ConscienceSidebarV2 insights={insights} sessionIndex={sessionIndex} />
                     </motion.div>
                   )}
                   {activeTab === "ikigai" && (
                     <motion.div key="iki" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} style={{ height: "100%" }}>
                       <IkigaiPaneV2 ikigai={ikigai} onGen={() => setCurrentMessage("Je veux voir mon Ikigai")} />
                     </motion.div>
                   )}
                 </AnimatePresence>
             </div>
          </motion.aside>
        )}

      </div>

      {/* Cockpit Admin Monitoring */}
      <AdminStats user={user} />
    </div>
  );
}
