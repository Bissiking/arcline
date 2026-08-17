// packages/shared/src/config.ts

export const GAME_CONFIG = {
  maxHp: 100,
  maxPlayerCount: 2,
  angleMin: 0,
  angleMax: 90,
  powerMin: 0,
  powerMax: 100,
  // Équilibrage : arc de 900 px à couvrir. Portée max ≈ S²·P²/g (à 45°).
  // Avec S=10, g=700 : ≈ 1430 px à 100 %, ~915 px à 80 %.
  gravity: 700,
  arrowSpeedScale: 10,
  windMin: -10,
  windMax: 10,
  damage: {
    HEAD: 50,
    BODY: 30,
    LEGS: 20,
  },
} as const;

export type GameConfigDamage = typeof GAME_CONFIG.damage;

export function isValidAngle(angle: number): boolean {
  return (
    angle >= GAME_CONFIG.angleMin &&
    angle <= GAME_CONFIG.angleMax &&
    Number.isFinite(angle)
  );
}

export function isValidPower(power: number): boolean {
  return (
    power >= GAME_CONFIG.powerMin &&
    power <= GAME_CONFIG.powerMax &&
    Number.isFinite(power)
  );
}

/** Vent généré par tour, entier dans [windMin, windMax]. Positif = vers la droite. */
export function generateWind(): number {
  return (
    GAME_CONFIG.windMin +
    Math.round(Math.random() * (GAME_CONFIG.windMax - GAME_CONFIG.windMin))
  );
}