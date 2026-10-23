import { SEEDS } from "../../lib/seeds.js";
import { contrastRatio, hexToRgb, hslToHex, rand, rgbToHsl, shuffle } from "../../lib/color.js";
import { copyText, downloadBlob, esc } from "../../lib/util.js";

const MODES = {
  analog: (h) => [(h + 340) % 360, (h + 12) % 360, h, (h + 25) % 360, (h + 40) % 360],
  mono: (h) => [h, h, h, h, h],
  triadic: (h) => [h, (h + 120) % 360, h, (h + 240) % 360, h],
  complement: (h) => [h, (h + 180) % 360, (h + 165) % 360, h, (h + 195) % 360],
  split: (h) => [h, (h + 172) % 360, h, (h + 188) % 360, (h + 30) % 360]
};

/** Build a 5-stop ramp: deep shade → seed → tint, keeping the seed readable. */
function makePalette(seedHex, mode) {
  const { h, s } = rgbToHsl(hexToRgb(seedHex));
  const hues = MODES[mode] ? MODES[mode](h) : MODES.mono(h);
  const baseSat = Math.max(26, Math.min(78, s));
  const lightness = [24, 38, 52, 68, 84];

  return hues.map((hu, i) => {
    const l = Math.max(12, Math.min(92, lightness[i] + rand(-3, 3)));
    // push saturation up in the mid tones, down at the extremes
    const satBias = i === 0 ? 6 : i === 4 ? -14 : 0;
    const sa = Math.max(16, Math.min(94, baseSat + satBias + rand(-4, 4)));
    return hslToHex(hu, sa, l);
  });
}

function contrastText(hex) {
  const rgb = hexToRgb(hex);
  const w = hexToRgb("#f7f4ea");
  const d = hexToRgb("#14161a");
  return contrastRatio(rgb, w) > contrastRatio(rgb, d) ? "#f7f4ea" : "#14161a";
}

export default function mount(root) {
  root.innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><span class="title">Seed & mode</span></div>
        <div class="panel-body">
          <div class="row" style="align-items:end;">
            <label class="field grow-2">Seed colour
              <div class="row" style="gap:8px;">
                <input type="color" id="seed" value="#3a5d8c" style="flex:0 0 52px;" />
                <input type="text" id="seedHex" value="#3a5d8c" style="flex:1;" maxlength="7" spellcheck="false" />
              </div>
            </label>
            <button class="btn ghost" data-act="random">Random</button>
          </div>
          <label class="field mt-12">Harmony mode
            <select id="mode">
              <option value="analog">Analogous</option>
              <option value="mono">Monochromatic</option>
              <option value="triadic">Triadic</option>
              <option value="complement">Complementary</option>
              <option value="split">Split-complementary</option>
            </select>
          </label>
          <div class="actions mt-12">
            <button class="btn" data-act="generate">Generate palette</button>
            <button class="btn ghost" data-act="shuffle">Shuffle</button>
          </div>
          <div class="mt-12">
            <div class="mono-label mb-8">Seed swatches</div>
            <div class="swatch-row" id="seedRow"></div>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Palette</span>
          <span class="actions">
            <button class="btn ghost small" data-act="copyCSS">Copy CSS</button>
            <button class="btn ghost small" data-act="copyTailwind">Tailwind</button>
            <button class="btn ghost small" data-act="downloadPNG">Swatch PNG</button>
          </span>
        </div>
        <div class="panel-body">
          <div class="palette-strip" id="paletteStrip"></div>
          <div class="stat-grid contrast-grid mt-12" id="paletteStats"></div>
          <p class="input-hint mt-12">Click any swatch to copy its hex code.</p>
        </div>
      </section>
    </div>
  `;

  const seed = root.querySelector("#seed");
  const seedHex = root.querySelector("#seedHex");
  const mode = root.querySelector("#mode");
  let palette = [];

  const syncSeed = () => {
    let v = seedHex.value.trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) v = seed.value;
    seed.value = v;
    seedHex.value = v;
    seed.style.borderColor = v;
  };

  const renderSeeds = () => {
    const row = root.querySelector("#seedRow");
    row.innerHTML = SEEDS_LABELS.map(([name, hex]) =>
      `<button class="swatch seed-swatch" data-name="${esc(name)}" data-hex="${hex}" title="${esc(name)}" style="background:${hex}"></button>`
    ).join("");
    row.querySelectorAll(".seed-swatch").forEach(b => b.addEventListener("click", () => {
      seedHex.value = b.dataset.hex;
      seed.value = b.dataset.hex;
      generate();
    }));
  };

  const paintStrip = () => {
    const strip = root.querySelector("#paletteStrip");
    strip.innerHTML = palette.map((hex) => `
      <div class="swatch palette-swatch" data-hex="${hex}" style="background:${hex}; height:84px;" title="copy ${hex}">
        <span class="sw-label" style="color:${contrastText(hex)};">${hex.toUpperCase()}</span>
      </div>`).join("");
    strip.querySelectorAll(".palette-swatch").forEach(el => el.addEventListener("click", () => {
      copyText(el.dataset.hex, "Copied " + el.dataset.hex);
    }));
  };

  const generate = () => {
    syncSeed();
    palette = makePalette(seed.value, mode.value);
    paintStrip();

    const stats = root.querySelector("#paletteStats");
    const pairs = [
      [palette[0], palette[4], "1 / 5"],
      [palette[4], palette[0], "5 / 1"],
      [palette[2], palette[0], "3 / 1"],
      [palette[1], palette[4], "2 / 5"],
      [palette[3], palette[0], "4 / 1"]
    ];
    stats.innerHTML = pairs.map(([fg, bg, label]) => {
      const rr = contrastRatio(hexToRgb(fg), hexToRgb(bg));
      const grade = rr >= 7 ? "AAA" : rr >= 4.5 ? "AA" : rr >= 3 ? "AA lg" : "fail";
      const cls = rr >= 4.5 ? "ok" : rr >= 3 ? "amber" : "bad";
      return `<div class="stat" style="background:${bg};" title="Swatch ${label.replace(" / ", " on ")} — ${rr.toFixed(2)}:1">
        <div class="v" style="color:${fg};">${rr.toFixed(2)}</div>
        <div class="k" style="color:${fg};opacity:.65;">${grade}</div>
        <div class="k k-pair" style="color:${fg};opacity:.45;">${label}</div>
      </div>`;
    }).join("");
  };

  const cssVars = () => `--sds-1: ${palette[0]};
--sds-2: ${palette[1]};
--sds-3: ${palette[2]};
--sds-4: ${palette[3]};
--sds-5: ${palette[4]};`;

  const tailwind = () => palette.map((h, i) => `'sds${i + 1}': '${h}'`).join(",\n");

  const swatchPNG = () => {
    const colors = palette;
    const cw = 480, ch = 96;
    const c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    const ctx = c.getContext("2d");
    colors.forEach((hex, i) => {
      ctx.fillStyle = hex;
      ctx.fillRect((cw / 5) * i, 0, cw / 5, ch);
    });
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, ch - 26, cw, 26);
    ctx.fillStyle = "#fff";
    ctx.font = "600 12px monospace";
    colors.forEach((hex, i) => {
      ctx.fillText(hex.toUpperCase(), (cw / 5) * i + 10, ch - 9);
    });
    c.toBlob((blob) => blob && downloadBlob(blob, "palette.png"));
  };

  root.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
    switch (b.dataset.act) {
      case "generate": generate(); break;
      case "random":
        seedHex.value = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
        generate(); break;
      case "shuffle": palette = shuffle(palette); paintStrip(); break;
      case "copyCSS": copyText(cssVars(), "Copied CSS variables"); break;
      case "copyTailwind": copyText(tailwind(), "Copied Tailwind config"); break;
      case "downloadPNG": swatchPNG(); break;
    }
  }));

  const SEEDS_LABELS = Object.entries(SEEDS);
  renderSeeds();
  generate();
}