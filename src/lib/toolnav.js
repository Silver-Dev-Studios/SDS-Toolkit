/**
 * Shared building blocks for the tool browser UI —
 * used by both the header "Tools" menu and the homepage index.
 */

import { esc } from "./util.js";

export const NAV_LABEL = {
  developer: "Developer",
  files: "Files",
  creative: "Creative",
  writing: "Writing",
};

export const CATEGORY_ICON = {
  developer: "{ }",
  files: "◫",
  creative: "✦",
  writing: "¶",
};

export const TOOL_GLYPH = {
  "json-formatter": "{ }", base64: "64", "url-encoder": "://", "uuid-generator": "9f",
  "regex-tester": ".*", "diff-viewer": "≠",
  "image-converter": "◫", "image-compressor": "☁", "image-resizer": "⤢",
  "bg-remover": "⊗", "svg-preview": "svg", "metadata-viewer": "i",
  "palette-generator": "◐", "gradient-editor": "◨", "shadow-generator": "◟", "favicon-generator": "◆",
  "markdown-editor": "M↓", "word-counter": "¶", "csv-json": "⇄", "text-formatter": "Aa"
};

export function catLabel(cat) {
  return NAV_LABEL[cat.id] || cat.name;
}

/** Case-insensitive match against a tool's title, tagline and tags. */
export function matchesQuery(t, q) {
  q = q.trim().toLowerCase();
  if (!q) return true;
  return (
    t.title.toLowerCase().includes(q) ||
    t.tagline.toLowerCase().includes(q) ||
    t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

/** A single tool link row, used inside category blocks. */
export function toolRow(t, { compact = false } = {}) {
  const glyph = TOOL_GLYPH[t.id] || "◈";
  const tags = t.tags.map((tag) => `<span class="menu-tag">${esc(tag)}</span>`).join("");
  return `
  <a class="tool-row${compact ? " compact" : ""}" href="#/tool/${t.id}" tabindex="0">
    <span class="tool-row-glyph" aria-hidden="true">${esc(glyph)}</span>
    <span class="tool-row-body">
      <span class="tool-row-title">${esc(t.title)}</span>
      <span class="tool-row-tagline">${esc(t.tagline)}</span>
    </span>
    <span class="tool-row-meta">${tags}</span>
  </a>`;
}

/** Collapsible category block (`<details>`), shared by menu + index. */
export function categoryBlock(cat, tools, { defaultOpen = false, compact = false } = {}) {
  const count = tools.length;
  const body = tools.map((t) => toolRow(t, { compact })).join("");
  return `
  <details class="cat-block ${compact ? "compact" : ""}" data-cat-id="${cat.id}" ${defaultOpen ? "open" : ""}>
    <summary tabindex="0">
      <span class="cat-block-ico" aria-hidden="true">${esc(CATEGORY_ICON[cat.id] || "▣")}</span>
      <span class="cat-block-headings">
        <span class="cat-block-label">${esc(cat.name)}</span>
        ${compact ? "" : `<span class="cat-block-about">${esc(cat.about)}</span>`}
      </span>
      <span class="cat-block-count" title="${count} tools">${count}</span>
      <span class="cat-block-caret" aria-hidden="true"></span>
    </summary>
    <div class="cat-block-body">${body}</div>
  </details>`;
}