// npm run check  ->  proves every image, file and link referenced by README.md actually resolves.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const md = fs.readFileSync(path.join(root, "README.md"), "utf8");
const refs = [...md.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const uniq = [...new Set(refs)];
const BOT_WALLED = /(^|\.)(linkedin\.com|x\.com|twitter\.com)$/;
let bad = 0;
const say = (ok, what, note = "") => {
  if (!ok) bad++;
  console.log(`${ok === "skip" ? "–" : ok ? "✓" : "✗"} ${what}${note ? `  (${note})` : ""}`);
};

// 1. local files exist and are valid SVG
for (const r of uniq.filter((r) => !/^(https?:|mailto:)/.test(r))) {
  const f = path.join(root, r);
  if (!fs.existsSync(f)) { say(false, r, "missing file"); continue; }
  if (r.endsWith(".svg")) {
    try { new Resvg(fs.readFileSync(f, "utf8")); say(true, r, `${(fs.statSync(f).size / 1024).toFixed(0)} KB, valid SVG`); }
    catch (e) { say(false, r, "invalid SVG: " + e.message); }
  } else say(true, r);
}

// 2. mail links look like mail links
for (const r of uniq.filter((r) => r.startsWith("mailto:"))) say(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(r), r, "email format");

// 3. web links respond
for (const r of uniq.filter((r) => /^https?:/.test(r))) {
  const host = new URL(r).hostname;
  try {
    const res = await fetch(r, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 link-check" }, signal: AbortSignal.timeout(15000) });
    if (res.ok) say(true, r, String(res.status));
    else if (BOT_WALLED.test(host) && [403, 429, 999].includes(res.status)) say("skip", r, `${res.status}: site blocks bots, open it once by hand`);
    else say(false, r, String(res.status));
  } catch (e) {
    say(false, r, e.cause?.code || e.message);
  }
}
console.log(bad ? `\n${bad} problem(s) found` : "\nAll links and assets check out");
process.exit(bad ? 1 : 0);
