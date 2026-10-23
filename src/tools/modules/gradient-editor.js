import { copyText } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Controls</span></div>
        <div class="panel-body">
          <label class="field mb-8">Type
            <select id="gtype">
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
              <option value="conic">Conic</option>
            </select>
          </label>
          <div class="slider-row" id="angleWrap">
            <div class="top"><span>Angle</span><b id="angleVal">90°</b></div>
            <input type="range" id="angle" min="0" max="360" value="90" />
          </div>
          <div class="slider-row">
            <div class="top"><span>Easing (smoothness)</span><b id="easeVal">linear</b></div>
            <select id="ease">
              <option value="linear">linear</option>
              <option value="0.83, 0, 0.17, 1">ease-in-out (cubic)</option>
              <option value="0.2, 0.8, 0.2, 1">smooth</option>
            </select>
          </div>
          <div class="mt-12">
            <div class="mono-label mb-8">Color stops</div>
            <div id="stops"></div>
            <button class="btn ghost small mt-8" data-act="addStop">+ Add stop</button>
            <button class="btn ghost small mt-8" data-act="random">Surprise me</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Preview</span>
          <span class="actions">
            <button class="btn ghost small" data-act="copy">Copy CSS</button>
            <button class="btn ghost small" data-act="copyBG">Copy as background</button>
          </span>
        </div>
        <div class="panel-body">
          <div class="gprev" id="gprev"></div>
          <div class="mt-12">
            <div class="mono-label mb-8">Generated CSS</div>
            <pre class="code" id="cssOut" style="max-height:160px;"></pre>
          </div>
        </div>
      </section>
    </div>
  `;

  const gprev = root.querySelector("#gprev");
  const cssOut = root.querySelector("#cssOut");
  let stops = [
    { color: "#3a5d8c", pos: 0 },
    { color: "#c77a2e", pos: 100 }
  ];

  const refresh = () => {
    const type = root.querySelector("#gtype").value;
    const angle = +root.querySelector("#angle").value;
    const ease = root.querySelector("#ease").value;
    root.querySelector("#angleVal").textContent = angle + "°";
    root.querySelector("#easeVal").textContent = root.querySelector("#ease").selectedOptions[0].textContent;

    const hintByEase = { linear: null, "ease-in-out (cubic)": 50, smooth: 33 };
    const hint = hintByEase[root.querySelector("#ease").selectedOptions[0].textContent];
    const flat = [];
    stops.forEach((s, i) => {
      flat.push(`${s.color} ${s.pos}%`);
      if (i < stops.length - 1 && hint !== null) flat.push(hint + "%");
    });
    let css = "";
    if (type === "linear") css = `linear-gradient(${angle}deg, ${flat.join(", ")})`;
    else if (type === "radial") css = `radial-gradient(circle at center, ${flat.join(", ")})`;
    else css = `conic-gradient(from ${angle}deg, ${flat.join(", ")})`;

    gprev.style.background = css;
    cssOut.textContent = `.something {\n  background: ${css};\n}`;
  };

  const randColor = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

  const renderStops = () => {
    const box = root.querySelector("#stops");
    box.innerHTML = stops.map((s, i) => `
      <div class="stop-row" data-i="${i}">
        <input type="color" class="stop-color" value="${s.color}" />
        <input type="text" class="stop-hex" value="${s.color}" maxlength="7" spellcheck="false" />
        <input type="range" class="stop-pos" min="0" max="100" value="${s.pos}" style="flex:1;" />
        <span class="stop-pct">${s.pos}%</span>
        <button class="btn ghost small stop-del" ${stops.length < 2 ? "disabled" : ""} title="remove">✕</button>
      </div>`).join("");

    box.querySelectorAll(".stop-row").forEach(row => {
      const i = +row.dataset.i;
      const color = row.querySelector(".stop-color");
      const hex = row.querySelector(".stop-hex");
      const pos = row.querySelector(".stop-pos");
      const pct = row.querySelector(".stop-pct");
      color.addEventListener("input", () => {
        const c = color.value;
        stops[i].color = c;
        hex.value = c;
        refresh();
      });
      hex.addEventListener("input", () => {
        const v = hex.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) {
          stops[i].color = v;
          color.value = v;
          refresh();
        }
      });
      pos.addEventListener("input", () => {
        stops[i].pos = +pos.value;
        pct.textContent = pos.value + "%";
        refresh();
      });
      row.querySelector(".stop-del").addEventListener("click", () => {
        if (stops.length <= 2) return;
        stops.splice(i, 1);
        renderStops();
        refresh();
      });
    });
  };

  root.querySelector("#gtype").addEventListener("change", refresh);
  root.querySelector("#angle").addEventListener("input", refresh);
  root.querySelector("#ease").addEventListener("change", refresh);

  root.querySelector('[data-act="addStop"]').addEventListener("click", () => {
    stops.push({ color: randColor(), pos: Math.round(Math.random() * 100) });
    renderStops();
    refresh();
  });

  root.querySelector('[data-act="random"]').addEventListener("click", () => {
    const n = 3 + Math.floor(Math.random() * 3);
    stops = Array.from({ length: n }, (_, i) => ({
      color: randColor(),
      pos: Math.round((i / (n - 1)) * 100)
    }));
    renderStops();
    refresh();
  });

  const css = () => cssOut.textContent.replace(/^\.something \{$/, "").replace(/\};$/, "").replace(/^\s*background:\s*/m, "").trim();
  root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(cssOut.textContent, "Copied CSS block"));
  root.querySelector('[data-act="copyBG"]').addEventListener("click", () => copyText(css(), "Copied background value"));

  renderStops();
  refresh();
}