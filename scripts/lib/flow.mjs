// A small pipeline renderer: nodes, routed edges, and gold "tokens" that travel the real path.
// Token timing and node glow are computed from true path lengths so they stay in sync.
import { C, f1 } from "./theme.mjs";
import { txt, measure } from "./type.mjs";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const norm = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const P = (p) => `${f1(p[0])} ${f1(p[1])}`;

function boundary(n, toward) {
  const dx = toward[0] - n.x, dy = toward[1] - n.y;
  if (!dx && !dy) return [n.x, n.y];
  if (n.shape === "circle") {
    const L = Math.hypot(dx, dy);
    return [n.x + (dx / L) * n.r, n.y + (dy / L) * n.r];
  }
  if (n.shape === "diamond") {
    const t = 1 / (Math.abs(dx) / (n.w / 2) + Math.abs(dy) / (n.h / 2));
    return [n.x + dx * t, n.y + dy * t];
  }
  const t = 1 / Math.max(Math.abs(dx) / (n.w / 2), Math.abs(dy) / (n.h / 2));
  return [n.x + dx * t, n.y + dy * t];
}

function qLen(a, c, b) {
  let len = 0, prev = a;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    const p = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    len += dist(prev, p);
    prev = p;
  }
  return len;
}

// Polyline with rounded corners -> path body (without the leading M) + exact length.
function rounded(pts, r = 16) {
  let body = "", len = 0, cur = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = dist(a, b), l2 = dist(b, c);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const p1 = add(b, mul(norm(sub(a, b)), rr));
    const p2 = add(b, mul(norm(sub(c, b)), rr));
    body += `L${P(p1)}Q${P(b)} ${P(p2)}`;
    len += dist(cur, p1) + qLen(p1, b, p2);
    cur = p2;
  }
  const last = pts[pts.length - 1];
  body += `L${P(last)}`;
  len += dist(cur, last);
  return { body, len };
}

function buildEdge(e, N) {
  const A = N[e.from], B = N[e.to];
  const via = e.via || [];
  const first = via[0] || [B.x, B.y];
  const lastV = via[via.length - 1] || [A.x, A.y];
  const p0 = boundary(A, first);
  const pn = boundary(B, lastV);
  const pts = [p0, ...via, pn];
  const r = rounded(pts, e.r ?? 16);
  const dir = norm(sub(pts[pts.length - 1], pts[pts.length - 2]));
  return { ...e, start: p0, end: pn, pts, body: r.body, len: r.len, dir };
}

function arrow(p, dir, color, size = 9) {
  const n = [-dir[1], dir[0]];
  const b = sub(p, mul(dir, size));
  const l = add(b, mul(n, size * 0.55)), r = sub(b, mul(n, size * 0.55));
  return `<path d="M${P(p)}L${P(l)}L${P(r)}Z" fill="${color}"/>`;
}

function kt(f) {
  const t = [0, Math.max(0, f - 0.07), f, Math.min(1, f + 0.13), 1];
  for (let i = 1; i < t.length; i++) if (t[i] <= t[i - 1]) t[i] = Math.min(1, t[i - 1] + 0.0005);
  t[t.length - 1] = 1;
  return t.map((x) => x.toFixed(4)).join(";");
}

function routePath(route, N, E) {
  let d = "", acc = 0;
  const hits = [];
  let cursor = [N[route[0]].x, N[route[0]].y];
  d += `M${P(cursor)}`;
  hits.push({ id: route[0], at: 0 });
  for (let i = 0; i < route.length - 1; i++) {
    const e = E.find((x) => x.from === route[i] && x.to === route[i + 1]);
    if (!e) throw new Error(`No edge ${route[i]} -> ${route[i + 1]}`);
    let c = dist(cursor, e.start);
    if (i > 0) {
      // pass exactly through the node centre: previous edge ends on its boundary, the next starts on it
      const ctr = [N[route[i]].x, N[route[i]].y];
      const c1 = dist(cursor, ctr);
      hits.push({ id: route[i], at: acc + c1 });
      d += `L${P(ctr)}`;
      c = dist(ctr, e.start);
      acc += c1;
    }
    d += `L${P(e.start)}${e.body}`;
    acc += c + e.len;
    cursor = e.end;
  }
  const nl = N[route[route.length - 1]];
  const c = dist(cursor, [nl.x, nl.y]);
  d += `L${P([nl.x, nl.y])}`;
  acc += c;
  hits.push({ id: route[route.length - 1], at: acc });
  return { d, total: acc, hits: hits.map((h) => ({ id: h.id, f: Math.min(0.97, Math.max(0.04, h.at / acc)) })) };
}

// ---- node shapes -----------------------------------------------------------
const toneColor = (t) => (t === "gold" ? C.gold : t === "ghost" ? C.mist : C.tiffany);

function label(n, cx, cy) {
  if (!n.label) return "";
  if (n.sub) {
    return (
      txt(n.label, { x: cx, y: cy - 2, size: n.size ?? 17, weight: 600, fill: C.pearl, anchor: "middle" }) +
      txt(n.sub, { x: cx, y: cy + 19, size: 12, font: "mono", weight: 400, fill: C.mist, anchor: "middle" })
    );
  }
  const lines = String(n.label).split("\n");
  const size = n.size ?? 17;
  const lh = size * 1.22;
  const y0 = cy - ((lines.length - 1) * lh) / 2 + size * 0.35;
  return lines
    .map((l, i) => txt(l, { x: cx, y: y0 + i * lh, size, weight: n.weight ?? 600, fill: n.fill ?? C.pearl, anchor: "middle" }))
    .join("");
}

function drawNode(n) {
  if (n.hidden) return { body: "", glow: "" };
  const col = toneColor(n.tone);
  const sw = n.tone === "gold" ? 1.8 : 1.5;
  const fill = n.fillBg ?? ((n.shape === "stack" || n.shape === "cyl") ? (C.panelSolid ?? C.panel) : C.panel);
  const dash = n.tone === "ghost" ? ` stroke-dasharray="4 5"` : "";
  const x0 = n.x - n.w / 2, y0 = n.y - n.h / 2;
  switch (n.shape) {
    case "circle":
      return {
        body: `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.solid ? col : fill}" stroke="${col}" stroke-width="${sw}"/>${n.solid ? `<circle cx="${n.x}" cy="${n.y}" r="${n.r * 0.38}" fill="${C.ink}"/>` : ""}`,
        glow: `<circle cx="${n.x}" cy="${n.y}" r="${n.r + 3}" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
      };
    case "diamond": {
      const pts = `${n.x},${n.y - n.h / 2} ${n.x + n.w / 2},${n.y} ${n.x},${n.y + n.h / 2} ${n.x - n.w / 2},${n.y}`;
      const big = `${n.x},${n.y - n.h / 2 - 4} ${n.x + n.w / 2 + 6},${n.y} ${n.x},${n.y + n.h / 2 + 4} ${n.x - n.w / 2 - 6},${n.y}`;
      return {
        body: `<polygon points="${pts}" fill="${fill}" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>${label(n, n.x, n.y)}`,
        glow: `<polygon points="${big}" fill="none" stroke="${C.gold}" stroke-width="2.4" stroke-linejoin="round"/>`,
      };
    }
    case "cyl": {
      const ry = Math.min(12, n.h * 0.17), rx = n.w / 2;
      const body = `M${x0} ${y0 + ry}V${y0 + n.h - ry}A${rx} ${ry} 0 0 0 ${x0 + n.w} ${y0 + n.h - ry}V${y0 + ry}`;
      return {
        body: `<path d="${body}" fill="${fill}" stroke="${col}" stroke-width="${sw}"/><ellipse cx="${n.x}" cy="${y0 + ry}" rx="${rx}" ry="${ry}" fill="${C.lagoon}" stroke="${col}" stroke-width="${sw}"/>${label(n, n.x, n.y + ry * 0.7)}`,
        glow: `<path d="${body}" fill="none" stroke="${C.gold}" stroke-width="2.4"/><ellipse cx="${n.x}" cy="${y0 + ry}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
      };
    }
    case "stack": {
      const back = [14, 7].map((o) => `<rect x="${x0 + o}" y="${y0 - o}" width="${n.w}" height="${n.h}" rx="12" fill="${C.deep}" stroke="${col}" stroke-opacity=".55" stroke-width="1.2"/>`).join("");
      return {
        body: `${back}<rect x="${x0}" y="${y0}" width="${n.w}" height="${n.h}" rx="12" fill="${fill}" stroke="${col}" stroke-width="${sw}"/>${label(n, n.x, n.y)}`,
        glow: `<rect x="${x0 - 2}" y="${y0 - 2}" width="${n.w + 4}" height="${n.h + 4}" rx="14" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
      };
    }
    case "chip": {
      const h = n.h ?? 30;
      return {
        body: `<rect x="${x0}" y="${n.y - h / 2}" width="${n.w}" height="${h}" rx="${h / 2}" fill="${C.deep}" stroke="${col}" stroke-width="1.2"${dash}/>${n.dot ? `<circle cx="${x0 + 16}" cy="${n.y}" r="4" fill="${C.gold}"><animate attributeName="opacity" values="1;.25;1" dur="2.2s" repeatCount="indefinite"/></circle>` : ""}${txt(n.label, { x: n.dot ? n.x + 11 : n.x, y: n.y + 5, size: n.size ?? 14, font: "mono", weight: 500, fill: n.fill ?? C.aqua, anchor: "middle" })}`,
        glow: "",
      };
    }
    case "custom":
      return n.draw(n);
    default: // rect
      return {
        body: `<rect x="${x0}" y="${y0}" width="${n.w}" height="${n.h}" rx="12" fill="${fill}" stroke="${col}" stroke-width="${sw}"${dash}/>${label(n, n.x, n.y)}`,
        glow: `<rect x="${x0 - 2}" y="${y0 - 2}" width="${n.w + 4}" height="${n.h + 4}" rx="14" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
      };
  }
}

// ---- public ----------------------------------------------------------------
export function renderFlow({ nodes, edges, tokens = [], under = "", over = "" }) {
  nodes.forEach((n) => {
    if (n.shape === "chip") n.h ??= 30;
    if (n.shape === "circle") n.w = n.h = n.r * 2;
  });
  const N = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const E = edges.map((e) => buildEdge(e, N));

  const edgeSvg = E.filter((e) => !e.hidden).map((e) => {
    const gold = e.tone === "gold";
    const col = gold ? C.gold : C.tiffany;
    const dash = e.dash ? ` stroke-dasharray="${e.dash === true ? "5 6" : e.dash}"` : "";
    const op = e.dash ? 0.75 : 0.55;
    const head = e.noArrow ? "" : arrow(e.end, e.dir, col);
    const both = e.both ? arrow(e.start, norm(sub(e.pts[0], e.pts[1])), col) : "";
    return `<path d="M${P(e.start)}${e.body}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="2"${dash} stroke-linecap="round"/>${head}${both}${e.label ? txt(e.label.t, { x: e.label.x, y: e.label.y, size: 14, font: "mono", weight: 500, fill: gold ? C.gold : C.aqua, anchor: e.label.anchor || "middle" }) : ""}`;
  }).join("");

  const nodeDraw = nodes.map((n) => [n, drawNode(n)]);
  const nodeSvg = nodeDraw.map(([n, d]) => d.body + (n.cap ? txt(n.cap, { x: n.x, y: (n.capY ?? n.y + (n.h ?? n.r * 2) / 2 + 26), size: 14, font: "mono", weight: 400, fill: C.mist, anchor: "middle" }) : "")).join("");

  let tokenSvg = "";
  tokens.forEach((t) => {
    const rp = routePath(t.route, N, E);
    const dur = t.dur ?? 6;
    const begin = t.begin ?? 0;
    const glows = t.small ? "" : rp.hits
      .map((h) => {
        const g = nodeDraw.find(([n]) => n.id === h.id)?.[1].glow;
        if (!g) return "";
        return `<g opacity="0">${g}<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="${kt(h.f)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
      })
      .join("");
    const [gr, cr] = t.small ? [10, 3] : [15, 4.4];
    tokenSvg += `${glows}<g opacity="0"><circle r="${gr}" fill="url(#tok)"/><circle r="${cr}" fill="${C.tokCore}"/>
<animateMotion path="${rp.d}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" rotate="0"/>
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.93;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
  });

  if (process.env.DEBUG_FLOW) {
    tokenSvg = "";
    tokens.forEach((t, ti) => {
      const rp = routePath(t.route, N, E);
      const pts = sampleD(rp.d, 14);
      pts.forEach(([x, y], k) => (tokenSvg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${k === 0 ? 7 : 4}" fill="${["#ff00aa", "#00b36b", "#ff9900", "#7a00ff"][ti % 4]}" opacity=".85"/>`));
    });
  }
  return `${under}${edgeSvg}${nodeSvg}${over}${tokenSvg}`;
}

export { boundary };

// minimal M/L/Q path sampler (only used by DEBUG_FLOW to check token routes)
function sampleD(d, n) {
  const cmds = [...d.matchAll(/([MLQ])([^MLQ]*)/g)].map((m) => [m[1], m[2].trim().split(/[ ,]+/).map(Number)]);
  const poly = [];
  let cur = [0, 0];
  for (const [c, a] of cmds) {
    if (c === "M" || c === "L") { cur = [a[0], a[1]]; poly.push(cur); }
    else {
      const [cx, cy, x, y] = a;
      for (let i = 1; i <= 12; i++) { const t = i / 12, u = 1 - t; poly.push([u * u * cur[0] + 2 * u * t * cx + t * t * x, u * u * cur[1] + 2 * u * t * cy + t * t * y]); }
      cur = [x, y];
    }
  }
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + dist(poly[i - 1], poly[i]));
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = (cum[cum.length - 1] * k) / (n - 1);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const f = (target - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    out.push([poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * f, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * f]);
  }
  return out;
}
