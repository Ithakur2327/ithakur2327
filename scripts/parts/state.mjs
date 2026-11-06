import { C } from "../lib/theme.mjs";
import { frame } from "../lib/svg.mjs";
import { txt, measure } from "../lib/type.mjs";

// The "right now" card is written as the typed state of an agent: it is how I think about systems.
export function state(p) {
  const W = 1200, size = 24, lh = 46, top = 108;
  const cw = measure("M", { font: "mono", size });
  const gx = 64, cx0 = 128; // gutter x, code x
  const lines = [];
  const num = (i) => txt(String(i + 1), { x: gx + 22, y: top + i * lh, size: 18, font: "mono", fill: C.dim, anchor: "end" });

  // line 1: class Indresh(TypedDict):
  let x = cx0;
  const seg = (s, fill, weight = 400) => {
    const out = txt(s, { x, y: top, size, font: "mono", weight, fill });
    x += cw * s.length;
    return out;
  };
  let out = num(0);
  out += seg("class ", C.gold, 500) + seg("Indresh", C.champagne, 500) + seg("(", C.mist) + seg("TypedDict", C.aqua) + seg("):", C.mist);

  const keyW = Math.max(...p.state.map(([k]) => k.length)) + 1; // include colon
  p.state.forEach(([k, v], i) => {
    const y = top + (i + 1) * lh;
    out += num(i + 1);
    let xx = cx0 + cw * 4;
    out += txt(k + ":", { x: xx, y, size, font: "mono", weight: 500, fill: C.aqua });
    xx += cw * (keyW + 2);
    out += txt('"', { x: xx, y, size, font: "mono", fill: C.gold });
    xx += cw;
    out += txt(v, { x: xx, y, size, font: "mono", fill: C.pearl });
    xx += cw * v.length;
    out += txt('"', { x: xx, y, size, font: "mono", fill: C.gold });
    if (i === p.state.length - 1) out += `<rect x="${xx + cw * 1.5}" y="${y - size * 0.86}" width="${cw * 0.62}" height="${size * 1.06}" rx="2" fill="${C.gold}"><animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite"/></rect>`;
  });

  const H = top + (p.state.length + 1) * lh + 28;
  // soft guide rail beside the fields
  const rail = `<path d="M${cx0 + cw * 1.2} ${top + 18}V${top + p.state.length * lh + 6}" stroke="${C.tiffany}" stroke-opacity=".22" stroke-dasharray="3 6"/>`;
  return frame(W, H, `${rail}${out}`, { label: `Right now: ${p.state.map(([k, v]) => `${k}, ${v}`).join("; ")}.` });
}
