// Shared drawing kit. Every panel is a Canvas of positioned items; a Canvas is later cut into slices so that
// only the real links (buttons, platform names) are clickable and the rest of the art is plain, non-clickable image.
import fs from "node:fs";
import path from "node:path";
import { txt, measure, wrap } from "../lib/type.mjs";

export { measure, wrap };
export const W = 830; // width of the README column the art is drawn for; the images scale with the page
export const K = { pearl: "#EEF1FA", mist: "#A9B1C6", dim: "#717A92", blue: "#7C9BFF", aqua: "#A9BEFF", acc: "#B388FF", accHi: "#DCC8FF" }; // the one warm-free accent (violet); change it here to recolour every panel
export const NF = "rgba(6,8,13,.88)"; // fill of diagram nodes
export const f = (v) => Math.round(v * 10) / 10;
export const g3 = (v) => Math.round(v * 1000) / 1000;
export const fmt = (v) => Math.round(v).toLocaleString("en-US");
export const T = (s, x, y, o = {}) => txt(s, { x, y, size: 11, fill: K.pearl, ...o });
export const MO = (s, x, y, o = {}) => txt(s, { x, y, size: 8, font: "mono", weight: 500, fill: K.mist, ...o });

// Gradients several panels share. An item that uses one passes it as `defs`.
export const D = {
  cor: `<linearGradient id="cor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EADBFF"/><stop offset=".5" stop-color="#B388FF"/><stop offset="1" stop-color="#8A5CF6"/></linearGradient>`,
  blu: `<linearGradient id="blu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#C9D8FF"/><stop offset="1" stop-color="#7C9BFF"/></linearGradient>`,
  btn: `<linearGradient id="btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C73F7"/><stop offset="1" stop-color="#7448E4"/></linearGradient>`,
  pr: `<linearGradient id="pr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>`,
};

export class Canvas {
  constructor(name, w, h) { this.name = name; this.w = w; this.h = h; this.items = []; this.links = []; this.cuts = []; this.n = 0; }
  id(p = "i") { return `${p}${this.n++}`; }
  add(svg, bbox, o = {}) { this.items.push({ svg, bbox, defs: o.defs ?? "", theme: o.theme }); return this; }
  // a clickable rectangle; grown by 1px so the anti-aliased edge of a button is never clipped
  link(r, url, alt) { // grown by 1px sideways so the anti-aliased edge of a button is never clipped
    const x = Math.max(0, Math.floor(r.x) - 1);
    this.links.push({ x, y: Math.round(r.y), w: Math.min(this.w, Math.ceil(r.x + r.w) + 1) - x, h: Math.round(r.h), url, alt });
  }
  cut(y) { this.cuts.push(Math.round(y)); }
}

const hits = (it, [x, y, w, h]) => it.bbox[0] < x + w && it.bbox[0] + it.bbox[2] > x && it.bbox[1] < y + h && it.bbox[1] + it.bbox[3] > y;

// One slice of a canvas as a standalone SVG: only the items that touch the slice, only the defs they need.
export function crop(cv, box, theme) {
  const hit = cv.items.filter((it) => hits(it, box) && (!it.theme || it.theme === theme));
  const defs = [...new Set(hit.flatMap((i) => (Array.isArray(i.defs) ? i.defs : [i.defs])).filter(Boolean))].join("");
  const [x, y, w, h] = box;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ""}${hit.map((i) => i.svg).join("")}</svg>`;
  if (/NaN|undefined|Infinity/.test(svg)) throw new Error(`Bad number in ${cv.name}`);
  return process.env.STATIC_SVG === "1" ? svg.replace(/<animate(?:Transform|Motion)?\b[^>]*\/>/g, "") : svg; // STATIC_SVG=1 is only for pixel-exact tests
}

export const MINBAND = 62; // 62px * 0.39 (a 320px phone) is still 24px
// Horizontal bands between every cut and every link edge; inside a band, link rectangles become their own pieces.
export function bands(cv) {
  const ys = [...new Set([0, cv.h, ...cv.cuts, ...cv.links.flatMap((l) => [l.y, l.y + l.h])])].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < ys.length - 1; i++) {
    const [y0, y1] = [ys[i], ys[i + 1]];
    const ls = cv.links.filter((l) => l.y <= y0 && l.y + l.h >= y1).sort((a, b) => a.x - b.x);
    const pieces = []; let x = 0;
    for (const l of ls) { if (l.x > x) pieces.push({ x, w: l.x - x }); pieces.push({ x: l.x, w: l.w, link: l }); x = l.x + l.w; }
    if (x < cv.w) pieces.push({ x, w: cv.w - x });
    out.push({ y: y0, h: y1 - y0, pieces });
  }
  while (out.length > 1 && out[out.length - 1].h < MINBAND) { const l = out.pop(); out[out.length - 1].h += l.h; } // a thin last band is absorbed by the band above it
  // A browser never draws a line shorter than ~24px, so a thin band in the middle of a panel would show as a gap on narrow pages.
  out.slice(0, -1).forEach((b) => { if (b.h < MINBAND) throw new Error(`${cv.name}: band at y=${b.y} is ${b.h}px tall, needs at least ${MINBAND}px`); });
  return out;
}

// Writes every slice of a canvas. Slices that carry the section title exist twice (dark and light page), chosen by <picture>.
export function writeSlices(cv, dir) {
  return bands(cv).map((b, bi) => b.pieces.map((p, pi) => {
    const box = [p.x, b.y, p.w, b.h], name = `${cv.name}-${String(bi).padStart(2, "0")}${"abcdefgh"[pi]}`;
    const themed = cv.items.some((it) => it.theme && hits(it, box));
    const files = themed ? { d: `${name}-d.svg`, l: `${name}-l.svg` } : { s: `${name}.svg` };
    if (themed) { fs.writeFileSync(path.join(dir, files.d), crop(cv, box, "dark")); fs.writeFileSync(path.join(dir, files.l), crop(cv, box, "light")); }
    else fs.writeFileSync(path.join(dir, files.s), crop(cv, box));
    return { ...files, w: p.w, h: b.h, link: p.link };
  }));
}

// ---- glass: the v4 frosted glass (blurred colour blobs over a navy base, darker toward the bottom, sheen + hairline edge) ----
const S0 = .665; // v4 cards were drawn 1200px wide and shown at ~0.665, so blob sizes are kept in that space
const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const BLOBS = ["#3A55B8", "#7E4FD6", "#3F7F9A", "#5C4FA3"], BOP = [.40, .30, .20, .26];
export function glass(cv, x, y, w, h, r, seed) {
  const id = cv.id("g"), w0 = w / S0, h0 = h / S0, r0 = r / S0, Rn = rng(hash(seed));
  const n = Math.max(3, Math.round(h0 / 240) + 2), off = Math.floor(Rn() * 4);
  const clip = `<clipPath id="${id}c"><rect width="${f(w0)}" height="${f(h0)}" rx="${f(r0)}"/></clipPath>`;
  const place = (inner) => `<g transform="translate(${x} ${y}) scale(${S0})"><g clip-path="url(#${id}c)">${inner}</g></g>`;
  const Q = (fill) => `<rect width="${f(w0)}" height="${f(h0)}" fill="${fill}"/>`;
  cv.add(place(Q(`url(#${id}base)`)), [x, y, w, h], { defs: [clip, `<linearGradient id="${id}base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#171B29"/><stop offset="1" stop-color="#090B12"/></linearGradient>`] });
  for (let i = 0; i < n; i++) {
    const k = (i + off) % 4, rr = Math.min(300, Math.max(130, h0 * .36)) * (.8 + Rn() * .55) * 1.35;
    const cx = Math.round(Rn() * w0), cy = Math.round(((i + Rn() * .7) / n) * h0), op = BOP[k];
    const dx = Math.round((Rn() - .5) * 150), dy = Math.round((Rn() - .5) * 110), dur = 20 + Math.round(Rn() * 16), bg = Math.round(Rn() * dur);
    // a blob is its own item, so a slice that can never see it does not carry (or animate) it
    const bx0 = Math.max(x, x + (cx - rr - Math.abs(dx)) * S0), by0 = Math.max(y, y + (cy - rr - Math.abs(dy)) * S0), bx1 = Math.min(x + w, x + (cx + rr + Math.abs(dx)) * S0), by1 = Math.min(y + h, y + (cy + rr + Math.abs(dy)) * S0);
    if (bx1 <= bx0 || by1 <= by0) continue;
    const grad = `<radialGradient id="${id}r${i}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${Math.round(rr)}"><stop offset="0" stop-color="${BLOBS[k]}" stop-opacity="${op}"/><stop offset=".35" stop-color="${BLOBS[k]}" stop-opacity="${g3(op * .72)}"/><stop offset=".7" stop-color="${BLOBS[k]}" stop-opacity="${g3(op * .22)}"/><stop offset="1" stop-color="${BLOBS[k]}" stop-opacity="0"/></radialGradient>`;
    // slow drift on its own loop; the negative begin spreads the phases so a card is never in a "start" pose
    const rect = `<rect x="${Math.round(cx - rr)}" y="${Math.round(cy - rr)}" width="${Math.round(2 * rr)}" height="${Math.round(2 * rr)}" fill="url(#${id}r${i})"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};${-Math.round(dx * .6)} ${Math.round(dy * .7)};0 0" keyTimes="0;.33;.66;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1" dur="${dur}s" begin="-${bg}s" repeatCount="indefinite"/></rect>`;
    cv.add(place(rect), [bx0, by0, bx1 - bx0, by1 - by0], { defs: [clip, grad] });
  }
  const tail = `<linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient><linearGradient id="${id}sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="${id}edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>`;
  cv.add(`<g transform="translate(${x} ${y}) scale(${S0})"><g clip-path="url(#${id}c)">${Q(`url(#${id}fade)`)}${Q(`url(#${id}sheen)`)}</g><rect x=".6" y=".6" width="${f(w0 - 1.2)}" height="${f(h0 - 1.2)}" rx="${f(r0 - .6)}" fill="none" stroke="url(#${id}edge)" stroke-width="1.2"/></g>`, [x, y, w, h], { defs: [clip, tail] });
}

// ---- boxed section: plain title on the page background + every card of the section inside ONE thin box ----
export const MARG = 18, HEAD = 50, PADB = 16;
export function boxed(name, title, note, bodyH) {
  const boxH = HEAD + bodyH + PADB, cv = new Canvas(name, W, MARG + boxH), y0 = MARG + HEAD, ty = MARG + 31;
  cv.add(`<rect x=".5" y="${MARG + .5}" width="${W - 1}" height="${boxH - 1}" rx="16" fill="none" stroke="#8b949e" stroke-opacity=".3"/>`, [0, MARG, W, boxH]);
  cv.cut(y0); // the header is its own slice, so it can exist in a dark and a light version
  const tw = measure(title, { font: "display", weight: 700, size: 15 }), nw = note ? measure(note, { size: 9.5 }) : 0;
  const x1 = 22 + tw + 12, x2 = note ? W - 22 - nw - 12 : W - 22;
  for (const [theme, tc, nc, hc, ho] of [["dark", "#fff", K.mist, K.blue, .2], ["light", "#1F2328", "#57606A", "#0969DA", .3]]) {
    cv.add(T(title, 22, ty, { size: 15, font: "display", weight: 700, fill: tc }) + `<path d="M${f(x1)} ${ty - 4}H${f(x2)}" stroke="${hc}" stroke-opacity="${ho}"/>` + (note ? T(note, W - 22, ty - 1, { size: 9.5, fill: nc, anchor: "end" }) : ""), [0, MARG, W, HEAD], { theme });
  }
  return { cv, y0 };
}
