// Every section of the README, drawn onto Canvases. Sizes are README pixels (the column is 830 wide).
import * as si from "simple-icons";
import { Canvas, W, K, f, g3, fmt, T, MO, D, measure, wrap, glass, boxed } from "./core.mjs";
import { DIAG, heroDiagram } from "./flow.mjs";
import { icon, brandColor } from "../lib/svg.mjs";
import { mix } from "../lib/color.mjs";
import { smooth } from "../lib/chart.mjs";

const fdate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const ago = (iso) => {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (d < 1) return "today";
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
};
const arrowUp = (x, y, s, c) => `<path d="M${f(x)} ${f(y + s)}L${f(x + s)} ${f(y)}M${f(x + 1)} ${f(y)}H${f(x + s)}V${f(y + s - 1)}" stroke="${c}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const blink = (v, dur, begin = 0) => `<animate attributeName="opacity" values="${v}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;

// ---------------------------------------------------------------- hero
const brand = (d, x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s / 24})" d="${d}" fill="${c}"/>`;
const LI = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const LOGO = { portfolio: (x, y) => icon("globe", x, y, 13, K.aqua), linkedin: (x, y) => brand(LI, x, y, 13, "#4C9BE8"), x: (x, y) => brand(si.siX.path, x + .5, y + .5, 12, "#FFFFFF"), leetcode: (x, y) => brand(si.siLeetcode.path, x, y, 13, "#FFA116"), email: (x, y) => brand(si.siGmail.path, x, y, 13, "#F0574B") };

export function hero(P) {
  const H = 222, cv = new Canvas("hero", W, H + 10);
  glass(cv, 0, 0, W, H, 18, `${P.name}, ${P.role}. ${P.tagline.join(" ")}`);
  let o = T(P.role, 28, 44, { size: 11, weight: 600, fill: K.aqua }) + T(P.name, 27, 94, { size: 36, font: "display", weight: 800, ls: -.9, fill: "#fff" });
  P.tagline.forEach((l, i) => (o += T(l, 28, 122 + i * 20, { size: 13.5, weight: 500 })));
  const c1 = 30 + measure(P.status, { size: 10, weight: 500 }), c2 = 34 + measure(P.location, { size: 10, weight: 500 }), x2 = 28 + c1 + 8;
  const chip = (x, w) => `<rect x="${x}" y="166.5" width="${f(w)}" height="22" rx="11" fill="rgba(0,0,0,.35)" stroke="url(#pr)"/>`;
  o += chip(28, c1) + `<circle cx="40" cy="177.5" r="2.6" fill="${K.acc}"/><circle cx="40" cy="177.5" r="5.2" fill="none" stroke="${K.acc}" stroke-opacity=".4"><animate attributeName="r" values="3;8;3" dur="2.6s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".5;0;.5" dur="2.6s" repeatCount="indefinite"/></circle>` + T(P.status, 51, 181, { size: 10, weight: 500 });
  o += chip(x2, c2) + icon("pin", x2 + 10, 171.5, 12, K.aqua) + T(P.location, x2 + 26, 181, { size: 10, weight: 500 });
  cv.add(`<g transform="translate(0 4)">${o}</g>`, [0, 0, W, H], { defs: D.pr });
  cv.add(`<g transform="translate(414 18)">${heroDiagram()}</g>` + MO("what I build, end to end", W - 24, 213, { anchor: "end", size: 8, fill: K.dim }), [400, 10, 430, 212]);
  return cv;
}

// Small glass pills with real logos; each is its own image so only the pill itself is clickable.
export function pill(l, i) {
  const tw = measure(l.label, { size: 10.5, weight: 600 }), w = Math.ceil(13 + 13 + 8 + tw + 15), h = 30, cv = new Canvas(`link-${l.id}`, w + 2, h + 2);
  glass(cv, 1, 1, w, h, 15, "pill" + l.id);
  cv.add(`<rect x="1.5" y="1.5" width="${w - 1}" height="${h - 1}" rx="14.5" fill="none" stroke="${K.aqua}" stroke-opacity="0"><animate attributeName="stroke-opacity" values="0;.4;0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="4.8s" begin="-${(i * 1.1).toFixed(1)}s" repeatCount="indefinite"/></rect>` + (LOGO[l.id] ?? LOGO.portfolio)(14, 9.5) + T(l.label, 35, 20.5, { size: 10.5, weight: 600, fill: "#fff" }), [0, 0, w + 2, h + 2]);
  return cv;
}

// ---------------------------------------------------------------- current focus
export function focus(P) {
  const H = 136, { cv, y0 } = boxed("focus", "Current focus", "", H), cx = 16, w = W - 32;
  glass(cv, cx, y0, w, H, 14, "Right now");
  const size = 11, lh = 22, top = 33, cw = measure("M", { font: "mono", size }), c0 = 26;
  let x = c0, o = "";
  const seg = (s, fill, weight = 400) => { const r = T(s, x, top, { size, font: "mono", weight, fill }); x += cw * s.length; return r; };
  o += seg("class ", K.acc, 500) + seg("Indresh", K.accHi, 500) + seg("(", K.mist) + seg("TypedDict", K.aqua) + seg("):", K.mist);
  const kw = Math.max(...P.state.map(([k]) => k.length)) + 1;
  P.state.forEach(([k, v], i) => {
    const yy = top + (i + 1) * lh; let xx = c0 + cw * 4;
    o += T(k + ":", xx, yy, { size, font: "mono", weight: 500, fill: K.aqua }); xx += cw * (kw + 2);
    o += T('"', xx, yy, { size, font: "mono", fill: K.acc }) + T(v, xx + cw, yy, { size, font: "mono" }) + T('"', xx + cw * (v.length + 1), yy, { size, font: "mono", fill: K.acc });
    if (i === P.state.length - 1) o += `<rect x="${f(xx + cw * (v.length + 2.8))}" y="${f(yy - size * .84)}" width="${f(cw * .6)}" height="${f(size * 1.05)}" rx="1.5" fill="${K.acc}"><animate attributeName="opacity" values="1;0;1" keyTimes="0;.5;1" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/></rect>`;
  });
  o += `<path d="M${f(c0 + cw * 1.2)} ${top + 14}V${top + 4 * lh + 4}" stroke="${K.blue}" stroke-opacity=".14"/>`;
  cv.add(`<g transform="translate(${cx} ${y0})">${o}</g>`, [cx, y0, w, H]);
  return cv;
}

// ---------------------------------------------------------------- projects: one card per row, only the button is a link
const CARD = 224, PITCH = 238, FOOT = 162; // the button row is a 62px footer band, so no slice is ever thinner than a browser line
function card(cv, p, i, cx, cy, stats) {
  const w = W - 32;
  glass(cv, cx, cy, w, CARD, 14, p.name);
  let o = T(p.name, 22, 37, { size: 17.5, font: "display", weight: 800, fill: "#fff" });
  let sz = 11, ls = wrap(p.pitch, 322, { size: sz, weight: 400 });
  if (ls.length > 5) { sz = 10.5; ls = wrap(p.pitch, 322, { size: sz, weight: 400 }); }
  ls.forEach((l, k) => (o += T(l, 22, 59 + k * 16, { size: sz, opacity: .9 })));
  let tx = 22, row = 0; const ty = 59 + (ls.length - 1) * 16 + 13;
  p.tags.forEach((t) => {
    const tw = 13 + measure(t, { font: "mono", size: 8, weight: 500 }); if (tx + tw > 346) { tx = 22; row++; } const yy = ty + row * 21;
    o += `<rect x="${f(tx)}" y="${f(yy)}" width="${f(tw)}" height="17" rx="8.5" fill="rgba(0,0,0,.35)" stroke="${K.blue}" stroke-opacity=".34"/>` + T(t, f(tx + tw / 2), f(yy + 11.4), { size: 8, font: "mono", weight: 500, fill: K.aqua, anchor: "middle" }); tx += tw + 5;
  });
  o += `<rect x="362" y="16" width="420" height="142" rx="11" fill="rgba(0,0,0,.3)" stroke="#fff" stroke-opacity=".07"/><g transform="translate(${f(362 + (420 - 392 * 1.04) / 2)} ${f(16 + (142 - 126 * 1.04) / 2)}) scale(1.04)">${DIAG[p.id]()}</g>`;
  cv.add(`<g transform="translate(${cx} ${cy})">${o}</g>`, [cx, cy, w, FOOT - 2]);
  // footer: a hairline, the button (the only link) and the "updated" note
  const tw = measure(p.cta, { size: 10, weight: 600 }), bw = 10 + 12 + 7 + tw + 8 + 8 + 10, by = FOOT + 19, ax = 22 + bw - 18, when = ago(stats.repos?.[p.repo]?.pushed), lx = 22 + bw + 12;
  const s = `<path d="M22 ${FOOT + .5}H${w - 22}" stroke="#fff" stroke-opacity=".07"/><rect x="22" y="${by}" width="${f(bw)}" height="24" rx="12" fill="rgba(179,136,255,.08)" stroke="${K.acc}" stroke-opacity=".7"/>` + icon("github", 32, by + 6, 12, K.acc) + T(p.cta, 51, by + 15.5, { size: 10, weight: 600 }) + arrowUp(ax, by + 9, 6.5, K.acc)
    + (when ? icon("clock", lx, by + 6.5, 11, K.mist) + T(`updated ${when}`, lx + 15, by + 15.5, { size: 9, fill: K.mist }) : "");
  cv.add(`<g transform="translate(${cx} ${cy})">${s}</g>`, [cx, cy + FOOT, w, CARD - FOOT]);
  cv.link({ x: cx + 22, y: cy + FOOT, w: bw, h: CARD - FOOT }, p.url, `${p.name} on GitHub`);
}
export function built(P, stats) {
  const n = P.projects.length, BR = 62, bodyH = (n - 1) * PITCH + CARD + BR, { cv, y0 } = boxed("built", "Things I’ve built", "Each diagram shows how the project actually works", bodyH);
  P.projects.forEach((p, i) => card(cv, p, i, 16, y0 + i * PITCH, stats));
  const lb = "Browse all repositories", tw = measure(lb, { size: 10.5, weight: 600 }), bw = 14 + 14 + 8 + tw + 8 + 10 + 14, bx = (W - bw) / 2, band = y0 + (n - 1) * PITCH + CARD, by = band + 17;
  cv.add(`<rect x="${f(bx)}" y="${by}" width="${f(bw)}" height="28" rx="14" fill="url(#btn)"/>` + icon("github", bx + 14, by + 7, 14, "#fff") + T(lb, f(bx + 36), by + 18, { size: 10.5, weight: 600, fill: "#fff" })
    + `<path d="M${f(bx + bw - 24)} ${by + 14}h8.5M${f(bx + bw - 19.5)} ${by + 10}l4 4-4 4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, [bx - 1, by - 1, bw + 2, 30], { defs: D.btn });
  cv.link({ x: bx, y: band, w: bw, h: BR }, P.reposUrl, "Browse all repositories on GitHub");
  return cv;
}

// ---------------------------------------------------------------- tools: icon + name, no chip backgrounds, icons hop gently
export function tools(P) {
  const rows = P.stack, rh = 44, py = 10, x0 = 156, st = 70, H = py * 2 + rows.length * rh, w = W - 32, cx = 16, { cv, y0 } = boxed("tools", "Tools I build with", "", H);
  glass(cv, cx, y0, w, H, 14, "Tools I build with");
  let o = "";
  rows.forEach((r, ri) => {
    const y = py + ri * rh;
    o += T(r.title, 22, y + 26, { size: 11, font: "display", weight: 700, fill: "#fff" });
    r.items.forEach(([lb, ic], i) => {
      const x = x0 + i * st + 18, ls = wrap(lb, st - 6, { size: 9, weight: 600 }), d = 3.2 + ((i + ri) % 3) * .3;
      o += `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.6;0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${d}s" begin="-${((i * .37 + ri * .21) % d).toFixed(2)}s" repeatCount="indefinite"/>${icon(ic, x - 9, y + 6, 18, brandColor(ic))}</g>`;
      ls.forEach((l, k) => (o += T(l, x, y + (ls.length > 1 ? 33 : 35) + k * 9, { size: 9, weight: 600, anchor: "middle" })));
    });
    if (ri < rows.length - 1) o += `<path d="M22 ${y + rh}H${w - 22}" stroke="#fff" stroke-opacity=".06"/>`;
  });
  cv.add(`<g transform="translate(${cx} ${y0})">${o}</g>`, [cx, y0, w, H]);
  return cv;
}

// ---------------------------------------------------------------- stats / cp
const ccStars = (r) => (r < 1400 ? 1 : r < 1600 ? 2 : r < 1800 ? 3 : r < 2000 ? 4 : r < 2200 ? 5 : r < 2500 ? 6 : 7);
const CC_COL = ["#B8B8B8", "#4CD964", "#6B9CFF", "#C48BFF", "#FFD23F", "#FF9A3D", "#FF5A5A"];
const cfRank = (r) => (r < 1200 ? "Newbie" : r < 1400 ? "Pupil" : r < 1600 ? "Specialist" : r < 1900 ? "Expert" : r < 2100 ? "Candidate Master" : r < 2300 ? "Master" : r < 2400 ? "International Master" : r < 2600 ? "Grandmaster" : r < 3000 ? "International Grandmaster" : "Legendary Grandmaster");
const CF_COL = { newbie: "#BDBDBD", pupil: "#5CD65C", specialist: "#35D0C6", expert: "#7C9BFF", "candidate master": "#D26BFF", master: "#FFAA33", "international master": "#FFAA33", grandmaster: "#FF5A5A", "international grandmaster": "#FF5A5A", "legendary grandmaster": "#FF5A5A" };
const title = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

export function statsCP(P, S) {
  const H = 288, { cv, y0 } = boxed("stats", "Stats / CP", "Live from LeetCode, CodeChef and Codeforces", H), cx = 16, w = W - 32, L = S.lc;
  glass(cv, cx, y0, w, 198, 14, "LeetCode");
  const split = L.live && L.easy != null, solved = split ? L.easy + L.medium + L.hard : L.solved, plus = !split && L.plus ? "+" : "", k = L.contest;
  const lcTitle = measure("LeetCode", { font: "display", weight: 800, size: 19 });
  let o = T("LeetCode", 26, 41, { size: 19, font: "display", weight: 800, fill: "#fff" }) + arrowUp(26 + lcTitle + 8, 29, 9, K.aqua) + T("@" + P.leetcode.user, 27, 56, { size: 9.5, fill: K.mist });
  const dx = 100, dy = 126, r = 43, sw = 11, Lc = 2 * Math.PI * r, gap = 3;
  const parts = [["Easy", L.easy, L.totals?.easy, K.blue], ["Medium", L.medium, L.totals?.medium, K.acc], ["Hard", L.hard, L.totals?.hard, K.accHi]];
  o += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="${sw}"/>`;
  if (split) { let acc = 0; parts.forEach(([, v, , c]) => { const len = Math.max(0, v / solved * Lc - gap); if (v) o += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-dasharray="${f(len)} ${f(Lc - len)}" stroke-dashoffset="${f(-acc - gap / 2)}" transform="rotate(-90 ${dx} ${dy})"/>`; acc += v / solved * Lc; }); }
  else o += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="${K.blue}" stroke-width="${sw}"/>`;
  o += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${sw - 6}" stroke-linecap="round" stroke-dasharray="16 ${f(Lc - 16)}"><animateTransform attributeName="transform" type="rotate" from="0 ${dx} ${dy}" to="360 ${dx} ${dy}" dur="9s" repeatCount="indefinite"/></circle>`;
  o += T(fmt(solved) + plus, dx, dy + 5, { size: 23, font: "display", weight: 800, fill: "#fff", anchor: "middle" }) + T("problems solved", dx, dy + 18, { size: 7.5, fill: K.mist, anchor: "middle" });
  parts.forEach(([n, v, t, c], i) => {
    const y = 82 + i * 40;
    o += `<circle cx="196" cy="${y - 3.5}" r="3.2" fill="${c}"/>` + T(n, 206, y, { size: 10.5, weight: 600 });
    if (split) o += T(String(v), 446, y + 1, { size: 16, font: "display", weight: 800, fill: "#fff", anchor: "end" }) + `<rect x="192" y="${y + 8}" width="254" height="5" rx="2.5" fill="#fff" fill-opacity=".09"/><rect x="192" y="${y + 8}" width="${f(Math.max(5, 254 * Math.min(1, v / t)))}" height="5" rx="2.5" fill="${c}"/>` + T(`of ${fmt(t)}`, 446, y + 24, { size: 8.5, fill: K.dim, anchor: "end" });
    else o += `<rect x="192" y="${y + 8}" width="254" height="5" rx="2.5" fill="none" stroke="${c}" stroke-opacity=".5" stroke-dasharray="4 6"/>`;
  });
  if (!split) o += T("difficulty split appears after the first live sync", 192, 62, { size: 9, fill: K.dim });
  o += `<rect x="508.5" y="28.5" width="273" height="140" rx="12" fill="rgba(0,0,0,.3)" stroke="${K.blue}" stroke-opacity=".24"/>` + T("Contest rating", 526, 50, { size: 9.5, weight: 600, fill: K.mist }) + T(Number.isFinite(k ? k.rating : L.rating) ? fmt(k ? k.rating : L.rating) + (k ? "" : L.plus ? "+" : "") : "–", 525, 90, { size: 31, font: "display", weight: 800, fill: "url(#cor)" });
  const bits = []; if (k?.top != null) bits.push(`top ${Number(k.top).toFixed(1)}%`); if (k?.attended != null) bits.push(`${k.attended} contests`);
  if (bits.length) o += T(bits.join("   "), 526, 106, { size: 9.5, fill: K.mist });
  const hist = k?.history ?? [];
  if (hist.length >= 2) {
    const lo = Math.floor((Math.min(...hist) - 20) / 100) * 100, hi = Math.max(lo + 100, Math.ceil((Math.max(...hist) + 20) / 100) * 100), X = (i) => 560 + i / (hist.length - 1) * 204, Y = (v) => 156 - (v - lo) / (hi - lo) * 34, pts = hist.map((v, i) => [X(i), Y(v)]), ln = smooth(pts), e = pts[pts.length - 1];
    o += [lo, hi].map((v) => `<path d="M560 ${f(Y(v))}H764" stroke="${K.blue}" stroke-opacity=".16" stroke-dasharray="2 5"/>` + T(fmt(v), 552, Y(v) + 2.5, { size: 7.5, fill: K.dim, anchor: "end" })).join("");
    o += `<defs><linearGradient id="lcf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.blue}" stop-opacity=".28"/><stop offset="1" stop-color="${K.blue}" stop-opacity="0"/></linearGradient></defs><path d="${ln}L${f(e[0])} 156L${f(pts[0][0])} 156Z" fill="url(#lcf)"/><path d="${ln}" fill="none" stroke="${K.blue}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f(e[0])}" cy="${f(e[1])}" r="2.8" fill="${K.acc}"/><circle cx="${f(e[0])}" cy="${f(e[1])}" r="5.4" fill="none" stroke="${K.acc}" stroke-opacity=".5"><animate attributeName="r" values="3;8;3" dur="2.8s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".6;0;.6" dur="2.8s" repeatCount="indefinite"/></circle>`;
  } else o += `<path d="M560 140H764" stroke="${K.blue}" stroke-opacity=".25" stroke-dasharray="2 5"/>` + T("rating history appears after the first live sync", 560, 128, { size: 8, fill: K.dim });
  cv.add(`<g transform="translate(${cx} ${y0})">${o}</g>`, [cx, y0, w, 198], { defs: D.cor });
  if (P.leetcode.user) cv.link({ x: cx + 22, y: y0, w: lcTitle + 40, h: 62 }, `https://leetcode.com/${P.leetcode.user}`, `LeetCode profile of ${P.leetcode.user}`);

  const half = (w - 12) / 2, cy2 = y0 + 212;
  const small = (x, nm, rating, sub, subc, seed, url, linkLabel) => {
    const gx = cx + x, tw = measure(nm, { font: "display", weight: 700, size: 14 });
    glass(cv, gx, cy2, half, 76, 14, seed);
    let c = T(nm, 22, 32, { size: 14, font: "display", weight: 700, fill: "#fff" }) + (url ? arrowUp(22 + tw + 7, 22.5, 7.5, K.aqua) : "");
    c += sub === "stars" ? [...Array(Number.isFinite(rating) ? ccStars(rating) : 0)].map((_, i) => `<g>${icon("star", 22 + i * 15, 41, 12, subc).replace('fill="none"', `fill="${subc}"`)}<animate attributeName="opacity" values="1;.5;1" dur="${(2.4 + i * .5).toFixed(1)}s" repeatCount="indefinite"/></g>`).join("") : T(sub, 22, 54, { size: 10.5, weight: 700, fill: subc });
    c += T(Number.isFinite(rating) ? fmt(rating) + (linkLabel ?? "") : "–", half - 22, 52, { size: 31, font: "display", weight: 800, fill: "url(#cor)", anchor: "end" });
    cv.add(`<g transform="translate(${gx} ${cy2})">${c}</g>`, [gx, cy2, half, 76], { defs: D.cor });
    if (url) cv.link({ x: gx + 16, y: cy2, w: tw + 34, h: 62 }, url, `${nm} profile`);
  };
  const cc = S.cc, cf = S.cf, ccP = !cc.live && cc.plus ? "+" : "", cfP = !cf.live && cf.plus ? "+" : "";
  small(0, "CodeChef", cc.rating, "stars", CC_COL[(Number.isFinite(cc.rating) ? ccStars(cc.rating) : 1) - 1], "CodeChef", P.codechef.user ? `https://www.codechef.com/users/${P.codechef.user}` : "", ccP);
  const rank = cf.rank && cf.rank !== "unrated" ? title(cf.rank) : Number.isFinite(cf.rating) ? cfRank(cf.rating) : "Unrated";
  small(half + 12, "Codeforces", cf.rating, rank, CF_COL[rank.toLowerCase()] ?? K.aqua, "Codeforces", P.codeforces.user ? `https://codeforces.com/profile/${P.codeforces.user}` : "", cfP);
  return cv;
}

// ---------------------------------------------------------------- contributions: a lit isometric skyline whose colour follows the day's contribution count
// cool tones only (teal > cyan > sky > violet > lilac); every contribution count gets its own colour from this ramp
const RAMP = [[0, "#0E7C86"], [.2, "#14A3A8"], [.4, "#2CC6D3"], [.58, "#4FD0F0"], [.72, "#6CC3FF"], [.82, "#A57BFF"], [.92, "#C7A4FF"], [1, "#F0E6FF"]];
const ramp = (t) => { for (let i = 1; i < RAMP.length; i++) if (t <= RAMP[i][0]) { const [a, ca] = RAMP[i - 1], [b, cb] = RAMP[i]; return mix(ca, cb, (t - a) / (b - a)); } return RAMP[RAMP.length - 1][1]; };
const DUR = 14, RISE = 1.6; // seconds: the whole city builds, holds, fades, and starts over

export function contrib(P, s) {
  const H = 316, { cv, y0 } = boxed("contrib", "Contributions", "Live from GitHub, refreshed daily", H), cx = 16, w = W - 32;
  glass(cv, cx, y0, w, H, 14, "GitHub activity");
  const days = s.days, first = new Date(days[0].date + "T00:00:00Z"), sun = new Date(first);
  sun.setUTCDate(sun.getUTCDate() - sun.getUTCDay());
  let g = days.map((d) => { const t = new Date(d.date + "T00:00:00Z"); return { ...d, dow: t.getUTCDay(), wk: Math.floor((t - sun) / (7 * 864e5)) }; });
  const w0 = Math.max(0, Math.min(...g.filter((d) => d.n).map((d) => d.wk)) - 4); // a young account would be a long empty slab: start a month before the first active week
  g = g.filter((d) => d.wk >= w0).map((d) => ({ ...d, wk: d.wk - w0 }));
  const WK = Math.max(...g.map((q) => q.wk)) + 1, a = Math.min(8.2, 500 / (WK + 7)), b = a * .488, ox = 506, top = 44, mid = (WK - 7) / 2, cap = Math.max(20, s.best.n), TH = 7;
  const Pt = (i, j) => [ox + (i - j - mid) * a, top + (i + j) * b], pl = (p) => p.map((q) => f(q[0]) + "," + f(q[1])).join(" ");
  const ncol = (n) => ramp(Math.pow(Math.min(1, n / cap), .72)), used = new Set(g.filter((d) => d.n).map((d) => Math.min(d.n, cap)));
  let defs = "";
  for (const l of used) defs += `<linearGradient id="bl${l}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(ncol(l), "#000000", .16)}"/><stop offset="1" stop-color="${mix(ncol(l), "#000000", .46)}"/></linearGradient><linearGradient id="br${l}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(ncol(l), "#000000", .38)}"/><stop offset="1" stop-color="${mix(ncol(l), "#000000", .66)}"/></linearGradient>`;
  const PEAK = ncol(cap);
  defs += `<radialGradient id="gw" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${PEAK}" stop-opacity=".4"/><stop offset="1" stop-color="${PEAK}" stop-opacity="0"/></radialGradient>${D.blu}`;
  // ground slab and tiles (static)
  const [A0, A1, A2, A3] = [Pt(0, 0), Pt(WK, 0), Pt(WK, 7), Pt(0, 7)], dn = (p) => [p[0], p[1] + TH];
  let ground = `<polygon points="${pl([A3, A2, dn(A2), dn(A3)])}" fill="#161c28"/><polygon points="${pl([A2, A1, dn(A1), dn(A2)])}" fill="#0c1018"/><polygon points="${pl([A0, A1, A2, A3])}" fill="#fff" fill-opacity=".03" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>`;
  const sorted = [...g].sort((p, q) => p.wk + p.dow - (q.wk + q.dow) || p.wk - q.wk);
  sorted.forEach((d) => { const [x, y] = Pt(d.wk, d.dow); ground += `<polygon points="${pl([[x, y], [x + a, y + b], [x, y + 2 * b], [x - a, y + b]])}" fill="#fff" fill-opacity="${d.n ? .02 : .045}" stroke="#fff" stroke-opacity=".05" stroke-width=".4"/>`; });
  // buildings: faces grow from the ground (animated `points`), the final geometry is also the static attribute
  const act = sorted.filter((d) => d.n);
  const A = (v0, v1, t0, t1, ease = ".22 1 .36 1") => `<animate attributeName="points" values="${v0};${v0};${v1};${v1}" keyTimes="0;${g3(t0)};${g3(t1)};1" calcMode="spline" keySplines="0 0 1 1;${ease};0 0 1 1" dur="${DUR}s" repeatCount="indefinite"/>`;
  let sh = "", bd = "", mk = "", best = null;
  act.forEach((d) => {
    const [x, y] = Pt(d.wk, d.dow), yy = y + b, v = Math.min(1, d.n / cap), h = 3 + v * 60, a2 = a * .86, b2 = b * .86, l = Math.min(d.n, cap), col = ncol(d.n);
    const dl = d.wk / WK * 3.2 + d.dow * .04, t0 = dl / DUR, t1 = (dl + RISE) / DUR;
    const geo = (hh) => ({
      L: pl([[x - a2, yy - hh], [x, yy + b2 - hh], [x, yy + b2], [x - a2, yy]]), R: pl([[x + a2, yy - hh], [x, yy + b2 - hh], [x, yy + b2], [x + a2, yy]]),
      T: pl([[x, yy - b2 - hh], [x + a2, yy - hh], [x, yy + b2 - hh], [x - a2, yy - hh]]),
      S: (() => { const Ls = hh * .42, sx = Ls * .9, sy = Ls * .45; return pl([[x, yy + b2], [x + a2, yy], [x + a2 + sx, yy + sy], [x + sx, yy + b2 + sy]]); })(),
    }), G0 = geo(0), G1 = geo(h);
    sh += `<polygon points="${G1.S}" fill="#000" fill-opacity=".3">${A(G0.S, G1.S, t0, t1)}</polygon>`;
    if (v > .6) sh += `<ellipse cx="${f(x)}" cy="${f(yy + b2)}" rx="${f(a * 2.4)}" ry="${f(b * 2.8)}" fill="url(#gw)"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${g3(t0)};${g3(t1)};1" dur="${DUR}s" repeatCount="indefinite"/></ellipse>`;
    bd += `<polygon points="${G1.L}" fill="url(#bl${l})">${A(G0.L, G1.L, t0, t1)}</polygon><polygon points="${G1.R}" fill="url(#br${l})">${A(G0.R, G1.R, t0, t1)}</polygon>`;
    if (h > 12) { let st = ""; for (let q = 5.5; q < h - 2; q += 5.5) st += `M${f(x - a2)} ${f(yy - h + q)}L${f(x)} ${f(yy + b2 - h + q)}M${f(x + a2)} ${f(yy - h + q)}L${f(x)} ${f(yy + b2 - h + q)}`; bd += `<path d="${st}" stroke="#000" stroke-opacity=".17" stroke-width=".5"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${g3(t1)};${g3(t1 + .02)};1" dur="${DUR}s" repeatCount="indefinite"/></path>`; }
    bd += `<polygon points="${G1.T}" fill="${mix(col, "#ffffff", .12)}" stroke="#fff" stroke-opacity=".32" stroke-width=".5">${A(G0.T, G1.T, t0, t1)}</polygon>`;
    if (d.date === s.best.date) best = { x, y: yy - h, t1 };
  });
  if (best) {
    const tag = `${s.best.n} · ${fdate(s.best.date)}`, tw = 16 + measure(tag, { font: "mono", size: 8.5, weight: 500 }), ly = best.y - 44, bx = best.x;
    mk = `<g><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;${g3(best.t1)};${g3(best.t1 + .03)};1" dur="${DUR}s" repeatCount="indefinite"/><path d="M${f(bx)} ${f(best.y - 3)}V${f(ly + 18)}" stroke="${PEAK}" stroke-width="1" stroke-opacity=".9"/><circle cx="${f(bx)}" cy="${f(best.y)}" r="4.8" fill="none" stroke="${PEAK}" stroke-opacity=".8"><animate attributeName="r" values="4.8;9;4.8" dur="2.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".8;0;.8" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="${f(bx)}" cy="${f(best.y)}" r="1.9" fill="#fff"/><rect x="${f(bx - tw / 2)}" y="${f(ly)}" width="${f(tw)}" height="18" rx="9" fill="rgba(6,10,14,.92)" stroke="${PEAK}" stroke-opacity=".85"/>${T(tag, f(bx), f(ly + 12.2), { size: 8.5, font: "mono", weight: 500, fill: "#F6EEFF", anchor: "middle" })}</g>`;
  }
  const city = `<g><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.87;.95;1" dur="${DUR}s" repeatCount="indefinite"/>${sh}${bd}${mk}</g>`;
  // left column
  let o = ground + city;
  [[fmt(s.total), "contributions in 12 months"], [fmt(s.active), "days with a contribution"], [String(s.longestStreak), "days, longest streak"]].forEach(([v, l], i) => { const yy = 54 + i * 54; o += T(v, 26, yy, { size: 28, font: "display", weight: 800, fill: "url(#blu)" }) + T(l, 27, yy + 17, { size: 9.5, fill: K.mist }) + (i ? `<path d="M26 ${yy - 30}H178" stroke="${K.blue}" stroke-opacity=".16"/>` : ""); });
  const box = (yy, dot, k, v) => `<rect x="26.5" y="${yy + .5}" width="156" height="31" rx="8" fill="rgba(0,0,0,.3)" stroke="${K.blue}" stroke-opacity=".28"/><circle cx="39" cy="${yy + 10.5}" r="2.6" fill="${dot}"/>` + MO(k, 47, yy + 13, { size: 7.5 }) + T(v, 39, yy + 25, { size: 10, font: "mono", weight: 500, fill: K.pearl });
  const cs = s.currentStreak ?? 0;
  o += box(194, PEAK, "busiest day", `${fdate(s.best.date)}, ${s.best.n}`) + box(232, ramp(.45), "current streak", `${cs} ${cs === 1 ? "day" : "days"}`);
  o += MO("one block per day, last 12 months", 26, H - 20, { size: 7.5, fill: K.dim }) + MO(s.cached ? `numbers from ${fdate(s.syncedAt)}` : `refreshed ${fdate(s.syncedAt)}`, w - 24, H - 16, { anchor: "end", size: 7.5, fill: K.dim });
  cv.add(`<g transform="translate(${cx} ${y0})">${o}</g>`, [cx, y0, w, H], { defs });
  return cv;
}

// ---------------------------------------------------------------- closing line
export function closing(text) {
  const H = 52, Y = 18, cv = new Canvas("closing", W, Y + H + 16);
  glass(cv, 0, Y, W, H, 14, "Closing line");
  const dot = (x) => `<circle cx="${x}" cy="${Y + 26}" r="4.2" fill="${K.blue}"/><circle cx="${x}" cy="${Y + 26}" r="1.6" fill="#0b0e14"/><circle cx="${x}" cy="${Y + 26}" r="4.2" fill="none" stroke="${K.blue}"><animate attributeName="r" values="4.2;10;4.2" dur="3s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".6;0;.6" dur="3s" repeatCount="indefinite"/></circle>`;
  cv.add(`<path d="M26 ${Y + 26}H112M718 ${Y + 26}H804" stroke="${K.blue}" stroke-opacity=".4"/>${dot(26)}${dot(804)}` + T(text, W / 2, Y + 31, { size: 14, font: "display", weight: 700, fill: "#fff", anchor: "middle" }), [0, Y, W, H]);
  return cv;
}
