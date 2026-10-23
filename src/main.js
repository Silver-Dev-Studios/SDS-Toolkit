import "./styles/base.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/tools.css";

import { CATEGORIES, TOOLS, getTool, loadToolModule } from "./tools/registry.js";
import { renderHome } from "./home.js";
import { esc } from "./lib/util.js";
import { catLabel, categoryBlock, matchesQuery } from "./lib/toolnav.js";

const app = document.getElementById("app");
const toolsTrigger = document.getElementById("toolsTrigger");
const toolsMenuBtn = document.getElementById("toolsMenuBtn");
const toolsMenu = document.getElementById("toolsMenu");
const toolsSearch = document.getElementById("toolsSearch");
const toolsMenuCats = document.getElementById("toolsMenuCats");
const toolsMenuEmpty = document.getElementById("toolsMenuEmpty");

// Every deploy rotates the hashed chunk filenames while GitHub Pages caches
// index.html for 10 minutes, so a page loaded before a deploy asks for chunks
// that no longer exist. Reload once to pick up the new build; the timestamp
// guard stops a reload loop if the chunk is genuinely missing.
const STALE_RELOAD_KEY = "sds:stale-reload";
const STALE_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically/i;

function reloadOnceForNewBuild() {
  const now = Date.now();
  if (now - Number(sessionStorage.getItem(STALE_RELOAD_KEY) || 0) < 15000) return false;
  sessionStorage.setItem(STALE_RELOAD_KEY, String(now));
  location.reload();
  return true;
}

window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  reloadOnceForNewBuild();
});

/* --- header "Tools" dropdown ------------------------------------ */

function openMenu() {
  toolsTrigger.classList.add("open");
  toolsMenuBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  toolsTrigger.classList.remove("open");
  toolsMenuBtn.setAttribute("aria-expanded", "false");
  toolsSearch.value = "";
  renderMenu();
}

function renderMenu() {
  const q = toolsSearch.value;
  let visible = 0;
  // categories with matches stay open so a filter never hides its own results
  toolsMenuCats.innerHTML = CATEGORIES.map((c) => {
    const tools = TOOLS.filter((t) => t.category === c.id && matchesQuery(t, q));
    if (tools.length) visible += 1;
    return categoryBlock(c, tools, { compact: true, defaultOpen: tools.length > 0 });
  }).join("");
  toolsMenuEmpty.hidden = visible !== 0;
}

function menuKeys(e) {
  if (e.key === "Escape" && toolsTrigger.classList.contains("open")) {
    closeMenu();
    toolsMenuBtn.focus();
    return;
  }
  if (e.key === "/" && !/textarea|input|select/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    openMenu();
    toolsSearch.focus();
  }
}

function findSiblingTools(tool) {
  const cat = CATEGORIES.find((c) => c.id === tool.category);
  const siblings = TOOLS.filter((t) => t.category === tool.category);
  const i = siblings.findIndex((t) => t.id === tool.id);
  const prev = siblings[(i - 1 + siblings.length) % siblings.length];
  const next = siblings[(i + 1) % siblings.length];
  return { cat, prev, next };
}

async function handleRoute() {
  const hash = location.hash || "#/";
  const isHomeRoute = !hash.startsWith("#/") || hash === "#/" || hash.startsWith("#/cat/");
  const catMatch = hash.match(/^#\/cat\/([a-z0-9-]+)/);
  const toolMatch = hash.match(/^#\/tool\/([a-z0-9-]+)/);

  if (catMatch) {
    renderHome(app, { scrollTo: catMatch[1] });
    window.scrollTo(0, 0);
    return;
  }

  const toolId = toolMatch ? toolMatch[1] : null;
  const tool = toolId ? getTool(toolId) : null;

  if (!tool) {
    // The home markup is rendered after the browser's own anchor scroll has
    // already run, so in-page anchors (#about, #toolIndex, …) need a nudge.
    const anchor = isHomeRoute ? hash.slice(1) : "";
    renderHome(app, {});
    if (anchor) {
      const target = document.getElementById(anchor);
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
    }
    window.scrollTo(0, 0);
    return;
  }

  document.title = `${tool.title} — SDS Toolkit`;
  app.innerHTML = `<div class="loading"><div class="spinner"></div> opening workbench…</div>`;
  window.scrollTo(0, 0);

  try {
    const mod = await loadToolModule(tool.id);
    const mount = mod.default;
    const { cat, prev, next } = findSiblingTools(tool);

    app.innerHTML = `
      <div class="tool-masthead">
        <a class="back-link" href="#/"><span class="arrow">←</span> All tools</a>
        <div class="tool-masthead-tags">
          <span class="badge">${catLabel(cat)} utility</span>
        </div>
      </div>
      <div class="wrapper workbench">
        <header class="tool-intro">
          <div class="tool-intro-main">
            <div class="crumb">SDS Toolkit <span aria-hidden="true">·</span> ${catLabel(cat)} <span aria-hidden="true">·</span> workbench</div>
            <h1>${esc(tool.title)}</h1>
            <p class="desc">${esc(tool.desc)}</p>
          </div>
          <aside class="tool-intro-rail">
            <div class="rail-row"><span>Category</span><b>${esc(catLabel(cat))}</b></div>
            <div class="rail-row"><span>Runs</span><b>On your device</b></div>
            <div class="rail-row"><span>Uploads</span><b>Never</b></div>
            <div class="tool-chip-row">
              ${tool.tags.map((tag) => `<span class="topic-chip">${esc(tag)}</span>`).join("")}
            </div>
          </aside>
        </header>
        <section class="tool-body" data-tool="${tool.id}" aria-label="${esc(tool.title)} workspace"></section>
        <nav class="tool-pager" aria-label="Other tools in ${esc(cat.name)}">
          <a class="pager-link prev" href="#/tool/${prev.id}">
            <span class="pager-dir">← Previous</span>
            <span class="pager-title">${esc(prev.title)}</span>
          </a>
          <a class="pager-all" href="#/" aria-label="All tools">All tools</a>
          <a class="pager-link next" href="#/tool/${next.id}">
            <span class="pager-dir">Next →</span>
            <span class="pager-title">${esc(next.title)}</span>
          </a>
        </nav>
      </div>
    `;
    await mount(app.querySelector(".tool-body"), tool);
  } catch (err) {
    if (STALE_ERROR.test(err.message || "") && reloadOnceForNewBuild()) return;
    console.error(err);
    app.innerHTML = `<div class="wrapper" style="padding:40px 24px;">
      <h1 style="font-size:28px;">Something went wrong opening this workbench.</h1>
      <p class="muted" style="margin-top:8px;">${esc(err.message)}</p>
      <a class="btn" href="#/">Return to all tools</a></div>`;
  }
}

toolsMenuBtn.addEventListener("click", () => {
  if (toolsTrigger.classList.contains("open")) closeMenu();
  else openMenu();
});

// never let the filter forms actually submit / reload the page
document.querySelectorAll("form.tools-search").forEach((f) =>
  f.addEventListener("submit", (e) => e.preventDefault())
);

toolsSearch.addEventListener("input", renderMenu);
toolsSearch.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenu();
    toolsMenuBtn.focus();
  }
});
toolsMenu.addEventListener("click", (e) => {
  if (e.target.closest(".tool-row")) closeMenu();
});

document.addEventListener("click", (e) => {
  if (toolsTrigger.classList.contains("open") && !toolsTrigger.contains(e.target)) closeMenu();
});

renderMenu();

window.addEventListener("hashchange", () => {
  if (toolsTrigger.classList.contains("open")) closeMenu();
  handleRoute();
});
handleRoute();

document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("keydown", menuKeys);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !/textarea|input|select/i.test(document.activeElement.tagName)) {
    location.hash = "#/";
  }
});