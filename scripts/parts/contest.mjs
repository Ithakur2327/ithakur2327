import { C } from "../lib/theme.mjs";
import { frame, icon } from "../lib/svg.mjs";
import { txt } from "../lib/type.mjs";

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const ccStars = (r) => (r < 1400 ? 1 : r < 1600 ? 2 : r < 1800 ? 3 : r < 2000 ? 4 : r < 2200 ? 5 : r < 2500 ? 6 : 7);
const CC_COL = ["#B8B8B8", "#4CD964", "#6B9CFF", "#C48BFF", "#FFD23F", "#FF9A3D", "#FF5A5A"]; // CodeChef star colours, lifted for dark glass
const cfRank = (r) => (r < 1200 ? "Newbie" : r < 1400 ? "Pupil" : r < 1600 ? "Specialist" : r < 1900 ? "Expert" : r < 2100 ? "Candidate Master" : r < 2300 ? "Master" : r < 2400 ? "International Master" : r < 2600 ? "Grandmaster" : r < 3000 ? "International Grandmaster" : "Legendary Grandmaster");
const CF_COL = { newbie: "#BDBDBD", pupil: "#5CD65C", specialist: "#35D0C6", expert: "#7C9BFF", "candidate master": "#D26BFF", master: "#FFAA33", "international master": "#FFAA33", grandmaster: "#FF5A5A", "international grandmaster": "#FF5A5A", "legendary grandmaster": "#FF5A5A" };
const title = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

// A small card: platform, its star (CodeChef) or rank title (Codeforces), and the rating.
export function contest(kind, P, s) {
  const W = 576, H = 150;
  const isCC = kind === "cc";
  const name = isCC ? "CodeChef" : "Codeforces";
  const d = isCC ? s.cc : s.cf;
  const plus = !d.live && d.plus ? "+" : "";
  let o = txt(name, { x: 40, y: 70, size: 32, font: "display", weight: 700, fill: C.title });
  let tag;
  if (isCC) {
    const n = ccStars(d.rating), col = CC_COL[n - 1];
    for (let i = 0; i < n; i++) o += `<g>${icon("star", 40 + i * 28, 88, 24, col).replace('fill="none"', `fill="${col}"`)}<animate attributeName="opacity" values="1;.45;1" dur="${(2.4 + i * 0.5).toFixed(1)}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/></g>`;
    tag = `${n} star`;
  } else {
    const rank = d.rank && d.rank !== "unrated" ? title(d.rank) : cfRank(d.rating);
    o += txt(rank, { x: 42, y: 112, size: 23, weight: 700, fill: CF_COL[rank.toLowerCase()] ?? C.aqua });
    tag = rank;
  }
  o += txt(fmt(d.rating) + plus, { x: W - 40, y: 106, size: 78, font: "display", weight: 800, fill: "url(#blueV)", anchor: "end" });
  return frame(W, H, o, { radius: 24, label: `${name}: rating ${fmt(d.rating)}${plus}, ${tag}`, m: 24 });
}
