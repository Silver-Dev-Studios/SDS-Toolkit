/**
 * Central registry: metadata for every tool. Modules are lazy-loaded
 * on navigation so the home page stays light.
 */

export const CATEGORIES = [
  {
    id: "developer",
    name: "Developer utilities",
    about: "Validation, encoding and inspection helpers for day-to-day coding. Paste input, get output — nothing leaves the tab.",
    verbs: ["parse", "encode", "inspect"]
  },
  {
    id: "files",
    name: "File tools",
    about: "Image conversion, compression and inspection. Processing happens on-device with the Canvas API — your files never touch a server.",
    verbs: ["convert", "compress", "inspect"]
  },
  {
    id: "creative",
    name: "Creative utilities",
    about: "Generators for palettes, gradients, shadows and favicons — tune until it feels right, then copy the CSS or the asset.",
    verbs: ["generate", "tune", "copy"]
  },
  {
    id: "writing",
    name: "Writing & data tools",
    about: "Draft, count, convert and tidy text. A calm corner of the toolkit for writing, cleaning and reshaping data.",
    verbs: ["draft", "convert", "tidy"]
  }
];

export const TOOLS = [
  // ——— developer ———
  {
    id: "json-formatter",
    category: "developer",
    title: "JSON Formatter & Validator",
    tagline: "Pretty-print, minify, validate and fix broken JSON in one paste.",
    desc: "Paste any JSON, get an indented, colour-coded view with syntax errors called out line by line. Validate, minify and copy in one click.",
    glyph: "{ }",
    tags: ["validate", "pretty-print"]
  },
  {
    id: "base64",
    category: "developer",
    title: "Base64 Encoder / Decoder",
    tagline: "Encode text, files or data-URLs — and decode them right back.",
    desc: "Turn any text or file into Base64, or decode Base64 into readable text. Unicode-safe on both ends. Files are converted locally.",
    glyph: "64",
    tags: ["encode", "decode"]
  },
  {
    id: "url-encoder",
    category: "developer",
    title: "URL Encoder / Decoder",
    tagline: "Percent-encode and decode URLs, params and query strings.",
    desc: "Encode strings for safe use in URLs and query parameters, or decode already-encoded text. Component mode keeps slashes intact.",
    glyph: "://",
    tags: ["percent", "query"]
  },
  {
    id: "uuid-generator",
    category: "developer",
    title: "UUID Generator",
    tagline: "v4 UUIDs from the system's crypto random source.",
    desc: "Bulk-generate v4 UUIDs (or compact hex tokens) with cryptographic randomness. Copy as one string or a file.",
    glyph: "9f",
    tags: ["v4", "crypto"]
  },
  {
    id: "regex-tester",
    category: "developer",
    title: "Regex Tester",
    tagline: "Build and test regular expressions against live sample text.",
    desc: "Type a pattern and matched groups light up in your sample text in real time. Flags, match count and per-group captures included.",
    glyph: ".*",
    tags: ["pcre", "flags"]
  },
  {
    id: "diff-viewer",
    category: "developer",
    title: "Text Diff Viewer",
    tagline: "Compare two texts side by side with a clean line diff.",
    desc: "Paste two versions of any text and see exactly what changed, line by line. Copy the outcome as a unified diff.",
    glyph: "≠",
    tags: ["compare", "unified"]
  },
  // ——— files ———
  {
    id: "image-converter",
    category: "files",
    title: "Image Converter",
    tagline: "Convert images to PNG, JPEG, WebP or AVIF in your browser.",
    desc: "Drop in a JPG, PNG, WebP, GIF or BMP and export it as PNG, JPEG, WebP or AVIF — with quality and size controls. Nothing is uploaded.",
    glyph: "◫",
    tags: ["png", "webp", "avif"]
  },
  {
    id: "image-compressor",
    category: "files",
    title: "Image Compressor",
    tagline: "Shrink image file sizes with visible-before/after previews.",
    desc: "Compress JPEG, PNG or WebP images by choosing quality, target size and dimensions. See the actual bytes saved before you export.",
    glyph: "☁",
    tags: ["optimize", "web"]
  },
  {
    id: "image-resizer",
    category: "files",
    title: "Resize & Crop",
    tagline: "Scale or crop an image to an exact aspect with a live preview.",
    desc: "Resize to fixed dimensions or an aspect ratio, choose a crop fit, and export at the exact size you need for your project.",
    glyph: "⤢",
    tags: ["scale", "crop"]
  },
  {
    id: "bg-remover",
    category: "files",
    title: "Background Remover",
    tagline: "Strip the background from portraits and product shots — on-device.",
    desc: "Flood-fill based background removal that works great on clean backgrounds. Supports loop-brush cleanup for photos. All local.",
    glyph: "⊗",
    tags: ["flood-fill", "portrait"]
  },
  {
    id: "svg-preview",
    category: "files",
    title: "SVG Previewer",
    tagline: "Preview, inspect and export SVG files with a checkered canvas.",
    desc: "Drop an SVG to render it on a checkered backdrop, inspect its bounds and code, and export it back as a clean .svg file.",
    glyph: "svg",
    tags: ["vector", "export"]
  },
  {
    id: "metadata-viewer",
    category: "files",
    title: "EXIF & Metadata Viewer",
    tagline: "Inspect hidden camera data without sending it anywhere.",
    desc: "Read dimensions, file type and EXIF fields like camera, lens and capture settings straight from a photo's bytes — locally.",
    glyph: "i",
    tags: ["exif", "photo"]
  },
  // ——— creative ———
  {
    id: "palette-generator",
    category: "creative",
    title: "Color Palette Generator",
    tagline: "Harmonious palettes from a seed color, with copy-ready CSS.",
    desc: "Generate tuned 5-color palettes from any seed using perceptual lightness matching. Export CSS variables, Tailwind or a PNG swatch sheet.",
    glyph: "◐",
    tags: ["harmony", "css"]
  },
  {
    id: "gradient-editor",
    category: "creative",
    title: "Gradient Editor",
    tagline: "Design CSS gradients with a visual editor and live preview.",
    desc: "Stack color stops, adjust angle and easing, and copy the generated CSS. Fine-tune with per-stop color pickers. Live preview as you adjust.",
    glyph: "◨",
    tags: ["css", "stops"]
  },
  {
    id: "shadow-generator",
    category: "creative",
    title: "CSS Shadow Generator",
    tagline: "Compose layered box-shadows and copy the code instantly.",
    desc: "Tune offset, blur, spread, color and opacity for multiple stacked shadows. Preview against a light or dark canvas and copy one line of CSS.",
    glyph: "◐",
    tags: ["box-shadow", "layers"]
  },
  {
    id: "favicon-generator",
    category: "creative",
    title: "Favicon Generator",
    tagline: "Draw a favicon and export .ico / PNG at every needed size.",
    desc: "Draw a 32×32 icon on a pixel grid, or start from a letter and a color, then export PNG sizes 16–512 and a bundled .ico file.",
    glyph: "◆",
    tags: ["ico", "pixel-art"]
  },
  // ——— writing ———
  {
    id: "markdown-editor",
    category: "writing",
    title: "Markdown Editor",
    tagline: "Split-pane Markdown writing with live, rendered preview.",
    desc: "Write Markdown with a synced editor and live preview. Export the rendered HTML or the raw .md file — everything stays in the tab.",
    glyph: "M↓",
    tags: ["live-preview", "export"]
  },
  {
    id: "word-counter",
    category: "writing",
    title: "Word Counter",
    tagline: "Words, characters, sentences, reading time — as you type.",
    desc: "Live counts for words, characters (with and without spaces), sentences and paragraphs, plus a reading-time estimate.",
    glyph: "¶",
    tags: ["counts", "reading-time"]
  },
  {
    id: "csv-json",
    category: "writing",
    title: "CSV ↔ JSON Converter",
    tagline: "Convert CSV to JSON and back, with smart type inference.",
    desc: "Parse CSV (with quoted fields and commas inside) into a JSON array with automatic number/boolean inference — or generate CSV from JSON.",
    glyph: "⇄",
    tags: ["parse", "infer"]
  },
  {
    id: "text-formatter",
    category: "writing",
    title: "Structured Text Formatter",
    tagline: "Tidy raw text into clean, shareable formats.",
    desc: "Trim whitespace, collapse blank lines, join lines, sort, dedupe, slugify, normalize quotes — a utility drawer for cleaning up crummy text.",
    glyph: "Aa",
    tags: ["clean", "bulk"]
  }
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function getTool(id) {
  return TOOLS.find((t) => t.id === id);
}

const importers = import.meta.glob("./modules/*.js");

export async function loadToolModule(id) {
  if (importers[`./modules/${id}.js`]) {
    return importers[`./modules/${id}.js`]();
  }
  throw new Error(`Tool module not found: ${id}`);
}