// Diagram engine. A connector is drawn from the edge of one box to the edge of the next, and boxes are painted after the
// connectors, so the moving light (a shine plus optional tiny dots) can only ever travel on the line, never inside a box.
import { K, NF, f, g3, T, MO } from "./core.mjs";
import { icon, brandColor } from "../lib/svg.mjs";
import { mix } from "../lib/color.mjs";

const DARK = "#0b0e14";
const bnd = (n, t) => {
  const dx = t[0] - n.x, dy = t[1] - n.y;
  if (!dx && !dy) return [n.x, n.y];
  if (n.shape === "circle") { const L = Math.hypot(dx, dy); return [n.x + dx / L * n.r, n.y + dy / L * n.r]; }
  const k = n.shape === "diamond" ? 1 / (Math.abs(dx) / (n.w / 2) + Math.abs(dy) / (n.h / 2)) : 1 / Math.max(Math.abs(dx) / (n.w / 2), Math.abs(dy) / (n.h / 2));
  return [n.x + dx * k, n.y + dy * k];
};
const plen = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
function rpath(p, r = 5) {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [a, b, c] = [p[i - 1], p[i], p[i + 1]], l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), rr = Math.min(r, l1 / 2, l2 / 2);
    d += `L${f(b[0] + (a[0] - b[0]) / l1 * rr)} ${f(b[1] + (a[1] - b[1]) / l1 * rr)}Q${f(b[0])} ${f(b[1])} ${f(b[0] + (c[0] - b[0]) / l2 * rr)} ${f(b[1] + (c[1] - b[1]) / l2 * rr)}`;
  }
  return d + `L${f(p[p.length - 1][0])} ${f(p[p.length - 1][1])}`;
}
function arrow(tip, from, c) {
  const dx = tip[0] - from[0], dy = tip[1] - from[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, s = 4.2;
  return `<path d="M${f(tip[0])} ${f(tip[1])}L${f(tip[0] - ux * s - uy * s * .55)} ${f(tip[1] - uy * s + ux * s * .55)}L${f(tip[0] - ux * s + uy * s * .55)} ${f(tip[1] - uy * s - ux * s * .55)}Z" fill="${c}" fill-opacity=".9"/>`;
}

// One travelling shine (+ tiny dot) per connector: glide along the path, rest, repeat. Phases are spread with negative begin times.
function lights(d, L, i, c, hi, dots, phase) {
  const dur = Math.max(1.8, L / 34), per = dur + 1.4 + (i % 3) * .45, g = dur / per, bg = -(((i * .83) + phase * per) % per), Ls = Math.min(16, L * .5);
  const sh = (w, op, col) => `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${f(Ls)} ${f(L + Ls)}" stroke-dashoffset="${f(Ls)}"><animate attributeName="stroke-dashoffset" values="${f(Ls)};${f(-L)};${f(-L)}" keyTimes="0;${g3(g)};1" dur="${g3(per)}s" begin="${g3(bg)}s" repeatCount="indefinite"/></path>`;
  let s = sh(4, .28, c) + sh(1.6, 1, hi);
  if (dots) {
    const t = `dur="${g3(per)}s" begin="${g3(bg + .25)}s" repeatCount="indefinite"`;
    const m = Math.min(.35, 5 / L); // the dot only travels the stretch that is at least 5px away from both boxes
    const mot = `<animateMotion ${t} keyPoints="${g3(m)};${g3(1 - m)};${g3(1 - m)}" keyTimes="0;${g3(g)};1" calcMode="linear" path="${d}"/><animate attributeName="opacity" ${t} values="0;1;1;0;0" keyTimes="0;${g3(g * .12)};${g3(g * .88)};${g3(g)};1"/>`;
    s += `<circle r="3.2" fill="${c}" fill-opacity=".25" opacity="0">${mot}</circle><circle r="1.3" fill="#fff" opacity="0">${mot}</circle>`;
  }
  return s;
}

function label(o) {
  if (!o.label) return "";
  const ls = o.label.split("\n"), s = o.size ?? 8.5;
  if (o.sub) return T(o.label, o.x, o.y - 1, { size: s, weight: 600, anchor: "middle" }) + MO(o.sub, o.x, o.y + 9.5, { size: 7.5, anchor: "middle" });
  const lh = s * 1.2, y0 = o.y - (ls.length - 1) * lh / 2 + s * .35;
  return ls.map((l, i) => T(l, o.x, y0 + i * lh, { size: s, weight: 600, anchor: "middle" })).join("");
}
function node(o) {
  const st = o.tone === "gold" ? K.acc : o.tone === "ghost" ? K.mist : K.blue, so = o.tone === "gold" ? .85 : o.tone === "ghost" ? .5 : .6;
  const S1 = `fill="${NF}" stroke="${st}" stroke-opacity="${so}" stroke-width="1"${o.tone === "ghost" ? ' stroke-dasharray="2.5 3"' : ""}`;
  const x0 = o.x - o.w / 2, y0 = o.y - o.h / 2;
  const cap = o.cap ? MO(o.cap, o.x, o.capY ?? o.y + o.h / 2 + 11, { anchor: "middle" }) : "";
  if (o.shape === "circle") return `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="${o.solid ? st : NF}" stroke="${st}"/>${o.solid ? `<circle cx="${o.x}" cy="${o.y}" r="${o.r * .4}" fill="${DARK}"/>` : ""}${cap}`;
  if (o.shape === "diamond") return `<polygon points="${o.x},${y0} ${o.x + o.w / 2},${o.y} ${o.x},${y0 + o.h} ${x0},${o.y}" ${S1} stroke-linejoin="round"/>${label(o)}`;
  if (o.shape === "cyl") { const ry = 5, rx = o.w / 2; return `<path d="M${x0} ${y0 + ry}V${y0 + o.h - ry}A${rx} ${ry} 0 0 0 ${x0 + o.w} ${y0 + o.h - ry}V${y0 + ry}" ${S1}/><ellipse cx="${o.x}" cy="${y0 + ry}" rx="${rx}" ry="${ry}" fill="#252d44" stroke="${st}" stroke-opacity="${so}"/>${label({ ...o, y: o.y + 3 })}`; }
  if (o.shape === "chip") return `<rect x="${x0}" y="${y0}" width="${o.w}" height="${o.h}" rx="${o.h / 2}" ${S1}/>${o.dot ? `<circle cx="${x0 + 9}" cy="${o.y}" r="2.2" fill="${K.acc}"/>` : ""}${T(o.label, o.x + (o.dot ? 5 : 0), o.y + 2.8, { size: o.size ?? 8, font: "mono", weight: 500, fill: o.tone === "gold" ? K.acc : K.aqua, anchor: "middle" })}`;
  if (o.shape === "custom") return o.draw(o);
  return `<rect x="${x0}" y="${y0}" width="${o.w}" height="${o.h}" rx="5" ${S1}/>${label(o)}`;
}

export function flow(nodes, edges, { under = "", over = "", dots = true } = {}) {
  nodes.forEach((o) => { if (o.shape === "circle") o.w = o.h = 2 * o.r; });
  const N = Object.fromEntries(nodes.map((o) => [o.id, o])), pt = (v) => (Array.isArray(v) ? { x: v[0], y: v[1], shape: "circle", r: 0 } : N[v]);
  let u = under;
  edges.forEach((e, i) => {
    const A = pt(e.from), B = pt(e.to), via = e.via || [];
    const p = [bnd(A, via[0] || [B.x, B.y]), ...via, bnd(B, via[via.length - 1] || [A.x, A.y])];
    const c = e.tone === "gold" ? K.acc : K.blue, hi = e.tone === "gold" ? "#F1E8FF" : "#EAF0FF", d = rpath(p), L = plen(p);
    u += `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${e.dash ? .55 : .45}" stroke-width="1.1"${e.dash ? ' stroke-dasharray="3 3.5"' : ""} stroke-linecap="round"/>`;
    if (!e.noArrow) {
      u += lights(d, L, i, c, hi, dots && e.dots !== false, 0);
      if (e.bi) u += lights(rpath([...p].reverse()), L, i, c, hi, dots && e.dots !== false, .5);
      u += arrow(p[p.length - 1], p[p.length - 2], c) + (e.bi ? arrow(p[0], p[1], c) : "");
    }
    if (e.label) u += MO(e.label.t, e.label.x, e.label.y, { anchor: e.label.anchor ?? "middle", fill: e.tone === "gold" ? K.acc : K.aqua });
  });
  return u + nodes.map(node).join("") + over;
}

// ---- hero: everything I build as an exploded full-stack (a different kind of picture from the project flowcharts) ----
// Four glass layers float one above the other. Thin rods join them between the layers and a leader line joins each layer to its label;
// the lights move on those lines only, so nothing ever travels over a layer.
let wireN = 0;
function wire(p, c) {
  const d = rpath(p, 0), L = plen(p);
  return `<path d="${d}" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.1" stroke-linecap="round"/>` + lights(d, L, wireN++, c, "#EAF0FF", true, 0);
}
function slab(cx, cy, a, b, t, col) {
  const P3 = (...p) => p.map((q) => q.join(",")).join(" ");
  const top = P3([cx, cy - b], [cx + a, cy], [cx, cy + b], [cx - a, cy]), lf = P3([cx - a, cy], [cx, cy + b], [cx, cy + b + t], [cx - a, cy + t]), rt = P3([cx + a, cy], [cx, cy + b], [cx, cy + b + t], [cx + a, cy + t]);
  return `<ellipse cx="${cx}" cy="${cy + b + t + 3}" rx="${a * .9}" ry="5" fill="${col}" fill-opacity=".10"/><polygon data-b="1" points="${lf}" fill="${mix(col, "#05070c", .6)}"/><polygon data-b="1" points="${rt}" fill="${mix(col, "#05070c", .74)}"/><polygon data-b="1" points="${top}" fill="${mix(col, "#0b0e14", .8)}" stroke="${col}" stroke-opacity=".9" stroke-linejoin="round"/>`
    + `<polygon points="${P3([cx, cy - b + 4], [cx + a - 9, cy], [cx, cy + b - 4], [cx - a + 9, cy])}" fill="none" stroke="${col}" stroke-opacity=".28"/>`;
}
export function heroDiagram() {
  const cx = 128, a = 60, b = 16, t = 6, sp = 47, cy = (i) => 17 + i * sp;
  const layers = [
    ["Frontend", "React · Next.js · Tailwind", K.blue, "react"],
    ["Backend", "FastAPI · Node.js · REST", "#5EC8F2", "fastapi"],
    ["GenAI agents", "LangGraph · MCP · RAG", K.acc, "llm"],
    ["Data", "PostgreSQL · MongoDB · vector DBs", "#4FD1C5", "postgres"],
  ];
  let u = "", o = "";
  layers.forEach(([title, sub, col, ic], i) => {
    const y = cy(i);
    if (i < layers.length - 1) for (const x of [cx - a, cx + a]) u += wire([[x, y + t], [x, cy(i + 1)]], col); // rods exist only between two layers
    u += wire([[cx + a + 6, y + 3], [232, y + 3]], col);                                                         // leader line to the label
    o += slab(cx, y, a, b, t, col) + icon(ic, cx - 7.5, y - 10, 15, brandColor(ic)) + T(title, 240, y, { size: 10, weight: 600, fill: i === 2 ? K.accHi : K.pearl }) + MO(sub, 240, y + 11, { size: 7.5 });
  });
  const y0 = cy(0) - b, y1 = cy(layers.length - 1) + b + t;
  return `<path d="M32 ${y0} H26 V${y1} H32" fill="none" stroke="${K.mist}" stroke-opacity=".4"/><g transform="translate(13 ${(y0 + y1) / 2}) rotate(-90)">${MO("full-stack apps", 0, 3, { anchor: "middle", size: 8, fill: K.dim })}</g>` + u + o;
}

// ---- project diagrams (392 x 126 each) ----
const FLOWFORGE = () => flow([
  { id: "tr", x: 38, y: 74, w: 46, h: 24, label: "Trigger" }, { id: "su", x: 102, y: 74, w: 56, h: 24, label: "Supervisor" },
  { id: "ag", x: 178, y: 74, w: 62, h: 28, label: "Specialist\nagents", size: 8 },
  { id: "ap", shape: "diamond", x: 266, y: 74, w: 72, h: 48, tone: "gold", label: "Human\napproval", size: 7.5 },
  { id: "dn", shape: "circle", x: 358, y: 74, r: 6, solid: true, cap: "done", capY: 94 },
  { id: "mcp", shape: "chip", x: 178, y: 42, w: 56, h: 14, label: "MCP tools", tone: "ghost" },
  { id: "mon", shape: "chip", x: 52, y: 114, w: 68, h: 14, label: "monitoring", dot: true, tone: "ghost" },
  { id: "db", x: 240, y: 114, w: 280, h: 16, label: "PostgreSQL checkpoints", size: 8.5, tone: "ghost" },
], [
  { from: "tr", to: "su" }, { from: "su", to: "ag" }, { from: "ag", to: "ap" }, { from: "ap", to: "dn", label: { t: "approved", x: 327, y: 68 } },
  { from: "ap", to: "su", via: [[266, 20], [102, 20]], dash: 1, tone: "gold", label: { t: "rejected: plan again", x: 184, y: 15 } },
  { from: "mcp", to: "ag", dash: 1, noArrow: 1 }, { from: "su", to: [108, 106], dash: 1, noArrow: 1 }, { from: "ag", to: [178, 106], dash: 1, noArrow: 1 },
  { from: "ap", to: [266, 106], dash: 1, noArrow: 1 }, { from: "mon", to: "db", dash: 1, noArrow: 1 },
]);
const QUERYPILOT = () => flow([
  { id: "q", x: 36, y: 50, w: 52, h: 24, label: "Question" }, { id: "gn", x: 110, y: 50, w: 56, h: 26, label: "Generate\nSQL", size: 8 },
  { id: "va", shape: "diamond", x: 188, y: 50, w: 70, h: 46, tone: "gold", label: "SQLGlot\ncheck", size: 7.5 },
  { id: "rv", x: 280, y: 50, w: 58, h: 26, tone: "gold", label: "Human\nreview", size: 8 }, { id: "rn", x: 280, y: 100, w: 60, h: 26, label: "Run on\nyour DB", size: 8 },
  { id: "ex", x: 198, y: 100, w: 58, h: 26, label: "Explain\nresult", size: 8 }, { id: "yo", shape: "circle", x: 130, y: 100, r: 6, solid: true, cap: "you", capY: 120 },
  { id: "c1", shape: "chip", x: 356, y: 78, w: 46, h: 13, label: "DuckDB", size: 7.5, tone: "ghost" }, { id: "c2", shape: "chip", x: 356, y: 98, w: 46, h: 13, label: "MySQL", size: 7.5, tone: "ghost" },
  { id: "c3", shape: "chip", x: 358, y: 118, w: 58, h: 13, label: "PostgreSQL", size: 7.5, tone: "ghost" },
], [
  { from: "q", to: "gn" }, { from: "gn", to: "va" }, { from: "va", to: "rv", label: { t: "valid", x: 237, y: 43 } }, { from: "rv", to: "rn" }, { from: "rn", to: "ex" }, { from: "ex", to: "yo" },
  { from: "va", to: "gn", via: [[188, 16], [110, 16]], dash: 1, tone: "gold", label: { t: "invalid: self-correct", x: 149, y: 11 } },
  { from: "rn", to: "c1", via: [[320, 100], [320, 78]], dash: 1, noArrow: 1 }, { from: "rn", to: "c2", dash: 1, noArrow: 1 }, { from: "rn", to: "c3", via: [[320, 100], [320, 118]], dash: 1, noArrow: 1 },
]);
const IVISION = () => flow([
  { id: "d", x: 60, y: 36, w: 62, h: 26, label: "Your\nsources", size: 8 }, { id: "e", x: 150, y: 36, w: 62, h: 26, label: "Chunk +\nembed", size: 8 },
  { id: "v", shape: "cyl", x: 244, y: 36, w: 60, h: 38, label: "Qdrant\nvector DB", size: 7.5 }, { id: "q", x: 60, y: 98, w: 62, h: 24, label: "Question" },
  { id: "r", x: 150, y: 98, w: 62, h: 26, label: "Retrieve\ntop-k", size: 8 }, { id: "l", x: 244, y: 98, w: 52, h: 26, tone: "gold", label: "LLM", sub: "Groq" },
  { id: "a", x: 334, y: 98, w: 66, h: 28, label: "Answer\n+ sources", size: 8 },
], [
  { from: "d", to: "e" }, { from: "e", to: "v" }, { from: "q", to: "r" }, { from: "r", to: "l" }, { from: "l", to: "a" },
  { from: "v", to: "r", via: [[244, 68], [150, 68]], dash: 1, tone: "gold", label: { t: "matching chunks", x: 197, y: 63 } },
]);
function HEALTH() {
  const xs = [52, 148, 244, 340], cy = 61, w = 66, h = 66, ttl = ["Intake", "Risk score", "Prevention", "Trends"];
  const frame = (o, i, inner) => `<rect x="${o.x - w / 2}" y="${o.y - h / 2}" width="${w}" height="${h}" rx="9" fill="${NF}" stroke="${i === 2 ? K.acc : K.blue}" stroke-opacity="${i === 2 ? .85 : .6}"/>${inner}${T(ttl[i], o.x, o.y + h / 2 - 8, { size: 8.5, weight: 600, anchor: "middle" })}`;
  const arc = (x, y, r, a0, a1) => { const p = (a) => [x + r * Math.cos(Math.PI - a), y - r * Math.sin(Math.PI - a)], [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}`; };
  const row = [0, 1, 2];
  const draw = [
    (o) => row.map((k) => { const yy = o.y - 20 + k * 11; return `<rect x="${o.x - 22}" y="${yy - 4}" width="44" height="8" rx="4" fill="none" stroke="${K.aqua}" stroke-opacity=".6"/><circle cx="${o.x - 17.5}" cy="${yy}" r="1.5" fill="${K.acc}"/><path d="M${o.x - 12} ${yy}h${[20, 14, 17][k]}" stroke="${K.aqua}" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`; }).join(""),
    // the gauge needle sweeps gently around the risk value
    (o) => `<path d="${arc(o.x, o.y + 4, 17, 0, Math.PI)}" fill="none" stroke="#2A3146" stroke-width="5" stroke-linecap="round"/><path d="${arc(o.x, o.y + 4, 17, 0, Math.PI * .62)}" fill="none" stroke="${K.blue}" stroke-width="5" stroke-linecap="round"/><path d="${arc(o.x, o.y + 4, 17, Math.PI * .62, Math.PI * .86)}" fill="none" stroke="${K.acc}" stroke-width="5" stroke-linecap="round"/><g transform="translate(${o.x} ${o.y + 4})"><g><animateTransform attributeName="transform" type="rotate" values="-8;6;-8" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="5s" repeatCount="indefinite"/><path d="M0 0l13 -6" stroke="${K.pearl}" stroke-width="1.6" stroke-linecap="round"/></g><circle r="2.5" fill="${K.pearl}"/></g>`,
    (o) => row.map((k) => { const yy = o.y - 18 + k * 11; return `<path d="M${o.x - 21} ${yy}l2.6 2.6 5-5.8" fill="none" stroke="${K.acc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M${o.x - 9} ${yy}h${[28, 22, 25][k]}" stroke="${K.aqua}" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>`; }).join(""),
    (o) => { const pts = [[-22, 4], [-13, -4], [-5, 1], [4, -11], [13, -6], [22, -18]].map(([a, b]) => [o.x + a, o.y - 4 + b]), d = pts.map((q, i) => `${i ? "L" : "M"}${q[0]} ${q[1]}`).join(""), l = pts[5]; return `<path d="M${o.x - 24} ${o.y + 12}H${o.x + 24}" stroke="#3C4663"/><path d="${d}L${l[0]} ${o.y + 12}L${pts[0][0]} ${o.y + 12}Z" fill="${K.blue}" fill-opacity=".2"/><path d="${d}" fill="none" stroke="${K.aqua}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${l[0]}" cy="${l[1]}" r="2.6" fill="${K.acc}"><animate attributeName="r" values="2.6;3.4;2.6" dur="2.6s" repeatCount="indefinite"/></circle>`; },
  ];
  const nodes = xs.map((x, i) => ({ id: "n" + i, shape: "custom", x, y: cy, w, h, draw: (o) => frame(o, i, draw[i](o)) }));
  nodes.push({ id: "ll", shape: "chip", x: 244, y: 13, w: 34, h: 13, label: "LLM", tone: "gold", size: 8 }, { id: "ml", shape: "chip", x: 148, y: 13, w: 58, h: 13, label: "ML models", tone: "gold", size: 8 });
  const cap = [["lifestyle,", "family history"], ["disease risk", "per condition"], ["plan written", "by an LLM"], ["metrics over", "time"]].map((c, i) => MO(c[0], xs[i], 108, { anchor: "middle" }) + MO(c[1], xs[i], 118, { anchor: "middle" })).join("");
  return flow(nodes, [{ from: "n0", to: "n1" }, { from: "n1", to: "n2" }, { from: "n2", to: "n3" }, { from: "ll", to: "n2", dash: 1, tone: "gold", noArrow: 1 }, { from: "ml", to: "n1", dash: 1, tone: "gold", noArrow: 1 }], { over: cap, dots: false });
}
export const DIAG = { flowforge: FLOWFORGE, querypilot: QUERYPILOT, ivision: IVISION, healthnex: HEALTH };
