const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const r2h = (r) => "#" + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
// mix(a, b, t): t=0 -> a, t=1 -> b
export const mix = (a, b, t) => { const A = h2r(a), B = h2r(b); return r2h(A.map((v, i) => v + (B[i] - v) * t)); };
