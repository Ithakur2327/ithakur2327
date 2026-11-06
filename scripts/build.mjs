import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hero } from "./parts/hero.mjs";
import { linkRow } from "./parts/links.mjs";
import { state } from "./parts/state.mjs";
import { section, closing } from "./parts/section.mjs";
import { projectCard } from "./parts/projects.mjs";
import { stack } from "./parts/stack.mjs";
import { contrib } from "./parts/contrib.mjs";
import { leetcode } from "./parts/leetcode.mjs";
import { contest } from "./parts/contest.mjs";
import { more } from "./parts/more.mjs";
import { readme } from "./parts/readme.mjs";
import { getStats } from "./lib/stats.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = process.env.PROFILE_OUT ? path.resolve(process.env.PROFILE_OUT) : root; // preview builds write elsewhere
const P = JSON.parse(fs.readFileSync(path.join(root, "data/profile.json"), "utf8"));
const offline = process.argv.includes("--offline");
fs.mkdirSync(path.join(outRoot, "assets"), { recursive: true });

const out = (name, svg) => {
  if (/NaN|undefined|Infinity/.test(svg)) throw new Error(`Bad number in ${name}`);
  fs.writeFileSync(path.join(outRoot, "assets", name), svg);
};

// Live data first: several panels need it
const stats = await getStats(P, { root, offline });

out("hero.svg", hero(P));
linkRow(P.links).forEach((l) => out(`link-${l.id}.svg`, l.svg));
out("sec-now.svg", section("Right now"));
out("state.svg", state(P));
out("sec-tools.svg", section("Tools I build with"));
out("stack.svg", stack(P));
out("sec-built.svg", section("Things I’ve built", "Each card is drawn as the pipeline it runs"));
P.projects.forEach((pr) => out(`project-${pr.id}.svg`, projectCard(pr, stats.repos?.[pr.repo])));
out("more.svg", more(P, stats));
out("sec-solve.svg", section("Problem solving", "Live from LeetCode, CodeChef and Codeforces"));
out("leetcode.svg", leetcode(P, stats));
out("codechef.svg", contest("cc", P, stats));
out("codeforces.svg", contest("cf", P, stats));
out("sec-contrib.svg", section("Contributions", "Live from GitHub, refreshed daily"));
out("contrib.svg", contrib(P, stats));
out("closing.svg", closing("Let’s build something people actually use."));

fs.writeFileSync(path.join(outRoot, "README.md"), readme(P));
console.log(`built ${fs.readdirSync(path.join(outRoot, "assets")).length} panels · ${stats.total} contributions · cache=${!!stats.cached}`);
