// --- CODEX CHANGE START ---
// Codex modification - replace HTML string injection with a controlled React
// renderer that supports the current lightweight formatting safely.
import { Fragment } from "react";

function renderInline(text) {
  const parts = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

export default function RichText({ text }) {
  const paragraphs = String(text || "").split(/\n\n+/).filter(Boolean);
  const safeParagraphs = paragraphs.length ? paragraphs : [String(text || "")];

  return safeParagraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split("\n");
    return (
      <p key={`p-${paragraphIndex}`}>
        {lines.map((line, lineIndex) => (
          <Fragment key={`l-${paragraphIndex}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line)}
          </Fragment>
        ))}
      </p>
    );
  });
}
// --- CODEX CHANGE END ---
