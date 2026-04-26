import { motion } from "framer-motion";
import { Icon, Pill, SectionHeader } from "./AdminShared";
import { ALL_PAGES, A, navTo } from "./adminConstants";
import { T } from "../../design-system/tokens";

export default function NavigationTab() {
  const currentPath = window.location.pathname;

  return (
    <div>
      <SectionHeader
        title="Navigation libre"
        sub="Accede a n'importe quelle page sans etre bloque par les gardes d'acces."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {ALL_PAGES.map((page) => {
          const isCurrent = currentPath === (page.path === "/" ? "/" : page.path) || (page.path !== "/" && currentPath.startsWith(page.path));

          return (
            <motion.button
              key={page.path}
              onClick={() => navTo(page.path)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: "20px",
                borderRadius: T.radius.xl,
                background: isCurrent ? `${A}12` : "rgba(26,27,33,0.5)",
                border: isCurrent ? `1px solid ${A}33` : "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: T.font.sans,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: T.radius.md,
                  background: isCurrent ? `${A}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isCurrent ? `${A}33` : "rgba(255,255,255,0.06)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={page.icon} size="1rem" color={isCurrent ? A : T.color.textMuted} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: isCurrent ? A : T.color.text }}>{page.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: T.color.textMuted, fontFamily: "monospace" }}>{page.path}</p>
              </div>
              {isCurrent && <Pill label="Actif" color={A} />}
            </motion.button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 28,
          padding: "18px 22px",
          borderRadius: T.radius.xl,
          background: "rgba(17,19,24,0.5)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Icon name="info" size="0.9rem" color={T.color.textMuted} />
          <span
            style={{
              fontSize: "0.62rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: T.color.textMuted,
              fontWeight: 700,
            }}
          >
            Note
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.82rem", color: T.color.textSub, lineHeight: 1.65 }}>
          Les pages Landing et Login redirigent normalement les utilisateurs connectes. Le parametre{" "}
          <code style={{ background: "rgba(189,194,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: "0.8rem" }}>
            ?adminpreview=1
          </code>{" "}
          est ajoute automatiquement pour court-circuiter ce comportement.
        </p>
      </div>
    </div>
  );
}
