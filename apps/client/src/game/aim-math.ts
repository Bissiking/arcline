// apps/client/src/game/aim-math.ts
// Mathématiques de visée pures (sans Phaser) : angle 0–90° + puissance 0–100.
// On clique puis on drag vers la direction du tir : la puissance vient de la
// distance de drag (depuis le premier clic), l'angle de la direction du drag.

import { GAME_CONFIG } from "@arcline/shared";

export const AIM = {
  /** Hauteur de l'origine du tir au-dessus des pieds (épaules). */
  originHeight: 62,
  /** Distance de drag (px) correspondant à 100 % de puissance. */
  powerDistance: 250,
  /** Puissance minimale sous laquelle un clic n'est pas un tir. */
  minPower: 3,
} as const;

export interface AimPoint {
  angle: number;
  power: number;
}

export function computeAim(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  powerDistance: number = AIM.powerDistance,
): AimPoint {
  const forward = Math.max(currentX - startX, 0);
  const lift = Math.max(startY - currentY, 0);
  const angle = clamp(
    Math.atan2(lift, forward) * (180 / Math.PI),
    0,
    GAME_CONFIG.angleMax,
  );
  const distance = Math.hypot(currentX - startX, currentY - startY);
  const power = clamp(
    (distance / powerDistance) * 100,
    0,
    GAME_CONFIG.powerMax,
  );
  return { angle, power };
}

export function isValidAngle(angle: number): boolean {
  return Number.isFinite(angle) && angle >= 0 && angle <= GAME_CONFIG.angleMax;
}

export function isValidPower(power: number): boolean {
  return Number.isFinite(power) && power >= 0 && power <= GAME_CONFIG.powerMax;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}