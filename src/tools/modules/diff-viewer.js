import { diffLines, diffStats } from "../../lib/diff.js";
import { copyText, downloadText, esc, debounce } from "../../lib/util.js";

const SAMPLE_A = `SDS Toolkit — release notes

- JSON formatter with validation
- Base64 encoder
- URL encoder
- Regex tester
Uploads: 0`;

const SAMPLE_B = `SDS Toolkit — release notes

- JSON formatter with validation and repair
- Base64 encoder / decoder
- URL encoder
- Regex tester with capture groups
- Text diff viewer
Uploads: 0 (always local)`;

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">Before</span>
          <span class="actions"><button class="btn ghost small" data-act="sample">Sample</button></span>
        </div>
        <div class="panel-body">
          <textarea id="diffA" spellcheck="false" rows="10" placeholder="The original text…"></textarea>
          <div class="actions mt-12">
            <button class="btn" data-act="compare">Compare →</button>
            <button class="btn ghost" data-act="swap">Swap</button>
          </div>
        </div>
      </section>
      <section class="panel" style="align-self:start;">
        <div class="panel-head"><span class="title">After</span>
          <span class="actions"><button class="btn ghost small" data-act="clear">Clear</button></span>
        </div>
        <div class="panel-body">
          <textarea id="diffB" spellcheck="false" rows="10" placeholder="The updated text…"></textarea>
        </div>
      </section>
    </div>

    <div class="panel mt-20">
      <div class="panel-head"><span class="title">Line diff</span>
        <span class="actions">
          <span id="diffStats" class="badge"></span>
          <button class="btn ghost small" data-act="unified">Copy unified diff</button>
          <button class="btn ghost small" data-act="download">Download</button>
        </span>
      </div>
      <div class="panel-body">
        <div class="diff-view" id="diffOut"><div class="panel-body dim">Nothing compared yet.</div></div>
      </div>
    </div>
  `;

  const a = root.querySelector("#diffA");
  const b = root.querySelector("#diffB");
  const out = root.querySelector("#diffOut");
  const stats = root.querySelector("#diffStats");
  let currentOps = [];

  const render = () => {
    const ops = diffLines(a.value, b.value);
    currentOps = ops;
    const st = diffStats(ops);
    let lA = 0, lB = 0;
    const rows = ops.map((op) => {
      if (op.type === "eq") {
        lA++; lB++;
        return `<div class="diff-row diff-eq"><span class="diff-ln">${lA}</span><span class="diff-ln r">${lB}</span><span class="diff-txt">${esc(op.text)}</span></div>`;
      }
      if (op.type === "del") {
        lA++;
        return `<div class="diff-row diff-del"><span class="diff-ln">${lA}</span><span class="diff-ln r"></span><span class="diff-txt">− ${esc(op.text)}</span></div>`;
      }
      lB++;
      return `<div class="diff-row diff-add"><span class="diff-ln"></span><span class="diff-ln r">${lB}</span><span class="diff-txt">+ ${esc(op.text)}</span></div>`;
    });
    out.innerHTML = rows.join("") || `<div class="panel-body dim">Both sides are empty — add some text.</div>`;
    stats.textContent = `+${st.add} −${st.del}  ·  ${st.eq} unchanged`;
    stats.className = "badge" + (st.add || st.del ? "" : " ok");
  };

  const unified = () => {
    const body = currentOps
      .map((op) => `${op.type === "eq" ? " " : op.type === "del" ? "-" : "+"}${op.text}\n`)
      .join("");
    return `--- before\n+++ after\n${body}`;
  };

  const live = debounce(render, 160);
  a.addEventListener("input", live);
  b.addEventListener("input", live);

  root.querySelectorAll("[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "compare") render();
      else if (act === "swap") { const t = a.value; a.value = b.value; b.value = t; render(); }
      else if (act === "unified") copyText(unified(), "Copied unified diff");
      else if (act === "download") downloadText(unified(), "diff.txt");
      else if (act === "sample") {
        a.value = SAMPLE_A; b.value = SAMPLE_B; render();
      }
      else if (act === "clear") {
        a.value = ""; b.value = ""; render();
      }
    });
  });

  a.value = SAMPLE_A;
  b.value = SAMPLE_B;
  render();
}