import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sb } from "./lib/supabase";
import DemoPage from "./pages/DemoPage";

import "./styles/app.css";

// Lazy load V2 AppShell to optimize bundle size
const AppShellV2 = lazy(() => import("./v2/pages/AppShellV2"));
const LandingV2 = lazy(() => import("./v2/pages/LandingV2"));
const LoginV2 = lazy(() => import("./v2/pages/LoginV2"));

// ─────────────────────────────────────────────────────────────
// ROOT — Gestion navigation + auth Supabase
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); setPage("app"); }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) { setUser(session.user); setPage("app"); }
      else { setUser(null); setPage("landing"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, filter: "blur(5px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(5px)" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ width: "100%", height: "100%" }}
      >
        {page === "landing" && (
          <Suspense fallback={<div style={{background:"var(--color-bg-base)", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)"}}>Chargement...</div>}>
            <LandingV2 onNav={setPage}/>
          </Suspense>
        )}
        {page === "demo" && <DemoPage onNav={setPage} user={user}/>}
        {page === "login" && (
          <Suspense fallback={<div style={{background:"var(--color-bg-base)", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)"}}>Chargement...</div>}>
            <LoginV2 onNav={setPage}/>
          </Suspense>
        )}
        {page === "app" && (
          <Suspense fallback={<div style={{background:"var(--color-bg-base)", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)"}}>Chargement...</div>}>
            <AppShellV2 onNav={setPage} user={user}/>
          </Suspense>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
