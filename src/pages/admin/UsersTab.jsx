import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sb } from "../../lib/supabase";
import { Icon, Pill, SectionHeader } from "./AdminShared";
import { A, fmtDate, phaseColor } from "./adminConstants";
import { T } from "../../design-system/tokens";

function UserSessionsPanel({ user, resetTick }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sb || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    sb.from("sessions")
      .select("id, created_at, ended_at, step, next_action, session_note")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setSessions(data || []);
        setLoading(false);
      });
  }, [resetTick, user?.id]);

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(17,19,24,0.5)",
        padding: "16px 20px 18px 36px",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: T.color.textMuted,
          fontWeight: 700,
        }}
      >
        Dernieres sessions
      </p>
      {loading ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: T.color.textMuted }}>Chargement...</p>
      ) : sessions.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: T.color.textMuted, fontStyle: "italic" }}>Aucune session.</p>
      ) : (
        sessions.map((session) => (
          <div key={session.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: A, marginTop: 6, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.text, fontWeight: 500 }}>
                {fmtDate(session.created_at)} - etape {session.step ?? "—"}
              </p>
              {session.next_action && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.72rem",
                    color: T.color.textSub,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  "{session.next_action}"
                </p>
              )}
            </div>
          </div>
        ))
      )}

    </div>
  );
}

export default function UsersTab({
  users,
  loading,
  onGenerateCode,
  inviteLoading,
  inviteFeedback,
  resetTick,
}) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    return (user.email || "").toLowerCase().includes(query) || (user.id || "").toLowerCase().includes(query);
  });

  const statusColor = (status) => {
    if (status === "active") return T.color.success;
    if (status === "trialing" || status === "trial") return "#a78bfa";
    return T.color.textMuted;
  };

  const statusLabel = (status) => {
    if (status === "active") return "Actif";
    if (status === "trialing" || status === "trial") return "Essai";
    return "Free";
  };

  return (
    <div>
      <SectionHeader title="Utilisateurs" sub={`${users.length} comptes - emails recuperes via service role`} />

      <div style={{ marginBottom: 20, position: "relative" }}>
        <Icon
          name="search"
          color={T.color.textMuted}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par email ou ID..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 16px 11px 40px",
            borderRadius: T.radius.lg,
            background: "rgba(26,27,33,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: T.color.text,
            fontFamily: T.font.sans,
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
      </div>

      <div style={{ borderRadius: T.radius.xl, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 110px 100px 160px",
            padding: "10px 20px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {["Email / ID", "Phase", "Inscrit le", "Statut", "Actions"].map((header) => (
            <span
              key={header}
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: T.color.textMuted,
                fontWeight: 700,
              }}
            >
              {header}
            </span>
          ))}
        </div>

        {loading ? (
          [1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                gap: 16,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.04)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: T.color.textMuted, fontStyle: "italic" }}>
              {search ? "Aucun resultat." : "Aucun utilisateur."}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 110px 100px 160px",
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  alignItems: "center",
                  background: expandedUser === user.id ? "rgba(189,194,255,0.04)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: user.isAdmin ? A : T.color.text, fontWeight: user.isAdmin ? 700 : 500 }}>
                    {user.email}
                    {user.isAdmin && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "0.6rem",
                          color: A,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        admin
                      </span>
                    )}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: T.color.textMuted, fontFamily: "monospace" }}>
                    {user.id?.slice(0, 14)}...
                  </p>
                </div>
                <Pill label={user.phase || "—"} color={phaseColor(user.phase)} />
                <span style={{ fontSize: "0.78rem", color: T.color.textSub }}>{fmtDate(user.created_at)}</span>
                <Pill label={statusLabel(user.subStatus)} color={statusColor(user.subStatus)} />
                <div style={{ display: "flex", gap: 7 }}>
                  <button
                    onClick={() => onGenerateCode(user.id)}
                    disabled={inviteLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: T.radius.sm,
                      background: `${A}12`,
                      border: `1px solid ${A}28`,
                      color: A,
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      fontFamily: T.font.sans,
                      opacity: inviteLoading ? 0.5 : 1,
                    }}
                  >
                    <Icon name="link" size="0.8rem" color={A} /> Code
                  </button>
                  <button
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: T.radius.sm,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: T.color.textSub,
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      fontFamily: T.font.sans,
                    }}
                  >
                    <Icon name="history" size="0.8rem" color={T.color.textSub} /> Sessions
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {expandedUser === user.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <UserSessionsPanel user={user} resetTick={resetTick} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {inviteFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: "12px 18px",
            borderRadius: T.radius.lg,
            background: inviteFeedback.startsWith("Erreur") ? `${T.color.error}18` : `${T.color.success}18`,
            border: `1px solid ${inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success}33`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success,
            }}
          >
            {inviteFeedback}
          </p>
        </motion.div>
      )}
    </div>
  );
}
