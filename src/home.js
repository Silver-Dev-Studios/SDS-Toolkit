import { CATEGORIES, TOOLS } from "./tools/registry.js";
import { esc } from "./lib/util.js";

const glyphs = {
  "json-formatter": "{ }", base64: "64", "url-encoder": "://", "uuid-generator": "9f",
  "regex-tester": ".*", "diff-viewer": "≠",
  "image-converter": "◫", "image-compressor": "☁", "image-resizer": "⤢",
  "bg-remover": "⊗", "svg-preview": "svg", "metadata-viewer": "i",
  "palette-generator": "◐", "gradient-editor": "◨", "shadow-generator": "◟", "favicon-generator": "◆",
  "markdown-editor": "M↓", "word-counter": "¶", "csv-json": "⇄", "text-formatter": "Aa"
};

export function renderHome(root) {
  const totalTools = TOOLS.length;
  const perCat = CATEGORIES.map((c) => TOOLS.filter((t) => t.category === c.id).length);
  const maxTools = Math.max(...perCat);

  const heroStats = [
    ["Locally run", "100%"],
    ["Tools", String(totalTools)],
    ["Uploads", "Zero"],
    ["Servers", "None"]
  ];

  root.innerHTML = `
    <section class="hero">
      <div class="hero-main">
        <div class="kicker">Silver Dev Studio · Toolkit</div>
        <h1>A home for tools that <em>solve real problems.</em></h1>
        <p class="lede">SDS Toolkit is a collection of free, <strong>privacy-friendly</strong> tools that run entirely in your browser. Developer utilities, image helpers, creative generators and writing companions — each one independently useful, none of them ever transmit a byte of your data.</p>
      </div>
      <aside class="hero-side">
        ${heroStats.map(([l, v]) => `<div class="rowline"><span>${l}</span><b>${v}</b></div>`).join("")}
        <div class="seal-wrap"><div class="seal" title="Silver Dev Studio">S</div></div>
      </aside>
    </section>

    <div class="count-strip">
      <div class="cell"><span class="n">${totalTools}</span><span class="l">tools</span></div>
      <div class="cell"><span class="n">${CATEGORIES.length}</span><span class="l">workbenches</span></div>
      <div class="cell"><span class="n">0</span><span class="l">uploads</span></div>
      <div class="cell"><span class="n">∞</span><span class="l">privacy</span></div>
    </div>

    ${CATEGORIES.map((cat, ci) => {
      const tools = TOOLS.filter((t) => t.category === cat.id);
      return `
      <section class="category-section" id="cat-${cat.id}">
        <div class="category-head">
          <span class="idx">${String(ci + 1).padStart(2, "0")}</span>
          <h2>${esc(cat.name)}</h2>
          <span class="rule"></span>
          <span class="mono-label dim">${String(tools.length).padStart(2, "0")} ${tools.length === 1 ? "tool" : "tools"}</span>
        </div>
        <p class="category-about">${esc(cat.about)}</p>
        <div class="tool-grid">
          ${tools.map((t, ti) => `
            <a class="tool-card" href="#/tool/${t.id}" style="animation-delay:${(ti * 0.045 + (ci * 0.04)).toFixed(2)}s">
              <div class="num">${String(ti + 1).padStart(2, "0")}</div>
              <div class="glyph">${esc(glyphs[t.id] || "◈")}</div>
              <h3>${esc(t.title)}</h3>
              <p>${esc(t.tagline)}</p>
              <div class="foot">
                <span class="go">Open tool →</span>
                <span class="tagchip">${esc(t.tags[0])}</span>
              </div>
            </a>`).join("")}
        </div>
      </section>`;
    }).join("")}
  `;
}
