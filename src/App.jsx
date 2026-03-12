import { useState, useEffect } from "react";
import { sb } from "./lib/supabase";
import Landing  from "./pages/Landing";
import Login    from "./pages/Login";
import AppShell from "./pages/AppShell";
import "./styles/app.css";

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

  if (page === "landing") return <Landing  onNav={setPage}/>;
  if (page === "login")   return <Login    onNav={setPage}/>;
  if (page === "app")     return <AppShell onNav={setPage} user={user}/>;
  return null;
}
