import { C } from "../lib/theme.mjs";
import { frame, icon, brandColor } from "../lib/svg.mjs";
import { txt, wrap } from "../lib/type.mjs";

// Small flat square chips, one per skill. Each icon keeps its brand colour and floats gently.
export function stack(P) {
  const W = 1200, titleW = 222, x0 = 64 + titleW, TW = 82, TH = 82, gap = 10, rowGap = 18;
  const rows = P.stack;
  const H = 52 + rows.length * TH + (rows.length - 1) * rowGap * 2 + 52;

  let out = "", n = 0, y = 52;
  rows.forEach((row, ri) => {
    out += txt(row.title, { x: 64, y: y + TH / 2 + 8, size: 24, font: "display", weight: 700, fill: C.title });
    row.items.forEach(([label, ic], i) => {
      const tx = x0 + i * (TW + gap);
      const cx = tx + TW / 2, cyI = y + 28;
      out += `<rect x="${tx}" y="${y}" width="${TW}" height="${TH}" rx="12" fill="${C.chip}"/>`;
      const dur = (2.8 + ((n * 7) % 5) * 0.3).toFixed(1), begin = ((n * 0.37) % 2.4).toFixed(2);
      out += `<g>${icon(ic, cx - 13, cyI - 13, 26, brandColor(ic))}<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`;
      const lines = wrap(label, TW - 10, { size: 12, weight: 600 });
      const ly = lines.length === 1 ? y + 63 : y + 56;
      lines.forEach((l, k) => (out += txt(l, { x: cx, y: ly + k * 14, size: 12, weight: 600, fill: C.title, anchor: "middle" })));
      n++;
    });
    y += TH;
    if (ri < rows.length - 1) {
      y += rowGap;
      out += `<path d="M64 ${y}H${W - 64}" stroke="#FFFFFF" stroke-opacity=".10"/>`;
      y += rowGap;
    }
  });
  return frame(W, H, out, {
    label: "Tools I build with. " + rows.map((r) => `${r.title}: ${r.items.map((i) => i[0]).join(", ")}.`).join(" "),
  });
}
