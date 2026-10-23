import { bindFileDrop } from "../../lib/drop.js";
import { canvasToBlob, drawScaled, imageFromFile } from "../../lib/image.js";
import { downloadBlob, fmtBytes } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Source image</span></div>
        <div class="panel-body">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop an image to compress</div>
            <div class="sub">JPG · PNG · WebP — click to browse</div>
          </div>
          <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" hidden />
          <div id="fileInfo" class="input-hint mt-12"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Compression settings</span></div>
        <div class="panel-body">
          <div class="slider-row">
            <div class="top"><span>Quality</span><b id="qVal">82%</b></div>
            <input type="range" id="quality" min="20" max="95" value="82" step="1" />
          </div>
          <div class="row">
            <label class="field">Max width
              <input type="number" id="maxW" value="1920" min="16" max="8000" step="16" />
            </label>
            <label class="field">Max height
              <input type="number" id="maxH" value="1080" min="16" max="8000" step="16" />
            </label>
          </div>
          <p class="input-hint">Larger images are scaled down to stay within these bounds (aspect preserved).</p>
          <div class="actions mt-12">
            <button class="btn" data-act="compress" id="compressBtn" disabled>Compress ▸</button>
            <span class="badge">Metadata stripped</span>
          </div>
        </div>
      </section>
    </div>

    <div class="panel mt-20" id="resultPanel" hidden>
      <div class="panel-head"><span class="title">Before / After</span>
        <span class="actions">
          <span class="badge" id="saveBadge"></span>
          <button class="btn amber" data-act="download" id="downloadBtn">Download</button>
        </span>
      </div>
      <div class="panel-body">
        <div class="tool-split">
          <figure style="margin:0;">
            <div class="img-frame light-checker"><img id="beforeImg" alt="before" /></div>
            <figcaption class="dim mono-label mt-8" id="beforeMeta"></figcaption>
          </figure>
          <figure style="margin:0;">
            <div class="img-frame light-checker"><img id="afterImg" alt="after" /></div>
            <figcaption class="dim mono-label mt-8" id="afterMeta"></figcaption>
          </figure>
        </div>
        <div class="actions right mt-12">
          <button class="btn ghost" data-act="reset">Compress another</button>
          <button class="btn ghost" data-act="compressMore">Re-compress with new settings</button>
        </div>
      </div>
    </div>
  `;

  const info = root.querySelector("#fileInfo");
  const compressBtn = root.querySelector("#compressBtn");
  let loaded = null; // { img, name, size }

  const qSlider = root.querySelector("#quality");
  const qVal = root.querySelector("#qVal");
  qSlider.addEventListener("input", () => (qVal.textContent = qSlider.value + "%"));

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    try {
      const img = await imageFromFile(f);
      loaded = { img, name: f.name.replace(/\.[^.]+$/, ""), size: f.size };
      info.textContent = `${f.name} · ${img.naturalWidth}×${img.naturalHeight} · ${fmtBytes(f.size)}`;
      root.querySelector("#beforeImg").src = img.src;
      root.querySelector("#beforeMeta").textContent = `${img.naturalWidth}×${img.naturalHeight} · ${fmtBytes(f.size)}`;
      compressBtn.disabled = false;
      compressBtn.textContent = "Compress ▸";
    } catch {
      info.textContent = "Unsupported or unreadable file.";
    }
  } });

  const maxW = root.querySelector("#maxW");
  const maxH = root.querySelector("#maxH");
  
  const compress = async () => {
    if (!loaded) return;
    const nw = Math.min(loaded.img.naturalWidth, +maxW.value || loaded.img.naturalWidth);
    const nh = Math.min(loaded.img.naturalHeight, +maxH.value || loaded.img.naturalHeight);
    const type = loaded.img.src.startsWith("data:image/png") ? "image/webp" : "image/jpeg";
    const canvas = drawScaled(loaded.img, { width: nw, height: nh });
    const q = +qSlider.value / 100;
    const blob = await canvasToBlob(canvas, type, q);
    const url = URL.createObjectURL(blob);

    const afterImg = root.querySelector("#afterImg");
    if (!afterImg) { URL.revokeObjectURL(url); return; }
    afterImg.src = url;
    root.querySelector("#afterMeta").textContent = `${nw}×${nh} · ${fmtBytes(blob.size)}`;

    const saved = loaded.size - blob.size;
    const pct = loaded.size ? Math.round((saved / loaded.size) * 100) : 0;
    root.querySelector("#saveBadge").textContent =
      `${saved > 0 ? "−" : "+"}${fmtBytes(Math.abs(saved))} · ${saved > 0 ? pct : -pct}%`;
    root.querySelector("#resultPanel").hidden = false;

    const name = `${loaded.name}-compressed.${type === "image/webp" ? "webp" : "jpg"}`;
    root.querySelector("#downloadBtn").onclick = () => downloadBlob(blob, name);
  };

  compressBtn.addEventListener("click", compress);
  root.querySelector('[data-act="compressMore"]').addEventListener("click", compress);
  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    root.querySelector("#resultPanel").hidden = true;
    loaded = null;
    compressBtn.disabled = true;
    info.textContent = "";
    root.querySelector("#afterImg").removeAttribute("src");
  });
}