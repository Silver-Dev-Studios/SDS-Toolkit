import { copyText, esc } from "../../lib/util.js";

const SAMPLE = `  Aurora Labs   
aurora labs
Aurora Labs   


  Pricing   page ,   v2  
Contact: “sales@aurora.dev”
Contact: “sales@aurora.dev”
   `;

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel">
        <div class="panel-head"><span class="title">Input</span>
          <span class="actions">
            <button class="btn ghost small" data-act="sample">Sample</button>
            <button class="btn ghost small" data-act="clear">Clear</button>
          </span>
        </div>
        <div class="panel-body">
          <textarea id="tfIn" spellcheck="false" rows="12" placeholder="Paste messy text, one item per line…"></textarea>
          <div class="mt-12">
            <div class="mono-label mb-8">Operations</div>
            <div class="op-grid">
              <label><input type="checkbox" class="op" value="trim" checked /> Trim whitespace</label>
              <label><input type="checkbox" class="op" value="collapse" checked /> Collapse blank lines</label>
              <label><input type="checkbox" class="op" value="stripempty" /> Drop empty lines</label>
              <label><input type="checkbox" class="op" value="lines"/> Join lines → one line</label>
              <label><input type="checkbox" class="op" value="spaces" /> Collapse internal spaces</label>
              <label><input type="checkbox" class="op" value="tabs2spaces" /> Tabs → 2 spaces</label>
              <label><input type="checkbox" class="op" value="right" /> Strip trailing spaces</label>
              <label><input type="checkbox" class="op" value="sort" /> Sort lines</label>
              <label><input type="checkbox" class="op" value="dedupe" /> Deduplicate lines</label>
              <label><input type="checkbox" class="op" value="lower" /> Lowercase</label>
              <label><input type="checkbox" class="op" value="upper" /> UPPERCASE</label>
              <label><input type="checkbox" class="op" value="quotes" /> Straight quotes</label>
              <label><input type="checkbox" class="op" value="slug" /> Slugify (kebab-case)</label>
              <label><input type="checkbox" class="op" value="reverse" /> Reverse lines</label>
            </div>
          </div>
          <div class="actions mt-12">
            <button class="btn" data-act="run">Format ▸</button>
            <button class="btn ghost" data-act="resetOps">Reset ops</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Output</span>
          <span class="actions">
            <span class="badge" id="tfMeta"></span>
            <button class="btn ghost small" data-act="copy">Copy</button>
          </span>
        </div>
        <div class="panel-body">
          <pre class="code" id="tfOut" style="white-space:pre-wrap; max-height:60vh;"><span class="dim">Formatted text…</span></pre>
        </div>
      </section>
    </div>
  `;

  const input = root.querySelector("#tfIn");
  const out = root.querySelector("#tfOut");
  const meta = root.querySelector("#tfMeta");
  let last = "";

  const run = () => {
    let text = input.value.replace(/\r\n/g, "\n");
    const ops = {};

    root.querySelectorAll(".op").forEach((c) => { ops[c.value] = c.checked; });

    if (ops.tabs2spaces) text = text.replace(/\t/g, "  ");
    if (ops.right) text = text.replace(/[ \t]+$/gm, "");
    if (ops.trim) text = text.replace(/^[ \t]+|[ \t]+$/gm, "");
    if (ops.quotes) text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    if (ops.collapse) text = text.replace(/\n{3,}/g, "\n\n");
    if (ops.spaces) text = text.replace(/[ \t]{2,}/g, " ");
    if (ops.lower) text = text.toLowerCase();
    if (ops.upper) text = text.toUpperCase();

    let lines = text.split("\n");
    if (ops.sort) lines = lines.sort((a, b) => a.localeCompare(b));
    if (ops.dedupe) lines = [...new Set(lines)];
    if (ops.reverse) lines = lines.reverse();
    if (ops.stripempty) lines = lines.filter((l) => l.trim());

    let result = ops.lines ? lines.join(" ") : lines.join("\n");
    if (ops.slug) {
      result = result.toLowerCase()
        .replace(/['']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        || result;
    }

    out.innerHTML = result ? esc(result) : `<span class="dim">Nothing left after these operations.</span>`;
    meta.textContent = `${input.value.length}→${result.length} chars`;
    last = result;
  };

  root.querySelector('[data-act="run"]').addEventListener("click", run);
  root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(last, "Copied formatted text"));
  root.querySelector('[data-act="resetOps"]').addEventListener("click", () => {
    root.querySelectorAll(".op").forEach((c) => {
      c.checked = ["trim", "collapse"].includes(c.value);
    });
    run();
  });

  root.querySelectorAll(".op").forEach((c) => c.addEventListener("change", run));
  root.querySelector('[data-act="sample"]').addEventListener("click", () => {
    input.value = SAMPLE;
    run();
  });
  root.querySelector('[data-act="clear"]').addEventListener("click", () => {
    input.value = "";
    input.focus();
    run();
  });

  input.addEventListener("input", run);

  input.value = SAMPLE;
  run();
}