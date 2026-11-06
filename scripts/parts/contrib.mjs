import { C } from "../lib/theme.mjs";
import { frame } from "../lib/svg.mjs";
import { txt } from "../lib/type.mjs";
import { mix } from "../lib/color.mjs";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n) => n.toLocaleString("en-US");
const fdate = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

// A year of commits as an isometric skyline: one block per day, height = contributions, gold = the tallest days.
export function contrib(P, s) {
  const W = 1200, H = 700;
  const first = new Date(s.days[0].date + "T00:00:00Z");
  const sun = new Date(first); sun.setUTCDate(sun.getUTCDate() - sun.getUTCDay());
  const all = s.days.map((d) => {
    const t = new Date(d.date + "T00:00:00Z");
    return { ...d, dow: t.getUTCDay(), wk: Math.floor((t - sun) / (7 * 864e5)) };
  });
  // a young account would be a long empty slab, so start the city a month before the first active week
  const w0 = Math.max(0, Math.min(...all.filter((g) => g.n).map((g) => g.wk)) - 4);
  const grid = all.filter((g) => g.wk >= w0).map((g) => ({ ...g, wk: g.wk - w0 }));
  const WK = Math.max(...grid.map((g) => g.wk)) + 1;
  const cap = Math.max(20, Math.min(s.best.n, 80));
  const a = Math.min(17, 640 / (WK + 7)), b = a / 2, cx = 780, top = 250;
  const mid = (WK - 7) / 2;
  const tone = (f) => (f > 0.6 ? C.gold : f > 0.28 ? C.champagne : f > 0.08 ? C.aqua : C.tiffany);
  let k = 0;
  const poly = (p, f, op = 1, pulse = false) => `<polygon points="${p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ")}" fill="${f}"${op < 1 ? ` opacity="${op}"` : ""}${pulse ? `><animate attributeName="opacity" values="1;.55;1" dur="${(2.2 + (k % 5) * 0.35).toFixed(2)}s" begin="${((k++ % 7) * 0.4).toFixed(1)}s" repeatCount="indefinite"/></polygon>` : "/>"}`;

  let o = "";
  [...grid].sort((p, q) => p.wk + p.dow - (q.wk + q.dow) || p.wk - q.wk).forEach((g) => {
    const x = cx + (g.wk - g.dow - mid) * a, y = top + (g.wk + g.dow) * b;
    if (!g.n) {
      o += poly([[x, y], [x + a, y + b], [x, y + 2 * b], [x - a, y + b]], C.lagoon, 0.75);
      return;
    }
    const f = Math.min(1, g.n / cap), h = 5 + f * (110 + a * 3), base = tone(f);
    o += poly([[x, y - h], [x + a, y - h + b], [x, y - h + 2 * b], [x - a, y - h + b]], base, 1, f > 0.55);
    o += poly([[x - a, y - h + b], [x, y - h + 2 * b], [x, y + 2 * b], [x - a, y + b]], mix(base, "#000000", 0.28));
    o += poly([[x + a, y - h + b], [x, y - h + 2 * b], [x, y + 2 * b], [x + a, y + b]], mix(base, "#000000", 0.5));
  });

  // headline numbers
  const m = [[fmt(s.total), "contributions in 12 months"], [fmt(s.active), "days with a contribution"], [String(s.longestStreak), "days, longest streak"]];
  m.forEach(([v, l], i) => {
    const y = 128 + i * 112;
    o += txt(v, { x: 64, y, size: 68, font: "display", weight: 800, fill: "url(#blueV)" });
    o += txt(l, { x: 66, y: y + 32, size: 18, fill: C.mist });
    if (i) o += `<path d="M64 ${y - 66}H300" stroke="${C.tiffany}" stroke-opacity=".22"/>`;
  });
  const box = (y, k, v) => `<rect x="64" y="${y}" width="244" height="62" rx="14" fill="${C.deep}" stroke="${C.gold}" stroke-opacity=".5"/>` + txt(k, { x: 82, y: y + 24, size: 14, font: "mono", fill: C.mist }) + txt(v, { x: 82, y: y + 48, size: 18, font: "mono", weight: 500, fill: C.champagne });
  o += box(440, "busiest day", `${fdate(s.best.date)}, ${s.best.n}`);
  o += box(514, "current streak", `${s.currentStreak ?? 0} ${(s.currentStreak ?? 0) === 1 ? "day" : "days"}`);

  // legend + stamp
  o += txt("less", { x: 64, y: 626, size: 14, font: "mono", fill: C.mist });
  [C.lagoon, C.tiffany, C.aqua, C.champagne, C.gold].forEach((c, i) => (o += `<rect x="${104 + i * 24}" y="612" width="18" height="18" rx="4" fill="${c}"/>`));
  o += txt("more", { x: 232, y: 626, size: 14, font: "mono", fill: C.mist });
  const stamp = s.cached ? `numbers from ${fdate(s.syncedAt)}` : `refreshed ${fdate(s.syncedAt)}`;
  o += txt(stamp, { x: 1136, y: 668, size: 14, font: "mono", fill: C.dim, anchor: "end" });
  o += txt("one block per day, last 12 months", { x: 64, y: 668, size: 14, font: "mono", fill: C.dim });

  return frame(W, H, o, { label: `GitHub activity: ${fmt(s.total)} contributions in 12 months, ${s.active} active days, longest streak ${s.longestStreak} days. Busiest day ${fdate(s.best.date)} with ${s.best.n}.` });
}
