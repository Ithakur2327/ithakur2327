// Everything on the page that is a number comes from here, and every source has a fallback.
// A failed fetch never breaks the build: the last good value is reused, and the panel says so.
//   GitHub contributions : GraphQL (token) -> public contributions page -> cache
//   GitHub repos         : REST (token)    -> public repositories page  -> cache
//   LeetCode             : GraphQL (solved split, rank, contest rating + history)
//   Codeforces           : official API (rating, rank, history)
//   CodeChef             : public profile page (rating, stars, history)
import fs from "node:fs";
import path from "node:path";

const UA = "profile-readme-builder (+https://github.com/Ithakur2327/ithakur2327)";
const BROWSER = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36", "Accept-Language": "en" };
const get = async (url, opt = {}) => {
  const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`);
  return r;
};

// ---------- GitHub ----------
async function contribGraphQL(user, token) {
  const q = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const r = await get("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: q, variables: { login: user } }),
  });
  const weeks = (await r.json())?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!weeks) throw new Error("graphql: no calendar");
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, n: d.contributionCount })));
}

async function contribPage(user) {
  const h = await (await get(`https://github.com/users/${user}/contributions`, { headers: BROWSER })).text();
  const cells = [...h.matchAll(/data-date="([\d-]+)"\s+id="(contribution-day-component-\d+-\d+)"/g)];
  const tips = new Map([...h.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>\s*([^<]*)</g)].map((m) => [m[1], m[2]]));
  if (cells.length < 300) throw new Error("contributions page: unexpected markup");
  return cells.map((m) => ({ date: m[1], n: +(/^(\d+)\s+contribution/.exec((tips.get(m[2]) || "").trim())?.[1] || 0) }));
}

async function reposApi(user, token) {
  const h = { Authorization: `bearer ${token}`, "User-Agent": UA, Accept: "application/vnd.github+json" };
  const list = await (await get(`https://api.github.com/users/${user}/repos?per_page=100&type=owner`, { headers: h })).json();
  return Object.fromEntries(list.map((r) => [r.name, { stars: r.stargazers_count, forks: r.forks_count, pushed: r.pushed_at, lang: r.language, fork: r.fork, branch: r.default_branch }]));
}

async function reposPage(user) {
  const html = await (await get(`https://github.com/${user}?tab=repositories`, { headers: BROWSER })).text();
  const out = {};
  for (const b of html.split(/<li[^>]*class="[^"]*col-12[^"]*"/).slice(1)) {
    const name = /itemprop="name codeRepository"[^>]*>\s*([^<\s]+)/.exec(b)?.[1];
    if (!name) continue;
    const stars = /\/stargazers"[^>]*>[\s\S]*?([\d,]+)\s*<\/a>/.exec(b)?.[1];
    out[name] = {
      stars: stars ? +stars.replace(/,/g, "") : 0,
      forks: 0,
      pushed: /datetime="([^"]+)"/.exec(b)?.[1] ?? null,
      lang: /itemprop="programmingLanguage">([^<]+)</.exec(b)?.[1] ?? null,
    };
  }
  if (!Object.keys(out).length) throw new Error("repos page: unexpected markup");
  return out;
}

// latest commit of a repo from its public Atom feed (no token needed)
async function latestCommit(user, repo, branch) {
  const tryBranch = async (b) => {
    const xml = await (await get(`https://github.com/${user}/${repo}/commits/${b}.atom`, { headers: BROWSER })).text();
    const entry = /<entry>([\s\S]*?)<\/entry>/.exec(xml)?.[1];
    if (!entry) throw new Error("no commits");
    const un = (t) => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").trim();
    const msg = un(/<title[^>]*>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "").split("\n")[0];
    return { msg, date: /<updated>([^<]+)<\/updated>/.exec(entry)?.[1] ?? null };
  };
  const order = [...new Set([branch, "main", "master"].filter(Boolean))];
  let last;
  for (const b of order) { try { return await tryBranch(b); } catch (e) { last = e; } }
  throw last;
}

// ---------- competitive programming ----------
async function gql(query, variables) {
  const r = await get("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": BROWSER["User-Agent"] },
    body: JSON.stringify({ query, variables }),
  });
  return (await r.json())?.data;
}

async function leetcode(user) {
  const d = await gql(
    "query($u:String!){allQuestionsCount{difficulty count} matchedUser(username:$u){profile{ranking} submitStatsGlobal{acSubmissionNum{difficulty count}}}}",
    { u: user }
  );
  const ac = d?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!ac) throw new Error("leetcode: no stats");
  const pick = (arr, k) => arr?.find((x) => x.difficulty === k)?.count ?? 0;
  const out = {
    easy: pick(ac, "Easy"), medium: pick(ac, "Medium"), hard: pick(ac, "Hard"),
    totals: { easy: pick(d.allQuestionsCount, "Easy"), medium: pick(d.allQuestionsCount, "Medium"), hard: pick(d.allQuestionsCount, "Hard") },
    ranking: d.matchedUser.profile?.ranking ?? null,
    live: true,
  };
  try {
    const c = await gql(
      "query($u:String!){userContestRanking(username:$u){attendedContestsCount rating globalRanking topPercentage} userContestRankingHistory(username:$u){attended rating}}",
      { u: user }
    );
    if (c?.userContestRanking) {
      out.contest = {
        rating: Math.round(c.userContestRanking.rating),
        attended: c.userContestRanking.attendedContestsCount,
        rank: c.userContestRanking.globalRanking,
        top: c.userContestRanking.topPercentage,
        history: (c.userContestRankingHistory || []).filter((h) => h.attended).map((h) => Math.round(h.rating)),
      };
    }
  } catch (e) { console.log("[stats] leetcode contest failed:", e.message); }
  return out;
}

async function codeforces(user) {
  const info = (await (await get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(user)}`)).json()).result?.[0];
  if (!info) throw new Error("codeforces: no user");
  let history = [];
  try {
    const rh = (await (await get(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(user)}`)).json()).result || [];
    history = rh.map((h) => h.newRating);
  } catch {}
  return { rating: info.rating ?? 0, max: info.maxRating ?? info.rating ?? 0, rank: info.rank ?? "unrated", history, contests: history.length, live: true };
}

async function codechef(user) {
  const h = await (await get(`https://www.codechef.com/users/${encodeURIComponent(user)}`, { headers: BROWSER })).text();
  const rating = +(/class="rating-number"[^>]*>\s*(\d+)/.exec(h)?.[1] ?? 0);
  if (!rating) throw new Error("codechef: rating not found");
  const max = +(/Highest Rating\s*(\d+)/i.exec(h)?.[1] ?? rating);
  const rank = /<strong>\s*([\d,]+)\s*<\/strong>\s*(?:<br\s*\/?>)?\s*<small>\s*Global Rank/i.exec(h)?.[1];
  let history = [];
  try {
    const arr = JSON.parse(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/.exec(h)?.[1] ?? "[]");
    history = arr.map((x) => +x.rating).filter(Boolean);
  } catch {}
  return { rating, max, globalRank: rank ? +rank.replace(/,/g, "") : null, history, contests: history.length, live: true };
}

// ---------- shape ----------
function summarize(days) {
  days = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const total = days.reduce((s, d) => s + d.n, 0);
  const active = days.filter((d) => d.n > 0).length;
  let longest = 0, run = 0;
  for (const d of days) { run = d.n ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].n) current++; else if (i === days.length - 1) continue; else break; }
  return { days, total, active, longestStreak: longest, currentStreak: current, best: days.reduce((a, b) => (b.n > a.n ? b : a)) };
}

export async function getStats(P, { root, offline = false }) {
  const cacheFile = process.env.STATS_FILE ? path.resolve(process.env.STATS_FILE) : path.join(root, "data/stats.json");
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
  if (offline) {
    if (!cache) throw new Error("--offline needs data/stats.json");
    return { ...cache, cached: true };
  }
  const log = (...a) => console.log("[stats]", ...a);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const attempt = async (label, fn) => { try { const v = await fn(); log(label, "ok"); return v; } catch (e) { log(label, "failed:", e.message); return null; } };

  let days = null;
  if (token) days = await attempt("contributions (graphql)", () => contribGraphQL(P.github, token));
  days ??= await attempt("contributions (public page)", () => contribPage(P.github));

  let repos = null;
  if (token) repos = await attempt("repos (api)", () => reposApi(P.github, token));
  repos ??= await attempt("repos (public page)", () => reposPage(P.github));

  // latest commit message for every featured project (fresh each run)
  if (repos) {
    for (const pr of P.projects) {
      const r = repos[pr.repo];
      if (!r) continue;
      const c = await attempt(`commit ${pr.repo}`, () => latestCommit(P.github, pr.repo, r.branch));
      if (c) r.commit = c;
      else if (cache?.repos?.[pr.repo]?.commit) r.commit = cache.repos[pr.repo].commit;
    }
  }

  const lc = await attempt("leetcode", () => leetcode(P.leetcode.user));
  const cf = P.codeforces.user ? await attempt("codeforces", () => codeforces(P.codeforces.user)) : null;
  const cc = P.codechef.user ? await attempt("codechef", () => codechef(P.codechef.user)) : null;

  if (!days && !cache) throw new Error("No contribution data and no cache. Re-run later or check the network.");
  const base = days ? { ...summarize(days), cached: false } : { ...cache, cached: true };
  const stats = {
    ...base,
    repos: repos ?? cache?.repos ?? {},
    lc: lc ?? cache?.lc ?? { ...P.leetcode.fallback, live: false },
    cf: cf ?? cache?.cf ?? { ...P.codeforces.fallback, live: false },
    cc: cc ?? cache?.cc ?? { ...P.codechef.fallback, live: false },
    syncedAt: days ? new Date().toISOString().slice(0, 10) : cache.syncedAt,
  };
  fs.writeFileSync(cacheFile, JSON.stringify(stats) + "\n");
  return stats;
}
