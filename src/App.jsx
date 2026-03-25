import { useState, useEffect } from "react";
import { sb } from "./lib/supabase";
import Landing    from "./pages/Landing";
import Login      from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import AppShell   from "./pages/AppShell";
import "./styles/app.css";

// ─────────────────────────────────────────────────────────────
// ROOT — Gestion navigation + auth Supabase
// Flux : landing → login → (onboarding si première fois) → app
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);

  async function handleLogin(sessionUser) {
    setUser(sessionUser);
    if (!sb) { setPage("app"); return; }
    // Vérifie si l'onboarding a déjà été fait
    const { data } = await sb
      .from("memory")
      .select("onboarding_done")
      .eq("user_id", sessionUser.id)
      .maybeSingle();
    if (data?.onboarding_done) {
      setPage("app");
    } else {
      setPage("onboarding");
    }
  }

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) handleLogin(session.user);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) handleLogin(session.user);
      else { setUser(null); setPage("landing"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (page === "landing")    return <Landing    onNav={setPage}/>;
  if (page === "login")      return <Login      onNav={setPage}/>;
  if (page === "onboarding") return <Onboarding user={user} sb={sb} onComplete={() => setPage("app")}/>;
  if (page === "app")        return <AppShell   onNav={setPage} user={user}/>;
  return null;
}
