import { C } from "../lib/theme.mjs";
import { frame, icon } from "../lib/svg.mjs";
import { txt, measure } from "../lib/type.mjs";

// GitHub's own language colours for the dot beside each repo
const LANG = { TypeScript: "#3178C6", JavaScript: "#F1E05A", Python: "#3572A5", "C++": "#F34B7D", C: "#8A8A8A", HTML: "#E34C26", CSS: "#7B5CC4", Java: "#B07219", "Jupyter Notebook": "#DA5B0B", Shell: "#89E051", Go: "#00ADD8", Rust: "#DEA584" };
const short = (iso) => {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d < 1 ? "today" : d < 14 ? `${d}d ago` : d < 60 ? `${Math.floor(d / 7)}w ago` : d < 365 ? `${Math.floor(d / 30)}mo ago` : `${Math.floor(d / 365)}y ago`;
};

// "More projects": a live count and the most recently active repos that are not featured above.
// The whole panel is wrapped in a link to the repositories tab.
export function more(P, s) {
  const W = 1200, H = 184;
  const featured = new Set([...P.projects.map((p) => p.repo), P.github].map((n) => n.toLowerCase()));
  const all = Object.entries(s.repos || {}).filter(([, r]) => !r.fork);
  const recent = all
    .filter(([n]) => !featured.has(n.toLowerCase()))
    .sort((a, b) => new Date(b[1].pushed || 0) - new Date(a[1].pushed || 0))
    .slice(0, 3);
  const sub = all.length ? `${all.length} public repositories, including the smaller experiments` : "Every repository, including the smaller experiments";
  const label = "Browse all repositories";
  const bw = 34 + 24 + 12 + measure(label, { size: 20, weight: 600 }) + 22 + 20 + 34;
  const bx = W - 56 - bw;

  let o = txt("More projects", { x: 56, y: 68, size: 34, font: "display", weight: 700, fill: C.title }) + txt(sub, { x: 58, y: 100, size: 19, weight: 400, fill: C.mist });
  o += `<rect x="${bx}" y="38" width="${bw}" height="64" rx="32" fill="${C.gold}"/><rect x="${bx}" y="38" width="${bw}" height="64" rx="32" fill="url(#gloss2)"/>`;
  o += icon("github", bx + 34, 58, 24, "#FFFFFF") + txt(label, { x: bx + 34 + 24 + 12, y: 77, size: 20, weight: 600, fill: "#FFFFFF" });
  o += `<path d="M0 10H16M9 3l7 7-7 7" transform="translate(${bx + bw - 52} 60)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><animateTransform attributeName="transform" type="translate" values="${bx + bw - 52} 60;${bx + bw - 46} 60;${bx + bw - 52} 60" dur="1.8s" repeatCount="indefinite"/></path>`;

  // live: most recently active repositories
  if (recent.length) {
    o += txt("recently active", { x: 56, y: 150, size: 15, font: "mono", fill: C.dim });
    let x = 56 + measure("recently active", { size: 15, font: "mono" }) + 22;
    recent.forEach(([name, r], i) => {
      const nw = measure(name, { size: 16, weight: 600 }), tw = measure(short(r.pushed), { size: 14, weight: 500 });
      const w = 18 + 10 + 10 + nw + 12 + tw + 18;
      o += `<rect x="${x}" y="128" width="${w}" height="36" rx="10" fill="${C.chip}"/>`;
      o += `<circle cx="${x + 18 + 5}" cy="146" r="5" fill="${LANG[r.lang] ?? "#8B93A7"}"><animate attributeName="opacity" values="1;.45;1" dur="${(2.6 + i * 0.6).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
      o += txt(name, { x: x + 18 + 10 + 10, y: 152, size: 16, weight: 600, fill: C.pearl }) + txt(short(r.pushed), { x: x + w - 18, y: 152, size: 14, weight: 500, fill: C.mist, anchor: "end" });
      x += w + 10;
    });
  }
  return frame(W, H, o, { radius: 24, label: `More projects: ${sub}${recent.length ? ". Recently active: " + recent.map(([n]) => n).join(", ") : ""}`, extraDefs: `<linearGradient id="gloss2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>` });
}
