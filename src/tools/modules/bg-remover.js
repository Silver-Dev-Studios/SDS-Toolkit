import { bindFileDrop } from "../../lib/drop.js";
import { canvasToBlob, imageFromFile, isSkinLike } from "../../lib/image.js";
import { downloadBlob, fmtBytes, toast } from "../../lib/util.js";

/**
 * Flood-fill transparency from the corners into an RGBA buffer.
 * `tolerance` 1-100 scales the colour-distance threshold.
 */
function floodFillRemove(data, w, h, tolerance, useSkinGuard) {
  const out = new Uint8ClampedArray(data);
  const marks = new Uint8Array(w * h);
  const TR = tolerance * 3.2;

  const looksBg = (idx) => {
    if (out[idx + 3] === 0) return true;
    const r = out[idx], g = out[idx + 1], b = out[idx + 2];
    if (useSkinGuard && isSkinLike(r, g, b)) return false;
    return r * r + g * g + b * b < TR * TR;
  };

  const queue = [];
  for (const c of [0, w - 1, (h - 1) * w, h * w - 1]) {
    if (looksBg(c * 4)) queue.push(c);
  }

  while (queue.length) {
    const idx = queue.pop();
    if (marks[idx]) continue;
    marks[idx] = 1;
    const x = idx % w;
    if (x > 0 && !marks[idx - 1] && looksBg((idx - 1) * 4)) queue.push(idx - 1);
    if (x < w - 1 && !marks[idx + 1] && looksBg((idx + 1) * 4)) queue.push(idx + 1);
    if (idx >= w && !marks[idx - w] && looksBg((idx - w) * 4)) queue.push(idx - w);
    if (idx < (h - 1) * w && !marks[idx + w] && looksBg((idx + w) * 4)) queue.push(idx + w);
  }

  for (let i = 0; i < w * h; i++) {
    if (marks[i]) out[i * 4 + 3] = 0;
  }
  return { out, marks };
}

/** Uniform box blur on a single channel buffer. */
function boxBlur(src, w, h, radius) {
  const dst = new Float32Array(src.length);
  const r = radius || 1;
  const size = (r * 2 + 1) ** 2;
  const buf = new Float32Array(w * h);

  // horizontal
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      buf[y * w + x] = sum / size;
      const add = src[y * w + Math.min(w - 1, x + r + 1)];
      const rem = src[y * w + Math.max(0, x - r)];
      sum += add - rem;
    }
  }
  // vertical
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += buf[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / size;
      const add = buf[Math.min(h - 1, y + r + 1) * w + x];
      const rem = buf[Math.max(0, y - r) * w + x];
      sum += add - rem;
    }
  }
  return dst;
}

/** Soften hard cut-out edges by feathering alpha near the boundary. */
function featherAlpha(canvas, px) {
  if (!px) return;
  const ctx = canvas.getContext("2d");
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * 4 + 3] / 255;
  const blurred = boxBlur(alpha, width, height, px * 2 + 1);
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] === 0) data[i * 4 + 3] = Math.round(blurred[i] * 255);
  }
  ctx.putImageData(new ImageData(data, width, height), 0, 0);
}

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Source</span></div>
        <div class="panel-body">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop a photo with a plain background</div>
            <div class="sub">Works best on portraits / product shots against clean backdrops</div>
          </div>
          <input type="file" id="fileInput" accept="image/*" hidden />
          <div id="fileInfo" class="input-hint mt-12"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Tuning</span></div>
        <div class="panel-body">
          <div class="slider-row">
            <div class="top"><span>Background tolerance</span><b id="tolVal">28</b></div>
            <input type="range" id="tol" min="1" max="100" value="28" />
          </div>
          <div class="slider-row">
            <div class="top"><span>Edge feather</span><b id="featherVal">1px</b></div>
            <input type="range" id="feather" min="0" max="6" value="1" />
          </div>
          <label class="checkbox-inline mt-8" style="display:inline-flex;align-items:center;gap:6px;font-size:11px;">
            <input type="checkbox" id="skinGuard" checked /> Protect skin tones
          </label>
          <div class="actions mt-12">
            <button class="btn" data-act="remove" id="removeBtn" disabled>Remove background ▸</button>
          </div>
          <p class="input-hint mt-12">Uses flood-fill from the corners. For busy photos, try tolerating, then retouch with the brush.</p>
        </div>
      </section>
    </div>

    <div class="panel mt-20" id="resultPanel" hidden>
      <div class="panel-head"><span class="title">Cutout</span>
        <span class="actions">
          <span class="badge" id="resultMeta"></span>
          <button class="btn amber" data-act="downloadPNG">Download PNG</button>
        </span>
      </div>
      <div class="panel-body">
        <div class="tool-split">
          <figure style="margin:0;">
            <div class="img-frame"><img id="cutPreview" alt="cutout preview" /></div>
            <figcaption class="dim mono-label mt-8">Removed background preview</figcaption>
          </figure>
          <div>
            <div class="mono-label mb-8">Manual retouch brush</div>
            <div class="actions">
              <button class="btn ghost small" data-brush="remove">Erase brush</button>
              <button class="btn ghost small" data-brush="restore">Restore brush</button>
              <span class="input-hint">drag on canvas</span>
            </div>
            <div class="img-frame light-checker mt-8" id="brushFrame" style="position:relative;">
              <canvas id="brushCanvas" style="max-width:100%;"></canvas>
            </div>
            <div class="actions mt-12">
              <button class="btn ghost" data-act="undo">Undo brush</button>
              <button class="btn ghost" data-act="recompute">Re-run automatic removal</button>
            </div>
          </div>
        </div>
        <div class="actions right mt-12">
          <button class="btn ghost" data-act="reset">Start over</button>
        </div>
      </div>
    </div>
  `;

  const info = root.querySelector("#fileInfo");
  const removeBtn = root.querySelector("#removeBtn");
  let source = null; // { img, name }
  let workCanvas = null; // current transparency canvas
  let undoStack = [];

  const tol = root.querySelector("#tol");
  const tolVal = root.querySelector("#tolVal");
  tol.addEventListener("input", () => (tolVal.textContent = tol.value));

  const feather = root.querySelector("#feather");
  const featherVal = root.querySelector("#featherVal");
  feather.addEventListener("input", () => (featherVal.textContent = (+feather.value ? feather.value + "px" : "none")));

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    try {
      const img = await imageFromFile(f);
      source = { img, name: f.name.replace(/\.[^.]+$/, "") };
      info.textContent = `${f.name} · ${img.naturalWidth}×${img.naturalHeight} · ${fmtBytes(f.size)}`;
      removeBtn.disabled = false;
      removeBtn.textContent = "Remove background ▸";
      root.querySelector("#resultPanel").hidden = true;
    } catch {
      info.textContent = "Unreadable image.";
    }
  } });

  // Canvas size upsizing would slow flood fill; cap to 1600px longest side
  const prepCanvas = (img) => {
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  };

  const autoRemove = () => {
    if (!source) return;
    const c = prepCanvas(source.img);
    const ctx = c.getContext("2d");
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    const { out } = floodFillRemove(data, width, height, +tol.value, root.querySelector("#skinGuard").checked);
    ctx.putImageData(new ImageData(out, width, height), 0, 0);
    featherAlpha(c, +feather.value);
    workCanvas = c;
    undoStack = [];
    present();
  };

  const present = () => {
    root.querySelector("#resultPanel").hidden = false;
    const url = workCanvas.toDataURL("image/png");
    root.querySelector("#cutPreview").src = url;
    root.querySelector("#brushCanvas").width = workCanvas.width;
    root.querySelector("#brushCanvas").height = workCanvas.height;
    const bctx = root.querySelector("#brushCanvas").getContext("2d");
    bctx.clearRect(0, 0, workCanvas.width, workCanvas.height);
    bctx.drawImage(workCanvas, 0, 0);
    root.querySelector("#resultMeta").textContent = `${workCanvas.width}×${workCanvas.height} · transparent PNG`;
  };

  // brush — paints the work canvas directly, then re-presents
  let brushMode = "remove";
  root.querySelectorAll("[data-brush]").forEach(b => b.addEventListener("click", () => {
    brushMode = b.dataset.brush;
    root.querySelectorAll("[data-brush]").forEach(x => x.classList.remove("amber"));
    b.classList.add("amber");
  }));

  const brushCanvas = root.querySelector("#brushCanvas");
  brushCanvas.addEventListener("pointerdown", (e) => {
    undoStack.push(workCanvas.toDataURL());
    if (undoStack.length > 12) undoStack.shift();
    brushCanvas.setPointerCapture(e.pointerId);
    paint(e);
  });
  brushCanvas.addEventListener("pointermove", (e) => {
    if (e.buttons & 1) paint(e);
  });
  const paint = (e) => {
    const rect = brushCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (workCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (workCanvas.height / rect.height);
    const ctx = workCanvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = brushMode === "remove" ? "destination-out" : "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(6, workCanvas.width / 80), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    present();
  };

  root.querySelector('[data-act="undo"]').addEventListener("click", () => {
    const prev = undoStack.pop();
    if (!prev) { toast("Nothing to undo"); return; }
    const img = new Image();
    img.onload = () => {
      workCanvas.getContext("2d").clearRect(0, 0, workCanvas.width, workCanvas.height);
      workCanvas.getContext("2d").drawImage(img, 0, 0);
      present();
    };
    img.src = prev;
  });
  root.querySelector('[data-act="recompute"]').addEventListener("click", autoRemove);
  root.querySelector('[data-act="downloadPNG"]').addEventListener("click", () => {
    downloadBlob(blobFromCanvas(), `${source.name}-nobg.png`);
  });
  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    root.querySelector("#resultPanel").hidden = true;
    source = null;
    removeBtn.disabled = true;
    info.textContent = "";
  });

  const blobFromCanvas = () => canvasToBlob(workCanvas, "image/png", 1);

  removeBtn.addEventListener("click", autoRemove);
}