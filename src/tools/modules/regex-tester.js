import { esc } from "../../lib/util.js";
import { debounce } from "../../lib/util.js";

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Expression</span>
          <span class="badge" id="rgxState"></span>
        </div>
        <div class="panel-body">
          <div class="row">
            <label class="field grow-2">Pattern
              <input type="text" id="rgxPattern" spellcheck="false" value="([A-Z]+)-(\\d+)" />
            </label>
            <label class="field">Flags
              <input type="text" id="rgxFlags" value="g" size="6" style="width:80px;" maxlength="6" spellcheck="false" placeholder="gi" />
            </label>
          </div>
          <div class="actions mt-12">
            ${["g", "i", "m", "s", "u", "y"].map(f =>
              `<label class="checkbox-inline"><input type="checkbox" class="rgx-flag" value="${f}" ${f === "g" ? "checked" : ""}/> ${f}</label>`
            ).join("")}
          </div>
          <label class="field mt-12">Test text
            <textarea id="rgxText" spellcheck="false" rows="8">AST-42  Markdown-7  CSS-13
SVG-8  JSON-2  UUID-4</textarea>
          </label>
        </div>
      </section>
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Matches</span>
          <span class="badge" id="rgxCount"></span>
        </div>
        <div class="panel-body">
          <div class="output-well" id="rgxHighlight" style="white-space:pre-wrap;">—</div>
          <div class="mt-12">
            <div class="mono-label mb-8">Captures</div>
            <div id="rgxCaptures" class="panel" style="max-height:220px; overflow:auto;"></div>
          </div>
        </div>
      </section>
    </div>

    <style>
      .checkbox-inline { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); }
      .rgx-hl { background: rgba(227, 168, 87, 0.34); border-radius: 3px; box-shadow: 0 0 0 1px rgba(227,168,87,.4); }
      .rgx-hl.g1 { background: rgba(143, 184, 224, 0.28); }
      .rgx-hl.g2 { background: rgba(159, 199, 163, 0.28); }
      .rgx-hl.g3 { background: rgba(215, 168, 208, 0.3); }
      .rgx-hl.g4 { background: rgba(232, 176, 138, 0.3); }
      .rgx-err { outline: 1px solid var(--bad); background: rgba(179,74,58,.06); }
    </style>
  `;

  const pattern = root.querySelector("#rgxPattern");
  const flagsInput = root.querySelector("#rgxFlags");
  const text = root.querySelector("#rgxText");
  const state = root.querySelector("#rgxState");
  const countEl = root.querySelector("#rgxCount");
  const highlight = root.querySelector("#rgxHighlight");
  const captures = root.querySelector("#rgxCaptures");

  const setFlag = (f, on) => {
    let current = flagsInput.value;
    const re = new RegExp(f, "i");
    if (on && !re.test(current)) flagsInput.value = current + f;
    if (!on && re.test(current)) flagsInput.value = current.replace(re, "");
  };
  root.querySelectorAll(".rgx-flag").forEach(cb => {
    cb.addEventListener("change", () => setFlag(cb.value, cb.checked));
  });

  const compute = () => {
    const src = text.value || "";
    try {
      const flags = flagsInput.value.replace(/[^gimsuyd]/g, "");
      const re = new RegExp(pattern.value, flags);
      const global = flags.includes("g");
      const walker = global ? new RegExp(re.source, flags.replace("g", "") + "g") : re;
      let last = 0;
      let html = "";
      const groupList = [];
      let found = 0;

      const mark = (start, end) => {
        html += esc(src.slice(last, start));
        html += `<span class="rgx-hl g0">${esc(src.slice(start, end))}</span>`;
        last = end;
      };

      let m;
      while ((m = walker.exec(src)) !== null) {
        if (m[0] === "") { walker.lastIndex++; continue; }
        mark(m.index, m.index + m[0].length);
        for (let k = 1; k < m.length; k++) {
          if (m[k] !== undefined) groupList.push({ k, v: m[k] });
        }
        found++;
        if (!global) break;
        if (found >= 3000) break;
      }
      html += esc(src.slice(last));

      state.textContent = "✓ valid";
      state.className = "badge ok";
      highlight.innerHTML = html || `<span class="placeholder">No matches or empty text.</span>`;
      highlight.classList.remove("rgx-err");
      countEl.textContent = `${found} match${found === 1 ? "" : "es"}`;
      countEl.className = "badge";

      if (groupList.length) {
        const uniq = groupList.filter((g, idx) => groupList.findIndex((x) => x.k === g.k && x.v === g.v) === idx);
        captures.innerHTML = `<table class="tbl"><thead><tr><th>Group</th><th>Value</th></tr></thead><tbody>` +
          uniq.slice(0, 60).map((g) => `<tr><td>${g.k}</td><td class="mono">${esc(g.v)}</td></tr>`).join("") +
          `</tbody></table>`;
      } else {
        captures.innerHTML = `<div class="panel-body dim" style="font-size:12px;">No capture groups in the matched output.</div>`;
      }
    } catch (err) {
      state.textContent = "✕ invalid";
      state.className = "badge bad";
      highlight.innerHTML = `<span class="placeholder">${esc(err.message)}</span>`;
      highlight.classList.add("rgx-err");
      countEl.textContent = "—";
      captures.innerHTML = "";
    }
  };

  const doCompute = debounce(compute, 180);
  [pattern, flagsInput, text].forEach(el => el.addEventListener("input", doCompute));

  // keep the flag checkboxes honest when the field is edited by hand
  flagsInput.addEventListener("input", () => {
    const set = new Set(flagsInput.value);
    root.querySelectorAll(".rgx-flag").forEach((cb) => { cb.checked = set.has(cb.value); });
  });

  compute();
}