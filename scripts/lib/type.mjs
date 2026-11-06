// Text is converted to vector outlines so every panel looks identical on every device.
import * as ot from "opentype.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const lib = ot.default ?? ot;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (pkg, file) => {
  const b = fs.readFileSync(path.join(ROOT, "node_modules/@fontsource", pkg, "files", file));
  return lib.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

const FONTS = {
  // "display" and "body" are both Inter: the closest open match to Apple's SF Pro
  display: {
    600: load("inter", "inter-latin-600-normal.woff"),
    700: load("inter", "inter-latin-700-normal.woff"),
    800: load("inter", "inter-latin-800-normal.woff"),
  },
  body: {
    400: load("inter", "inter-latin-400-normal.woff"),
    500: load("inter", "inter-latin-500-normal.woff"),
    600: load("inter", "inter-latin-600-normal.woff"),
    700: load("inter", "inter-latin-700-normal.woff"),
  },
  mono: {
    400: load("geist-mono", "geist-mono-latin-400-normal.woff"),
    500: load("geist-mono", "geist-mono-latin-500-normal.woff"),
    600: load("geist-mono", "geist-mono-latin-600-normal.woff"),
  },
};

// charToGlyph avoids opentype's GSUB/bidi pass, which throws on some fonts' contextual lookups.
const glyphsOf = (f, s) => Array.from(String(s)).map((ch) => f.charToGlyph(ch));
const kern = (f, a, b) => {
  try {
    return f.getKerningValue(a, b) || 0;
  } catch {
    return 0;
  }
};

const pick = (font, weight) => {
  const set = FONTS[font];
  if (set[weight]) return set[weight];
  const keys = Object.keys(set).map(Number);
  const near = keys.reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
  return set[near];
};

export function measure(s, o = {}) {
  const { font = "body", weight = 400, size = 16, ls = 0, italic = false } = o;
  const f = pick(font, weight);
  const sc = size / f.unitsPerEm;
  const g = glyphsOf(f, s);
  let w = 0;
  for (let i = 0; i < g.length; i++) {
    w += g[i].advanceWidth * sc;
    if (i < g.length - 1) w += kern(f, g[i], g[i + 1]) * sc + ls;
  }
  return w;
}

// Returns a single <path> for the string.
export function txt(s, o = {}) {
  const { x = 0, y = 0, size = 16, font = "body", weight = 400, italic = false, fill = "#fff", anchor = "start", ls = 0, opacity, extra = "" } = o;
  const f = pick(font, weight);
  const sc = size / f.unitsPerEm;
  const g = glyphsOf(f, s);
  const total = measure(s, o);
  let cx = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  let d = "";
  for (let i = 0; i < g.length; i++) {
    d += g[i].getPath(cx, y, size).toPathData(1);
    cx += g[i].advanceWidth * sc;
    if (i < g.length - 1) cx += kern(f, g[i], g[i + 1]) * sc + ls;
  }
  return `<path d="${d}" fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ""}${extra ? " " + extra : ""}/>`;
}

// Greedy word wrap by measured width.
export function wrap(s, maxW, o = {}) {
  const words = String(s).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (measure(t, o) <= maxW || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Multi-line helper.
export function block(lines, o = {}) {
  const { lh = 30, y = 0 } = o;
  return lines.map((l, i) => txt(l, { ...o, y: y + i * lh })).join("\n");
}
