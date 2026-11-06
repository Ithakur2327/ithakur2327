import { C, esc, DEFS } from "../lib/theme.mjs";
import { icon, glass, M } from "../lib/svg.mjs";
import { txt, measure } from "../lib/type.mjs";

const CANVAS = 1200 + 2 * M; // same width as every full-width panel
const H = 60, GAP = 16;

// The row of buttons is built so the black canvases tile edge to edge: widths are exact shares of the row.
export function linkRow(links) {
  const pills = links.map((l) => ({ ...l, w: Math.ceil(30 + 24 + 12 + measure(l.label, { size: 22, weight: 600 }) + 32) }));
  const total = pills.reduce((a, p) => a + p.w, 0) + GAP * (pills.length - 1);
  const edge = (CANVAS - total) / 2;
  return pills.map((p, i) => {
    const padL = i === 0 ? edge : GAP / 2;
    const padR = i === pills.length - 1 ? edge : GAP / 2;
    const w = p.w + padL + padR, h = H + 2 * M;
    const g = glass(p.w, H, H / 2, "pill" + p.id, "p");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(2)}" height="${h}" viewBox="0 0 ${w.toFixed(2)} ${h}" role="img" aria-label="${esc(p.label)}">
<title>${esc(p.label)}</title>
<defs>${DEFS}${g.defs}<clipPath id="sc"><rect width="${p.w}" height="${H}" rx="${H / 2}"/></clipPath><linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="${w.toFixed(2)}" height="${h}" fill="${C.page}"/>
<g transform="translate(${padL.toFixed(2)} ${M})">
${g.body}
<g clip-path="url(#sc)"><rect x="-70" y="-4" width="60" height="${H + 8}" fill="url(#shine)" transform="skewX(-18)"><animate attributeName="x" values="-90;${p.w + 40}" dur="5s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite"/></rect></g>
${icon(p.icon, 30, (H - 24) / 2, 24, C.aqua)}
${txt(p.label, { x: 30 + 24 + 12, y: H / 2 + 8, size: 22, weight: 600, fill: C.title })}
</g>
</svg>`;
    return { id: p.id, url: p.url, label: p.label, svg, pct: (w / CANVAS) * 100 };
  });
}
