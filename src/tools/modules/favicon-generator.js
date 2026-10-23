import { copyText, downloadBlob, toast } from "../../lib/util.js";

const GRID = 16;
const CELL = 13;

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Pixel editor · ${GRID}×${GRID}</span>
          <span class="actions">
            <button class="btn ghost small" data-act="letter">Letter</button>
            <button class="btn ghost small" data-act="clear">Clear</button>
          </span>
        </div>
        <div class="panel-body">
          <div class="pix-layout">
            <div class="pixgrid" id="pixgrid" style="grid-template-columns: repeat(${GRID}, ${CELL}px);"></div>
            <div class="pix-tools">
              <label class="mono-label" for="penColor">Ink</label>
              <input type="color" id="penColor" value="#e3a857" />
              <div class="pix-tool-stack">
                <button class="btn ghost small selected" data-tool="draw">Draw</button>
                <button class="btn ghost small" data-tool="erase">Erase</button>
                <button class="btn ghost small" data-tool="sym">Mirror</button>
              </div>
              <p class="input-hint">Mirror paints both sides.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Export</span>
          <span class="actions">
            <button class="btn amber" data-act="dlIco">Download .ico</button>
            <button class="btn ghost small" data-act="copyPNG">Copy PNG</button>
          </span>
        </div>
        <div class="panel-body">
          <div class="mono-label mb-8">Sizes (with rounding)</div>
          <div class="ico-pre" id="sizes"></div>
          <div class="mt-12">
            <div class="mono-label mb-8">Embed snippet</div>
            <pre class="code" id="icoHTML" style="max-height:150px;"></pre>
            <button class="btn ghost small mt-8" data-act="copyTag">Copy tag</button>
          </div>
        </div>
      </section>
    </div>
  `;

  const grid = root.querySelector("#pixgrid");
  const penColor = root.querySelector("#penColor");
  let tool = "draw";
  let cells = new Array(GRID * GRID).fill(null);

  const paint = (i) => {
    if (tool === "erase") cells[i] = null;
    else if (tool === "sym") {
      const x = i % GRID, y = Math.floor(i / GRID);
      cells[y * GRID + x] = penColor.value;
      cells[y * GRID + (GRID - 1 - x)] = penColor.value;
    } else cells[i] = penColor.value;
    renderGrid();
    renderSizes();
  };

  const renderGrid = () => {
    grid.innerHTML = cells.map((c, i) =>
      `<div class="pix" data-i="${i}" style="background:${c || "transparent"}; box-shadow:${c ? "inset 0 0 0 1px rgba(0,0,0,.25)" : "inset 0 0 0 1px rgba(0,0,0,.08)"};"></div>`
    ).join("");
  };

  grid.addEventListener("pointerdown", (e) => {
    const px = e.target.closest(".pix");
    if (!px) return;
    grid.setPointerCapture(e.pointerId);
    paint(+px.dataset.i);
    let painting = true;
    grid.onpointermove = (ev) => {
      if (!painting) return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".pix");
      if (el) paint(+el.dataset.i);
    };
    grid.onpointerup = () => { painting = false; grid.onpointermove = null; grid.onpointerup = null; };
  });

  root.querySelectorAll("[data-tool]").forEach(b => b.addEventListener("click", () => {
    tool = b.dataset.tool;
    root.querySelectorAll("[data-tool]").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
  }));

  root.querySelector('[data-act="clear"]').addEventListener("click", () => {
    cells = new Array(GRID * GRID).fill(null);
    renderGrid();
    renderSizes();
  });

  const drawLetter = () => {
    cells = drawGlyph("S", penColor.value);
    renderGrid();
    renderSizes();
  };

  const drawGlyph = (ch, color) => {
    const SS = 6;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = GRID * SS;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(GRID * SS * 0.8)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText(ch, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const on = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        let alpha = 0;
        for (let y = 0; y < SS; y++) {
          for (let x = 0; x < SS; x++) {
            alpha += data[((gy * SS + y) * canvas.width + (gx * SS + x)) * 4 + 3];
          }
        }
        on.push(alpha / (SS * SS * 255) > 0.34);
      }
    }

    const at = (mask, x, y) => x >= 0 && x < GRID && y >= 0 && y < GRID && mask[y * GRID + x];

    // the 16x16 downsample punches pin-holes into thin strokes; bridge a cell
    // only when it has an on-cell on both sides, then drop isolated specks
    const bridged = on.map((v, i) => {
      if (v) return true;
      const x = i % GRID, y = Math.floor(i / GRID);
      return (at(on, x - 1, y) && at(on, x + 1, y)) ||
        (at(on, x, y - 1) && at(on, x, y + 1)) ||
        (at(on, x - 1, y - 1) && at(on, x + 1, y + 1)) ||
        (at(on, x + 1, y - 1) && at(on, x - 1, y + 1));
    });

    const solid = bridged.map((v, i) => {
      if (!v) return false;
      const x = i % GRID, y = Math.floor(i / GRID);
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (at(bridged, x + dx, y + dy)) n++;
        }
      }
      return n >= 2;
    });

    const xs = [], ys = [];
    solid.forEach((v, i) => { if (v) { xs.push(i % GRID); ys.push(Math.floor(i / GRID)); } });
    if (!xs.length) return new Array(GRID * GRID).fill(null);

    const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
    const cy = Math.round((Math.min(...ys) + Math.max(...ys)) / 2);
    const dx = Math.round(GRID / 2) - 1 - cx;
    const dy = Math.round(GRID / 2) - 1 - cy;

    const out = new Array(GRID * GRID).fill(null);
    solid.forEach((v, i) => {
      if (!v) return;
      const x = (i % GRID) + dx, y = Math.floor(i / GRID) + dy;
      if (x >= 0 && x < GRID && y >= 0 && y < GRID) out[y * GRID + x] = color;
    });
    return out;
  };

  root.querySelector('[data-act="letter"]').addEventListener("click", drawLetter);

  const makePNG = (size = 64) => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const px = size / GRID;
    cells.forEach((col, i) => {
      if (!col) return;
      const x = (i % GRID) * px, y = Math.floor(i / GRID) * px;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, px, px);
    });
    return c;
  };

  const canvasToBlobP = (c, type, q) => new Promise((res) => c.toBlob((b) => res(b), type, q));

  const sizesEl = root.querySelector("#sizes");
  const renderSizes = () => {
    const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
    sizesEl.innerHTML = sizes.map((s) => {
      const url = makePNG(s).toDataURL("image/png");
      return `<div class="ico-cell"><img src="${url}" alt="${s}px" /><span>${s}</span></div>`;
    }).join("");
    const og = makePNG(64).toDataURL("image/png");
    const tag = `<link rel="icon" href="${og}" sizes="any">`;
    root.querySelector("#icoHTML").textContent = tag;
    root.querySelector("#icoHTML").dataset.tag = tag;
  };

  const downloadICO = async () => {
    const src = makePNG(32);
    const pngBlob = await canvasToBlobP(src, "image/png");
    const buf = await pngBlob.arrayBuffer();
    // ICO container with a single 32x32 PNG-compressed entry
    const width = 32, height = 32;
    const header = new DataView(new ArrayBuffer(22));
    header.setUint16(0, 0, true);   // reserved
    header.setUint16(2, 1, true);   // type icon
    header.setUint16(4, 1, true);   // image count
    header.setUint8(6, width === 256 ? 0 : width);
    header.setUint8(7, height === 256 ? 0 : height);
    header.setUint8(8, 0);          // palette
    header.setUint8(9, 0);          // reserved
    header.setUint16(10, 1, true);  // planes
    header.setUint16(12, 32, true); // bpp
    header.setUint32(14, buf.byteLength, true);
    header.setUint32(18, 22, true); // offset
    const ico = new Blob([header, pngBlob], { type: "image/x-icon" });
    downloadBlob(ico, "favicon.ico");
    toast("Downloaded favicon.ico");
  };

  root.querySelector('[data-act="dlIco"]').addEventListener("click", downloadICO);
  root.querySelector('[data-act="copyTag"]').addEventListener("click", () => {
    copyText(root.querySelector("#icoHTML").dataset.tag || "", "Copied icon tag");
  });

  root.querySelector('[data-act="copyPNG"]').addEventListener("click", async () => {
    const c = makePNG(64);
    const blob = await canvasToBlobP(c, "image/png");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast("PNG copied to clipboard");
  });

  renderGrid();
  renderSizes();
  drawLetter();
}