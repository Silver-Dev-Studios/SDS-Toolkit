import { debounce } from "../../lib/util.js";

const SAMPLE = `A home for small tools that solve real problems.

Every tool in this toolkit runs on your machine. Nothing is uploaded, nothing is queued, and there is no account to create. Paste a document, drop an image, or sketch a palette — the work happens in the tab you already have open.

That constraint shapes the design. Tools stay small enough to trust, and each one finishes a job in a single sitting.`;

export default function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head"><span class="title">Write or paste</span>
        <span class="actions">
          <button class="btn ghost small" data-act="sample">Sample</button>
          <button class="btn ghost small" data-act="clear">Clear</button>
        </span>
      </div>
      <div class="panel-body">
        <textarea id="wcSrc" spellcheck="false" rows="14" placeholder="Start typing or paste your text…"></textarea>
      </div>
    </div>

    <div class="panel mt-20">
      <div class="panel-head"><span class="title">Live counts</span></div>
      <div class="panel-body">
        <div class="stat-grid wc" id="wcStats"></div>
        <p class="input-hint mt-12">All counting on-device, updated as you type.</p>
      </div>
    </div>
  `;

  const src = root.querySelector("#wcSrc");
  const stats = root.querySelector("#wcStats");

  const count = () => {
    const text = src.value;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = (text.match(/[^.!?…]+[.!?…]+/g) || []).length +
      (/[^.!?…\s][^.!?…]*$/.test(text.trim()) ? 1 : 0);
    const minutes = wordCount / 200;

    const data = [
      ["Words", wordCount.toLocaleString()],
      ["Characters", text.length.toLocaleString()],
      ["No-space chars", text.replace(/\s+/g, "").length.toLocaleString()],
      ["Sentences", sentences.toLocaleString()],
      ["Paragraphs", text.split(/\n\s*\n/).filter((p) => p.trim()).length.toLocaleString()],
      ["Lines", (text ? text.split("\n").length : 0).toLocaleString()],
      ["Read time", minutes < 1 ? "< 1 min" : `${Math.round(minutes)} min`, "200 wpm"],
      ["Speak time", minutes < 0.25 ? "< 15 sec" : `${Math.max(1, Math.round(minutes * 3))} sec`, "130 wpm"]
    ];
    stats.innerHTML = data.map(([k, v, sub]) => `
      <div class="stat">
        <div class="v">${v}</div>
        <div class="k">${k}${sub ? ` · ${sub}` : ""}</div>
      </div>`).join("");
  };

  root.querySelector('[data-act="sample"]').addEventListener("click", () => {
    src.value = SAMPLE;
    count();
  });
  root.querySelector('[data-act="clear"]').addEventListener("click", () => {
    src.value = "";
    src.focus();
    count();
  });

  src.addEventListener("input", debounce(count, 120));
  src.value = SAMPLE;
  count();
}
