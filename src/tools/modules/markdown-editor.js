import { marked } from "marked";
import { downloadText, copyText } from "../../lib/util.js";
import { debounce } from "../../lib/util.js";

marked.setOptions({ breaks: false, gfm: true });

const SAMPLE = `# SDS Toolkit

A collection of **free, privacy-friendly** tools that run *entirely* in your browser.

## Why it exists

- Build tools that solve *real* problems
- Keep them **100% on-device**
- Make each one independently useful

> Everything here runs locally. Nothing gets uploaded.

\`\`\`python
def hello():
    print("no servers needed")
\`\`\`

## Table

| Tool | Category | Upload? |
| ---- | -------- | ------- |
| JSON Formatter | Developer | Never |
| Image Converter | Files | Never |

[Silver Dev Studio](https://silverdev.studio)
`;

export default function mount(root) {
  root.innerHTML = `
    <div class="tool-split">
      <section class="panel">
        <div class="panel-head"><span class="title">Markdown</span>
          <span class="badge" id="mdStats"></span>
        </div>
        <div class="panel-body">
          <textarea id="mdSrc" spellcheck="false" rows="22" style="min-height:62vh; font-size:13px;"></textarea>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><span class="title">Preview</span>
          <span class="actions">
            <button class="btn ghost small" data-act="copyHTML">Copy HTML</button>
            <button class="btn ghost small" data-act="dlHTML">Download HTML</button>
            <button class="btn ghost small" data-act="dlMD">Download .md</button>
          </span>
        </div>
        <div class="panel-body">
          <article class="md-preview" id="mdPrev" style="min-height:62vh; border:1px dashed var(--card-border); border-radius:var(--radius-sm); padding:16px;"></article>
        </div>
      </section>
    </div>
  `;

  const src = root.querySelector("#mdSrc");
  const prev = root.querySelector("#mdPrev");
  const stats = root.querySelector("#mdStats");

  const render = () => {
    const html = marked.parse(src.value);
    prev.innerHTML = html;
    const words = src.value.trim().split(/\s+/).filter(Boolean).length;
    stats.textContent = `${words} words`;
  };

  src.addEventListener("input", debounce(render, 180));

  root.querySelector('[data-act="copyHTML"]').addEventListener("click", () => {
    copyText(prev.innerHTML, "Copied rendered HTML");
  });
  root.querySelector('[data-act="dlHTML"]').addEventListener("click", () => {
    downloadText(`<!doctype html><meta charset="utf-8">${prev.innerHTML}`, "preview.html", "text/html;charset=utf-8");
  });
  root.querySelector('[data-act="dlMD"]').addEventListener("click", () => {
    downloadText(src.value, "document.md", "text/markdown;charset=utf-8");
  });

  src.value = SAMPLE;
  render();
}