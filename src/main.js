import "./styles/base.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/tools.css";

import { CATEGORIES, getTool, loadToolModule } from "./tools/registry.js";
import { renderHome } from "./home.js";
import { toast } from "./lib/util.js";

const app = document.getElementById("app");
const nav = document.getElementById("siteNav");

const NAV_LABEL = { developer: "Developer", files: "Files", creative: "Creative", writing: "Writing" };

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

function buildNav() {
  nav.innerHTML = CATEGORIES.map(
    (c) => `<a href="#/cat/${c.id}" data-cat="${c.id}">${NAV_LABEL[c.id] || c.name}</a>`
  ).join("");
}

function setActive(route) {
  nav.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.dataset.cat === route.cat);
  });
}

function scrollSection(id) {
  setTimeout(() => {
    const el = document.getElementById(`cat-${id}`);
    if (el) window.scrollTo({ top: el.offsetTop - 96, behavior: "smooth" });
  }, 30);
}

async function handleRoute() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/tool\/([a-z0-9-]+)/) || hash.match(/^#\/cat\/([a-z0-9-]+)/);
  const catMatch = hash.match(/^#\/cat\/([a-z0-9-]+)/);

  if (catMatch) {
    setActive({ cat: catMatch[1] });
    renderHome(app);
    scrollSection(catMatch[1]);
    window.scrollTo(0, 0);
    return;
  }

  const toolId = match ? match[1] : null;
  const tool = toolId ? getTool(toolId) : null;

  if (!tool) {
    setActive({});
    renderHome(app);
    window.scrollTo(0, 0);
    return;
  }

  setActive({ cat: tool.category });
  document.title = `${tool.title} — SDS Toolkit`;
  app.innerHTML = `<div class="loading"><div class="spinner"></div> opening workbench…</div>`;
  window.scrollTo(0, 0);

  try {
    const mod = await loadToolModule(tool.id);
    const mount = mod.default;

    const categoryInfo = CATEGORIES.find((c) => c.id === tool.category);
    app.innerHTML = `
      <div class="tool-bar-row">
        <a class="back-link" href="#/" ><span class="arrow">←</span> All tools</a>
        <span class="badge">${categoryInfo.name}</span>
      </div>
      <div class="wrapper" style="padding-top:20px;">
        <section class="tool-intro">
          <div class="crumb">SDS Toolkit · ${categoryInfo.name}</div>
          <h1>${tool.title}</h1>
          <p class="desc">${tool.desc}</p>
        </section>
        <section class="tool-body" data-tool="${tool.id}"></section>
      </div>
    `;
    await mount(app.querySelector(".tool-body"), tool);
  } catch (err) {
    if (STALE_ERROR.test(err.message || "") && reloadOnceForNewBuild()) return;
    console.error(err);
    app.innerHTML = `<div class="wrapper" style="padding:40px 24px;">
      <h1 style="font-size:28px;">Something went wrong opening this workbench.</h1>
      <p class="muted" style="margin-top:8px;">${err.message}</p>
      <a class="btn" href="#/">Return to all tools</a></div>`;
  }
}

window.addEventListener("hashchange", handleRoute);
buildNav();
handleRoute();

document.getElementById("year").textContent = new Date().getFullYear();

// keyboard shortcut to jump home
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !/textarea|input|select/i.test(document.activeElement.tagName)) {
    location.hash = "#/";
  }
});