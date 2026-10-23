import { copyText } from "../../lib/util.js";

const PREVIEW = {
  dark: { bg: "#2a2d31", stage: "#23262a" },
  light: { bg: "#f4f0e6", stage: "#fbf8f0" }
};

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel">
        <div class="panel-head"><span class="title">Layers</span>
          <span class="actions">
            <button class="btn ghost small" data-act="add">+ Add layer</button>
          </span>
        </div>
        <div class="panel-body" id="layers"></div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Preview & code</span>
          <span class="actions">
            <label class="checkbox-inline" style="display:inline-flex;align-items:center;gap:6px;font-size:11px;">
              <input type="checkbox" id="darkMode" checked /> dark stage
            </label>
            <button class="btn ghost small" data-act="copy">Copy CSS</button>
          </span>
        </div>
        <div class="panel-body">
          <div class="shadow-stage" id="shadowStage">
            <div class="shadow-box" id="shadowBox">SDS</div>
          </div>
          <div class="mt-12">
            <div class="mono-label mb-8">Fallback color</div>
            <div class="row" style="gap:8px; max-width:380px;">
              <input type="color" id="boxColor" value="#f2ecdc" style="flex:0 0 46px;" />
              <input type="text" id="boxColorHex" value="#f2ecdc" maxlength="7" spellcheck="false" />
            </div>
          </div>
          <div class="mt-12">
            <div class="mono-label mb-8">box-shadow CSS</div>
            <pre class="code" id="cssOut" style="max-height:170px;"></pre>
          </div>
        </div>
      </section>
    </div>
  `;

  const layersBox = root.querySelector("#layers");
  const stage = root.querySelector("#shadowStage");
  const box = root.querySelector("#shadowBox");
  const cssOut = root.querySelector("#cssOut");

  let layers = [
    { x: 0, y: 12, blur: 24, spread: 0, alpha: 0.45, hex: "#0a0c0e", inset: false },
    { x: 0, y: 3, blur: 8, spread: 0, alpha: 0.3, hex: "#000000", inset: false }
  ];

  const boxColor = (hex) => hex;

  const render = () => {
    // layers
    layersBox.innerHTML = layers.map((l, i) =>
      `<div class="layer-card" data-i="${i}">
        <div class="layer-head">
          <span class="mono-label">Layer ${i + 1}</span>
          <span class="actions">
            <label class="mini-label"><input type="checkbox" class="l-inset" ${l.inset ? "checked" : ""}/> inset</label>
            <button class="btn ghost small l-del" ${layers.length < 2 ? "disabled" : ""}>✕</button>
          </span>
        </div>
        <div class="slider-row"><div class="top"><span>X offset</span><b class="v">${l.x}px</b></div>
          <input type="range" class="l-x" min="-60" max="60" value="${l.x}" /></div>
        <div class="slider-row"><div class="top"><span>Y offset</span><b class="v">${l.y}px</b></div>
          <input type="range" class="l-y" min="-60" max="60" value="${l.y}" /></div>
        <div class="slider-row"><div class="top"><span>Blur</span><b class="v">${l.blur}px</b></div>
          <input type="range" class="l-blur" min="0" max="120" value="${l.blur}" /></div>
        <div class="slider-row"><div class="top"><span>Spread</span><b class="v">${l.spread}px</b></div>
          <input type="range" class="l-spread" min="-40" max="80" value="${l.spread}" /></div>
        <div class="slider-row"><div class="top"><span>Opacity</span><b class="v">${Math.round(l.alpha * 100)}%</b></div>
          <input type="range" class="l-alpha" min="0" max="100" value="${Math.round(l.alpha * 100)}" /></div>
        <div class="row" style="gap:8px;">
          <input type="color" class="l-color" value="${l.hex}" style="flex:0 0 40px; height:32px; padding:2px;" />
          <input type="text" class="l-hex" value="${l.hex}" maxlength="7" spellcheck="false" style="flex:1;" />
        </div>
      </div>`).join("");

    // bind layer events
    layersBox.querySelectorAll(".layer-card").forEach(card => {
      const i = +card.dataset.i;
      const set = (k, v) => { layers[i][k] = v; refresh(); };
      card.querySelector(".l-x").addEventListener("input", (e) => { layers[i].x = +e.target.value; card.querySelector(".v").textContent = e.target.value + "px"; refresh(); });
      card.querySelector(".l-y").addEventListener("input", (e) => { layers[i].y = +e.target.value; card.querySelector(".v").textContent = e.target.value + "px"; refresh(); });
      card.querySelector(".l-blur").addEventListener("input", (e) => { layers[i].blur = +e.target.value; card.querySelector(".v").textContent = e.target.value + "px"; refresh(); });
      card.querySelector(".l-spread").addEventListener("input", (e) => { layers[i].spread = +e.target.value; card.querySelector(".v").textContent = e.target.value + "px"; refresh(); });
      card.querySelector(".l-alpha").addEventListener("input", (e) => { layers[i].alpha = +e.target.value / 100; card.querySelector(".v").textContent = e.target.value + "%"; refresh(); });
      card.querySelector(".l-color").addEventListener("input", (e) => { layers[i].hex = e.target.value; card.querySelector(".l-hex").value = e.target.value; refresh(); });
      card.querySelector(".l-hex").addEventListener("input", (e) => {
        const v = e.target.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) { layers[i].hex = v; card.querySelector(".l-color").value = v; refresh(); }
      });
      card.querySelector(".l-inset").addEventListener("change", (e) => { layers[i].inset = e.target.checked; refresh(); });
      card.querySelector(".l-del").addEventListener("click", () => {
        if (layers.length <= 1) return;
        layers.splice(i, 1);
        render();
      });
    });
    refresh();
  };

  const hexA = (hex, a) => {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  };

  const refresh = () => {
    const css = layers.map((l) =>
      `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${hexA(l.hex, l.alpha)}`
    ).join(",\n  ");
    box.style.boxShadow = css.replace(/\n\s*/g, " ");
    const dark = root.querySelector("#darkMode").checked;
    stage.style.background = dark ? PREVIEW.dark.stage : PREVIEW.light.stage;
    const surf = root.querySelector("#boxColorHex").value.trim() || "#f2ecdc";
    box.style.background = surf;
    const n = parseInt((surf || "#f2ecdc").replace("#", ""), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    box.style.color = lum > 0.55 ? "#14161a" : "#f4f0e6";
    cssOut.textContent = `.card {\n  box-shadow: ${css};\n}`;
  };

  root.querySelector('[data-act="add"]').addEventListener("click", () => {
    layers.push({ x: 0, y: 5, blur: 15, spread: 0, alpha: 0.3, hex: "#000000", inset: false });
    render();
  });
  root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(cssOut.textContent, "Copied shadow CSS"));

  root.querySelector("#darkMode").addEventListener("change", refresh);
  root.querySelector("#boxColor").addEventListener("input", (e) => {
    root.querySelector("#boxColorHex").value = e.target.value;
    refresh();
  });
  root.querySelector("#boxColorHex").addEventListener("input", refresh);

  render();
}