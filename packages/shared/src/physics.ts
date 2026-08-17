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

export function simulateTrajectory(input: BallisticInput): TrajectoryPoint[] {
  const dt = input.dt ?? 1 / 60;
  const maxSteps = input.maxSteps ?? 600;

  const { vx, vy } = initialVelocity(input.angle, input.power);
  const points: TrajectoryPoint[] = [{ x: 0, y: 0, t: 0 }];
  let x = 0;
  let y = 0;
  let vxNow = vx;
  let vyNow = vy;

  for (let step = 1; step <= maxSteps; step += 1) {
    vyNow += GAME_CONFIG.gravity * dt;
    vxNow += input.wind * dt;
    x += vxNow * dt;
    y += vyNow * dt;
    points.push({ x, y, t: step * dt });
    if (y > 0) break;
  }

  return points;
}

export function stepTrajectory(state: BallisticState, wind: number, dt: number): BallisticState {
  const vy = state.vy + GAME_CONFIG.gravity * dt;
  const vx = state.vx + wind * dt;
  return {
    x: state.x + vx * dt,
    y: state.y + vy * dt,
    vx,
    vy,
  };
}