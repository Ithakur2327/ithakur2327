import { C } from "../lib/theme.mjs";
import { frame } from "../lib/svg.mjs";
import { txt, measure } from "../lib/type.mjs";

// Slim divider card: a coral node, a black title, a hairline with a travelling spark, optional note.
export function section(title, note = "") {
  const W = 1200, H = 92;
  const tw = measure(title, { font: "display", weight: 700, size: 42 });
  const nw = note ? measure(note, { size: 19, weight: 400 }) : 0;
  const x1 = 56 + 38 + tw + 28;
  const x2 = note ? W - 56 - nw - 28 : W - 56;
  const inner = `
<path d="M70 38l9 9-9 9-9-9z" fill="${C.gold}"/>
${txt(title, { x: 56 + 38, y: 60, size: 42, font: "display", weight: 700, fill: C.title })}
<path d="M${x1} 46H${x2}" stroke="${C.tiffany}" stroke-opacity=".4" stroke-width="1.5"/>
<circle cx="${x2}" cy="46" r="4" fill="none" stroke="${C.tiffany}" stroke-opacity=".7"/>
<g opacity="0"><circle r="9" fill="url(#tok)"/><circle r="2.6" fill="${C.tokCore}"/>
<animateMotion path="M${x1} 46H${x2}" dur="5s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.9;1" dur="5s" repeatCount="indefinite"/></g>
${note ? txt(note, { x: W - 56, y: 53, size: 19, fill: C.mist, anchor: "end" }) : ""}`;
  return frame(W, H, inner, { label: title, radius: 22 });
}

export function closing(line) {
  const W = 1200, H = 120;
  const inner = `
<path d="M60 60H160" stroke="${C.tiffany}" stroke-opacity=".45" stroke-width="1.5"/>
<circle cx="60" cy="60" r="9" fill="${C.tiffany}"/><circle cx="60" cy="60" r="3.4" fill="${C.ink}"/>
${txt(line, { x: 600, y: 72, size: 34, font: "display", weight: 700, fill: C.title, anchor: "middle" })}
<path d="M1040 60H1140" stroke="${C.tiffany}" stroke-opacity=".45" stroke-width="1.5"/>
<g opacity="0"><circle r="8" fill="url(#tok)"/><animateMotion path="M60 60H160" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="3.2s" repeatCount="indefinite"/></g>
<g opacity="0"><circle r="8" fill="url(#tok)"/><animateMotion path="M1140 60H1040" dur="3.2s" begin="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="3.2s" begin="1.6s" repeatCount="indefinite"/></g>
<circle cx="1140" cy="60" r="9" fill="${C.tiffany}"/><circle cx="1140" cy="60" r="3.4" fill="${C.ink}"/>`;
  return frame(W, H, inner, { label: line, radius: 22 });
}
