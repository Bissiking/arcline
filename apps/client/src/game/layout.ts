// apps/client/src/game/layout.ts
// Constantes de layout du monde (Dimensions, sol, positions des joueurs).

/** Zone visible à l'écran (résolution du canvas, caméra 1:1). */
export const VIEWPORT = {
  width: 1280,
  height: 720,
} as const;

/** Monde réel (plus large que l'écran) : la caméra défile dedans. */
export const WORLD = {
  width: 2560,
  height: 720,
} as const;

export const GROUND_Y = 640;
export const GROUND_THICKNESS = 80;
export const GROUND_EDGE = 128;

/** Abscisse des pieds de l'archer joueur (au niveau du sol). */
export const PLAYER_FEET_X = {
  left: 190,
} as const;

/**
 * Intervalle de placement du bot : parfois hors écran, toujours atteignable.
 * La gravité effective est adaptée à la distance (l'atteignabilité reste donc
 * garantie même à l'extrémité droite du monde).
 */
export const BOT_FEET_X = {
  min: 1100,
  max: 2500,
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