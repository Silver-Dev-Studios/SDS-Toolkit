/** Small shared helpers used across tools. */

export function qs(root, sel) { return root.querySelector(sel); }

export function qsa(root, sel) { return Array.from(root.querySelectorAll(sel)); }

export function on(root, type, sel, fn) {
  root.addEventListener(type, (e) => {
    const t = e.target.closest(sel);
    if (t && root.contains(t)) fn(e, t);
  });
}



export function fmtBytes(n) {
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fmtNum(n) {
  return Number(n).toLocaleString("en-US");
}

/** Read an input[type=file] as a single File, else null. */
export function pickFile(input, opts = {}) {
  const f = input.files && input.files[0];
  if (!f) return null;
  if (opts.size && f.size > opts.size) {
    toast(`That file is too large for on-device handling (limit ${fmtBytes(opts.size)}).`);
    return null;
  }
  return f;
}

export function toast(msg, ms = 3200) {
  const hud = document.getElementById("hud");
  if (!hud) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  hud.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .4s ease";
    setTimeout(() => el.remove(), 420);
  }, ms);
}

export function copyText(text, label = "Copied") {
  navigator.clipboard.writeText(text).then(
    () => toast(label),
    () => toast("Copy blocked by browser — select manually.")
  );
}

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function uid(len = 16) {
  // crypto-random hex, generous length (no dashes)
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

/** Escape a value for safe HTML injection in template strings. */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(text, filename, mime = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

/** Simple version hash so the app can display a build tag. */
export function shortHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}