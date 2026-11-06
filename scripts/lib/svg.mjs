import { C, DEFS, esc } from "./theme.mjs";
import * as si from "simple-icons";

// Every panel is a borderless card on a black canvas. Stacked canvases join into one black page.
export const M = 24; // black margin around each card

const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

// Frosted glass: a blurred "photo" of colour blobs, darkened toward the bottom, then a sheen and a hairline edge.
// (SVG images cannot use backdrop-filter, so the blur is painted directly behind the panel.)
export function glass(w, h, radius, seed, id = "g") {
  const R = rng(hash(seed));
  const n = Math.max(3, Math.round(h / 240) + 2);
  const cols = C.blobs ?? [C.tiffany, C.gold, C.mist, C.aqua];
  const ops = C.blobOp ?? [0.4, 0.3, 0.2, 0.25];
  // soft colour blobs painted with radial gradients: the same look as a heavy blur, without a filter
  let blobs = "", grads = "";
  const off = Math.floor(R() * 4);
  for (let i = 0; i < n; i++) {
    const k = (i + off) % cols.length;
    const r = Math.min(300, Math.max(130, h * 0.36)) * (0.8 + R() * 0.55) * 1.35;
    const cx = (R() * w).toFixed(0), cy = (((i + R() * 0.7) / n) * h).toFixed(0), op = ops[k];
    grads += `<radialGradient id="${id}r${i}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r.toFixed(0)}"><stop offset="0" stop-color="${cols[k]}" stop-opacity="${op}"/><stop offset=".35" stop-color="${cols[k]}" stop-opacity="${(op * 0.72).toFixed(3)}"/><stop offset=".7" stop-color="${cols[k]}" stop-opacity="${(op * 0.22).toFixed(3)}"/><stop offset="1" stop-color="${cols[k]}" stop-opacity="0"/></radialGradient>`;
    const dx = (14 + R() * 26).toFixed(0), dy = (10 + R() * 20).toFixed(0), dur = (26 + R() * 22).toFixed(0);
    blobs += `<rect x="${(cx - r).toFixed(0)}" y="${(cy - r).toFixed(0)}" width="${(2 * r).toFixed(0)}" height="${(2 * r).toFixed(0)}" fill="url(#${id}r${i})"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} -${dy};-${dx} ${dy};0 0" keyTimes="0;.33;.66;1" dur="${dur}s" repeatCount="indefinite"/></rect>`;
  }
  const defs = `<clipPath id="${id}c"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
${grads}
<linearGradient id="${id}base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#171B29"/><stop offset="1" stop-color="#090B12"/></linearGradient>
<linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
<linearGradient id="${id}sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>`;
  const body = `<g clip-path="url(#${id}c)">
<rect width="${w}" height="${h}" fill="url(#${id}base)"/>
<g>${blobs}</g>
<rect width="${w}" height="${h}" fill="url(#${id}fade)"/>
<rect width="${w}" height="${h}" fill="url(#${id}sheen)"/>
</g>
<rect x=".6" y=".6" width="${w - 1.2}" height="${h - 1.2}" rx="${radius - 0.6}" fill="none" stroke="url(#${id}edge)" stroke-width="1.2"/>`;
  return { defs, body };
}

export function frame(w, h, inner, { label = "", extraDefs = "", radius = 26, m = M } = {}) {
  const W = w + 2 * m, H = h + 2 * m;
  const g = glass(w, h, radius, label || `${w}x${h}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>${DEFS}${g.defs}${extraDefs}</defs>
<rect width="${W}" height="${H}" fill="${C.page}"/>
<g transform="translate(${m} ${m})">
${g.body}
${inner}
</g>
</svg>`;
}

// ---- icons -----------------------------------------------------------------
// Brand marks come from simple-icons (embedded as paths, no network at render time).
// Anything without a brand mark gets a hand-drawn 24x24 line glyph.
const SI = (key) => si[key]?.path;

const GLYPH = {
  rag: `<path d="M5 6H19L12 18Z"/><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="19" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="18" r="2" fill="currentColor"/>`,
  vector: `<path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>`,
  mcp: `<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4"/>`,
  llm: `<path d="M12 3l2.3 6.4L21 12l-6.7 2.6L12 21l-2.3-6.4L3 12l6.7-2.6z"/>`,
  rest: `<path d="M8.5 4C6.5 4 5.5 5 5.5 7v2c0 1.5-.8 3-2.5 3 1.7 0 2.5 1.5 2.5 3v2c0 2 1 3 3 3M15.5 4c2 0 3 1 3 3v2c0 1.5.8 3 2.5 3-1.7 0-2.5 1.5-2.5 3v2c0 2-1 3-3 3"/>`,
  cloud: `<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 8.5a4.25 4.25 0 0 1 .5 8.5z"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>`,
  pin: `<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7.5l8 6 8-6"/>`,
  linkedin: `<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M8 10.5V16M8 7.6v.1M12 16v-5.5M12 13c0-1.7 1-2.7 2.5-2.7S17 11.2 17 13v3"/>`,
  dsa: `<circle cx="12" cy="5" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M11 7.1l-4 8.8M13 7.1l4 8.8"/>`,
  oop: `<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>`,
  sysdesign: `<rect x="3" y="3" width="7" height="6" rx="1.6"/><rect x="14" y="3" width="7" height="6" rx="1.6"/><rect x="8.5" y="15" width="7" height="6" rx="1.6"/><path d="M6.5 9v3h11V9M12 12v3"/>`,
  os: `<rect x="6" y="6" width="12" height="12" rx="2.2"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>`,
  dbms: `<rect x="3" y="4" width="18" height="16" rx="2.6"/><path d="M3 10h18M3 15h18M10 4v16"/>`,
  network: `<circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.6 7.4l3.6 3.2M17.4 7.4l-3.6 3.2M6.6 16.6l3.6-3.2M17.4 16.6l-3.6-3.2"/>`,
  vscode: `<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14"/>`,
  star: `<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>`,
  commit: `<circle cx="12" cy="12" r="3.4"/><path d="M3 12h5.6M15.4 12H21"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  github: null,
};

const SIKEY = {
  python: "siPython", java: "siOpenjdk", cpp: "siCplusplus", typescript: "siTypescript", javascript: "siJavascript",
  react: "siReact", nextjs: "siNextdotjs", tailwind: "siTailwindcss", html5: "siHtml5", css3: "siCss", framer: "siFramer",
  nodejs: "siNodedotjs", express: "siExpress", fastapi: "siFastapi", graphql: "siGraphql", mongodb: "siMongodb",
  postgres: "siPostgresql", mysql: "siMysql", langchain: "siLangchain", langgraph: "siLanggraph", docker: "siDocker",
  kubernetes: "siKubernetes", git: "siGit", github: "siGithub", postman: "siPostman", vercel: "siVercel",
  actions: "siGithubactions", x: "siX", leetcode: "siLeetcode", gmail: "siGmail",
};

const CUSTOM_BRAND = {
  cloud: "#FF9900", vscode: "#007ACC", rest: "#49A942", rag: "#8B5CF6", vector: "#06B6D4", llm: "#FF5A36",
  dsa: "#16A34A", oop: "#F59E0B", sysdesign: "#6366F1", os: "#64748B", dbms: "#0EA5E9", network: "#14B8A6",
};
// The real brand colour of a skill (simple-icons hex), or a fixed colour for concepts without a logo.
const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const lighten = (hex, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) + (255 - parseInt(hex.slice(i, i + 2), 16)) * t).toString(16).padStart(2, "0")).join("");
export function brandColor(name) {
  const k = SIKEY[name];
  let hex = k && si[k]?.hex ? "#" + si[k].hex : CUSTOM_BRAND[name] ?? C.tiffany;
  // brands that are black or very dark (Next.js, Vercel, GitHub) read as white on dark glass; others are lightened just enough
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (lum(hex) < 0.1 && Math.max(r, g, b) - Math.min(r, g, b) < 40) return "#FFFFFF";
  for (let t = 0; t <= 0.7 && lum(hex) < 0.34; t += 0.05) hex = lighten("#" + (k && si[k]?.hex ? si[k].hex : hex.slice(1)), t + 0.05);
  return hex;
}

export function hasIcon(name) {
  return !!(GLYPH[name] || (SIKEY[name] && SI(SIKEY[name])));
}

// Draws an icon inside a size x size box whose top-left is (x, y).
export function icon(name, x, y, size, color) {
  const s = size / 24;
  if (GLYPH[name]) {
    return `<g transform="translate(${x} ${y}) scale(${s})" color="${color}" fill="none" stroke="${color}" stroke-width="${(1.7).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${GLYPH[name]}</g>`;
  }
  const d = SI(SIKEY[name]);
  if (!d) throw new Error(`No icon for "${name}"`);
  // JavaScript's mark is a yellow square with the letters cut out: put black behind it so the letters read
  const under = name === "javascript" ? `<rect transform="translate(${x} ${y}) scale(${s})" width="24" height="24" fill="#1A1A1A"/>` : "";
  return `${under}<path transform="translate(${x} ${y}) scale(${s})" d="${d}" fill="${color}"/>`;
}
