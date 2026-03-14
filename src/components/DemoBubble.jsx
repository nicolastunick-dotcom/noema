import { memo } from "react";

const DemoBubble = memo(function DemoBubble({ eyebrow, text }) {
  const paragraphs = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="demo-bubble-shell" aria-live="polite">
      <div className="demo-bubble-orbit demo-bubble-orbit--violet"/>
      <div className="demo-bubble-orbit demo-bubble-orbit--rose"/>
      <div className="demo-bubble">
        <div className="demo-bubble-inner">
          {eyebrow && <div className="demo-bubble-eyebrow">{eyebrow}</div>}
          <div className="demo-bubble-copy">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default DemoBubble;
