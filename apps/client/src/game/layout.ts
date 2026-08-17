// apps/client/src/game/layout.ts
// Constantes de layout du monde (Dimensions, sol, positions des joueurs).

export const WORLD = {
  width: 1280,
  height: 720,
} as const;

export const GROUND_Y = 640;
export const GROUND_THICKNESS = 80;
export const GROUND_EDGE = 128;

/** Abscisse des pieds de l'archer joueur (au niveau du sol). */
export const PLAYER_FEET_X = {
  left: 190,
} as const;

/** Intervalle de placement du bot : toujours dans la portée d'un tir max. */
export const BOT_FEET_X = {
  min: 920,
  max: 1160,
} as const;

/** Position des pieds du bot, tirée dans l'intervalle de portée. */
export function randomBotFeetX(rng: () => number = Math.random): number {
  const range = BOT_FEET_X.max - BOT_FEET_X.min;
  return BOT_FEET_X.min + Math.round(rng() * range);
}

export const ARCHER_HEIGHT = 118;

export const SIDE_LABEL = {
  left: "Vous",
  right: "IA",
} as const;