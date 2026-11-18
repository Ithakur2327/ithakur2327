// npm run preview -> builds into .preview/ and writes .preview/index.html: the README exactly as GitHub lays it out,
// animations running. Open it in any browser (it follows your light/dark setting like GitHub does).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const out = path.resolve(".preview");
const r = spawnSync(process.execPath, ["scripts/build.mjs", "--offline"], { stdio: "inherit", env: { ...process.env, PROFILE_OUT: out } });
if (r.status) process.exit(r.status);
const md = fs.readFileSync(path.join(out, "README.md"), "utf8");
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile preview</title>
<style>body{margin:0;background:#fff;font:16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}.md{box-sizing:border-box;width:min(838px,100%);margin:0 auto;padding:24px 0}.md img{max-width:100%;box-sizing:content-box}.md p{margin:0 0 16px}
@media (prefers-color-scheme:dark){body{background:#0d1117}}</style><div class="md">${md}</div>`);
console.log("open", path.join(out, "index.html"));
