import { parseCSV, rowsToJSON, toCSV } from "../../lib/csv.js";
import { copyText, downloadText, esc } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel">
        <div class="panel-head"><span class="title">Input</span>
          <div class="seg" id="dir">
            <button data-dir="csv2json" class="active">CSV → JSON</button>
            <button data-dir="json2csv">JSON → CSV</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="row mb-8">
            <label class="field">Delimiter
              <select id="delim">
                <option value=",">, comma</option>
                <option value=";">; semicolon</option>
                <option value="\t">tab</option>
              </select>
            </label>
            <label class="field">Type inference
              <select id="infer">
                <option value="1">Auto (numbers & booleans)</option>
                <option value="0">Keep everything as text</option>
              </select>
            </label>
          </div>
          <textarea id="csvSrc" spellcheck="false" rows="11" placeholder="name,age,city&#10;Ada,36,London&#10;Grace,45,New York"></textarea>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Output</span>
          <span class="actions">
            <span class="badge" id="csvMeta"></span>
            <button class="btn ghost small" data-act="copy">Copy</button>
            <button class="btn ghost small" data-act="download">Download</button>
          </span>
        </div>
        <div class="panel-body">
          <pre class="code" id="csvOut" style="white-space:pre-wrap; max-height:60vh;"><span class="dim">Result appears here…</span></pre>
        </div>
      </section>
    </div>
  `;

  const src = root.querySelector("#csvSrc");
  const out = root.querySelector("#csvOut");
  const meta = root.querySelector("#csvMeta");
  const delim = root.querySelector("#delim");
  const infer = root.querySelector("#infer");
  let dir = "csv2json";
  let lastOutput = "";

  const run = () => {
    const text = src.value;
    if (!text.trim()) { out.innerHTML = `<span class="dim">Nothing to convert.</span>`; meta.textContent = ""; return; }
    try {
      if (dir === "csv2json") {
        const rows = parseCSV(text, delim.value);
        const json = rowsToJSON(rows, { minify: false, infer: infer.value === "1" });
        out.textContent = json;
        out.innerHTML = esc(json);
        const n = rows.length - 1;
        meta.textContent = `${n} rows × ${rows[0].length} cols`;
        lastOutput = json;
      } else {
        const data = JSON.parse(text);
        const rows = Array.isArray(data)
          ? data
          : typeof data === "object" ? [data] : null;
        if (!rows) throw new Error("Expected a JSON array or object.");
        if (!rows.length) throw new Error("Empty array.");
        const keys = Array.from(new Set(rows.flatMap((r) => (r && typeof r === "object" ? Object.keys(r) : []))));
        const csv = toCSV([keys, ...rows.map((r) => keys.map((k) => (r ? r[k] : undefined)))]);
        out.textContent = csv;
        out.innerHTML = esc(csv);
        meta.textContent = `${rows.length} objects → CSV`;
        lastOutput = csv;
      }
    } catch (err) {
      out.innerHTML = `<span style="color:#f0b3a4;">⚠ ${esc(err.message)}</span>`;
      meta.textContent = "error";
    }
  };

  root.querySelectorAll("#dir button").forEach(b => b.addEventListener("click", () => {
    dir = b.dataset.dir;
    root.querySelectorAll("#dir button").forEach(x => x.classList.toggle("active", x === b));
    run();
  }));
  [src, delim, infer].forEach(el => el.addEventListener("input", run));

  root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(lastOutput, "Copied output"));
  root.querySelector('[data-act="download"]').addEventListener("click", () => {
    downloadText(lastOutput, dir === "csv2json" ? "data.json" : "data.csv",
      dir === "csv2json" ? "application/json" : "text/csv");
  });

  src.value = "name,age,city\nAda Lovelace,36,London\nGrace Hopper,45,New York\nMargaret Hamilton,54,Paoli";
  run();
}