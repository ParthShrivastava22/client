// Original procedural pixel art for mock previews (no third-party art).
export type ArtKind = "tileset" | "sprites" | "ui" | "icons";
export const isArtKind = (k: string): k is ArtKind =>
  ["tileset", "sprites", "ui", "icons"].includes(k);

type Cell = string | null;
type Grid = Cell[][];
type Rnd = () => number;

function rng(seed: number): Rnd {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: Rnd, a: T[]): T => a[Math.floor(r() * a.length)];

const grid = (w: number, h: number, c: Cell): Grid =>
  Array.from({ length: h }, () => Array<Cell>(w).fill(c));
const put = (g: Grid, x: number, y: number, c: Cell) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
};
const rect = (g: Grid, x: number, y: number, w: number, h: number, c: Cell) => {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
};
const blit = (g: Grid, s: Grid, x: number, y: number) =>
  s.forEach((row, j) =>
    row.forEach((c, i) => {
      if (c) put(g, x + i, y + j, c);
    }),
  );

function outline(s: Grid, color: string): Grid {
  const o = s.map((row) => row.slice());
  s.forEach((row, j) =>
    row.forEach((c, i) => {
      if (c) return;
      if (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => s[j + dy]?.[i + dx])
      )
        o[j][i] = color;
    }),
  );
  return o;
}

// One <path> per colour, merging horizontal runs, keeps the SVG small.
function toSvg(g: Grid): string {
  const h = g.length,
    w = g[0].length;
  const paths = new Map<string, string>();
  g.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const c = row[x];
      let n = 1;
      while (x + n < w && row[x + n] === c) n++;
      if (c) paths.set(c, (paths.get(c) ?? "") + `M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  });
  const body = [...paths]
    .map(([c, d]) => `<path fill="${c}" d="${d}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}" shape-rendering="crispEdges">${body}</svg>`;
}

/* ---------- tilesets ---------- */
interface Theme {
  bg: string;
  grass: string[];
  dirt: string[];
  water: string[];
  sand: string[];
  stone: string[];
  leaf: string[];
  trunk: string;
  roof: string[];
  wall: string;
}
const THEMES: Theme[] = [
  {
    bg: "#12141f",
    grass: ["#5fae4e", "#4a9440", "#78c862"],
    dirt: ["#8a5a34", "#744a2a", "#a2704a"],
    water: ["#3b8fd9", "#2d76bd", "#74bdf2"],
    sand: ["#e3c785", "#cfb06d", "#f2dda3"],
    stone: ["#8d93a5", "#747a8e", "#a9afbf"],
    leaf: ["#3f9b46", "#27682f", "#62bf5a"],
    trunk: "#5a3a22",
    roof: ["#c4503c", "#9c3a2c"],
    wall: "#e8d9b5",
  },
  {
    bg: "#17120f",
    grass: ["#a8a23c", "#8b8a30", "#c4b84e"],
    dirt: ["#7a4a2a", "#633b20", "#935c38"],
    water: ["#4a8fb8", "#3a7498", "#7fb8d6"],
    sand: ["#d9b36a", "#c29a52", "#ecca88"],
    stone: ["#8a8478", "#6f6a60", "#a39d90"],
    leaf: ["#d9822b", "#a85a1c", "#f0a840"],
    trunk: "#4a2e1a",
    roof: ["#4a6fa5", "#38567f"],
    wall: "#e6d2a8",
  },
  {
    bg: "#0f1624",
    grass: ["#dfeaf2", "#c5d6e4", "#f4f9fc"],
    dirt: ["#6b5a52", "#5a4a44", "#807066"],
    water: ["#5aa9d6", "#4890bb", "#9fd3ee"],
    sand: ["#cfc3b0", "#b8ab96", "#e2d8c6"],
    stone: ["#7d8aa0", "#667388", "#9aa6ba"],
    leaf: ["#2f6b5a", "#1f4d41", "#4a8c75"],
    trunk: "#4a3426",
    roof: ["#8a3a4a", "#6a2a38"],
    wall: "#d8d0c4",
  },
];

function blob(
  g: Grid,
  r: Rnd,
  x: number,
  y: number,
  w: number,
  h: number,
  pal: string[],
) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const dx = Math.min(i, w - 1 - i),
        dy = Math.min(j, h - 1 - j);
      if (dx + dy < 2) continue; // rounded corners
      const edge = dx === 0 || dy === 0 || dx + dy === 2;
      put(
        g,
        x + i,
        y + j,
        edge ? pal[1] : r() < 0.72 ? pal[0] : pick(r, pal.slice(1)),
      );
    }
}
function tree(g: Grid, r: Rnd, x: number, y: number, t: Theme) {
  for (let j = 0; j < 10; j++)
    for (let i = 0; i < 11; i++) {
      const d = Math.hypot(i - 5, j - 4.5);
      if (d > 5.3) continue;
      put(
        g,
        x + i,
        y + j,
        d > 4.4 ? t.leaf[1] : i + j < 8 && r() < 0.7 ? t.leaf[2] : t.leaf[0],
      );
    }
  rect(g, x + 4, y + 9, 3, 3, t.trunk);
}
function house(g: Grid, x: number, y: number, t: Theme) {
  for (let k = 0; k < 6; k++)
    rect(g, x + 4 - k, y + k, 6 + 2 * k, 1, t.roof[k % 2]);
  rect(g, x + 1, y + 6, 14, 6, t.wall);
  rect(g, x + 6, y + 8, 3, 4, t.trunk);
  rect(g, x + 2, y + 8, 3, 2, "#8fd0f0");
  rect(g, x + 11, y + 8, 3, 2, "#8fd0f0");
}
function rock(g: Grid, x: number, y: number, t: Theme) {
  rect(g, x + 1, y, 6, 1, t.stone[2]);
  rect(g, x, y + 1, 8, 3, t.stone[0]);
  rect(g, x + 1, y + 4, 6, 1, t.stone[1]);
  rect(g, x + 5, y + 2, 3, 2, t.stone[1]);
}
function bush(g: Grid, x: number, y: number, t: Theme) {
  rect(g, x + 1, y, 8, 1, t.leaf[2]);
  rect(g, x, y + 1, 10, 4, t.leaf[0]);
  rect(g, x + 1, y + 5, 8, 1, t.leaf[1]);
  rect(g, x + 6, y + 2, 3, 3, t.leaf[1]);
}
function flowers(g: Grid, r: Rnd, x: number, y: number) {
  for (let k = 0; k < 5; k++) {
    const fx = x + Math.floor(r() * 10),
      fy = y + Math.floor(r() * 6);
    put(g, fx, fy, pick(r, ["#ff6f91", "#ffd447", "#ffffff", "#b197fc"]));
    put(g, fx, fy + 1, "#3f9b46");
  }
}
function tileset(r: Rnd, W: number): Grid {
  const t = pick(r, THEMES),
    g = grid(W, 60, t.bg);
  const terr = [t.grass, t.dirt, t.water, t.sand, t.stone];
  for (let b = 0; b < Math.floor((W - 2) / 28); b++)
    blob(g, r, 2 + b * 28, 2, 24, 24, pick(r, terr));
  for (let row = 0; row < 2; row++)
    for (let c = 0; c < Math.floor((W - 2) / 16); c++) {
      const x = 2 + c * 16,
        y = 30 + row * 16,
        k = r();
      if (k < 0.3) tree(g, r, x + 2, y, t);
      else if (k < 0.45) house(g, x, y, t);
      else if (k < 0.6) rock(g, x + 3, y + 6, t);
      else if (k < 0.75) flowers(g, r, x + 2, y + 6);
      else if (k < 0.85) bush(g, x + 3, y + 4, t);
      else if (k < 0.92) blob(g, r, x, y, 14, 14, pick(r, terr));
    }
  return g;
}

/* ---------- sprite sheets ---------- */
const SKIN = "#f1c27d",
  BOOT = "#2b2233";
function character(
  f: number,
  c: { hair: string; shirt: string; pants: string },
): Grid {
  const d = grid(16, 24, null);
  rect(d, 4, 0, 8, 4, c.hair);
  rect(d, 3, 2, 1, 2, c.hair);
  rect(d, 12, 2, 1, 2, c.hair);
  rect(d, 4, 4, 8, 4, SKIN);
  put(d, 6, 5, "#1b1b2b");
  put(d, 9, 5, "#1b1b2b");
  rect(d, 4, 8, 8, 8, c.shirt);
  rect(d, 4, 13, 8, 1, "#2c2c3c");
  rect(d, 2, 9 + (f % 2), 2, 6, c.shirt);
  rect(d, 12, 9 + ((f + 1) % 2), 2, 6, c.shirt);
  put(d, 2, 15 + (f % 2), SKIN);
  put(d, 13, 15 + ((f + 1) % 2), SKIN);
  const l = f === 1 ? 4 : 6,
    rr = f === 3 ? 4 : 6;
  rect(d, 4, 16, 3, l, c.pants);
  rect(d, 9, 16, 3, rr, c.pants);
  rect(d, 4, 16 + l, 3, 2, BOOT);
  rect(d, 9, 16 + rr, 3, 2, BOOT);
  const s = grid(18, 26, null);
  blit(s, d, 1, 1);
  return outline(s, "#14151f");
}
function sprites(r: Rnd, W: number): Grid {
  const [bg, ground] = pick(r, [
    ["#3d4a5c", "#2b3441"],
    ["#2f3b4a", "#222b36"],
    ["#4a3f55", "#352d3e"],
    ["#33473f", "#25342d"],
  ]);
  const g = grid(W, 40, bg);
  rect(g, 0, 35, W, 5, ground);
  const c = {
    hair: pick(r, ["#5b3a29", "#d9a441", "#c4503c", "#2b2b3a", "#e8e0d0"]),
    shirt: pick(r, ["#3b6fd9", "#c4503c", "#3f9b46", "#8a5acb", "#d9822b"]),
    pants: pick(r, ["#3a3f5c", "#5a4a3a", "#2f4f4f"]),
  };
  for (let i = 0; i < Math.floor((W - 2) / 20); i++)
    blit(g, character(i % 4, c), 3 + i * 20, 10);
  return g;
}

/* ---------- UI kits ---------- */
function button(
  g: Grid,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  rect(g, x, y, w, h, "#0a0c18");
  rect(g, x + 1, y + 1, w - 2, h - 2, c);
  rect(g, x + 1, y + 1, w - 2, 1, "#ffffff88");
  rect(g, x + 1, y + h - 3, w - 2, 2, "#00000055");
}
function bar(
  g: Grid,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
  p: number,
) {
  rect(g, x, y, w, h, "#0a0c18");
  const fill = Math.round((w - 2) * p);
  rect(g, x + 1, y + 1, fill, h - 2, c);
  rect(g, x + 1, y + 1, fill, 1, "#ffffff66");
}
function ui(r: Rnd): Grid {
  const ac = pick(r, ["#ffd447", "#5cb8ff", "#ff7ad9", "#6fd16f"]);
  const g = grid(112, 64, "#1a2038");
  rect(g, 3, 3, 46, 30, ac);
  rect(g, 4, 4, 44, 28, "#0e1224");
  rect(g, 6, 6, 40, 6, ac);
  for (let k = 0; k < 3; k++)
    rect(g, 6, 16 + k * 5, 24 + ((k * 7) % 14), 2, "#3a4268");
  button(g, 54, 4, 26, 10, ac);
  button(g, 54, 17, 26, 10, "#3a4268");
  button(g, 84, 4, 24, 23, "#e0364b");
  bar(g, 54, 30, 54, 6, "#e0364b", 0.4 + r() * 0.6);
  bar(g, 54, 39, 54, 6, "#3b8fd9", 0.3 + r() * 0.7);
  rect(g, 3, 38, 18, 8, "#0e1224");
  rect(g, 4, 39, 8, 6, ac);
  for (let i = 0; i < 8; i++) {
    rect(g, 3 + i * 13, 49, 11, 11, "#0e1224");
    rect(g, 3 + i * 13, 49, 11, 1, "#2a2d45");
    if (r() < 0.6)
      rect(
        g,
        5 + i * 13,
        51,
        7,
        7,
        pick(r, [ac, "#5cb8ff", "#6fd16f", "#ff7ad9", "#e0364b"]),
      );
  }
  return g;
}

/* ---------- icon packs ---------- */
const ICONS = [
  [
    "..oo.oo.",
    "oabooabo",
    "oaaaaaao",
    "oaaaaaco",
    ".oaaaco.",
    "..oaco..",
    "...oo...",
    "........",
  ], // heart
  [
    "..oooo..",
    ".obbaao.",
    "obbaaaco",
    "oaaaaaco",
    ".oaaaco.",
    "..oaco..",
    "...oo...",
    "........",
  ], // gem
  [
    "..oooo..",
    ".obbaao.",
    "obaaaaco",
    "obaooaco",
    "obaooaco",
    "oaaaaaco",
    ".occcco.",
    "..oooo..",
  ], // coin
  [
    "..oooo..",
    "...oo...",
    "...oo...",
    "..obaao.",
    ".obaaaco",
    ".oaaaaco",
    ".occccco",
    "..oooo..",
  ], // potion
  [
    "...oo...",
    "..oaao..",
    "ooobaooo",
    "oaaaaaco",
    ".oaaaco.",
    ".oacaaco",
    ".oo..oo.",
    "........",
  ], // star
];
const RAMPS = [
  ["#3a0d1a", "#e0364b", "#ff8fa3", "#a8203a"],
  ["#10264a", "#3b8fd9", "#9fd3ee", "#245a96"],
  ["#10331a", "#3fae5a", "#9be39f", "#27743a"],
  ["#4a3200", "#ffd447", "#fff1a8", "#c99a00"],
  ["#2c1450", "#8a5acb", "#c9a8f5", "#5b3a9b"],
];
function icons(r: Rnd, cols: number, rows: number): Grid {
  const g = grid(cols * 12 + 2, rows * 12 + 2, "#161a2c");
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = 2 + i * 12,
        y = 2 + j * 12;
      rect(g, x, y, 10, 10, "#0e1224");
      const bitmap = ICONS[(i * 2 + j * 3) % ICONS.length],
        ramp = RAMPS[Math.floor(r() * RAMPS.length)];
      bitmap.forEach((line, py) =>
        [...line].forEach((ch, px) => {
          if (ch !== ".")
            put(g, x + 1 + px, y + 1 + py, ramp["oabc".indexOf(ch)]);
        }),
      );
    }
  return g;
}

/* ---------- public API ---------- */
function layout(kind: ArtKind, r: Rnd): [number, number] {
  if (kind === "tileset") return [pick(r, [96, 112, 128]), 60];
  if (kind === "sprites") return [pick(r, [80, 100, 120]), 40];
  if (kind === "ui") return [112, 64];
  return [pick(r, [6, 7, 8]) * 12 + 2, pick(r, [3, 4]) * 12 + 2];
}
export function artSize(kind: ArtKind, seed: number): [number, number] {
  return layout(kind, rng(seed));
}
export function renderArt(kind: ArtKind, seed: number): string {
  const r = rng(seed);
  const [w, h] = layout(kind, r);
  const g =
    kind === "tileset"
      ? tileset(r, w)
      : kind === "sprites"
        ? sprites(r, w)
        : kind === "ui"
          ? ui(r)
          : icons(r, (w - 2) / 12, (h - 2) / 12);
  return toSvg(g);
}
