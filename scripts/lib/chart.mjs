import { C } from "./theme.mjs";
import { txt } from "./type.mjs";

const fmt = (n) => Math.round(n).toLocaleString("en-US");

export function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// Rating history line with a travelling dot. `id` keeps gradient ids unique inside one SVG.
export function ratingChart({ x, y, w, h, values, id, empty = "rating history appears after the first live sync" }) {
  if (!values || values.length < 2) {
    return `<path d="M${x} ${y + h / 2}H${x + w}" stroke="${C.tiffany}" stroke-opacity=".35" stroke-dasharray="4 7" stroke-width="1.6"/>` +
      txt(empty, { x: x + w / 2, y: y + h / 2 - 12, size: 14, weight: 500, fill: C.dim, anchor: "middle" });
  }
  const lo = Math.floor((Math.min(...values) - 40) / 50) * 50, hi = Math.ceil((Math.max(...values) + 40) / 50) * 50;
  const X = (i) => x + 34 + (i / (values.length - 1)) * (w - 34), Y = (v) => y + h - ((v - lo) / (hi - lo)) * h;
  const pts = values.map((v, i) => [X(i), Y(v)]);
  const line = smooth(pts);
  const last = pts[pts.length - 1];
  let o = `<defs><linearGradient id="rc${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.tiffany}" stop-opacity=".28"/><stop offset="1" stop-color="${C.tiffany}" stop-opacity="0"/></linearGradient></defs>`;
  [lo, hi].forEach((v) => {
    o += `<path d="M${x + 34} ${Y(v)}H${x + w}" stroke="${C.tiffany}" stroke-opacity=".18" stroke-dasharray="2 6"/>` + txt(fmt(v), { x: x + 26, y: Y(v) + 4, size: 12, weight: 500, fill: C.dim, anchor: "end" });
  });
  o += `<path d="${line}L${last[0]} ${y + h}L${pts[0][0]} ${y + h}Z" fill="url(#rc${id})"/>`;
  o += `<path d="${line}" fill="none" stroke="${C.tiffany}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  o += `<circle cx="${last[0]}" cy="${last[1]}" r="5.5" fill="${C.gold}"/><circle cx="${last[0]}" cy="${last[1]}" r="6" fill="none" stroke="${C.gold}"><animate attributeName="r" values="6;16;6" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="2.8s" repeatCount="indefinite"/></circle>`;
  o += `<g opacity="0"><circle r="12" fill="url(#tok)"/><circle r="3.4" fill="${C.tokCore}"/><animateMotion path="${line}" dur="7s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.92;1" dur="7s" repeatCount="indefinite"/></g>`;
  return o;
}
