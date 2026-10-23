import { bindFileDrop } from "../../lib/drop.js";
import { MIME, canvasToBlob, drawScaled, imageFromFile } from "../../lib/image.js";
import { downloadBlob, fmtBytes } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Source image</span></div>
        <div class="panel-body">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop an image here</div>
            <div class="sub">JPG · PNG · WebP · GIF · BMP · AVIF — click to browse</div>
          </div>
          <input type="file" id="fileInput" accept="image/*" hidden />
          <div id="fileInfo" class="input-hint mt-12"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Export settings</span></div>
        <div class="panel-body">
          <div class="row">
            <label class="field">Format
              <select id="fmt">
                <option value="image/png">PNG (lossless)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
                <option value="image/avif">AVIF</option>
                <option value="image/bmp">BMP</option>
              </select>
            </label>
            <label class="field">Quality
              <input type="range" id="quality" min="10" max="100" value="90" />
            </label>
          </div>
          <div class="row mt-12" style="align-items:end;">
            <label class="field">Width <small class="input-hint">0 = keep</small>
              <input type="number" id="w" value="0" min="0" max="8000" step="1" />
            </label>
            <label class="field">Height <small class="input-hint">0 = keep</small>
              <input type="number" id="h" value="0" min="0" max="8000" step="1" />
            </label>
            <button class="btn" data-act="convert" id="convertBtn" disabled>Convert ▸</button>
          </div>
          <p class="input-hint mt-12" id="sizeHint"></p>
        </div>
      </section>
    </div>

    <div class="panel mt-20" id="resultPanel" hidden>
      <div class="panel-head"><span class="title">Result</span>
        <span class="badge" id="resultMeta"></span>
      </div>
      <div class="panel-body">
        <div class="img-frame light-checker"><img id="resultImg" alt="converted result" /></div>
        <div class="actions mt-12">
          <button class="btn amber" data-act="download" id="downloadBtn">Download converted file</button>
          <button class="btn ghost" data-act="reset">Start over</button>
        </div>
      </div>
    </div>
  `;

  let current = null; // { img, name, width, height }

  const info = root.querySelector("#fileInfo");
  const sizeHint = root.querySelector("#sizeHint");
  const convertBtn = root.querySelector("#convertBtn");

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    try {
      const img = await imageFromFile(f);
      current = { img, name: f.name.replace(/\.[^.]+$/, ""), width: img.naturalWidth, height: img.naturalHeight };
      info.textContent = `${f.name} · ${img.naturalWidth}×${img.naturalHeight} · ${fmtBytes(f.size)}`;
      convertBtn.disabled = false;
      convertBtn.textContent = "Convert ▸";
    } catch {
      info.textContent = "Could not decode that file as an image.";
    }
  } });

  const formatSel = root.querySelector("#fmt");
  const quality = root.querySelector("#quality");
  const w = root.querySelector("#w");
  const h = root.querySelector("#h");

  const doConvert = async () => {
    if (!current) return;
    const nw = +w.value || current.width;
    const nh = +h.value || current.height;
    const canvas = drawScaled(current.img, { width: nw, height: nh });
    const type = formatSel.value;
    const q = +quality.value / 100;
    const blob = await canvasToBlob(canvas, type, q);
    const ext = MIME[type] ? Object.entries(MIME).find(([, v]) => v === type)[0] : "png" ;

    // the tool may have been unmounted while the encode was in flight
    const resultImg = root.querySelector("#resultImg");
    if (!resultImg) return;

    resultImg.src = canvas.toDataURL(type, q);
    root.querySelector("#resultMeta").textContent = `${fmtBytes(blob.size)} · ${nw}×${nh} · ${ext.toUpperCase()}`;
    root.querySelector("#resultPanel").hidden = false;

    const dlBtn = root.querySelector("#downloadBtn");
    const dlName = `${current.name}-converted.${ext}`;
    dlBtn.onclick = () => downloadBlob(blob, dlName);

    sizeHint.textContent = `Source was ${current.width}×${current.height} — output ${nw}×${nh} @ ${Math.round((blob.size * 8 / (nw * nh)) * 10) / 10} bits/pixel.`;
  };

  convertBtn.addEventListener("click", doConvert);
  root.querySelector('[data-act="reset"]').addEventListener("click", () => {
    root.querySelector("#resultPanel").hidden = true;
    convertBtn.disabled = true;
    info.textContent = "";
  });
}