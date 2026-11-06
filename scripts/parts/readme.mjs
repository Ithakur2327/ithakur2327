import { linkRow } from "./links.mjs";

// README.md is assembled from the same data file as the artwork, so links can never drift apart.
// Every panel is a black canvas; they sit in one paragraph with align="top" so they join with no gaps
// and the whole page reads as one black surface, whatever theme the viewer uses on GitHub.
export function readme(P) {
  const alt = (s) => s.replace(/"/g, "&quot;");
  const img = (file, a, w = "100%") => `<img src="assets/${file}" alt="${alt(a)}" width="${w}" align="top"/>`;
  const link = (url, inner) => (url ? `<a href="${url}">${inner}</a>` : inner);

  const pills = linkRow(P.links).map((l, i, all) => `<a href="${l.url}">${img(`link-${l.id}.svg`, l.label, `${(l.pct - (i === all.length - 1 ? 0.01 : 0)).toFixed(3)}%`)}</a>`).join("");
  const cards = P.projects.map((p) => link(p.url, img(`project-${p.id}.svg`, p.alt))).join("\n");
  const lc = `https://leetcode.com/${P.leetcode.user}`;
  const cc = P.codechef.user ? `https://www.codechef.com/users/${P.codechef.user}` : "";
  const cf = P.codeforces.user ? `https://codeforces.com/profile/${P.codeforces.user}` : "";

  return `<p align="center">
${img("hero.svg", `${P.name}, ${P.role}. ${P.tagline.join(" ")}`)}
${pills}
${img("sec-now.svg", "Right now")}
${img("state.svg", "Right now: " + P.state.map(([k, v]) => `${k}, ${v}`).join("; ") + ".")}
${img("sec-tools.svg", "Tools I build with")}
${img("stack.svg", "Tools I build with: " + P.stack.map((r) => `${r.title}: ${r.items.map((i) => i[0]).join(", ")}`).join(". ") + ".")}
${img("sec-built.svg", "Things I’ve built")}
${cards}
${link(P.reposUrl, img("more.svg", "More projects: browse all repositories on GitHub"))}
${img("sec-solve.svg", "Problem solving")}
${link(lc, img("leetcode.svg", "LeetCode: problems solved by difficulty and contest rating, fetched live."))}
${link(cc, img("codechef.svg", "CodeChef rating, fetched live.", "49.95%"))}${link(cf, img("codeforces.svg", "Codeforces rating, fetched live.", "49.95%"))}
${img("sec-contrib.svg", "Contributions")}
${link(`https://github.com/${P.github}`, img("contrib.svg", "GitHub contributions over the last 12 months drawn as an isometric skyline, one block per day, rebuilt daily by a GitHub Action."))}
${img("closing.svg", "Let’s build something people actually use.")}
</p>
`;
}
