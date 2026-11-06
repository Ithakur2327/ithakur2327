// Renders every SVG in assets/ to PNG under .preview/ so you can eyeball it without a browser.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const dir = path.resolve("assets");
const out = path.resolve(".preview");
fs.mkdirSync(out, { recursive: true });
const only = process.argv[2];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  if (only && !f.includes(only)) continue;
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  fs.writeFileSync(path.join(out, f.replace(".svg", ".png")), png);
  console.log("preview", f);
}
