// One palette: frosted dark glass over a muted blurred backdrop. White text, cobalt structure,
// coral emphasis, and a blue gradient for headline numbers. Slot names are kept stable so every
// panel recolours from here (tiffany = main accent, gold = second accent).
export const C = {
  abyss: "#05060A", ink: "#0B0D14", deep: "rgba(255,255,255,0.075)", panel: "rgba(255,255,255,0.085)", panelSolid: "#1F2536",
  chip: "#222838", lagoon: "#2A3146", line: "#3C4663",
  tiffany: "#7C9BFF", aqua: "#A9BEFF", mist: "#A9B1C6", dim: "#717A92", pearl: "#EEF1FA",
  gold: "#FF7A59", champagne: "#FFA58C", amber: "#E8502C", goldTop: "#FFC9B8", tokCore: "#FFF0EA",
  blueTop: "#DCE6FF", blueMid: "#93B0FF", blueBot: "#4C78FF",
  title: "#FFFFFF", page: "#000000",
  // backdrop blobs behind the glass: deliberately muted
  blobs: ["#3A55B8", "#A9573F", "#8A7860", "#5C4FA3"], blobOp: [0.40, 0.30, 0.20, 0.26],
};

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const f1 = (n) => (Math.round(n * 10) / 10).toString();

export const DEFS = `
<linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.goldTop}"/><stop offset=".45" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.amber}"/>
</linearGradient>
<linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.amber}"/><stop offset=".5" stop-color="${C.champagne}"/><stop offset="1" stop-color="${C.gold}"/>
</linearGradient>
<linearGradient id="blueV" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.blueTop}"/><stop offset=".5" stop-color="${C.blueMid}"/><stop offset="1" stop-color="${C.blueBot}"/>
</linearGradient>
<radialGradient id="tok" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="${C.tokCore}" stop-opacity="1"/><stop offset=".35" stop-color="${C.gold}" stop-opacity=".9"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
</radialGradient>`;
