import { C } from "../lib/theme.mjs";
import { frame, icon } from "../lib/svg.mjs";
import { txt, measure } from "../lib/type.mjs";
import { renderFlow } from "../lib/flow.mjs";

export function hero(p) {
  const W = 1200, H = 520;
  // name in bold Inter (Apple-style), sized so the longest line always fits the left column
  const o = { font: "display", weight: 800, ls: -3 };
  const widest = Math.max(measure(p.first, { ...o, size: 100 }), measure(p.last, { ...o, size: 100 }));
  const ns = Math.min(105, (570 / widest) * 100);
  const left = [
    `<path d="M72 71l7 7-7 7-7-7z" fill="${C.gold}"/>`,
    txt(p.role, { x: 94, y: 85, size: 21, weight: 600, fill: C.aqua }),
    txt(p.first, { x: 58, y: 96 + ns * 0.8, size: ns, ...o, fill: C.title }),
    txt(p.last, { x: 58, y: 96 + ns * 1.72, size: ns, ...o, fill: C.title }),
    ...p.tagline.map((l, i) => txt(l, { x: 66, y: 386 + i * 34, size: 25, weight: 500, fill: C.pearl })),
  ];

  const chip1W = 56 + measure(p.status, { size: 18, weight: 500 });
  const chip2W = 60 + measure(p.location, { size: 18, weight: 500 });
  const cy = 452;
  const chips = `
<rect x="66" y="${cy}" width="${chip1W}" height="38" rx="19" fill="${C.deep}"/>
<circle cx="88" cy="${cy + 19}" r="5" fill="${C.gold}"><animate attributeName="opacity" values="1;.2;1" dur="2.4s" repeatCount="indefinite"/></circle>
<circle cx="88" cy="${cy + 19}" r="9" fill="none" stroke="${C.gold}" stroke-opacity=".4"/>
${txt(p.status, { x: 106, y: cy + 25, size: 18, weight: 500, fill: C.pearl })}
<rect x="${66 + chip1W + 12}" y="${cy}" width="${chip2W}" height="38" rx="19" fill="${C.deep}"/>
${icon("pin", 66 + chip1W + 12 + 16, cy + 9, 20, C.aqua)}
${txt(p.location, { x: 66 + chip1W + 12 + 42, y: cy + 25, size: 18, weight: 500, fill: C.pearl })}`;

  // right column: how an idea becomes a product
  const nodes = [
    { id: "idea", shape: "circle", x: 684, y: 262, r: 15, solid: true, cap: "idea", capY: 306 },
    { id: "design", x: 790, y: 262, w: 100, h: 54, label: "design" },
    { id: "fe", x: 936, y: 150, w: 124, h: 54, label: "frontend" },
    { id: "be", x: 936, y: 374, w: 124, h: 54, label: "backend" },
    { id: "gate", shape: "diamond", x: 1062, y: 262, w: 100, h: 88, tone: "gold", label: "test", size: 17 },
    { id: "users", shape: "circle", x: 1146, y: 262, r: 15, solid: true, cap: "launch", capY: 306 },
  ];
  const edges = [
    { from: "idea", to: "design" },
    { from: "design", to: "fe", via: [[790, 150]] },
    { from: "design", to: "be", via: [[790, 374]] },
    { from: "fe", to: "gate", via: [[1062, 150]] },
    { from: "be", to: "gate", via: [[1062, 374]] },
    { from: "gate", to: "users" },
    { from: "gate", to: "design", dash: true, tone: "gold", label: { t: "fix", x: 926, y: 250 } },
  ];
  const tokens = [
    { route: ["idea", "design", "fe", "gate", "users"], dur: 7, begin: 0 },
    { route: ["idea", "design", "be", "gate", "users"], dur: 7, begin: 3.5 },
    { route: ["gate", "design"], dur: 5, begin: 2, small: true },
  ];
  const graph = renderFlow({ nodes, edges, tokens });
  const note = txt("from idea to launch", { x: 1146, y: 480, size: 16, weight: 500, fill: C.mist, anchor: "end" });

  return frame(W, H, `${left.join("")}${chips}${graph}${note}`, {
    label: `${p.name}, ${p.role}. ${p.tagline.join(" ")}`,
  });
}
