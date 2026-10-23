import { copyText, downloadText, fmtNum, uid } from "../../lib/util.js";

function uuidv4(uppercase) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  const u = `${hex.slice(0,4).join("")}-${hex.slice(4,6).join("")}-${hex.slice(6,8).join("")}-${hex.slice(8,10).join("")}-${hex.slice(10).join("")}`;
  return uppercase ? u.toUpperCase() : u;
}

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Generator settings</span></div>
        <div class="panel-body">
          <div class="row">
            <label class="field">Count
              <input type="number" id="uuidCount" value="5" min="1" max="1000" step="1" />
            </label>
            <label class="field">Format
              <select id="uuidMode">
                <option value="uuid4">UUID v4</option>
                <option value="hex">Compact hex token</option>
                <option value="uppercase">v4 UUID (upper case)</option>
                <option value="braced">{braced} UUID</option>
              </select>
            </label>
          </div>
          <dl class="kv-list mt-12">
            <dt>Version</dt><dd>4 (randomised)</dd>
            <dt>Entropy</dt><dd>122 random bits</dd>
          </dl>
          <div class="actions mt-12">
            <button class="btn" data-act="generate">Generate</button>
            <button class="btn ghost" data-act="download">Download .txt</button>
          </div>
          <p class="input-hint mt-12">Nothing leaves the tab.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Output</span>
          <span class="badge" id="uuidMeta"></span>
          <button class="btn ghost small" data-act="copy">Copy all</button>
        </div>
        <div class="panel-body">
          <pre class="code" id="uuidOut" style="white-space:pre-wrap; max-height:60vh;">—</pre>
        </div>
      </section>
    </div>
  `;

  const count = root.querySelector("#uuidCount");
  const mode = root.querySelector("#uuidMode");
  const out = root.querySelector("#uuidOut");
  const meta = root.querySelector("#uuidMeta");
  let generated = [];
  let joined = "";

  const generate = () => {
    const n = Math.min(1000, Math.max(1, +count.value || 1));
    generated = Array.from({ length: n }, () => {
      switch (mode.value) {
        case "hex": return uid(32);
        case "uppercase": return uuidv4(true);
        case "braced": return `{${uuidv4()}}`;
        default: return uuidv4();
      }
    });
    joined = generated.join("\n");
    out.textContent = joined;
    meta.textContent = `${fmtNum(n)} ${n > 1 ? "ids" : "id"} · crypto-safe`;
  };

  root.querySelectorAll("[data-act]").forEach(b => {
    b.addEventListener("click", () => {
      const act = b.dataset.act;
      if (act === "generate") generate();
      else if (act === "download") { if (!joined) generate(); downloadText(joined, "uuids.txt"); }
      else if (joined) copyText(joined, "Copied IDs");
    });
  });

  count.addEventListener("change", generate);
  mode.addEventListener("change", generate);

  generate();
}