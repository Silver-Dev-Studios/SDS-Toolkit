import { bindFileDrop } from "../../lib/drop.js";
import { readAsDataURL } from "../../lib/base64.js";
import { copyText, downloadText, fmtBytes } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Text mode</span>
          <div class="seg" id="b64Mode">
            <button data-mode="encode" class="active">Encode</button>
            <button data-mode="decode">Decode</button>
          </div>
        </div>
        <div class="panel-body">
          <label class="field">Input text
            <textarea id="b64Text" spellcheck="false" rows="5" placeholder="Anything you want encoded…"></textarea>
          </label>
        </div>
        <div class="panel-body" style="border-top:var(--hairline)">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop a file to convert to Base64</div>
            <div class="sub">or click to browse. Read on-device only.</div>
          </div>
          <input type="file" id="fileInput" hidden />
        </div>
      </section>
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Result</span>
          <span class="actions">
            <span class="badge" id="b64Meta" hidden></span>
            <button class="btn ghost small" data-act="copy">Copy</button>
            <button class="btn ghost small" data-act="download">Save</button>
          </span>
        </div>
        <div class="panel-body">
          <pre class="code" id="b64Out" style="white-space:pre-wrap;"><span class="dim">Your result lands here…</span></pre>
        </div>
      </section>
    </div>
  `;

  const text = root.querySelector("#b64Text");
  const outEl = root.querySelector("#b64Out");
  const meta = root.querySelector("#b64Meta");
  let output = "";

  const setOutput = (v, m) => {
    output = v;
    outEl.textContent = v || "…";
    outEl.style.color = "";
    meta.textContent = m || "";
    meta.hidden = !m;
    if (!v) outEl.innerHTML = `<span class="dim">Your result lands here…</span>`;
  };

  const encode = (str) => btoa(unescape(encodeURIComponent(str)));
  const decode = (str) => {
    const cleaned = str.trim().replace(/\s+/g, "");
    return decodeURIComponent(escape(atob(cleaned)));
  };

  const toDataURL = (f) => readAsDataURL(f).then((r) => ({
    data: r.split(",")[1],
    meta: `${f.name} · ${fmtBytes(f.size)}`
  }));

  let direction = "encode";

  const run = () => {
    const v = text.value;
    if (!v.trim()) { setOutput("", ""); return; }
    try {
      if (direction === "encode") {
        const enc = encode(v);
        setOutput(enc, `${v.length} chars → ${enc.length} base64 chars`);
      } else {
        setOutput(decode(v), "decoded to text");
      }
    } catch {
      setOutput(direction === "encode" ? "Encoding failed — check the input." : "Not valid Base64 — check for stray characters.", "error");
      outEl.style.color = "#f0b3a4";
    }
  };

  root.querySelectorAll("#b64Mode button").forEach((b) => {
    b.addEventListener("click", () => {
      direction = b.dataset.mode;
      root.querySelectorAll("#b64Mode button").forEach((x) => x.classList.toggle("active", x === b));
      text.placeholder = direction === "encode" ? "Anything you want encoded…" : "Paste Base64 to decode…";
      run();
    });
  });

  text.addEventListener("input", run);

  root.querySelectorAll("[data-act]").forEach(b => {
    b.addEventListener("click", () => {
      if (b.dataset.act === "copy") { if (output) copyText(output, "Copied Base64"); }
      else if (b.dataset.act === "download") { if (output) downloadText(output, "base64.txt", "text/plain;charset=utf-8"); }
    });
  });

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    const { data, meta } = await toDataURL(f);
    setOutput(data, meta + " → data URL");
  } });

  text.value = "SDS Toolkit — everything runs locally in your browser.";
  run();
}