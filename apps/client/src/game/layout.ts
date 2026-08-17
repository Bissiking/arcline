// apps/client/src/game/layout.ts
// Constantes de layout du monde (Dimensions, sol, positions des joueurs).

export const WORLD = {
  width: 1280,
  height: 720,
} as const;

export const GROUND_Y = 640;
export const GROUND_THICKNESS = 80;
export const GROUND_EDGE = 128;

/** Abscisse des pieds de chaque archer (au niveau du sol). */
export const PLAYER_FEET_X = {
  left: 190,
  right: 1090,
} as const;

export const ARCHER_HEIGHT = 118;

export const SIDE_LABEL = {
  left: "Vous",
  right: "IA",
} as const;