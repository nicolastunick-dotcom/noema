import { useState, useEffect } from "react";
import { sb } from "../../lib/supabase";

export default function AdminStats({ user }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ sonnet: 0, haiku: 0, cost: 0 });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    sb.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data?.is_admin));
  }, [user]);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    
    async function fetchStats() {
      const { data, error } = await sb.from("api_usage").select("*");
      if (error) {
        console.error("[Cockpit] Error fetching stats", error);
        return;
      }
      
      let sonnetTokens = 0;
      let haikuTokens = 0;
      let cost = 0;
      
      data.forEach(row => {
        if (row.model.includes("sonnet")) {
          sonnetTokens += (row.prompt_tokens + row.completion_tokens);
          cost += (row.prompt_tokens * 0.003 / 1000) + (row.completion_tokens * 0.015 / 1000); // Prix Claude 3.5 Sonnet
        } else if (row.model.includes("haiku")) {
          haikuTokens += (row.prompt_tokens + row.completion_tokens);
          cost += (row.prompt_tokens * 0.00025 / 1000) + (row.completion_tokens * 0.00125 / 1000); // Prix Claude 3 Haiku
        }
      });
      
      setStats({ sonnet: sonnetTokens, haiku: haikuTokens, cost });
    }
    
    fetchStats();
  }, [isOpen, isAdmin]);

  if (!isAdmin) return null;

  return (
    <div style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 100, fontFamily: "var(--font-sans)" }}>
      {isOpen ? (
        <div style={{ background: "var(--glass-bg)", borderRadius: "12px", padding: "1.2rem", backdropFilter: "var(--glass-blur)", border: "1px solid rgba(0,0,0,0.05)", color: "var(--color-text-primary)", fontSize: "0.9rem", width: "260px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
             <h4 style={{ margin: 0, fontSize: "1rem", letterSpacing: "0.02em" }}>🚀 Cockpit API</h4>
             <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
               <span>Sonnet (Global) :</span>
               <strong>{stats.sonnet.toLocaleString()} tx</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
               <span>Haiku (Greffier) :</span>
               <strong>{stats.haiku.toLocaleString()} tx</strong>
            </div>
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "0.6rem", marginTop: "0.4rem", display: "flex", justifyContent: "space-between", color: "var(--color-text-primary)" }}>
               <span>Coût Est. (USD) :</span>
               <strong>${stats.cost.toFixed(4)}</strong>
            </div>
            <button onClick={() => setStats({ ...stats })} style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
               Actualiser
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ background: "var(--color-text-primary)", color: "var(--color-bg-base)", border: "none", borderRadius: "50%", width: "45px", height: "45px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.2)", transition: "transform 0.2s" }}
          title="Ouvrir le Cockpit Admin"
        >
          ⚙️
        </button>
      )}
    </div>
  );
}
