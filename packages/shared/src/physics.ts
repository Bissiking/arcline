// packages/shared/src/physics.ts
// Physique balistique pure (testable, indépendante du rendu).

import { GAME_CONFIG } from "./config.js";

export interface TrajectoryPoint {
  x: number;
  y: number;
  t: number;
}

export interface BallisticInput {
  angle: number;
  power: number;
  wind: number;
  dt?: number;
  maxSteps?: number;
  /** Gravité (px/s²). Défaut : GAME_CONFIG.gravity. */
  gravity?: number;
}

export interface TrajectoryInput extends BallisticInput {
  /** Distance positive vers le bas : fin du vol quand y > groundBelow. */
  groundBelow?: number;
  /** Bornes horizontales (relatives au lancement) : arrêt si dépassées. */
  boundsX?: { min: number; max: number };
}

export interface BallisticState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function initialVelocity(angle: number, power: number): { vx: number; vy: number } {
  const radians = (angle * Math.PI) / 180;
  const speed = power * GAME_CONFIG.arrowSpeedScale;
  return {
    vx: Math.cos(radians) * speed,
    vy: -Math.sin(radians) * speed,
  };
}

export function simulateTrajectory(input: TrajectoryInput): TrajectoryPoint[] {
  const dt = input.dt ?? 1 / 60;
  const maxSteps = input.maxSteps ?? 600;
  const groundBelow = input.groundBelow ?? 0;
  const gravity = input.gravity ?? GAME_CONFIG.gravity;

  const { vx, vy } = initialVelocity(input.angle, input.power);
  const points: TrajectoryPoint[] = [{ x: 0, y: 0, t: 0 }];
  let x = 0;
  let y = 0;
  let vxNow = vx;
  let vyNow = vy;

  for (let step = 1; step <= maxSteps; step += 1) {
    vyNow += gravity * dt;
    vxNow += input.wind * dt;
    x += vxNow * dt;
    y += vyNow * dt;
    points.push({ x, y, t: step * dt });
    if (y > groundBelow) break;
    if (input.boundsX && (x < input.boundsX.min || x > input.boundsX.max)) break;
  }

  return points;
}

/** Portée max théorique (100 % de puissance, angle 45°) pour une gravité donnée. */
export function maxRange(
  gravity: number,
  speedScale: number = GAME_CONFIG.arrowSpeedScale,
): number {
  return (GAME_CONFIG.powerMax * speedScale) ** 2 / gravity;
}

/** Gravité maximale autorisée pour que `distance` reste atteignable (avec marge). */
export function reachableGravity(
  distance: number,
  margin: number = 1.15,
  speedScale: number = GAME_CONFIG.arrowSpeedScale,
): number {
  const usableDistance = Math.max(distance, 1) * margin;
  return (GAME_CONFIG.powerMax * speedScale) ** 2 / usableDistance;
}

export function stepTrajectory(
  state: BallisticState,
  wind: number,
  dt: number,
  gravity: number = GAME_CONFIG.gravity,
): BallisticState {
  const vy = state.vy + gravity * dt;
  const vx = state.vx + wind * dt;
  return {
    x: state.x + vx * dt,
    y: state.y + vy * dt,
    vx,
    vy,
  };
}