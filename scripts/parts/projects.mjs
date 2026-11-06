import { C } from "../lib/theme.mjs";
import { frame, icon } from "../lib/svg.mjs";
import { txt, measure, wrap } from "../lib/type.mjs";
import { renderFlow } from "../lib/flow.mjs";

const W = 1200, H = 424;

// ---- shared card shell -------------------------------------------------------
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

function shell(p, diagram, live) {
  const colW = 440;
  let out = txt(p.name, { x: 54, y: 108, size: 56, font: "display", weight: 800, fill: C.title });
  const lines = wrap(p.pitch, colW, { size: 22, weight: 400 });
  lines.forEach((l, i) => (out += txt(l, { x: 56, y: 156 + i * 32, size: 22, fill: C.pearl, opacity: 0.92 })));

  // tags (wrap into rows)
  const tagY0 = 156 + lines.length * 32 + 22;
  let x = 56, row = 0;
  p.tags.forEach((t) => {
    const w = 22 + measure(t, { font: "mono", size: 15, weight: 500 });
    if (x + w > 56 + 480) {
      x = 56;
      row++;
    }
    const y = tagY0 + row * 40;
    out += `<rect x="${x}" y="${y}" width="${w}" height="32" rx="16" fill="${C.deep}" stroke="${C.tiffany}" stroke-opacity=".5"/>`;
    out += txt(t, { x: x + w / 2, y: y + 21.5, size: 15, font: "mono", weight: 500, fill: C.aqua, anchor: "middle" });
    x += w + 8;
  });

  // latest commit, straight from the repo's commit feed
  const tagBottom = tagY0 + (row + 1) * 40 - 8;
  // only show commit messages that say something ("//" or "..updates" would only hurt the card)
  const meaningful = (m) => m && m.length >= 14 && (m.match(/[A-Za-z]{3,}/g) || []).length >= 2;
  if (meaningful(live?.commit?.msg)) {
    let msg = live.commit.msg;
    const room = colW - 34;
    while (msg.length > 8 && measure(msg, { size: 15, weight: 500 }) > room) msg = msg.slice(0, -2);
    if (msg !== live.commit.msg) msg = msg.trimEnd() + "…";
    out += icon("commit", 56, tagBottom + 17, 20, C.mist) + txt(msg, { x: 84, y: tagBottom + 32, size: 15, weight: 500, fill: C.pearl, opacity: 0.8 });
  }

  // call to action (the whole card is the link; this just says where it goes)
  const isGit = p.url.includes("github.com");
  const tw = measure(p.cta, { size: 18, weight: 600 });
  const bw = 20 + 22 + 10 + tw + 14 + 14 + 20;
  const by = H - 28 - 44;
  out += `<rect x="56" y="${by}" width="${bw}" height="44" rx="22" fill="none" stroke="${C.gold}" stroke-opacity=".75" stroke-width="1.5"/>`;
  out += icon(isGit ? "github" : "globe", 56 + 20, by + 11, 22, C.gold);
  out += txt(p.cta, { x: 56 + 20 + 22 + 10, y: by + 28.5, size: 18, weight: 600, fill: C.pearl });
  const ax = 56 + bw - 20 - 12, ay = by + 16;
  out += `<path d="M${ax} ${ay + 12}L${ax + 12} ${ay}M${ax + 2} ${ay}H${ax + 12}V${ay + 10}" fill="none" stroke="${C.gold}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;

  // live repo facts, straight from GitHub
  if (live) {
    let lx = 56 + bw + 22;
    const room = 56 + 480 - lx;
    const when = live.pushed ? `updated ${ago(live.pushed)}` : "";
    const wWhen = when ? 22 + measure(when, { size: 15, weight: 500 }) : 0;
    if (when && wWhen <= room) {
      out += icon("clock", lx, by + 13, 18, C.mist) + txt(when, { x: lx + 24, y: by + 28, size: 15, weight: 500, fill: C.mist });
      lx += wWhen + 16;
    }
    if (live.stars > 0 && lx + 46 <= 56 + 480) {
      out += icon("star", lx, by + 13, 18, C.gold) + txt(String(live.stars), { x: lx + 24, y: by + 28, size: 15, weight: 600, fill: C.pearl });
    }
  }

  // divider between text and diagram
  out += `<path d="M548 44V${H - 44}" stroke="${C.tiffany}" stroke-opacity=".2" stroke-dasharray="2 7"/>`;
  return frame(W, H, `${out}<g transform="translate(0 12)">${diagram}</g>`, { label: p.alt });
}

const cap2 = (x, y, a, b) =>
  txt(a, { x, y, size: 14, font: "mono", fill: C.mist, anchor: "middle" }) +
  (b ? txt(b, { x, y: y + 20, size: 14, font: "mono", fill: C.mist, anchor: "middle" }) : "");

// ---- FlowForge: supervisor, specialist agents, human approval, durable checkpoints ------
function flowforge() {
  const y = 186, by = 336;
  const nodes = [
    { id: "trigger", x: 626, y, w: 92, h: 52, label: "Trigger" },
    { id: "sup", x: 762, y, w: 108, h: 52, label: "Supervisor" },
    { id: "agents", shape: "stack", x: 902, y, w: 106, h: 54, label: "Specialist\nagents", size: 15 },
    { id: "approve", shape: "diamond", x: 1032, y, w: 104, h: 92, tone: "gold", label: "Human\napproval", size: 14 },
    { id: "done", shape: "circle", x: 1130, y, r: 14, solid: true, cap: "done", capY: y + 42 },
    { id: "mcp", shape: "chip", x: 902, y: 108, w: 104, label: "MCP tools", tone: "ghost" },
    { id: "db", x: 943, y: by, w: 406, h: 44, label: "PostgreSQL checkpoints", size: 16, tone: "ghost" },
    { id: "mon", shape: "chip", x: 660, y: by, w: 128, label: "monitoring", dot: true, tone: "ghost" },
    { id: "a1", shape: "circle", x: 762, y: by - 22, r: 0.5, hidden: true },
    { id: "a2", shape: "circle", x: 902, y: by - 22, r: 0.5, hidden: true },
    { id: "a3", shape: "circle", x: 1032, y: by - 22, r: 0.5, hidden: true },
  ];
  const edges = [
    { from: "trigger", to: "sup" },
    { from: "sup", to: "agents" },
    { from: "agents", to: "approve" },
    { from: "approve", to: "done", label: { t: "approved", x: 1105, y: y - 26 } },
    { from: "approve", to: "sup", via: [[1032, 64], [762, 64]], dash: true, tone: "gold", label: { t: "rejected: plan again", x: 897, y: 54 } },
    { from: "mcp", to: "agents", dash: true, noArrow: true },
    { from: "agents", to: "mcp", hidden: true },
    { from: "sup", to: "a1", dash: true },
    { from: "agents", to: "a2", dash: true },
    { from: "approve", to: "a3", dash: true },
    { from: "mon", to: "db", dash: true, noArrow: true },
  ];
  const tokens = [
    { route: ["trigger", "sup", "agents", "approve", "done"], dur: 8, begin: 0 },
    { route: ["trigger", "sup", "agents", "approve", "done"], dur: 8, begin: 4 },
    { route: ["approve", "sup"], dur: 6, begin: 2.4, small: true },
    { route: ["agents", "mcp", "agents"], dur: 5, begin: 0.6, small: true },
    { route: ["sup", "a1"], dur: 8, begin: 1.1, small: true },
    { route: ["agents", "a2"], dur: 8, begin: 2.4, small: true },
    { route: ["approve", "a3"], dur: 8, begin: 3.7, small: true },
  ];
  return renderFlow({ nodes, edges, tokens });
}

// ---- I.Vision: ingest lane + ask lane meeting at the vector store ------------------
function ivision() {
  const nodes = [
    { id: "docs", shape: "stack", x: 630, y: 120, w: 96, h: 52, label: "Your\ndocs", size: 16 },
    { id: "embed", x: 782, y: 120, w: 100, h: 52, label: "Chunk +\nembed", size: 15 },
    { id: "vdb", shape: "cyl", x: 950, y: 120, w: 112, h: 70, label: "Vector\nstore", size: 15 },
    { id: "q", x: 630, y: 290, w: 96, h: 52, label: "Question" },
    { id: "ret", x: 782, y: 290, w: 100, h: 52, label: "Retrieve\ntop-k", size: 15 },
    { id: "llm", x: 950, y: 290, w: 100, h: 52, label: "LLM", tone: "gold" },
    { id: "ans", shape: "stack", x: 1076, y: 290, w: 88, h: 56, label: "Answer\n+ sources", size: 14 },
  ];
  const edges = [
    { from: "docs", to: "embed" },
    { from: "embed", to: "vdb" },
    { from: "q", to: "ret" },
    { from: "ret", to: "llm" },
    { from: "llm", to: "ans" },
    { from: "vdb", to: "ret", via: [[950, 205], [782, 205]], dash: true, tone: "gold", label: { t: "matching chunks", x: 866, y: 196 } },
  ];
  const tokens = [
    { route: ["docs", "embed", "vdb"], dur: 5, begin: 0 },
    { route: ["q", "ret", "llm", "ans"], dur: 6, begin: 1.6 },
    { route: ["vdb", "ret"], dur: 4, begin: 0.9, small: true },
  ];
  return renderFlow({ nodes, edges, tokens });
}

// ---- QueryPilot: generate, validate (self-correct), human review, run, explain ------
function querypilot() {
  const nodes = [
    { id: "q", x: 628, y: 142, w: 92, h: 52, label: "Question" },
    { id: "gen", x: 762, y: 142, w: 100, h: 52, label: "Generate\nSQL", size: 15 },
    { id: "val", shape: "diamond", x: 910, y: 142, w: 112, h: 90, tone: "gold", label: "SQLGlot\ncheck", size: 14 },
    { id: "rev", x: 1066, y: 142, w: 104, h: 52, label: "Human\nreview", size: 15, tone: "gold" },
    { id: "run", x: 1066, y: 262, w: 104, h: 52, label: "Run on\nyour DB", size: 15 },
    { id: "exp", x: 910, y: 262, w: 104, h: 52, label: "Explain\nresult", size: 15 },
    { id: "out", shape: "circle", x: 804, y: 262, r: 13, solid: true, cap: "you", capY: 302 },
    { id: "dk", shape: "chip", x: 917, y: 346, w: 82, h: 28, label: "DuckDB", size: 13, tone: "ghost" },
    { id: "my", shape: "chip", x: 1004, y: 346, w: 72, h: 28, label: "MySQL", size: 13, tone: "ghost" },
    { id: "pg", shape: "chip", x: 1100, y: 346, w: 100, h: 28, label: "PostgreSQL", size: 13, tone: "ghost" },
  ];
  const edges = [
    { from: "q", to: "gen" },
    { from: "gen", to: "val" },
    { from: "val", to: "rev", label: { t: "valid", x: 988, y: 130 } },
    { from: "rev", to: "run" },
    { from: "run", to: "exp" },
    { from: "exp", to: "out" },
    { from: "val", to: "gen", via: [[910, 70], [762, 70]], dash: true, tone: "gold", label: { t: "invalid: self-correct", x: 836, y: 58 } },
    { from: "run", to: "dk", dash: true, noArrow: true },
    { from: "run", to: "my", dash: true, noArrow: true },
    { from: "run", to: "pg", dash: true, noArrow: true },
  ];
  const tokens = [
    { route: ["q", "gen", "val", "rev", "run", "exp", "out"], dur: 9, begin: 0 },
    { route: ["q", "gen", "val", "rev", "run", "exp", "out"], dur: 9, begin: 4.5 },
    { route: ["gen", "val", "gen"], dur: 4, begin: 1.2, small: true },
    { route: ["run", "my"], dur: 5, begin: 2.2, small: true },
  ];
  return renderFlow({ nodes, edges, tokens });
}

// ---- HealthnexAI: four stages drawn as small instruments --------------------------
function healthnex() {
  const cy = 196, w = 108, h = 124;
  const xs = [650, 788, 926, 1064];
  const frameShape = (n, inner, title) => ({
    body: `<rect x="${n.x - w / 2}" y="${n.y - h / 2}" width="${w}" height="${h}" rx="14" fill="${C.panel}" stroke="${n.tone === "gold" ? C.gold : C.tiffany}" stroke-width="1.5"/>${inner}${txt(title, { x: n.x, y: n.y + h / 2 - 14, size: 16, weight: 600, fill: C.pearl, anchor: "middle" })}`,
    glow: `<rect x="${n.x - w / 2 - 2}" y="${n.y - h / 2 - 2}" width="${w + 4}" height="${h + 4}" rx="16" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
  });
  const intake = (n) =>
    frameShape(n, [0, 1, 2].map((i) => `<rect x="${n.x - 34}" y="${n.y - 46 + i * 22}" width="68" height="14" rx="7" fill="none" stroke="${C.aqua}" stroke-opacity=".7"/><circle cx="${n.x - 25}" cy="${n.y - 39 + i * 22}" r="3" fill="${C.gold}"/><path d="M${n.x - 15} ${n.y - 39 + i * 22}h${[34, 24, 30][i]}" stroke="${C.aqua}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`).join(""), "Intake");
  const risk = (n) => {
    const r = 34, cx = n.x, cyy = n.y - 8;
    const arc = (a0, a1) => {
      const p = (a) => [cx + r * Math.cos(Math.PI - a), cyy - r * Math.sin(Math.PI - a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    const inner = `<path d="${arc(0, Math.PI)}" fill="none" stroke="${C.lagoon}" stroke-width="9" stroke-linecap="round"/>
<path d="${arc(0, Math.PI * 0.62)}" fill="none" stroke="${C.tiffany}" stroke-width="9" stroke-linecap="round"/>
<path d="${arc(Math.PI * 0.62, Math.PI * 0.86)}" fill="none" stroke="${C.gold}" stroke-width="9" stroke-linecap="round"/>
<g transform="translate(${cx} ${cyy})"><path d="M0 0L25 -10" stroke="${C.pearl}" stroke-width="2.6" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-4;10;-4" dur="5s" repeatCount="indefinite"/></path><circle r="4.5" fill="${C.pearl}"/></g>`;
    return frameShape(n, inner, "Risk score");
  };
  const plan = (n) =>
    frameShape(n, [0, 1, 2].map((i) => `<path d="M${n.x - 32} ${n.y - 38 + i * 22}l5 5 9-10" fill="none" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${n.x - 10} ${n.y - 38 + i * 22}h${[40, 32, 36][i]}" stroke="${C.aqua}" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`).join(""), "Prevention");
  const trends = (n) => {
    const pts = [[-34, 4], [-20, -6], [-8, 2], [6, -18], [20, -10], [34, -30]].map(([a, b]) => [n.x + a, n.y - 6 + b]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("");
    const last = pts[pts.length - 1];
    return frameShape(n, `<path d="M${n.x - 36} ${n.y + 22}H${n.x + 36}" stroke="${C.line}"/><path d="${d}L${last[0]} ${n.y + 22}L${pts[0][0]} ${n.y + 22}Z" fill="${C.tiffany}" fill-opacity=".18"/><path d="${d}" fill="none" stroke="${C.aqua}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="${C.gold}"/>`, "Trends");
  };
  const nodes = [
    { id: "intake", shape: "custom", x: xs[0], y: cy, w, h, draw: intake },
    { id: "risk", shape: "custom", x: xs[1], y: cy, w, h, draw: risk },
    { id: "plan", shape: "custom", x: xs[2], y: cy, w, h, draw: plan, tone: "gold" },
    { id: "trends", shape: "custom", x: xs[3], y: cy, w, h, draw: trends },
  ];
  const edges = [
    { from: "intake", to: "risk" },
    { from: "risk", to: "plan" },
    { from: "plan", to: "trends" },
  ];
  const tokens = [
    { route: ["intake", "risk", "plan", "trends"], dur: 6, begin: 0 },
    { route: ["intake", "risk", "plan", "trends"], dur: 6, begin: 3 },
  ];
  const caps = cap2(xs[0], 292, "lifestyle,", "family history") + cap2(xs[1], 292, "personal", "risk level") + cap2(xs[2], 292, "plan written", "by an LLM") + cap2(xs[3], 292, "metrics over", "time");
  const llmChip = `<rect x="${xs[2] - 26}" y="92" width="52" height="26" rx="13" fill="${C.deep}" stroke="${C.gold}" stroke-opacity=".8"/>${txt("LLM", { x: xs[2], y: 110, size: 14, font: "mono", weight: 700, fill: C.gold, anchor: "middle" })}<path d="M${xs[2]} 118V${cy - h / 2 - 2}" stroke="${C.gold}" stroke-opacity=".6" stroke-dasharray="3 4"/>`;
  return renderFlow({ nodes, edges, tokens, under: llmChip, over: caps });
}

// ---- SnipixAI: upload anything, index once, three ways to use it -------------------
function snipix() {
  const upload = (n) => {
    const fmts = ["PDF", "DOCX", "PPT", "URL", "IMG", "TXT"];
    const cells = fmts
      .map((f, i) => {
        const cx = n.x - 26 + (i % 2) * 54, cy = n.y - 22 + Math.floor(i / 2) * 26;
        return `<rect x="${cx - 24}" y="${cy - 10}" width="48" height="20" rx="10" fill="none" stroke="${C.aqua}" stroke-opacity=".55"/>${txt(f, { x: cx, y: cy + 4.5, size: 12, font: "mono", weight: 500, fill: C.aqua, anchor: "middle" })}`;
      })
      .join("");
    return {
      body: `<rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="14" fill="${C.panel}" stroke="${C.tiffany}" stroke-width="1.5"/>${txt("Upload", { x: n.x, y: n.y - n.h / 2 + 28, size: 16, weight: 600, fill: C.pearl, anchor: "middle" })}${cells}`,
      glow: `<rect x="${n.x - n.w / 2 - 2}" y="${n.y - n.h / 2 - 2}" width="${n.w + 4}" height="${n.h + 4}" rx="16" fill="none" stroke="${C.gold}" stroke-width="2.4"/>`,
    };
  };
  const nodes = [
    { id: "up", shape: "custom", x: 626, y: 176, w: 120, h: 140, draw: upload },
    { id: "parse", x: 772, y: 176, w: 92, h: 56, label: "Parse +\nchunk", size: 15 },
    { id: "vs", shape: "cyl", x: 886, y: 176, w: 84, h: 72, label: "Vector\nstore", size: 14 },
    { id: "chat", x: 1064, y: 76, w: 150, h: 58, label: "Chat", sub: "streamed RAG answers" },
    { id: "sum", x: 1064, y: 176, w: 150, h: 58, label: "Summarize", sub: "section by section", tone: "gold" },
    { id: "exam", x: 1064, y: 276, w: 150, h: 58, label: "Exam maker", sub: "quiz + subjective" },
    { id: "topic", shape: "chip", x: 1064, y: 350, w: 126, label: "or any topic", tone: "ghost" },
  ];
  const edges = [
    { from: "up", to: "parse" },
    { from: "parse", to: "vs" },
    { from: "vs", to: "chat", via: [[958, 176], [958, 76]] },
    { from: "vs", to: "sum" },
    { from: "vs", to: "exam", via: [[958, 176], [958, 276]] },
    { from: "topic", to: "exam", dash: true },
  ];
  const tokens = [
    { route: ["up", "parse", "vs", "chat"], dur: 7, begin: 0 },
    { route: ["up", "parse", "vs", "sum"], dur: 7, begin: 2.3 },
    { route: ["up", "parse", "vs", "exam"], dur: 7, begin: 4.6 },
    { route: ["topic", "exam"], dur: 4, begin: 1.4, small: true },
  ];
  return renderFlow({ nodes, edges, tokens });
}

const DIAGRAMS = { flowforge, ivision, querypilot, healthnex, snipix };

export function projectCard(p, live) {
  return shell(p, DIAGRAMS[p.id](), live);
}
