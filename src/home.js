import { CATEGORIES, TOOLS } from "./tools/registry.js";
import { esc } from "./lib/util.js";
import { categoryBlock, matchesQuery, toolRow } from "./lib/toolnav.js";

const FEATURES = [
  ["Built for the browser", "Every tool is a small, focused workbench with real-time controls and instant output — no installs, no accounts, no tutorials required."],
  ["Absolute local privacy", "Files, text and colors are processed with vanilla JS, the Canvas API and the Web Crypto API inside this tab. Nothing uploads. Even this list is pre-rendered."],
  ["Copy-ready outputs", "Generated CSS, converted data and cleaned text leave through one copy button or one download. You keep exactly what you make."],
  ["Deliberately small", `No accounts, no telemetry, no bloat. ${TOOLS.length} pragmatic utilities that each do one job, done properly, and never nag you.`]
];

const STEPS = [
  ["01", "Pick a workbench", "Open the palette above or scroll this index. Categories keep related tools together."],
  ["02", "Drop or paste", "One field, one canvas. The tool reacts as you type or as soon as a file lands on the dropzone."],
  ["03", "Use the result", "Copy it, download it, link to it — everything you make never leaves your device."]
];

function indexBody() {
  return CATEGORIES.map((c) =>
    categoryBlock(c, TOOLS.filter((t) => t.category === c.id), { defaultOpen: false })
  ).join("");
}

export function renderHome(root, opts = {}) {
  const totalTools = TOOLS.length;
  const scrollTo = opts.scrollTo || null;
  document.title = "SDS Toolkit — free on-device web tools";

  root.innerHTML = `
    <section class="hero">
      <div class="hero-main">
        <div class="kicker">Silver Dev Studio <span aria-hidden="true">/</span> SDS Toolkit</div>
        <h1>Small, honest tools that <em>run in your browser.</em></h1>
        <p class="lede">${totalTools} free utilities for developers and makers — encoding, conversion, image editing, CSS generation and text cleanup. Everything executes locally, so your data never leaves the tab.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#toolIndex">Explore the tools <span aria-hidden="true">↓</span></a>
          <a class="btn ghost" href="#about">What is SDS Toolkit?</a>
        </div>
      </div>
      <aside class="hero-side">
        ${[["Locally run", "100%"], ["Tools", String(totalTools)], ["Uploads", "0"], ["Servers", "0"]]
          .map(([l, v]) => `<div class="rowline"><span>${l}</span><b>${v}</b></div>`).join("")}
        <div class="seal-wrap"><div class="seal" title="Silver Dev Studio">S</div></div>
      </aside>
    </section>

    <div class="count-strip">
      <div class="cell"><span class="n">${totalTools}</span><span class="l">tools</span></div>
      <div class="cell"><span class="n">${CATEGORIES.length}</span><span class="l">categories</span></div>
      <div class="cell"><span class="n">0</span><span class="l">uploads</span></div>
      <div class="cell"><span class="n">∞</span><span class="l">privacy</span></div>
    </div>

    <section class="about-section" id="about">
      <div class="about-col">
        <span class="mono-label dim">What is SDS Toolkit?</span>
        <h2>One slipcase of focused workbenches.</h2>
        <p class="about-lede">SDS Toolkit is Silver Dev Studio’s collection of free, privacy-friendly web apps. Choose a workbench, get the output, move on.</p>
      </div>
      <div class="about-features">
        ${FEATURES.map(([t, d], i) => `
          <article class="about-feature">
            <span class="about-idx">${String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>${esc(t)}</h3>
              <p>${esc(d)}</p>
            </div>
          </article>`).join("")}
      </div>
    </section>

    <section class="tool-index" id="toolIndex">
      <div class="index-head">
        <div class="index-title">
          <span class="idx-ico" aria-hidden="true">▤</span>
          <div>
            <span class="mono-label dim">The collection</span>
            <h2>Every workbench, one list.</h2>
          </div>
        </div>
        <form class="tools-search index-search" role="search">
          <span class="search-ico" aria-hidden="true">⌕</span>
          <input type="search" id="indexSearch" placeholder="Filter ${totalTools} tools…" autocomplete="off" spellcheck="false" />
        </form>
      </div>
      <div class="home-index-cats" id="homeIndexCats"></div>
      <div class="tools-menu-empty" id="indexEmpty" hidden>No tools match that filter — try “json”, “png” or “css”.</div>
    </section>

    <section class="how-section">
      <span class="mono-label dim">How it works</span>
      <h2>Load. Work. Leave nothing behind.</h2>
      <div class="how-strip">
        ${STEPS.map(([n, t, d]) => `
          <div class="how-step">
            <span class="how-n">${n}</span>
            <h3>${esc(t)}</h3>
            <p>${esc(d)}</p>
          </div>`).join("")}
      </div>
    </section>

    <section class="cta-section">
      <span class="mono-label dim">Free forever · local always</span>
      <h2>Your files and data stay put.<br />That’s the whole point.</h2>
      <a class="btn btn-primary" href="#toolIndex">Browse the tools <span aria-hidden="true">→</span></a>
    </section>
  `;

  const indexCats = root.querySelector("#homeIndexCats");
  const search = root.querySelector("#indexSearch");
  indexCats.innerHTML = indexBody();

  const onSearch = () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    indexCats.querySelectorAll(".cat-block").forEach((block) => {
      const cat = CATEGORIES.find((c) => c.id === block.dataset.catId);
      const tools = TOOLS.filter((t) => t.category === cat.id && matchesQuery(t, q));
      block.querySelector(".cat-block-body").innerHTML = tools.map((t) => toolRow(t)).join("");
      block.querySelector(".cat-block-count").textContent = tools.length;
      const empty = !tools.length;
      block.classList.toggle("is-empty", empty);
      block.open = !empty && q.length > 0;
      if (!empty) visible += 1;
    });
    root.querySelector("#indexEmpty").hidden = visible !== 0;
  };
  search.addEventListener("input", onSearch);
  if (scrollTo) {
    requestAnimationFrame(() => {
      const block = indexCats.querySelector(`[data-cat-id="${scrollTo}"]`);
      if (block) {
        block.open = true;
        setTimeout(() => block.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    });
  }
}
