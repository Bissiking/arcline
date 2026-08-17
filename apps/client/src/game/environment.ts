// apps/client/src/game/environment.ts
// Thèmes de monde (cartes). Un thème décrit entièrement le rendu d'une carte
// : ciel, soleil, nuages, montagnes, collines, sol, flore — plus une gravité
// propre qui change la trajectoire des flèches. Une carte est tirée au sort
// à chaque partie.

export interface Hill {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

export interface Daisy {
  x: number;
}

export interface Environment {
  key: string;
  name: string;
  /** Gravité de la carte (px/s²) — portée et courbure des flèches. */
  gravity: number;
  sky: { top: string; mid: string; horizon: string };
  sun: { x: number; y: number; core: number };
  clouds: readonly Cloud[];
  mountains: readonly Hill[];
  hillsFar: readonly Hill[];
  hillsNear: readonly Hill[];
  ground: { top: string; surface: string; body: string; edge: string };
  grass: string;
  daisies: readonly Daisy[];
}

export const ENVIRONMENTS: readonly Environment[] = [
  {
    key: "prairie-dawn",
    name: "Prairie à l'aube",
    gravity: 700,
    sky: { top: "#3f76c9", mid: "#6fa8e0", horizon: "#ffe9b3" },
    sun: { x: 1010, y: 232, core: 44 },
    clouds: [
      { x: 240, y: 120, scale: 1, alpha: 0.95 },
      { x: 560, y: 76, scale: 0.75, alpha: 0.9 },
      { x: 350, y: 210, scale: 0.5, alpha: 0.7 },
      { x: 800, y: 150, scale: 0.6, alpha: 0.85 },
    ],
    mountains: [
      { x: 240, y: 640, w: 640, h: 170 },
      { x: 720, y: 640, w: 520, h: 130 },
    ],
    hillsFar: [
      { x: 160, y: 640, w: 780, h: 250 },
      { x: 700, y: 640, w: 900, h: 300 },
    ],
    hillsNear: [
      { x: -60, y: 640, w: 560, h: 200 },
      { x: 500, y: 640, w: 460, h: 150 },
      { x: 920, y: 640, w: 720, h: 230 },
    ],
    ground: {
      top: "#93c265",
      surface: "#7aa94e",
      body: "#5c8540",
      edge: "#466b31",
    },
    grass: "#3f6b2c",
    daisies: [{ x: 340 }, { x: 520 }, { x: 640 }, { x: 780 }, { x: 1180 }],
  },
  {
    key: "twilight-canyon",
    name: "Canyon crépusculaire",
    gravity: 860,
    sky: { top: "#2a2a4a", mid: "#5c3d6e", horizon: "#e07b4a" },
    sun: { x: 300, y: 180, core: 30 },
    clouds: [
      { x: 420, y: 100, scale: 1.05, alpha: 0.5 },
      { x: 760, y: 150, scale: 0.7, alpha: 0.45 },
      { x: 240, y: 260, scale: 0.45, alpha: 0.35 },
    ],
    mountains: [
      { x: 140, y: 640, w: 900, h: 300 },
      { x: 820, y: 640, w: 640, h: 240 },
    ],
    hillsFar: [
      { x: 200, y: 640, w: 1000, h: 340 },
      { x: 700, y: 640, w: 620, h: 280 },
    ],
    hillsNear: [
      { x: -80, y: 640, w: 600, h: 220 },
      { x: 520, y: 640, w: 480, h: 170 },
      { x: 980, y: 640, w: 700, h: 250 },
    ],
    ground: {
      top: "#b5794a",
      surface: "#95613a",
      body: "#6e452c",
      edge: "#4c2f22",
    },
    grass: "#5a3a2a",
    daisies: [{ x: 300 }, { x: 700 }, { x: 980 }],
  },
  {
    key: "highland-breeze",
    name: "Hauts plateaux venteux",
    gravity: 560,
    sky: { top: "#4a7fd0", mid: "#8fc0ec", horizon: "#eef6ff" },
    sun: { x: 960, y: 160, core: 38 },
    clouds: [
      { x: 200, y: 90, scale: 1.1, alpha: 0.9 },
      { x: 640, y: 140, scale: 0.85, alpha: 0.85 },
      { x: 900, y: 220, scale: 0.55, alpha: 0.7 },
    ],
    mountains: [
      { x: 480, y: 640, w: 1000, h: 280 },
      { x: 100, y: 640, w: 640, h: 210 },
    ],
    hillsFar: [
      { x: 100, y: 640, w: 720, h: 220 },
      { x: 640, y: 640, w: 860, h: 260 },
    ],
    hillsNear: [
      { x: -40, y: 640, w: 520, h: 180 },
      { x: 640, y: 640, w: 520, h: 160 },
    ],
    ground: {
      top: "#a7c66a",
      surface: "#7fad52",
      body: "#5f8a3e",
      edge: "#44652c",
    },
    grass: "#4c732f",
    daisies: [{ x: 440 }, { x: 620 }, { x: 900 }, { x: 1100 }],
  },
] as const;

export function getEnvironment(key: string): Environment {
  return ENVIRONMENTS.find((e) => e.key === key) ?? ENVIRONMENTS[0]!;
}

/** Tire une carte au sort (montre une nouvelle gravité à chaque partie). */
export function pickEnvironment(rng: () => number = Math.random): Environment {
  const index = Math.floor(rng() * ENVIRONMENTS.length);
  return ENVIRONMENTS[Math.min(index, ENVIRONMENTS.length - 1)]!;
}