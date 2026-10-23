/** Color math helpers for palette / gradient / shadow tools. */

export function hexToRgb(hex) {
  const s = hex.replace(/^#/, "");
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(full, 16);
  if (isNaN(n) || full.length !== 6) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }, force6 = true) {
  const to = (v) => v.toString(16).padStart(2, "0");
  return "#" + to(r) + to(g) + to(b);
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h, s, l, a = 1) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const rt = Math.round((r + m) * 255);
  const gt = Math.round((g + m) * 255);
  const bt = Math.round((b + m) * 255);
  if (a >= 1) return rgbToHex({ r: rt, g: gt, b: bt });
  return `rgba(${rt}, ${gt}, ${bt}, ${a})`;
}

export function randomHex() {
  const n = Math.floor(Math.random() * 0xffffff);
  return "#" + n.toString(16).padStart(6, "0");
}

export function relativeLuminance({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function readableTextFor(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? (relativeLuminance(rgb) > 0.5 ? "#14161a" : "#f7f4ea") : "#14161a";
}

/** HSLuv-style perception tweak: OKLCH-ish lightness split for palettes. */
export function lighten(hex, amt) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return hslToHex(h, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l + amt)));
}

export function darken(hex, amt) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return hslToHex(h, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l - amt)));
}

export function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}