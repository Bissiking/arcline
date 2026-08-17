// packages/shared/src/hitbox.ts
// Hitboxes HEAD / BODY / LEGS : géométrie relative aux pieds de l'archer
// (utilisable telle quelle côté client en solo et côté serveur en V2).

import type { BodyPart } from "./game-types.js";

export interface HitboxRect {
  part: BodyPart;
  /** Centre vertical, en pixels au-dessus du sol (pieds). */
  yFromGround: number;
  halfHeight: number;
  /** Demi-largeur horizontale depuis le centre de l'archer. */
  halfWidth: number;
}

export const ARCHER_HITBOXES: readonly HitboxRect[] = [
  { part: "LEGS", yFromGround: 18, halfHeight: 18, halfWidth: 10 },
  { part: "BODY", yFromGround: 60, halfHeight: 24, halfWidth: 14 },
  { part: "HEAD", yFromGround: 101, halfHeight: 17, halfWidth: 11 },
] as const;

export function hitBodyPart(
  hitboxes: readonly HitboxRect[],
  xFromCenter: number,
  yFromGround: number,
): BodyPart | null {
  for (const hb of hitboxes) {
    if (
      Math.abs(xFromCenter) <= hb.halfWidth &&
      Math.abs(yFromGround - hb.yFromGround) <= hb.halfHeight
    ) {
      return hb.part;
    }
  }
  return null;
}

/** Résout la partie du corps touchée par un impact en coordonnées monde. */
export function resolveBodyPart(
  hitboxes: readonly HitboxRect[],
  x: number,
  y: number,
  feetX: number,
  feetY: number,
): BodyPart | null {
  return hitBodyPart(hitboxes, x - feetX, feetY - y);
}