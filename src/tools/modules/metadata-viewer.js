import * as exifr from "exifr";
import { bindFileDrop } from "../../lib/drop.js";
import { imageFromFile } from "../../lib/image.js";
import { copyText, esc, fmtBytes, fmtNum } from "../../lib/util.js";

function humanize(key, val) {
  if (typeof val === "number" && val > 1000000 && !key.toLowerCase().includes("offset")) {
    return fmtNum(val);
  }
  return val;
}

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Source photo</span></div>
        <div class="panel-body">
          <div class="dl-drop" id="fileDrop">
            <div class="big">Drop a photo to inspect</div>
            <div class="sub">JPG · PNG · WebP · TIFF · AVIF — reading is 100% local</div>
          </div>
          <input type="file" id="fileInput" accept="image/*" hidden />
          <div id="fileInfo" class="input-hint mt-12"></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">File properties</span></div>
        <div class="panel-body">
          <dl class="kv-list" id="fileProps">
            <dt>Status</dt><dd class="dim">Awaiting a photo.</dd>
            <dt>Will report</dt><dd class="dim">Type · size · dimensions</dd>
            <dt>Also checks</dt><dd class="dim">Camera, lens, exposure, GPS</dd>
          </dl>
        </div>
      </section>
    </div>

    <div class="panel mt-20" id="exifPanel" hidden>
      <div class="panel-head"><span class="title">Embedded metadata (EXIF / IPTC / XMP)</span>
        <span class="actions">
          <span class="badge">on-device</span>
          <button class="btn ghost small" data-act="copyExif">Copy as JSON</button>
        </span>
      </div>
      <div class="panel-body">
        <dl class="kv-list" id="exifList"></dl>
      </div>
    </div>
  `;

  const info = root.querySelector("#fileInfo");
  const props = root.querySelector("#fileProps");
  const exifList = root.querySelector("#exifList");
  const exifPanel = root.querySelector("#exifPanel");
  let lastReport = {};

  bindFileDrop(root, { inputSel: "#fileInput", dropSel: "#fileDrop", onFile: async (f) => {
    try {
      info.textContent = `${f.name} · ${fmtBytes(f.size)}`;
      props.innerHTML = `
        <dt>Filename</dt><dd>${esc(f.name)}</dd>
        <dt>Type</dt><dd>${esc(f.type || "unknown")}</dd>
        <dt>Size</dt><dd>${fmtBytes(f.size)} (${fmtNum(f.size)} B)</dd>
        <dt>Last modified</dt><dd>${new Date(f.lastModified).toLocaleString()}</dd>`;

      const img = await imageFromFile(f);
      props.innerHTML += `<dt>Dimensions</dt><dd>${img.naturalWidth}×${img.naturalHeight}</dd>
        <dt>Megapixels</dt><dd>${((img.naturalWidth * img.naturalHeight) / 1e6).toFixed(2)} MP</dd>`;

      // exifr throws on formats it can't read; that is a finding, not a failure
      let exif = null;
      try {
        exif = await exifr.parse(f, { merge: true, translate: true, reviveValues: true });
      } catch {
        exif = null;
      }

      exifPanel.hidden = false;
      const skip = /^(PixelXDimension|PixelYDimension|ImageWidth|ImageHeight|ExifImageWidth|ExifImageHeight|GPSLatitude|GPSLongitude)$/;
      const entries = exif ? Object.entries(exif).filter(([k]) => !skip.test(k)) : [];

      if (!entries.length) {
        lastReport = {};
        exifPanel.querySelector(".badge").textContent = "none found";
        exifList.innerHTML = `<dt>Result</dt><dd class="dim">No EXIF, IPTC or XMP block in this file — it was stripped, or the format carries none.</dd>`;
        return;
      }

      lastReport = Object.fromEntries(entries);
      exifPanel.querySelector(".badge").textContent = `${entries.length} fields`;
      exifList.innerHTML = entries.map(([k, v]) =>
        `<dt>${esc(k)}</dt><dd>${esc(humanize(k, v))}</dd>`
      ).join("");
    } catch (err) {
      console.error(err);
      props.innerHTML = `<dt>Status</dt><dd style="color:var(--bad)">Could not read this file.</dd>`;
    }
  } });

  root.querySelector('[data-act="copyExif"]').addEventListener("click", () => {
    copyText(JSON.stringify(lastReport, null, 2), "Copied metadata as JSON");
  });
}