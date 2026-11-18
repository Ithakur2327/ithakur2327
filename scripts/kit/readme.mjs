// README.md is assembled from the same data file and the same slices as the artwork, so links can never drift apart.
// All images sit in one centred paragraph with align="top": they stack with no gaps, and slices of one panel
// (a card with its button, a header with its links) join into a single seamless picture.
import { W } from "./core.mjs";

const A = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function tag(p, alt, width) {
  const attrs = `alt="${A(alt)}" width="${width}" align="top"`;
  const inner = p.s
    ? `<img src="assets/${p.s}" ${attrs}/>`
    : `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${p.d}"/><img src="assets/${p.l}" ${attrs}/></picture>`; // title slices: dark and light page
  return p.link ? `<a href="${A(p.link.url)}">${inner}</a>` : inner;
}

// rows -> one line per band; the pieces of a band sit side by side and add up to just under 100% so they never wrap
function rows(parts, alt) {
  return parts.map((row, ri) => row.map((p, pi) => {
    const pct = row.length === 1 ? "100%" : `${(p.w / W * 100 - (pi === row.length - 1 ? 0.01 : 0)).toFixed(4)}%`;
    return tag(p, p.link ? p.link.alt : ri === 0 && pi === 0 ? alt : "", pct);
  }).join("")).join("\n");
}

export function readme(P, parts, alts) {
  const pills = P.links.map((l, i) => {
    const p = parts.pills[i][0][0];
    return `<a href="${A(l.url)}"><img src="assets/${p.s}" alt="${A(l.label)}" width="${(p.w / W * 100).toFixed(3)}%" align="top"/></a>`;
  }).join("&nbsp;&nbsp;");
  const c = P.counter;
  const counter = c ? `\n<img src="https://komarev.com/ghpvc/?username=${encodeURIComponent(c.user)}&amp;label=Profile+views&amp;color=${c.color}&amp;style=flat-square${c.base ? `&amp;base=${c.base}` : ""}" alt="Profile views" height="20" align="top"/>` : "";
  return `<p align="center">
${rows(parts.hero, alts.hero)}
${pills}
${rows(parts.focus, alts.focus)}
${rows(parts.built, alts.built)}
${rows(parts.tools, alts.tools)}
${rows(parts.stats, alts.stats)}
${rows(parts.contrib, alts.contrib)}
${rows(parts.closing, alts.closing)}${counter}
</p>
`;
}
