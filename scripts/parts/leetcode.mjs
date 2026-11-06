import { C } from "../lib/theme.mjs";
import { frame } from "../lib/svg.mjs";
import { txt } from "../lib/type.mjs";
import { ratingChart } from "../lib/chart.mjs";

const fmt = (n) => Math.round(n).toLocaleString("en-US");

// Solved split + contest rating. Everything is live; before the first sync it shows the fallback honestly.
export function leetcode(P, s) {
  const W = 1200, H = 480, L = s.lc;
  const split = L.live && L.easy != null;
  const solved = split ? L.easy + L.medium + L.hard : L.solved;
  const plus = !split && L.plus ? "+" : "";
  let o = txt("LeetCode", { x: 48, y: 88, size: 46, font: "display", weight: 800, fill: C.title });
  o += txt(`@${P.leetcode.user}`, { x: 50, y: 120, size: 18, weight: 500, fill: C.mist });

  // donut
  const cx = 214, cy = 300, r = 104, w = 28, Lc = 2 * Math.PI * r, gap = 7;
  const parts = [["Easy", L.easy, L.totals?.easy, C.tiffany], ["Medium", L.medium, L.totals?.medium, C.gold], ["Hard", L.hard, L.totals?.hard, C.champagne]];
  o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.lagoon}" stroke-width="${w}"/>`;
  if (split) {
    let acc = 0;
    parts.forEach(([, v, , col]) => {
      const len = Math.max(0, (v / solved) * Lc - gap);
      if (v) o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${len.toFixed(1)} ${(Lc - len).toFixed(1)}" stroke-dashoffset="${(-acc - gap / 2).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      acc += (v / solved) * Lc;
    });
  } else {
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.tiffany}" stroke-width="${w}"/>`;
  }
  o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${w - 14}" stroke-linecap="round" stroke-dasharray="40 ${(Lc - 40).toFixed(1)}"><animateTransform attributeName="transform" type="rotate" from="-90 ${cx} ${cy}" to="270 ${cx} ${cy}" dur="9s" repeatCount="indefinite"/></circle>`;
  o += txt(fmt(solved) + plus, { x: cx, y: cy + 16, size: 52, font: "display", weight: 800, fill: C.title, anchor: "middle" });
  o += txt("problems solved", { x: cx, y: cy + 44, size: 16, weight: 500, fill: C.mist, anchor: "middle" });

  // easy / medium / hard rows
  parts.forEach(([n, v, t, col], i) => {
    const y = 214 + i * 92;
    o += `<circle cx="428" cy="${y - 8}" r="8" fill="${col}"/>` + txt(n, { x: 448, y: y - 1, size: 21, weight: 600, fill: C.pearl });
    if (split) {
      o += txt(String(v), { x: 770, y: y + 2, size: 34, font: "display", weight: 800, fill: C.title, anchor: "end" });
      o += `<rect x="428" y="${y + 16}" width="342" height="10" rx="5" fill="${C.lagoon}"/><rect x="428" y="${y + 16}" width="${Math.max(8, 342 * Math.min(1, v / t))}" height="10" rx="5" fill="${col}"/>`;
      o += txt(`of ${fmt(t)}`, { x: 770, y: y + 48, size: 14, weight: 500, fill: C.dim, anchor: "end" });
    } else {
      o += `<rect x="428" y="${y + 16}" width="342" height="10" rx="5" fill="none" stroke="${col}" stroke-opacity=".5" stroke-dasharray="4 6"/>`;
    }
  });
  if (!split) o += txt("difficulty split appears after the first live sync", { x: 428, y: 160, size: 15, weight: 500, fill: C.dim });

  // contest rating card
  o += `<rect x="812" y="150" width="340" height="276" rx="22" fill="${C.deep}" stroke="${C.tiffany}" stroke-opacity=".28"/>`;
  o += txt("Contest rating", { x: 836, y: 188, size: 16, weight: 600, fill: C.mist });
  const k = L.contest;
  o += txt(fmt(k ? k.rating : L.rating) + (k ? "" : L.plus ? "+" : ""), { x: 834, y: 262, size: 66, font: "display", weight: 800, fill: "url(#blueV)" });
  const bits = [];
  if (k?.top != null) bits.push(`top ${Number(k.top).toFixed(1)}%`);
  if (k?.attended != null) bits.push(`${k.attended} contests`);
  if (bits.length) o += txt(bits.join("   "), { x: 836, y: 292, size: 16, weight: 500, fill: C.mist });
  o += ratingChart({ x: 836, y: 318, w: 292, h: 84, values: k?.history, id: "lc" });

  if (!L.live) o += txt("waiting for first live sync", { x: 50, y: 446, size: 16, weight: 500, fill: C.dim });
  return frame(W, H, o, { label: `LeetCode @${P.leetcode.user}: ${fmt(solved)}${plus} problems solved${split ? `, easy ${L.easy}, medium ${L.medium}, hard ${L.hard}` : ""}. Contest rating ${fmt(k ? k.rating : L.rating)}${k ? "" : L.plus ? "+" : ""}.` });
}
