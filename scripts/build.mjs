import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStats } from "./lib/stats.mjs";
import { writeSlices, fmt } from "./kit/core.mjs";
import { hero, pill, focus, built, tools, statsCP, contrib, closing } from "./kit/sections.mjs";
import { readme } from "./kit/readme.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = process.env.PROFILE_OUT ? path.resolve(process.env.PROFILE_OUT) : root; // preview builds write elsewhere
const P = JSON.parse(fs.readFileSync(path.join(root, "data/profile.json"), "utf8"));
const offline = process.argv.includes("--offline");
const dir = path.join(outRoot, "assets");
fs.rmSync(dir, { recursive: true, force: true }); // every build starts clean, so renamed or removed slices never linger
fs.mkdirSync(dir, { recursive: true });

// Live data first: several panels need it
const stats = await getStats(P, { root, offline });

const CLOSING = "Let’s build something people actually use.";
const parts = {
  hero: writeSlices(hero(P), dir),
  pills: P.links.map((l, i) => writeSlices(pill(l, i), dir)),
  focus: writeSlices(focus(P), dir),
  built: writeSlices(built(P, stats), dir),
  tools: writeSlices(tools(P), dir),
  stats: writeSlices(statsCP(P, stats), dir),
  contrib: writeSlices(contrib(P, stats), dir),
  closing: writeSlices(closing(CLOSING), dir),
};
const L = stats.lc, solved = L.live && L.easy != null ? L.easy + L.medium + L.hard : L.solved;
const alts = {
  hero: `${P.name}, ${P.role}. ${P.tagline.join(" ")} A map of what I build: frontend, backend, GenAI agents, RAG and data layers of one full-stack product.`,
  focus: "Current focus: " + P.state.map(([k, v]) => `${k}, ${v}`).join("; ") + ".",
  built: "Things I’ve built: " + P.projects.map((p) => `${p.name}, ${p.pitch}`).join(" "),
  tools: "Tools I build with: " + P.stack.map((r) => `${r.title}: ${r.items.map((i) => i[0]).join(", ")}`).join(". ") + ".",
  stats: `Stats and competitive programming: LeetCode ${fmt(solved)} problems solved, CodeChef rating ${fmt(stats.cc.rating)}, Codeforces rating ${fmt(stats.cf.rating)}.`,
  contrib: `GitHub contributions over the last 12 months as an isometric skyline, one block per day, taller and warmer for busier days: ${fmt(stats.total)} contributions on ${fmt(stats.active)} days.`,
  closing: CLOSING,
};
fs.writeFileSync(path.join(outRoot, "README.md"), readme(P, parts, alts));
console.log(`built ${fs.readdirSync(dir).length} slices · ${stats.total} contributions · cache=${!!stats.cached}`);
