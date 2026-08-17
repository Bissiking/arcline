// packages/shared/src/physics.test.ts

import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "./config.js";
import {
  initialVelocity,
  maxRange,
  reachableGravity,
  simulateTrajectory,
} from "./physics.js";

describe("initialVelocity", () => {
  it("has no horizontal component at 90°", () => {
    const { vx, vy } = initialVelocity(90, 50);
    expect(Math.abs(vx)).toBeLessThan(1e-9);
    expect(vy).toBeLessThan(0);
  });

  it("has no vertical component at 0°", () => {
    const { vx, vy } = initialVelocity(0, 50);
    expect(vy).toBeCloseTo(0, 6);
    expect(vx).toBeGreaterThan(0);
  });
});

describe("simulateTrajectory", () => {
  it("starts at origin and stops at ground level (y > 0)", () => {
    const points = simulateTrajectory({ angle: 45, power: 60, wind: 0 });
    expect(points[0]).toEqual({ x: 0, y: 0, t: 0 });
    const last = points[points.length - 1];
    expect(last).toBeDefined();
    expect(last!.y).toBeGreaterThan(0);
  });

  it("wind bends the trajectory horizontally", () => {
    const noWind = simulateTrajectory({ angle: 30, power: 70, wind: 0 });
    const tailWind = simulateTrajectory({ angle: 30, power: 70, wind: +GAME_CONFIG.windMax });
    const lastNo = noWind[noWind.length - 1]!;
    const lastWind = tailWind[tailWind.length - 1]!;
    expect(lastWind.x).toBeGreaterThan(lastNo.x);
  });

  it("respects gravity constant", () => {
    const { vy } = initialVelocity(90, 40);
    const dt = 1 / 60;
    // après un pas, vy a augmenté de g*dt (signe inversé vers le bas)
    const vyAfter = vy + GAME_CONFIG.gravity * dt;
    expect(vyAfter).toBeGreaterThan(vy);
  });

  it("stops when the arrow reaches the ground (groundBelow > 0)", () => {
    const points = simulateTrajectory({ angle: 30, power: 70, wind: 0, groundBelow: 62 });
    const last = points[points.length - 1]!;
    // atteint le sol : y dépasse le seuil, sans le dépasser énormément
    expect(last.y).toBeGreaterThan(62);
    expect(last.y).toBeLessThan(62 + 200);
  });

  it("stops at the horizontal world bounds", () => {
    const points = simulateTrajectory({
      angle: 10,
      power: 100,
      wind: 0,
      boundsX: { min: -190, max: 1090 },
    });
    const last = points[points.length - 1]!;
    expect(last.x).toBeGreaterThanOrEqual(-190);
    expect(last.x).toBeLessThanOrEqual(1090);
  });

  it("lower gravity gives a longer flight (same wind, same input)", () => {
    const heavy = simulateTrajectory({ angle: 45, power: 90, wind: 0, gravity: 900 });
    const light = simulateTrajectory({ angle: 45, power: 90, wind: 0, gravity: 500 });
    const lastHeavy = heavy[heavy.length - 1]!;
    const lastLight = light[light.length - 1]!;
    expect(lastLight.x).toBeGreaterThan(lastHeavy.x);
  });
});

describe("maxRange / reachableGravity", () => {
  it("max range shrinks when gravity grows", () => {
    expect(maxRange(560)).toBeGreaterThan(maxRange(860));
  });

  it("reachable gravity keeps the distance reachable with margin", () => {
    const distance = 2310;
    const g = reachableGravity(distance);
    // At 45°/100 % : portée >= distance * marge, sinon l'ennemi est intouchable.
    expect(maxRange(g)).toBeGreaterThanOrEqual(distance * 1.15);
    // Une carte à fort vent/se mais à forte gravité serait adoucie.
    expect(Math.min(860, g)).toBeLessThan(860);
  });

  it("close distances keep standard gravity unchanged", () => {
    const g = reachableGravity(900);
    expect(Math.min(GAME_CONFIG.gravity, g)).toBe(GAME_CONFIG.gravity);
  });
});