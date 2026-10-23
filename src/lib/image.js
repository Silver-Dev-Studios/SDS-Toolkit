/** Canvas-based image helpers: load, convert, resize, compress. */

export const MIME = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  avif: "image/avif"
};

export const MIME_EXT = Object.fromEntries(Object.entries(MIME).map(([k, v]) => [v, k]));

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode that image."));
    img.src = src;
  });
}

export function normalizeFileSource(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function imageFromFile(file) {
  return normalizeFileSource(file).then(loadImage);
}

/**
 * Draw an image into a fresh canvas, optionally scaled.
 * `fit` = object-fit style behavior.
 */
export function drawScaled(img, { width, height, fit = "fill", background = null } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width || img.naturalWidth;
  canvas.height = height || img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (fit === "cover") {
    const ratio = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else if (fit === "contain") {
    const ratio = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed."))), type, quality);
  });
}

/** Hue-aware loop removal helper used by the background remover. */
export function isSkinLike(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const s = max === 0 ? 0 : (max - min) / max;
  // HSV hue
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  // skin ranges
  return (h >= 0 && h <= 25 || h >= 335) && s > 0.22 && l > 0.24 && l < 0.88;
}