/**
 * Colorize already pretty-printed JSON into token spans.
 * HTML-escapes first, then wraps tokens, so whitespace survives untouched.
 */
export function colorizeJSON(src) {
  const escaped = String(src)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // string literals (keys end with a colon)
  return escaped.replace(/"(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, colon) => {
      if (match.startsWith('"')) {
        if (!colon) return `<span class="tok str">${match}</span>`;
        const key = match.slice(0, -colon.length);
        return `<span class="tok key">${key}</span>${colon}`;
      }
      if (match === "true" || match === "false" || match === "null") {
        return `<span class="tok lit">${match}</span>`;
      }
      return `<span class="tok num">${match}</span>`;
    });
}
/**
 * Split JSON-ish source into string literals and everything else, so repairs
 * never touch the inside of a string (`http://…` must survive comment stripping).
 */
function segments(src) {
  const out = [];
  let buf = "";
  let i = 0;

  while (i < src.length) {
    const c = src[i];
    if (c !== '"' && c !== "'") { buf += c; i++; continue; }

    if (buf) { out.push({ isStr: false, text: buf }); buf = ""; }
    let j = i + 1;
    let body = "";
    while (j < src.length && src[j] !== c) {
      if (src[j] === "\\") { body += src[j] + (src[j + 1] ?? ""); j += 2; continue; }
      body += src[j++];
    }
    out.push({ isStr: true, quote: c, text: body });
    i = j + 1;
  }
  if (buf) out.push({ isStr: false, text: buf });
  return out;
}

// a // that follows a colon is part of a URL, not a comment
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const dropTrailingCommas = (s) => s.replace(/,(\s*[}\]])/g, "$1");
const quoteKeys = (s) => s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');

/** Best-effort repair: comments, trailing commas, unquoted keys, single quotes. */
export function repairJSON(src) {
  return segments(String(src)).map((seg) => {
    if (seg.isStr) {
      const body = seg.quote === "'" ? seg.text.replace(/"/g, '\\"') : seg.text;
      return `"${body}"`;
    }
    return quoteKeys(dropTrailingCommas(stripComments(seg.text)));
  }).join("");
}

/** Describe where a JSON.parse failure happened, for friendlier errors. */
export function findJSONError(src) {
  let pos = null;
  try {
    const s = String(src).replace(/,(\s*[}\]])/g, "$1");
    JSON.parse(s);
  } catch (err) {
    pos = /position (\d+)/.exec(err.message)?.[1];
  }
  const at = pos === null ? null : Number(pos);
  const line = at === null ? 1 : String(src).slice(0, at).split("\n").length;
  const snippet = at === null ? "" : (String(src).split("\n")[line - 1] || "").trim();
  return { line, snippet };
}
