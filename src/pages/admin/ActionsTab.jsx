import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, SectionHeader } from "./AdminShared";
import { A, TARGET_GROUPS } from "./adminConstants";
import { T } from "../../design-system/tokens";

export default function ActionsTab({
  onGenerateCode,
  inviteLoading,
  inviteFeedback,
  lastInvites,
  lastGreffierLog,
  runBroadcast,
  onResetAdmin,
  currentUser,
  resetLoading,
  resetFeedback,
}) {
  const [subject, setSubject] = useState("Un message de Noema");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");
  const [previewResult, setPreviewResult] = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [broadcastError, setBroadcastError] = useState("");
  const [showGreffier, setShowGreffier] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handlePreview() {
    setBroadcastLoading(true);
    setBroadcastError("");
    setPreviewResult(null);
    try {
      const result = await runBroadcast({ subject, message: message || "preview", targetGroup, previewOnly: true });
      setPreviewResult(result);
    } catch (error) {
      setBroadcastError(error.message);
    }
    setBroadcastLoading(false);
  }

  async function handleSend() {
    if (!message.trim()) {
      setBroadcastError("Le message est vide.");
      return;
    }
    setBroadcastLoading(true);
    setBroadcastError("");
    setBroadcastResult(null);
    setConfirmed(false);
    try {
      const result = await runBroadcast({ subject, message, targetGroup, previewOnly: false });
      setBroadcastResult(result);
      setMessage("");
      setPreviewResult(null);
    } catch (error) {
      setBroadcastError(error.message);
    }
    setBroadcastLoading(false);
  }

  return (
    <div>
      <SectionHeader title="Actions rapides" sub="Invitations, broadcast et logs systeme" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: `1px solid ${A}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: T.radius.md,
                background: `${A}14`,
                border: `1px solid ${A}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="link" fill size="1rem" color={A} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Generer un code d'acces</h3>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.6 }}>
            Cree un lien d'invitation beta valide a usage unique, copie automatiquement dans le presse-papiers.
          </p>
          <button
            onClick={() => onGenerateCode(null)}
            disabled={inviteLoading}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: T.radius.full,
              background: `linear-gradient(135deg, ${A} 0%, ${T.color.accent.container} 100%)`,
              border: "none",
              color: "#00118c",
              fontFamily: T.font.sans,
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: inviteLoading ? "wait" : "pointer",
              opacity: inviteLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name="add_link" size="1rem" color="#00118c" />
            {inviteLoading ? "Generation..." : "Creer un lien d'invitation"}
          </button>
          {lastInvites.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {lastInvites.slice(0, 3).map((invite) => (
                <div
                  key={invite.token}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: T.radius.md,
                    background: "rgba(17,19,24,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: A, fontFamily: "monospace" }}>{invite.token}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(invite.link).catch(() => {})}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: T.color.textSub, fontFamily: T.font.sans }}
                  >
                    Copier
                  </button>
                </div>
              ))}
            </div>
          )}
          {inviteFeedback && (
            <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: inviteFeedback.startsWith("Erreur") ? T.color.error : T.color.success }}>
              {inviteFeedback}
            </p>
          )}
        </div>

        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: `1px solid ${T.color.error}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: T.radius.md,
                background: `${T.color.error}14`,
                border: `1px solid ${T.color.error}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="restart_alt" fill size="1rem" color={T.color.error} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Reinitialiser Noema</h3>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.6 }}>
            Remet ton compte a l'etat d'un nouvel utilisateur sans toucher a ton acces admin ni a ton abonnement.
          </p>
          <p style={{ margin: "0 0 18px", fontSize: "0.72rem", color: T.color.textMuted }}>
            Cible actuelle: <strong style={{ color: T.color.text }}>{currentUser?.email || "Compte courant"}</strong>
          </p>
          <button
            onClick={() => onResetAdmin?.()}
            disabled={resetLoading}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: T.radius.full,
              background: `${T.color.error}16`,
              border: `1px solid ${T.color.error}30`,
              color: T.color.error,
              fontFamily: T.font.sans,
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: resetLoading ? "wait" : "pointer",
              opacity: resetLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name="restart_alt" size="1rem" color={T.color.error} />
            {resetLoading ? "Reinitialisation..." : "Tout reinitialiser"}
          </button>
          {resetFeedback && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "0.8rem",
                color: resetFeedback.startsWith("Erreur") ? T.color.error : T.color.success,
              }}
            >
              {resetFeedback}
            </p>
          )}
        </div>

        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: T.radius.md,
                background: `${T.color.warning}14`,
                border: `1px solid ${T.color.warning}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="campaign" fill size="1rem" color={T.color.warning} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Message a tous</h3>
          </div>

          <label style={{ display: "block", marginBottom: 8 }}>
            <span
              style={{
                display: "block",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: T.color.textMuted,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Sujet
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: T.radius.md,
                background: "rgba(17,19,24,0.8)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: T.color.text,
                fontFamily: T.font.sans,
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span
              style={{
                display: "block",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: T.color.textMuted,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Votre message aux utilisateurs..."
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: T.radius.md,
                background: "rgba(17,19,24,0.8)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: T.color.text,
                fontFamily: T.font.sans,
                fontSize: "0.82rem",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
              }}
            />
          </label>

          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                display: "block",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: T.color.textMuted,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Destinataires
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TARGET_GROUPS.map((group) => (
                <label
                  key={group.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: T.radius.md,
                    background: targetGroup === group.id ? `${A}0e` : "transparent",
                    border: `1px solid ${targetGroup === group.id ? `${A}22` : "transparent"}`,
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="targetGroup"
                    value={group.id}
                    checked={targetGroup === group.id}
                    onChange={() => {
                      setTargetGroup(group.id);
                      setPreviewResult(null);
                      setConfirmed(false);
                    }}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: `2px solid ${targetGroup === group.id ? A : "rgba(255,255,255,0.2)"}`,
                      background: targetGroup === group.id ? A : "transparent",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  />
                  <Icon name={group.icon} size="0.85rem" color={targetGroup === group.id ? A : T.color.textMuted} />
                  <span style={{ fontSize: "0.8rem", color: targetGroup === group.id ? T.color.text : T.color.textSub }}>{group.label}</span>
                </label>
              ))}
            </div>
          </div>

          {previewResult && (
            <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: T.radius.md, background: `${A}10`, border: `1px solid ${A}22` }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: A }}>
                <strong>{previewResult.total}</strong> destinataire{previewResult.total !== 1 ? "s" : ""} pour le groupe <strong>{targetGroup}</strong>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: T.color.textMuted }}>
                Actifs: {previewResult.breakdown?.active} - Essai: {previewResult.breakdown?.trial} - Free: {previewResult.breakdown?.free}
              </p>
              {!confirmed && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                  <span style={{ fontSize: "0.75rem", color: T.color.textSub }}>
                    Je confirme l'envoi a {previewResult.total} utilisateur{previewResult.total !== 1 ? "s" : ""}
                  </span>
                </label>
              )}
            </div>
          )}

          {broadcastResult && (
            <div
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                borderRadius: T.radius.md,
                background: `${T.color.success}10`,
                border: `1px solid ${T.color.success}28`,
              }}
            >
              <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.success }}>
                Envoye a <strong>{broadcastResult.sent}</strong>/{broadcastResult.total} utilisateurs
                {broadcastResult.failed > 0 && ` - ${broadcastResult.failed} echecs`}
              </p>
            </div>
          )}

          {broadcastError && <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: T.color.error }}>{broadcastError}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePreview}
              disabled={broadcastLoading}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: T.radius.full,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: T.color.textSub,
                fontFamily: T.font.sans,
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: broadcastLoading ? "wait" : "pointer",
                opacity: broadcastLoading ? 0.6 : 1,
              }}
            >
              Apercu
            </button>
            <button
              onClick={handleSend}
              disabled={broadcastLoading || (!confirmed && previewResult !== null) || !message.trim()}
              style={{
                flex: 2,
                padding: "10px 16px",
                borderRadius: T.radius.full,
                background:
                  confirmed || previewResult === null
                    ? `linear-gradient(135deg, ${T.color.warning}, ${T.color.warning}99)`
                    : "rgba(255,255,255,0.04)",
                border: "none",
                color: confirmed || previewResult === null ? "#111" : T.color.textMuted,
                fontFamily: T.font.sans,
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: broadcastLoading || (!confirmed && previewResult !== null) || !message.trim() ? "not-allowed" : "pointer",
                opacity: broadcastLoading || (!confirmed && previewResult !== null) ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon name="send" size="0.85rem" color={confirmed || previewResult === null ? "#111" : T.color.textMuted} />
              {broadcastLoading ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>

        <div style={{ padding: "28px", borderRadius: T.radius.xl, background: "rgba(26,27,33,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: T.radius.md,
                background: `${T.color.success}14`,
                border: `1px solid ${T.color.success}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="data_object" fill size="1rem" color={T.color.success} />
            </div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: T.color.text }}>Logs Greffier</h3>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.6 }}>
            Dernier log disponible apres un echange dans l'app, stocke en localStorage.
          </p>
          <button
            onClick={() => setShowGreffier((value) => !value)}
            style={{
              width: "100%",
              padding: "11px 20px",
              borderRadius: T.radius.full,
              background: `${T.color.success}12`,
              border: `1px solid ${T.color.success}28`,
              color: T.color.success,
              fontFamily: T.font.sans,
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name={showGreffier ? "expand_less" : "expand_more"} size="1rem" color={T.color.success} />
            {showGreffier ? "Masquer" : "Voir les logs"}
          </button>
          <AnimatePresence>
            {showGreffier && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    marginTop: 16,
                    padding: "14px",
                    borderRadius: T.radius.md,
                    background: "rgba(17,19,24,0.8)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {lastGreffierLog ? (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: "0.65rem",
                        color: T.color.textSub,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {JSON.stringify(lastGreffierLog, null, 2)}
                    </pre>
                  ) : (
                    <p style={{ margin: 0, fontSize: "0.78rem", color: T.color.textMuted, fontStyle: "italic" }}>
                      Aucun log - envoie un message dans l'app d'abord.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
