import { colorizeJSON, repairJSON, findJSONError } from "../../lib/json.js";
import { copyText, esc } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Input</span>
          <span class="actions">
            <button class="btn ghost small" data-act="sample">Sample</button>
          </span>
        </div>
        <div class="panel-body">
          <textarea id="jsonInput" spellcheck="false" placeholder='{\n  "hello": "world"\n}'></textarea>
          <div class="actions mt-12">
            <button class="btn" data-act="format">Format</button>
            <button class="btn ghost" data-act="minify">Minify</button>
            <button class="btn ghost" data-act="fix">Repair</button>
          </div>
        </div>
      </section>
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Output</span>
          <span class="badge ok" id="valBadge" hidden>✓ Valid JSON</span>
          <button class="btn ghost small" data-act="copy" id="copyBtn">Copy</button>
        </div>
        <div class="panel-body">
          <pre class="code" id="jsonOutput" style="white-space:pre-wrap"><span class="dim">Paste JSON → Format.</span></pre>
        </div>
      </section>
    </div>
  `;

  const input = root.querySelector("#jsonInput");
  const output = root.querySelector("#jsonOutput");
  const valBadge = root.querySelector("#valBadge");

  function getInput() { return input.value.trim(); }

  function render(pretty, isError) {
    if (isError) {
      output.innerHTML = esc(pretty);
      output.style.color = "#f0b3a4";
      valBadge.hidden = true;
      return;
    }
    output.style.color = "";
    output.innerHTML = colorizeJSON(pretty);
    valBadge.hidden = false;
  }

  const actions = {
    format() {
      const src = getInput();
      if (!src) { render("Nothing to format.", true); return; }
      try { render(JSON.stringify(JSON.parse(src), null, 2)); }
      catch (err) { render(`⚠ ${err.message}`, true); }
    },
    minify() {
      const src = getInput();
      if (!src) { render("Nothing to minify.", true); return; }
      try { render(JSON.stringify(JSON.parse(src))); }
      catch (err) { render(`⚠ ${err.message}`, true); }
    },
    fix() {
      const src = getInput();
      if (!src) { render("Nothing to repair.", true); return; }
      let fixed;
      try {
        fixed = repairJSON(src);
        render(JSON.stringify(JSON.parse(fixed), null, 2));
      } catch {
        const e = findJSONError(src);
        render(`⚠ Could not auto-repair. Parse error near line ${e.line}: ${e.snippet.trim()}.`, true);
      }
    },
    copy() {
      const txt = output.textContent;
      if (!txt || txt.startsWith("⚠")) return;
      copyText(txt, "Copied formatted JSON");
    },
    sample() {
      input.value = JSON.stringify({
        "product": "SDS Toolkit",
        "version": 1.0,
        "featured": true,
        "privacy": ["local", "private", { "uploads": 0 }],
        "tags": null,
        "nested": { "a": [1, 2, 3], "b": { "c": "d" } }
      }, null, 2);
      actions.format();
    }
  };

  root.querySelectorAll("[data-act]").forEach(b => {
    b.addEventListener("click", () => actions[b.dataset.act]());
  });

  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const src = getInput();
      if (!src) { valBadge.hidden = true; return; }
      try { JSON.parse(src); valBadge.hidden = false; }
      catch { valBadge.hidden = true; }
    }, 400);
  });

  actions.sample();
}