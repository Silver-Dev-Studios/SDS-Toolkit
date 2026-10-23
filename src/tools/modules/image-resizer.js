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
            <div class="big">Drop an image to resize / crop</div>
            <div class="sub">Click to browse</div>
          </div>
          <input type="file" id="fileInput" accept="image/*" hidden />
          <div id="fileInfo" class="input-hint mt-12"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Target</span></div>
        <div class="panel-body">
          <label class="field mb-8">Preset aspect
            <select id="aspect">
              <option value="free">Free (keep source)</option>
              <option value="custom">Custom ratio</option>
              <option value="1:1">1:1 square</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="3:2">3:2</option>
              <option value="9:16">9:16 portrait</option>
              <option value="2:3">2:3 portrait</option>
            </select>
          </label>
          <div class="row">
            <label class="field">Width px
              <input type="number" id="w" value="800" min="8" max="8000" step="8" />
            </label>
            <label class="field">Height px
              <input type="number" id="h" value="600" min="8" max="8000" step="8" />
            </label>
          </div>
          <label class="field mt-12 mb-8">Fit
            <select id="fit">
              <option value="contain">Contain inside (letterbox)</option>
              <option value="cover">Cover — crop overflow</option>
              <option value="fill">Stretch to fill (distort)</option>
            </select>
          </label>
          <div class="actions mt-12">
            <button class="btn" data-act="resize" id="resizeBtn" disabled>Apply ▸</button>
          </div>
          <p class="input-hint mt-12" id="sizeHint"></p>
        </div>
      </section>
    </div>

    <div class="panel mt-20" id="resultPanel" hidden>
      <div class="panel-head"><span class="title">Preview</span>
        <span class="badge" id="resultMeta"></span>
      </div>
      <div class="panel-body">
        <div class="img-frame light-checker"><img id="resultImg" alt="resized output" /></div>
        <div class="actions mt-12">
          <button class="btn amber" data-act="download" id="downloadBtn">Download</button>
          <button class="btn ghost" data-act="reset">Start over</button>
        </div>
      </div>
    </div>
  `;

  let loaded = null;
  const info = root.querySelector("#fileInfo");
  const resizeBtn = root.querySelector("#resizeBtn");
  const sizeHint = root.querySelector("#sizeHint");

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    try {
      const img = await imageFromFile(f);
      loaded = { img, name: f.name.replace(/\.[^.]+$/, ""), size: f.size };
      info.textContent = `${f.name} · ${img.naturalWidth}×${img.naturalHeight} · ${fmtBytes(f.size)}`;
      resizeBtn.disabled = false;
      resizeBtn.textContent = "Apply ▸";
    } catch {
      info.textContent = "Unsupported image.";
    }
  } });

  const aspect = root.querySelector("#aspect");
  const w = root.querySelector("#w");
  const h = root.querySelector("#h");
  const fit = root.querySelector("#fit");

  aspect.addEventListener("change", () => {
    const v = aspect.value;
    if (v === "custom" || v === "free") return;
    const [a, b] = v.split(":").map(Number);
    if (w.value) h.value = Math.round((+w.value * b) / a);
  });

  const apply = () => {
    if (!loaded) return;
    let nw = +w.value, nh = +h.value;
    const kind = aspect.value;
    if (kind === "free") {
      nw = loaded.img.naturalWidth;
      nh = loaded.img.naturalHeight;
    } else if (kind !== "custom") {
      const [a, b] = kind.split(":").map(Number);
      nh = Math.round((nw * b) / a);
    }
    const f = fit.value;
    let canvas;
    if (f === "cover" || f === "contain") {
      canvas = drawScaled(loaded.img, { width: nw, height: nh, fit: f, background: "#ffffff" });
    } else {
      canvas = drawScaled(loaded.img, { width: nw, height: nh });
    }
    const blobPromise = canvasToBlob(canvas, "image/png");
    blobPromise.then((blob) => {
      root.querySelector("#resultImg").src = canvas.toDataURL("image/png");
      root.querySelector("#resultMeta").textContent = `${nw}×${nh} · ${fmtBytes(blob.size)}`;
      root.querySelector("#resultPanel").hidden = false;
      root.querySelector("#downloadBtn").onclick = () =>
        downloadBlob(blob, `${loaded.name}-${nw}x${nh}.png`);
      const scale = (nw / loaded.img.naturalWidth) * 100;
      sizeHint.textContent = `Scale ${Math.round(scale)}% of original · ${loaded.img.naturalWidth}×${loaded.img.naturalHeight} → ${nw}×${nh}`;
    });
  };

  resizeBtn.addEventListener("click", apply);
  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    root.querySelector("#resultPanel").hidden = true;
    loaded = null;
    resizeBtn.disabled = true;
    info.textContent = "";
  });
}