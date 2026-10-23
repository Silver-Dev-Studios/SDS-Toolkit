import { copyText } from "../../lib/util.js";

const SAMPLE = "https://example.com/search?q=draft studio & ref=1";

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Input</span></div>
        <div class="panel-body">
          <textarea id="urlInput" spellcheck="false" rows="5" placeholder="https://example.com/search?q=draft studio &amp; ref=1"></textarea>
          <div class="row mt-12">
            <label class="field">Mode
              <select id="urlMode">
                <option value="encode">Encode</option>
                <option value="encodeComponent">Encode (component — keeps / : ?)</option>
                <option value="decode">Decode</option>
              </select>
            </label>
          </div>
          <div class="actions mt-12">
            <button class="btn ghost" data-act="swap">Swap in/out</button>
            <button class="btn ghost" data-act="clear">Clear</button>
          </div>
        </div>
      </section>
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Output</span>
          <button class="btn ghost small" data-act="copy">Copy</button>
        </div>
        <div class="panel-body">
          <pre class="code" id="urlOut" style="white-space:pre-wrap;"><span class="dim">Encoded or decoded result…</span></pre>
        </div>
      </section>
    </div>
  `;

  const input = root.querySelector("#urlInput");
  const mode = root.querySelector("#urlMode");
  const out = root.querySelector("#urlOut");
  let output = "";

  const run = () => {
    const v = input.value;
    if (!v) { out.textContent = ""; out.innerHTML = `<span class="dim">Nothing yet.</span>`; return; }
    switch (mode.value) {
      case "encode": output = encodeURI(v); break;
      case "encodeComponent": output = encodeURIComponent(v); break;
      case "decode":
        try { output = decodeURI(v); } catch { output = "Input is not valid percent-encoding."; }
        break;
    }
    out.textContent = output;
    out.style.color = "";
  };

  root.querySelectorAll("[data-act]").forEach(b => {
    b.addEventListener("click", () => {
      const act = b.dataset.act;
      if (act === "swap") { input.value = output || out.textContent; run(); }
      else if (act === "clear") { input.value = ""; run(); }
      else copyText(output, "Copied URL result");
    });
  });

  input.addEventListener("input", run);
  mode.addEventListener("change", run);

  input.value = SAMPLE;
  run();
}