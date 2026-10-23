/** CSV parser (RFC 4180-ish, tolerant of quotes & newlines in fields). */

export function parseCSV(text, delim = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === delim) { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // drop stray blank trailing row
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].trim() === "") rows.pop();
  return rows;
}

export function inferTypes(rows) {
  // null = not yet seen; conflicting observations collapse to "mixed"
  const types = rows[0].map(() => null);
  for (let r = 1; r < rows.length; r++) {
    rows[r].forEach((v, ci) => {
      if (ci >= types.length || types[ci] === "mixed") return;
      const t = typeOf(v);
      if (t === null) return;
      types[ci] = types[ci] === null ? t : types[ci] === t ? t : "mixed";
    });
  }
  return types.map((t) => t || "string");
}

/** Returns "number" | "boolean" | "string" | null (blank / undecidable). */
function typeOf(v) {
  const s = v.trim();
  if (s === "") return null;
  if (/^[-+]?(\d+|\d*\.\d+)([eE][-+]?\d+)?$/.test(s)) return "number";
  if (/^(true|false)$/i.test(s)) return "boolean";
  return "string";
}

export function rowsToJSON(rows, { minify = false, infer = true } = {}) {
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row.");
  const headers = rows[0].map((h, i) => (h.trim() === "" ? `column_${i + 1}` : h.trim()));
  const types = infer ? inferTypes(rows) : headers.map(() => "string");
  const pad = minify ? 0 : 2;
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const obj = {};
    headers.forEach((h, ci) => {
      const raw = rows[r][ci] ?? "";
      const v = raw.trim();
      if (types[ci] === "number" && v !== "" && isFinite(+v)) { obj[h] = +v; return; }
      if (types[ci] === "boolean" && /^(true|false)$/i.test(v)) { obj[h] = v.toLowerCase() === "true"; return; }
      obj[h] = raw;
    });
    out.push(obj);
  }
  return JSON.stringify(out, null, pad);
}

export function toCSV(rows) {
  const fmt = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return rows.map((r) => r.map(fmt).join(",")).join("\n");
}