// packages/shared/src/config.ts

export const GAME_CONFIG = {
  maxHp: 100,
  maxPlayerCount: 2,
  angleMin: 0,
  angleMax: 90,
  powerMin: 0,
  powerMax: 100,
  gravity: 1200,
  arrowSpeedScale: 7,
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