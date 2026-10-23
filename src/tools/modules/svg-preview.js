import { bindFileDrop } from "../../lib/drop.js";
import { readAsText } from "../../lib/base64.js";
import { copyText, debounce, downloadText, esc, fmtNum } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Source SVG</span></div>
        <div class="panel-body">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop an .svg file here</div>
            <div class="sub">or click to browse</div>
          </div>
          <input type="file" id="fileInput" accept=".svg,image/svg+xml" hidden />
          <label class="field mt-12">…or paste SVG markup
            <textarea id="svgSource" spellcheck="false" rows="6" placeholder="<svg …>…</svg>"></textarea>
          </label>
          <div class="actions mt-12">
            <button class="btn" data-act="render">Render ▸</button>
            <button class="btn ghost" data-act="sample">Load sample</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Preview</span>
          <span class="badge" id="svgMeta"></span>
        </div>
        <div class="panel-body">
          <div class="img-frame light-checker" id="svgFrame" style="min-height:220px;">
            <div id="svgPreview" style="max-width:100%;"></div>
          </div>
          <div class="actions mt-12">
            <button class="btn amber" data-act="download">Download .svg</button>
            <button class="btn ghost" data-act="copyCode">Copy markup</button>
          </div>
        </div>
      </section>
    </div>
  `;

  const source = root.querySelector("#svgSource");
  const pre = root.querySelector("#svgPreview");
  const meta = root.querySelector("#svgMeta");
  let current = "";

  const warn = (msg) => {
    pre.innerHTML = `<span style="color:var(--bad);font-family:var(--mono);font-size:12px;">⚠ ${esc(msg)}</span>`;
  };

  let objUrl = null;

  const render = () => {
    const markup = source.value.trim();
    if (!markup) { pre.innerHTML = `<span class="dim" style="font-family:var(--mono);font-size:12px;">Nothing to render.</span>`; meta.textContent = ""; return; }

    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.documentElement;
    if (doc.querySelector("parsererror") || svg.nodeName.toLowerCase() !== "svg") {
      warn("That does not parse as an SVG document.");
      return;
    }
    if (doc.querySelector("script, foreignObject")) {
      warn("SVG contains script or foreignObject — not rendered.");
      return;
    }

    // draw through an <img> so nothing in the file can execute in this page
    const blob = new Blob([markup], { type: "image/svg+xml" });
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.alt = "SVG preview";
    img.style.maxWidth = "100%";
    img.onload = () => {
      const vb = svg.getAttribute("viewBox");
      const parts = vb ? vb.split(/[\s,]+/) : null;
      const box = parts && parts.length === 4 ? `viewBox ${parts[2]}×${parts[3]}` : "no viewBox";
      meta.textContent = `${img.naturalWidth}×${img.naturalHeight} · ${box}`;
    };
    img.onerror = () => warn("Browser could not rasterise this SVG.");
    img.src = objUrl;

    pre.innerHTML = "";
    pre.appendChild(img);
    current = markup;
  };

  const live = debounce(render, 250);
  source.addEventListener("input", live);
  root.querySelector('[data-act="render"]').addEventListener("click", render);
  const loadSample = () => {
    source.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="240" height="160">
  <rect width="120" height="80" fill="#f7f4ea"/>
  <circle cx="38" cy="40" r="22" fill="#3a5d8c"/>
  <rect x="62" y="20" width="40" height="40" rx="6" fill="#c77a2e"/>
</svg>`;
    render();
  };
  root.querySelector('[data-act="sample"]').addEventListener("click", loadSample);

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    source.value = await readAsText(f);
    render();
    const dims = meta.textContent;
    meta.textContent = `${f.name} · ${fmtNum(f.size)} B${dims ? " · " + dims : ""}`;
  } });

  root.querySelector('[data-act="download"]').addEventListener("click", () => {
    current && downloadText(current, "preview.svg", "image/svg+xml");
  });
  root.querySelector('[data-act="copyCode"]').addEventListener("click", () => {
    current && copyText(current, "Copied SVG markup");
  });

  loadSample();
}