// packages/shared/src/bot.ts
// IA simple du mode Solo : choisit angle + puissance (stratégie + bruit).

import { GAME_CONFIG } from "./config.js";
import type { ShotParams } from "./game-types.js";

const BASE_ANGLE = 45;
const ANGLE_NOISE = 6;
const POWER_NOISE = 10;

/** Puissance nécessaire pour atteindre `distance` à un angle donné. */
export function powerForDistance(
  distance: number,
  angle: number,
  gravity: number = GAME_CONFIG.gravity,
): number {
  const rad = (angle * Math.PI) / 180;
  const sin2 = Math.sin(2 * rad);
  if (sin2 <= 1e-6) return GAME_CONFIG.powerMax;
  const kg = gravity / GAME_CONFIG.arrowSpeedScale ** 2;
  const pSq = (distance * kg) / sin2;
  return clamp(
    Math.sqrt(Math.max(pSq, 0)),
    GAME_CONFIG.powerMin,
    GAME_CONFIG.powerMax,
  );
}

export function chooseBotShot(
  distance: number,
  rng: () => number = Math.random,
  gravity: number = GAME_CONFIG.gravity,
): ShotParams {
  const angle = clamp(
    BASE_ANGLE + (rng() - 0.5) * ANGLE_NOISE,
    GAME_CONFIG.angleMin,
    GAME_CONFIG.angleMax,
  );
  const power = clamp(
    powerForDistance(distance, angle, gravity) + (rng() - 0.5) * POWER_NOISE,
    GAME_CONFIG.powerMin,
    GAME_CONFIG.powerMax,
  );
  return { angle, power };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}