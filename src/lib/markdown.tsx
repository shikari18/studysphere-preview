/**
 * Simple markdown renderer for AI chat messages.
 * Handles: ## headings, **bold**, *italic*, bullet lists (* / -),
 * numbered lists, line breaks, inline code `code`, code blocks ```,
 * horizontal rules ---
 */
import React from "react";

// ── inline parser ────────────────────────────────────────────────────────────
// Handles **bold**, *italic*, `code`, and plain text within a single line.
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Pattern: bold (**), italic (*), inline-code (`)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    // plain text before this match
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    if (m[2] !== undefined) {
      // **bold**
      nodes.push(<strong key={m.index}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      // *italic*
      nodes.push(<em key={m.index}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      // `inline code`
      nodes.push(
        <code
          key={m.index}
          className="bg-glass-strong px-1 py-0.5 rounded text-[12px] font-mono"
        >
          {m[4]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }

  // remaining plain text
  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

// ── block renderer ───────────────────────────────────────────────────────────
export function renderMarkdown(text: string): React.ReactNode {
  // Normalise line endings
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split out fenced code blocks first so we don't process their content
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; lang?: string; content: string }> = [];
  let cursor = 0;
  let fm: RegExpExecArray | null;

  while ((fm = fenceRe.exec(raw)) !== null) {
    if (fm.index > cursor) {
      parts.push({ type: "text", content: raw.slice(cursor, fm.index) });
    }
    parts.push({ type: "code", lang: fm[1] || undefined, content: fm[2].trimEnd() });
    cursor = fm.index + fm[0].length;
  }
  if (cursor < raw.length) {
    parts.push({ type: "text", content: raw.slice(cursor) });
  }

  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const part of parts) {
    if (part.type === "code") {
      elements.push(
        <pre
          key={key++}
          className="bg-glass-strong rounded-[10px] p-3 text-[12px] font-mono overflow-x-auto my-2"
        >
          <code>{part.content}</code>
        </pre>
      );
      continue;
    }

    // Process regular text block line by line, grouping into paragraphs
    const lines = part.content.split("\n");
    const blocks: React.ReactNode[] = [];
    let paraLines: string[] = [];

    const flushPara = () => {
      if (paraLines.length === 0) return;
      const joined = paraLines.join("\n").trim();
      if (joined) {
        // Render line breaks within the paragraph
        const lineNodes = joined.split("\n").reduce<React.ReactNode[]>((acc, line, i, arr) => {
          acc.push(...parseInline(line));
          if (i < arr.length - 1) acc.push(<br key={`br-${i}`} />);
          return acc;
        }, []);
        blocks.push(
          <p key={key++} className="mb-1">
            {lineNodes}
          </p>
        );
      }
      paraLines = [];
    };

    // Accumulators for lists
    let bulletItems: string[] = [];
    let orderedItems: string[] = [];

    const flushBullets = () => {
      if (bulletItems.length === 0) return;
      blocks.push(
        <ul key={key++} className="list-none space-y-0.5 mb-1">
          {bulletItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-[14px]">
              <span className="text-[color:var(--primary)] flex-shrink-0 mt-0.5">•</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      bulletItems = [];
    };

    const flushOrdered = () => {
      if (orderedItems.length === 0) return;
      blocks.push(
        <ol key={key++} className="list-none space-y-0.5 mb-1">
          {orderedItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-[14px]">
              <span className="text-[color:var(--primary)] font-semibold flex-shrink-0 w-5 text-right">
                {i + 1}.
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Blank line → paragraph break
      if (line.trim() === "") {
        flushBullets();
        flushOrdered();
        flushPara();
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        flushBullets();
        flushOrdered();
        flushPara();
        blocks.push(<hr key={key++} className="border-hairline my-3" />);
        continue;
      }

      // ## Heading
      const h2 = line.match(/^##\s+(.+)/);
      if (h2) {
        flushBullets();
        flushOrdered();
        flushPara();
        blocks.push(
          <h3 key={key++} className="font-bold text-[15px] mt-3 mb-1">
            {parseInline(h2[1])}
          </h3>
        );
        continue;
      }

      // ### Heading
      const h3 = line.match(/^###\s+(.+)/);
      if (h3) {
        flushBullets();
        flushOrdered();
        flushPara();
        blocks.push(
          <h4 key={key++} className="font-semibold text-[14px] mt-2 mb-1">
            {parseInline(h3[1])}
          </h4>
        );
        continue;
      }

      // #### Heading (just in case)
      const h4 = line.match(/^####\s+(.+)/);
      if (h4) {
        flushBullets();
        flushOrdered();
        flushPara();
        blocks.push(
          <h5 key={key++} className="font-semibold text-[13px] mt-2 mb-0.5">
            {parseInline(h4[1])}
          </h5>
        );
        continue;
      }

      // Bullet list (* or -)
      const bullet = line.match(/^[\*\-]\s+(.+)/);
      if (bullet) {
        flushOrdered();
        flushPara();
        bulletItems.push(bullet[1]);
        continue;
      }

      // Numbered list (1. 2. etc.)
      const ordered = line.match(/^\d+\.\s+(.+)/);
      if (ordered) {
        flushBullets();
        flushPara();
        orderedItems.push(ordered[1]);
        continue;
      }

      // Regular line → accumulate into paragraph
      flushBullets();
      flushOrdered();
      paraLines.push(line);
    }

    // Flush remaining
    flushBullets();
    flushOrdered();
    flushPara();

    elements.push(...blocks);
  }

  return <>{elements}</>;
}
